-- Fix MCA lender sort order to match specified order
UPDATE lenders_mca SET sort_order = 1 WHERE lender_name = 'Credibly';
UPDATE lenders_mca SET sort_order = 2 WHERE lender_name = 'Rapid';
UPDATE lenders_mca SET sort_order = 3 WHERE lender_name = 'Fundworks';
UPDATE lenders_mca SET sort_order = 4 WHERE lender_name = 'TMRnow';
UPDATE lenders_mca SET sort_order = 5 WHERE lender_name = 'TVT Capital';
UPDATE lenders_mca SET sort_order = 6 WHERE lender_name = 'Fintegra';
UPDATE lenders_mca SET sort_order = 7 WHERE lender_name = 'Fresh Funding';
UPDATE lenders_mca SET sort_order = 8 WHERE lender_name = 'Fintap';
UPDATE lenders_mca SET sort_order = 9 WHERE lender_name = 'Legend Advance';
UPDATE lenders_mca SET sort_order = 10 WHERE lender_name = 'Mantis';
UPDATE lenders_mca SET sort_order = 11 WHERE lender_name = 'Emmy Capital';
UPDATE lenders_mca SET sort_order = 12 WHERE lender_name = 'Kalamata';
