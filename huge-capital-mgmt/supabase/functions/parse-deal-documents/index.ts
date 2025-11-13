import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface ExtractedDealData {
  deal: {
    legal_business_name: string;
    dba_name: string | null;
    ein: string | null;
    business_type: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    phone: string | null;
    website: string | null;
    franchise_business: boolean;
    seasonal_business: boolean;
    peak_sales_month: string | null;
    business_start_date: string | null;
    product_service_sold: string | null;
    franchise_units_percent: number | null;
    average_monthly_sales: number | null;
    average_monthly_card_sales: number | null;
    desired_loan_amount: number | null;
    reason_for_loan: string | null;
    loan_type: 'MCA' | 'Business LOC' | null;
  };
  owners: Array<{
    owner_number: 1 | 2;
    full_name: string;
    street_address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    phone: string | null;
    email: string | null;
    ownership_percent: number | null;
    drivers_license_number: string | null;
    date_of_birth: string | null;
  }>;
  statements: Array<{
    statement_id: string;
    bank_name: string;
    statement_month: string;
    credits: number | null;
    debits: number | null;
    nsfs: number;
    overdrafts: number;
    average_daily_balance: number | null;
    deposit_count: number | null;
  }>;
  fundingPositions: Array<{
    lender_name: string;
    amount: number;
    frequency: 'daily' | 'weekly' | 'monthly';
    detected_dates: string[];
  }>;
  confidence: {
    deal: number;
    owners: number[];
    statements: number[];
  };
  missingFields: string[];
  warnings: string[];
  documentsFolder?: {
    id: string;
    name: string;
    webViewLink: string;
    files: Array<{
      id: string;
      name: string;
      mimeType: string;
      webViewLink: string;
    }>;
  };
}

const GOOGLE_DRIVE_PARENT_FOLDER_ID = Deno.env.get('GOOGLE_DRIVE_PARENT_FOLDER_ID') ?? null;
const GOOGLE_SERVICE_ACCOUNT_JSON = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON') ?? null;
const GOOGLE_DRIVE_IMPERSONATED_USER = Deno.env.get('GOOGLE_DRIVE_IMPERSONATED_USER') ?? null;

function base64ToUint8Array(base64: string): Uint8Array {
  const cleaned = base64.replace(/^data:.*;base64,/, '').replace(/[\r\n\s]/g, '');
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function sanitizeDriveName(input: string): string {
  return (input || 'Deal Upload')
    .replace(/[\\/:*?"<>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150) || 'Deal Upload';
}

function formatFolderName(businessName: string | null | undefined, uploadedAt: Date): string {
  const datePart = uploadedAt.toISOString().split('T')[0];
  const namePart = sanitizeDriveName(businessName ?? 'Deal Upload');
  return `${namePart} - ${datePart}`;
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlEncodeObject(obj: Record<string, unknown>): string {
  const json = JSON.stringify(obj);
  return base64UrlEncodeBytes(new TextEncoder().encode(json));
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const cleaned = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '');
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function importGooglePrivateKey(privateKeyPem: string): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(privateKeyPem),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign'],
  );
}

async function createGoogleAccessToken(
  serviceAccount: any,
  scope: string,
  impersonatedUser?: string | null,
): Promise<{ token: string; expiresAt: number }> {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const payload: Record<string, unknown> = {
    iss: serviceAccount.client_email,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  if (impersonatedUser) {
    payload.sub = impersonatedUser;
  }

  const unsignedToken = `${base64UrlEncodeObject(header)}.${base64UrlEncodeObject(payload)}`;
  const privateKey = await importGooglePrivateKey(serviceAccount.private_key);
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(unsignedToken),
  );
  const signedJwt = `${unsignedToken}.${base64UrlEncodeBytes(new Uint8Array(signature))}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: signedJwt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to obtain Google access token: ${errorText}`);
  }

  const tokenData = await response.json();
  return {
    token: tokenData.access_token,
    expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
  };
}

function tryParseServiceAccount(raw: string | null): any | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    try {
      const decoded = new TextDecoder().decode(base64ToUint8Array(trimmed));
      return JSON.parse(decoded);
    } catch (innerError) {
      console.error('Failed to parse Google service account JSON:', innerError);
      throw error;
    }
  }
}

