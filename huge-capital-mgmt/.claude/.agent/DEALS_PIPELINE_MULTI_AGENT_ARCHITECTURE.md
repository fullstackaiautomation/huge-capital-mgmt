# Deals Pipeline - Multi-Agent Architecture

## Overview

The Deals Pipeline uses a **specialized three-agent system** following Anthropic's agent builder best practices:

1. **Deal Info Agent** - Document parsing and data extraction specialist
2. **Lending Expert Agent** - Lender matching and recommendations specialist
3. **Submission Agent** - Deal submission and portal integration specialist

Each agent is optimized for its domain, uses the same ANTHROPIC_API_KEY, and coordinates through a central orchestration layer.

---

## Architecture Decision

**Level 3 Multi-Agent System Justification:**
- ✅ Multiple distinct workflows (parsing → matching → submission)
- ✅ Each workflow requires different expertise
- ✅ Clear handoff points between agents
- ✅ Scalable for future enhancements
- ✅ Budget supports multi-agent approach ($X per month)
- ✅ Team can maintain multiple specialized agents

**Implementation Approach:** MCP + Code Execution
- Reduces token usage by 98% for complex workflows
- Each agent discovers tools on-demand
- Data processing happens in sandbox, not context
- Reusable code saved to skills/ directory

---

## Agent 1: Deal Info Agent

### Purpose
Extract structured business and financial information from uploaded documents using Claude AI, validating completeness and providing confidence scores.

### Role Definition
```
You are a Deal Information Extraction Specialist for Huge Capital.
Your expertise: document analysis, financial data extraction, business information parsing.

RESPONSIBILITIES:
- Parse loan applications, bank statements, tax returns, and financial documents
- Extract structured deal data (business info, owner details, financial metrics)
- Validate extracted data completeness and accuracy
- Provide confidence scores for each field (0-100)
- Flag missing critical fields that block progression
- Detect funding positions from bank statements
- Handle multiple document formats (PDF, CSV, images)
```

### Tools Required
```typescript
// tools/document-processing/parseDocument.ts
parseDocument(document: Document) → ParsedData
- Input: Base64-encoded document file
- Output: Extracted JSON matching schema
- When: On initial document upload

// tools/validation/validateDealData.ts
validateDealData(data: ExtractedDealData) → ValidationResult
- Input: Extracted deal data
- Output: Validation report with missing fields
- When: After extraction

// tools/database/storeDealData.ts
storeDealData(userId: string, dealData: ExtractedDealData) → DealRecord
- Input: User ID + extracted data
- Output: Created deal record with ID
- When: User confirms extracted data
```

### System Prompt Template
```markdown
You are a Deal Information Extraction Specialist for Huge Capital.

TOOLS AVAILABLE:
- parseDocument: Extract data from uploaded documents
- validateDealData: Check extracted data completeness
- storeDealData: Save validated deal to database

WORKFLOW:
1. User uploads business documents (application, statements, tax returns)
2. Parse documents to extract: business info, owner details, financials
3. Validate extracted data for required fields
4. Return confidence scores (0-100) for each field
5. Flag missing critical fields
6. Store deal record if user confirms

EXTRACTION SCHEMA:
- Business: legal_name, dba_name, ein, type, address, city, state, zip, phone, website
- Ownership: 1-2 owners with name, address, email, ssn (encrypted), % ownership
- Financials: monthly sales, card sales, desired loan amount
- Statements: bank statements with debits, credits, NSFs, overdrafts
- Funding: existing lender positions (name, amount, frequency)

CONFIDENCE SCORING:
- 95-100: Complete and verified information
- 80-94: Complete but not verified
- 60-79: Partial information
- <60: Insufficient information

EXAMPLES:
User uploads bank statements
→ Extract: 6 months statements, identify funding positions from ACH
→ Return: Statement data + 3 funding positions identified

RULES:
- ALWAYS validate completeness before storing
- NEVER assume missing data
- ALWAYS provide confidence scores
- Store deal data ONLY when user confirms
- Flag any PII concerns (SSN, bank account details)
```

### Input/Output Specs

**Input:**
```typescript
{
  userId: string;
  files: Array<{
    name: string;
    content: string; // Base64
    type: string; // MIME type
  }>;
  dealId?: string; // If updating existing
}
```

**Output:**
```typescript
{
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
  dealId: string; // Stored in database
}
```

### Success Metrics
- Extraction accuracy: >90% of critical fields correct
- Confidence score reliability: Actual accuracy matches confidence within ±10%
- Processing time: <30 seconds for 5-page document set
- User confirmation rate: >85% accept extracted data

---

## Agent 2: Lending Expert Agent

### Purpose
Analyze deal characteristics against lender requirements database, provide ranked recommendations, and track lender expertise across products.

