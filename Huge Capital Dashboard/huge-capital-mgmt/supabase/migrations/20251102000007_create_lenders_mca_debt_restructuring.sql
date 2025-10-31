-- Create lenders_mca_debt_restructuring table
CREATE TABLE IF NOT EXISTS lenders_mca_debt_restructuring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  lender_name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,

  -- Products & Availability
  products_offered TEXT,
  states_available TEXT,

  -- Loan Terms
  min_loan_amount TEXT,
  max_loan_amount TEXT,

  -- Requirements
  credit_requirement TEXT,

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

CREATE INDEX IF NOT EXISTS idx_lenders_mca_debt_restructuring_lender_name ON lenders_mca_debt_restructuring(lender_name);
CREATE INDEX IF NOT EXISTS idx_lenders_mca_debt_restructuring_status ON lenders_mca_debt_restructuring(status);
CREATE INDEX IF NOT EXISTS idx_lenders_mca_debt_restructuring_relationship ON lenders_mca_debt_restructuring(relationship);

ALTER TABLE lenders_mca_debt_restructuring ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view all mca debt restructuring lenders" ON lenders_mca_debt_restructuring FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert mca debt restructuring lenders" ON lenders_mca_debt_restructuring FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update mca debt restructuring lenders" ON lenders_mca_debt_restructuring FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete mca debt restructuring lenders" ON lenders_mca_debt_restructuring FOR DELETE USING (auth.role() = 'authenticated');
