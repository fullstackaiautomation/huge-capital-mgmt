CREATE TABLE IF NOT EXISTS lenders_equipment_financing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_name TEXT NOT NULL,
  iso_rep TEXT,
  phone TEXT,
  email TEXT,
  submission_process TEXT,
  minimum_credit_requirement TEXT,
  min_time_in_business TEXT,
  min_loan_amount TEXT,
  max_loan_amount TEXT,
  terms TEXT,
  rates TEXT,
  do_positions_matter TEXT,
  financing_types TEXT,
  states_restrictions TEXT,
  preferred_equipment TEXT,
  equipment_restrictions TEXT,
  website TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'archived')),
  relationship TEXT DEFAULT 'Huge Capital' CHECK (relationship IN ('Huge Capital', 'IFS'))
);

CREATE INDEX IF NOT EXISTS idx_lenders_equipment_financing_lender_name ON lenders_equipment_financing(lender_name);
CREATE INDEX IF NOT EXISTS idx_lenders_equipment_financing_status ON lenders_equipment_financing(status);
CREATE INDEX IF NOT EXISTS idx_lenders_equipment_financing_relationship ON lenders_equipment_financing(relationship);

ALTER TABLE lenders_equipment_financing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view all equipment financing lenders" ON lenders_equipment_financing FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert equipment financing lenders" ON lenders_equipment_financing FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update equipment financing lenders" ON lenders_equipment_financing FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete equipment financing lenders" ON lenders_equipment_financing FOR DELETE USING (auth.role() = 'authenticated');
