CREATE TABLE IF NOT EXISTS lenders_fix_flip (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  submission_process TEXT,
  min_loan_amount TEXT,
  max_loan_amount TEXT,
  max_ltv TEXT,
  max_ltc TEXT,
  credit_requirement TEXT,
  rural TEXT,
  states TEXT,
  drive_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'archived')),
  relationship TEXT DEFAULT 'Huge Capital' CHECK (relationship IN ('Huge Capital', 'IFS'))
);

CREATE INDEX IF NOT EXISTS idx_lenders_fix_flip_lender_name ON lenders_fix_flip(lender_name);
CREATE INDEX IF NOT EXISTS idx_lenders_fix_flip_status ON lenders_fix_flip(status);
CREATE INDEX IF NOT EXISTS idx_lenders_fix_flip_relationship ON lenders_fix_flip(relationship);

ALTER TABLE lenders_fix_flip ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view all fix flip lenders" ON lenders_fix_flip FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert fix flip lenders" ON lenders_fix_flip FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update fix flip lenders" ON lenders_fix_flip FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete fix flip lenders" ON lenders_fix_flip FOR DELETE USING (auth.role() = 'authenticated');
