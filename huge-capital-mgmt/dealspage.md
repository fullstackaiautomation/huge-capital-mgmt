# Deal Submission & Pipeline Management - Implementation Plan

## Overview
Create a comprehensive Deals Pipeline page with AI-powered deal submission that parses documents, extracts data, matches lenders, and tracks deal status through the entire lifecycle.

## Phase 1: Core Features (v1 Launch)

### 1. Database Schema & Storage Setup

#### New Supabase Tables

**`deals` table** - Main deal tracking
```sql
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Business Information
  legal_business_name TEXT NOT NULL,
  dba_name TEXT,
  ein TEXT NOT NULL,
  business_type TEXT,

  -- Address Information
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  phone TEXT,
  website TEXT,

  -- Business Details
  franchise_business BOOLEAN,
  seasonal_business BOOLEAN,
  peak_sales_month TEXT,
  business_start_date DATE,
  time_in_business_months INTEGER,

  -- Products & Services
  product_service_sold TEXT,
  franchise_units_percent NUMERIC,

  -- Financial Information
  average_monthly_sales NUMERIC,
  average_monthly_card_sales NUMERIC,
  desired_loan_amount NUMERIC NOT NULL,
  reason_for_loan TEXT,

  -- Deal Classification
  loan_type TEXT NOT NULL, -- 'MCA', 'Business LOC'
  status TEXT DEFAULT 'New', -- New, Analyzing, Matched, Submitted, Pending, Approved, Funded, Declined

  -- Document Links
  application_google_drive_link TEXT,
  statements_google_drive_link TEXT,

  -- Metadata
  submission_date TIMESTAMP,

  CONSTRAINT valid_loan_type CHECK (loan_type IN ('MCA', 'Business LOC')),
  CONSTRAINT valid_status CHECK (status IN ('New', 'Analyzing', 'Matched', 'Submitted', 'Pending', 'Approved', 'Funded', 'Declined'))
);
```

**`deal_owners` table** - Business owners (1-2 per deal)
```sql
CREATE TABLE deal_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  owner_number INTEGER NOT NULL, -- 1 or 2

  -- Personal Information
  full_name TEXT NOT NULL,
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  phone TEXT,
  email TEXT,

  -- Ownership Details
  ownership_percent NUMERIC,

  -- Sensitive Information (encrypted)
  drivers_license_number TEXT,
  date_of_birth DATE,
  ssn_encrypted TEXT, -- Use Supabase vault encryption

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_owner_number CHECK (owner_number IN (1, 2)),
  CONSTRAINT unique_owner_per_deal UNIQUE (deal_id, owner_number)
);
```

