-- Create lenders_term_loans table
CREATE TABLE IF NOT EXISTS lenders_term_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  lender_name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,

  -- Submission Info
  submission_docs TEXT,
  submission_process TEXT,
  timeline TEXT,

  -- Availability & Products
  states_available TEXT,
  products_offered TEXT,

  -- Loan Terms
  min_loan_amount TEXT,
  max_loan_amount TEXT,
  use_of_funds TEXT,

  -- Requirements
  credit_requirement TEXT,

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

CREATE INDEX IF NOT EXISTS idx_lenders_term_loans_lender_name ON lenders_term_loans(lender_name);
CREATE INDEX IF NOT EXISTS idx_lenders_term_loans_status ON lenders_term_loans(status);
CREATE INDEX IF NOT EXISTS idx_lenders_term_loans_relationship ON lenders_term_loans(relationship);

ALTER TABLE lenders_term_loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view all term loans lenders" ON lenders_term_loans FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert term loans lenders" ON lenders_term_loans FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update term loans lenders" ON lenders_term_loans FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete term loans lenders" ON lenders_term_loans FOR DELETE USING (auth.role() = 'authenticated');
