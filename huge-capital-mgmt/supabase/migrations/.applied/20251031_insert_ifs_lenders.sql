-- Insert IFS Business Line of Credit lenders
INSERT INTO lenders_business_line_of_credit (
                lender_name, bank_non_bank, website, iso_contacts, phone, email,
                credit_requirement, credit_used, min_time_in_business, minimum_deposit_count,
                min_monthly_revenue_amount, min_avg_daily_balance, max_loan, positions,
                products_offered, terms, payments, draw_fees, preferred_industries,
                restricted_industries, ineligible_states, submission_docs, submission_type,
                submission_process, drive_link, notes, relationship, status
            ) VALUES ('Ondeck', 'Non-Bank', NULL, NULL, NULL, NULL, 625, 'Experian', '1 year', 5, '$20,000', '$2,000', '$250,000', '1st', 'LOC, MCA', '12-24', 'Weekly/Monthly', NULL, NULL, NULL, NULL, '3 Months Bank Statements and App', NULL, NULL, NULL, NULL, 'IFS', 'active');
INSERT INTO lenders_business_line_of_credit (
                lender_name, bank_non_bank, website, iso_contacts, phone, email,
                credit_requirement, credit_used, min_time_in_business, minimum_deposit_count,
                min_monthly_revenue_amount, min_avg_daily_balance, max_loan, positions,
                products_offered, terms, payments, draw_fees, preferred_industries,
                restricted_industries, ineligible_states, submission_docs, submission_type,
                submission_process, drive_link, notes, relationship, status
            ) VALUES ('Headway', 'Non-Bank', NULL, NULL, NULL, NULL, 660, 'Experian', '6 month', 5, '$20,000', '$2,000', '$100,000', '1st-3rd', 'LOC', '12-36', 'Weekly/Monthly', '2%', NULL, NULL, NULL, '3 Months Bank Statements and App', NULL, NULL, NULL, NULL, 'IFS', 'active');
INSERT INTO lenders_business_line_of_credit (
                lender_name, bank_non_bank, website, iso_contacts, phone, email,
                credit_requirement, credit_used, min_time_in_business, minimum_deposit_count,
                min_monthly_revenue_amount, min_avg_daily_balance, max_loan, positions,
                products_offered, terms, payments, draw_fees, preferred_industries,
                restricted_industries, ineligible_states, submission_docs, submission_type,
                submission_process, drive_link, notes, relationship, status
            ) VALUES ('Byzfunder', 'Non-Bank', NULL, NULL, NULL, NULL, 620, 'Experian', '2 years', 5, '$25,000', '$2,000', '$150,000', '1st / 2nd', 'LOC MCA', '6-12', 'Weekly', '2.5% + 2.5% Origination', NULL, NULL, NULL, '3 Months Bank Statements and App', NULL, NULL, NULL, NULL, 'IFS', 'active');

