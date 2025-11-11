# Lender Data Import Guide

## Overview
This guide walks through importing CSV data for 8 new lender types into the Huge Capital database.

## Current Status

### ✅ Completed
- [x] Created 8 database migration files for all new lender types
- [x] Created CSV import script (`scripts/importLenderCSVs.mjs`)
- [x] Committed all files to GitHub

### ⏳ Pending
- [ ] Apply database migrations to Supabase
- [ ] Run CSV import script
- [ ] Merge hyperlink data (if needed)

---

## Step 1: Apply Database Migrations

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **SQL Editor**
3. For each migration file in `supabase/migrations/20251102000*.sql`:
   - Open the file from your local machine
   - Copy entire SQL content
   - Paste into Supabase SQL Editor
   - Click **Run**
4. Verify that all 8 tables were created successfully

### Option B: Using Supabase CLI (If Docker is working)

```bash
cd "Huge Capital Dashboard\huge-capital-mgmt"
npx supabase db push --include-all
```

### Option C: Using Manual Script

```bash
cd "Huge Capital Dashboard\huge-capital-mgmt"
node scripts/createLenderTables.mjs
```

---

## Step 2: Run CSV Import Script

Once tables are created in Supabase:

```bash
cd "Huge Capital Dashboard\huge-capital-mgmt"
node scripts/importLenderCSVs.mjs
```

### Expected Output

```
📥 Starting Lender CSV Import...

📖 Reading: Master Huge Capital Lender List - Term Loans.csv...
✅ Parsed 5 records from Master Huge Capital Lender List - Term Loans.csv
  ✓ Value Capital
  ✓ SmartBiz
  ...

[Summary of all 8 lender types with insertion counts]

🎉 All lenders imported successfully!
```

---

## CSV Files Required

The script expects these files in `New Lenders for Huge Capital/` directory:

1. **Master Huge Capital Lender List - Term Loans.csv** (5 lenders)
2. **Master Huge Capital Lender List - DSCR.csv** (25 lenders)
3. **Master Huge Capital Lender List - Equipment Financing.csv** (3 lenders)
4. **Master Huge Capital Lender List - Fix & Flip.csv** (10 lenders)
5. **Master Huge Capital Lender List - New Construction.csv** (9 lenders)
6. **Master Huge Capital Lender List - Commercial Real Estate.csv** (7 lenders)
7. **Master Huge Capital Lender List - MCA Debt Restructuring.csv** (2 lenders)
8. **Master Huge Capital Lender List - Conventional Bank TL_LOC.csv** (9 lenders)

---

## Created Database Tables

### `lenders_term_loans`
- Columns: lender_name, contact_person, phone, email, submission_docs, submission_process, timeline, states_available, products_offered, min_loan_amount, max_loan_amount, use_of_funds, credit_requirement, preferred_industries, restricted_industries, notes
- 5 lenders to import

### `lenders_dscr`
- Columns: lender_name, contact_person, phone, email, submission_process, min_loan_amount, max_loan_amount, max_ltv, credit_requirement, rural, states, drive_link
- 25 lenders to import

### `lenders_equipment_financing`
- Columns: lender_name, iso_rep, phone, email, submission_process, minimum_credit_requirement, min_time_in_business, min_loan_amount, max_loan_amount, terms, rates, do_positions_matter, financing_types, states_restrictions, preferred_equipment, equipment_restrictions, website, notes
- 3 lenders to import

### `lenders_fix_flip`
- Columns: lender_name, contact_person, phone, email, submission_process, min_loan_amount, max_loan_amount, max_ltv, max_ltc, credit_requirement, rural, states, drive_link
- 10 lenders to import

### `lenders_new_construction`
- Columns: lender_name, contact_person, phone, email, website, submission_process, min_loan_amount, max_loan_amount, max_ltv, max_ltc, max_units, credit_requirement, rural, states, drive_link
- 9 lenders to import

### `lenders_commercial_real_estate`
- Columns: lender_name, contact_person, phone, email, website, products_offered, states_available, min_loan_amount, max_loan_amount, credit_requirement, notes
- 7 lenders to import

### `lenders_mca_debt_restructuring`
- Columns: lender_name, contact_person, phone, email, website, products_offered, states_available, min_loan_amount, max_loan_amount, credit_requirement, notes
- 2 lenders to import

### `lenders_conventional_tl_loc`
- Columns: lender_name, contact_person, phone, email, website, states_available, submission_process, docs_required, timeline, terms, rates, min_loan_amount, max_loan_amount, credit_requirement, banking_relationship_required, bank_account_opened_to_fund, use_of_funds, preferred_industries, restricted_industries, notes
- 9 lenders to import

---

## Troubleshooting

### "Could not find the table" Error

If you see: `Could not find the table 'public.lenders_xxx' in the schema cache`

**Solution**: The migration hasn't been applied yet. Run Step 1 first.

### CSV Parsing Errors

If the import script fails to read CSVs:

1. Verify files exist in `New Lenders for Huge Capital/` directory
2. Check that filenames match exactly (case-sensitive)
3. Ensure CSV headers match the schema configuration

### Permission Denied

If you get authentication errors:

1. Verify `.env` file has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. Check that your Supabase account has write permissions

---

## Next Steps After Import

1. **Verify data** in Supabase dashboard by checking table row counts
2. **Extract hyperlinks** from `Master Huge Capital Lender List - Extracted Hyperlinks.csv`
3. **Update lender pages** in the app to display the new lender types
4. **Test filtering and search** functionality for new lender types

---

## File References

- **Migration files**: `supabase/migrations/20251102000*.sql`
- **Import script**: `scripts/importLenderCSVs.mjs`
- **CSV source**: `New Lenders for Huge Capital/`
- **Schema config**: `src/config/lenderTypeSchema.ts`
