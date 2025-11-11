-- Create lenders_conventional_tl_loc table
CREATE TABLE IF NOT EXISTS lenders_conventional_tl_loc (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  lender_name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,

  -- Availability & Submission
  states_available TEXT,
  submission_process TEXT,
  docs_required TEXT,

  -- Timeline & Terms
  timeline TEXT,
  terms TEXT,
  rates TEXT,

  -- Loan Terms
  min_loan_amount TEXT,
  max_loan_amount TEXT,

  -- Requirements
  credit_requirement TEXT,
  banking_relationship_required TEXT,
  bank_account_opened_to_fund TEXT,
  use_of_funds TEXT,

  -- Restrictions
  preferred_industries TEXT,
  restricted_industries TEXT,

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'archived')),
  relationship TEXT DEFAULT 'Huge Capital' CHECK (relationship IN ('Huge Capital', 'IFS'))
);

CREATE INDEX IF NOT EXISTS idx_lenders_conventional_tl_loc_lender_name ON lenders_conventional_tl_loc(lender_name);
CREATE INDEX IF NOT EXISTS idx_lenders_conventional_tl_loc_status ON lenders_conventional_tl_loc(status);
CREATE INDEX IF NOT EXISTS idx_lenders_conventional_tl_loc_relationship ON lenders_conventional_tl_loc(relationship);

ALTER TABLE lenders_conventional_tl_loc ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view all conventional tl loc lenders" ON lenders_conventional_tl_loc FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert conventional tl loc lenders" ON lenders_conventional_tl_loc FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update conventional tl loc lenders" ON lenders_conventional_tl_loc FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete conventional tl loc lenders" ON lenders_conventional_tl_loc FOR DELETE USING (auth.role() = 'authenticated');
