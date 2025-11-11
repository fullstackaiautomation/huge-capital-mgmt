import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  corrections: {
    [key: string]: any;
  };
  confidence: number;
  suggestions: string[];
  threeMonthAverages: {
    credits: number;
    debits: number;
    averageDailyBalance: number;
  } | null;
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
    const extractedData = await req.json();

    if (!extractedData) {
      return new Response(
        JSON.stringify({ error: 'Extracted deal data is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Anthropic API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const systemPrompt = `You are an expert financial validator for business lending. Your task is to validate extracted deal data for accuracy, consistency, and completeness.

VALIDATION RULES:

1. **Business Information**:
   - Legal business name must not be empty
   - EIN format: XX-XXXXXXX
   - State must be valid 2-letter code
   - ZIP code format: XXXXX or XXXXX-XXXX
   - Loan type must be 'MCA' or 'Business LOC'
   - Desired loan amount must be > 0

2. **Owner Information**:
   - At least one owner required
   - Full name cannot be empty
   - All owners must have unique owner_number (1 or 2)
   - Email format validation
   - Ownership percents should sum to ~100% for all owners
   - Date of birth must be valid and owner must be 18+

3. **Bank Statement Consistency**:
   - Credits (deposits) must be >= 0
   - Debits (withdrawals) must be >= 0
   - Average daily balance should be reasonable
   - NSF days should not exceed total days in month
   - Overdraft count should be <= NSF days

4. **Financial Reasonableness**:
   - Average monthly sales should be >= desired_loan_amount / 12 (for MCA)
   - Average monthly card sales should be > 0 for MCA deals
   - Compare desired loan amount against monthly revenue

5. **Cross-Document Validation**:
   - Owner names should be consistent across documents
   - Business name should be consistent
   - Address should be consistent or have legitimate variations

6. **Calculate 3-Month Averages** (if 3+ statements available):
   - Average credits across statements
   - Average debits across statements
   - Average daily balance

RETURN FORMAT (ONLY VALID JSON):
{
  "isValid": boolean,
  "errors": ["critical issue 1", "critical issue 2"],
  "warnings": ["non-critical issue 1"],
  "corrections": {
    "fieldName": "suggested value",
    ...
  },
  "confidence": number (0-100),
  "suggestions": ["suggestion for improvement"],
  "threeMonthAverages": {
    "credits": number,
    "debits": number,
    "averageDailyBalance": number
  } or null
}`;

    const userPrompt = `Validate and correct this extracted deal data. Cross-check consistency across all documents. Calculate 3-month averages if statements are available.

EXTRACTED DATA:
${JSON.stringify(extractedData, null, 2)}

Respond ONLY with valid JSON in the specified format.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
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
      throw new Error(`Validation failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Parse and return validation result
    const validation: ValidationResult = JSON.parse(content);

    return new Response(
      JSON.stringify(validation),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Validation error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Validation failed',
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
