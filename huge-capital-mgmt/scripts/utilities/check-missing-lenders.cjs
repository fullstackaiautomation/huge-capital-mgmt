const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMissingLenders() {
  console.log('\n=== CHECKING EMMY CAPITAL ===\n');

  const { data: emmyData, error: emmyError } = await supabase
    .from('lenders_mca')
    .select('*')
    .ilike('lender_name', '%emmy%');

  if (emmyError) {
    console.error('Error:', emmyError.message);
  } else {
    console.log(`Found ${emmyData.length} records matching "emmy":`);
    emmyData.forEach(lender => {
      console.log(`  - ${lender.lender_name} (${lender.email})`);
    });
  }

  console.log('\n=== CHECKING CREDIT BENCH/BAYFIRST ===\n');

  const { data: creditData, error: creditError } = await supabase
    .from('lenders_sba')
    .select('*')
    .or('lender_name.ilike.%credit%,lender_name.ilike.%bayfirst%');

  if (creditError) {
    console.error('Error:', creditError.message);
  } else {
    console.log(`Found ${creditData.length} records matching "credit" or "bayfirst":`);
    creditData.forEach(lender => {
      console.log(`  - ${lender.lender_name} (${lender.email})`);
    });
  }

  // Try adding them again
  console.log('\n=== ATTEMPTING TO ADD MISSING LENDERS ===\n');

  console.log('Adding Emmy Capital...');
  const { data: emmyInsert, error: emmyInsertError } = await supabase
    .from('lenders_mca')
    .insert([{
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
    }])
    .select();

  if (emmyInsertError) {
    console.log(`❌ Error: ${emmyInsertError.message}`);
  } else {
    console.log(`✓ Emmy Capital added successfully`);
  }

  console.log('\nAdding Credit Bench/Bayfirst...');
  const { data: creditInsert, error: creditInsertError } = await supabase
    .from('lenders_sba')
    .insert([{
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
    }])
    .select();

  if (creditInsertError) {
    console.log(`❌ Error: ${creditInsertError.message}`);
  } else {
    console.log(`✓ Credit Bench/Bayfirst added successfully`);
  }
}

checkMissingLenders();
