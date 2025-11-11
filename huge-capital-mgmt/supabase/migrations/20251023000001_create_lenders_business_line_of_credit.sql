-- Create lenders_business_line_of_credit table
CREATE TABLE IF NOT EXISTS lenders_business_line_of_credit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  lender_name TEXT NOT NULL,
  bank_non_bank TEXT NOT NULL,
  website TEXT,

  -- Contact Info
  iso_contacts TEXT,
  phone TEXT,
  email TEXT,

  -- Requirements & Criteria
  credit_requirement INTEGER,
  credit_used TEXT,
  min_time_in_business TEXT,
  minimum_deposit_count INTEGER,
  min_monthly_revenue_amount TEXT,
  min_avg_daily_balance TEXT,

  -- Product & Limits
  max_loan TEXT,
  positions TEXT,
  products_offered TEXT,

  -- Terms & Fees
  terms TEXT,
  payments TEXT,
  draw_fees TEXT,

  -- Industry Info
  preferred_industries TEXT,
  restricted_industries TEXT,
  ineligible_states TEXT,

  -- Submission Info
  submission_docs TEXT,
  submission_type TEXT,
  submission_process TEXT,

  -- Links & Documentation
  drive_link TEXT,
  notes TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'archived'))
);

-- Create index on lender_name for faster searches
CREATE INDEX IF NOT EXISTS idx_lenders_business_line_of_credit_lender_name
  ON lenders_business_line_of_credit(lender_name);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_lenders_business_line_of_credit_status
  ON lenders_business_line_of_credit(status);

-- Create index on bank_non_bank for filtering
CREATE INDEX IF NOT EXISTS idx_lenders_business_line_of_credit_bank_non_bank
  ON lenders_business_line_of_credit(bank_non_bank);

-- Enable Row Level Security
ALTER TABLE lenders_business_line_of_credit ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Allow all authenticated users to view all records
CREATE POLICY "Allow authenticated users to view all business line of credit lenders"
  ON lenders_business_line_of_credit
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create RLS policy: Allow all authenticated users to insert records
CREATE POLICY "Allow authenticated users to insert business line of credit lenders"
  ON lenders_business_line_of_credit
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Create RLS policy: Allow all authenticated users to update records
CREATE POLICY "Allow authenticated users to update business line of credit lenders"
  ON lenders_business_line_of_credit
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Create RLS policy: Allow all authenticated users to delete records
CREATE POLICY "Allow authenticated users to delete business line of credit lenders"
  ON lenders_business_line_of_credit
  FOR DELETE
  USING (auth.role() = 'authenticated');
