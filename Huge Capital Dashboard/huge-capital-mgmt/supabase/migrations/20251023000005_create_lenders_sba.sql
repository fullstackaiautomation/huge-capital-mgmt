-- Create lenders_sba table
CREATE TABLE IF NOT EXISTS lenders_sba (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  lender_name TEXT NOT NULL,
  website TEXT,

  -- Contact Info
  contact_person TEXT,
  phone TEXT,
  email TEXT,

  -- Submission Info
  submission_docs TEXT,
  submission_type TEXT,
  submission_process TEXT,

  -- Timeline & Availability
  timeline TEXT,
  states_available TEXT,

  -- Loan Details
  products_offered TEXT,
  minimum_loan_amount TEXT,
  max_loan_amount TEXT,

  -- Requirements
  credit_requirement INTEGER,
  use_of_funds TEXT,

  -- Industry Info
  preferred_industries TEXT,
  industry_restrictions TEXT,

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
CREATE INDEX IF NOT EXISTS idx_lenders_sba_lender_name
  ON lenders_sba(lender_name);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_lenders_sba_status
  ON lenders_sba(status);

-- Enable Row Level Security
ALTER TABLE lenders_sba ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Allow all authenticated users to view all records
CREATE POLICY "Allow authenticated users to view all sba lenders"
  ON lenders_sba
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create RLS policy: Allow all authenticated users to insert records
CREATE POLICY "Allow authenticated users to insert sba lenders"
  ON lenders_sba
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Create RLS policy: Allow all authenticated users to update records
CREATE POLICY "Allow authenticated users to update sba lenders"
  ON lenders_sba
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Create RLS policy: Allow all authenticated users to delete records
CREATE POLICY "Allow authenticated users to delete sba lenders"
  ON lenders_sba
  FOR DELETE
  USING (auth.role() = 'authenticated');
