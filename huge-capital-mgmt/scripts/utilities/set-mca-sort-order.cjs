const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setMCASortOrder() {
  console.log('\n=== SETTING MCA SORT ORDER ===\n');

  // Exact order from spreadsheet
  const exactOrder = [
    'Credibly',        // 1 - A Paper
    'IOU Financial',   // 2 - A Paper
    'Rapid',           // 3 - A Paper
    'Kalamata',        // 4 - A-B Paper
    'Fundworks',       // 5 - A-B Paper
    'TMRnow',          // 6 - A-B Paper
    'TVT Capital',     // 7 - A-B Paper
    'Fintegra',        // 8 - A-B Paper
    'Fresh Funding',   // 9 - A-B Paper
    'Fintap',          // 10 - B Paper
    'Legend Advance',  // 11 - B Paper
    'Fox',             // 12 - B Paper
    'Mantis',          // 13 - C-D Paper
    'Emmy Capital',    // 14 - C-D Paper
    'Fintoro Capital', // 15 - C-D Paper
  ];

  for (let i = 0; i < exactOrder.length; i++) {
    const lenderName = exactOrder[i];
    const sortOrder = i + 1;

    console.log(`Setting ${lenderName} to sort_order: ${sortOrder}...`);

    const { error } = await supabase
      .from('lenders_mca')
      .update({ sort_order: sortOrder })
      .eq('lender_name', lenderName)
      .eq('relationship', 'Huge Capital');

    if (error) {
      console.log(`  ❌ Error: ${error.message}`);
    } else {
      console.log(`  ✓ Done`);
    }
  }

  console.log('\n=== VERIFYING ===\n');

  const { data } = await supabase
    .from('lenders_mca')
    .select('lender_name, sort_order')
    .eq('status', 'active')
    .eq('relationship', 'Huge Capital')
    .order('sort_order', { ascending: true });

  console.log('New order:');
  data.forEach((l, idx) => {
    console.log(`${(idx + 1).toString().padStart(2)}. ${l.lender_name} (sort_order: ${l.sort_order})`);
  });
}

setMCASortOrder();