async function uploadFileToDrive(
  token: string,
  folderId: string,
  fileName: string,
  mimeType: string,
  bytes: Uint8Array,
): Promise<{ id: string; name: string; mimeType: string; webViewLink: string } | null> {
  try {
    const metadata = {
      name: sanitizeDriveName(fileName),
      mimeType,
      parents: [folderId],
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([bytes], { type: mimeType || 'application/octet-stream' }), fileName);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Drive upload failed:', errorText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to upload document to Google Drive:', error);
    return null;
  }
}

async function createDriveFolder(
  token: string,
  parentFolderId: string,
  folderName: string,
): Promise<{ id: string; name: string; webViewLink: string } | null> {
  try {
    const response = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: sanitizeDriveName(folderName),
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Drive folder creation failed:', errorText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to create Google Drive folder:', error);
    return null;
  }
}

async function extractTextFromPdf(
  fileName: string,
  bytes: Uint8Array,
  openAiKey: string,
): Promise<string | null> {
  try {
    const uploadForm = new FormData();
    uploadForm.append('purpose', 'assistants');
    uploadForm.append('file', new Blob([bytes], { type: 'application/pdf' }), fileName);

    const uploadResponse = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiKey}`,
      },
      body: uploadForm,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Failed to upload PDF to OpenAI:', errorText);
      return null;
    }

    const uploadedFile = await uploadResponse.json();
    const fileId = uploadedFile.id;

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text: 'You are a document parser that extracts the raw textual content from PDF files. Return only the literal text without commentary.',
              },
            ],
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: `Extract the text from the attached PDF: ${fileName}`,
              },
              {
                type: 'input_file',
                file_id: fileId,
              },
            ],
          },
        ],
        max_output_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to extract PDF text with OpenAI:', errorText);
      return null;
    }

    const responseData = await response.json();
    const textChunks: string[] = [];
    if (Array.isArray(responseData.output)) {
      for (const output of responseData.output) {
        if (Array.isArray(output.content)) {
          for (const contentItem of output.content) {
            if (contentItem.type === 'output_text' && contentItem.text) {
              textChunks.push(contentItem.text);
            }
          }
        }
      }
    }

    // Clean up uploaded file asynchronously
    fetch(`https://api.openai.com/v1/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${openAiKey}`,
      },
    }).catch((cleanupError) => console.error('Failed to delete OpenAI file:', cleanupError));

    return textChunks.join('\n').trim() || null;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return null;
  }
}

