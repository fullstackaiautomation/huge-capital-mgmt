-- Clear all lenders and related data again to fix duplicates

DELETE FROM lender_contacts;
DELETE FROM lender_programs;
DELETE FROM lender_communications;
DELETE FROM lender_performance;
DELETE FROM lenders;
