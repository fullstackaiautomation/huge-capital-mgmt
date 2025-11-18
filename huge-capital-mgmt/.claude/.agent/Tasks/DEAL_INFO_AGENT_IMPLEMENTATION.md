# Deal Info Agent - Implementation Guide

## Quick Reference

**Status:** Phase 1 (Core function exists, optimization needed)
**Current Implementation:** `supabase/functions/parse-deal-documents/index.ts`
**Model:** Claude 3.5 Sonnet (claude-3-5-sonnet-20250514)
**API Key:** ANTHROPIC_API_KEY (shared across all agents)

---

## Phase 1: Optimize Existing Edge Function

The `parse-deal-documents` function exists but needs enhancements:

### Current State ✅
```typescript
// supabase/functions/parse-deal-documents/index.ts
- Receives base64 files
- Calls Claude API
- Returns structured deal data
- CORS headers configured correctly
- Error handling with fallback to mock data
```

### Issues to Fix ❌
1. Anthropic API error 404 on latest model
   - **Fix Applied:** Updated model to `claude-3-5-sonnet-20250514` ✓
   - **Status:** Needs testing

2. System prompt could be more specific
   - **Current:** Generic extraction prompt
   - **Needed:** Field-specific validation and confidence scoring

3. No intermediate validation step
   - **Current:** Returns raw extraction
   - **Needed:** Validate completeness before returning

### Enhancement Plan

#### Step 1: Improve System Prompt
Replace generic extraction prompt with specialized instructions:

```typescript
const systemPrompt = `You are a Deal Information Extraction Specialist for Huge Capital, a business lending company.

YOUR EXPERTISE:
- Business loan applications and structures
- Bank statement analysis (identifying funding positions, cash flow patterns)
- Tax return interpretation
- Financial statement analysis
- Owner credential verification
- Regulatory compliance (EIN validation, business entity types)

EXTRACTION TASK:
You will receive business loan application documents. Your job is to:
1. Extract ONLY verified information from documents
2. Provide confidence scores (0-100) for each field
3. Flag missing critical fields
4. Identify and extract existing funding positions
5. Detect any red flags or concerns

FIELD DEFINITIONS:

DEAL INFORMATION:
- legal_business_name: Exact legal name from business registration
- dba_name: "Doing Business As" name if different from legal name
- ein: Employee Identification Number (9 digits: XX-XXXXXXX)
- business_type: Type of entity (LLC, S-Corp, C-Corp, Sole Proprietor, Partnership)
- address: Physical business location street address
- city, state, zip: Business location (must match address)
- phone: Business phone number
- website: Business website URL
- franchise_business: Boolean - is this a franchise operation?
- seasonal_business: Boolean - does business have seasonal revenue patterns?
- peak_sales_month: If seasonal, which month is peak (January, February, etc.)
- business_start_date: Date business started (YYYY-MM-DD format)
- product_service_sold: What does the business sell/provide?
- franchise_units_percent: If franchise, what % of revenue from franchise units?
- average_monthly_sales: Total monthly revenue (numeric, no currency symbols)
- average_monthly_card_sales: Monthly credit card revenue
- desired_loan_amount: Amount requested (numeric)
- reason_for_loan: Business purpose of loan request
- loan_type: "MCA" or "Business LOC" (required to determine)

OWNER INFORMATION (1-2 owners):
For each owner extract:
- owner_number: 1 or 2 (order of extraction)
- full_name: Complete legal name
- street_address: Owner's residential address (not business address)
- city, state, zip: Owner's residential location
- phone: Owner's contact phone
- email: Owner's email address
- ownership_percent: Percentage of business owned (numeric 0-100)
- drivers_license_number: DL number (format: state-specific)
- date_of_birth: Owner's birth date (YYYY-MM-DD format)

