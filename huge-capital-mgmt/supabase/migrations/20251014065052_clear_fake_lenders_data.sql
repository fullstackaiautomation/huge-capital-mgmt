-- Clear fake seed data from lenders database
-- This removes the 5 sample lenders that were added in the initial schema migration

-- Delete lender contacts first (foreign key constraint)
DELETE FROM lender_contacts
WHERE lender_id IN (
  SELECT id FROM lenders
  WHERE company_name IN (
    'First National Bank',
    'Bridge Capital Partners',
    'Community Credit Union',
    'Hard Money Solutions',
    'Institutional Lending Group'
  )
);

-- Delete lender programs
DELETE FROM lender_programs
WHERE lender_id IN (
  SELECT id FROM lenders
  WHERE company_name IN (
    'First National Bank',
    'Bridge Capital Partners',
    'Community Credit Union',
    'Hard Money Solutions',
    'Institutional Lending Group'
  )
);

-- Delete lender communications
DELETE FROM lender_communications
WHERE lender_id IN (
  SELECT id FROM lenders
  WHERE company_name IN (
    'First National Bank',
    'Bridge Capital Partners',
    'Community Credit Union',
    'Hard Money Solutions',
    'Institutional Lending Group'
  )
);

-- Delete lender performance
DELETE FROM lender_performance
WHERE lender_id IN (
  SELECT id FROM lenders
  WHERE company_name IN (
    'First National Bank',
    'Bridge Capital Partners',
    'Community Credit Union',
    'Hard Money Solutions',
    'Institutional Lending Group'
  )
);

-- Finally, delete the lenders themselves
DELETE FROM lenders
WHERE company_name IN (
  'First National Bank',
  'Bridge Capital Partners',
  'Community Credit Union',
  'Hard Money Solutions',
  'Institutional Lending Group'
);
