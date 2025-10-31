-- Add portal_url column to business line of credit table if it doesn't exist
ALTER TABLE lenders_business_line_of_credit
ADD COLUMN IF NOT EXISTS portal_url TEXT;

-- Update Online Portal URLs for Business Line of Credit lenders
UPDATE lenders_business_line_of_credit
SET portal_url = 'https://smartbizbank.com/assist/session/new'
WHERE lender_name = 'SmartBiz' AND submission_type = 'Online Portal';

UPDATE lenders_business_line_of_credit
SET portal_url = 'https://portal.plexe.co/login'
WHERE lender_name = 'Plexe' AND submission_type = 'Online Portal';

UPDATE lenders_business_line_of_credit
SET portal_url = 'https://www.ideafinancial.com/partners'
WHERE lender_name = 'Idea' AND submission_type = 'Online Portal';
