-- Update Business Line of Credit Lenders with website and drive links

-- ARF Financial (Big Deals)
UPDATE lenders_business_line_of_credit
SET
  website = 'https://www.arffinancial.com/',
  drive_link = 'https://drive.google.com/drive/folders/1g1GZqV7XkCT_R3Yeo0P5c_Bvi54dkA1f?usp=drive_link'
WHERE lender_name = 'ARF Financial (Big Deals)';

-- ARF Financial (Sub 50K)
UPDATE lenders_business_line_of_credit
SET
  website = 'https://www.arffinancial.com/',
  drive_link = 'https://drive.google.com/drive/folders/1g1GZqV7XkCT_R3Yeo0P5c_Bvi54dkA1f'
WHERE lender_name = 'ARF Financial (Sub 50K)';

-- SmartBiz
UPDATE lenders_business_line_of_credit
SET
  website = 'https://smartbizbank.com/line-of-credit',
  drive_link = 'https://drive.google.com/file/d/1yakI5fd5CU6JBEsoe73Fz85SFgP2GKZg/view'
WHERE lender_name = 'SmartBiz';

-- Plexe
UPDATE lenders_business_line_of_credit
SET
  website = 'https://plexe.co/',
  drive_link = 'https://drive.google.com/drive/folders/10ylRaW2ZAvvFRxRpeI1Uynb9ZfXRXcPw'
WHERE lender_name = 'Plexe';

-- Idea
UPDATE lenders_business_line_of_credit
SET
  website = 'https://www.ideafinancial.com/',
  drive_link = 'https://drive.google.com/drive/folders/1Qkk5fQWw1-2mJcHsMKznhYgIx36rMCmh'
WHERE lender_name = 'Idea';

-- Rapid
UPDATE lenders_business_line_of_credit
SET
  website = 'https://www.rapidfinance.com/',
  drive_link = 'https://drive.google.com/drive/folders/1XZSuXzQIWzzHolZY8XmPieiS7HNXljFL'
WHERE lender_name = 'Rapid';
