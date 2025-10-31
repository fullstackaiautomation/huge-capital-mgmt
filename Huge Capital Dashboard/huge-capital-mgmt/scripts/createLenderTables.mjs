#!/usr/bin/env node

/**
 * Create Lender Tables
 * Directly create tables using Supabase client
 *
 * Usage: node scripts/createLenderTables.mjs
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const tableDefinitions = [
  {
    name: 'lenders_term_loans',
    sql: `
      CREATE TABLE IF NOT EXISTS lenders_term_loans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lender_name TEXT NOT NULL,
        contact_person TEXT,
        phone TEXT,
        email TEXT,
        submission_docs TEXT,
        submission_process TEXT,
        timeline TEXT,
        states_available TEXT,
        products_offered TEXT,
        min_loan_amount TEXT,
        max_loan_amount TEXT,
        use_of_funds TEXT,
        credit_requirement TEXT,
        preferred_industries TEXT,
        restricted_industries TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by TEXT,
        updated_by TEXT,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'archived')),
        relationship TEXT DEFAULT 'Huge Capital' CHECK (relationship IN ('Huge Capital', 'IFS'))
      );
      CREATE INDEX IF NOT EXISTS idx_lenders_term_loans_lender_name ON lenders_term_loans(lender_name);
      CREATE INDEX IF NOT EXISTS idx_lenders_term_loans_status ON lenders_term_loans(status);
      CREATE INDEX IF NOT EXISTS idx_lenders_term_loans_relationship ON lenders_term_loans(relationship);
      ALTER TABLE lenders_term_loans ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Allow authenticated users to view all term loans lenders" ON lenders_term_loans FOR SELECT USING (auth.role() = 'authenticated');
      CREATE POLICY "Allow authenticated users to insert term loans lenders" ON lenders_term_loans FOR INSERT WITH CHECK (auth.role() = 'authenticated');
      CREATE POLICY "Allow authenticated users to update term loans lenders" ON lenders_term_loans FOR UPDATE USING (auth.role() = 'authenticated');
      CREATE POLICY "Allow authenticated users to delete term loans lenders" ON lenders_term_loans FOR DELETE USING (auth.role() = 'authenticated');
    `
  },
  {
    name: 'lenders_dscr',
    sql: `
      CREATE TABLE IF NOT EXISTS lenders_dscr (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lender_name TEXT NOT NULL,
        contact_person TEXT,
        phone TEXT,
        email TEXT,
        submission_process TEXT,
        min_loan_amount TEXT,
        max_loan_amount TEXT,
        max_ltv TEXT,
        credit_requirement TEXT,
        rural TEXT,
        states TEXT,
        drive_link TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by TEXT,
        updated_by TEXT,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'archived')),
        relationship TEXT DEFAULT 'Huge Capital' CHECK (relationship IN ('Huge Capital', 'IFS'))
      );
      CREATE INDEX IF NOT EXISTS idx_lenders_dscr_lender_name ON lenders_dscr(lender_name);
      CREATE INDEX IF NOT EXISTS idx_lenders_dscr_status ON lenders_dscr(status);
      CREATE INDEX IF NOT EXISTS idx_lenders_dscr_relationship ON lenders_dscr(relationship);
      ALTER TABLE lenders_dscr ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Allow authenticated users to view all dscr lenders" ON lenders_dscr FOR SELECT USING (auth.role() = 'authenticated');
      CREATE POLICY "Allow authenticated users to insert dscr lenders" ON lenders_dscr FOR INSERT WITH CHECK (auth.role() = 'authenticated');
      CREATE POLICY "Allow authenticated users to update dscr lenders" ON lenders_dscr FOR UPDATE USING (auth.role() = 'authenticated');
      CREATE POLICY "Allow authenticated users to delete dscr lenders" ON lenders_dscr FOR DELETE USING (auth.role() = 'authenticated');
    `
  },
  {
    name: 'lenders_equipment_financing',
    sql: `
      CREATE TABLE IF NOT EXISTS lenders_equipment_financing (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lender_name TEXT NOT NULL,
        iso_rep TEXT,
        phone TEXT,
        email TEXT,
        submission_process TEXT,
        minimum_credit_requirement TEXT,
        min_time_in_business TEXT,
        min_loan_amount TEXT,
        max_loan_amount TEXT,
        terms TEXT,
        rates TEXT,
        do_positions_matter TEXT,
        financing_types TEXT,
        states_restrictions TEXT,
        preferred_equipment TEXT,
        equipment_restrictions TEXT,
        website TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by TEXT,
        updated_by TEXT,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'archived')),
        relationship TEXT DEFAULT 'Huge Capital' CHECK (relationship IN ('Huge Capital', 'IFS'))
      );
      CREATE INDEX IF NOT EXISTS idx_lenders_equipment_financing_lender_name ON lenders_equipment_financing(lender_name);
      CREATE INDEX IF NOT EXISTS idx_lenders_equipment_financing_status ON lenders_equipment_financing(status);
      CREATE INDEX IF NOT EXISTS idx_lenders_equipment_financing_relationship ON lenders_equipment_financing(relationship);
      ALTER TABLE lenders_equipment_financing ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Allow authenticated users to view all equipment financing lenders" ON lenders_equipment_financing FOR SELECT USING (auth.role() = 'authenticated');
      CREATE POLICY "Allow authenticated users to insert equipment financing lenders" ON lenders_equipment_financing FOR INSERT WITH CHECK (auth.role() = 'authenticated');
      CREATE POLICY "Allow authenticated users to update equipment financing lenders" ON lenders_equipment_financing FOR UPDATE USING (auth.role() = 'authenticated');
      CREATE POLICY "Allow authenticated users to delete equipment financing lenders" ON lenders_equipment_financing FOR DELETE USING (auth.role() = 'authenticated');
    `
  },
  {
    name: 'lenders_fix_flip',
    sql: `
      CREATE TABLE IF NOT EXISTS lenders_fix_flip (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lender_name TEXT NOT NULL,
        contact_person TEXT,
        phone TEXT,
        email TEXT,
        submission_process TEXT,
        min_loan_amount TEXT,
        max_loan_amount TEXT,
        max_ltv TEXT,
        max_ltc TEXT,
        credit_requirement TEXT,
        rural TEXT,
        states TEXT,
        drive_link TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by TEXT,
        updated_by TEXT,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'archived')),
        relationship TEXT DEFAULT 'Huge Capital' CHECK (relationship IN ('Huge Capital', 'IFS'))
      );
      CREATE INDEX IF NOT EXISTS idx_lenders_fix_flip_lender_name ON lenders_fix_flip(lender_name);
      CREATE INDEX IF NOT EXISTS idx_lenders_fix_flip_status ON lenders_fix_flip(status);
      CREATE INDEX IF NOT EXISTS idx_lenders_fix_flip_relationship ON lenders_fix_flip(relationship);
      ALTER TABLE lenders_fix_flip ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Allow authenticated users to view all fix flip lenders" ON lenders_fix_flip FOR SELECT USING (auth.role() = 'authenticated');
      CREATE POLICY "Allow authenticated users to insert fix flip lenders" ON lenders_fix_flip FOR INSERT WITH CHECK (auth.role() = 'authenticated');
      CREATE POLICY "Allow authenticated users to update fix flip lenders" ON lenders_fix_flip FOR UPDATE USING (auth.role() = 'authenticated');
      CREATE POLICY "Allow authenticated users to delete fix flip lenders" ON lenders_fix_flip FOR DELETE USING (auth.role() = 'authenticated');
    `
  },
  {
    name: 'lenders_new_construction',
    sql: `
      CREATE TABLE IF NOT EXISTS lenders_new_construction (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lender_name TEXT NOT NULL,
        contact_person TEXT,
        phone TEXT,
        email TEXT,
        website TEXT,
        submission_process TEXT,
        min_loan_amount TEXT,
        max_loan_amount TEXT,
        max_ltv TEXT,
        max_ltc TEXT,
        max_units TEXT,
        credit_requirement TEXT,
        rural TEXT,
        states TEXT,
        drive_link TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by TEXT,
        updated_by TEXT,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'archived')),
        relationship TEXT DEFAULT 'Huge Capital' CHECK (relationship IN ('Huge Capital', 'IFS'))
      );
      CREATE INDEX IF NOT EXISTS idx_lenders_new_construction_lender_name ON lenders_new_construction(lender_name);
      CREATE INDEX IF NOT EXISTS idx_lenders_new_construction_status ON lenders_new_construction(status);
      CREATE INDEX IF NOT EXISTS idx_lenders_new_construction_relationship ON lenders_new_construction(relationship);
      ALTER TABLE lenders_new_construction ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Allow authenticated users to view all new construction lenders" ON lenders_new_construction FOR SELECT USING (auth.role() = 'authenticated');
      CREATE POLICY "Allow authenticated users to insert new construction lenders" ON lenders_new_construction FOR INSERT WITH CHECK (auth.role() = 'authenticated');
      CREATE POLICY "Allow authenticated users to update new construction lenders" ON lenders_new_construction FOR UPDATE USING (auth.role() = 'authenticated');
      CREATE POLICY "Allow authenticated users to delete new construction lenders" ON lenders_new_construction FOR DELETE USING (auth.role() = 'authenticated');
    `
  },
  {
    name: 'lenders_commercial_real_estate',
    sql: `
      CREATE TABLE IF NOT EXISTS lenders_commercial_real_estate (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lender_name TEXT NOT NULL,
        contact_person TEXT,
        phone TEXT,
        email TEXT,
        website TEXT,
        products_offered TEXT,
        states_available TEXT,
        min_loan_amount TEXT,
        max_loan_amount TEXT,
        credit_requirement TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by TEXT,
        updated_by TEXT,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'archived')),
        relationship TEXT DEFAULT 'Huge Capital' CHECK (relationship IN ('Huge Capital', 'IFS'))
      );
      CREATE INDEX IF NOT EXISTS idx_lenders_commercial_real_estate_lender_name ON lenders_commercial_real_estate(lender_name);
      CREATE INDEX IF NOT EXISTS idx_lenders_commercial_real_estate_status ON lenders_commercial_real_estate(status);
      CREATE INDEX IF NOT EXISTS idx_lenders_commercial_real_estate_relationship ON lenders_commercial_real_estate(relationship);
      ALTER TABLE lenders_commercial_real_estate ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Allow authenticated users to view all commercial real estate lenders" ON lenders_commercial_real_estate FOR SELECT USING (auth.role() = 'authenticated');
      CREATE POLICY "Allow authenticated users to insert commercial real estate lenders" ON lenders_commercial_real_estate FOR INSERT WITH CHECK (auth.role() = 'authenticated');
      CREATE POLICY "Allow authenticated users to update commercial real estate lenders" ON lenders_commercial_real_estate FOR UPDATE USING (auth.role() = 'authenticated');
      CREATE POLICY "Allow authenticated users to delete commercial real estate lenders" ON lenders_commercial_real_estate FOR DELETE USING (auth.role() = 'authenticated');
    `
  },
  {
    name: 'lenders_mca_debt_restructuring',
    sql: `
      CREATE TABLE IF NOT EXISTS lenders_mca_debt_restructuring (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lender_name TEXT NOT NULL,
        contact_person TEXT,
        phone TEXT,
        email TEXT,
        website TEXT,
        products_offered TEXT,
        states_available TEXT,
        min_loan_amount TEXT,
        max_loan_amount TEXT,
        credit_requirement TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by TEXT,
        updated_by TEXT,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'archived')),
        relationship TEXT DEFAULT 'Huge Capital' CHECK (relationship IN ('Huge Capital', 'IFS'))
      );
      CREATE INDEX IF NOT EXISTS idx_lenders_mca_debt_restructuring_lender_name ON lenders_mca_debt_restructuring(lender_name);
      CREATE INDEX IF NOT EXISTS idx_lenders_mca_debt_restructuring_status ON lenders_mca_debt_restructuring(status);
      CREATE INDEX IF NOT EXISTS idx_lenders_mca_debt_restructuring_relationship ON lenders_mca_debt_restructuring(relationship);
      ALTER TABLE lenders_mca_debt_restructuring ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Allow authenticated users to view all mca debt restructuring lenders" ON lenders_mca_debt_restructuring FOR SELECT USING (auth.role() = 'authenticated');
      CREATE POLICY "Allow authenticated users to insert mca debt restructuring lenders" ON lenders_mca_debt_restructuring FOR INSERT WITH CHECK (auth.role() = 'authenticated');
      CREATE POLICY "Allow authenticated users to update mca debt restructuring lenders" ON lenders_mca_debt_restructuring FOR UPDATE USING (auth.role() = 'authenticated');
      CREATE POLICY "Allow authenticated users to delete mca debt restructuring lenders" ON lenders_mca_debt_restructuring FOR DELETE USING (auth.role() = 'authenticated');
    `
  },
  {
    name: 'lenders_conventional_tl_loc',
    sql: `
      CREATE TABLE IF NOT EXISTS lenders_conventional_tl_loc (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lender_name TEXT NOT NULL,
        contact_person TEXT,
        phone TEXT,
        email TEXT,
        website TEXT,
        states_available TEXT,
        submission_process TEXT,
        docs_required TEXT,
        timeline TEXT,
        terms TEXT,
        rates TEXT,
        min_loan_amount TEXT,
        max_loan_amount TEXT,
        credit_requirement TEXT,
        banking_relationship_required TEXT,
        bank_account_opened_to_fund TEXT,
        use_of_funds TEXT,
        preferred_industries TEXT,
        restricted_industries TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by TEXT,
        updated_by TEXT,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'archived')),
        relationship TEXT DEFAULT 'Huge Capital' CHECK (relationship IN ('Huge Capital', 'IFS'))
      );
      CREATE INDEX IF NOT EXISTS idx_lenders_conventional_tl_loc_lender_name ON lenders_conventional_tl_loc(lender_name);
      CREATE INDEX IF NOT EXISTS idx_lenders_conventional_tl_loc_status ON lenders_conventional_tl_loc(status);
      CREATE INDEX IF NOT EXISTS idx_lenders_conventional_tl_loc_relationship ON lenders_conventional_tl_loc(relationship);
      ALTER TABLE lenders_conventional_tl_loc ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Allow authenticated users to view all conventional tl loc lenders" ON lenders_conventional_tl_loc FOR SELECT USING (auth.role() = 'authenticated');
      CREATE POLICY "Allow authenticated users to insert conventional tl loc lenders" ON lenders_conventional_tl_loc FOR INSERT WITH CHECK (auth.role() = 'authenticated');
      CREATE POLICY "Allow authenticated users to update conventional tl loc lenders" ON lenders_conventional_tl_loc FOR UPDATE USING (auth.role() = 'authenticated');
      CREATE POLICY "Allow authenticated users to delete conventional tl loc lenders" ON lenders_conventional_tl_loc FOR DELETE USING (auth.role() = 'authenticated');
    `
  }
];

async function createTables() {
  console.log('📋 Creating lender tables in Supabase...\n');

  for (const table of tableDefinitions) {
    console.log(`⏳ Creating: ${table.name}`);

    try {
      // Try to create table by inserting a dummy record (will fail if table doesn't exist)
      const { error } = await supabase
        .from(table.name)
        .insert([{
          lender_name: '__test__',
          status: 'active',
          relationship: 'Huge Capital'
        }])
        .select();

      if (error) {
        if (error.message.includes('does not exist') || error.message.includes('relation')) {
          console.log(`⚠️  Table doesn't exist. You need to create it manually in Supabase dashboard.`);
          console.log(`    Table name: ${table.name}`);
        } else {
          console.error(`❌ Error: ${error.message}`);
        }
      } else {
        // Delete the test record
        await supabase
          .from(table.name)
          .delete()
          .eq('lender_name', '__test__');
        console.log(`✅ ${table.name}`);
      }
    } catch (err) {
      console.error(`❌ Exception in ${table.name}: ${err.message}`);
    }
  }

  console.log('\n⚠️  Table creation requires Supabase dashboard access.');
  console.log('    Please visit your Supabase dashboard and run the SQL migration files manually.');
  console.log('    Migration files are located in: supabase/migrations/');
}

createTables().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
