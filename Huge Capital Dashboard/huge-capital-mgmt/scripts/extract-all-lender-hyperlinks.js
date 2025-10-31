/**
 * Extract ALL Lender Hyperlinks from Google Sheet
 *
 * This script extracts hyperlinks from columns Y and Z for ALL lenders in the sheet
 *
 * INSTRUCTIONS:
 * 1. Open the Google Sheet in your browser:
 *    https://docs.google.com/spreadsheets/d/1tXgItBJLBQgY8pkUnPO2-J_Ln87Cfh66AY-KUn566Yc/edit?gid=1180870529#gid=1180870529
 * 2. Make sure you're on the correct tab (Master Huge Capital Lender List)
 * 3. Scroll to ensure columns C, Y, and Z are visible/loaded
 * 4. Open the browser console (F12 or Ctrl+Shift+J / Cmd+Option+J on Mac)
 * 5. Copy and paste this entire script into the console
 * 6. Press Enter to run
 */

(function extractAllLenderHyperlinks() {
  console.log('🔍 Extracting hyperlinks from ALL lenders...\n');
  console.log('Looking for columns: C (Lender Name), Y (Preferred Industries), Z (Restricted Industries)\n');

  const results = [];
  const warnings = [];

  // Get all rows in the sheet
  const rows = Array.from(document.querySelectorAll('[role="row"]'));

  console.log(`Found ${rows.length} total rows\n`);

  // Skip the header row (first row)
  const dataRows = rows.slice(1);

  console.log(`Processing ${dataRows.length} data rows...\n`);

  dataRows.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because we skipped header and arrays are 0-indexed

    // Get all cells in this row
    const cells = Array.from(row.querySelectorAll('[role="gridcell"]'));

    if (cells.length === 0) return; // Skip empty rows

    // Determine column indices by examining the data-col attribute or position
    // Column C = index 2 (0-indexed: A=0, B=1, C=2)
    // Column Y = index 24 (A=0, so Y is 24)
    // Column Z = index 25

    // Google Sheets uses data attributes - let's try to be more robust
    const lenderNameCell = cells[2]; // Column C (0-indexed)
    const preferredCell = cells[24]; // Column Y
    const restrictedCell = cells[25]; // Column Z

    if (!lenderNameCell) return;

    const lenderName = lenderNameCell.textContent?.trim();

    // Skip if no lender name or if it's clearly a header
    if (!lenderName || lenderName.toLowerCase() === 'lender name' || lenderName.toLowerCase() === 'company name') {
      return;
    }

    // Extract hyperlinks from cells
    const preferredLink = preferredCell?.querySelector('a');
    const restrictedLink = restrictedCell?.querySelector('a');

    const preferredUrl = preferredLink?.href;
    const restrictedUrl = restrictedLink?.href;

    // Only include lenders that have BOTH links
    if (preferredUrl && restrictedUrl) {
      results.push({
        lenderName,
        preferredUrl,
        restrictedUrl,
        rowNumber
      });
      console.log(`✓ Row ${rowNumber}: ${lenderName}`);
    } else {
      // Track lenders with missing links
      const missing = [];
      if (!preferredUrl) missing.push('Preferred');
      if (!restrictedUrl) missing.push('Restricted');

      if (lenderName) {
        warnings.push({
          lenderName,
          missing: missing.join(' and '),
          rowNumber
        });
      }
    }
  });

  // Output results
  console.log('\n' + '='.repeat(70));
  console.log('EXTRACTION COMPLETE');
  console.log('='.repeat(70) + '\n');
  console.log(`✓ Successfully extracted: ${results.length} lenders with both links`);
  console.log(`⚠ Lenders with missing links: ${warnings.length}\n`);

  if (results.length > 0) {
    console.log('FORMATTED OUTPUT:');
    console.log('='.repeat(70) + '\n');

    let output = '';

    results.forEach(({ lenderName, preferredUrl, restrictedUrl, rowNumber }) => {
      const formatted = `${lenderName}
Preferred Industry Link = ${preferredUrl}
Restricted Industry Link = ${restrictedUrl}

`;

      console.log(formatted);
      output += formatted;
    });

    // Copy to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(output)
        .then(() => console.log('\n✓ Results copied to clipboard!'))
        .catch(err => console.error('Failed to copy to clipboard:', err));
    } else {
      console.log('\n⚠ Clipboard API not available. Copy the output manually.');
    }

    // Also show warnings
    if (warnings.length > 0) {
      console.log('\n' + '='.repeat(70));
      console.log('LENDERS WITH MISSING LINKS:');
      console.log('='.repeat(70) + '\n');

      warnings.forEach(({ lenderName, missing, rowNumber }) => {
        console.log(`⚠ Row ${rowNumber}: ${lenderName} - Missing ${missing} link`);
      });
    }

    return { results, warnings };
  } else {
    console.log('⚠ No results found. Troubleshooting tips:');
    console.log('1. Make sure you\'re on the "Master Huge Capital Lender List" tab');
    console.log('2. Scroll horizontally to load columns Y and Z');
    console.log('3. Wait a moment for the data to fully load, then run this script again');
    console.log('4. Verify that columns Y and Z contain hyperlinks (blue underlined text)');
    console.log('5. Check the browser console for any errors');

    // Try to provide more debugging info
    console.log('\n🔍 Debugging Information:');
    console.log(`Total rows found: ${rows.length}`);
    console.log(`First row cells count: ${rows[1]?.querySelectorAll('[role="gridcell"]').length || 0}`);

    // Check if we can find any links at all
    const allLinks = document.querySelectorAll('a[href]');
    console.log(`Total links found on page: ${allLinks.length}`);

    if (allLinks.length > 0) {
      console.log('\nSample links found (first 5):');
      Array.from(allLinks).slice(0, 5).forEach((link, i) => {
        console.log(`  ${i + 1}. ${link.href}`);
      });
    }

    return { results: [], warnings };
  }
})();
