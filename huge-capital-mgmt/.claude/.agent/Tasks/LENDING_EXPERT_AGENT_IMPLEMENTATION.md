# Lending Expert Agent - Implementation Guide

## Quick Reference

**Status:** Phase 0 (Not yet implemented)
**Implementation Location:** `supabase/functions/match-deal-to-lenders/index.ts` (create new)
**Model:** Claude 3.5 Sonnet (claude-3-5-sonnet-20250514)
**API Key:** ANTHROPIC_API_KEY (shared)
**Database:** Lender tables (lenders_mca, lenders_sba, lenders_term_loans, etc.)

---

## Architecture Decision: MCP + Code Execution

This agent will use **MCP + Code Execution pattern** because:
- ✅ Accesses 10+ lender databases (MCP requirement met)
- ✅ Complex matching logic (scoring algorithms)
- ✅ Data processing in sandbox (filtering, ranking lenders)
- ✅ Can reduce 150K tokens → 2K tokens for complex workflows

### Implementation Steps:
1. Create tool modules in `./tools/` directory
2. Agent discovers tools on filesystem
3. Agent writes TypeScript code to compose tools
4. Data processing happens in sandbox (not in context)
5. Return only final recommendations

---

## Phase 1: Create Edge Function Scaffolding

### File Structure
```
supabase/functions/match-deal-to-lenders/
├── index.ts                 # Main handler
├── deno.json               # Deno config
├── tools/
│   ├── lenders/
│   │   ├── searchMcaLenders.ts
│   │   ├── searchSbaLenders.ts
│   │   ├── searchTermLoanLenders.ts
│   │   ├── getLenderRequirements.ts
│   │   └── index.ts
│   ├── matching/
│   │   ├── calculateMatchScore.ts
│   │   ├── validateDealFit.ts
│   │   └── index.ts
│   └── database/
│       ├── storeMatchResults.ts
│       └── index.ts
└── skills/
    └── commonMatching.ts    # Reusable matching logic
```

### deno.json
```json
{
  "imports": {
    "https://deno.land/std@0.208.0/": "https://deno.land/std@0.208.0/",
    "supabase": "https://esm.sh/@supabase/supabase-js@2"
  }
}
```

### Base index.ts Structure
```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface DealData {
  // From Deal Info Agent
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
    franchise_business: boolean;
    seasonal_business: boolean;
    peak_sales_month: string | null;
    business_start_date: string | null;
    product_service_sold: string | null;
    average_monthly_sales: number | null;
    average_monthly_card_sales: number | null;
    desired_loan_amount: number | null;
    reason_for_loan: string | null;
    loan_type: 'MCA' | 'Business LOC' | null;
  };
  owners: Array<{
    full_name: string;
    email: string | null;
    street_address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    phone: string | null;
    date_of_birth: string | null;
    ownership_percent: number | null;
    drivers_license_number: string | null;
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
}

interface MatchResult {
  lenderId: string;
  lenderName: string;
  lenderTable: string;
  matchScore: number;
  approvalProbability: 'very_high' | 'high' | 'medium' | 'low';
  approvalCriteria: string[];
  estimatedProcessingTime: string;
  estimatedRate: string;
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
    alternativeOptions: number;
    documentationGaps: string[];
    nextSteps: string[];
  };
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
    const { dealId, deal, loanType, brokerPreferences } = requestBody;

    if (!dealId || !deal || !loanType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: dealId, deal, loanType' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    // Call Claude to analyze deal and generate recommendations
    // [Implementation follows below]

    return new Response(
      JSON.stringify(recommendations),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    console.error('Error matching deal to lenders:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## Phase 2: Implement Matching Logic

### Step 1: Create Tool Modules

#### tools/matching/calculateMatchScore.ts
```typescript
export interface MatchScoreCriteria {
  loanAmountFit: number;        // 0-20 points
  businessTypeFit: number;       // 0-15 points
  revenueAdequacy: number;       // 0-15 points
  creditProfile: number;         // 0-15 points
  timeInBusiness: number;        // 0-10 points
  industryAlignment: number;     // 0-10 points
  fundingPositions: number;      // 0-5 points
  documentationQuality: number;  // 0-10 points
}

