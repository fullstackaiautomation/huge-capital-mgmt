-- Create deal_owners table - Business owners (1-2 per deal)
CREATE TABLE deal_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  owner_number INTEGER NOT NULL, -- 1 or 2

  -- Personal Information
  full_name TEXT NOT NULL,
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  phone TEXT,
  email TEXT,

  -- Ownership Details
  ownership_percent NUMERIC,

  -- Sensitive Information (encrypted via Supabase vault)
  drivers_license_number TEXT,
  date_of_birth DATE,
  ssn_encrypted TEXT, -- Will be encrypted by application layer

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_owner_number CHECK (owner_number IN (1, 2)),
  CONSTRAINT unique_owner_per_deal UNIQUE (deal_id, owner_number)
);

-- Create indexes
CREATE INDEX idx_deal_owners_deal_id ON deal_owners(deal_id);
CREATE INDEX idx_deal_owners_owner_number ON deal_owners(deal_id, owner_number);

-- Enable RLS
ALTER TABLE deal_owners ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view owners of their deals
CREATE POLICY "Users can view owners of their deals"
  ON deal_owners
  FOR SELECT
  USING (
    deal_id IN (
      SELECT id FROM deals WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can create owners for their deals
CREATE POLICY "Users can create owners for their deals"
  ON deal_owners
  FOR INSERT
  WITH CHECK (
    deal_id IN (
      SELECT id FROM deals WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can update owners of their deals
CREATE POLICY "Users can update owners of their deals"
  ON deal_owners
  FOR UPDATE
  USING (
    deal_id IN (
      SELECT id FROM deals WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    deal_id IN (
      SELECT id FROM deals WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can delete owners of their deals
CREATE POLICY "Users can delete owners of their deals"
  ON deal_owners
  FOR DELETE
  USING (
    deal_id IN (
      SELECT id FROM deals WHERE user_id = auth.uid()
    )
  );
