-- Lenders Dashboard Schema Migration
-- Epic 2: Lenders Dashboard (LD-001)
-- Created: January 14, 2025

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE 1: LENDERS
-- =====================================================
CREATE TABLE lenders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  website TEXT,
  company_type TEXT CHECK (company_type IN ('bank', 'credit_union', 'private_lender', 'hard_money', 'institutional', 'other')),
  headquarters_location TEXT,
  geographic_coverage TEXT[], -- Array of states/regions
  license_numbers JSONB,
  status TEXT CHECK (status IN ('active', 'inactive', 'pending', 'archived')) DEFAULT 'active',
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  last_synced TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- TABLE 2: LENDER PROGRAMS
-- =====================================================
CREATE TABLE lender_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lender_id UUID REFERENCES lenders(id) ON DELETE CASCADE,
  program_name TEXT NOT NULL,
  loan_types TEXT[], -- ['commercial', 'residential', 'bridge', 'construction']
  min_loan_amount DECIMAL(15,2),
  max_loan_amount DECIMAL(15,2),
  min_credit_score INTEGER,
  min_dscr DECIMAL(4,2),
  max_ltv DECIMAL(5,2),
  property_types TEXT[], -- ['single_family', 'multifamily', 'commercial', 'land']
  interest_rate_min DECIMAL(5,3),
  interest_rate_max DECIMAL(5,3),
  rate_type TEXT CHECK (rate_type IN ('fixed', 'variable', 'hybrid')),
  term_months INTEGER,
  closing_days INTEGER,
  requirements JSONB,
  special_features TEXT[],
  status TEXT CHECK (status IN ('active', 'paused', 'discontinued')) DEFAULT 'active',
  effective_date DATE,
  expiration_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE 3: LENDER CONTACTS
