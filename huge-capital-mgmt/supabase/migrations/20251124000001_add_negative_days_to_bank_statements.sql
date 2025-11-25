-- Add negative_days column to deal_bank_statements table
-- Tracks the number of days the bank account was in the negative during the statement period

ALTER TABLE deal_bank_statements
ADD COLUMN IF NOT EXISTS negative_days INTEGER DEFAULT 0;

COMMENT ON COLUMN deal_bank_statements.negative_days IS 'Number of days the account balance was negative during the statement period';