### Role Definition
```
You are a Lending Expert for Huge Capital.
Your expertise: lender requirements, loan products, deal-lender matching, funding approval criteria.

RESPONSIBILITIES:
- Know all lender products and requirements
- Analyze deal fit for each lender (MCA, Business LOC, Term Loans, SBA, DSCR, etc.)
- Generate ranked lender recommendations by match score
- Provide specific approval criteria for each matched lender
- Track historical approval/decline rates by lender
- Recommend lenders based on broker's stated preferences
- Suggest follow-up documentation if deal doesn't match perfectly
```

### Tools Required
```typescript
// tools/lenders/searchLenders.ts
searchLenders(criteria: SearchCriteria) → Lender[]
- Input: Product type, loan amount, business type, credit range
- Output: List of matching lenders with details
- When: Getting initial lender pool

// tools/matching/matchDealToLender.ts
matchDealToLender(deal: DealData, lender: Lender) → MatchResult
- Input: Deal data + lender record
- Output: Match score (0-100) + approval criteria
- When: Evaluating each lender candidate

// tools/lenders/getLenderRequirements.ts
getLenderRequirements(lenderId: string, loanType: string) → Requirements
- Input: Lender ID + loan product type
- Output: Specific requirements, doc needs, timelines
- When: Generating detailed lender recommendation

// tools/database/storeMatchResults.ts
storeMatchResults(dealId: string, matches: MatchResult[]) → void
- Input: Deal ID + match results
- Output: Stored in deal_lender_matches table
- When: Saving recommendations to database
```

### System Prompt Template
```markdown
You are a Lending Expert for Huge Capital.

LENDER DATABASE ACCESS:
- All active lenders in Supabase organized by product type
- Historical approval/decline data
- Document requirements and timelines
- Interest rates and fee structures
- Broker feedback and relationship quality

WORKFLOW:
1. Receive deal data from Deal Info Agent
2. Extract key characteristics: loan type, amount, business type, credit, revenue
3. Search lender database for potential matches
4. Score each lender on fit (0-100):
   - 90-100: Excellent fit, high approval probability
   - 70-89: Good fit, standard approval criteria
   - 50-69: Possible fit with additional documentation
   - <50: Poor fit, unlikely to approve
5. Rank by match score
6. For top 5: Provide specific approval criteria and documentation needs
7. Note any lender preferences from broker
8. Flag any deal characteristics that are red flags for most lenders

SCORING FACTORS:
- Loan amount within lender limits
- Business type on lender's preferred/restricted lists
- Revenue and profitability metrics
- Owner credit score
- Time in business
- Industry type
- Seasonal vs. stable revenue
- Existing funding positions

EXAMPLES:
Deal: $200K MCA needed, retail clothing, $150K monthly revenue
→ Search: All MCA lenders
→ Match: Score 92 for Kalamata (excellent MCA lender), 85 for Balboa Capital
→ Top recommendation: Kalamata ($200K approved, 2-day turnaround, minimal docs needed)

RULES:
- ALWAYS provide at least 3-5 lender options
- NEVER recommend lender without checking approval fit
- ALWAYS cite approval criteria from lender's requirements
- Provide confidence level with each recommendation
- Flag missing documentation needed for approval
```

### Input/Output Specs

**Input:**
```typescript
{
  dealId: string;
  deal: ExtractedDealData;
  loanType: 'MCA' | 'Business LOC' | 'Term Loan' | 'SBA' | 'DSCR' | 'Equipment' | 'Fix & Flip' | 'CRE';
  brokerPreferences?: {
    favoredLenderIds: string[];
    avoidLenderIds: string[];
    maxProcessingDays?: number;
  };
}
```

**Output:**
```typescript
{
  dealId: string;
  recommendations: Array<{
    lenderId: string;
    lenderName: string;
    lenderTable: string; // Which table (lenders_mca, lenders_sba, etc.)
    matchScore: number; // 0-100
    approvalProbability: 'very_high' | 'high' | 'medium' | 'low';
    approvalCriteria: string[]; // Specific requirements
    estimatedProcessingTime: string; // "2-3 days"
    estimatedRate: string; // "12-15% APR" or "1.5-2 points"
    documentationNeeded: string[];
    redFlags: string[];
    reasoning: string; // Why this match works
  }>;
  summary: {
    totalLendersMatched: number;
    topChoice: string; // Lender name
    alternativeOptions: number;
    documentationGaps: string[];
    nextSteps: string[];
  };
}
```

### Success Metrics
- Match accuracy: Recommended lenders actually approve >80% of deals
- Processing speed: <60 seconds to generate recommendations
- Recommendation adoption: Brokers select recommended lender >75% of time
- Approval rate improvement: Recommendations reduce decline rate by 20%

