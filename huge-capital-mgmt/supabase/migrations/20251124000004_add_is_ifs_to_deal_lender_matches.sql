-- Add is_ifs column to deal_lender_matches table
-- This column tracks whether the matched lender is from IFS (backup) or Huge Capital (primary)

ALTER TABLE deal_lender_matches
ADD COLUMN IF NOT EXISTS is_ifs BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN deal_lender_matches.is_ifs IS 'True if lender is from IFS network (backup), false if from Huge Capital (primary)';