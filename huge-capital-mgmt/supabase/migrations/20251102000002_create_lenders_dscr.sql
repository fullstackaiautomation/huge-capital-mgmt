-- Create lenders_dscr table
CREATE TABLE IF NOT EXISTS lenders_dscr (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  submission_process TEXT,
  min_loan_amount TEXT,
  max_loan_amount TEXT,
  max_ltv TEXT,
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

CREATE INDEX IF NOT EXISTS idx_lenders_dscr_lender_name ON lenders_dscr(lender_name);
CREATE INDEX IF NOT EXISTS idx_lenders_dscr_status ON lenders_dscr(status);
CREATE INDEX IF NOT EXISTS idx_lenders_dscr_relationship ON lenders_dscr(relationship);

ALTER TABLE lenders_dscr ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view all dscr lenders" ON lenders_dscr FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert dscr lenders" ON lenders_dscr FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update dscr lenders" ON lenders_dscr FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete dscr lenders" ON lenders_dscr FOR DELETE USING (auth.role() = 'authenticated');