-- Insert IFS MCA lenders
INSERT INTO lenders_mca (lender_name, paper, website, iso_rep, phone, email, submission_docs, submission_type, submission_process, minimum_credit_requirement, minimum_monthly_revenue, max_nsf_negative_days, minimum_daily_balances, minimum_time_in_business, minimum_loan_amount, max_loan_amount, terms, positions, buyouts, products_offered, states_restrictions, google_drive, note, preferred_industries, restricted_industries, relationship, status) VALUES ('IOU', 'A Paper', NULL, NULL, NULL, NULL, '3 Bank Statements and App', NULL, NULL, 650, '$10,000', '0', '$3,000', '1 Year', '$15,000', '$1,500,000', '6-48', '1st-2nd', '1st - 2nd (40% net)', 'MCA', '  MT, NV SD, VT, HI, ND', 'Google Drive', NULL, NULL, NULL, 'IFS', 'active');
INSERT INTO lenders_mca (lender_name, paper, website, iso_rep, phone, email, submission_docs, submission_type, submission_process, minimum_credit_requirement, minimum_monthly_revenue, max_nsf_negative_days, minimum_daily_balances, minimum_time_in_business, minimum_loan_amount, max_loan_amount, terms, positions, buyouts, products_offered, states_restrictions, google_drive, note, preferred_industries, restricted_industries, relationship, status) VALUES ('Mulligan', 'A Paper', NULL, NULL, NULL, NULL, '3 Bank Statements and App', NULL, NULL, 625, '$62,500', '3', '$2,000', '6 months', '$10,000', '$2,000,000', '3-24', '1st', '1st - 2nd (50% net)', 'MCA', 'N/A', 'Google Drive', NULL, NULL, NULL, 'IFS', 'active');
INSERT INTO lenders_mca (lender_name, paper, website, iso_rep, phone, email, submission_docs, submission_type, submission_process, minimum_credit_requirement, minimum_monthly_revenue, max_nsf_negative_days, minimum_daily_balances, minimum_time_in_business, minimum_loan_amount, max_loan_amount, terms, positions, buyouts, products_offered, states_restrictions, google_drive, note, preferred_industries, restricted_industries, relationship, status) VALUES ('Channel Partners', 'A Paper', NULL, NULL, NULL, NULL, '3 Bank Statements and App', NULL, NULL, 650, '$20,000', '6', '$10,000', '3 Years', '$30,000', '$400,000', '6-24', '1st', '1st - 2nd (50% net)', 'MCA', 'CA, CT, FL, GA, KS, MO, NY UT', 'Goolge Drive', NULL, NULL, NULL, 'IFS', 'active');
INSERT INTO lenders_mca (lender_name, paper, website, iso_rep, phone, email, submission_docs, submission_type, submission_process, minimum_credit_requirement, minimum_monthly_revenue, max_nsf_negative_days, minimum_daily_balances, minimum_time_in_business, minimum_loan_amount, max_loan_amount, terms, positions, buyouts, products_offered, states_restrictions, google_drive, note, preferred_industries, restricted_industries, relationship, status) VALUES ('Ondeck', 'A Paper', NULL, NULL, NULL, NULL, '3 Bank Statements and App', NULL, NULL, 625, '$10,000', '3', '$2,000', '1 Year', '$5,000', '$250,000', '6-36', '1st', '1st - 2nd (50% net)', 'MCA, LOC', NULL, 'Google Drive', NULL, NULL, NULL, 'IFS', 'active');
INSERT INTO lenders_mca (lender_name, paper, website, iso_rep, phone, email, submission_docs, submission_type, submission_process, minimum_credit_requirement, minimum_monthly_revenue, max_nsf_negative_days, minimum_daily_balances, minimum_time_in_business, minimum_loan_amount, max_loan_amount, terms, positions, buyouts, products_offered, states_restrictions, google_drive, note, preferred_industries, restricted_industries, relationship, status) VALUES ('Fundbox', 'A/B Paper', NULL, NULL, NULL, NULL, '3 Bank Statements and App', NULL, NULL, 650, '$40,000', '3', '$1,500', '6 months', '$5,000', '$500,000', '6-36', '1-2', '1st - 2nd (50% net)', 'MCA, LOC', NULL, 'Google Drive', NULL, NULL, NULL, 'IFS', 'active');
INSERT INTO lenders_mca (lender_name, paper, website, iso_rep, phone, email, submission_docs, submission_type, submission_process, minimum_credit_requirement, minimum_monthly_revenue, max_nsf_negative_days, minimum_daily_balances, minimum_time_in_business, minimum_loan_amount, max_loan_amount, terms, positions, buyouts, products_offered, states_restrictions, google_drive, note, preferred_industries, restricted_industries, relationship, status) VALUES ('Kapitus', 'A/B Paper', NULL, NULL, NULL, NULL, '3 Bank Statements and App', NULL, NULL, 625, '$20,000', '5', '$2,000', '1 Year', '$10,000', '$500,000', '6-36', '1-2', '1st - 2nd (50% net)', 'MCA', NULL, 'Google Drive', NULL, 'Insurance, Credit Repair, Land / Water Vehicle Dealers, Finance / Investment, Government Services, Non-Profits that accept donations, Non-US Companies', NULL, 'IFS', 'active');
INSERT INTO lenders_mca (lender_name, paper, website, iso_rep, phone, email, submission_docs, submission_type, submission_process, minimum_credit_requirement, minimum_monthly_revenue, max_nsf_negative_days, minimum_daily_balances, minimum_time_in_business, minimum_loan_amount, max_loan_amount, terms, positions, buyouts, products_offered, states_restrictions, google_drive, note, preferred_industries, restricted_industries, relationship, status) VALUES ('Kabbage', 'A/B/C Paper', NULL, NULL, NULL, NULL, '3 Bank Statements and App', NULL, NULL, 500, '$10,000', '3', '$1,000', '1 Year', '$5,000', '$250,000', '3-24', '1-3', '1st - 2nd (50% net)', 'MCA, LOC', NULL, 'Google Drive', NULL, NULL, NULL, 'IFS', 'active');
INSERT INTO lenders_mca (lender_name, paper, website, iso_rep, phone, email, submission_docs, submission_type, submission_process, minimum_credit_requirement, minimum_monthly_revenue, max_nsf_negative_days, minimum_daily_balances, minimum_time_in_business, minimum_loan_amount, max_loan_amount, terms, positions, buyouts, products_offered, states_restrictions, google_drive, note, preferred_industries, restricted_industries, relationship, status) VALUES ('Lendio', 'B/C Paper', NULL, NULL, NULL, NULL, '3 Bank Statements and App', NULL, NULL, 550, '$5,000', '3', '$500', '6 months', '$1,000', '$1,000,000', '3-36', '1-5', NULL, 'MCA, LOC, Term', NULL, 'Google Drive', NULL, NULL, NULL, 'IFS', 'active');
INSERT INTO lenders_mca (lender_name, paper, website, iso_rep, phone, email, submission_docs, submission_type, submission_process, minimum_credit_requirement, minimum_monthly_revenue, max_nsf_negative_days, minimum_daily_balances, minimum_time_in_business, minimum_loan_amount, max_loan_amount, terms, positions, buyouts, products_offered, states_restrictions, google_drive, note, preferred_industries, restricted_industries, relationship, status) VALUES ('Forward', 'A/C Paper', NULL, NULL, NULL, NULL, '3 Bank Statements and App', NULL, NULL, 500, '$10,000', '5', '$1,000', '1 Year', '$5,000', '$500,000', '3-18', '1-3', NULL, 'MCA', NULL, 'Google Drive', NULL, 'Banks, Credit Unions, Mortgage Lenders, Non-Bank Finance Companies,  Money Services Businesses, Bail Bonding, Factoring & Purchase Order Financing, Financial Transaction Processing, Credit Protection, Restoration & Repair, Collection Agencies & Debt Buyers, Debt & Tax Reduction Services, Securities & Commodities Dealers & Brokers, Title Companies/ Escrow Agencies, Churches', NULL, 'IFS', 'active');
INSERT INTO lenders_mca (lender_name, paper, website, iso_rep, phone, email, submission_docs, submission_type, submission_process, minimum_credit_requirement, minimum_monthly_revenue, max_nsf_negative_days, minimum_daily_balances, minimum_time_in_business, minimum_loan_amount, max_loan_amount, terms, positions, buyouts, products_offered, states_restrictions, google_drive, note, preferred_industries, restricted_industries, relationship, status) VALUES ('Fundkite', 'A/C Paper', NULL, NULL, NULL, NULL, '3 Bank Statements and App', NULL, NULL, 600, '$40,000', '5', '$800', '1 Year', '$5,000', '$250,000', '3-12', '1-3', '1st - 2nd (50% net)', 'MCA', NULL, 'Google Drive', NULL, NULL, NULL, 'IFS', 'active');
INSERT INTO lenders_mca (lender_name, paper, website, iso_rep, phone, email, submission_docs, submission_type, submission_process, minimum_credit_requirement, minimum_monthly_revenue, max_nsf_negative_days, minimum_daily_balances, minimum_time_in_business, minimum_loan_amount, max_loan_amount, terms, positions, buyouts, products_offered, states_restrictions, google_drive, note, preferred_industries, restricted_industries, relationship, status) VALUES ('Lendr', 'B/C Paper', NULL, NULL, NULL, NULL, '3 Bank Statements and App', NULL, NULL, NULL, '$10,000', '5', NULL, '6 Months', '$10,000', '$150,000', '6-12', '1-5', NULL, 'MCA', NULL, 'Google Drive', NULL, NULL, NULL, 'IFS', 'active');
INSERT INTO lenders_mca (lender_name, paper, website, iso_rep, phone, email, submission_docs, submission_type, submission_process, minimum_credit_requirement, minimum_monthly_revenue, max_nsf_negative_days, minimum_daily_balances, minimum_time_in_business, minimum_loan_amount, max_loan_amount, terms, positions, buyouts, products_offered, states_restrictions, google_drive, note, preferred_industries, restricted_industries, relationship, status) VALUES ('Smartline', 'A Paper', NULL, NULL, NULL, NULL, '3 Bank Statements and App', NULL, NULL, 580, '$30,000', '2', '$1,500', '2 Years', '$20,000', '$300,000', '6-48', '1st', '1st - 2nd (50% net)', 'MCA', NULL, 'Google Drive', NULL, NULL, NULL, 'IFS', 'active');
INSERT INTO lenders_mca (lender_name, paper, website, iso_rep, phone, email, submission_docs, submission_type, submission_process, minimum_credit_requirement, minimum_monthly_revenue, max_nsf_negative_days, minimum_daily_balances, minimum_time_in_business, minimum_loan_amount, max_loan_amount, terms, positions, buyouts, products_offered, states_restrictions, google_drive, note, preferred_industries, restricted_industries, relationship, status) VALUES ('Rapid Finance', 'B Paper', NULL, NULL, NULL, NULL, '3 Bank Statements and App', NULL, NULL, 520, '$15,000', '7', '$1,200', '1 Year', '$10,000', '$200,000', '3-18', '1-3', NULL, 'MCA', NULL, 'Google Drive', NULL, NULL, NULL, 'IFS', 'active');

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
