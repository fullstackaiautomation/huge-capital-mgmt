-- Create lenders_mca table
CREATE TABLE IF NOT EXISTS lenders_mca (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  lender_name TEXT NOT NULL,
  paper TEXT,
  website TEXT,

  -- Contact Info
  iso_rep TEXT,
  phone TEXT,
  email TEXT,

  -- Requirements & Criteria
  minimum_credit_requirement INTEGER,
  minimum_monthly_revenue TEXT,
  max_nsf_negative_days TEXT,
  minimum_daily_balances TEXT,
  minimum_time_in_business TEXT,

  -- Loan Amounts
  minimum_loan_amount TEXT,
  max_loan_amount TEXT,

  -- Terms & Conditions
  terms TEXT,
  positions TEXT,
  buyouts TEXT,
  products_offered TEXT,

  -- Restrictions & Preferences
  states_restrictions TEXT,
  preferred_industries TEXT,
  restricted_industries TEXT,

  -- Submission Info
  submission_docs TEXT,
  submission_type TEXT,
  submission_process TEXT,

  -- Links & Documentation
  google_drive TEXT,
  note TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'archived'))
);

-- Create index on lender_name for faster searches
CREATE INDEX IF NOT EXISTS idx_lenders_mca_lender_name
  ON lenders_mca(lender_name);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_lenders_mca_status
  ON lenders_mca(status);

-- Create index on paper for filtering
CREATE INDEX IF NOT EXISTS idx_lenders_mca_paper
  ON lenders_mca(paper);

-- Enable Row Level Security
ALTER TABLE lenders_mca ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Allow all authenticated users to view all records
CREATE POLICY "Allow authenticated users to view all mca lenders"
  ON lenders_mca
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create RLS policy: Allow all authenticated users to insert records
CREATE POLICY "Allow authenticated users to insert mca lenders"
  ON lenders_mca
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Create RLS policy: Allow all authenticated users to update records
CREATE POLICY "Allow authenticated users to update mca lenders"
  ON lenders_mca
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Create RLS policy: Allow all authenticated users to delete records
CREATE POLICY "Allow authenticated users to delete mca lenders"
  ON lenders_mca
  FOR DELETE
  USING (auth.role() = 'authenticated');
