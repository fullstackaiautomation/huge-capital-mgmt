import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface LenderMatchResult {
  lender_id: string;
  lender_name: string;
  lender_table: 'lenders_mca' | 'lenders_business_line_of_credit';
  match_score: number;
  match_reasoning: string;
  key_terms: {
    rates_range?: string;
    terms_range?: string;
    submission_requirements?: string;
  };
}

interface MatchLendersResponse {
  matches: LenderMatchResult[];
  totalMatches: number;
  filteringReasoning: string;
  errors: string[];
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
    const { dealData, dealFundingPositions } = await req.json();

    if (!dealData) {
      return new Response(
        JSON.stringify({ error: 'Deal data is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    if (!ANTHROPIC_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: 'Required environment variables not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Step 1: Rule-based filtering
    const lenderTable = dealData.loan_type === 'MCA' ? 'lenders_mca' : 'lenders_business_line_of_credit';
    const qualifyingLenders = await queryQualifyingLenders(
      lenderTable,
      dealData,
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );

    if (qualifyingLenders.length === 0) {
      return new Response(
        JSON.stringify({
          matches: [],
          totalMatches: 0,
          filteringReasoning: 'No lenders matched the deal requirements',
          errors: [],
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Step 2: AI ranking
    const aiMatches = await rankLendersWithAI(
      qualifyingLenders,
      dealData,
      dealFundingPositions,
      lenderTable,
      ANTHROPIC_API_KEY
    );

    // Step 3: Return top 3-6 matches
    const topMatches = aiMatches.slice(0, 6);

    return new Response(
      JSON.stringify({
        matches: topMatches,
        totalMatches: topMatches.length,
        filteringReasoning: `Filtered from ${qualifyingLenders.length} qualifying lenders`,
        errors: [],
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Lender matching error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Lender matching failed',
        matches: [],
        totalMatches: 0,
        filteringReasoning: '',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
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

async function queryQualifyingLenders(
  table: string,
  dealData: any,
  supabaseUrl: string,
  serviceRoleKey: string
): Promise<any[]> {
  // Build SQL query based on deal requirements
  const loanAmount = dealData.desired_loan_amount || 0;
  const monthlySales = dealData.average_monthly_sales || 0;
  const monthlyCardSales = dealData.average_monthly_card_sales || 0;
  const timeInBusiness = dealData.time_in_business_months || 0;
  const state = dealData.state || '';
  const businessType = dealData.business_type || '';

  // Note: This is a simplified query - adjust based on actual schema
  const query = `
    SELECT * FROM ${table}
    WHERE
      (min_loan_amount IS NULL OR min_loan_amount <= ${loanAmount})
      AND (max_loan_amount IS NULL OR max_loan_amount >= ${loanAmount})
      AND (min_monthly_volume IS NULL OR min_monthly_volume <= ${monthlySales})
      AND (restricted_states IS NULL OR NOT ${state} = ANY(restricted_states))
      AND (restricted_industries IS NULL OR NOT ${businessType} = ANY(restricted_industries))
      AND sort_order IS NOT NULL
    ORDER BY sort_order ASC
    LIMIT 20
  `;

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      // Fallback: return empty array if query fails
      console.error('Supabase query failed:', response.status);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('Database query error:', error);
    return [];
  }
}

async function rankLendersWithAI(
  lenders: any[],
  dealData: any,
  fundingPositions: any[] = [],
  lenderTable: string,
  apiKey: string
): Promise<LenderMatchResult[]> {
  const lenderSummary = lenders
    .map(
      (l) =>
        `- ${l.name || l.legal_name}: Min Amount: $${l.min_loan_amount}, Max: $${l.max_loan_amount}, Terms: ${l.terms_months} months`
    )
    .join('\n');

  const fundingPositionsSummary =
    fundingPositions.length > 0
      ? `Current Funding Positions (Existing Lender Payments):\n${fundingPositions
          .map((fp) => `- ${fp.lender_name}: $${fp.amount} ${fp.frequency}`)
          .join('\n')}`
      : 'No existing lender positions detected';

  const systemPrompt = `You are an expert lender matching AI for business financing. Your task is to analyze a deal and rank lenders by fit.

RANKING CRITERIA:
1. Loan amount fit (within lender's range, not too small or large)
2. Cash flow health (monthly revenue vs desired amount)
3. Funding position burden (existing payments won't overburden cash flow)
4. Industry match (lender's restrictions don't apply)
5. Seasonal business consideration
6. Terms alignment

Return ONLY valid JSON array of lender matches, sorted by match_score (highest first):
[
  {
    "lender_id": "uuid or lender id",
    "lender_name": "string",
    "lender_table": "lenders_mca or lenders_business_line_of_credit",
    "match_score": number (0-100),
    "match_reasoning": "detailed explanation of fit"
  }
]`;

  const userPrompt = `Rank these lenders for this deal:

DEAL INFORMATION:
- Business: ${dealData.legal_business_name || 'Unknown'}
- Type: ${dealData.loan_type}
- Desired Amount: $${dealData.desired_loan_amount}
- Monthly Revenue: $${dealData.average_monthly_sales || 0}
- Monthly Card Sales: $${dealData.average_monthly_card_sales || 0}
- Time in Business: ${dealData.time_in_business_months} months
- State: ${dealData.state}
- Business Type: ${dealData.business_type}
- Franchise: ${dealData.franchise_business ? 'Yes' : 'No'}
- Seasonal: ${dealData.seasonal_business ? 'Yes' : 'No'}

${fundingPositionsSummary}

AVAILABLE LENDERS:
${lenderSummary}

Rank lenders 1-6 by best fit. Return ONLY the JSON array.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
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
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Extract JSON from response (may have markdown formatting)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', content);
      return [];
    }

    const matches: LenderMatchResult[] = JSON.parse(jsonMatch[0]);

    // Add key terms from matching lenders
    return matches.map((m) => {
      const lender = lenders.find((l) => l.id === m.lender_id || l.name === m.lender_name);
      return {
        ...m,
        lender_table: lenderTable,
        key_terms: {
          rates_range: lender?.rates_range || '',
          terms_range: `${lender?.terms_months || 12} months`,
          submission_requirements: lender?.submission_docs || '',
        },
      };
    });
  } catch (error) {
    console.error('AI ranking error:', error);
    return [];
  }
}
