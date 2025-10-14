// Google Sheets Sync for Lenders
// Epic 2: Lenders Dashboard - Story LD-1.2

import { supabase } from '../lib/supabase';
import { fetchSheetData, rowsToObjects } from '../lib/googleSheets';
import type { Lender, LenderDB } from '../types/lender';

// =====================================================
// CONFIGURATION
// =====================================================

/**
 * Google Sheets Structure for Lenders:
 *
 * Sheet 1: "Lenders"
 * Columns: Company Name | Website | Type | Status | Rating | Headquarters | Geographic Coverage | Notes | Last Updated
 *
 * Sheet 2: "Programs" (Optional - for future)
 * Columns: Lender Name | Program Name | Loan Types | Min Amount | Max Amount | Min Credit Score | ...
 *
 * Sheet 3: "Contacts" (Optional - for future)
 * Columns: Lender Name | First Name | Last Name | Title | Email | Phone | Preferred Contact
 */

interface LenderSheetRow {
  'Company Name': string;
  Website?: string;
  Type: 'bank' | 'credit_union' | 'private_lender' | 'hard_money' | 'institutional' | 'other';
  Status: 'active' | 'inactive' | 'pending' | 'archived';
  Rating?: string;
  Headquarters?: string;
  'Geographic Coverage'?: string; // Comma-separated states
  Notes?: string;
  'Last Updated'?: string;
}

// =====================================================
// FETCH FROM GOOGLE SHEETS
// =====================================================

/**
 * Fetch lenders from Google Sheets
 * @param sheetName - Name of the sheet tab (default: "Lenders")
 * @returns Array of lender objects from sheets
 */
export async function fetchLendersFromSheets(sheetName: string = 'Lenders'): Promise<LenderSheetRow[]> {
  try {
    console.log(`📊 Fetching lenders from Google Sheets (${sheetName})...`);

    // Fetch data from the specified sheet
    // Format: 'SheetName!A1:Z1000'
    const range = `${sheetName}!A1:Z1000`;
    const rows = await fetchSheetData(range);

    if (rows.length === 0) {
      console.warn('No data found in Google Sheets');
      return [];
    }

    // Convert rows to objects
    const lenders = rowsToObjects<LenderSheetRow>(rows);
    console.log(`✓ Fetched ${lenders.length} lenders from Google Sheets`);

    return lenders;
  } catch (error) {
    console.error('Error fetching lenders from Google Sheets:', error);
    throw error;
  }
}

// =====================================================
// TRANSFORM & SYNC TO SUPABASE
// =====================================================

/**
 * Transform sheet row to Supabase format
 */
function transformSheetRowToSupabase(row: LenderSheetRow): Partial<LenderDB> {
  return {
    company_name: row['Company Name'],
    website: row.Website || undefined,
    company_type: row.Type || 'other',
    status: row.Status || 'active',
    rating: row.Rating ? parseInt(row.Rating) : undefined,
    headquarters_location: row.Headquarters || undefined,
    geographic_coverage: row['Geographic Coverage']
      ? row['Geographic Coverage'].split(',').map(s => s.trim())
      : [],
    notes: row.Notes || undefined,
    last_synced: new Date().toISOString(),
  };
}

/**
 * Sync lenders from Google Sheets to Supabase
 * @param sheetName - Name of the sheet tab
 * @returns Sync result with counts
 */
