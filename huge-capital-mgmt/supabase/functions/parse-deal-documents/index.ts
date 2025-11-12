import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
      },
    });
  }

  try {
    const requestBody = await req.json();
    const files = requestBody.files || requestBody.fileUrls;

    // Support both base64 files and URLs
    if (!files) {
      return new Response(
        JSON.stringify({ error: 'Either files (base64) or fileUrls are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Get API key from environment (check at runtime, not at module load)
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

    // If API key is available, use Claude AI
    if (ANTHROPIC_API_KEY) {
      console.log('ANTHROPIC_API_KEY found, calling Claude API');

      // Prepare files for Claude
      const fileContents: Array<{ name: string; content: string; mimeType: string }> = [];

      if (Array.isArray(files)) {
        for (const file of files) {
          const { name, content, type } = file;

          let processedContent = '';
          if (type.includes('pdf') || type.includes('image')) {
            processedContent = `[${type.includes('pdf') ? 'PDF' : 'Image'} Document: ${name}, Base64: ${content.substring(0, 5000)}...]`;
          } else if (type.includes('text') || type.includes('csv')) {
            try {
              const decoded = atob(content);
              processedContent = decoded.substring(0, 50000);
            } catch {
              processedContent = content.substring(0, 50000);
            }
          } else {
            processedContent = `[File: ${name}, Type: ${type}]`;
          }

          fileContents.push({
            name,
            content: processedContent,
            mimeType: type,
          });
        }
      }

      const systemPrompt = `You are an expert financial document analyzer for a business lending company. Extract structured business and financial information from application documents, bank statements, and tax returns.

Extract ONLY the following fields and return valid JSON:
1. Deal information: legal_business_name, dba_name, ein, business_type, address, city, state, zip, phone, website, franchise_business, seasonal_business, peak_sales_month, business_start_date, product_service_sold, franchise_units_percent, average_monthly_sales, average_monthly_card_sales, desired_loan_amount, reason_for_loan, loan_type (MCA or Business LOC)
2. Owners (1-2): owner_number, full_name, street_address, city, state, zip, phone, email, ownership_percent, drivers_license_number, date_of_birth
3. Bank statements: statement_id, bank_name, statement_month (YYYY-MM), credits, debits, nsfs, overdrafts, average_daily_balance, deposit_count
4. Funding positions: lender_name, amount, frequency (daily/weekly/monthly), detected_dates
5. Confidence scores (0-100) for deal, owners, statements
6. Missing fields and warnings

Return ONLY valid JSON matching this structure exactly.`;

      const fileDescriptions = fileContents
        .map((f) => `\n--- ${f.name} (${f.mimeType}) ---\n${f.content}`)
        .join('\n');

      const userPrompt = `Extract business and financial information from these documents:\n${fileDescriptions}`;

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
                content: userPrompt,
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

        // Extract JSON from content (might be wrapped in markdown code blocks)
        let jsonStr = content;
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1];
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

        return new Response(JSON.stringify(extracted), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (aiError) {
        console.error('Claude AI error:', aiError);
        // Fall back to mock data if Claude fails
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

    return new Response(JSON.stringify(errorData), {
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

    return new Response(JSON.stringify(errorData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