BANK STATEMENTS:
For each statement extract:
- statement_id: Unique identifier (e.g., "Chase-Jan2025")
- bank_name: Name of financial institution
- statement_month: Month covered (YYYY-MM format)
- credits: Total deposits/credits (numeric)
- debits: Total withdrawals/debits (numeric)
- nsfs: Number of non-sufficient funds incidents
- overdrafts: Number of overdraft instances
- average_daily_balance: Account balance average
- deposit_count: Number of deposits made

FUNDING POSITIONS (from bank statements):
Look for regular recurring withdrawals that indicate:
- Merchant cash advance payments (MCA)
- Business line of credit payments
- Equipment financing payments
- Factor/invoice financing payments

For each identified funding:
- lender_name: Company name making the withdrawal
- amount: Daily/weekly/monthly payment amount
- frequency: "daily", "weekly", or "monthly"
- detected_dates: Array of dates this withdrawal appears

CONFIDENCE SCORING:
Score each field 0-100:
- 95-100: Field clearly stated in document, verified, no ambiguity
- 80-94: Field present in document, reasonable interpretation
- 60-79: Field inferred from context, some interpretation needed
- 40-59: Field partially present, significant assumptions
- <40: Field not found, cannot confidently extract

MISSING FIELDS:
Flag these critical fields if missing (block deal progression):
- legal_business_name (required)
- ein (required)
- address (required)
- city, state, zip (required)
- desired_loan_amount (required)
- loan_type (required)
- owner full_name (required, at least 1)

Flag these important fields if missing (warnings):
- average_monthly_sales (important for lending decision)
- phone (contact verification)
- email (contact verification)
- ownership_percent (required for multiple owners)

RED FLAGS TO NOTE:
- Missing required documentation
- Inconsistent information across documents
- Negative cash flow indicators
- High number of NSFs or overdrafts
- Seasonal business without adequate reserves
- Recent business formation (<6 months)
- Known high-risk industries

RESPONSE FORMAT:
Return ONLY valid JSON matching the schema exactly.
Include all fields, use null for missing values.
Do NOT invent or assume data.
Every field must have confidence score assigned.`;
```

#### Step 2: Add Field Validation
```typescript
interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
  criticalBlockers: string[];
}

function validateExtractedData(data: ExtractedDealData): ValidationResult {
  const missingFields: string[] = [];
  const warnings: string[] = [];
  const criticalBlockers: string[] = [];

  // Critical fields (must have)
  if (!data.deal.legal_business_name) criticalBlockers.push('Legal business name');
  if (!data.deal.ein) criticalBlockers.push('EIN');
  if (!data.deal.address) criticalBlockers.push('Business address');
  if (!data.deal.city || !data.deal.state || !data.deal.zip) criticalBlockers.push('Business location');
  if (!data.deal.desired_loan_amount) criticalBlockers.push('Desired loan amount');
  if (!data.deal.loan_type) criticalBlockers.push('Loan type');
  if (!data.owners || data.owners.length === 0) criticalBlockers.push('Owner information');

  // Important fields (warnings)
  if (!data.deal.average_monthly_sales) warnings.push('Average monthly sales');
  if (!data.deal.phone) warnings.push('Business phone');
  if (data.owners[0] && !data.owners[0].email) warnings.push('Owner email address');

  return {
    isValid: criticalBlockers.length === 0,
    missingFields: [...criticalBlockers, ...warnings],
    warnings,
    criticalBlockers,
  };
}
```

#### Step 3: Implement Confidence Scoring Logic
```typescript
function analyzeConfidence(data: ExtractedDealData): ConfidenceAnalysis {
  let dealScore = 0;
  const criticalFields = [
    'legal_business_name', 'ein', 'address',
    'city', 'state', 'zip', 'desired_loan_amount', 'loan_type'
  ];

  const presentCriticalFields = criticalFields.filter(field =>
    data.deal[field as keyof typeof data.deal]
  ).length;

  dealScore = Math.round((presentCriticalFields / criticalFields.length) * 100);

  // Owner confidence
  const ownerScores = data.owners.map(owner => {
    const ownerFields = ['full_name', 'street_address', 'city', 'state', 'zip', 'email'];
    const presentFields = ownerFields.filter(field => owner[field as keyof typeof owner]).length;
    return Math.round((presentFields / ownerFields.length) * 100);
  });

  // Statement confidence
  const statementScores = data.statements.map(stmt => {
    const stmtFields = ['bank_name', 'statement_month', 'credits', 'debits'];
    const presentFields = stmtFields.filter(field => stmt[field as keyof typeof stmt]).length;
    return Math.round((presentFields / stmtFields.length) * 100);
  });

  return {
    deal: dealScore,
    owners: ownerScores,
    statements: statementScores,
  };
}
```