export async function syncLendersFromSheets(sheetName: string = 'Lenders') {
  try {
    console.log('🔄 Starting sync: Google Sheets → Supabase...');

    // Fetch from sheets
    const sheetLenders = await fetchLendersFromSheets(sheetName);

    if (sheetLenders.length === 0) {
      return {
        success: true,
        added: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
      };
    }

    let added = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // Process each lender
    for (const sheetRow of sheetLenders) {
      try {
        // Skip if no company name
        if (!sheetRow['Company Name']) {
          skipped++;
          continue;
        }

        // Check if lender exists
        const { data: existing, error: fetchError } = await supabase
          .from('lenders')
          .select('id, updated_at, last_synced')
          .eq('company_name', sheetRow['Company Name'])
          .maybeSingle();

        if (fetchError) throw fetchError;

        const sheetData = transformSheetRowToSupabase(sheetRow);

        // Conflict resolution: Last write wins
        // Compare sheet's "Last Updated" with DB's updated_at
        const sheetDate = sheetRow['Last Updated']
          ? new Date(sheetRow['Last Updated'])
          : new Date();

        const dbDate = existing
          ? new Date(existing.updated_at)
          : new Date(0);

        // If sheet is newer or lender doesn't exist, update/insert
        if (sheetDate >= dbDate || !existing) {
          if (existing) {
            // Update existing
            const { error: updateError } = await supabase
              .from('lenders')
              .update(sheetData)
              .eq('id', existing.id);

            if (updateError) throw updateError;

            updated++;
            console.log(`  ↻ Updated: ${sheetRow['Company Name']}`);
          } else {
            // Insert new
            const { error: insertError } = await supabase
              .from('lenders')
              .insert([sheetData]);

            if (insertError) throw insertError;

            added++;
            console.log(`  ✓ Added: ${sheetRow['Company Name']}`);
          }
        } else {
          // DB is newer, skip
          skipped++;
          console.log(`  ⊘ Skipped (DB newer): ${sheetRow['Company Name']}`);
        }
      } catch (error) {
        console.error(`  ✗ Error processing ${sheetRow['Company Name']}:`, error);
        errors++;
      }
    }

    const result = {
      success: errors === 0,
      added,
      updated,
      skipped,
      errors,
      total: sheetLenders.length,
    };

    console.log('\n📋 Sync Summary:');
    console.log(`   ✓ Added: ${added}`);
    console.log(`   ↻ Updated: ${updated}`);
    console.log(`   ⊘ Skipped: ${skipped}`);
    console.log(`   ✗ Errors: ${errors}`);
    console.log(`   📊 Total processed: ${sheetLenders.length}`);

    return result;
  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  }
}

// =====================================================
// PUSH TO GOOGLE SHEETS (FOR FUTURE - WRITE API)
// =====================================================

/**
 * NOTE: This requires Google Sheets Write API which needs OAuth
 * The current setup only supports READ-ONLY with API key
 *
 * For bidirectional sync, you'll need to:
 * 1. Set up OAuth 2.0 credentials
 * 2. Use googleapis library
 * 3. Implement write methods
 *
 * See PRD section on Google Sheets integration for full implementation
 */

/**
 * Export lenders to CSV format (alternative to Sheets write)
 */
export function exportLendersToCsv(lenders: Lender[]): string {
  const headers = [
    'Company Name',
    'Website',
    'Type',
    'Status',
    'Rating',
    'Headquarters',
    'Geographic Coverage',
    'Notes',
    'Last Updated',
  ];

  const rows = lenders.map(lender => [
    lender.companyName,
    lender.website || '',
    lender.companyType,
    lender.status,
    lender.rating?.toString() || '',
    lender.headquartersLocation || '',
    lender.geographicCoverage.join(', '),
    lender.notes || '',
    new Date(lender.updatedAt).toISOString(),
  ]);

  const csvRows = [headers, ...rows];
  return csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

/**
 * Download lenders as CSV file
 */
export function downloadLendersCsv(lenders: Lender[], filename: string = 'lenders-export.csv') {
  const csv = exportLendersToCsv(lenders);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// =====================================================
// SYNC STATUS TRACKING
// =====================================================

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'success' | 'error';
  lastSynced?: string;
  recordsUpdated?: number;
  error?: string;
}

/**
 * Get last sync timestamp from Supabase
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

// =====================================================
// USAGE EXAMPLES
// =====================================================

/**
 * Example 1: Manual sync trigger
 *
 * import { syncLendersFromSheets } from './services/lendersGoogleSheets';
 *
 * const handleSyncClick = async () => {
 *   setLoading(true);
 *   try {
 *     const result = await syncLendersFromSheets('Lenders');
 *     console.log(`Synced: ${result.added + result.updated} lenders`);
 *   } catch (error) {
 *     console.error('Sync failed:', error);
 *   } finally {
 *     setLoading(false);
 *   }
 * };
 */

/**
 * Example 2: Auto-sync on page load
 *
 * useEffect(() => {
 *   const autoSync = async () => {
 *     const lastSync = await getLastSyncTime();
 *     const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
 *
 *     if (!lastSync || new Date(lastSync) < fiveMinutesAgo) {
 *       await syncLendersFromSheets();
 *     }
 *   };
 *
 *   autoSync();
 * }, []);
 */

/**
 * Example 3: Export to CSV
 *
 * import { downloadLendersCsv } from './services/lendersGoogleSheets';
 *
 * const handleExport = () => {
 *   downloadLendersCsv(lenders, 'my-lenders.csv');
 * };
 */
