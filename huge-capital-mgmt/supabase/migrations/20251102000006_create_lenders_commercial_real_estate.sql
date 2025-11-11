-- Create lenders_commercial_real_estate table
CREATE TABLE IF NOT EXISTS lenders_commercial_real_estate (
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

CREATE INDEX IF NOT EXISTS idx_lenders_commercial_real_estate_lender_name ON lenders_commercial_real_estate(lender_name);
CREATE INDEX IF NOT EXISTS idx_lenders_commercial_real_estate_status ON lenders_commercial_real_estate(status);
CREATE INDEX IF NOT EXISTS idx_lenders_commercial_real_estate_relationship ON lenders_commercial_real_estate(relationship);

ALTER TABLE lenders_commercial_real_estate ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view all commercial real estate lenders" ON lenders_commercial_real_estate FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert commercial real estate lenders" ON lenders_commercial_real_estate FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update commercial real estate lenders" ON lenders_commercial_real_estate FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete commercial real estate lenders" ON lenders_commercial_real_estate FOR DELETE USING (auth.role() = 'authenticated');
