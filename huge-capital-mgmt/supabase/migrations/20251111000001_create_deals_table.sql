-- Create deals table - Main deal tracking
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Business Information
  legal_business_name TEXT NOT NULL,
  dba_name TEXT,
  ein TEXT NOT NULL,
  business_type TEXT,

  -- Address Information
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  phone TEXT,
  website TEXT,

  -- Business Details
  franchise_business BOOLEAN DEFAULT FALSE,
  seasonal_business BOOLEAN DEFAULT FALSE,
  peak_sales_month TEXT,
  business_start_date DATE,
  time_in_business_months INTEGER,

  -- Products & Services
  product_service_sold TEXT,
  franchise_units_percent NUMERIC,

  -- Financial Information
  average_monthly_sales NUMERIC,
  average_monthly_card_sales NUMERIC,
  desired_loan_amount NUMERIC NOT NULL,
  reason_for_loan TEXT,

  -- Deal Classification
  loan_type TEXT NOT NULL, -- 'MCA', 'Business LOC'
  status TEXT DEFAULT 'New', -- New, Analyzing, Matched, Submitted, Pending, Approved, Funded, Declined

  -- Document Links
  application_google_drive_link TEXT,
  statements_google_drive_link TEXT,

  -- Metadata
  submission_date TIMESTAMP,

  CONSTRAINT valid_loan_type CHECK (loan_type IN ('MCA', 'Business LOC')),
  CONSTRAINT valid_status CHECK (status IN ('New', 'Analyzing', 'Matched', 'Submitted', 'Pending', 'Approved', 'Funded', 'Declined'))
);

-- Create index on user_id for faster queries
CREATE INDEX idx_deals_user_id ON deals(user_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_loan_type ON deals(loan_type);
CREATE INDEX idx_deals_created_at ON deals(created_at DESC);

-- Enable RLS
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own deals
CREATE POLICY "Users can view their own deals"
  ON deals
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can create deals
CREATE POLICY "Users can create deals"
  ON deals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own deals
CREATE POLICY "Users can update their own deals"
  ON deals
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own deals
CREATE POLICY "Users can delete their own deals"
  ON deals
  FOR DELETE
  USING (auth.uid() = user_id);
