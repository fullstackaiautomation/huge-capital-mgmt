-- Add credit_score column to deals table
-- This is an optional field that brokers can submit with the deal (range: 400-900)

ALTER TABLE deals ADD COLUMN IF NOT EXISTS credit_score INTEGER;

-- Add constraint to ensure credit score is within valid range
ALTER TABLE deals ADD CONSTRAINT valid_credit_score
  CHECK (credit_score IS NULL OR (credit_score >= 400 AND credit_score <= 900));

-- Add comment for documentation
COMMENT ON COLUMN deals.credit_score IS 'Optional credit score submitted by broker (range: 400-900)';
