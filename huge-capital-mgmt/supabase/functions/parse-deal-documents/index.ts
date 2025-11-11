import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

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
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const { fileUrls, fileNames, fileMimeTypes } = await req.json();

    if (!fileUrls || !Array.isArray(fileUrls) || fileUrls.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one file URL is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Anthropic API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Fetch and process files from Supabase Storage
    const fileContents: Array<{ name: string; content: string; mimeType: string }> = [];

    for (let i = 0; i < fileUrls.length; i++) {
      try {
        const response = await fetch(fileUrls[i]);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type') || fileMimeTypes[i] || 'application/octet-stream';
        let content = '';

        if (contentType.includes('pdf')) {
          // For PDFs, we'll need to send binary data to Claude
          // This is a simplified version - in production would need proper PDF handling
          const buffer = await response.arrayBuffer();
          content = `[PDF Document: ${fileNames[i]}]`;
        } else if (contentType.includes('text') || contentType.includes('csv')) {
          content = await response.text();
        } else {
          const buffer = await response.arrayBuffer();
          content = `[Binary file: ${fileNames[i]}]`;
        }

        fileContents.push({
          name: fileNames[i],
          content: content.substring(0, 50000), // Limit to avoid token overflow
          mimeType: contentType,
        });
      } catch (error) {
        console.error(`Error fetching file ${fileUrls[i]}:`, error);
        throw new Error(`Failed to process file ${fileNames[i]}`);
      }
    }

    const systemPrompt = `You are an expert financial document analyzer for a business lending company. Your task is to extract structured business and financial information from application documents, bank statements, and tax returns.

EXTRACT THE FOLLOWING INFORMATION:

1. **Deal Information (from application forms)**:
   - Legal business name
   - DBA name (if different)
   - EIN (Employer Identification Number)
   - Business type (e.g., LLC, S-Corp, C-Corp, Sole Proprietor)
   - Business address, city, state, zip
   - Phone, website
   - Franchise business (yes/no)
   - Seasonal business (yes/no)
   - Peak sales month
   - Business start date
   - Products/services sold
   - Franchise units percent
   - Average monthly sales
   - Average monthly card sales (if merchant)
   - Desired loan amount
   - Reason for loan
   - Loan type (MCA = Merchant Cash Advance, or Business LOC = Line of Credit)

2. **Business Owner Information** (extract 1-2 owners):
   For each owner:
   - Full name
   - Street address, city, state, zip
   - Phone, email
   - Ownership percent
   - Driver's license number (if visible)
   - Date of birth
   - Note: Do NOT extract SSN - mark as encrypted

3. **Bank Statement Analysis** (for each statement):
   - Bank name
   - Statement month (YYYY-MM format)
   - Total credits (deposits) - sum of all positive transactions
   - Total debits (withdrawals) - sum of all negative transactions
   - Number of NSF days (days ending with negative balance)
   - Number of overdraft occurrences
   - Average daily balance
   - Number of deposits
   - File identifier

4. **Funding Positions** (recurring payments from other lenders):
   Look for repeating payment patterns (same amount, same intervals):
   - Lender name (if identifiable)
   - Amount
   - Frequency (daily, weekly, monthly)
   - Detected payment dates

5. **Confidence Scores** (0-100):
   - Overall deal info confidence
   - Per-owner confidence
   - Per-statement confidence

6. **Missing Fields**: List critical fields that couldn't be extracted
7. **Warnings**: Note any data quality issues or concerning patterns

Return ONLY valid JSON in this exact format:
{
  "deal": { ... all fields as specified above ... },
  "owners": [ ... array of owner objects ... ],
  "statements": [ ... array of statement objects ... ],
  "fundingPositions": [ ... array of funding position objects ... ],
  "confidence": {
    "deal": number,
    "owners": [number],
    "statements": [number]
  },
  "missingFields": ["field1", "field2"],
  "warnings": ["warning1", "warning2"]
}`;

    const fileDescriptions = fileContents
      .map((f) => `\n--- ${f.name} (${f.mimeType}) ---\n${f.content}`)
      .join('\n');

    const userPrompt = `Extract all business and financial information from these documents:${fileDescriptions}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      throw new Error(`AI extraction failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Parse and validate the JSON response
    const extracted: ExtractedDealData = JSON.parse(content);

    return new Response(
      JSON.stringify(extracted),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Document parsing error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Document parsing failed',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
