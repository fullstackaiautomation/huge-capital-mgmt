const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client with SERVICE_ROLE_KEY to bypass RLS
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Read the Excel file
const excelPath = 'C:\\Users\\blkw\\OneDrive\\Documents\\Github\\Huge Capital\\huge-capital-mgmt\\imports\\2. Huge Capital Lender List.xlsx';
const workbook = XLSX.readFile(excelPath);

async function addNewMCALenders() {
  console.log('\n=== ADDING NEW MCA LENDERS ===\n');

  const sheet = workbook.Sheets['MCA'];
  const data = XLSX.utils.sheet_to_json(sheet);

  const newLenders = [
    {
      lender_name: 'IOU Financial',
      paper: 'A Paper',
      iso_rep: 'Todd Christensen',
      phone: '(678)-379-4472',
      email: 'tchristensen@ioufinancial.com',
      submission_docs: '3 Months Bank Statements and App',
      submission_process: 'Submit Through Client Portal',
      minimum_credit_requirement: 650,
      minimum_monthly_revenue: null,
      max_nsf_negative_days: null,
      minimum_daily_balances: '$3k',
      minimum_time_in_business: '1 Year',
      minimum_loan_amount: '$15k',
      max_loan_amount: '$1.5mm',
      terms: '6-24 Months\n(Daily, Weekly, \nBi-Weekly, Monthly)',
      positions: '1st-2nd',
      buyouts: '2 Positions \n(Must net 50%)',
      products_offered: 'MCA/Loan',
      states_restrictions: 'MT, NV, SD, VT, HI, ND',
      preferred_industries: 'Medical, Veterinary, Dentists, Beer and Liquor, Electrical Contractors, Spa, Hotels',
      restricted_industries: 'Adult, ATM, Attorneys, Bail Bonding, Blood/Organ, Call Centers, Collection Agencies, Construction (Ground-up), Farming, Fitness, Holistic Doctors, Home-Based Trucking, Investment, Mailing Companies, Marijuana, Marketing Companies, Mining, Media, MLM, Non-Profits, Oil and Gas, Payday Lender, More',
      website: 'Link',
      google_drive: 'Google Drive',
      note: '',
      status: 'active'
    },
    {
      lender_name: 'Fox',
      paper: 'B Paper',
      iso_rep: 'Eli Selwyn',
      phone: '(347)-562-8796',
      email: 'elis@foxbusinessfunding.com',
      submission_docs: '3 Months Bank Statements and App',
      submission_process: 'elis@foxbusinessfunding.com',
      minimum_credit_requirement: 550,
      minimum_monthly_revenue: '$50k',
      max_nsf_negative_days: '5',
      minimum_daily_balances: '$2k',
      minimum_time_in_business: '1 Year',
      minimum_loan_amount: '$25k',
      max_loan_amount: '$250k',
      terms: '3-12 Months (Daily and Weekly)',
      positions: '1st / 2nd / 3rd',
      buyouts: '2 Positions (Must net 50%)',
      products_offered: 'MCA',
      states_restrictions: 'N/A',
      preferred_industries: 'Restaurants, Retail, Medical, Hotels/Motels, Bars, Auto Repair, Urgent Care',
      restricted_industries: 'Adult, Attorneys, Trucking, Cannabis',
      website: 'Link',
      google_drive: 'Google Drive',
      note: '',
      status: 'active'
    },
    {
      lender_name: 'Emmy Capital',
      paper: 'C-D Paper',
      iso_rep: 'David Plagman',
      phone: '(602)-688-0675',
      email: 'david@emmycapital.com',
      submission_docs: '3 Months Bank Statements and App',
      submission_process: 'david@emmycapital.com',
      minimum_credit_requirement: null,
      minimum_monthly_revenue: '$25k',
      max_nsf_negative_days: '10',
      minimum_daily_balances: '$1k',
      minimum_time_in_business: '6 Months',
      minimum_loan_amount: '$5k',
      max_loan_amount: '$250k',
      terms: '3-8 Months (Daily and Weekly)',
      positions: '1st / 2nd / 3rd / 4th',
      buyouts: 'Full and Partial Consolidations',
      products_offered: 'MCA',
      states_restrictions: 'N/A',
      preferred_industries: 'Restaurants, Retail, Services',
      restricted_industries: 'Adult, Cannabis, Trucking',
      website: 'Link',
      google_drive: 'Google Drive',
      note: '',
      status: 'active'
    },
    {
      lender_name: 'Fintoro Capital',
      paper: 'C-D Paper',
      iso_rep: 'David Plagman',
      phone: '(602)-688-0675',
      email: 'david@fintorocapital.com',
      submission_docs: '3 Months Bank Statements and App',
      submission_process: 'david@fintorocapital.com',
      minimum_credit_requirement: null,
      minimum_monthly_revenue: '$50k',
      max_nsf_negative_days: '10',
      minimum_daily_balances: '$1k',
      minimum_time_in_business: '1 Year',
      minimum_loan_amount: '$10k',
      max_loan_amount: '$500k',
      terms: '3-12 Months (Daily and Weekly)',
      positions: '1st / 2nd / 3rd / 4th',
      buyouts: 'Full Consolidations',
      products_offered: 'MCA',
      states_restrictions: 'N/A',
      preferred_industries: 'All Industries',
      restricted_industries: 'Adult, Attorneys, Cannabis',
      website: 'Link',
      google_drive: 'Google Drive',
      note: '',
      status: 'active'
    }
  ];

  for (const lender of newLenders) {
    console.log(`Adding ${lender.lender_name}...`);
    const { data, error } = await supabase
      .from('lenders_mca')
      .insert([lender]);

    if (error) {
      console.error(`Error adding ${lender.lender_name}:`, error.message);
    } else {
      console.log(`✓ ${lender.lender_name} added successfully`);
    }
  }
}

