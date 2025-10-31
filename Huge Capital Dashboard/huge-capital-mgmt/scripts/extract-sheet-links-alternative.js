/**
 * Alternative Google Sheets Hyperlink Extractor
 *
 * This version tries multiple DOM selection strategies to find the links
 *
 * INSTRUCTIONS:
 * 1. Open the Google Sheet in your browser
 * 2. Scroll to see the lenders you want to extract (Credibly, Rapid, Fundworks, etc.)
 * 3. Open the browser console (F12 or Ctrl+Shift+J)
 * 4. Copy and paste this entire script into the console
 * 5. Press Enter to run
 */

(function extractSheetLinksAlternative() {
  console.log('Starting alternative hyperlink extraction...');

  const results = [];

  // Strategy 1: Try to find by data attributes
  console.log('\nStrategy 1: Looking for cells with data attributes...');

  // Get all cells that might contain links
  const allCells = document.querySelectorAll('[role="gridcell"]');
  console.log(`Found ${allCells.length} total cells`);

  // Group cells by row
  const cellsByRow = {};

  allCells.forEach(cell => {
    // Try to determine row and column
    const gridRow = cell.getAttribute('aria-rowindex');
    const gridCol = cell.getAttribute('aria-colindex');

    if (gridRow) {
      if (!cellsByRow[gridRow]) {
        cellsByRow[gridRow] = {};
      }
      if (gridCol) {
        cellsByRow[gridRow][gridCol] = cell;
      }
    }
  });

  console.log(`Organized into ${Object.keys(cellsByRow).length} rows`);

  // Now extract data
  // Column C = 3, Column Y = 25, Column Z = 26
  Object.keys(cellsByRow).forEach(rowIndex => {
    if (rowIndex === '1') return; // Skip header

    const row = cellsByRow[rowIndex];

    const lenderCell = row['3'];
    const preferredCell = row['25'];
    const restrictedCell = row['26'];

    if (lenderCell && preferredCell && restrictedCell) {
      const lenderName = lenderCell.textContent?.trim();

      // Look for links
      const preferredLink = preferredCell.querySelector('a');
      const restrictedLink = restrictedCell.querySelector('a');

      const preferredUrl = preferredLink?.href;
      const restrictedUrl = restrictedLink?.href;

      if (lenderName && preferredUrl && restrictedUrl) {
        results.push({
          lenderName,
          preferredUrl,
          restrictedUrl
        });
      }
    }
  });

  // If Strategy 1 didn't work, try Strategy 2
  if (results.length === 0) {
    console.log('\nStrategy 2: Looking for all links and grouping them...');

    // Get all links on the page
    const allLinks = document.querySelectorAll('a[href*="docs.google.com"]');
    console.log(`Found ${allLinks.length} Google Docs links`);

    // Log all links for manual inspection
    allLinks.forEach((link, index) => {
      console.log(`Link ${index + 1}: ${link.textContent?.trim()} -> ${link.href}`);
    });
  }

  if (results.length > 0) {
    console.log(`\n✓ Successfully extracted ${results.length} lenders with both links:\n`);

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

    return results;
  } else {
    console.log('\n⚠ No results found. Please check:');
    console.log('1. Are you on the correct sheet tab?');
    console.log('2. Have the columns loaded properly?');
    console.log('3. Try scrolling to make sure columns Y and Z are visible');
    console.log('\nTrying to show all available columns...');

    // Show what columns we can see
    const firstRow = cellsByRow['2']; // First data row
    if (firstRow) {
      console.log('Available columns in first data row:');
      Object.keys(firstRow).forEach(colIndex => {
        const cell = firstRow[colIndex];
        const text = cell.textContent?.trim();
        if (text) {
          console.log(`  Column ${colIndex}: ${text.substring(0, 50)}`);
        }
      });
    }
  }
})();
