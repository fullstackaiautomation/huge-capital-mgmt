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
    negative_days: number;
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
const MAX_RETRIES = 3; // Maximum retry attempts for rate limit errors

// OpenAI settings (10M tokens/min rate limit - much higher than Anthropic's 50k)
const OPENAI_BATCH_SIZE = 5; // Process 5 files at a time with OpenAI
const OPENAI_BATCH_DELAY_MS = 500; // 500ms delay between batches for OpenAI (reduced from 2000ms)

// Anthropic settings (50k tokens/min rate limit - very restrictive)
const ANTHROPIC_BATCH_SIZE = 1; // Process 1 file at a time with Anthropic (sequential)
const ANTHROPIC_BATCH_DELAY_MS = 40000; // 40 second delay between files for Anthropic to avoid rate limits

/**
 * Retry a function with exponential backoff for rate limit errors
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimitError =
        error?.status === 429 ||
        error?.message?.includes('rate_limit_error') ||
        error?.message?.includes('rate limit');

      const isLastAttempt = attempt === retries - 1;

      if (!isRateLimitError || isLastAttempt) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

/**
 * Process items in batches with controlled concurrency
 */
async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 5,
  delayBetweenBatches: number = 500
): Promise<R[]> {
  // Safety check: ensure batchSize is valid
  const safeBatchSize = Math.max(1, Number.isFinite(batchSize) ? batchSize : 5);
  const safeDelay = Math.max(0, Number.isFinite(delayBetweenBatches) ? delayBetweenBatches : 500);

  const results: R[] = [];

  for (let i = 0; i < items.length; i += safeBatchSize) {
    const batch = items.slice(i, i + safeBatchSize);
    console.log(`Processing batch ${Math.floor(i / safeBatchSize) + 1} of ${Math.ceil(items.length / safeBatchSize)} (${batch.length} files)`);

    const batchResults = await Promise.all(
      batch.map(item => processor(item))
    );

    results.push(...batchResults);

    // Add delay between batches (except after the last batch)
    if (i + safeBatchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, safeDelay));
    }
  }

  return results;
}

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
    "negative_days": number | null; // Number of days the account balance was negative
    "average_daily_balance": number | null;
    "deposit_count": number | null;
  }>;
  "fundingPositions": Array<{
    "lender_name": string;
    "amount": number;
    "frequency": "daily" | "weekly" | "monthly" | null;
    "detected_dates": string[]; // YYYY-MM-DD
  }>;
  "confidence": {
    "statements": number[]; // 0-100 per extracted statement
  };
  "warnings": string[];
}

IMPORTANT INSTRUCTIONS:

1. For negative_days, count the number of days during the statement period where the account balance went below zero (negative). Look for daily balance summaries or any indication of days with negative balances.

2. For fundingPositions: Look for DEPOSITS (credits) from known MCA lenders and financing companies in the transaction list. These are typically recurring payments with similar amounts. Common lender names include: Terrace Finance, Kafene, AmericanFirstFin, CAN Capital, OnDeck, Fundbox, Credibly, Kabbage, BlueVine, Rapid Finance, Greenbox, Capytal, Forward Financing, Mulligan Funding, Fora Financial, Libertas, PayPal Working Capital, Square Capital, Shopify Capital, Stripe Capital, Amazon Lending, etc.

3. CRITICAL for fundingPositions amount: Each entry in fundingPositions should have the ACTUAL AMOUNT from the transaction. Look at the deposit/credit column and extract the exact dollar amount. For example, if you see "TERRACE FINANCE ... 2,500.00", the amount should be 2500. DO NOT return null or 0 for amount - extract the actual transaction value.

4. If the same lender appears multiple times with DIFFERENT amounts, create SEPARATE entries for each unique amount. For example:
   - If Terrace Finance appears with $2,500.00 on dates 09/25 and 09/29, create ONE entry with amount: 2500 and detected_dates: ["2025-09-25", "2025-09-29"]
   - If Terrace Finance appears with $2,423.25 on date 09/25, create a SEPARATE entry with amount: 2423.25 and detected_dates: ["2025-09-25"]

