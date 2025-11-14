import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface ExtractedDealData {
  deal: {
    legal_business_name: string;
    ein: string | null;
    business_type: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    phone: string | null;
    website: string | null;
    average_monthly_sales: number | null;
    average_monthly_card_sales: number | null;
    desired_loan_amount: number | null;
    reason_for_loan: string | null;
    loan_type: "MCA" | "Business LOC" | "Term Loan" | "SBA" | "DSCR" | "Equipment" | "Fix & Flip" | "CRE" | null;
    business_start_date: string | null;
    product_service_sold: string | null;
    seasonal_business: boolean;
  };
  owners: Array<{
    full_name: string;
    email?: string;
    street_address?: string;
    phone?: string;
    ownership_percent?: number;
  }>;
  statements: Array<{
    bank_name: string;
    statement_month: string;
    credits: number | null;
    debits: number | null;
    nsfs: number;
    overdrafts: number;
    average_daily_balance: number | null;
    deposit_count: number | null;
  }>;
  fundingPositions?: Array<{
    lender_name: string;
    amount: number;
    frequency: string;
  }>;
  confidence?: {
    deal: number;
    owners: number[];
    statements: number[];
  };
  missingFields?: string[];
}

interface LenderCriteria {
  id: string;
  lender_name: string;
  table_name: string;
  is_ifs: boolean;
  credit_requirement?: number;
  min_monthly_revenue?: string;
  min_time_in_business?: string;
  max_loan?: string;
  preferred_industries?: string;
  restricted_industries?: string;
  ineligible_states?: string;
  email?: string;
  website?: string;
}

interface MatchResult {
  lenderId: string;
  lenderName: string;
  lenderTable: string;
  isIfs: boolean;
  matchScore: number;
  approvalProbability: "very_high" | "high" | "medium" | "low";
  approvalCriteria: string[];
  estimatedProcessingTime?: string;
  estimatedRate?: string;
  documentationNeeded: string[];
  redFlags: string[];
  reasoning: string;
}

