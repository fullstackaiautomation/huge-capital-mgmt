import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupWeeklyRecapsTable() {
  console.log('Setting up weekly_recaps table in Supabase...');

  // Note: We can't create tables directly through the JS client with anon key
  // You'll need to run the SQL in Supabase dashboard

  // Let's check if the table exists by trying to query it
  try {
    const { data, error } = await supabase
      .from('weekly_recaps')
      .select('*')
      .limit(1);

    if (error) {
      if (error.message.includes('relation "public.weekly_recaps" does not exist')) {
        console.log('\n⚠️  The weekly_recaps table does not exist yet.');
        console.log('\n📋 Please follow these steps:');
        console.log('1. Go to your Supabase dashboard: https://app.supabase.com');
        console.log('2. Select your project (oymwsfyspdvbazklqkpm)');
        console.log('3. Go to SQL Editor in the left sidebar');
        console.log('4. Click "New Query"');
        console.log('5. Copy and paste the contents of supabase-weekly-recaps.sql');
        console.log('6. Click "Run" to execute the SQL\n');
        console.log('The SQL file is located at: supabase-weekly-recaps.sql');
      } else {
        console.error('Error checking table:', error);
      }
    } else {
      console.log('✅ The weekly_recaps table already exists!');
      console.log('Your weekly recap feature is ready to use.');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

setupWeeklyRecapsTable();