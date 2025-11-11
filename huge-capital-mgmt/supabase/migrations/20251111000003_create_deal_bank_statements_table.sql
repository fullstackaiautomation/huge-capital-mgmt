-- Create deal_bank_statements table - Individual statements
CREATE TABLE deal_bank_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,

  -- Statement Information
  statement_id TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  statement_month TEXT NOT NULL, -- YYYY-MM format
  statement_file_url TEXT,

  -- Financial Metrics
  credits NUMERIC, -- Total deposits
  debits NUMERIC, -- Total withdrawals
  nsfs INTEGER DEFAULT 0, -- Negative days
  overdrafts INTEGER DEFAULT 0, -- Overdraft count
  average_daily_balance NUMERIC,
  deposit_count INTEGER,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_deal_bank_statements_deal_id ON deal_bank_statements(deal_id);
CREATE INDEX idx_deal_bank_statements_statement_month ON deal_bank_statements(deal_id, statement_month);

-- Enable RLS
ALTER TABLE deal_bank_statements ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view statements of their deals
CREATE POLICY "Users can view statements of their deals"
  ON deal_bank_statements
  FOR SELECT
  USING (
    deal_id IN (
      SELECT id FROM deals WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can create statements for their deals
CREATE POLICY "Users can create statements for their deals"
  ON deal_bank_statements
  FOR INSERT
  WITH CHECK (
    deal_id IN (
      SELECT id FROM deals WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can update statements of their deals
CREATE POLICY "Users can update statements of their deals"
  ON deal_bank_statements
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

-- RLS Policy: Users can delete statements of their deals
CREATE POLICY "Users can delete statements of their deals"
  ON deal_bank_statements
  FOR DELETE
  USING (
    deal_id IN (
      SELECT id FROM deals WHERE user_id = auth.uid()
    )
  );