export function calculateMatchScore(criteria: MatchScoreCriteria): number {
  const total = Object.values(criteria).reduce((sum, val) => sum + val, 0);
  return Math.min(100, total); // Cap at 100
}

export function getApprovalProbability(
  score: number
): 'very_high' | 'high' | 'medium' | 'low' {
  if (score >= 85) return 'very_high';
  if (score >= 70) return 'high';
  if (score >= 55) return 'medium';
  return 'low';
}
```

#### tools/lenders/getLenderCriteria.ts
```typescript
export interface LenderCriteria {
  id: string;
  name: string;
  table: string;
  loanTypes: string[];
  minLoanAmount: number;
  maxLoanAmount: number;
  preferredIndustries: string[];
  restrictedIndustries: string[];
  minMonthlyRevenue: number;
  maxTimeInBusiness?: number; // months
  minTimeInBusiness?: number; // months
  minCreditScore?: number;
  documentationRequired: string[];
  processingTimeDays: string;
  estimatedRate: string;
  approvalRate: number; // percentage
}

// Mock lender database - would come from Supabase in production
export const LENDER_DATABASE: Record<string, LenderCriteria> = {
  'kalamata-001': {
    id: 'kalamata-001',
    name: 'Kalamata',
    table: 'lenders_mca',
    loanTypes: ['MCA'],
    minLoanAmount: 5000,
    maxLoanAmount: 500000,
    preferredIndustries: ['retail', 'food_service', 'e-commerce', 'services'],
    restrictedIndustries: ['cannabis', 'cryptocurrency', 'gambling', 'adult'],
    minMonthlyRevenue: 10000,
    minTimeInBusiness: 6,
    documentationRequired: [
      'Business application',
      '3-6 months bank statements',
      'Business registration documents',
    ],
    processingTimeDays: '2-3',
    estimatedRate: '1.5-2.5 points',
    approvalRate: 0.85,
  },
  // Add more lenders...
};

export function getLenderCriteria(lenderId: string): LenderCriteria | null {
  return LENDER_DATABASE[lenderId] || null;
}

export function getAllLenders(): LenderCriteria[] {
  return Object.values(LENDER_DATABASE);
}
```

#### tools/matching/validateDealFit.ts
```typescript
export interface DealFitValidation {
  isQualified: boolean;
  criticalIssues: string[];
  warnings: string[];
  recommendations: string[];
}

export function validateDealFit(
  deal: any,
  lender: any
): DealFitValidation {
  const criticalIssues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Check loan amount
  if (deal.desired_loan_amount < lender.minLoanAmount) {
    criticalIssues.push(
      `Loan amount $${deal.desired_loan_amount} below minimum $${lender.minLoanAmount}`
    );
  }
  if (deal.desired_loan_amount > lender.maxLoanAmount) {
    criticalIssues.push(
      `Loan amount $${deal.desired_loan_amount} exceeds maximum $${lender.maxLoanAmount}`
    );
  }

  // Check revenue
  if (deal.average_monthly_sales < lender.minMonthlyRevenue) {
    warnings.push(
      `Monthly revenue $${deal.average_monthly_sales} below preference $${lender.minMonthlyRevenue}`
    );
  }

  // Check industry restrictions
  if (lender.restrictedIndustries.includes(deal.product_service_sold?.toLowerCase())) {
    criticalIssues.push(
      `Industry "${deal.product_service_sold}" is restricted by this lender`
    );
  }

  // Check time in business
  if (lender.minTimeInBusiness) {
    const monthsInBusiness = calculateMonthsInBusiness(deal.business_start_date);
    if (monthsInBusiness < lender.minTimeInBusiness) {
      warnings.push(
        `Business only ${monthsInBusiness} months old, lender prefers ${lender.minTimeInBusiness}+ months`
      );
    }
  }

  return {
    isQualified: criticalIssues.length === 0,
    criticalIssues,
    warnings,
    recommendations,
  };
}

