const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://oymwsfyspdvbazklqkpm.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('Applying RLS migration to allow all users to view all deals...\n');

  const statements = [
    // DEALS TABLE
    { name: 'Drop old deals SELECT policy', sql: `DROP POLICY IF EXISTS "Users can view their own deals" ON deals;` },
    { name: 'Create new deals SELECT policy', sql: `CREATE POLICY "Authenticated users can view all deals" ON deals FOR SELECT USING (auth.role() = 'authenticated');` },
    { name: 'Drop old deals INSERT policy', sql: `DROP POLICY IF EXISTS "Users can create deals" ON deals;` },
    { name: 'Create deals INSERT policy', sql: `CREATE POLICY "Users can create their own deals" ON deals FOR INSERT WITH CHECK (auth.uid() = user_id);` },

    // DEAL_OWNERS TABLE
    { name: 'Drop old deal_owners SELECT policy', sql: `DROP POLICY IF EXISTS "Users can view owners of their deals" ON deal_owners;` },
    { name: 'Create new deal_owners SELECT policy', sql: `CREATE POLICY "Authenticated users can view all deal owners" ON deal_owners FOR SELECT USING (auth.role() = 'authenticated');` },

    // DEAL_BANK_STATEMENTS TABLE
    { name: 'Drop old deal_bank_statements SELECT policy', sql: `DROP POLICY IF EXISTS "Users can view statements of their deals" ON deal_bank_statements;` },
    { name: 'Create new deal_bank_statements SELECT policy', sql: `CREATE POLICY "Authenticated users can view all deal bank statements" ON deal_bank_statements FOR SELECT USING (auth.role() = 'authenticated');` },

    // DEAL_FUNDING_POSITIONS TABLE
    { name: 'Drop old deal_funding_positions SELECT policy', sql: `DROP POLICY IF EXISTS "Users can view funding positions of their deals" ON deal_funding_positions;` },
    { name: 'Create new deal_funding_positions SELECT policy', sql: `CREATE POLICY "Authenticated users can view all deal funding positions" ON deal_funding_positions FOR SELECT USING (auth.role() = 'authenticated');` },

    // DEAL_LENDER_MATCHES TABLE
    { name: 'Drop old deal_lender_matches SELECT policy', sql: `DROP POLICY IF EXISTS "Users can view lender matches of their deals" ON deal_lender_matches;` },
    { name: 'Create new deal_lender_matches SELECT policy', sql: `CREATE POLICY "Authenticated users can view all deal lender matches" ON deal_lender_matches FOR SELECT USING (auth.role() = 'authenticated');` },
  ];

  for (const stmt of statements) {
    console.log(`Running: ${stmt.name}...`);
    const { error } = await supabase.rpc('exec_sql', { sql_query: stmt.sql });
    if (error) {
      // If the error is about policy already existing, that's okay
      if (error.message?.includes('already exists')) {
        console.log(`  ⚠ Policy already exists, skipping`);
      } else {
        console.error(`  ✗ Error: ${error.message}`);
      }
    } else {
      console.log(`  ✓ Success`);
    }
  }

  console.log('\nMigration complete!');
}

applyMigration().catch(console.error);
