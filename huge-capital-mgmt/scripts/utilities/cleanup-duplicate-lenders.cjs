const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDuplicates() {
  console.log('\n=== CLEANING UP EMMY CAPITAL DUPLICATES ===\n');

  // Get all Emmy Capital records
  const { data: emmyRecords } = await supabase
    .from('lenders_mca')
    .select('*')
    .eq('lender_name', 'Emmy Capital')
    .order('created_at', { ascending: true });

  console.log(`Found ${emmyRecords.length} Emmy Capital records`);

  // Keep the one with email: david@emmycapital.com (the correct one from the Excel)
  const correctEmmy = emmyRecords.find(r => r.email === 'david@emmycapital.com');
  const duplicateEmmys = emmyRecords.filter(r => r.id !== correctEmmy.id);

  console.log(`Keeping record with email: ${correctEmmy.email}`);
  console.log(`Deleting ${duplicateEmmys.length} duplicate(s)...`);

  for (const dup of duplicateEmmys) {
    const { error } = await supabase
      .from('lenders_mca')
      .delete()
      .eq('id', dup.id);

    if (error) {
      console.log(`❌ Error deleting ${dup.email}: ${error.message}`);
    } else {
      console.log(`✓ Deleted duplicate with email: ${dup.email}`);
    }
  }

  console.log('\n=== CLEANING UP CREDIT BENCH/BAYFIRST DUPLICATES ===\n');

  // Get all Credit Bench/Bayfirst records
  const { data: creditRecords } = await supabase
    .from('lenders_sba')
    .select('*')
    .eq('lender_name', 'Credit Bench/Bayfirst')
    .order('created_at', { ascending: true });

  console.log(`Found ${creditRecords.length} Credit Bench/Bayfirst records`);

  // Keep only the first one (they're all the same)
  const correctCredit = creditRecords[0];
  const duplicateCredits = creditRecords.slice(1);

  console.log(`Keeping first record (ID: ${correctCredit.id})`);
  console.log(`Deleting ${duplicateCredits.length} duplicate(s)...`);

  for (const dup of duplicateCredits) {
    const { error } = await supabase
      .from('lenders_sba')
      .delete()
      .eq('id', dup.id);

    if (error) {
      console.log(`❌ Error deleting ID ${dup.id}: ${error.message}`);
    } else {
      console.log(`✓ Deleted duplicate ID: ${dup.id}`);
    }
  }

  console.log('\n=== CLEANUP COMPLETE ===\n');

  // Verify final counts
  const { data: finalEmmy } = await supabase
    .from('lenders_mca')
    .select('lender_name, email')
    .eq('lender_name', 'Emmy Capital');

  const { data: finalCredit } = await supabase
    .from('lenders_sba')
    .select('lender_name, email')
    .eq('lender_name', 'Credit Bench/Bayfirst');

  console.log('Final Emmy Capital records:', finalEmmy.length);
  finalEmmy.forEach(r => console.log(`  - ${r.lender_name} (${r.email})`));

  console.log('\nFinal Credit Bench/Bayfirst records:', finalCredit.length);
  finalCredit.forEach(r => console.log(`  - ${r.lender_name} (${r.email})`));
}

cleanupDuplicates();
