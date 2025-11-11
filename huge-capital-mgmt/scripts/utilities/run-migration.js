import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function runMigration() {
  console.log('Adding tool_colors column to huge_projects table...');

  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `ALTER TABLE huge_projects ADD COLUMN IF NOT EXISTS tool_colors JSONB DEFAULT '{}'::jsonb;`
  });

  if (error) {
    console.error('Error running migration:', error);
    console.log('\nPlease run this SQL manually in Supabase SQL Editor:');
    console.log('ALTER TABLE huge_projects ADD COLUMN IF NOT EXISTS tool_colors JSONB DEFAULT \'{}\'::jsonb;');
  } else {
    console.log('✅ Migration completed successfully!');
  }
}

runMigration();
