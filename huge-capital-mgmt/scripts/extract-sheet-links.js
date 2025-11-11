/**
 * Google Sheets Hyperlink Extractor
 *
 * This script extracts hyperlinks from columns Y and Z of a Google Sheet
 * and matches them with lender names from column C.
 *
 * INSTRUCTIONS:
 * 1. Open the Google Sheet in your browser
 * 2. Open the browser console (F12 or Ctrl+Shift+J)
 * 3. Copy and paste this entire script into the console
 * 4. Press Enter to run
 * 5. The results will be logged to the console and copied to clipboard
 */

(function extractSheetLinks() {
  console.log('Starting hyperlink extraction...');

  const results = [];

  // Get all rows in the sheet
  const rows = document.querySelectorAll('div[role="rowgroup"] div[role="row"]');
  console.log(`Found ${rows.length} rows`);

  rows.forEach((row, index) => {
    // Skip header row
    if (index === 0) return;

    const cells = row.querySelectorAll('div[role="gridcell"]');

    // Column C is index 2 (0-based), Y is index 24, Z is index 25
    const lenderNameCell = cells[2];
    const preferredCell = cells[24];
    const restrictedCell = cells[25];

    if (!lenderNameCell || !preferredCell || !restrictedCell) return;

    // Extract lender name (text content)
    const lenderName = lenderNameCell.textContent?.trim();

    // Extract hyperlinks from cells
    const preferredLink = preferredCell.querySelector('a');
    const restrictedLink = restrictedCell.querySelector('a');

    const preferredUrl = preferredLink?.href;
    const restrictedUrl = restrictedLink?.href;

    // Only include if both links exist and lender name exists
    if (lenderName && preferredUrl && restrictedUrl) {
      results.push({
        lenderName,
        preferredUrl,
        restrictedUrl
      });
    }
  });

  console.log(`\nFound ${results.length} lenders with both links:\n`);

  // Format output
  let output = '';
  results.forEach(({ lenderName, preferredUrl, restrictedUrl }) => {
    const formatted = `[${lenderName}]
Preferred Industry Link = ${preferredUrl}
Restricted Industry Link = ${restrictedUrl}\n\n`;

    console.log(formatted);
    output += formatted;
  });

  // Copy to clipboard
  if (navigator.clipboard) {
    navigator.clipboard.writeText(output)
      .then(() => console.log('✓ Results copied to clipboard!'))
      .catch(err => console.error('Failed to copy to clipboard:', err));
  }

  // Also return the results for further processing
  return results;
})();
