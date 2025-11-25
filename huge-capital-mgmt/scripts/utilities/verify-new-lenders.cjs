const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyLenders() {
  console.log('\n=== VERIFYING NEW MCA LENDERS ===\n');

  const mcaLenders = ['IOU Financial', 'Fox', 'Emmy Capital', 'Fintoro Capital'];

  for (const name of mcaLenders) {
    const { data, error } = await supabase
      .from('lenders_mca')
      .select('lender_name, iso_rep, email, minimum_credit_requirement, paper')
      .eq('lender_name', name)
      .single();

    if (error) {
      console.log(`❌ ${name}: NOT FOUND`);
    } else {
      console.log(`✓ ${name}`);
      console.log(`  Paper: ${data.paper}`);
      console.log(`  ISO Rep: ${data.iso_rep}`);
      console.log(`  Email: ${data.email}`);
      console.log(`  Min Credit: ${data.minimum_credit_requirement || 'N/A'}`);
      console.log('');
    }
  }

  console.log('\n=== VERIFYING NEW SBA LENDERS ===\n');

  const sbaLenders = ['Credit Bench/Bayfirst', 'Newity'];

  for (const name of sbaLenders) {
    const { data, error } = await supabase
      .from('lenders_sba')
      .select('lender_name, contact_person, email, credit_requirement, products_offered')
      .eq('lender_name', name)
      .single();

    if (error) {
      console.log(`❌ ${name}: NOT FOUND`);
    } else {
      console.log(`✓ ${name}`);
      console.log(`  Contact: ${data.contact_person}`);
      console.log(`  Email: ${data.email}`);
      console.log(`  Credit: ${data.credit_requirement}`);
      console.log(`  Products: ${data.products_offered}`);
      console.log('');
    }
  }

  console.log('\n=== TOTAL LENDER COUNTS ===\n');

  const { count: mcaCount } = await supabase
    .from('lenders_mca')
    .select('*', { count: 'exact', head: true });

  const { count: sbaCount } = await supabase
    .from('lenders_sba')
    .select('*', { count: 'exact', head: true });

  console.log(`Total MCA Lenders: ${mcaCount}`);
  console.log(`Total SBA Lenders: ${sbaCount}`);
}

verifyLenders();
