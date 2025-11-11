import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function verifyTable() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Try to query the table
    const { data, error } = await supabase
      .from('weekly_recaps')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error:', error.message);
    } else {
      console.log('✅ SUCCESS! The weekly_recaps table has been created!');
      console.log('📊 Table is ready to use for saving weekly recap data.');
      console.log('\nYou can now:');
      console.log('1. Go to the Weekly Recap view in your app');
      console.log('2. Fill out the forms for each category');
      console.log('3. Click "Submit Weekly Recap" to save the data');
      console.log('\nThe data will be saved to Supabase and persist across sessions!');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

verifyTable();