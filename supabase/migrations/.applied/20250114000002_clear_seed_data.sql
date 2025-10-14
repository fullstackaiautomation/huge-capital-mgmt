-- Clear Fake Seed Data
-- Preparing for real Google Sheets sync

-- Delete all sample data (cascades to related tables)
DELETE FROM lenders WHERE company_name IN (
  'First National Bank',
  'Bridge Capital Partners',
  'Community Credit Union',
  'Hard Money Solutions',
  'Institutional Lending Group'
);

-- Verify cleanup
DO $$
BEGIN
  RAISE NOTICE 'Seed data cleared. Lenders remaining: %', (SELECT count(*) FROM lenders);
END $$;
