const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function removeDuplicates() {
  console.log('\n=== REMOVING DUPLICATE MCA LENDERS ===\n');

  const lendersToClean = ['Emmy Capital', 'Fintoro Capital', 'Fox'];

  for (const lenderName of lendersToClean) {
    console.log(`\nProcessing: ${lenderName}`);

    // Get all records for this lender
    const { data: records, error } = await supabase
      .from('lenders_mca')
      .select('*')
      .eq('lender_name', lenderName)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`Error fetching ${lenderName}:`, error.message);
      continue;
    }

    console.log(`  Found ${records.length} records`);

    if (records.length <= 1) {
      console.log(`  ✓ No duplicates to remove`);
      continue;
    }

    // Keep the first one, delete the rest
    const keepRecord = records[0];
    const duplicates = records.slice(1);

    console.log(`  Keeping record ID: ${keepRecord.id} (created: ${keepRecord.created_at})`);
    console.log(`  Deleting ${duplicates.length} duplicate(s)...`);

    for (const dup of duplicates) {
      const { error: deleteError } = await supabase
        .from('lenders_mca')
        .delete()
        .eq('id', dup.id);

      if (deleteError) {
        console.log(`    ❌ Error deleting ID ${dup.id}: ${deleteError.message}`);
      } else {
        console.log(`    ✓ Deleted ID: ${dup.id} (created: ${dup.created_at})`);
      }
    }
  }

  console.log('\n=== VERIFICATION ===\n');

  // Verify final state
  for (const lenderName of lendersToClean) {
    const { data: finalRecords } = await supabase
      .from('lenders_mca')
      .select('lender_name, iso_rep, email')
      .eq('lender_name', lenderName);

    console.log(`${lenderName}: ${finalRecords.length} record(s)`);
    finalRecords.forEach(r => {
      console.log(`  - ${r.lender_name} | ${r.iso_rep} | ${r.email}`);
    });
  }

  // Get total MCA count
  const { count } = await supabase
    .from('lenders_mca')
    .select('*', { count: 'exact', head: true });

  console.log(`\nTotal MCA Lenders: ${count}`);
}

removeDuplicates();