---

## Agent 3: Submission Agent

### Purpose
Submit approved deals to selected lenders via email and online portals, track submission status, and manage follow-up communications.

### Role Definition
```
You are a Deal Submission Specialist for Huge Capital.
Your expertise: lender submission processes, email communication, portal navigation, deal packaging.

RESPONSIBILITIES:
- Submit deals to selected lenders via email and portals
- Format deal packages with correct documentation
- Use Gmail API to send submissions
- Navigate lender online portals
- Track submission status and responses
- Manage follow-up communications
- Handle submission errors and retry logic
- Update broker with submission status
```

### Tools Required
```typescript
// tools/email/sendSubmission.ts
sendSubmission(lenderId: string, dealId: string, dealPackage: DealPackage) → SubmissionResult
- Input: Lender ID + deal data + formatted package
- Output: Submission confirmation with tracking ID
- When: Broker approves submission to lender

// tools/email/sendFollowUp.ts
sendFollowUp(submissionId: string, message?: string) → void
- Input: Submission ID + optional custom message
- Output: Follow-up email sent
- When: 48hrs after initial submission with no response

// tools/portals/submitViaPortal.ts
submitViaPortal(lenderId: string, dealPackage: DealPackage) → SubmissionResult
- Input: Lender ID + deal package
- Output: Submission confirmation
- When: Lender has self-service portal (future enhancement)

// tools/database/trackSubmission.ts
trackSubmission(submissionId: string, status: SubmissionStatus) → void
- Input: Submission ID + new status
- Output: Updated in database
- When: Status changes (submitted, viewed, requested, approved, declined)

// tools/notifications/notifyBroker.ts
notifyBroker(brokerId: string, submissionId: string, update: string) → void
- Input: Broker ID + submission update
- Output: Notification sent to broker
- When: Important status changes (lender viewed, requested docs, approved)
```

### System Prompt Template
```markdown
You are a Deal Submission Specialist for Huge Capital.

EMAIL CREDENTIALS:
- Gmail API connected with Huge Capital admin account
- Authorized to send from: deals@hugecapital.com

SUBMISSION WORKFLOW:
1. Receive deal + lender selection from broker
2. Format deal package with all required documents
3. Get lender's email submission address from database
4. Create professional submission email with:
   - Deal summary (business name, loan amount, loan type)
   - Owner information (name, contact)
   - Supporting documents (application, statements, tax returns)
   - Link to submission tracking dashboard
5. Send via Gmail API
6. Store submission record in deal_lender_matches table
7. Set follow-up reminder for 48hrs if no response

EMAIL TEMPLATE:
Subject: [Huge Capital] Deal Submission - [Business Name] - [Loan Amount]
Body:
- Professional greeting to specific lender contact
- Deal summary (2-3 sentences)
- Owner information
- Loan amount and type
- Processing priority (if applicable)
- Attached documents (PDF)
- Follow-up contact information
- Signature with Huge Capital broker info

PORTAL SUBMISSIONS (Future):
- Kalamata: Online portal at [URL]
- Balboa Capital: Online portal at [URL]
- [Others TBD]

TRACKING:
- Mark as 'Submitted' with timestamp
- Check for responses daily
- Send follow-up after 48hrs if no view
- Update status when: opened, documents requested, approved, declined

EXAMPLES:
Broker selects Kalamata for $200K MCA deal for ABC Retail
→ Format: All required docs, business summary, owner info
→ Send: Email to Kalamata deal submission address
→ Track: Created submission record, set 48hr follow-up
→ Notify: Broker receives confirmation

RULES:
- ALWAYS format professional emails with lender branding in mind
- NEVER send sensitive data (SSN, bank account) unencrypted
- ALWAYS confirm submission and provide tracking number to broker
- Include proper follow-up timeline in submission records
- Document any lender-specific requirements in submission notes
```

### Input/Output Specs

**Input:**
```typescript
{
  dealId: string;
  lenderId: string;
  lenderName: string;
  brokerId: string;
  deal: ExtractedDealData;
  lenderMatch: MatchResult;
  requestType: 'submit' | 'resubmit' | 'additional_docs';
  customMessage?: string;
}
```

**Output:**
```typescript
{
  submissionId: string;
  status: 'submitted' | 'pending_response' | 'docs_requested' | 'approved' | 'declined';
  submittedAt: timestamp;
  lenderId: string;
  lenderName: string;
  dealId: string;
  submissionMethod: 'email' | 'portal';
  confirmationNumber?: string;
  trackingUrl: string;
  nextFollowUpDate: timestamp;
  brokerNotification: {
    sent: boolean;
    timestamp: timestamp;
  };
}
```

