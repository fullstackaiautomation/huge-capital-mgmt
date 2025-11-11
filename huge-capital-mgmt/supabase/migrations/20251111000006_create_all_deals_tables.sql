-- Combined migration for all deals-related tables
-- This replaces individual migrations with one clean creation

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS deal_funding_positions CASCADE;
DROP TABLE IF EXISTS deal_lender_matches CASCADE;
DROP TABLE IF EXISTS deal_bank_statements CASCADE;
DROP TABLE IF EXISTS deal_owners CASCADE;
DROP TABLE IF EXISTS deals CASCADE;

-- Create deals table - Main deal tracking
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

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
  franchise_business BOOLEAN DEFAULT FALSE,
  seasonal_business BOOLEAN DEFAULT FALSE,
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

-- Create indexes on deals
CREATE INDEX idx_deals_user_id ON deals(user_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_loan_type ON deals(loan_type);
CREATE INDEX idx_deals_created_at ON deals(created_at DESC);

-- Enable RLS on deals
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deals
CREATE POLICY "Users can view their own deals"
  ON deals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create deals"
  ON deals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deals"
  ON deals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deals"
  ON deals FOR DELETE
  USING (auth.uid() = user_id);

-- Create deal_owners table
CREATE TABLE deal_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  owner_number INTEGER NOT NULL,

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

  -- Sensitive Information
  drivers_license_number TEXT,
  date_of_birth DATE,
  ssn_encrypted TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_owner_number CHECK (owner_number IN (1, 2)),
  CONSTRAINT unique_owner_per_deal UNIQUE (deal_id, owner_number)
);

CREATE INDEX idx_deal_owners_deal_id ON deal_owners(deal_id);
CREATE INDEX idx_deal_owners_owner_number ON deal_owners(deal_id, owner_number);

ALTER TABLE deal_owners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view owners of their deals"
  ON deal_owners FOR SELECT
  USING (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));

CREATE POLICY "Users can create owners for their deals"
  ON deal_owners FOR INSERT
  WITH CHECK (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));

CREATE POLICY "Users can update owners of their deals"
  ON deal_owners FOR UPDATE
  USING (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()))
  WITH CHECK (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete owners of their deals"
  ON deal_owners FOR DELETE
  USING (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));

-- Create deal_bank_statements table
CREATE TABLE deal_bank_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,

  -- Statement Information
  statement_id TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  statement_month TEXT NOT NULL,
  statement_file_url TEXT,

  -- Financial Metrics
  credits NUMERIC,
  debits NUMERIC,
  nsfs INTEGER DEFAULT 0,
  overdrafts INTEGER DEFAULT 0,
  average_daily_balance NUMERIC,
  deposit_count INTEGER,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_deal_bank_statements_deal_id ON deal_bank_statements(deal_id);
CREATE INDEX idx_deal_bank_statements_statement_month ON deal_bank_statements(deal_id, statement_month);

ALTER TABLE deal_bank_statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view statements of their deals"
  ON deal_bank_statements FOR SELECT
  USING (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));

CREATE POLICY "Users can create statements for their deals"
  ON deal_bank_statements FOR INSERT
  WITH CHECK (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));

CREATE POLICY "Users can update statements of their deals"
  ON deal_bank_statements FOR UPDATE
  USING (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()))
  WITH CHECK (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete statements of their deals"
  ON deal_bank_statements FOR DELETE
  USING (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));

-- Create deal_funding_positions table
CREATE TABLE deal_funding_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  statement_id UUID NOT NULL REFERENCES deal_bank_statements(id) ON DELETE CASCADE,

  -- Lender Information
  lender_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  frequency TEXT NOT NULL,

  -- Detection Data
  detected_dates TEXT[] NOT NULL,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_deal_funding_positions_statement_id ON deal_funding_positions(statement_id);

ALTER TABLE deal_funding_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view funding positions of their deals"
  ON deal_funding_positions FOR SELECT
  USING (statement_id IN (
    SELECT dbs.id FROM deal_bank_statements dbs
    INNER JOIN deals d ON dbs.deal_id = d.id
    WHERE d.user_id = auth.uid()
  ));

CREATE POLICY "Users can create funding positions for their deals"
  ON deal_funding_positions FOR INSERT
  WITH CHECK (statement_id IN (
    SELECT dbs.id FROM deal_bank_statements dbs
    INNER JOIN deals d ON dbs.deal_id = d.id
    WHERE d.user_id = auth.uid()
  ));

CREATE POLICY "Users can update funding positions of their deals"
  ON deal_funding_positions FOR UPDATE
  USING (statement_id IN (
    SELECT dbs.id FROM deal_bank_statements dbs
    INNER JOIN deals d ON dbs.deal_id = d.id
    WHERE d.user_id = auth.uid()
  ))
  WITH CHECK (statement_id IN (
    SELECT dbs.id FROM deal_bank_statements dbs
    INNER JOIN deals d ON dbs.deal_id = d.id
    WHERE d.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete funding positions of their deals"
  ON deal_funding_positions FOR DELETE
  USING (statement_id IN (
    SELECT dbs.id FROM deal_bank_statements dbs
    INNER JOIN deals d ON dbs.deal_id = d.id
    WHERE d.user_id = auth.uid()
  ));

-- Create deal_lender_matches table
CREATE TABLE deal_lender_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,

  -- Lender Information
  lender_table TEXT NOT NULL,
  lender_id UUID NOT NULL,
  lender_name TEXT NOT NULL,

  -- Match Information
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  match_reasoning TEXT,

  -- Submission Tracking
  selected_by_broker BOOLEAN DEFAULT FALSE,
  submission_status TEXT DEFAULT 'Not Started',
  submission_date TIMESTAMP,
  response_date TIMESTAMP,
  lender_response TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_deal_lender_matches_deal_id ON deal_lender_matches(deal_id);
CREATE INDEX idx_deal_lender_matches_selected ON deal_lender_matches(deal_id, selected_by_broker);
CREATE INDEX idx_deal_lender_matches_submission_status ON deal_lender_matches(submission_status);

ALTER TABLE deal_lender_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lender matches of their deals"
  ON deal_lender_matches FOR SELECT
  USING (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));

CREATE POLICY "Users can create lender matches for their deals"
  ON deal_lender_matches FOR INSERT
  WITH CHECK (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));

CREATE POLICY "Users can update lender matches of their deals"
  ON deal_lender_matches FOR UPDATE
  USING (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()))
  WITH CHECK (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete lender matches of their deals"
  ON deal_lender_matches FOR DELETE
  USING (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));
