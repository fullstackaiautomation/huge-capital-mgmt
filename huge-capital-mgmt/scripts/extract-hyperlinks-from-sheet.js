/**
 * Extract Hyperlinks from Google Sheet
 *
 * This script extracts hyperlinks from columns Y and Z (Preferred Industries and Restricted Industries)
 * and matches them with lender names from column C.
 *
 * Usage: node scripts/extract-hyperlinks-from-sheet.js
 */

const GOOGLE_SHEETS_API_KEY = 'AIzaSyCZHv0oBOXYyolGXRMRPP9EttPXQlas_lQ';
const SHEET_ID = '1tXgItBJLBQgY8pkUnPO2-J_Ln87Cfh66AY-KUn566Yc';
const SHEET_NAME = 'Master Huge Capital Lender List'; // Adjust if needed
const GID = '1180870529'; // Tab ID from URL

/**
 * Fetch data from Google Sheets API
 */
async function fetchSheetData(range) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${GOOGLE_SHEETS_API_KEY}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`API Error: ${errorData?.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.values || [];
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
  }
}

/**
 * Parse HYPERLINK formula from cell value
 * Google Sheets HYPERLINK format: =HYPERLINK("url", "display text")
 */
function extractUrlFromFormula(cellValue) {
  if (!cellValue) return null;

  // Check if it's a HYPERLINK formula
  const hyperlinkMatch = cellValue.match(/=HYPERLINK\s*\(\s*"([^"]+)"\s*,/i);
  if (hyperlinkMatch) {
    return hyperlinkMatch[1];
  }

  // Check if it's a plain URL
  if (cellValue.startsWith('http://') || cellValue.startsWith('https://')) {
    return cellValue;
  }

  return null;
}

/**
 * Main extraction function
 */
async function extractHyperlinks() {
  console.log('🔍 Extracting hyperlinks from Google Sheet...\n');
  console.log(`Sheet ID: ${SHEET_ID}`);
  console.log(`Sheet Name: ${SHEET_NAME}\n`);

  try {
    // Fetch columns C (Lender Names), Y (Preferred Industries), and Z (Restricted Industries)
    // Using A1 notation to fetch specific columns
    const range = `${SHEET_NAME}!C:C,Y:Y,Z:Z`;

    console.log(`Fetching range: ${range}...`);

    // Note: Google Sheets API doesn't support non-contiguous ranges in a single request
    // We need to fetch each column separately

    const lenderNamesData = await fetchSheetData(`${SHEET_NAME}!C:C`);
    console.log(`✓ Fetched ${lenderNamesData.length} rows from column C (Lender Names)`);

    const preferredData = await fetchSheetData(`${SHEET_NAME}!Y:Y`);
    console.log(`✓ Fetched ${preferredData.length} rows from column Y (Preferred Industries)`);

    const restrictedData = await fetchSheetData(`${SHEET_NAME}!Z:Z`);
    console.log(`✓ Fetched ${restrictedData.length} rows from column Z (Restricted Industries)\n`);

    // Process the data
    const results = [];
    const maxRows = Math.max(lenderNamesData.length, preferredData.length, restrictedData.length);

    console.log('Processing rows...\n');

    for (let i = 1; i < maxRows; i++) { // Start from 1 to skip header row
      const lenderName = lenderNamesData[i]?.[0]?.trim();
      const preferredCell = preferredData[i]?.[0];
      const restrictedCell = restrictedData[i]?.[0];

      // Skip if no lender name
      if (!lenderName) continue;

      // Try to extract URLs from cells
      const preferredUrl = extractUrlFromFormula(preferredCell);
      const restrictedUrl = extractUrlFromFormula(restrictedCell);

      // Only include lenders that have BOTH links
      if (preferredUrl && restrictedUrl) {
        results.push({
          lenderName,
          preferredUrl,
          restrictedUrl,
          rowNumber: i + 1 // Add 1 because spreadsheet rows are 1-indexed
        });

        console.log(`✓ Row ${i + 1}: ${lenderName}`);
        console.log(`  Preferred: ${preferredUrl}`);
        console.log(`  Restricted: ${restrictedUrl}\n`);
      }
    }

    // Output summary
    console.log('='.repeat(70));
    console.log('EXTRACTION COMPLETE');
    console.log('='.repeat(70));
    console.log(`\n✓ Found ${results.length} lenders with both Preferred and Restricted industry links\n`);

    // Output formatted results
    console.log('FORMATTED OUTPUT:');
    console.log('='.repeat(70));
    console.log();

    results.forEach(({ lenderName, preferredUrl, restrictedUrl }) => {
      console.log(lenderName);
      console.log(`Preferred Industry Link = ${preferredUrl}`);
      console.log(`Restricted Industry Link = ${restrictedUrl}`);
      console.log();
    });

    return results;

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nTroubleshooting tips:');
    console.error('1. Verify the Sheet ID is correct');
    console.error('2. Check that the API key has access to this sheet');
    console.error('3. Ensure the sheet is shared with "Anyone with the link can view"');
    console.error('4. Verify the sheet name/tab name is correct');
    throw error;
  }
}

// Note: Google Sheets API only returns the displayed values, not the underlying formulas
// To get the actual hyperlink URLs, we have two options:
// 1. Use the spreadsheets.get method with fields parameter to get formulas
// 2. Use the browser console script (extract-specific-lenders.js) to extract links from DOM

console.log('⚠️  IMPORTANT NOTE:');
console.log('Google Sheets API returns only display values, not the underlying HYPERLINK formulas.');
console.log('This means we cannot extract the actual URLs using the API alone.\n');
console.log('RECOMMENDED APPROACH:');
console.log('1. Open the Google Sheet in Chrome: https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit');
console.log('2. Open Chrome DevTools (F12 or Ctrl+Shift+J)');
console.log('3. Copy and paste the script from: scripts/extract-specific-lenders.js');
console.log('4. Press Enter to run the script in the browser console\n');
console.log('This will extract the hyperlinks directly from the DOM.\n');

// Run the extraction
// extractHyperlinks();