async function logAgentRun(
  supabase: any,
  entry: Record<string, any>
): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('agent_run_logs')
      .insert(entry)
      .select('id')
      .single();
    if (error) {
      console.error('Failed to log agent run:', error);
      return null;
    }
    return data?.id ?? null;
  } catch (err) {
    console.error('Failed to log agent run:', err);
    return null;
  }
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
      },
    });
  }

  const startTime = performance.now();
  let supabaseAdmin: any = null;
  let userId: string | null = null;
  let requestPayload: Record<string, any> | null = null;
  let requestSummary = '';
  let logId: string | null = null;
  const originalDocuments: Array<{ name: string; type: string; base64: string; bytes: Uint8Array }>
    = [];
  const documentWarnings: string[] = [];

  try {
    const requestBody = await req.json();
    const files = requestBody.files || requestBody.fileUrls;

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    supabaseAdmin =
      SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
        ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        : null;

    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (supabaseAdmin && authHeader?.toLowerCase().startsWith('bearer ')) {
      try {
        const token = authHeader.replace(/^Bearer\s+/i, '');
        const {
          data: { user },
        } = await supabaseAdmin.auth.getUser(token);
        userId = user?.id ?? null;
      } catch (authError) {
        console.error('Failed to resolve auth user for logging:', authError);
      }
    }

    // Support both base64 files and URLs
    if (!files) {
      return new Response(
        JSON.stringify({ error: 'Either files (base64) or fileUrls are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const sanitizedFiles = Array.isArray(files)
      ? files.map((file: any) => {
          if (typeof file === 'string') {
            return { url: file };
          }
          return {
            name: file.name,
            type: file.type,
            size_bytes: typeof file.content === 'string' ? Math.floor((file.content.length * 3) / 4) : null,
          };
        })
      : [];

    requestPayload = {
      files: sanitizedFiles,
      source: requestBody.files ? 'base64' : 'url',
    };

    requestSummary = sanitizedFiles.length
      ? sanitizedFiles
          .map((file: any) => file.name || file.url || 'file')
          .slice(0, 5)
          .join(', ')
      : 'No files provided';

    // Helper to persist documents to Google Drive after extraction
    const persistDocumentsToDrive = async (extracted: ExtractedDealData) => {
      if (!GOOGLE_SERVICE_ACCOUNT_JSON || !GOOGLE_DRIVE_PARENT_FOLDER_ID || originalDocuments.length === 0) {
        return;
      }

      try {
        const serviceAccount = tryParseServiceAccount(GOOGLE_SERVICE_ACCOUNT_JSON);
        if (!serviceAccount) {
          throw new Error('Google service account configuration missing or invalid');
        }

        const { token } = await createGoogleAccessToken(
          serviceAccount,
          'https://www.googleapis.com/auth/drive',
          GOOGLE_DRIVE_IMPERSONATED_USER,
        );

        const folderName = formatFolderName(
          (extracted.deal && 'legal_business_name' in extracted.deal)
            ? extracted.deal.legal_business_name
            : null,
          new Date(),
        );

        const folder = await createDriveFolder(token, GOOGLE_DRIVE_PARENT_FOLDER_ID, folderName);
        if (!folder) {
          extracted.warnings = Array.from(new Set([
            ...(extracted.warnings || []),
            'Unable to create Google Drive folder for uploaded documents.',
          ]));
          return;
        }

        const uploadedFiles: Array<{ id: string; name: string; mimeType: string; webViewLink: string }> = [];
        for (const doc of originalDocuments) {
          if (!doc || doc.bytes.length === 0) {
            continue;
          }
          const uploaded = await uploadFileToDrive(token, folder.id, doc.name, doc.type, doc.bytes);
          if (uploaded) {
            uploadedFiles.push(uploaded);
          }
        }

        extracted.documentsFolder = {
          id: folder.id,
          name: folder.name,
          webViewLink: folder.webViewLink,
          files: uploadedFiles,
        };
      } catch (driveError) {
        console.error('Google Drive integration error:', driveError);
        extracted.warnings = Array.from(new Set([
          ...(extracted.warnings || []),
          'Failed to store documents in Google Drive. Please upload manually.',
        ]));
      }
    };

    // Get API keys from environment (check at runtime, not at module load)
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

    // Prefer OpenAI if available (supports more file types), fallback to Claude
    if (OPENAI_API_KEY) {
      console.log('OPENAI_API_KEY found, calling OpenAI API');

      const systemPrompt = `You are an expert financial document analyzer for a business lending company. Extract structured business and financial information from application documents, bank statements, and tax returns.

Extract ONLY the following fields and return valid JSON:
1. Deal information: legal_business_name, dba_name, ein, business_type, address, city, state, zip, phone, website, franchise_business, seasonal_business, peak_sales_month, business_start_date, product_service_sold, franchise_units_percent, average_monthly_sales, average_monthly_card_sales, desired_loan_amount, reason_for_loan, loan_type (MCA or Business LOC)
2. Owners (1-2): owner_number, full_name, street_address, city, state, zip, phone, email, ownership_percent, drivers_license_number, date_of_birth
3. Bank statements: statement_id, bank_name, statement_month (YYYY-MM), credits, debits, nsfs, overdrafts, average_daily_balance, deposit_count
4. Funding positions: lender_name, amount, frequency (daily/weekly/monthly), detected_dates
5. Confidence scores (0-100) for deal, owners, statements
6. Missing fields and warnings

Return ONLY valid JSON matching this structure exactly.`;

      // Build message content for OpenAI API
      const messageContent: any[] = [];

      // Process each file
      if (Array.isArray(files)) {
        for (const file of files) {
          if (typeof file === 'string') {
            continue;
          }

          const { name, content, type } = file;
          const fileName = name || 'Document';
          const mimeType = typeof type === 'string' ? type : 'application/octet-stream';
          const base64Content = typeof content === 'string' ? content : '';
          const bytes = base64Content ? base64ToUint8Array(base64Content) : new Uint8Array();

          originalDocuments.push({
            name: fileName,
            type: mimeType,
            base64: base64Content,
            bytes,
          });

          if (mimeType.toLowerCase().includes('pdf')) {
            if (bytes.length === 0) {
              documentWarnings.push(`The file ${fileName} appears to be empty and could not be processed.`);
              continue;
            }

            const extracted = await extractTextFromPdf(
              `${fileName}`.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`,
              bytes,
              OPENAI_API_KEY,
            );
            if (extracted) {
              messageContent.push({
                type: 'text',
                text: `\n--- ${fileName} (PDF extracted text) ---\n${extracted.substring(0, 50000)}`,
              });
            } else {
              console.warn(`Failed to extract text from PDF: ${fileName}`);
              documentWarnings.push(`Could not automatically extract data from ${fileName}. Please review this PDF manually.`);
            }
          } else if (mimeType.includes('image')) {
            messageContent.push({
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Content}`,
              },
            });
          } else if (mimeType.includes('text') || mimeType.includes('csv')) {
            try {
              const decoded = atob(base64Content);
              messageContent.push({
                type: 'text',
                text: `\n--- ${fileName} ---\n${decoded.substring(0, 50000)}`,
              });
            } catch {
              messageContent.push({
                type: 'text',
                text: `\n--- ${fileName} ---\n${base64Content.substring(0, 50000)}`,
              });
            }
          } else {
            messageContent.push({
              type: 'text',
              text: `\n--- ${fileName} (${mimeType}) ---\n[File type: ${mimeType}]`,
            });
          }
        }
      }

      // Add the extraction instruction
      messageContent.unshift({
        type: 'text',
        text: 'Extract business and financial information from these documents and return structured JSON data.'
      });

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o', // Latest OpenAI multimodal model that handles both text and images
            max_tokens: 4096,
            messages: [
              {
                role: 'system',
                content: systemPrompt
              },
              {
                role: 'user',
                content: messageContent
              }
            ],
            response_format: { type: "json_object" } // Force JSON response
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('OpenAI API error:', errorText);
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        let content = data.choices[0].message.content;

        // Extract JSON from content (might be wrapped in markdown code blocks or have text before it)
        let jsonStr = content;

        // First try to extract from markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1];
        }

        // If content starts with text, find where JSON starts (look for { or [)
        if (!jsonStr.trim().startsWith('{') && !jsonStr.trim().startsWith('[')) {
          const jsonStart = jsonStr.search(/[\{\[]/);
          if (jsonStart !== -1) {
            jsonStr = jsonStr.substring(jsonStart);
          }
        }

        // Parse the API response
        const parsed = JSON.parse(jsonStr);

        // Normalize the response format to match ExtractedDealData interface
        // API may return deal_information, bank_statements, etc.
        const extracted: ExtractedDealData = {
          deal: parsed.deal || parsed.deal_information || {},
          owners: parsed.owners || [],
          statements: parsed.statements || parsed.bank_statements || [],
          fundingPositions: parsed.fundingPositions || parsed.funding_positions || [],
          confidence: parsed.confidence || parsed.confidence_scores || {
            deal: 0,
            owners: [],
            statements: []
          },
          missingFields: parsed.missingFields || parsed.missing_fields || [],
          warnings: parsed.warnings || []
        };

        if (documentWarnings.length > 0) {
          const existing = Array.isArray(extracted.warnings) ? extracted.warnings : [];
          extracted.warnings = Array.from(new Set([...existing, ...documentWarnings]));
        }

        await persistDocumentsToDrive(extracted);

        const duration = Math.round(performance.now() - startTime);
        const responseSummary = extracted.deal?.legal_business_name
          ? `Deal: ${extracted.deal.legal_business_name}`
          : 'No business name extracted';

        logId =
          (await logAgentRun(supabaseAdmin, {
            agent_name: 'deal-info-agent',
            agent_stage: 'document_parse',
            invocation_source: 'edge_function',
            user_id: userId,
            request_payload: requestPayload,
            request_summary: requestSummary,
            response_payload: extracted,
            response_summary: responseSummary,
            success: true,
            duration_ms: duration,
          })) ?? logId;

        return new Response(JSON.stringify({ ...extracted, logId }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (aiError) {
        console.error('OpenAI API error:', aiError);
        throw aiError;
      }
    } else if (ANTHROPIC_API_KEY) {
      // Fallback to Claude if OpenAI not available
      console.log('Using Claude API as fallback');

      // Original Claude implementation here (keeping the existing working code)
      const systemPrompt = `You are an expert financial document analyzer for a business lending company. Extract structured business and financial information from application documents, bank statements, and tax returns.

Extract ONLY the following fields and return valid JSON:
1. Deal information: legal_business_name, dba_name, ein, business_type, address, city, state, zip, phone, website, franchise_business, seasonal_business, peak_sales_month, business_start_date, product_service_sold, franchise_units_percent, average_monthly_sales, average_monthly_card_sales, desired_loan_amount, reason_for_loan, loan_type (MCA or Business LOC)
2. Owners (1-2): owner_number, full_name, street_address, city, state, zip, phone, email, ownership_percent, drivers_license_number, date_of_birth
3. Bank statements: statement_id, bank_name, statement_month (YYYY-MM), credits, debits, nsfs, overdrafts, average_daily_balance, deposit_count
4. Funding positions: lender_name, amount, frequency (daily/weekly/monthly), detected_dates
5. Confidence scores (0-100) for deal, owners, statements
6. Missing fields and warnings

Return ONLY valid JSON matching this structure exactly.`;

      // Build message content with proper image/text handling for Claude's vision API
      const messageContent: any[] = [];

      // Add initial text prompt
      messageContent.push({
        type: 'text',
        text: 'Extract business and financial information from these documents:'
      });

      // Process each file
      if (Array.isArray(files)) {
        for (const file of files) {
          const { name, content, type } = file;
          const fileName = name || 'Document';
          const mimeType = typeof type === 'string' ? type : 'application/octet-stream';
          const base64Content = typeof content === 'string' ? content : '';
          const bytes = base64Content ? base64ToUint8Array(base64Content) : new Uint8Array();

          originalDocuments.push({
            name: fileName,
            type: mimeType,
            base64: base64Content,
            bytes,
          });

          if (mimeType.includes('image')) {
            // Send images directly to Claude's vision API
            messageContent.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64Content
              }
            });
            messageContent.push({
              type: 'text',
              text: `[Image: ${fileName}]`
            });
          } else if (mimeType.includes('text') || mimeType.includes('csv')) {
            // Decode text files and add as text
            try {
              const decoded = atob(base64Content);
              messageContent.push({
                type: 'text',
                text: `\n--- ${fileName} ---\n${decoded.substring(0, 50000)}`
              });
            } catch {
              messageContent.push({
                type: 'text',
                text: `\n--- ${fileName} ---\n${base64Content.substring(0, 50000)}`
              });
            }
          } else if (mimeType.toLowerCase().includes('pdf')) {
            // PDFs need special handling - skip for now
            console.log(`Skipping PDF file: ${fileName} (requires special processing)`);
            documentWarnings.push(`Could not automatically extract data from ${fileName}. Please review this PDF manually.`);
          } else {
            messageContent.push({
              type: 'text',
              text: `\n--- ${fileName} (${mimeType}) ---\n[Unsupported file type]`
            });
          }
        }
      }

      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 4096,
            system: systemPrompt,
            messages: [
              {
                role: 'user',
                content: messageContent,
              },
            ],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Anthropic API error:', errorText);
          throw new Error(`Anthropic API error: ${response.status}`);
        }

        const data = await response.json();
        let content = data.content[0].text;

        // Extract JSON from content (might be wrapped in markdown code blocks or have text before it)
        let jsonStr = content;

        // First try to extract from markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1];
        }

        // If content starts with text, find where JSON starts (look for { or [)
        if (!jsonStr.trim().startsWith('{') && !jsonStr.trim().startsWith('[')) {
          const jsonStart = jsonStr.search(/[\{\[]/);
          if (jsonStart !== -1) {
            jsonStr = jsonStr.substring(jsonStart);
          }
        }

        // Parse the API response
        const parsed = JSON.parse(jsonStr);

        // Normalize the response format to match ExtractedDealData interface
        const extracted: ExtractedDealData = {
          deal: parsed.deal || parsed.deal_information || {},
          owners: parsed.owners || [],
          statements: parsed.statements || parsed.bank_statements || [],
          fundingPositions: parsed.fundingPositions || parsed.funding_positions || [],
          confidence: parsed.confidence || parsed.confidence_scores || {
            deal: 0,
            owners: [],
            statements: []
          },
          missingFields: parsed.missingFields || parsed.missing_fields || [],
          warnings: parsed.warnings || []
        };

        if (documentWarnings.length > 0) {
          const existing = Array.isArray(extracted.warnings) ? extracted.warnings : [];
          extracted.warnings = Array.from(new Set([...existing, ...documentWarnings]));
        }

        await persistDocumentsToDrive(extracted);

        const duration = Math.round(performance.now() - startTime);
        const responseSummary = extracted.deal?.legal_business_name
          ? `Deal: ${extracted.deal.legal_business_name}`
          : 'No business name extracted';

        logId =
          (await logAgentRun(supabaseAdmin, {
            agent_name: 'deal-info-agent',
            agent_stage: 'document_parse',
            invocation_source: 'edge_function',
            user_id: userId,
            request_payload: requestPayload,
            request_summary: requestSummary,
            response_payload: extracted,
            response_summary: responseSummary,
            success: true,
            duration_ms: duration,
          })) ?? logId;

        return new Response(JSON.stringify({ ...extracted, logId }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (aiError) {
        console.error('Claude API error:', aiError);
        throw aiError;
      }
    }

    // No API key, return error response
    const errorData: ExtractedDealData = {
      deal: {
        legal_business_name: 'ERROR: Could not extract data',
        dba_name: null,
        ein: null,
        business_type: null,
        address: null,
        city: null,
        state: null,
        zip: null,
        phone: null,
        website: null,
        franchise_business: false,
        seasonal_business: false,
        peak_sales_month: null,
        business_start_date: null,
        product_service_sold: null,
        franchise_units_percent: null,
        average_monthly_sales: null,
        average_monthly_card_sales: null,
        desired_loan_amount: null,
        reason_for_loan: null,
        loan_type: null,
      },
      owners: [],
      statements: [],
      fundingPositions: [],
      confidence: {
        deal: 0,
        owners: [],
        statements: [],
      },
      missingFields: [
        'legal_business_name',
        'ein',
        'address',
        'city',
        'state',
        'zip',
        'desired_loan_amount',
        'loan_type',
        'owner_full_name',
        'owner_email',
      ],
      warnings: [
        'AI extraction failed - API key not configured',
        'Could not extract data from documents',
        'Please try uploading again or enter data manually',
      ],
    };

    const duration = Math.round(performance.now() - startTime);
    logId =
      (await logAgentRun(supabaseAdmin, {
        agent_name: 'deal-info-agent',
        agent_stage: 'document_parse',
        invocation_source: 'edge_function',
        user_id: userId,
        request_payload: requestPayload,
        request_summary: requestSummary,
        response_payload: errorData,
        response_summary: 'API key not configured',
        success: false,
        error_message: 'AI extraction skipped - missing API key',
        duration_ms: duration,
      })) ?? logId;

    return new Response(JSON.stringify({ ...errorData, logId }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Document parsing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Document parsing failed';

    // Return error data with 200 status so client doesn't fail
    const errorData: ExtractedDealData = {
      deal: {
        legal_business_name: `[Error: ${errorMessage}]`,
        dba_name: null,
        ein: null,
        business_type: null,
        address: null,
        city: null,
        state: null,
        zip: null,
        phone: null,
        website: null,
        franchise_business: false,
        seasonal_business: false,
        peak_sales_month: null,
        business_start_date: null,
        product_service_sold: null,
        franchise_units_percent: null,
        average_monthly_sales: null,
        average_monthly_card_sales: null,
        desired_loan_amount: null,
        reason_for_loan: null,
        loan_type: null,
      },
      owners: [
        {
          owner_number: 1,
          full_name: '[Owner information not extracted]',
          street_address: null,
          city: null,
          state: null,
          zip: null,
          phone: null,
          email: null,
          ownership_percent: null,
          drivers_license_number: null,
          date_of_birth: null,
        },
      ],
      statements: [],
      fundingPositions: [],
      confidence: { deal: 0, owners: [0], statements: [] },
      missingFields: ['All fields'],
      warnings: [`Error during parsing: ${errorMessage}`],
    };

    const duration = Math.round(performance.now() - startTime);
    logId =
      (await logAgentRun(supabaseAdmin, {
        agent_name: 'deal-info-agent',
        agent_stage: 'document_parse',
        invocation_source: 'edge_function',
        user_id: userId,
        request_payload: requestPayload,
        request_summary: requestSummary,
        response_payload: errorData,
        response_summary: 'Error during document parsing',
        success: false,
        error_message: errorMessage,
        duration_ms: duration,
      })) ?? logId;

    return new Response(JSON.stringify({ ...errorData, logId }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
