-- Populate portal URLs for MCA lenders
UPDATE lenders_mca
SET portal_url = 'https://portal.credibly.com/#'
WHERE lender_name = 'Credibly';

UPDATE lenders_mca
SET portal_url = 'https://login.rapidfinance.com/Account/Login?ticket=e5c73ceaeb8d4dc985acafee7911b1fc&userType=Partner'
WHERE lender_name = 'Rapid';
