const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read the Excel file
const filePath = 'C:\\Users\\blkw\\OneDrive\\Documents\\Github\\Huge Capital\\huge-capital-mgmt\\imports\\2. Huge Capital Lender List.xlsx';

try {
  const workbook = XLSX.readFile(filePath);

  console.log('=== SHEET NAMES ===');
  console.log(workbook.SheetNames);
  console.log('\n');

  // Process each sheet
  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n=== SHEET: ${sheetName} ===\n`);
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    console.log(`Total rows: ${data.length}`);
    console.log('\n--- First 3 rows ---');
    console.log(JSON.stringify(data.slice(0, 3), null, 2));

    // Show all lender names
    console.log('\n--- All Lender Names ---');
    data.forEach((row, index) => {
      const lenderName = row['Lender Name'] || row['lender_name'] || row['LenderName'] || 'Unknown';
      console.log(`${index + 1}. ${lenderName}`);
    });
  });

} catch (error) {
  console.error('Error reading Excel file:', error);
}