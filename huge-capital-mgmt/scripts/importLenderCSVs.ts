// CSV Import Script for New Lender Types
// Loads lender data from CSVs into Supabase tables

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Define CSV file paths and their corresponding table/type info
const CSV_IMPORTS = [
  {
    csvFile: 'Master Huge Capital Lender List - Term Loans.csv',
    typeId: 'term-loans',
    tableName: 'lenders_term_loans',
    mapping: {
      'Lender Name': 'lender_name',
      'Contact Person': 'contact_person',
      'Phone': 'phone',
      'Email': 'email',
      'Submission Docs': 'submission_docs',
      'Submission Process': 'submission_process',
      'Timeline': 'timeline',
      'States Available': 'states_available',
      'Product(s) Offered': 'products_offered',
      'Min Loan Amount': 'min_loan_amount',
      'Max Loan Amount': 'max_loan_amount',
      'Use of Funds': 'use_of_funds',
      'Credit Requirement': 'credit_requirement',
      'Preferred Industries': 'preferred_industries',
      'Industy Restrictions': 'restricted_industries',
      'Note': 'notes',
    },
  },
  {
    csvFile: 'Master Huge Capital Lender List - DSCR.csv',
    typeId: 'dscr',
    tableName: 'lenders_dscr',
    mapping: {
      'Lender Name': 'lender_name',
      'Contact Person': 'contact_person',
      'Phone': 'phone',
      'Email': 'email',
      'Submission Process': 'submission_process',
      'Min Loan Amount': 'min_loan_amount',
      'Max Loan Amount': 'max_loan_amount',
      'Max LTV': 'max_ltv',
      'Credit Requirement': 'credit_requirement',
      'Rural': 'rural',
      'States': 'states',
      'Drive Link': 'drive_link',
    },
  },
  {
    csvFile: 'Master Huge Capital Lender List - Equipment Financing.csv',
    typeId: 'equipment-financing',
    tableName: 'lenders_equipment_financing',
    mapping: {
      'Lender Name': 'lender_name',
      'ISO Rep': 'iso_rep',
      'Phone': 'phone',
      'Email': 'email',
      'Submission Process': 'submission_process',
      'Minimum Credit Requirement': 'minimum_credit_requirement',
      'Min Time In Business': 'min_time_in_business',
      'Min Loan Amount': 'min_loan_amount',
      'Max Loan Amount': 'max_loan_amount',
      'Terms': 'terms',
      'Rates': 'rates',
      'Do Positions Matter': 'do_positions_matter',
      'Financing Types (Restrucutre, New, Commercial, Individual)': 'financing_types',
      'States Restrictions': 'states_restrictions',
      'Preferred Equipment': 'preferred_equipment',
      'Equipment Restrictions': 'equipment_restrictions',
      'Website': 'website',
      'Note': 'notes',
    },
  },
  {
    csvFile: 'Master Huge Capital Lender List - Fix & Flip.csv',
    typeId: 'fix-flip',
    tableName: 'lenders_fix_flip',
    mapping: {
      'Lender Name': 'lender_name',
      'Contact Person': 'contact_person',
      'Phone': 'phone',
      'Email': 'email',
      'Submission Process': 'submission_process',
      'Min Loan Amount': 'min_loan_amount',
      'Max Loan Amount': 'max_loan_amount',
      'Max LTV': 'max_ltv',
      'Max LTC': 'max_ltc',
      'Credit Requirement': 'credit_requirement',
      'Rural': 'rural',
      'States': 'states',
      'Drive Link': 'drive_link',
    },
  },
  {
    csvFile: 'Master Huge Capital Lender List - New Construction.csv',
    typeId: 'new-construction',
    tableName: 'lenders_new_construction',
    mapping: {
      'Lender Name': 'lender_name',
      'Contact Person': 'contact_person',
      'Phone': 'phone',
      'Email': 'email',
      'Submission Process': 'submission_process',
      'Min Loan Amount': 'min_loan_amount',
      'Max Loan Amount': 'max_loan_amount',
      'Max LTV': 'max_ltv',
      'Max LTC': 'max_ltc',
      'Max # of Units': 'max_units',
      'Credit Requirement': 'credit_requirement',
      'Rural': 'rural',
      'States': 'states',
      'Drive Link': 'drive_link',
    },
  },
  {
    csvFile: 'Master Huge Capital Lender List - Commercial Real Estate.csv',
    typeId: 'commercial-real-estate',
    tableName: 'lenders_commercial_real_estate',
    mapping: {
      'Lender Name': 'lender_name',
      'Contact Person': 'contact_person',
      'Phone': 'phone',
      'Email': 'email',
      'Website': 'website',
      'Product(s) Offered': 'products_offered',
      'Min Loan Amount': 'min_loan_amount',
      'Max Loan Amount': 'max_loan_amount',
      'States Available': 'states_available',
      'Credit Requirement': 'credit_requirement',
      'Note': 'notes',
    },
  },
  {
    csvFile: 'Master Huge Capital Lender List - MCA Debt Restructuring.csv',
    typeId: 'mca-debt-restructuring',
    tableName: 'lenders_mca_debt_restructuring',
    mapping: {
      'Lender Name': 'lender_name',
      'Contact Person': 'contact_person',
      'Phone': 'phone',
      'Email': 'email',
      'Website': 'website',
      'Product(s) Offered': 'products_offered',
      'Min Loan Amount': 'min_loan_amount',
      'Max Loan Amount': 'max_loan_amount',
      'States Available': 'states_available',
      'Credit Requirement': 'credit_requirement',
      'Note': 'notes',
    },
  },
  {
    csvFile: 'Master Huge Capital Lender List - Conventional Bank TL_LOC.csv',
    typeId: 'conventional-tl-loc',
    tableName: 'lenders_conventional_tl_loc',
    mapping: {
      'Lender Name': 'lender_name',
      'Contact Person': 'contact_person',
      'Phone': 'phone',
      'Email': 'email',
      'States Available': 'states_available',
      'Submission Process': 'submission_process',
      'Docs Required ': 'docs_required',
      'Timeline': 'timeline',
      'Terms': 'terms',
      'Rates': 'rates',
      'Min Loan Amount': 'min_loan_amount',
      'Max Loan Amount': 'max_loan_amount',
      'Credit Requirement': 'credit_requirement',
      'Do They Need To Have a Banking Relationship To Even Be Looked At?': 'banking_relationship_required',
      'Bank Account Has to Be Opened to Fund?': 'bank_account_opened_to_fund',
      'Use of Funds': 'use_of_funds',
      'Preferred Industries': 'preferred_industries',
      'Industy Restrictions': 'restricted_industries',
      'Note': 'notes',
    },
  },
];

