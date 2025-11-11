-- Add preferred_industries_doc_link column to business line of credit table
ALTER TABLE lenders_business_line_of_credit
ADD COLUMN IF NOT EXISTS preferred_industries_doc_link TEXT;

-- Update Preferred Industries document links
UPDATE lenders_business_line_of_credit
SET preferred_industries_doc_link = 'https://drive.google.com/file/d/1Ta87HCigd5zEaF0p4b9nRaOlo0F-t-_0/view'
WHERE lender_name = 'ARF Financial (Big Deals)';

UPDATE lenders_business_line_of_credit
SET preferred_industries_doc_link = 'https://drive.google.com/file/d/1Ta87HCigd5zEaF0p4b9nRaOlo0F-t-_0/view'
WHERE lender_name = 'ARF Financial (Sub 50K)';

UPDATE lenders_business_line_of_credit
SET preferred_industries_doc_link = 'https://drive.google.com/file/d/10DmMwpJaZiKQI_1FK779F7-pSS7_35Uo/view'
WHERE lender_name = 'Plexe';
