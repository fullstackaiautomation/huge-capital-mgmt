/**
 * Specific Lender Hyperlink Extractor
 *
 * This script specifically looks for the lenders mentioned:
 * Credibly, Rapid, Fundworks, TMRnow, TYI Capital, Fintegra,
 * Fresh Funding, Fintap, Legend Advance, Mantis, Emmy Capital, Kalamata
 *
 * INSTRUCTIONS:
 * 1. Open the Google Sheet in your browser
 * 2. Make sure columns C, Y, and Z are visible (scroll horizontally if needed)
 * 3. Open the browser console (F12 or Ctrl+Shift+J)
 * 4. Copy and paste this entire script into the console
 * 5. Press Enter to run
 */

(function extractSpecificLenders() {
  console.log('Searching for specific lenders...\n');

  const targetLenders = [
    'Credibly',
    'Rapid',
    'Fundworks',
    'TMRnow',
    'TYI Capital',
    'Fintegra',
    'Fresh Funding',
    'Fintap',
    'Legend Advance',
    'Mantis',
    'Emmy Capital',
    'Kalamata'
  ];

  const results = [];
  const notFound = [];

  // Get all text content on the page to find lender names
  const allText = document.body.innerText;

  targetLenders.forEach(lenderName => {
    console.log(`Looking for: ${lenderName}...`);

    // Search for cells containing this lender name
    const cells = Array.from(document.querySelectorAll('[role="gridcell"]'));

    const lenderCell = cells.find(cell => {
      const text = cell.textContent?.trim();
      return text === lenderName || text?.includes(lenderName);
    });

    if (lenderCell) {
      console.log(`  ✓ Found "${lenderName}"`);

      // Get the row this cell is in
      const row = lenderCell.closest('[role="row"]');

      if (row) {
        // Get all cells in this row
        const rowCells = Array.from(row.querySelectorAll('[role="gridcell"]'));

        // Find cells that contain links
        const cellsWithLinks = rowCells.filter(cell => cell.querySelector('a'));

        if (cellsWithLinks.length >= 2) {
          // Assume the first two links are Preferred and Restricted
          const links = cellsWithLinks.slice(0, 2).map(cell => {
            const link = cell.querySelector('a');
            return link ? link.href : null;
          }).filter(url => url !== null);

          if (links.length === 2) {
            results.push({
              lenderName,
              preferredUrl: links[0],
              restrictedUrl: links[1]
            });
            console.log(`    Preferred: ${links[0]}`);
            console.log(`    Restricted: ${links[1]}`);
          } else {
            console.log(`    ⚠ Found ${links.length} links (expected 2)`);
            notFound.push(lenderName);
          }
        } else {
          console.log(`    ⚠ Found ${cellsWithLinks.length} cells with links (expected 2+)`);
          notFound.push(lenderName);

          // Try to find ALL links in the row for debugging
          const allLinksInRow = Array.from(row.querySelectorAll('a'));
          if (allLinksInRow.length > 0) {
            console.log(`    Debug - All links in row:`);
            allLinksInRow.forEach((link, i) => {
              console.log(`      ${i + 1}. ${link.href}`);
            });
          }
        }
      }
    } else {
      console.log(`  ✗ NOT FOUND: ${lenderName}`);
      notFound.push(lenderName);
    }
  });

  // Output results
  console.log(`\n${'='.repeat(60)}`);
  console.log(`EXTRACTION COMPLETE`);
  console.log(`${'='.repeat(60)}\n`);
  console.log(`✓ Successfully extracted: ${results.length} lenders`);
  console.log(`✗ Not found or incomplete: ${notFound.length} lenders\n`);

  if (results.length > 0) {
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
    console.log('⚠ No complete results found. Troubleshooting tips:');
    console.log('1. Make sure you\'re on the "Master Huge Capital Lender List" tab');
    console.log('2. Scroll horizontally to ensure columns Y and Z are loaded');
    console.log('3. Check that the lender names in column C match exactly');
    console.log('4. Verify that columns Y and Z contain hyperlinks (blue underlined text)');

    if (notFound.length > 0) {
      console.log(`\nLenders that couldn't be found or processed:`);
      notFound.forEach(name => console.log(`  - ${name}`));
    }
  }
})();
