-- Create deal_lender_matches table - AI match results
CREATE TABLE deal_lender_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,

  -- Lender Information
  lender_table TEXT NOT NULL, -- 'lenders_mca', 'lenders_business_line_of_credit'
  lender_id UUID NOT NULL,
  lender_name TEXT NOT NULL,

  -- Match Information
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  match_reasoning TEXT, -- AI explanation

  -- Submission Tracking
  selected_by_broker BOOLEAN DEFAULT FALSE,
  submission_status TEXT DEFAULT 'Not Started', -- 'Not Started', 'Prepared', 'Submitted', 'Pending', 'Approved', 'Declined'
  submission_date TIMESTAMP,
  response_date TIMESTAMP,
  lender_response TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_deal_lender_matches_deal_id ON deal_lender_matches(deal_id);
CREATE INDEX idx_deal_lender_matches_selected ON deal_lender_matches(deal_id, selected_by_broker);
CREATE INDEX idx_deal_lender_matches_submission_status ON deal_lender_matches(submission_status);

-- Enable RLS
ALTER TABLE deal_lender_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view lender matches of their deals
CREATE POLICY "Users can view lender matches of their deals"
  ON deal_lender_matches
  FOR SELECT
  USING (
    deal_id IN (
      SELECT id FROM deals WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can create lender matches for their deals
CREATE POLICY "Users can create lender matches for their deals"
  ON deal_lender_matches
  FOR INSERT
  WITH CHECK (
    deal_id IN (
      SELECT id FROM deals WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can update lender matches of their deals
CREATE POLICY "Users can update lender matches of their deals"
  ON deal_lender_matches
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

-- RLS Policy: Users can delete lender matches of their deals
CREATE POLICY "Users can delete lender matches of their deals"
  ON deal_lender_matches
  FOR DELETE
  USING (
    deal_id IN (
      SELECT id FROM deals WHERE user_id = auth.uid()
    )
  );
