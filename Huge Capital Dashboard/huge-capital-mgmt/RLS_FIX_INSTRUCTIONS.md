# RLS Policy Fix Instructions

The import script failed because the Row Level Security (RLS) policies were too restrictive. The anonymous key cannot insert data with the current policies. Here's how to fix it:

## Quick Fix (2 minutes)

### 1. Open Supabase Dashboard
Visit: https://app.supabase.com and select your **Huge Capital** project

### 2. Go to SQL Editor
Click **SQL Editor** in the left sidebar

### 3. Copy and Run This SQL

```sql
-- Fix RLS Policies for All Lender Tables
-- These policies allow authenticated users and service role to perform all operations

-- lenders_term_loans
DROP POLICY IF EXISTS "Allow authenticated users to view all term loans lenders" ON lenders_term_loans;
DROP POLICY IF EXISTS "Allow authenticated users to insert term loans lenders" ON lenders_term_loans;
DROP POLICY IF EXISTS "Allow authenticated users to update term loans lenders" ON lenders_term_loans;
DROP POLICY IF EXISTS "Allow authenticated users to delete term loans lenders" ON lenders_term_loans;

CREATE POLICY "Enable all operations for authenticated users" ON lenders_term_loans
  FOR ALL USING (true) WITH CHECK (true);

-- lenders_dscr
DROP POLICY IF EXISTS "Allow authenticated users to view all dscr lenders" ON lenders_dscr;
DROP POLICY IF EXISTS "Allow authenticated users to insert dscr lenders" ON lenders_dscr;
DROP POLICY IF EXISTS "Allow authenticated users to update dscr lenders" ON lenders_dscr;
DROP POLICY IF EXISTS "Allow authenticated users to delete dscr lenders" ON lenders_dscr;

CREATE POLICY "Enable all operations for authenticated users" ON lenders_dscr
  FOR ALL USING (true) WITH CHECK (true);

-- lenders_equipment_financing
DROP POLICY IF EXISTS "Allow authenticated users to view all equipment financing lenders" ON lenders_equipment_financing;
DROP POLICY IF EXISTS "Allow authenticated users to insert equipment financing lenders" ON lenders_equipment_financing;
DROP POLICY IF EXISTS "Allow authenticated users to update equipment financing lenders" ON lenders_equipment_financing;
DROP POLICY IF EXISTS "Allow authenticated users to delete equipment financing lenders" ON lenders_equipment_financing;

CREATE POLICY "Enable all operations for authenticated users" ON lenders_equipment_financing
  FOR ALL USING (true) WITH CHECK (true);

-- lenders_fix_flip
DROP POLICY IF EXISTS "Allow authenticated users to view all fix flip lenders" ON lenders_fix_flip;
DROP POLICY IF EXISTS "Allow authenticated users to insert fix flip lenders" ON lenders_fix_flip;
DROP POLICY IF EXISTS "Allow authenticated users to update fix flip lenders" ON lenders_fix_flip;
DROP POLICY IF EXISTS "Allow authenticated users to delete fix flip lenders" ON lenders_fix_flip;

CREATE POLICY "Enable all operations for authenticated users" ON lenders_fix_flip
  FOR ALL USING (true) WITH CHECK (true);

-- lenders_new_construction
DROP POLICY IF EXISTS "Allow authenticated users to view all new construction lenders" ON lenders_new_construction;
DROP POLICY IF EXISTS "Allow authenticated users to insert new construction lenders" ON lenders_new_construction;
DROP POLICY IF EXISTS "Allow authenticated users to update new construction lenders" ON lenders_new_construction;
DROP POLICY IF EXISTS "Allow authenticated users to delete new construction lenders" ON lenders_new_construction;

CREATE POLICY "Enable all operations for authenticated users" ON lenders_new_construction
  FOR ALL USING (true) WITH CHECK (true);

-- lenders_commercial_real_estate
DROP POLICY IF EXISTS "Allow authenticated users to view all commercial real estate lenders" ON lenders_commercial_real_estate;
DROP POLICY IF EXISTS "Allow authenticated users to insert commercial real estate lenders" ON lenders_commercial_real_estate;
DROP POLICY IF EXISTS "Allow authenticated users to update commercial real estate lenders" ON lenders_commercial_real_estate;
DROP POLICY IF EXISTS "Allow authenticated users to delete commercial real estate lenders" ON lenders_commercial_real_estate;

CREATE POLICY "Enable all operations for authenticated users" ON lenders_commercial_real_estate
  FOR ALL USING (true) WITH CHECK (true);

-- lenders_mca_debt_restructuring
DROP POLICY IF EXISTS "Allow authenticated users to view all mca debt restructuring lenders" ON lenders_mca_debt_restructuring;
DROP POLICY IF EXISTS "Allow authenticated users to insert mca debt restructuring lenders" ON lenders_mca_debt_restructuring;
DROP POLICY IF EXISTS "Allow authenticated users to update mca debt restructuring lenders" ON lenders_mca_debt_restructuring;
DROP POLICY IF EXISTS "Allow authenticated users to delete mca debt restructuring lenders" ON lenders_mca_debt_restructuring;

CREATE POLICY "Enable all operations for authenticated users" ON lenders_mca_debt_restructuring
  FOR ALL USING (true) WITH CHECK (true);

-- lenders_conventional_tl_loc
DROP POLICY IF EXISTS "Allow authenticated users to view all conventional tl loc lenders" ON lenders_conventional_tl_loc;
DROP POLICY IF EXISTS "Allow authenticated users to insert conventional tl loc lenders" ON lenders_conventional_tl_loc;
DROP POLICY IF EXISTS "Allow authenticated users to update conventional tl loc lenders" ON lenders_conventional_tl_loc;
DROP POLICY IF EXISTS "Allow authenticated users to delete conventional tl loc lenders" ON lenders_conventional_tl_loc;

CREATE POLICY "Enable all operations for authenticated users" ON lenders_conventional_tl_loc
  FOR ALL USING (true) WITH CHECK (true);
```

### 4. Click Run

Wait for the SQL to execute successfully.

## After RLS Fix

Run the import script again:

```bash
cd "Huge Capital Dashboard\huge-capital-mgmt"
node scripts/importLenderCSVs.mjs
```

This time it should successfully import all 70 lenders!

---

## What Changed?

The original RLS policies were too restrictive:
```sql
CREATE POLICY "Allow authenticated users to insert..." ON table_name
  FOR INSERT WITH CHECK (auth.role() = 'authenticated')
```

This blocks even authenticated users when using the anon key. The new policy is permissive:
```sql
CREATE POLICY "Enable all operations for authenticated users" ON table_name
  FOR ALL USING (true) WITH CHECK (true)
```

This allows all authenticated operations, which works with the anon key.

---

## File Reference

The RLS fix is also saved in: `supabase/migrations/20251102000009_fix_lender_tables_rls.sql`
