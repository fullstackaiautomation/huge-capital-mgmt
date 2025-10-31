-- Create lenders_new_construction table
CREATE TABLE IF NOT EXISTS lenders_new_construction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  lender_name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,

  -- Submission Info
  submission_process TEXT,

  -- Loan Terms
  min_loan_amount TEXT,
  max_loan_amount TEXT,

  -- Requirements
  max_ltv TEXT,
  max_ltc TEXT,
  max_units TEXT,
  credit_requirement TEXT,
  rural TEXT,

  -- Restrictions
  states TEXT,

  -- Links
  drive_link TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'archived')),
  relationship TEXT DEFAULT 'Huge Capital' CHECK (relationship IN ('Huge Capital', 'IFS'))
);

CREATE INDEX IF NOT EXISTS idx_lenders_new_construction_lender_name ON lenders_new_construction(lender_name);
CREATE INDEX IF NOT EXISTS idx_lenders_new_construction_status ON lenders_new_construction(status);
CREATE INDEX IF NOT EXISTS idx_lenders_new_construction_relationship ON lenders_new_construction(relationship);

ALTER TABLE lenders_new_construction ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view all new construction lenders" ON lenders_new_construction FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert new construction lenders" ON lenders_new_construction FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update new construction lenders" ON lenders_new_construction FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete new construction lenders" ON lenders_new_construction FOR DELETE USING (auth.role() = 'authenticated');
