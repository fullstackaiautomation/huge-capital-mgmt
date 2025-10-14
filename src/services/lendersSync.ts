// Google Sheets Sync for Lenders - Simplified Structure
// Syncs from 4-tab Google Sheet: SBA, Term Loans, Business Line of Credits, Equipment Financing

import { supabase } from '../lib/supabase';
import { rowsToObjects } from '../lib/googleSheets';

const LENDERS_SHEET_ID = import.meta.env.VITE_LENDERS_GOOGLE_SHEETS_ID;

// Tab names from your sheet
const SHEET_TABS = [
  'SBA',
  'Term Loans',
  'Business Line of Credits',
  'Equipment Financing'
];

// Your sheet structure: Lender Name | Contact Person | Phone | Email
interface LenderSheetRow {
  'Lender Name': string;
  'Contact Person'?: string;
  Phone?: string;
  Email?: string;
}

/**
 * Fetch lenders from a specific tab
 */
async function fetchLendersFromTab(tabName: string): Promise<LenderSheetRow[]> {
  try {
    console.log(`📊 Fetching lenders from "${tabName}" tab...`);

    // Override the sheet ID temporarily
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${LENDERS_SHEET_ID}/values/${encodeURIComponent(tabName)}!A1:Z1000?key=${import.meta.env.VITE_GOOGLE_SHEETS_API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${tabName}: ${response.statusText}`);
    }

    const data = await response.json();
    const rows = data.values || [];

    if (rows.length === 0) {
      console.warn(`No data in "${tabName}" tab`);
      return [];
    }

    const lenders = rowsToObjects<LenderSheetRow>(rows);
    console.log(`✓ Found ${lenders.length} lenders in "${tabName}"`);

    return lenders;
  } catch (error) {
    console.error(`Error fetching "${tabName}":`, error);
    return [];
  }
}

/**
 * Sync all lenders from all 4 tabs
 */
export async function syncAllLenders() {
  try {
    console.log('🔄 Starting full sync from Google Sheets...\n');

    let totalAdded = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    // Process each tab
    for (const tabName of SHEET_TABS) {
      console.log(`\n📑 Processing "${tabName}" tab...`);

      const sheetLenders = await fetchLendersFromTab(tabName);

      for (const row of sheetLenders) {
        try {
          // Skip if no lender name
          if (!row['Lender Name'] || row['Lender Name'].trim() === '') {
            totalSkipped++;
            continue;
          }

          const lenderName = row['Lender Name'].trim();

          // Check if lender exists
          const { data: existing, error: fetchError } = await supabase
            .from('lenders')
            .select('id, updated_at')
            .eq('company_name', lenderName)
            .maybeSingle();

          if (fetchError) throw fetchError;

          // Determine company type from tab name
          let companyType: string = 'other';
          if (tabName === 'SBA') companyType = 'bank';
          else if (tabName.includes('Line of Credit')) companyType = 'credit_union';
          else if (tabName.includes('Equipment')) companyType = 'institutional';
          else companyType = 'private_lender';

          const lenderData = {
            company_name: lenderName,
            company_type: companyType,
            status: 'active' as const,
            notes: `From ${tabName} tab`,
            last_synced: new Date().toISOString(),
          };

          if (existing) {
            // Update existing
            const { error: updateError } = await supabase
              .from('lenders')
              .update(lenderData)
              .eq('id', existing.id);

            if (updateError) throw updateError;

            totalUpdated++;
            console.log(`  ↻ Updated: ${lenderName}`);

            // Now handle the contact
            await syncContact(existing.id, lenderName, row);

          } else {
            // Insert new
            const { data: newLender, error: insertError } = await supabase
              .from('lenders')
              .insert([lenderData])
              .select('id')
              .single();

            if (insertError) throw insertError;

            totalAdded++;
            console.log(`  ✓ Added: ${lenderName}`);

            // Now handle the contact
            if (newLender) {
              await syncContact(newLender.id, lenderName, row);
            }
          }
        } catch (error) {
          console.error(`  ✗ Error processing ${row['Lender Name']}:`, error);
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
    console.log(`   📊 Total: ${result.total}`);

    return result;
  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  }
}

/**
 * Sync contact information for a lender
 */
async function syncContact(lenderId: string, lenderName: string, row: LenderSheetRow) {
  try {
    const contactPerson = row['Contact Person'];
    if (!contactPerson || contactPerson.trim() === '') {
      return; // No contact to sync
    }

    // Split name (assume "First Last" format)
    const nameParts = contactPerson.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Check if contact exists
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
      email: row.Email || undefined,
      phone: row.Phone || undefined,
      is_primary: true,
      status: 'active' as const,
    };

    if (existing) {
      // Update existing contact
      await supabase
        .from('lender_contacts')
        .update(contactData)
        .eq('id', existing.id);
    } else {
      // Insert new contact
      await supabase
        .from('lender_contacts')
        .insert([contactData]);
    }

    console.log(`    👤 Contact synced: ${contactPerson}`);
  } catch (error) {
    console.error(`    ✗ Error syncing contact for ${lenderName}:`, error);
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
