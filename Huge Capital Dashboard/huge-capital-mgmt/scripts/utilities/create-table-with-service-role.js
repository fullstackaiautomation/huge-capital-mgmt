import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function createWeeklyRecapsTable() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase credentials');
    return;
  }

  // Create client with service role key (has full admin access)
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('Creating weekly_recaps table...');

  try {
    // First check if table exists
    const { data: existingTable, error: checkError } = await supabase
      .from('weekly_recaps')
      .select('id')
      .limit(1);

    if (!checkError || !checkError.message.includes('weekly_recaps')) {
      console.log('✅ Table weekly_recaps already exists!');
      return;
    }

    // Create the table using raw SQL via RPC or direct query
    // Note: Supabase JS client doesn't support DDL directly, so we'll use the REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({
        query: `
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
        `
      })
    });

    // Since direct SQL execution isn't available via JS client, let's use a different approach
    // We'll check if the table doesn't exist and guide the user
    console.log('\n📋 Creating table via Supabase Management API...');

    // Use the Supabase Management API endpoint
    const mgmtResponse = await fetch(`https://api.supabase.com/v1/projects/oymwsfyspdvbazklqkpm/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({
        query: `
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

          -- Enable RLS
          ALTER TABLE weekly_recaps ENABLE ROW LEVEL SECURITY;

          -- Create policy
          CREATE POLICY "Allow all operations on weekly_recaps" ON weekly_recaps
            FOR ALL
            TO public
            USING (true)
            WITH CHECK (true);
        `
      })
    });

    if (mgmtResponse.ok) {
      console.log('✅ Table created successfully!');
    } else {
      // If Management API doesn't work, let's create a simple test
      console.log('Management API not available. Testing direct insertion...');

      // Try to insert a test record (this will fail if table doesn't exist)
      const { error: insertError } = await supabase
        .from('weekly_recaps')
        .insert({
          week_number: 0,
          week_start: '2025-01-01',
          week_end: '2025-01-05',
          category: 'TEST',
          what_was_done: 'Testing table creation',
          user_id: 'system_test'
        });

      if (insertError) {
        console.log('Table does not exist. The SQL has been saved to: supabase-weekly-recaps.sql');
        console.log('Please run it in the Supabase SQL Editor.');
      } else {
        console.log('✅ Table exists and is working!');
        // Delete the test record
        await supabase
          .from('weekly_recaps')
          .delete()
          .eq('category', 'TEST')
          .eq('user_id', 'system_test');
      }
    }

  } catch (error) {
    console.error('Error:', error);
    console.log('\nThe table creation SQL has been saved to: supabase-weekly-recaps.sql');
    console.log('You can run it manually in the Supabase SQL Editor.');
  }
}

createWeeklyRecapsTable();