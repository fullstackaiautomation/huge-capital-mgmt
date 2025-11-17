import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface ExtractedApplicationData {
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
    franchise_units: number | null; // Count of franchise units owned (integer)
    average_monthly_sales: number | null; // Midpoint of range
    average_monthly_sales_low: number | null; // Lower bound
    average_monthly_sales_high: number | null; // Upper bound
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
  confidence: {
    deal: number;
    owners: number[];
  };
  missingFields: string[];
  warnings: string[];
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
  const documentWarnings: string[] = [];

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

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    console.log('parse-application: Parsing application documents with OpenAI');

    const systemPrompt = `You are an expert business application document analyzer for a lending company.

IMPORTANT: Extract ONLY business information and owner details from APPLICATION documents.
DO NOT extract bank statement data, funding positions, or financial transaction details.
IGNORE any bank statements or transaction history in the documents.

Extract the following fields and return valid JSON:
1. Deal information: legal_business_name, dba_name, ein, business_type, address, city, state, zip, phone, website, franchise_business, seasonal_business, peak_sales_month, business_start_date, product_service_sold, franchise_units (count of franchise units as integer, NOT percentage), average_monthly_sales (midpoint), average_monthly_sales_low, average_monthly_sales_high, average_monthly_card_sales, desired_loan_amount, reason_for_loan, loan_type (MCA or Business LOC)
2. Owners (up to 2): owner_number, full_name, street_address, city, state, zip, phone, email, ownership_percent, drivers_license_number, date_of_birth
3. Confidence scores (0-100) for deal and each owner
4. Missing fields and warnings

CRITICAL MONETARY CONVERSION RULES:
- For desired_loan_amount, average_monthly_sales, and average_monthly_card_sales:
  - Convert "$50K" or "50K" to 50000 (multiply by 1000)
  - Convert "$2M" or "2M" to 2000000 (multiply by 1000000)
  - "$50" stays as 50 ONLY if it's clearly less than $10,000 AND explicitly shown without K suffix
  - All loan amounts will be over $10,000 in practice
  - For RANGES (e.g., "$100K-$250K" or "$100,000 - $250,000"):
    * Set average_monthly_sales_low to the LOWER value (e.g., 100000)
    * Set average_monthly_sales_high to the UPPER value (e.g., 250000)
    * Set average_monthly_sales to the MIDPOINT (e.g., 175000)
    * Example: "$100K-$250K" → low=100000, high=250000, midpoint=175000
    * Example: "$100,000 - $250,000" → low=100000, high=250000, midpoint=175000
  - For SINGLE VALUES (e.g., "$150K"):
    * Set average_monthly_sales to that value
    * Set average_monthly_sales_low and average_monthly_sales_high to null
  - Always return numeric values without currency symbols or suffixes

Return ONLY valid JSON matching this structure exactly. Focus on application data, ignore statements.`;

    // Build message content for OpenAI API
    const messageContent: any[] = [];

    // Process each file
    for (const file of files) {
      if (typeof file === 'string') {
        continue;
      }

      const { name, content, type } = file;
      const fileName = name || 'Document';
      const mimeType = typeof type === 'string' ? type : 'application/octet-stream';
      const base64Content = typeof content === 'string' ? content : '';
      const bytes = base64Content ? base64ToUint8Array(base64Content) : new Uint8Array();

      console.log(`Processing application file: ${fileName}, type: ${mimeType}, bytes: ${bytes.length}`);

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
            text: `\n--- ${fileName} (Application Document) ---\n${extracted.substring(0, 50000)}`,
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

    // Add the extraction instruction
    messageContent.unshift({
      type: 'text',
      text: 'Extract business and owner information from these APPLICATION documents. Ignore any bank statements or transaction data.'
    });

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
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
          response_format: { type: "json_object" }
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

      // Normalize the response format
      const extracted: ExtractedApplicationData = {
        deal: parsed.deal || parsed.deal_information || {},
        owners: parsed.owners || [],
        confidence: parsed.confidence || parsed.confidence_scores || {
          deal: 0,
          owners: [],
        },
        missingFields: parsed.missingFields || parsed.missing_fields || [],
        warnings: parsed.warnings || []
      };

      if (documentWarnings.length > 0) {
        const existing = Array.isArray(extracted.warnings) ? extracted.warnings : [];
        extracted.warnings = Array.from(new Set([...existing, ...documentWarnings]));
      }

      const duration = Math.round(performance.now() - startTime);
      console.log(`parse-application completed in ${duration}ms`);

      return new Response(JSON.stringify(extracted), {
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
  } catch (error) {
    console.error('Application parsing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Application parsing failed';

    // Return error data
    const errorData: ExtractedApplicationData = {
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
        franchise_units: null,
        average_monthly_sales: null,
        average_monthly_sales_low: null,
        average_monthly_sales_high: null,
        average_monthly_card_sales: null,
        desired_loan_amount: null,
        reason_for_loan: null,
        loan_type: null,
      },
      owners: [],
      confidence: { deal: 0, owners: [] },
      missingFields: ['All fields'],
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