-- =====================================================
CREATE TABLE lender_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lender_id UUID REFERENCES lenders(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  title TEXT,
  department TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'phone', 'mobile', 'text')),
  is_primary BOOLEAN DEFAULT FALSE,
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE 4: LENDER COMMUNICATIONS
-- =====================================================
CREATE TABLE lender_communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lender_id UUID REFERENCES lenders(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES lender_contacts(id) ON DELETE SET NULL,
  communication_type TEXT CHECK (communication_type IN ('email', 'phone', 'meeting', 'text', 'other')),
  subject TEXT,
  summary TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  direction TEXT CHECK (direction IN ('outbound', 'inbound')),
  outcome TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE 5: LENDER PERFORMANCE
-- =====================================================
CREATE TABLE lender_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lender_id UUID REFERENCES lenders(id) ON DELETE CASCADE UNIQUE,
  total_deals_submitted INTEGER DEFAULT 0,
  total_deals_approved INTEGER DEFAULT 0,
  total_deals_funded INTEGER DEFAULT 0,
  approval_rate DECIMAL(5,2), -- Calculated field
  average_approval_days INTEGER,
  average_closing_days INTEGER,
  total_funded_amount DECIMAL(15,2) DEFAULT 0,
  last_deal_date DATE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Lenders table indexes
CREATE INDEX idx_lenders_company_name ON lenders(company_name);
CREATE INDEX idx_lenders_status ON lenders(status);
CREATE INDEX idx_lenders_type ON lenders(company_type);
CREATE INDEX idx_lenders_rating ON lenders(rating);

-- Programs table indexes
CREATE INDEX idx_programs_lender_id ON lender_programs(lender_id);
CREATE INDEX idx_programs_status ON lender_programs(status);
CREATE INDEX idx_programs_loan_amount ON lender_programs(min_loan_amount, max_loan_amount);
CREATE INDEX idx_programs_credit_score ON lender_programs(min_credit_score);
CREATE INDEX idx_programs_loan_types ON lender_programs USING GIN(loan_types);
CREATE INDEX idx_programs_property_types ON lender_programs USING GIN(property_types);

-- Contacts table indexes
CREATE INDEX idx_contacts_lender_id ON lender_contacts(lender_id);
CREATE INDEX idx_contacts_email ON lender_contacts(email);
CREATE INDEX idx_contacts_is_primary ON lender_contacts(is_primary);

-- Communications table indexes
CREATE INDEX idx_communications_lender_id ON lender_communications(lender_id);
CREATE INDEX idx_communications_date ON lender_communications(date DESC);
CREATE INDEX idx_communications_follow_up ON lender_communications(follow_up_required, follow_up_date) WHERE follow_up_required = TRUE;

-- Performance table indexes
CREATE INDEX idx_performance_lender_id ON lender_performance(lender_id);
CREATE INDEX idx_performance_approval_rate ON lender_performance(approval_rate DESC);

-- Full-text search index
CREATE INDEX idx_lenders_search ON lenders USING GIN(
  to_tsvector('english', company_name || ' ' || COALESCE(notes, ''))
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE lenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE lender_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lender_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lender_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE lender_performance ENABLE ROW LEVEL SECURITY;

-- Lenders policies
CREATE POLICY "Users can view all lenders"
  ON lenders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create lenders"
  ON lenders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update lenders"
  ON lenders FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete lenders"
  ON lenders FOR DELETE
  TO authenticated
  USING (true);

-- Programs policies
CREATE POLICY "Users can view all programs"
  ON lender_programs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create programs"
  ON lender_programs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update programs"
  ON lender_programs FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete programs"
  ON lender_programs FOR DELETE
  TO authenticated
  USING (true);

-- Contacts policies
CREATE POLICY "Users can view all contacts"
  ON lender_contacts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create contacts"
  ON lender_contacts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update contacts"
  ON lender_contacts FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete contacts"
  ON lender_contacts FOR DELETE
  TO authenticated
  USING (true);

-- Communications policies
CREATE POLICY "Users can view all communications"
  ON lender_communications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create communications"
  ON lender_communications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update communications"
  ON lender_communications FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete communications"
  ON lender_communications FOR DELETE
  TO authenticated
  USING (true);

-- Performance policies
CREATE POLICY "Users can view all performance"
  ON lender_performance FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create performance"
  ON lender_performance FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update performance"
  ON lender_performance FOR UPDATE
  TO authenticated
  USING (true);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Lenders trigger
CREATE TRIGGER update_lenders_updated_at
  BEFORE UPDATE ON lenders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Programs trigger
CREATE TRIGGER update_programs_updated_at
  BEFORE UPDATE ON lender_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Contacts trigger
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON lender_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate approval rate
CREATE OR REPLACE FUNCTION calculate_approval_rate()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_deals_submitted > 0 THEN
    NEW.approval_rate := (NEW.total_deals_approved::DECIMAL / NEW.total_deals_submitted::DECIMAL) * 100;
  ELSE
    NEW.approval_rate := NULL;
  END IF;
  NEW.last_updated := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Performance trigger
CREATE TRIGGER calculate_performance_metrics
  BEFORE INSERT OR UPDATE ON lender_performance
  FOR EACH ROW
  EXECUTE FUNCTION calculate_approval_rate();

-- =====================================================
-- SEED DATA (Sample Lenders)
-- =====================================================

-- Insert sample lenders
INSERT INTO lenders (company_name, website, company_type, status, rating, geographic_coverage, notes) VALUES
  ('First National Bank', 'https://firstnationalbank.example.com', 'bank', 'active', 5, ARRAY['CA', 'NY', 'TX', 'FL'], 'Top tier lender with competitive rates'),
  ('Bridge Capital Partners', 'https://bridgecapital.example.com', 'private_lender', 'active', 4, ARRAY['CA', 'NY'], 'Specializes in bridge loans and quick closes'),
  ('Community Credit Union', 'https://communitycu.example.com', 'credit_union', 'active', 4, ARRAY['CA', 'OR', 'WA'], 'Great for residential and small commercial'),
  ('Hard Money Solutions', 'https://hardmoneysolutions.example.com', 'hard_money', 'active', 3, ARRAY['CA', 'NV', 'AZ'], 'Fast approvals for distressed properties'),
  ('Institutional Lending Group', 'https://institutionallending.example.com', 'institutional', 'active', 5, ARRAY['All 50 States'], 'Large commercial and multifamily specialist');

-- Insert sample programs for First National Bank
INSERT INTO lender_programs (lender_id, program_name, loan_types, min_loan_amount, max_loan_amount, min_credit_score, max_ltv, interest_rate_min, interest_rate_max, rate_type, term_months, closing_days, property_types, status)
SELECT
  id,
  'Commercial Fixed Rate',
  ARRAY['commercial'],
  250000,
  5000000,
  680,
  75.00,
  5.500,
  7.000,
  'fixed',
  120,
  45,
  ARRAY['commercial', 'multifamily'],
  'active'
FROM lenders WHERE company_name = 'First National Bank';

INSERT INTO lender_programs (lender_id, program_name, loan_types, min_loan_amount, max_loan_amount, min_credit_score, max_ltv, interest_rate_min, interest_rate_max, rate_type, term_months, closing_days, property_types, status)
SELECT
  id,
  'Residential Investment',
  ARRAY['residential'],
  100000,
  2000000,
  660,
  80.00,
  6.000,
  7.500,
  'fixed',
  360,
  30,
  ARRAY['single_family', 'multifamily'],
  'active'
FROM lenders WHERE company_name = 'First National Bank';

-- Insert sample programs for Bridge Capital
INSERT INTO lender_programs (lender_id, program_name, loan_types, min_loan_amount, max_loan_amount, min_credit_score, max_ltv, interest_rate_min, interest_rate_max, rate_type, term_months, closing_days, property_types, status)
SELECT
  id,
  'Quick Bridge Loan',
  ARRAY['bridge'],
  150000,
  3000000,
  640,
  70.00,
  8.000,
  10.000,
  'fixed',
  12,
  15,
  ARRAY['commercial', 'multifamily', 'single_family'],
  'active'
FROM lenders WHERE company_name = 'Bridge Capital Partners';

-- Insert sample contacts
INSERT INTO lender_contacts (lender_id, first_name, last_name, title, email, phone, preferred_contact_method, is_primary)
SELECT
  id,
  'John',
  'Smith',
  'Senior Loan Officer',
  'john.smith@firstnationalbank.example.com',
  '555-0101',
  'email',
  true
FROM lenders WHERE company_name = 'First National Bank';

INSERT INTO lender_contacts (lender_id, first_name, last_name, title, email, phone, preferred_contact_method, is_primary)
SELECT
  id,
  'Sarah',
  'Johnson',
  'Partner',
  'sarah.johnson@bridgecapital.example.com',
  '555-0202',
  'phone',
  true
FROM lenders WHERE company_name = 'Bridge Capital Partners';

-- Insert sample performance data
INSERT INTO lender_performance (lender_id, total_deals_submitted, total_deals_approved, total_deals_funded, average_approval_days, average_closing_days, total_funded_amount)
SELECT
  id,
  25,
  22,
  20,
  14,
  42,
  15000000.00
FROM lenders WHERE company_name = 'First National Bank';

INSERT INTO lender_performance (lender_id, total_deals_submitted, total_deals_approved, total_deals_funded, average_approval_days, average_closing_days, total_funded_amount)
SELECT
  id,
  18,
  16,
  15,
  7,
  18,
  8500000.00
FROM lenders WHERE company_name = 'Bridge Capital Partners';

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE lenders IS 'Main lenders table storing company information';
COMMENT ON TABLE lender_programs IS 'Loan programs offered by each lender';
COMMENT ON TABLE lender_contacts IS 'Contact information for lender representatives';
COMMENT ON TABLE lender_communications IS 'Log of all communications with lenders';
COMMENT ON TABLE lender_performance IS 'Performance metrics for each lender';

COMMENT ON COLUMN lenders.geographic_coverage IS 'Array of states/regions where lender operates';
COMMENT ON COLUMN lenders.license_numbers IS 'JSONB object storing license numbers by state';
COMMENT ON COLUMN lender_programs.requirements IS 'JSONB object for flexible program requirements';
COMMENT ON COLUMN lender_performance.approval_rate IS 'Automatically calculated: (approved/submitted) * 100';
