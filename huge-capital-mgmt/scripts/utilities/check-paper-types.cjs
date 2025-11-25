const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPaperTypes() {
  console.log('\n=== CHECKING MCA PAPER TYPES ===\n');

  const { data, error } = await supabase
    .from('lenders_mca')
    .select('lender_name, paper')
    .eq('status', 'active')
    .order('lender_name', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('All MCA Lenders with Paper Types:\n');
  data.forEach(lender => {
    console.log(`${lender.lender_name.padEnd(30)} | Paper: ${lender.paper || 'NULL'}`);
  });

  console.log('\n\nGrouped by Paper Type:\n');

  const byPaper = {};
  data.forEach(lender => {
    const paper = lender.paper || 'NULL';
    if (!byPaper[paper]) {
      byPaper[paper] = [];
    }
    byPaper[paper].push(lender.lender_name);
  });

  Object.keys(byPaper).sort().forEach(paper => {
    console.log(`\n${paper}:`);
    byPaper[paper].forEach(name => console.log(`  - ${name}`));
  });
}

checkPaperTypes();