async function addNewSBALenders() {
  console.log('\n=== ADDING NEW SBA LENDERS ===\n');

  const newLenders = [
    {
      lender_name: 'Credit Bench/Bayfirst',
      contact_person: 'Luis Garcia',
      phone: 'Luis Cell: 305-783-8413',
      email: 'luis.garcia@bayfirstfinancial.com',
      submission_docs: `1. Driver's Licenses of all owners that have or will have (in case of acquisition and/or partner buyouts) at least a 20% stake in the borrowing business (Borrower).
2. 2022, 2023, and 2024 business tax returns for Seller (in case of acquisition), Borrower and Affiliates, if any (businesses in which owners currently have at least a 20% ownership stake).
3. Interim 2025 P&L and Balance Sheet, as of 3/31/2025 for Seller (in case of acquisition), Borrower and Affiliates, if any (businesses in which owners currently have at least a 20% ownership stake).
4. Business Debt Schedule, use template attached, for Borrower and Affiliates, if any (businesses in which owners currently have at least a 20% ownership stake).
5. 2022, 2023, and 2024 personal taxes for all owners that have or will have (in case of acquisition and/or partner buyouts) at least a 20% stake in the borrowing business.
6. Personal Financial Statement, use template attached, for all owners that have at least a 20% stake in the borrowing business.
7. Last 6 months of business bank statement. And, personal bank statements and retirement accounts that support the amounts entered in the PFSs. The more liquid the Guarantors are the easier the approval.
8. Use of Proceeds, template (in drive).`,
      submission_process: 'Send Full package to Luis and CC Deals Email.',
      timeline: '7 Days For Term Sheet, 30-45 Days of Credit and 30-45 Days of Closing',
      states_available: '50',
      products_offered: 'SBA 7(a), 504',
      minimum_loan_amount: '$50k',
      max_loan_amount: '$5mm',
      use_of_funds: 'Business Acquisition, Working Capital, Partner Buyouts, Debt Refinance, Start-Ups and Equipment',
      credit_requirement: 720,
      preferred_industries: '',
      industry_restrictions: 'Transportation, Warehousing, Food Services, Hotels, Advertising and Consulting Services.',
      google_drive: 'Google Drive',
      note: '720 For Bolt 680 On All Others',
      status: 'active'
    },
    {
      lender_name: 'Newity',
      contact_person: 'Kathy Salgado',
      phone: '(773)-644-6303 ext. 1028',
      email: 'ksalgado@newitymarket.com',
      submission_docs: `1. Most Recent Year Business Tax Return (extension for year if they are not filed)
2. Most Recent Years Personal Tax Returns
3. Debt Schedule
4. 12 Months Bank Statements`,
      submission_process: 'Newity Portal',
      timeline: '2-4 Weeks',
      states_available: '50',
      products_offered: 'Term Loan, SBA',
      minimum_loan_amount: '$25k',
      max_loan_amount: '$350k',
      use_of_funds: 'Working Capital, Debt Refinance and Equipment',
      credit_requirement: 640,
      preferred_industries: 'Restaurants',
      industry_restrictions: 'Link (Make Sure You Go to the GTL Tab/Sheet)',
      google_drive: 'Google Drive',
      note: 'No Hard Credit Check. 10 Years term. Minimum Revenue: $100k Annually. Time in Business: 1+ Year, 4+ Years for Construction',
      status: 'active'
    }
  ];

  for (const lender of newLenders) {
    console.log(`Adding ${lender.lender_name}...`);
    const { data, error } = await supabase
      .from('lenders_sba')
      .insert([lender]);

    if (error) {
      console.error(`Error adding ${lender.lender_name}:`, error.message);
    } else {
      console.log(`✓ ${lender.lender_name} added successfully`);
    }
  }
}

async function main() {
  console.log('Starting lender import process...\n');

  try {
    await addNewMCALenders();
    await addNewSBALenders();

    console.log('\n=== IMPORT COMPLETE ===\n');
    console.log('Summary:');
    console.log('- MCA Lenders Added: 4 (IOU Financial, Fox, Emmy Capital, Fintoro Capital)');
    console.log('- SBA Lenders Added: 2 (Credit Bench/Bayfirst, Newity)');
    console.log('\nNote: Kalamata was already added in a previous migration (20251102000011_add_kalamata_mca.sql)');

  } catch (error) {
    console.error('Error during import:', error);
  }
}

main();