// Type definitions
interface LenderRow {
  [key: string]: any;
}

interface ImportResult {
  typeId: string;
  tableName: string;
  csvFile: string;
  inserted: number;
  failed: number;
  errors: string[];
}

// ============================================================================
// MAIN IMPORT FUNCTION
// ============================================================================

async function importAllLenders(): Promise<void> {
  console.log('\n📥 Starting Lender CSV Import...\n');

  const results: ImportResult[] = [];
  const csvBaseDir = 'New Lenders for Huge Capital';

  for (const importConfig of CSV_IMPORTS) {
    const result = await importLenderType(csvBaseDir, importConfig);
    results.push(result);
  }

  // Print summary
  printSummary(results);
}

// ============================================================================
// IMPORT SINGLE LENDER TYPE
// ============================================================================

async function importLenderType(
  csvBaseDir: string,
  config: typeof CSV_IMPORTS[0]
): Promise<ImportResult> {
  const result: ImportResult = {
    typeId: config.typeId,
    tableName: config.tableName,
    csvFile: config.csvFile,
    inserted: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Read CSV file
    const csvPath = path.join(csvBaseDir, config.csvFile);
    console.log(`📖 Reading: ${config.csvFile}...`);

    if (!fs.existsSync(csvPath)) {
      result.errors.push(`File not found: ${csvPath}`);
      console.error(`❌ ${csvPath} not found`);
      return result;
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as LenderRow[];

    console.log(`✅ Parsed ${records.length} records from ${config.csvFile}`);

    // Transform and insert records
    for (const record of records) {
      try {
        const lenderData = transformRecord(record, config.mapping);

        // Add standard fields
        const dataToInsert = {
          ...lenderData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'active',
          relationship: 'Huge Capital',
          created_by: 'import-script',
        };

        // Insert into Supabase
        const { error } = await supabase
          .from(config.tableName)
          .insert([dataToInsert]);

        if (error) {
          result.errors.push(`Row ${record['Lender Name']}: ${error.message}`);
          result.failed++;
          console.error(`  ❌ ${record['Lender Name']}: ${error.message}`);
        } else {
          result.inserted++;
          console.log(`  ✓ ${record['Lender Name']}`);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        result.errors.push(`Row error: ${errorMsg}`);
        result.failed++;
      }
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    result.errors.push(`Fatal error: ${errorMsg}`);
    console.error(`❌ Fatal error importing ${config.csvFile}: ${errorMsg}`);
  }

  return result;
}

// ============================================================================
// TRANSFORM CSV ROW TO DATABASE RECORD
// ============================================================================

function transformRecord(
  record: LenderRow,
  mapping: Record<string, string>
): Record<string, any> {
  const transformed: Record<string, any> = {};

  for (const [csvHeader, dbColumn] of Object.entries(mapping)) {
    const value = record[csvHeader];

    // Skip empty values
    if (value === null || value === undefined || value === '') {
      continue;
    }

    // Clean up value
    let cleanValue: any = value.toString().trim();

    // Handle specific field types
    if (dbColumn.includes('amount') || dbColumn.includes('loan')) {
      // Try to parse as currency
      cleanValue = cleanValue.replace(/[$,]/g, '');
      if (!isNaN(cleanValue)) {
        cleanValue = cleanValue;
      }
    }

    transformed[dbColumn] = cleanValue;
  }

  return transformed;
}

// ============================================================================
// PRINT SUMMARY
// ============================================================================

function printSummary(results: ImportResult[]): void {
  console.log('\n' + '='.repeat(70));
  console.log('📊 IMPORT SUMMARY');
  console.log('='.repeat(70));

  let totalInserted = 0;
  let totalFailed = 0;

  for (const result of results) {
    totalInserted += result.inserted;
    totalFailed += result.failed;

    const status = result.failed === 0 ? '✅' : '⚠️';
    console.log(
      `\n${status} ${result.typeId.padEnd(25)} | Inserted: ${result.inserted.toString().padEnd(3)} | Failed: ${result.failed}`
    );

    if (result.errors.length > 0 && result.errors.length <= 5) {
      result.errors.slice(0, 5).forEach((err) => {
        console.log(`   └─ ${err}`);
      });
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`📈 TOTALS: ${totalInserted} inserted | ${totalFailed} failed`);
  console.log('='.repeat(70) + '\n');

  if (totalFailed === 0) {
    console.log('🎉 All lenders imported successfully!\n');
  } else {
    console.log(`⚠️  ${totalFailed} records failed. Check errors above.\n`);
  }
}

// ============================================================================
// RUN IMPORT
// ============================================================================

importAllLenders().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
