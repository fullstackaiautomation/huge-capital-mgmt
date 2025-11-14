import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface ExtractedStatementsData {
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
    statements: number[];
  };
  warnings: string[];
}

interface DocumentExtractionResult {
  statements: ExtractedStatementsData['statements'];
  fundingPositions: ExtractedStatementsData['fundingPositions'];
  warnings: string[];
  confidence: {
    statements: number[];
  };
}

function base64ToUint8Array(base64: string): Uint8Array {
  const cleaned = base64.replace(/^data:.*;base64,/, '').replace(/[\r\n\s]/g, '');
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

const REQUEST_TIMEOUT_MS = 30000; // Reduced from 60s to 30s for faster failure
const TIME_BUDGET_MS = 100000; // Reduced from 120s to 100s to stay well under 150s hard limit
const LARGE_PDF_BYTES_THRESHOLD = 18 * 1024 * 1024;

async function uploadPdfToOpenAI(
  fileName: string,
  bytes: Uint8Array,
  openAiKey: string,
): Promise<string | null> {
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
  return uploadedFile.id as string;
}

async function deleteOpenAiFile(fileId: string, openAiKey: string): Promise<void> {
  try {
    await fetch(`https://api.openai.com/v1/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${openAiKey}`,
      },
    });
  } catch (cleanupError) {
    console.error('Failed to delete OpenAI file:', cleanupError);
  }
}

function extractJsonFromText(raw: string): any | null {
  if (!raw) return null;
  let jsonStr = raw.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) {
    jsonStr = fenceMatch[1];
  }
  if (!jsonStr.trim().startsWith('{') && !jsonStr.trim().startsWith('[')) {
    const start = jsonStr.search(/[\{\[]/);
    if (start !== -1) {
      jsonStr = jsonStr.slice(start);
    }
  }
  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to parse JSON from text:', error, jsonStr.slice(0, 500));
    return null;
  }
}

