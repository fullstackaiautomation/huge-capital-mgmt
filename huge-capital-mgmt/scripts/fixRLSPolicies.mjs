#!/usr/bin/env node

/**
 * Fix RLS Policies for Lender Tables
 * Drops restrictive policies and creates permissive ones for authenticated and service role
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const tables = [
  'lenders_term_loans',
  'lenders_dscr',
  'lenders_equipment_financing',
  'lenders_fix_flip',
  'lenders_new_construction',
  'lenders_commercial_real_estate',
  'lenders_mca_debt_restructuring',
  'lenders_conventional_tl_loc'
];

console.log('⚠️  Note: RLS policy changes must be done via Supabase dashboard SQL editor');
console.log('     using a service role key (not anon key)\n');

console.log('📋 SQL commands to fix RLS policies:\n');

for (const table of tables) {
  console.log(`-- For table: ${table}`);
  console.log(`-- Run these as a service role (not anon) in SQL editor:`);
  console.log(`\nDROP POLICY IF EXISTS "Allow authenticated users to view all ${table.replace(/^lenders_/, '').replace(/_/g, ' ')} lenders" ON ${table};`);
  console.log(`DROP POLICY IF EXISTS "Allow authenticated users to insert ${table.replace(/^lenders_/, '').replace(/_/g, ' ')} lenders" ON ${table};`);
  console.log(`DROP POLICY IF EXISTS "Allow authenticated users to update ${table.replace(/^lenders_/, '').replace(/_/g, ' ')} lenders" ON ${table};`);
  console.log(`DROP POLICY IF EXISTS "Allow authenticated users to delete ${table.replace(/^lenders_/, '').replace(/_/g, ' ')} lenders" ON ${table};`);
  console.log(`\nCREATE POLICY "Enable all operations for authenticated users" ON ${table}`);
  console.log(`  USING (true) WITH CHECK (true);\n`);
}

console.log('\n✅ Copy and paste the above SQL into your Supabase SQL editor');
console.log('   (Make sure you are using service_role key, not anon key)');
console.log('   Then run the import script again.\n');
