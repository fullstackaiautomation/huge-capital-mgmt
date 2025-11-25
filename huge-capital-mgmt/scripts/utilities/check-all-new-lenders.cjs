const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllNewLenders() {
  console.log('\n=== CHECKING ALL NEW LENDERS ===\n');

  // Check MCA
  console.log('MCA Lenders:');
  const mcaNames = ['IOU Financial', 'Fox', 'Emmy Capital', 'Fintoro Capital'];

  for (const name of mcaNames) {
    const { data, error } = await supabase
      .from('lenders_mca')
      .select('lender_name, iso_rep, email, paper')
      .eq('lender_name', name);

    if (error || !data || data.length === 0) {
      console.log(`  ❌ ${name}: NOT FOUND`);
    } else {
      console.log(`  ✓ ${name}: ${data.length} record(s)`);
      data.forEach(r => console.log(`     - ${r.paper} | ${r.iso_rep} | ${r.email}`));
    }
  }

  // Check SBA
  console.log('\nSBA Lenders:');
  const sbaNames = ['Credit Bench/Bayfirst', 'Newity'];

  for (const name of sbaNames) {
    const { data, error } = await supabase
      .from('lenders_sba')
      .select('lender_name, contact_person, email, products_offered')
      .eq('lender_name', name);

    if (error || !data || data.length === 0) {
      console.log(`  ❌ ${name}: NOT FOUND`);
    } else {
      console.log(`  ✓ ${name}: ${data.length} record(s)`);
      data.forEach(r => console.log(`     - ${r.contact_person} | ${r.email} | ${r.products_offered}`));
    }
  }

  // Check for any IOU variations
  console.log('\n\n=== SEARCHING FOR IOU VARIATIONS ===');
  const { data: iouData } = await supabase
    .from('lenders_mca')
    .select('lender_name, iso_rep, email')
    .ilike('lender_name', '%iou%');

  console.log(`Found ${iouData.length} records with "IOU":`);
  iouData.forEach(r => console.log(`  - ${r.lender_name} | ${r.email}`));

  // Check for any Credit/Bayfirst variations
  console.log('\n=== SEARCHING FOR CREDIT/BAYFIRST VARIATIONS ===');
  const { data: creditData } = await supabase
    .from('lenders_sba')
    .select('lender_name, contact_person, email')
    .or('lender_name.ilike.%credit%,lender_name.ilike.%bayfirst%');

  console.log(`Found ${creditData.length} records:`);
  creditData.forEach(r => console.log(`  - ${r.lender_name} | ${r.email}`));
}

checkAllNewLenders();
