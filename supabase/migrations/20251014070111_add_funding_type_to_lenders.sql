-- Add funding_type column to lenders table
-- This tracks which sheet tab the lender came from (SBA, Term Loans, etc.)

ALTER TABLE lenders
ADD COLUMN funding_type TEXT;

-- Add index for better query performance
CREATE INDEX idx_lenders_funding_type ON lenders(funding_type);

-- Add composite index for unique identification
CREATE INDEX idx_lenders_company_funding ON lenders(company_name, funding_type);