interface RecommendationsResponse {
  dealId: string;
  recommendations: MatchResult[];
  summary: {
    totalLendersMatched: number;
    topChoice: string;
    hugecapitalLenders: number;
    ifsLenders: number;
    nextSteps: string[];
  };
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

const LENDER_TABLES = [
  { type: "MCA", table: "lenders_mca", isIfs: false },
  { type: "Business LOC", table: "lenders_business_line_of_credit", isIfs: false },
  { type: "Term Loan", table: "lenders_term_loans", isIfs: false },
  { type: "SBA", table: "lenders_sba", isIfs: false },
  { type: "DSCR", table: "lenders_dscr", isIfs: false },
  { type: "Equipment", table: "lenders_equipment_financing", isIfs: false },
  { type: "Fix & Flip", table: "lenders_fix_flip", isIfs: false },
  { type: "CRE", table: "lenders_commercial_real_estate", isIfs: false },
  { type: "MCA Debt Restructuring", table: "lenders_mca_debt_restructuring", isIfs: false },
  { type: "Conventional TL/LOC", table: "lenders_conventional_tl_loc", isIfs: false },
];

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
      },
    });
  }

  const startTime = performance.now();
  let logId: string | null = null;
  let supabaseAdmin: any = null;
  let userId: string | null = null;
  let requestPayload: Record<string, any> | null = null;
  let requestSummary = "";
  let dealIdForLog: string | null = null;
  let responsePayload: RecommendationsResponse | null = null;

  try {
    const requestBody = await req.json();
    const { dealId, deal, loanType, brokerPreferences } = requestBody;

    dealIdForLog = dealId ?? null;

    if (!dealId || !deal || !loanType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: dealId, deal, loanType" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    const business = deal.deal || {};

    requestPayload = {
      dealId,
      loanType,
      business: {
        legal_business_name: business.legal_business_name,
        desired_loan_amount: business.desired_loan_amount,
        average_monthly_sales: business.average_monthly_sales,
        state: business.state,
        business_type: business.business_type,
      },
      owners: (deal.owners || []).map((owner: any) => ({
        full_name: owner.full_name,
        ownership_percent: owner.ownership_percent,
      })),
      statements_count: Array.isArray(deal.statements) ? deal.statements.length : 0,
      funding_positions_count: Array.isArray(deal.fundingPositions) ? deal.fundingPositions.length : 0,
      brokerPreferences,
    };

    requestSummary = `${business.legal_business_name || dealId} (${loanType})`;

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    // Initialize Supabase client
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const supabase = supabaseAdmin;

    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (supabaseAdmin && authHeader?.toLowerCase().startsWith("bearer ")) {
      try {
        const token = authHeader.replace(/^Bearer\s+/i, "");
        const {
          data: { user },
        } = await supabaseAdmin.auth.getUser(token);
        userId = user?.id ?? null;
      } catch (authError) {
        console.error("Failed to resolve auth user for logging:", authError);
      }
    }

    // Query lenders based on loan type
    const lenderTableConfig = LENDER_TABLES.find(
      (t) => t.type.toLowerCase() === loanType.toLowerCase()
    );

    if (!lenderTableConfig) {
      return new Response(
        JSON.stringify({ error: `Unknown loan type: ${loanType}` }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    // Query lenders from Supabase
    const { data: lenders, error: lenderError } = await supabase
      .from(lenderTableConfig.table)
      .select("*")
      .eq("status", "active")
      .limit(50);

    if (lenderError) {
      console.error("Error querying lenders:", lenderError);
      throw lenderError;
    }

    // Build lender list with table info
    const lenderList: LenderCriteria[] = (lenders || []).map((lender: any) => ({
      id: lender.id,
      lender_name: lender.lender_name,
      table_name: lenderTableConfig.table,
      is_ifs: lender.lender_name?.toLowerCase().includes("ifs") || false,
      credit_requirement: lender.credit_requirement || lender.minimum_credit_requirement,
      min_monthly_revenue: lender.min_monthly_revenue_amount || lender.minimum_monthly_revenue,
      min_time_in_business: lender.min_time_in_business || lender.minimum_time_in_business,
      max_loan: lender.max_loan || lender.max_loan_amount,
      preferred_industries: lender.preferred_industries,
      restricted_industries: lender.restricted_industries,
      ineligible_states: lender.ineligible_states || lender.states_restrictions,
      email: lender.email,
      website: lender.website,
    }));

    // Create system prompt for Claude
    const systemPrompt = `You are a Lending Expert for Huge Capital.

YOUR ROLE:
Analyze business deals and match them to the best lenders.
You specialize in understanding lender requirements and deal fit.

MATCHING STRATEGY:
1. PRIORITIZE Huge Capital lenders FIRST
2. ONLY use IFS lenders as BACKUP when we don't have 3+ qualifying Huge Capital options
3. ALWAYS note when a lender is an IFS lender in recommendations
4. Score each lender based on deal fit (0-100)

SCORING FACTORS (Total = 100):
- Loan amount fit (20 points): Is amount within lender limits?
- Revenue adequacy (20 points): Does monthly revenue meet minimum?
- Time in business (15 points): Is business old enough?
- Credit/profile (15 points): Does business profile match lender expectations?
- Industry fit (15 points): Is industry preferred or restricted?
- Geographic fit (10 points): Are they in states lender serves?
- Documentation quality (5 points): Do we have strong docs?

CONFIDENCE LEVELS:
- 90-100: Very High - Strong approval likelihood
- 70-89: High - Good fit, standard approval
- 50-69: Medium - Possible with additional docs
- <50: Low - Unlikely to approve, use as backup

RESPONSE FORMAT:
Return ONLY valid JSON matching this schema:
{
  "recommendations": [
    {
      "lenderId": string,
      "lenderName": string,
      "lenderTable": string,
      "isIfs": boolean,
      "matchScore": number (0-100),
      "approvalProbability": "very_high|high|medium|low",
      "approvalCriteria": string[],
      "documentationNeeded": string[],
      "redFlags": string[],
      "reasoning": string
    }
  ],
  "summary": {
    "totalLendersMatched": number,
    "topChoice": string,
    "hugecapitalLenders": number,
    "ifsLenders": number,
    "nextSteps": string[]
  }
}

EXAMPLES:

Example 1: Strong MCA Deal
Input: $150K MCA, $200K monthly revenue, clean credit, retail
Output:
- Kalamata: Score 95 (very_high)
- Balboa: Score 87 (high)
- [Other lenders]
→ "Excellent fit for MCA with strong monthly revenue"

Example 2: Challenged Deal
Input: $50K LOC, $35K monthly revenue, 3 months old, seasonal
Output:
- Lender A: Score 65 (medium)
- Lender B: Score 62 (medium)
→ "Limited options, may need additional documentation or time"`;

    const dealSummary = `
DEAL INFORMATION:
Business: ${deal.deal.legal_business_name}
Loan Type: ${loanType}
Loan Amount Requested: $${deal.deal.desired_loan_amount?.toLocaleString() || "Unknown"}
Monthly Revenue: $${deal.deal.average_monthly_sales?.toLocaleString() || "Unknown"}
Business Type: ${deal.deal.business_type || "Unknown"}
Industry: ${deal.deal.product_service_sold || "Unknown"}
Location: ${deal.deal.city}, ${deal.deal.state}
Time in Business: ${
      deal.deal.business_start_date
        ? Math.floor(
            (new Date().getTime() - new Date(deal.deal.business_start_date).getTime()) /
              (1000 * 60 * 60 * 24 * 30)
          ) + " months"
        : "Unknown"
    }

OWNERS:
${deal.owners.map((o: any) => `- ${o.full_name} (${o.ownership_percent || "?"}% ownership)`).join("\n")}

BANK STATEMENTS:
- Months Available: ${deal.statements.length}
- Average Daily Balance: $${deal.statements[0]?.average_daily_balance?.toLocaleString() || "N/A"}
- NSF Incidents (Total): ${deal.statements.reduce((sum: number, s: any) => sum + s.nsfs, 0)}
- Overdrafts (Total): ${deal.statements.reduce((sum: number, s: any) => sum + s.overdrafts, 0)}

EXISTING FUNDING:
${
  deal.fundingPositions && deal.fundingPositions.length > 0
    ? deal.fundingPositions
        .map((f: any) => `- ${f.lender_name}: $${f.amount.toLocaleString()} ${f.frequency}`)
        .join("\n")
    : "None identified"
}

AVAILABLE LENDERS (${lenderList.length} total):
${lenderList
  .map((l: LenderCriteria) => `- ${l.lender_name} ${l.is_ifs ? "(IFS)" : "(Huge Capital)"}`)
  .join("\n")}

BROKER PREFERENCES:
${brokerPreferences ? JSON.stringify(brokerPreferences, null, 2) : "None specified"}

MATCHING STRATEGY:
1. Score each lender on fit
2. Prioritize Huge Capital lenders
3. Include IFS only if needed for 3 options
4. Mark IFS lenders clearly
5. Provide 3-5 recommendations minimum`;

    const userPrompt = `Match this deal to the best lenders for approval:\n\n${dealSummary}`;

    // Call Claude to analyze and match
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", errorText);
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

    // Parse Claude's response
    let recommendations: RecommendationsResponse;
    try {
      recommendations = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse Claude response:", jsonStr);
      throw new Error("Failed to parse lender recommendations");
    }

    // Add dealId to response
    recommendations.dealId = dealId;

    responsePayload = recommendations;

    const duration = Math.round(performance.now() - startTime);
    const responseSummary = recommendations.summary?.topChoice
      ? `Top lender: ${recommendations.summary.topChoice}`
      : 'No lenders matched';

    logId =
      (await logAgentRun(supabaseAdmin, {
        agent_name: 'lending-expert-agent',
        agent_stage: 'lender_match',
        invocation_source: 'edge_function',
        user_id: userId,
        deal_id: dealId,
        request_payload: requestPayload,
        request_summary: requestSummary,
        response_payload: recommendations,
        response_summary: responseSummary,
        success: true,
        duration_ms: duration,
      })) ?? logId;

    // Store recommendations in database
    if (recommendations.recommendations && recommendations.recommendations.length > 0) {
      const matchRecords = recommendations.recommendations.map((match: MatchResult) => ({
        deal_id: dealId,
        lender_id: match.lenderId,
        lender_name: match.lenderName,
        lender_table: match.lenderTable,
        is_ifs: match.isIfs,
        match_score: match.matchScore,
        match_reasoning: match.reasoning,
      }));

      const { error: insertError } = await supabase
        .from("deal_lender_matches")
        .insert(matchRecords);

      if (insertError) {
        console.error("Error storing match results:", insertError);
        // Don't fail the request if storage fails
      }
    }

    return new Response(JSON.stringify({ ...recommendations, logId }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error matching deal to lenders:", error);

    const duration = Math.round(performance.now() - startTime);
    logId =
      (await logAgentRun(supabaseAdmin, {
        agent_name: 'lending-expert-agent',
        agent_stage: 'lender_match',
        invocation_source: 'edge_function',
        user_id: userId,
        deal_id: dealIdForLog,
        request_payload: requestPayload,
        request_summary: requestSummary,
        response_payload: responsePayload,
        response_summary: 'Error during lender matching',
        success: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        duration_ms: duration,
      })) ?? logId;

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        logId,
        recommendations: [],
        summary: {
          totalLendersMatched: 0,
          topChoice: "Error",
          hugecapitalLenders: 0,
          ifsLenders: 0,
          nextSteps: ["Try again or contact support"],
        },
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});