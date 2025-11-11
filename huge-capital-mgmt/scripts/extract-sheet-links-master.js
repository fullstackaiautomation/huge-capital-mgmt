/**
 * MASTER Google Sheets Hyperlink Extractor
 *
 * This is the most comprehensive version that tries multiple strategies
 * to extract hyperlinks from Google Sheets.
 *
 * INSTRUCTIONS:
 * 1. Open the Google Sheet in your browser
 * 2. Make sure you can see columns C, Y, and Z
 * 3. Open the browser console (F12)
 * 4. Copy and paste this entire script
 * 5. Press Enter
 *
 * The script will try multiple extraction methods automatically.
 */

(function extractSheetLinksMaster() {
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #6366f1; font-weight: bold');
  console.log('%c  GOOGLE SHEETS HYPERLINK EXTRACTOR - MASTER VERSION', 'color: #6366f1; font-weight: bold; font-size: 14px');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #6366f1; font-weight: bold');
  console.log('');

  let results = [];

  // ============================================================================
  // STRATEGY 1: Grid-based extraction using row/cell structure
  // ============================================================================
  console.log('%c📊 STRATEGY 1: Grid-based extraction', 'color: #3b82f6; font-weight: bold');

  const rows = document.querySelectorAll('div[role="rowgroup"] div[role="row"]');
  console.log(`  Found ${rows.length} rows`);

  rows.forEach((row, index) => {
    if (index === 0) return; // Skip header

    const cells = row.querySelectorAll('div[role="gridcell"]');

    // Column C = index 2, Y = index 24, Z = index 25 (0-based)
    const lenderNameCell = cells[2];
    const preferredCell = cells[24];
    const restrictedCell = cells[25];

    if (!lenderNameCell || !preferredCell || !restrictedCell) return;

    const lenderName = lenderNameCell.textContent?.trim();
    const preferredLink = preferredCell.querySelector('a');
    const restrictedLink = restrictedCell.querySelector('a');

    if (lenderName && preferredLink?.href && restrictedLink?.href) {
      results.push({
        lenderName,
        preferredUrl: preferredLink.href,
        restrictedUrl: restrictedLink.href,
        source: 'Strategy 1 (Grid)'
      });
    }
  });

  console.log(`  ✓ Found ${results.length} lenders\n`);

  // ============================================================================
  // STRATEGY 2: ARIA attribute-based extraction
  // ============================================================================
  if (results.length === 0) {
    console.log('%c📍 STRATEGY 2: ARIA attribute-based extraction', 'color: #3b82f6; font-weight: bold');

    const allCells = document.querySelectorAll('[role="gridcell"]');
    const cellsByRow = {};

    allCells.forEach(cell => {
      const gridRow = cell.getAttribute('aria-rowindex');
      const gridCol = cell.getAttribute('aria-colindex');

      if (gridRow && gridCol) {
        if (!cellsByRow[gridRow]) cellsByRow[gridRow] = {};
        cellsByRow[gridRow][gridCol] = cell;
      }
    });

    console.log(`  Organized ${Object.keys(cellsByRow).length} rows`);

    Object.keys(cellsByRow).forEach(rowIndex => {
      if (rowIndex === '1') return; // Skip header

      const row = cellsByRow[rowIndex];
      const lenderCell = row['3'];  // Column C
      const preferredCell = row['25']; // Column Y
      const restrictedCell = row['26']; // Column Z

      if (lenderCell && preferredCell && restrictedCell) {
        const lenderName = lenderCell.textContent?.trim();
        const preferredLink = preferredCell.querySelector('a');
        const restrictedLink = restrictedCell.querySelector('a');

        if (lenderName && preferredLink?.href && restrictedLink?.href) {
          results.push({
            lenderName,
            preferredUrl: preferredLink.href,
            restrictedUrl: restrictedLink.href,
            source: 'Strategy 2 (ARIA)'
          });
        }
      }
    });

    console.log(`  ✓ Found ${results.length} lenders\n`);
  }

  // ============================================================================
  // STRATEGY 3: Specific lender name search
  // ============================================================================
  if (results.length < 5) {
    console.log('%c🎯 STRATEGY 3: Specific lender name search', 'color: #3b82f6; font-weight: bold');

    const targetLenders = [
      'Credibly', 'Rapid', 'Fundworks', 'TMRnow', 'TYI Capital', 'Fintegra',
      'Fresh Funding', 'Fintap', 'Legend Advance', 'Mantis', 'Emmy Capital', 'Kalamata'
    ];

    targetLenders.forEach(lenderName => {
      // Skip if already found
      if (results.some(r => r.lenderName === lenderName)) {
        console.log(`  ⏭ Skipping ${lenderName} (already found)`);
        return;
      }

      const cells = Array.from(document.querySelectorAll('[role="gridcell"]'));
      const lenderCell = cells.find(cell => {
        const text = cell.textContent?.trim();
        return text === lenderName || text?.includes(lenderName);
      });

      if (lenderCell) {
        const row = lenderCell.closest('[role="row"]');
        if (row) {
          const allLinks = Array.from(row.querySelectorAll('a[href]'));

          // Filter for Google Docs links (likely the industry docs)
          const docLinks = allLinks.filter(link =>
            link.href.includes('docs.google.com/document')
          );

          if (docLinks.length >= 2) {
            results.push({
              lenderName,
              preferredUrl: docLinks[0].href,
              restrictedUrl: docLinks[1].href,
              source: 'Strategy 3 (Name Search)'
            });
            console.log(`  ✓ Found ${lenderName}`);
          } else {
            console.log(`  ⚠ Found ${lenderName} but only ${docLinks.length} doc links`);
          }
        }
      }
    });

    console.log(`  Total found: ${results.length} lenders\n`);
  }

  // ============================================================================
  // OUTPUT RESULTS
  // ============================================================================
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #10b981; font-weight: bold');
  console.log('%c  EXTRACTION RESULTS', 'color: #10b981; font-weight: bold; font-size: 14px');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #10b981; font-weight: bold');
  console.log('');

  if (results.length > 0) {
    // Remove duplicates
    const uniqueResults = [];
    const seen = new Set();

    results.forEach(result => {
      if (!seen.has(result.lenderName)) {
        seen.add(result.lenderName);
        uniqueResults.push(result);
      }
    });

    console.log(`%c✓ Successfully extracted ${uniqueResults.length} unique lenders with both links`, 'color: #10b981; font-weight: bold');
    console.log('');

    // Format output
    let output = '';
    let detailedLog = '';

    uniqueResults.forEach((result, index) => {
      const formatted = `[${result.lenderName}]
Preferred Industry Link = ${result.preferredUrl}
Restricted Industry Link = ${result.restrictedUrl}\n\n`;

      output += formatted;

      // Detailed console output with colors
      console.log(`%c${index + 1}. ${result.lenderName}`, 'color: #f59e0b; font-weight: bold');
      console.log(`   Preferred:  ${result.preferredUrl}`);
      console.log(`   Restricted: ${result.restrictedUrl}`);
      console.log(`   Source: ${result.source}`);
      console.log('');
    });

    // Copy to clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(output)
        .then(() => {
          console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #6366f1; font-weight: bold');
          console.log('%c✓ RESULTS COPIED TO CLIPBOARD!', 'color: #6366f1; font-weight: bold; font-size: 14px');
          console.log('%c  You can now paste them anywhere you need', 'color: #6366f1');
          console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #6366f1; font-weight: bold');
        })
        .catch(err => {
          console.error('%c✗ Failed to copy to clipboard:', 'color: #ef4444; font-weight: bold', err);
          console.log('%cYou can manually copy the output above', 'color: #f59e0b');
        });
    }

    // Return results for further use
    console.log('\n%cℹ The results are also stored in the return value of this function', 'color: #9ca3af');
    console.log('%cYou can access them by running: window.lenderResults', 'color: #9ca3af');
    window.lenderResults = uniqueResults;

    return uniqueResults;

  } else {
    // No results found - provide debugging help
    console.log('%c✗ NO RESULTS FOUND', 'color: #ef4444; font-weight: bold; font-size: 14px');
    console.log('');
    console.log('%cTroubleshooting steps:', 'color: #f59e0b; font-weight: bold');
    console.log('');
    console.log('1. %cMake sure you\'re on the correct sheet tab', 'color: #9ca3af');
    console.log('   → Look for "Master Huge Capital Lender List"');
    console.log('');
    console.log('2. %cScroll horizontally to columns Y and Z', 'color: #9ca3af');
    console.log('   → Column Y = Preferred Industries');
    console.log('   → Column Z = Restricted Industries');
    console.log('');
    console.log('3. %cWait for the sheet to fully load', 'color: #9ca3af');
    console.log('   → Google Sheets loads data lazily');
    console.log('   → Try scrolling through the sheet first');
    console.log('');
    console.log('4. %cVerify the links are actual hyperlinks', 'color: #9ca3af');
    console.log('   → They should be blue and underlined');
    console.log('   → Click a cell to see if the formula bar shows =HYPERLINK(...)');
    console.log('');

    // Debug: Show what we can see
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #f59e0b; font-weight: bold');
    console.log('%c  DEBUG INFORMATION', 'color: #f59e0b; font-weight: bold');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #f59e0b; font-weight: bold');
    console.log('');

    const allLinks = document.querySelectorAll('a[href]');
    console.log(`Total links on page: ${allLinks.length}`);

    const docLinks = Array.from(allLinks).filter(link =>
      link.href.includes('docs.google.com/document')
    );
    console.log(`Google Doc links: ${docLinks.length}`);

    if (docLinks.length > 0) {
      console.log('\nFirst 10 Google Doc links found:');
      docLinks.slice(0, 10).forEach((link, i) => {
        console.log(`  ${i + 1}. ${link.textContent?.trim() || '(no text)'} → ${link.href}`);
      });
    }

    const allCells = document.querySelectorAll('[role="gridcell"]');
    console.log(`\nTotal grid cells: ${allCells.length}`);

    return null;
  }
})();
