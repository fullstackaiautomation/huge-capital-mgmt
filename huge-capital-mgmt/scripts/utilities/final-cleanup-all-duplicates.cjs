const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function finalCleanup() {
  console.log('\n=== FINAL CLEANUP OF ALL DUPLICATES ===\n');

  // Clean up IOU Financial duplicates
  console.log('Cleaning IOU Financial...');
  const { data: iouRecords } = await supabase
    .from('lenders_mca')
    .select('*')
    .eq('lender_name', 'IOU Financial')
    .order('created_at', { ascending: true });

  if (iouRecords.length > 1) {
    console.log(`  Found ${iouRecords.length} IOU Financial records`);
    const keepIOU = iouRecords[0];
    const deleteIOU = iouRecords.slice(1);

    for (const dup of deleteIOU) {
      await supabase.from('lenders_mca').delete().eq('id', dup.id);
      console.log(`  ✓ Deleted duplicate IOU Financial (ID: ${dup.id})`);
    }
  } else {
    console.log(`  ✓ IOU Financial: ${iouRecords.length} record (no duplicates)`);
  }

  // Clean up Credit Bench/Bayfirst duplicates
  console.log('\nCleaning Credit Bench/Bayfirst...');
  const { data: creditRecords } = await supabase
    .from('lenders_sba')
    .select('*')
    .eq('lender_name', 'Credit Bench/Bayfirst')
    .order('created_at', { ascending: true });

  if (creditRecords.length > 1) {
    console.log(`  Found ${creditRecords.length} Credit Bench/Bayfirst records`);
    const keepCredit = creditRecords[0];
    const deleteCredit = creditRecords.slice(1);

    for (const dup of deleteCredit) {
      await supabase.from('lenders_sba').delete().eq('id', dup.id);
      console.log(`  ✓ Deleted duplicate Credit Bench/Bayfirst (ID: ${dup.id})`);
    }
  } else {
    console.log(`  ✓ Credit Bench/Bayfirst: ${creditRecords.length} record (no duplicates)`);
  }

  // Clean up Newity duplicates
  console.log('\nCleaning Newity...');
  const { data: newityRecords } = await supabase
    .from('lenders_sba')
    .select('*')
    .eq('lender_name', 'Newity')
    .order('created_at', { ascending: true });

  if (newityRecords.length > 1) {
    console.log(`  Found ${newityRecords.length} Newity records`);
    const keepNewity = newityRecords[0];
    const deleteNewity = newityRecords.slice(1);

    for (const dup of deleteNewity) {
      await supabase.from('lenders_sba').delete().eq('id', dup.id);
      console.log(`  ✓ Deleted duplicate Newity (ID: ${dup.id})`);
    }
  } else {
    console.log(`  ✓ Newity: ${newityRecords.length} record (no duplicates)`);
  }

  // Clean up those empty "IOU" records
  console.log('\nCleaning empty IOU records...');
  const { data: emptyIOU } = await supabase
    .from('lenders_mca')
    .select('*')
    .eq('lender_name', 'IOU')
    .is('email', null);

  if (emptyIOU && emptyIOU.length > 0) {
    console.log(`  Found ${emptyIOU.length} empty IOU records`);
    for (const record of emptyIOU) {
      await supabase.from('lenders_mca').delete().eq('id', record.id);
      console.log(`  ✓ Deleted empty IOU record (ID: ${record.id})`);
    }
  }

  console.log('\n=== FINAL VERIFICATION ===\n');

  const { data: finalIOU } = await supabase
    .from('lenders_mca')
    .select('lender_name, iso_rep, email')
    .eq('lender_name', 'IOU Financial');

  const { data: finalFox } = await supabase
    .from('lenders_mca')
    .select('lender_name, iso_rep, email')
    .eq('lender_name', 'Fox');

  const { data: finalEmmy } = await supabase
    .from('lenders_mca')
    .select('lender_name, iso_rep, email')
    .eq('lender_name', 'Emmy Capital');

  const { data: finalFintoro } = await supabase
    .from('lenders_mca')
    .select('lender_name, iso_rep, email')
    .eq('lender_name', 'Fintoro Capital');

  const { data: finalCredit } = await supabase
    .from('lenders_sba')
    .select('lender_name, contact_person, email')
    .eq('lender_name', 'Credit Bench/Bayfirst');

  const { data: finalNewity } = await supabase
    .from('lenders_sba')
    .select('lender_name, contact_person, email')
    .eq('lender_name', 'Newity');

  console.log('MCA Lenders:');
  console.log(`  IOU Financial: ${finalIOU.length} record(s)`);
  console.log(`  Fox: ${finalFox.length} record(s)`);
  console.log(`  Emmy Capital: ${finalEmmy.length} record(s)`);
  console.log(`  Fintoro Capital: ${finalFintoro.length} record(s)`);

  console.log('\nSBA Lenders:');
  console.log(`  Credit Bench/Bayfirst: ${finalCredit.length} record(s)`);
  console.log(`  Newity: ${finalNewity.length} record(s)`);

  const { count: mcaCount } = await supabase
    .from('lenders_mca')
    .select('*', { count: 'exact', head: true });

  const { count: sbaCount } = await supabase
    .from('lenders_sba')
    .select('*', { count: 'exact', head: true });

  console.log(`\nTotal MCA Lenders: ${mcaCount}`);
  console.log(`Total SBA Lenders: ${sbaCount}`);
}

finalCleanup();