function calculateMonthsInBusiness(startDate: string | null): number {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const now = new Date();
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
}
```

### Step 2: Implement Claude-Based Matching

```typescript
// In index.ts main handler

const systemPrompt = `You are a Lending Expert for Huge Capital.

YOUR ROLE:
Analyze business deals against available lenders to find the best matches.
You have access to our lender database and matching tools.

WORKFLOW:
1. Receive deal information from Deal Info Agent
2. Analyze deal characteristics (loan amount, business type, revenue, credit)
3. Query available lenders matching the loan type
4. Score each lender based on fit (0-100)
5. Validate deal meets lender requirements
6. Rank by match score
7. Provide detailed recommendations with approval criteria

SCORING SYSTEM (0-100):
- 90-100: Excellent fit, very high approval probability
  → Recommended as top choice
  → All criteria met, strong approval indicators

- 70-89: Good fit, high approval probability
  → Include as primary option
  → Most criteria met, minor gaps acceptable

- 50-69: Possible fit, medium approval probability
  → Include if needed
  → Some criteria unmet, may need additional documentation

- <50: Poor fit, low approval probability
  → Don't recommend unless no other options
  → Multiple unmet criteria

SCORING FACTORS:
- Loan amount within lender limits (20 points)
- Business type on preferred list (15 points)
- Monthly revenue adequate (15 points)
- Owner credit/profile (15 points)
- Time in business (10 points)
- Industry alignment (10 points)
- Existing funding positions (5 points)
- Documentation quality (10 points)

RECOMMENDATIONS SHOULD INCLUDE:
- Match score (0-100)
- Approval probability (very_high/high/medium/low)
- Specific approval criteria from lender
- Required documentation
- Estimated processing time
- Estimated rate/terms
- Any red flags or concerns
- Why this lender is a good match

RESPONSE FORMAT:
Return JSON with:
{
  "recommendations": [
    {
      "lenderId": string,
      "lenderName": string,
      "matchScore": number,
      "approvalProbability": "very_high|high|medium|low",
      "approvalCriteria": string[],
      "estimatedProcessingTime": string,
      "estimatedRate": string,
      "documentationNeeded": string[],
      "redFlags": string[],
      "reasoning": string
    },
    ...
  ],
  "summary": {
    "totalLendersMatched": number,
    "topChoice": string,
    "alternativeOptions": number,
    "documentationGaps": string[],
    "nextSteps": string[]
  }
}`;

const userPrompt = `Analyze this deal and provide lender recommendations:

DEAL INFORMATION:
Business: ${deal.deal.legal_business_name}
Loan Type: ${loanType}
Loan Amount: $${deal.deal.desired_loan_amount}
Monthly Revenue: $${deal.deal.average_monthly_sales}
Business Type: ${deal.deal.business_type}
Industry: ${deal.deal.product_service_sold}
Time in Business: ${calculateMonthsInBusiness(deal.deal.business_start_date)} months
Locations: ${deal.deal.city}, ${deal.deal.state}

OWNER INFORMATION:
Count: ${deal.owners.length}
${deal.owners.map((o: any, i: number) => `Owner ${i + 1}: ${o.full_name}, ${o.ownership_percent}% ownership`).join('\n')}

BANK STATEMENTS:
Months Available: ${deal.statements.length}
Avg Daily Balance: $${deal.statements[0]?.average_daily_balance || 'N/A'}
NSF Incidents: ${deal.statements.reduce((sum: number, s: any) => sum + s.nsfs, 0)}
Overdrafts: ${deal.statements.reduce((sum: number, s: any) => sum + s.overdrafts, 0)}

EXISTING FUNDING:
${deal.fundingPositions?.map((f: any) => `- ${f.lender_name}: $${f.amount} ${f.frequency}`).join('\n') || 'None identified'}

BROKER PREFERENCES:
${brokerPreferences ? JSON.stringify(brokerPreferences, null, 2) : 'None specified'}

Provide 3-5 lender recommendations ranked by match score.`;

