const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugMCASorting() {
  console.log('\n=== DEBUGGING MCA SORTING ===\n');

  // Get all active MCA lenders with Huge Capital relationship
  const { data, error } = await supabase
    .from('lenders_mca')
    .select('lender_name, paper, relationship, sort_order')
    .eq('status', 'active')
    .eq('relationship', 'Huge Capital')
    .order('lender_name', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Huge Capital MCA Lenders (what the UI shows):\n');
  data.forEach((lender, idx) => {
    console.log(`${(idx + 1).toString().padStart(2)}. ${lender.lender_name.padEnd(25)} | Paper: ${(lender.paper || 'NULL').padEnd(20)} | sort_order: ${lender.sort_order || 0}`);
  });

  console.log('\n\nTotal Huge Capital MCA Lenders:', data.length);

  // Check if sort_order is set
  const withSortOrder = data.filter(l => l.sort_order && l.sort_order !== 0);
  console.log('Lenders with sort_order set:', withSortOrder.length);
  if (withSortOrder.length > 0) {
    console.log('\nLenders with sort_order:');
    withSortOrder.forEach(l => {
      console.log(`  ${l.lender_name}: ${l.sort_order}`);
    });
  }

  // List the exact lender names for the ranking
  console.log('\n\nExact lender names to use in ranking:');
  data.forEach(l => {
    console.log(`  '${l.lender_name}': X,`);
  });
}

debugMCASorting();
