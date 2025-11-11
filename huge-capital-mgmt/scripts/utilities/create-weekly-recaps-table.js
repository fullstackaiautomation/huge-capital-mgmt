import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function createWeeklyRecapsTable() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env file');
    return;
  }

  // First, let's check if the table exists
  const checkResponse = await fetch(`${supabaseUrl}/rest/v1/weekly_recaps?select=count`, {
    method: 'HEAD',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    }
  });

  if (checkResponse.ok) {
    console.log('✅ Table weekly_recaps already exists!');
    return;
  }

  console.log('Table does not exist yet. Creating it now...');

  // Use the RPC endpoint to execute raw SQL
  const sql = `
    -- Create weekly_recaps table
    CREATE TABLE IF NOT EXISTS weekly_recaps (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      week_number INTEGER NOT NULL,
      week_start DATE NOT NULL,
      week_end DATE NOT NULL,
      category VARCHAR(100) NOT NULL,
      what_was_done TEXT,
      quantity TEXT,
      wins_highlights TEXT,
      issues_notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
      user_id VARCHAR(100) DEFAULT 'dillon'
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_weekly_recaps_week ON weekly_recaps(week_number, week_start);
    CREATE INDEX IF NOT EXISTS idx_weekly_recaps_category ON weekly_recaps(category);
    CREATE INDEX IF NOT EXISTS idx_weekly_recaps_user ON weekly_recaps(user_id);
  `;

  // Note: With anon key, we can't execute DDL statements directly
  // We need to use Supabase dashboard or service role key

  console.log('\n📋 To create the table, please run this SQL in Supabase SQL Editor:');
  console.log('=====================================');
  console.log(sql);
  console.log('=====================================\n');

  console.log('Steps:');
  console.log('1. Go to: https://app.supabase.com/project/oymwsfyspdvbazklqkpm/sql/new');
  console.log('2. Paste the SQL above');
  console.log('3. Click "Run"');
}

createWeeklyRecapsTable();