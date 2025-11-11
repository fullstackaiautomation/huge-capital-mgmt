-- Create deal_funding_positions table - Recurring lender payments
CREATE TABLE deal_funding_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  statement_id UUID NOT NULL REFERENCES deal_bank_statements(id) ON DELETE CASCADE,

  -- Lender Information
  lender_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  frequency TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'

  -- Detection Data
  detected_dates TEXT[] NOT NULL, -- Array of payment dates (ISO 8601 format)

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_deal_funding_positions_statement_id ON deal_funding_positions(statement_id);

-- Enable RLS
ALTER TABLE deal_funding_positions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view funding positions of their deals' statements
CREATE POLICY "Users can view funding positions of their deals"
  ON deal_funding_positions
  FOR SELECT
  USING (
    statement_id IN (
      SELECT dbs.id
      FROM deal_bank_statements dbs
      INNER JOIN deals d ON dbs.deal_id = d.id
      WHERE d.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can create funding positions for their deals' statements
CREATE POLICY "Users can create funding positions for their deals"
  ON deal_funding_positions
  FOR INSERT
  WITH CHECK (
    statement_id IN (
      SELECT dbs.id
      FROM deal_bank_statements dbs
      INNER JOIN deals d ON dbs.deal_id = d.id
      WHERE d.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can update funding positions of their deals' statements
CREATE POLICY "Users can update funding positions of their deals"
  ON deal_funding_positions
  FOR UPDATE
  USING (
    statement_id IN (
      SELECT dbs.id
      FROM deal_bank_statements dbs
      INNER JOIN deals d ON dbs.deal_id = d.id
      WHERE d.user_id = auth.uid()
    )
  )
  WITH CHECK (
    statement_id IN (
      SELECT dbs.id
      FROM deal_bank_statements dbs
      INNER JOIN deals d ON dbs.deal_id = d.id
      WHERE d.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can delete funding positions of their deals' statements
CREATE POLICY "Users can delete funding positions of their deals"
  ON deal_funding_positions
  FOR DELETE
  USING (
    statement_id IN (
      SELECT dbs.id
      FROM deal_bank_statements dbs
      INNER JOIN deals d ON dbs.deal_id = d.id
      WHERE d.user_id = auth.uid()
    )
  );