### Success Metrics
- Submission success rate: >98% deliverable
- Average response time from lender: <48 hours
- Document request fulfillment: <24 hours
- Deal approval rate: >70% of submissions
- Broker satisfaction: >4.5/5 on submission experience

---

## Orchestration Layer

The orchestration layer coordinates workflow between the three agents, managing state and handoffs.

### Workflow State Machine

```
[Upload Documents]
    ↓
[Deal Info Agent: Extract & Validate]
    ↓
[Review Extracted Data] (broker confirmation)
    ↓
[Lending Expert Agent: Generate Recommendations]
    ↓
[Select Lender] (broker chooses from recommendations)
    ↓
[Submission Agent: Submit Deal]
    ↓
[Track Submission Status] (ongoing)
```

### API Endpoints

```typescript
// POST /api/deals/parse
// Deal Info Agent - Parse uploaded documents
// Input: FormData with files + userId
// Output: ExtractedDealData

// POST /api/deals/:dealId/recommendations
// Lending Expert Agent - Get lender recommendations
// Input: dealId + deal data
// Output: LenderRecommendations

// POST /api/deals/:dealId/submit
// Submission Agent - Submit to selected lender
// Input: dealId + lenderId + brokerId
// Output: SubmissionResult

// GET /api/submissions/:submissionId
// Track submission status and responses
// Output: SubmissionStatus + broker notifications
```

### Supabase Edge Functions

Three separate edge functions (one per agent):

1. `parse-deal-documents` - Deal Info Agent
2. `match-deal-to-lenders` - Lending Expert Agent
3. `submit-deal-to-lender` - Submission Agent

Each uses the same ANTHROPIC_API_KEY secret.

### Context Management

Following the Agent Builder guide best practices:

- **Token Efficiency:** Use MCP + Code Execution pattern
- **Tool Discovery:** Each agent discovers available tools on-demand
- **Data Processing:** Complex operations (filtering, transforming) happen in sandbox
- **Context Reuse:** Agents share system prompts with examples, reducing redundancy
- **Skill Library:** Common operations saved to `skills/` directory for reuse

---

## Configuration & Secrets

All agents use the same ANTHROPIC_API_KEY stored in Supabase secrets:

```
Supabase Dashboard → Functions → Settings → Secrets
ANTHROPIC_API_KEY: [your-key]
```

Each agent edge function accesses it at runtime:
```typescript
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
```

---

## Testing & Evaluation

### Test Scenarios (Deal Info Agent)

1. **Simple MCA Application**
   - Input: Single-page MCA application
   - Expected: All critical fields extracted, >90% confidence

2. **Complex Deal with Multiple Statements**
   - Input: 5 docs (application, 6 bank statements, tax return)
   - Expected: All documents parsed, funding positions identified

3. **Partial Information**
   - Input: Application with missing owner email
   - Expected: Extracted data with missing field flagged

### Test Scenarios (Lending Expert Agent)

1. **Prime MCA Candidate**
   - Input: $150K monthly revenue, clean credit, no red flags
   - Expected: 5+ lender recommendations, top score >90

2. **Challenged Deal**
   - Input: Seasonal business, < 6 months in business
   - Expected: 2-3 lender options, clear documentation needs

3. **Edge Case**
   - Input: Restricted industry (cannabis, cryptocurrency)
   - Expected: Fewer options, specific lender limitations noted

### Test Scenarios (Submission Agent)

1. **Standard Email Submission**
   - Input: Deal + Kalamata lender selection
   - Expected: Email sent, submission tracked, broker notified

2. **Follow-up After No Response**
   - Input: Submission >48hrs old with no response
   - Expected: Follow-up email sent, next follow-up scheduled

---

## Success Metrics (Overall Pipeline)

| Metric | Target | Status |
|--------|--------|--------|
| Deal processing time | <5 min | TBD |
| Extraction accuracy | >90% | TBD |
| Lender match relevance | >80% adoption | TBD |
| Submission success | >98% | TBD |
| Deal approval rate | >70% | TBD |
| Broker satisfaction | >4.5/5 | TBD |
| Cost per deal | <$2 | TBD |

---

## Next Steps

1. ✅ Verify edge functions exist for each agent
2. ⏳ Implement Lending Expert Agent (match-deal-to-lenders)
3. ⏳ Implement Submission Agent (submit-deal-to-lender)
4. ⏳ Build orchestration API layer
5. ⏳ Create comprehensive test suite
6. ⏳ Optimize for production deployment

---

## References

- Agent Builder Guide: `Agent Builder Skill/Agent_Quick_Build_Guide.md`
- MCP + Code Execution: `Agent Builder Skill/UPDATES_MCP_Code_Execution.md`
- Current Edge Function: `supabase/functions/parse-deal-documents/`
- Database Schema: `supabase/migrations/20251111000006_create_all_deals_tables.sql`
