// Complete Google Sheets Sync - Captures ALL columns
import { supabase } from '../lib/supabase';

const LENDERS_SHEET_ID = import.meta.env.VITE_LENDERS_GOOGLE_SHEETS_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;

const SHEET_TABS = [
  'SBA',
  'Term Loans',
  'Business Line of Credits',
  'Equipment Financing'
];

/**
 * Fetch ALL columns from a sheet (A-Z)
 */
async function fetchAllDataFromTab(tabName: string) {
  try {
    console.log(`📊 Fetching ALL data from "${tabName}" tab...`);

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${LENDERS_SHEET_ID}/values/${encodeURIComponent(tabName)}!A1:Z1000?key=${API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', errorData);
      throw new Error(`Failed to fetch ${tabName}: ${response.statusText}`);
    }

    const data = await response.json();
    const rows = data.values || [];

    if (rows.length === 0) {
      console.warn(`No data in "${tabName}" tab`);
      return { headers: [], data: [] };
    }

    const headers = rows[0]; // First row is headers
    const dataRows = rows.slice(1); // Rest is data

    console.log(`✓ Headers (${headers.length} columns):`, headers);
    console.log(`✓ Found ${dataRows.length} rows`);

    return { headers, data: dataRows };
  } catch (error) {
    console.error(`Error fetching "${tabName}":`, error);
    return { headers: [], data: [] };
  }
}

/**
 * Convert row array to object using headers
 */
function rowToObject(headers: string[], row: any[]): Record<string, any> {
  const obj: Record<string, any> = {};
  headers.forEach((header, index) => {
    obj[header] = row[index] || '';
  });
  return obj;
}

/**
 * Sync ALL lenders with ALL their data
 */
export async function syncAllLendersComplete() {
  try {
    console.log('🔄 Starting COMPLETE sync from Google Sheets...\n');

    let totalAdded = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const tabName of SHEET_TABS) {
      console.log(`\n📑 Processing "${tabName}" tab...`);

      const { headers, data: dataRows } = await fetchAllDataFromTab(tabName);

      if (dataRows.length === 0) continue;

      // Determine company type from tab
      let companyType: string = 'other';
      if (tabName === 'SBA') companyType = 'bank';
      else if (tabName.includes('Line of Credit')) companyType = 'credit_union';
      else if (tabName.includes('Equipment')) companyType = 'institutional';
      else if (tabName.includes('Term')) companyType = 'private_lender';

      for (const row of dataRows) {
        try {
          // Skip completely empty rows
          const hasData = row.some((cell: any) => cell && cell.toString().trim() !== '');
          if (!hasData) {
            totalSkipped++;
            continue;
          }

          const rowObj = rowToObject(headers, row);

          // Skip if no lender name
          const lenderName = rowObj['Lender Name'] || rowObj['LenderName'] || rowObj['lender_name'];
          if (!lenderName || lenderName.trim() === '') {
            totalSkipped++;
            continue;
          }

          // Extract standard fields
          const contactPerson = rowObj['Contact Person'] || rowObj['ContactPerson'] || '';
          const phone = rowObj['Phone'] || rowObj['phone'] || '';
          const email = rowObj['Email'] || rowObj['email'] || '';

          // Store ALL other columns as structured data
          const allData: Record<string, any> = {};
          headers.forEach((header: string) => {
            const index = headers.indexOf(header);
            // Skip the basic fields we're handling separately
            if (!['Lender Name', 'Contact Person', 'Phone', 'Email'].includes(header)) {
              allData[header] = row[index] || '';
            }
          });

          // Create detailed notes with all data
          let detailedNotes = '';

          // Add all additional columns to notes
          Object.entries(allData).forEach(([key, value]) => {
            if (value && value.trim() !== '') {
              detailedNotes += `${key}: ${value}\n`;
            }
          });

          // Check if THIS SPECIFIC lender+funding_type combination exists
          // Each row is unique even if same company name
          const { data: existing, error: fetchError } = await supabase
            .from('lenders')
            .select('id, updated_at')
            .eq('company_name', lenderName.trim())
            .eq('funding_type', tabName)
            .maybeSingle();

          if (fetchError) throw fetchError;

          const lenderData = {
            company_name: lenderName.trim(),
            company_type: companyType,
            funding_type: tabName,
            status: 'active' as const,
            notes: detailedNotes,
            // Store raw data as JSONB for flexibility
            license_numbers: allData as any,
            last_synced: new Date().toISOString(),
          };

          if (existing) {
            // Update
            const { error: updateError } = await supabase
              .from('lenders')
              .update(lenderData)
              .eq('id', existing.id);

            if (updateError) throw updateError;

            totalUpdated++;
            console.log(`  ↻ Updated: ${lenderName} (${tabName})`);

            // Sync contact
            await syncContact(existing.id, lenderName, contactPerson, phone, email);

          } else {
            // Insert - create new entry for each row
            const { data: newLender, error: insertError } = await supabase
              .from('lenders')
              .insert([lenderData])
              .select('id')
              .single();

            if (insertError) throw insertError;

            totalAdded++;
            console.log(`  ✓ Added: ${lenderName} (${tabName})`);

            // Sync contact
            if (newLender) {
              await syncContact(newLender.id, lenderName, contactPerson, phone, email);
            }
          }
        } catch (error) {
          console.error(`  ✗ Error:`, error);
          totalErrors++;
        }
      }
    }

    const result = {
      success: totalErrors === 0,
      added: totalAdded,
      updated: totalUpdated,
      skipped: totalSkipped,
      errors: totalErrors,
      total: totalAdded + totalUpdated + totalSkipped,
    };

    console.log('\n📋 Sync Complete!');
    console.log(`   ✓ Added: ${totalAdded}`);
    console.log(`   ↻ Updated: ${totalUpdated}`);
    console.log(`   ⊘ Skipped: ${totalSkipped}`);
    console.log(`   ✗ Errors: ${totalErrors}`);

    return result;
  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  }
}

/**
 * Sync contact
 */
async function syncContact(
  lenderId: string,
  _lenderName: string,
  contactPerson: string,
  phone: string,
  email: string
) {
  try {
    if (!contactPerson || contactPerson.trim() === '') return;

    const nameParts = contactPerson.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const { data: existing } = await supabase
      .from('lender_contacts')
      .select('id')
      .eq('lender_id', lenderId)
      .eq('first_name', firstName)
      .eq('last_name', lastName)
      .maybeSingle();

    const contactData = {
      lender_id: lenderId,
      first_name: firstName,
      last_name: lastName,
      email: email || undefined,
      phone: phone || undefined,
      is_primary: true,
      status: 'active' as const,
    };

    if (existing) {
      await supabase
        .from('lender_contacts')
        .update(contactData)
        .eq('id', existing.id);
    } else {
      await supabase
        .from('lender_contacts')
        .insert([contactData]);
    }

    console.log(`    👤 Contact: ${contactPerson}`);
  } catch (error) {
    console.error(`    ✗ Error syncing contact:`, error);
  }
}

/**
 * Get last sync time
 */
export async function getLastSyncTime(): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('lenders')
      .select('last_synced')
      .order('last_synced', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data?.last_synced || null;
  } catch (error) {
    console.error('Error getting last sync time:', error);
    return null;
  }
}