const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-3-5-sonnet-20250514',
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
  throw new Error(`Anthropic API error: ${response.status}`);
}

const data = await response.json();
const content = data.content[0].text;
const recommendations: RecommendationsResponse = JSON.parse(content);
```

---

## Phase 3: Database Integration

### Query Lenders from Supabase

```typescript
import { createClient } from 'supabase';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

async function queryLendersByType(loanType: string): Promise<any[]> {
  const tableMap: Record<string, string> = {
    MCA: 'lenders_mca',
    'Business LOC': 'lenders_business_line_of_credit',
    'Term Loan': 'lenders_term_loans',
    SBA: 'lenders_sba',
    DSCR: 'lenders_dscr',
    Equipment: 'lenders_equipment_financing',
    'Fix & Flip': 'lenders_fix_flip',
    CRE: 'lenders_commercial_real_estate',
  };

  const table = tableMap[loanType];
  if (!table) {
    throw new Error(`Unknown loan type: ${loanType}`);
  }

  const { data, error } = await supabase.from(table).select('*');
  if (error) throw error;
  return data || [];
}

async function storeMatchResults(
  dealId: string,
  userId: string,
  matches: MatchResult[]
): Promise<void> {
  const matchRecords = matches.map((match) => ({
    deal_id: dealId,
    user_id: userId,
    lender_table: match.lenderTable,
    lender_id: match.lenderId,
    lender_name: match.lenderName,
    match_score: match.matchScore,
    match_reasoning: match.reasoning,
  }));

  const { error } = await supabase
    .from('deal_lender_matches')
    .insert(matchRecords);

  if (error) throw error;
}
```

---

## Testing & Validation

### Test Case 1: Prime MCA Deal
```
Input:
{
  dealId: "test-001",
  deal: {
    legal_business_name: "ABC Retail LLC",
    desired_loan_amount: 150000,
    average_monthly_sales: 200000,
    business_type: "LLC",
    product_service_sold: "retail",
    business_start_date: "2020-01-01"
  },
  loanType: "MCA"
}

Expected:
✅ 5+ lender recommendations
✅ Top recommendation score: 85+
✅ Kalamata in top 3
✅ Approval probability: very_high/high
```

### Test Case 2: Challenged Deal
```
Input:
{
  dealId: "test-002",
  deal: {
    legal_business_name: "New Business Inc",
    desired_loan_amount: 50000,
    average_monthly_sales: 35000,
    business_type: "C-Corp",
    business_start_date: "2024-11-01"  // Brand new
  },
  loanType: "Business LOC"
}

Expected:
✅ Fewer recommendations (2-3)
✅ Score: 50-70 range
✅ Warnings about time in business
✅ Documentation needs highlighted
```

---

## Deployment Checklist

- [ ] Create `supabase/functions/match-deal-to-lenders/` directory
- [ ] Implement tool modules in `tools/`
- [ ] Implement matching logic in `index.ts`
- [ ] Add Supabase query functions
- [ ] Test with all test cases
- [ ] Deploy: `npx supabase functions deploy match-deal-to-lenders`
- [ ] Verify ANTHROPIC_API_KEY secret exists
- [ ] Test end-to-end API call
- [ ] Add to UI: Button to "Get Lender Recommendations"

---

## Next Steps

1. ✅ Create edge function scaffold
2. ⏳ Implement matching logic
3. ⏳ Query real lender database
4. ⏳ Add scoring algorithm
5. ⏳ Test with real deals
6. ⏳ Optimize for performance