**`deal_bank_statements` table** - Individual statements
```sql
CREATE TABLE deal_bank_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,

  -- Statement Information
  statement_id TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  statement_month TEXT NOT NULL, -- YYYY-MM format
  statement_file_url TEXT,

  -- Financial Metrics
  credits NUMERIC, -- Total deposits
  debits NUMERIC, -- Total withdrawals
  nsfs INTEGER, -- Negative days
  overdrafts INTEGER, -- Overdraft count
  average_daily_balance NUMERIC,
  deposit_count INTEGER,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**`deal_funding_positions` table** - Recurring lender payments
```sql
CREATE TABLE deal_funding_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  statement_id UUID NOT NULL REFERENCES deal_bank_statements(id) ON DELETE CASCADE,

  -- Lender Information
  lender_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  frequency TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'

  -- Detection Data
  detected_dates TEXT[] NOT NULL, -- Array of payment dates

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**`deal_lender_matches` table** - AI match results
```sql
CREATE TABLE deal_lender_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,

  -- Lender Information
  lender_table TEXT NOT NULL, -- 'lenders_mca', 'lenders_business_line_of_credit'
  lender_id UUID NOT NULL,
  lender_name TEXT NOT NULL,

  -- Match Information
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  match_reasoning TEXT, -- AI explanation

  -- Submission Tracking
  selected_by_broker BOOLEAN DEFAULT FALSE,
  submission_status TEXT, -- 'Not Started', 'Prepared', 'Submitted', 'Pending', 'Approved', 'Declined'
  submission_date TIMESTAMP,
  response_date TIMESTAMP,
  lender_response TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Supabase Storage Buckets
- `deal-documents` - Temporary storage for uploaded files
- RLS policies: authenticated users can only access own deals' documents

#### Google Drive Integration
- Service account with `drive.file` scope
- Auto-create folder structure: `New Deals/{legal_business_name} - {submission_date}/`
- Upload all documents to this folder
- Store Drive links in `deals` and `deal_bank_statements` tables

---

### 2. Deals Pipeline Page (`/deals`)

**Main View - Deal Cards Grid:**
- Filterable by status, loan type, broker, date range
- Sort by created date, loan amount, status
- Card shows: Business name, loan type, amount, status badge, created date, broker
- Quick actions: View details, Edit, Delete
- Status pipeline visualization at top (count per status)

**Top Action Button:**
- **"+ New Deal"** button → Opens deal submission modal/page

---

### 3. New Deal Submission Flow

#### Step 1: Upload Documents
- Drag & drop zone for 2-10 files (PDFs, CSVs, images)
- File type validation: `.pdf`, `.csv`, `.png`, `.jpg`
- Shows upload progress with file list
- Files upload to Supabase Storage temporarily
- Auto-create Google Drive folder in background
- Move files to Drive after upload complete

#### Step 2: AI Document Analysis (Real-time via Supabase Edge Function)
- **Edge Function:** `parse-deal-documents`
- **Model:** Claude 3.5 Sonnet (most capable for complex extraction)
- **Parallel processing:**
  - Application PDF → Extract all application fields
  - Bank Statements → OCR + table extraction (credits, debits, NSFs, dates, balances)
  - Tax Returns (if present) → Extract revenue, business info
- Progress indicator updates as documents are processed
- Returns structured JSON matching database schema

#### Step 3: AI Validation & Review
- **Edge Function:** `validate-deal-data`
- Second Claude pass to validate extracted data:
  - Cross-check owner info matches across docs
  - Verify loan amount vs monthly revenue (reasonableness)
  - Flag missing required fields
  - Calculate time in business from start date
  - Calculate 3-month averages from statements
- Shows extracted data in editable form with confidence scores
- Broker can review/edit any field before saving

#### Step 4: Save Deal
- Save to `deals`, `deal_owners`, `deal_bank_statements` tables
- Update status → "New" or "Ready for Matching"
- Show success message with "Match Lenders" button

---

### 4. Lender Matching System

**Trigger:** Broker clicks "Match Lenders" on deal

**Edge Function: `match-lenders`**

#### Step 1 - Rule-Based Filtering
- Query appropriate lender table(s) based on loan type
- Filter by hard requirements:
  - Loan amount (min/max range)
  - Credit score requirements
  - State restrictions (not in blacklist)
  - Time in business minimum
  - Monthly revenue minimum
  - Industry restrictions (not in restricted list)
- Narrows to ~10-20 qualifying lenders

#### Step 2 - AI Ranking (Claude)
- Send deal details + filtered lenders to Claude
- Prompt: "Analyze this deal and rank these lenders by fit. Consider: funding positions, cash flow health, industry match, seasonal factors, loan purpose. Return top 3-6 with match scores (0-100) and detailed reasoning for each."
- Claude returns ranked matches with explanations

#### Step 3 - Display Results
- Show lender cards with:
  - Lender name, logo (if available)
  - Match score (visual gauge)
  - "Why this lender?" explanation
  - Key terms (rates, terms, submission requirements)
  - Checkbox to select for submission
- Broker selects 3-6 lenders
- Click "Prepare Submissions"

---

### 5. Submission Package Generation

**Edge Function: `prepare-submissions`**

For each selected lender:
1. Pull `submission_docs`, `submission_process`, `email` from lender table
2. Create formatted email template:
   - Subject: "Deal Submission - {Business Name} - ${loan_amount}"
   - Body: Professional intro, deal summary, owner info, financial highlights
   - Attach required documents from Google Drive
3. Generate submission checklist:
   - [ ] Application completed
   - [ ] 3 months bank statements attached
   - [ ] Owner IDs attached (if required)
   - [ ] Tax returns attached (if required)
4. Display prepared submission for review

**Manual Send (v1):**
- Show "Copy Email" button → copies formatted text to clipboard
- Show "Open Email Client" → opens `mailto:` link pre-filled
- Broker manually sends each submission
- Mark as "Submitted" in database after confirmation

---

### 6. Deal Detail View

**Full deal dashboard showing:**
- Business & owner information (editable)
- Financial summary (statements data, 3-month averages)
- Document links (Google Drive folder)
- Lender matches table with status tracking
- Activity timeline (created, analyzed, matched, submitted, responses)
- Notes section for broker comments

---

### 7. Bank Statement Analysis Deep Dive

#### Special Handling for Bank Statement Parsing
- Claude prompt engineering for multi-bank statement formats:
  - Chase, Bank of America, Wells Fargo, etc.
  - Handle PDF tables, scanned images, CSV formats
- Extract transaction-level data first
- Calculate metrics:
  - **Credits** (deposits) - sum all positive transactions
  - **Debits** (withdrawals) - sum all negative transactions
  - **NSFs** - count days ending balance < $0
  - **Overdrafts** - count overdraft fees or negative balances
  - **Average daily balance** - mean of daily ending balances
  - **Deposit count** - count deposit transactions

#### Funding Position Detection
- ML pattern matching for recurring payments
- Group by: same amount ±$50, regular intervals (daily/weekly)
- Flag as likely lender payback
- Calculate total funding position burden

#### Statement Summary View (like IFS screenshot)
- Table with columns: Month, Credits, Debits, NSFs, Overdrafts, Avg Balance, File Size
- "Last 3 Months" summary row at bottom
- "Add Statement" button for manual uploads
- Edit button per row for corrections

---

## Technical Implementation Details

### Edge Functions Architecture

**`supabase/functions/parse-deal-documents/index.ts`**
- Accept file URLs from Storage
- Call Claude 3.5 Sonnet with vision for PDFs
- Return structured JSON matching schema

**`supabase/functions/validate-deal-data/index.ts`**
- Accept extracted JSON
- Claude validation pass
- Return confidence scores + corrections

**`supabase/functions/match-lenders/index.ts`**
- Rule-based filtering SQL queries
- Claude ranking with detailed prompt
- Return top matches with reasoning

**`supabase/functions/prepare-submissions/index.ts`**
- Generate email templates per lender
- Format submission packages
- Return ready-to-send content

### Google Drive Integration
- Use Google Drive API with service account
- Scopes: `drive.file` (create folders, upload files)
- Store service account JSON in Supabase secrets
- Helper functions in `src/services/googleDrive.ts`

### UI Components
```
src/pages/Deals.tsx - Main pipeline view
src/pages/DealDetail.tsx - Individual deal view
src/components/Deals/NewDealModal.tsx - Submission flow
src/components/Deals/DocumentUpload.tsx - File upload
src/components/Deals/DealForm.tsx - Editable form
src/components/Deals/StatementAnalysis.tsx - IFS-style table
src/components/Deals/LenderMatches.tsx - Match results
src/components/Deals/SubmissionPackage.tsx - Email preview
```

---

## Phase 2 Features (Future)
- Automated email sending (SMTP/SendGrid)
- Lender portal API integrations
- SMS notifications for status updates
- Deal analytics dashboard
- Google Sheets export for funded deals
- Multi-broker collaboration
- Document version control
- Automated follow-ups

---

## Security Considerations
- Encrypt SSNs in database (Supabase vault)
- RLS policies on all deal tables (users see only their deals)
- Google Drive folder permissions (private to organization)
- Temporary file storage cleanup (delete from Storage after Drive upload)
- API key rotation (Claude, Google Drive)
- Audit log for sensitive data access

---

## Success Metrics
- Document parsing accuracy >95%
- Average time to submit: <10 minutes (vs ~45 min manual)
- Lender match relevance: broker satisfaction survey
- Deals tracked in pipeline: all active deals
- Successful submissions: track approval rates per lender

---

## Estimated Timeline
- Database setup: 1 day
- Google Drive integration: 1 day
- Document upload UI: 1 day
- Edge functions (parse, validate, match): 3 days
- Deals pipeline page: 2 days
- Deal detail view: 2 days
- Lender matching UI: 2 days
- Submission package generation: 1 day
- Testing & refinement: 3 days

**Total: ~2-3 weeks for full Phase 1**

---

## Action Items Checklist

### Setup Phase
- [ ] Create database migrations for all tables
- [ ] Configure Supabase Storage buckets
- [ ] Set up Google Drive service account
- [ ] Add environment variables for API keys
- [ ] Create RLS policies for all tables

### Backend Phase
- [ ] Build `parse-deal-documents` edge function
- [ ] Build `validate-deal-data` edge function
- [ ] Build `match-lenders` edge function
- [ ] Build `prepare-submissions` edge function
- [ ] Create `src/services/googleDrive.ts` helper
- [ ] Create `src/services/dealSubmission.ts` helper

### Frontend Phase
- [ ] Create `/deals` page layout
- [ ] Build deal cards grid component
- [ ] Build new deal submission modal/workflow
- [ ] Build document upload component
- [ ] Build deal form component
- [ ] Build statement analysis component
- [ ] Build lender matches display
- [ ] Build submission package preview
- [ ] Create `/deals/:id` detail page

### Testing & Refinement
- [ ] Test document parsing accuracy
- [ ] Test lender matching logic
- [ ] Test Google Drive integration
- [ ] Performance testing (large files)
- [ ] Security audit
- [ ] User acceptance testing with brokers

---

## Notes
- Bank statement parsing will be the most complex - may need iterative refinement with real documents
- Keep detailed logs of Claude API calls for quality improvement
- Store original documents in Google Drive for audit trail
- Consider rate limiting on API calls
- Plan for API costs (Claude vision, Google Drive API)
