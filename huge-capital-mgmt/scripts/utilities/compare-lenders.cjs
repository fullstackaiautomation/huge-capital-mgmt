const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read the Excel file
const excelPath = 'C:\\Users\\blkw\\OneDrive\\Documents\\Github\\Huge Capital\\huge-capital-mgmt\\imports\\2. Huge Capital Lender List.xlsx';
const workbook = XLSX.readFile(excelPath);

// Read existing CSV files
const csvBasePath = 'C:\\Users\\blkw\\OneDrive\\Documents\\Github\\Huge Capital\\huge-capital-mgmt\\database\\seed-data';

function readCSV(filename) {
  const csvPath = path.join(csvBasePath, filename);
  const workbook = XLSX.readFile(csvPath);
  const sheetName = workbook.SheetNames[0];
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
}

// Read existing CSVs
const existingMCA = readCSV('Master Huge Capital Lender List - MCA.csv');
const existingLOC = readCSV('Master Huge Capital Lender List - Business Line of Credits (1).csv');
const existingSBA = readCSV('Master Huge Capital Lender List - SBA.csv');

// Extract lenders from Excel sheets
const excelMCA = XLSX.utils.sheet_to_json(workbook.Sheets['MCA']);
const excelLOC = XLSX.utils.sheet_to_json(workbook.Sheets['Business Line of Credits']);
const excelSBA = XLSX.utils.sheet_to_json(workbook.Sheets['SBA']);

// Helper function to normalize lender names for comparison
function normalizeName(name) {
  if (!name) return '';
  return name.toString().toLowerCase().trim();
}

// Helper function to get lender names from array
function getLenderNames(data, nameField) {
  return data
    .map(row => normalizeName(row[nameField]))
    .filter(name => name && name !== 'unknown' && !name.includes('paper') && !name.includes('bank') && !name.includes('non-bank'));
}

// Compare MCA
console.log('=== MCA COMPARISON ===\n');
const existingMCANames = getLenderNames(existingMCA, 'Lender Name');
const excelMCANames = getLenderNames(excelMCA, 'Lender Name');

console.log('Existing MCA lenders:', existingMCANames.length);
console.log('Excel MCA lenders:', excelMCANames.length);

const newMCALenders = excelMCANames.filter(name => !existingMCANames.includes(name));
console.log('\n--- NEW MCA Lenders to Add ---');
newMCALenders.forEach(name => {
  const lender = excelMCA.find(row => normalizeName(row['Lender Name']) === name);
  if (lender) {
    console.log(`\n${lender['Lender Name']}`);
    console.log(`  Contact: ${lender['ISO REP']}`);
    console.log(`  Phone: ${lender['Phone']}`);
    console.log(`  Email: ${lender['Email']}`);
    console.log(`  Credit: ${lender['Min Credit Requirement']}`);
    console.log(`  Min Revenue: ${lender['Min Monthly Revenue']}`);
  }
});

// Compare Business LOC
console.log('\n\n=== BUSINESS LINE OF CREDIT COMPARISON ===\n');
const existingLOCNames = getLenderNames(existingLOC, 'Lender Name');
const excelLOCNames = getLenderNames(excelLOC, 'Lender Name');

console.log('Existing LOC lenders:', existingLOCNames.length);
console.log('Excel LOC lenders:', excelLOCNames.length);

const newLOCLenders = excelLOCNames.filter(name => !existingLOCNames.includes(name));
console.log('\n--- NEW Business LOC Lenders to Add ---');
newLOCLenders.forEach(name => {
  const lender = excelLOC.find(row => normalizeName(row['Lender Name']) === name);
  if (lender) {
    console.log(`\n${lender['Lender Name']}`);
    console.log(`  Contact: ${lender['Iso Contacts']}`);
    console.log(`  Phone: ${lender['Phone']}`);
    console.log(`  Email: ${lender['Email']}`);
    console.log(`  Credit: ${lender['Credit Requirement']}`);
    console.log(`  Min Revenue: ${lender['Min Monthly Revenue Amount']}`);
  }
});

// Compare SBA
console.log('\n\n=== SBA COMPARISON ===\n');
const existingSBANames = getLenderNames(existingSBA, 'Lender Name');
const excelSBANames = getLenderNames(excelSBA, ' Lender'); // Note the space before Lender

console.log('Existing SBA lenders:', existingSBANames.length);
console.log('Excel SBA lenders:', excelSBANames.length);

const newSBALenders = excelSBANames.filter(name => !existingSBANames.includes(name));
console.log('\n--- NEW SBA Lenders to Add ---');
newSBALenders.forEach(name => {
  const lender = excelSBA.find(row => normalizeName(row[' Lender']) === name);
  if (lender) {
    console.log(`\n${lender[' Lender']}`);
    console.log(`  Contact: ${lender['Contact Person']}`);
    console.log(`  Phone: ${lender['Phone']}`);
    console.log(`  Email: ${lender['Email']}`);
    console.log(`  Credit: ${lender['Credit Requirement']}`);
    console.log(`  Min Loan: ${lender['Min Loan Amount']}`);
  }
});

// Check for new product categories
console.log('\n\n=== NEW PRODUCT CATEGORIES IN EXCEL ===\n');
const newCategories = [
  'Term Loans',
  'Conventional Bank TLLOC',
  'Equipment Financing',
  'MCA Debt Restructuring',
  'DSCR',
  'Fix & Flip',
  'New Construction',
  'Commercial Real Estate'
];

console.log('The Excel file contains these additional categories that are not in the current CSV files:');
newCategories.forEach(cat => console.log(`  - ${cat}`));