---

## Phase 2: Implement MCP + Code Execution Pattern

### Goal
Reduce token usage and improve data processing efficiency.

### Implementation
1. **Create tool modules** in `supabase/functions/parse-deal-documents/tools/`
   - Document parsing tool
   - Data validation tool
   - Confidence scoring tool

2. **Update system prompt** to reference filesystem tools
   ```markdown
   Available tools in ./tools/:
   - parseDocument.ts: Extract data from documents
   - validateData.ts: Validate extracted data
   - scoreConfidence.ts: Calculate confidence metrics
   ```

3. **Allow agent to write code** for data composition
   ```typescript
   // Agent writes code like:
   const parsed = await parseDocument({ file: base64Content });
   const validated = await validateData(parsed);
   const scored = await scoreConfidence(validated);
   ```

### Benefits
- Reduced context usage (150K → 2K tokens)
- Faster data processing
- Reusable validation logic
- Better separation of concerns

---

## Testing & Validation

### Test Case 1: Simple Application
```
File: test-simple-mca.pdf
- Single page MCA application
- All required fields present
- 2 owners with complete info

Expected Output:
✅ legal_business_name: "ABC Retail LLC"
✅ ein: "12-3456789"
✅ desired_loan_amount: 150000
✅ confidence.deal: 95+
✅ missingFields: [] (empty)
```

### Test Case 2: Bank Statements
```
File: statements-jan-through-jun-2025.pdf
- 6 month bank statements
- Multiple funding withdrawals visible

Expected Output:
✅ statements: [6 entries, one per month]
✅ fundingPositions: [2-3 identified positions]
✅ confidence.statements: 85-95 range
```

### Test Case 3: Incomplete Data
```
File: partial-application.pdf
- Missing owner email
- No monthly sales figure

Expected Output:
✅ missingFields: ["Average monthly sales", "Owner email"]
✅ warnings: ["These fields needed for underwriting"]
✅ confidence.deal: 70-80 (partial info)
```

---

## Deployment Checklist

- [ ] Update system prompt with specialized instructions
- [ ] Implement validateExtractedData() function
- [ ] Implement confidence scoring logic
- [ ] Test with all 3 test cases
- [ ] Deploy to Supabase: `npx supabase functions deploy parse-deal-documents`
- [ ] Verify ANTHROPIC_API_KEY secret is set
- [ ] Test end-to-end from UI
- [ ] Update documentation with any changes

---

## Monitoring & Metrics

Track these metrics after deployment:

```
Daily Dashboard:
- Extraction accuracy: % of fields correctly extracted
- Confidence calibration: Actual accuracy vs. reported confidence
- Processing time: Average seconds to parse document set
- User confirmation rate: % of users accepting extracted data

Weekly Review:
- Common missing fields: Which fields most frequently absent?
- Problematic documents: Document types that fail extraction
- Model improvements: Does confidence scoring improve?
```

---

## Troubleshooting

**Issue:** API returns 404 error
**Solution:** Verify model name is `claude-3-5-sonnet-20250514` (latest)

**Issue:** Extracted data missing fields
**Solution:** Check system prompt includes all field definitions with examples

**Issue:** Confidence scores don't match actual accuracy
**Solution:** Review confidence scoring logic, adjust weighting

**Issue:** Processing very slow
**Solution:** Reduce document size; implement document chunking