async function analyzeBankDocument(
  fileName: string,
  mimeType: string,
  base64Content: string,
  bytes: Uint8Array,
  anthropicKey: string | null,
  openAiKey: string | null,
): Promise<DocumentExtractionResult> {
  const warnings: string[] = [];
  const defaultResult: DocumentExtractionResult = {
    statements: [],
    fundingPositions: [],
    warnings: [],
    confidence: { statements: [] },
  };

  try {
    const instruction = `Extract the information from this bank statement and respond with JSON following this TypeScript type:

{
  "statements": Array<{
    "statement_id": string;
    "bank_name": string;
    "statement_month": string; // YYYY-MM
    "credits": number | null;
    "debits": number | null;
    "nsfs": number | null;
    "overdrafts": number | null;
    "average_daily_balance": number | null;
    "deposit_count": number | null;
  }>;
  "fundingPositions": Array<{
    "lender_name": string;
    "amount": number | null;
    "frequency": "daily" | "weekly" | "monthly" | null;
    "detected_dates": string[]; // YYYY-MM-DD
  }>;
  "confidence": {
    "statements": number[]; // 0-100 per extracted statement
  };
  "warnings": string[];
}

If a field is missing, use null. Always return valid JSON only.`;

    const systemPrompt = `You are an expert financial statement analyzer for a business lending company.

Extract ONLY bank statement and funding position data from the provided document. Return a JSON object with:
- statements: array of statements with statement_id, bank_name, statement_month (YYYY-MM), credits, debits, nsfs, overdrafts, average_daily_balance, deposit_count.
- fundingPositions: array with lender_name, amount, frequency (daily|weekly|monthly), detected_dates (YYYY-MM-DD).
- confidence: object with statements (array of confidence scores 0-100).
- warnings: array of strings for any issues encountered.

If information is missing, use nulls. Always respond with valid JSON.`;

    const userContent: any[] = [
      {
        type: 'input_text',
        text: `File name: ${fileName}`,
      },
    ];

    let uploadedFileId: string | null = null;

    const canUseAnthropic = Boolean(anthropicKey);
    const preferAnthropic = canUseAnthropic && mimeType.toLowerCase().includes('pdf');

    if (preferAnthropic) {
      if (bytes.length === 0) {
        warnings.push(`The file ${fileName} appears to be empty and could not be processed.`);
        return { ...defaultResult, warnings };
      }

      if (bytes.length > LARGE_PDF_BYTES_THRESHOLD) {
        warnings.push(`Skipping ${fileName}: exceeds ${Math.round(LARGE_PDF_BYTES_THRESHOLD / (1024 * 1024))}MB limit for fast analysis.`);
        return { ...defaultResult, warnings };
      }

      console.log(`Analyzing bank statement with Anthropic Haiku: ${fileName}`);

      const response = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 800, // Reduced from 1500 to 800 for faster responses
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'document',
                  source: {
                    type: 'base64',
                    media_type: mimeType,
                    data: base64Content,
                  },
                },
                {
                  type: 'text',
                  text: instruction,
                },
              ],
            },
          ],
        }),
      }, REQUEST_TIMEOUT_MS);

      if (!response.ok) {
        const errorText = await response.text();
        warnings.push(`Anthropic analysis failed for ${fileName}: ${errorText}`);
        return { ...defaultResult, warnings };
      }

      const responseData = await response.json();
      const textSegments = responseData.content
        ?.filter((item: any) => item.type === 'text')
        .map((item: any) => item.text)
        ?? [];

      const combined = textSegments.join('\n').trim();
      const parsed = extractJsonFromText(combined);

      if (!parsed) {
        warnings.push(`Anthropic analysis returned invalid JSON for ${fileName}.`);
        return { ...defaultResult, warnings };
      }

      return {
        statements: Array.isArray(parsed.statements) ? parsed.statements : [],
        fundingPositions: Array.isArray(parsed.fundingPositions) ? parsed.fundingPositions : [],
        warnings: Array.isArray(parsed.warnings) ? parsed.warnings : warnings,
        confidence: typeof parsed.confidence === 'object' && parsed.confidence
          ? parsed.confidence
          : { statements: [] },
      };
    }

    if (mimeType.toLowerCase().includes('pdf')) {
      if (bytes.length === 0) {
        warnings.push(`The file ${fileName} appears to be empty and could not be processed.`);
        return { ...defaultResult, warnings };
      }

      if (!openAiKey) {
        warnings.push(`Skipping ${fileName}: OPENAI_API_KEY not configured for PDF fallback.`);
        return { ...defaultResult, warnings };
      }

      console.log(`Analyzing bank statement with OpenAI (PDF fallback): ${fileName}`);

      uploadedFileId = await uploadPdfToOpenAI(
        fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`,
        bytes,
        openAiKey,
      );

      if (!uploadedFileId) {
        warnings.push(`Could not upload ${fileName} for analysis.`);
        return { ...defaultResult, warnings };
      }

      userContent.push({
        type: 'input_file',
        file_id: uploadedFileId,
      });

      const response = await fetchWithTimeout('https://api.openai.com/v1/responses', {
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
                  text: systemPrompt,
                },
              ],
            },
            {
              role: 'user',
              content: userContent,
            },
          ],
          max_output_tokens: 2000,
          response_format: { type: 'json_object' },
        }),
      }, REQUEST_TIMEOUT_MS);

      if (!response.ok) {
        const errorText = await response.text();
        warnings.push(`OpenAI analysis failed for ${fileName}: ${errorText}`);
        await deleteOpenAiFile(uploadedFileId, openAiKey);
        return { ...defaultResult, warnings };
      }

      const responseData = await response.json();
      const outputTexts: string[] = [];
      if (Array.isArray(responseData.output)) {
        for (const output of responseData.output) {
          if (Array.isArray(output.content)) {
            for (const contentItem of output.content) {
              if (contentItem.type === 'output_text' && contentItem.text) {
                outputTexts.push(contentItem.text);
              }
            }
          }
        }
      }

      await deleteOpenAiFile(uploadedFileId, openAiKey);

      const combined = outputTexts.join('\n').trim();
      if (!combined) {
        warnings.push(`OpenAI analysis returned no data for ${fileName}.`);
        return { ...defaultResult, warnings };
      }

      const parsed = extractJsonFromText(combined);
      if (!parsed) {
        warnings.push(`OpenAI analysis returned invalid JSON for ${fileName}.`);
        return { ...defaultResult, warnings };
      }

      return {
        statements: Array.isArray(parsed.statements) ? parsed.statements : [],
        fundingPositions: Array.isArray(parsed.fundingPositions) ? parsed.fundingPositions : [],
        warnings: Array.isArray(parsed.warnings) ? parsed.warnings : warnings,
        confidence: typeof parsed.confidence === 'object' && parsed.confidence
          ? parsed.confidence
          : { statements: [] },
      };
    }

    // Handle non-PDF documents (images, text, csv)
    if (mimeType.includes('image')) {
      userContent.push({
        type: 'input_image',
        image_url: {
          url: `data:${mimeType};base64,${base64Content}`,
        },
      });
    } else {
      let textContent = base64Content;
      try {
        textContent = atob(base64Content);
      } catch {
        // Fall back to original base64 string if decoding fails
      }
      userContent.push({
        type: 'input_text',
        text: textContent.substring(0, 50000),
      });
    }

    if (!openAiKey) {
      warnings.push(`No supported analysis model configured for ${fileName}.`);
      return { ...defaultResult, warnings };
    }

    console.log(`Analyzing bank statement with OpenAI (non-PDF): ${fileName}`);

    const response = await fetchWithTimeout('https://api.openai.com/v1/responses', {
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
                text: systemPrompt,
              },
            ],
          },
          {
            role: 'user',
            content: [...userContent, { type: 'input_text', text: instruction }],
          },
        ],
        max_output_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    }, REQUEST_TIMEOUT_MS);

    if (!response.ok) {
      const errorText = await response.text();
      warnings.push(`OpenAI analysis failed for ${fileName}: ${errorText}`);
      return { ...defaultResult, warnings };
    }

    const responseData = await response.json();
    const outputTexts: string[] = [];
    if (Array.isArray(responseData.output)) {
      for (const output of responseData.output) {
        if (Array.isArray(output.content)) {
          for (const contentItem of output.content) {
            if (contentItem.type === 'output_text' && contentItem.text) {
              outputTexts.push(contentItem.text);
            }
          }
        }
      }
    }

    const combined = outputTexts.join('\n').trim();
    const parsed = extractJsonFromText(combined);
    if (!parsed) {
      warnings.push(`OpenAI analysis returned invalid JSON for ${fileName}.`);
      return { ...defaultResult, warnings };
    }

    return {
      statements: Array.isArray(parsed.statements) ? parsed.statements : [],
      fundingPositions: Array.isArray(parsed.fundingPositions) ? parsed.fundingPositions : [],
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : warnings,
      confidence: typeof parsed.confidence === 'object' && parsed.confidence
        ? parsed.confidence
        : { statements: [] },
    };
  } catch (error) {
    console.error('Error analyzing bank document:', error);
    warnings.push(`Error during analysis of ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { ...defaultResult, warnings };
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

  try {
    const requestBody = await req.json();
    const files = requestBody.files;

    if (!files || !Array.isArray(files)) {
      return new Response(
        JSON.stringify({ error: 'files array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

    if (!OPENAI_API_KEY && !ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'No analysis provider configured (missing OPENAI_API_KEY and ANTHROPIC_API_KEY)' }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    console.log(`parse-bank-statements: Parsing documents using ${ANTHROPIC_API_KEY ? 'Anthropic Haiku' : 'OpenAI'} (per-file analysis)`);

    const startedAt = performance.now();

    const aggregatedResult: ExtractedStatementsData = {
      statements: [],
      fundingPositions: [],
      confidence: { statements: [] },
      warnings: [],
    };

    // Process all files in parallel instead of sequentially to avoid timeout
    const filePromises = files
      .filter((file) => typeof file !== 'string')
      .map(async (file) => {
        const { name, content, type } = file;
        const fileName = name || 'Document';
        const mimeType = typeof type === 'string' ? type : 'application/octet-stream';
        const base64Content = typeof content === 'string' ? content : '';
        const bytes = base64Content ? base64ToUint8Array(base64Content) : new Uint8Array();

        console.log(`Processing bank statement file: ${fileName}, type: ${mimeType}, bytes: ${bytes.length}`);

        try {
          const result = await analyzeBankDocument(
            fileName,
            mimeType,
            base64Content,
            bytes,
            ANTHROPIC_API_KEY,
            OPENAI_API_KEY,
          );
          return result;
        } catch (error) {
          console.error(`Error processing ${fileName}:`, error);
          return {
            statements: [],
            fundingPositions: [],
            warnings: [`Failed to process ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`],
            confidence: { statements: [] },
          };
        }
      });

    // Wait for all files to be processed in parallel with timeout protection
    const timeoutPromise = new Promise<DocumentExtractionResult[]>((_, reject) => {
      setTimeout(() => reject(new Error('Processing exceeded time budget')), TIME_BUDGET_MS);
    });

    let results: DocumentExtractionResult[];
    try {
      results = await Promise.race([
        Promise.all(filePromises),
        timeoutPromise,
      ]) as DocumentExtractionResult[];
    } catch (error) {
      const timeoutWarning = `Bank statement parsing exceeded ${Math.round(TIME_BUDGET_MS / 1000)}s budget; some files may not have been processed.`;
      console.warn(timeoutWarning);
      aggregatedResult.warnings.push(timeoutWarning);

      // Try to get partial results from settled promises
      const settledResults = await Promise.allSettled(filePromises);
      results = settledResults
        .filter((r): r is PromiseFulfilledResult<DocumentExtractionResult> => r.status === 'fulfilled')
        .map(r => r.value);
    }

    // Aggregate all results
    for (const result of results) {
      if (Array.isArray(result.statements)) {
        aggregatedResult.statements.push(...result.statements);
      }
      if (Array.isArray(result.fundingPositions)) {
        aggregatedResult.fundingPositions.push(...result.fundingPositions);
      }
      if (Array.isArray(result.warnings)) {
        aggregatedResult.warnings.push(...result.warnings);
      }
      if (Array.isArray(result.confidence?.statements)) {
        aggregatedResult.confidence.statements.push(...result.confidence.statements);
      }
    }

    return new Response(JSON.stringify(aggregatedResult), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Bank statement parsing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Bank statement parsing failed';

    // Return error data
    const errorData: ExtractedStatementsData = {
      statements: [],
      fundingPositions: [],
      confidence: { statements: [] },
      warnings: [`Error during parsing: ${errorMessage}`],
    };

    return new Response(JSON.stringify(errorData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