5. If a field is missing, use null EXCEPT for fundingPositions.amount which must be a number.

Always return valid JSON only.`;

    const systemPrompt = `You are an expert financial statement analyzer for a business lending company.

Extract ONLY bank statement and funding position data from the provided document. Return a JSON object with:
- statements: array of statements with statement_id, bank_name, statement_month (YYYY-MM), credits, debits, nsfs, overdrafts, negative_days (number of days account was in the negative/below zero), average_daily_balance, deposit_count.
- fundingPositions: array with lender_name, amount (REQUIRED - must be the actual dollar amount from the transaction), frequency (daily|weekly|monthly), detected_dates (YYYY-MM-DD).
- confidence: object with statements (array of confidence scores 0-100).
- warnings: array of strings for any issues encountered.

CRITICAL: For fundingPositions, you MUST extract the actual transaction amount from the bank statement. Look at the credits/deposits column. The amount field is REQUIRED and cannot be null or 0 - it must be the actual dollar value from the transaction (e.g., 2500.00, 1295.99, 900.00).

For negative_days: Count days where the account balance was below $0. Look for daily balance tables, ledger balance summaries, or any indicator of negative balances throughout the statement period.

If information is missing, use nulls EXCEPT for fundingPositions.amount which must always be the actual transaction amount. Always respond with valid JSON.`;

    const userContent: any[] = [
      {
        type: 'input_text',
        text: `File name: ${fileName}`,
      },
    ];

    let uploadedFileId: string | null = null;

    const canUseAnthropic = Boolean(anthropicKey);
    const canUseOpenAI = Boolean(openAiKey);

    // Prefer OpenAI for PDFs due to much higher rate limits (10M vs 50k tokens/min)
    // and guaranteed JSON output format
    const preferOpenAI = canUseOpenAI && mimeType.toLowerCase().includes('pdf');

    // Try OpenAI first for PDFs (better rate limits and guaranteed JSON)
    if (preferOpenAI) {
      console.log(`Analyzing bank statement with OpenAI (preferred for PDFs): ${fileName}`);

      try {
        // Upload PDF to OpenAI first
        const uploadForm = new FormData();
        uploadForm.append('purpose', 'assistants');
        uploadForm.append('file', new Blob([bytes], { type: mimeType }), fileName);

        const uploadResponse = await fetchWithTimeout('https://api.openai.com/v1/files', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openAiKey}`,
          },
          body: uploadForm,
        }, REQUEST_TIMEOUT_MS);

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('Failed to upload PDF to OpenAI:', errorText);
          warnings.push(`OpenAI file upload failed for ${fileName}: ${errorText}`);
          // Fall through to Anthropic if available
        } else {
          const uploadedFile = await uploadResponse.json();
          uploadedFileId = uploadedFile.id;

          const openaiResponse = await retryWithBackoff(async () => {
            return await fetchWithTimeout('https://api.openai.com/v1/responses', {
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
                    content: [
                      {
                        type: 'input_text',
                        text: instruction,
                      },
                      {
                        type: 'input_file',
                        file_id: uploadedFileId,
                      },
                    ],
                  },
                ],
                max_output_tokens: 2000,
              }),
            }, REQUEST_TIMEOUT_MS);
          });

          if (openaiResponse.ok) {
            const responseData = await openaiResponse.json();
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

            const combined = textChunks.join('\n').trim();
            const parsed = extractJsonFromText(combined);

            // Clean up uploaded file
            if (uploadedFileId) {
              fetch(`https://api.openai.com/v1/files/${uploadedFileId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${openAiKey}` },
              }).catch((cleanupError) => console.error('Failed to delete OpenAI file:', cleanupError));
            }

            if (parsed) {
              console.log(`✓ Successfully parsed ${fileName} with OpenAI`);
              return {
                statements: Array.isArray(parsed.statements) ? parsed.statements : [],
                fundingPositions: Array.isArray(parsed.fundingPositions) ? parsed.fundingPositions : [],
                warnings: Array.isArray(parsed.warnings) ? parsed.warnings : warnings,
                confidence: typeof parsed.confidence === 'object' && parsed.confidence
                  ? parsed.confidence
                  : { statements: [] },
              };
            } else {
              warnings.push(`OpenAI analysis returned invalid JSON for ${fileName}.`);
            }
          } else {
            const errorText = await openaiResponse.text();
            warnings.push(`OpenAI analysis failed for ${fileName}: ${errorText}`);
          }
        }
      } catch (openaiError: any) {
        console.error(`OpenAI processing error for ${fileName}:`, openaiError);
        warnings.push(`OpenAI error for ${fileName}: ${openaiError.message || 'Unknown error'}`);
        // Fall through to Anthropic if available
      } finally {
        // Clean up file if it was uploaded
        if (uploadedFileId && openAiKey) {
          fetch(`https://api.openai.com/v1/files/${uploadedFileId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${openAiKey}` },
          }).catch(() => {});
        }
      }
    }

    // Fallback to Anthropic if OpenAI failed or not preferred
    if (canUseAnthropic) {
      if (bytes.length === 0) {
        warnings.push(`The file ${fileName} appears to be empty and could not be processed.`);
        return { ...defaultResult, warnings };
      }

      if (bytes.length > LARGE_PDF_BYTES_THRESHOLD) {
        warnings.push(`Skipping ${fileName}: exceeds ${Math.round(LARGE_PDF_BYTES_THRESHOLD / (1024 * 1024))}MB limit for fast analysis.`);
        return { ...defaultResult, warnings };
      }

      console.log(`Analyzing bank statement with Anthropic Haiku: ${fileName}`);

      const response = await retryWithBackoff(async () => {
        return await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
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
      });

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

    // Determine which AI service will be used (prefer OpenAI for PDFs)
    const hasOpenAI = Boolean(OPENAI_API_KEY);
    const hasAnthropic = Boolean(ANTHROPIC_API_KEY);
    const willUseOpenAI = hasOpenAI; // OpenAI is now preferred for PDFs

    console.log(`parse-bank-statements: Parsing documents using ${willUseOpenAI ? 'OpenAI (preferred)' : 'Anthropic Haiku'} (per-file analysis)`);

    // Use appropriate batch settings based on AI service
    const batchSize = willUseOpenAI ? OPENAI_BATCH_SIZE : ANTHROPIC_BATCH_SIZE;
    const batchDelay = willUseOpenAI ? OPENAI_BATCH_DELAY_MS : ANTHROPIC_BATCH_DELAY_MS;

    console.log(`Batch settings: size=${batchSize}, delay=${batchDelay}ms (${willUseOpenAI ? 'OpenAI 10M tokens/min' : 'Anthropic 50k tokens/min'})`);

    const startedAt = performance.now();

    const aggregatedResult: ExtractedStatementsData = {
      statements: [],
      fundingPositions: [],
      confidence: { statements: [] },
      warnings: [],
    };

    // Process files in batches with controlled concurrency to avoid rate limits
    const filesToProcess = files.filter((file) => typeof file !== 'string');

    const processFile = async (file: any): Promise<DocumentExtractionResult> => {
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
    };

    // Process files in batches with timeout protection
    const timeoutPromise = new Promise<DocumentExtractionResult[]>((_, reject) => {
      setTimeout(() => reject(new Error('Processing exceeded time budget')), TIME_BUDGET_MS);
    });

    let results: DocumentExtractionResult[];
    try {
      results = await Promise.race([
        processBatch(filesToProcess, processFile, batchSize, batchDelay),
        timeoutPromise,
      ]) as DocumentExtractionResult[];
    } catch (error) {
      const timeoutWarning = `Bank statement parsing exceeded ${Math.round(TIME_BUDGET_MS / 1000)}s budget; some files may not have been processed.`;
      console.warn(timeoutWarning);
      aggregatedResult.warnings.push(timeoutWarning);

      // On timeout, return empty results (batched processing doesn't support partial results)
      results = [];
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
