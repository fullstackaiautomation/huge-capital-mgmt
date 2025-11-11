-- Fix RLS Policies for All Lender Tables
-- These policies allow authenticated users to perform all operations

-- lenders_term_loans
DROP POLICY IF EXISTS "Allow authenticated users to view all term loans lenders" ON lenders_term_loans;
DROP POLICY IF EXISTS "Allow authenticated users to insert term loans lenders" ON lenders_term_loans;
DROP POLICY IF EXISTS "Allow authenticated users to update term loans lenders" ON lenders_term_loans;
DROP POLICY IF EXISTS "Allow authenticated users to delete term loans lenders" ON lenders_term_loans;

CREATE POLICY "Enable select for authenticated users" ON lenders_term_loans FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON lenders_term_loans FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON lenders_term_loans FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON lenders_term_loans FOR DELETE USING (true);

-- lenders_dscr
DROP POLICY IF EXISTS "Allow authenticated users to view all dscr lenders" ON lenders_dscr;
DROP POLICY IF EXISTS "Allow authenticated users to insert dscr lenders" ON lenders_dscr;
DROP POLICY IF EXISTS "Allow authenticated users to update dscr lenders" ON lenders_dscr;
DROP POLICY IF EXISTS "Allow authenticated users to delete dscr lenders" ON lenders_dscr;

CREATE POLICY "Enable select for authenticated users" ON lenders_dscr FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON lenders_dscr FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON lenders_dscr FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON lenders_dscr FOR DELETE USING (true);

-- lenders_equipment_financing
DROP POLICY IF EXISTS "Allow authenticated users to view all equipment financing lenders" ON lenders_equipment_financing;
DROP POLICY IF EXISTS "Allow authenticated users to insert equipment financing lenders" ON lenders_equipment_financing;
DROP POLICY IF EXISTS "Allow authenticated users to update equipment financing lenders" ON lenders_equipment_financing;
DROP POLICY IF EXISTS "Allow authenticated users to delete equipment financing lenders" ON lenders_equipment_financing;

CREATE POLICY "Enable select for authenticated users" ON lenders_equipment_financing FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON lenders_equipment_financing FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON lenders_equipment_financing FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON lenders_equipment_financing FOR DELETE USING (true);

-- lenders_fix_flip
DROP POLICY IF EXISTS "Allow authenticated users to view all fix flip lenders" ON lenders_fix_flip;
DROP POLICY IF EXISTS "Allow authenticated users to insert fix flip lenders" ON lenders_fix_flip;
DROP POLICY IF EXISTS "Allow authenticated users to update fix flip lenders" ON lenders_fix_flip;
DROP POLICY IF EXISTS "Allow authenticated users to delete fix flip lenders" ON lenders_fix_flip;

CREATE POLICY "Enable select for authenticated users" ON lenders_fix_flip FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON lenders_fix_flip FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON lenders_fix_flip FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON lenders_fix_flip FOR DELETE USING (true);

-- lenders_new_construction
DROP POLICY IF EXISTS "Allow authenticated users to view all new construction lenders" ON lenders_new_construction;
DROP POLICY IF EXISTS "Allow authenticated users to insert new construction lenders" ON lenders_new_construction;
DROP POLICY IF EXISTS "Allow authenticated users to update new construction lenders" ON lenders_new_construction;
DROP POLICY IF EXISTS "Allow authenticated users to delete new construction lenders" ON lenders_new_construction;

CREATE POLICY "Enable select for authenticated users" ON lenders_new_construction FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON lenders_new_construction FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON lenders_new_construction FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON lenders_new_construction FOR DELETE USING (true);

-- lenders_commercial_real_estate
DROP POLICY IF EXISTS "Allow authenticated users to view all commercial real estate lenders" ON lenders_commercial_real_estate;
DROP POLICY IF EXISTS "Allow authenticated users to insert commercial real estate lenders" ON lenders_commercial_real_estate;
DROP POLICY IF EXISTS "Allow authenticated users to update commercial real estate lenders" ON lenders_commercial_real_estate;
DROP POLICY IF EXISTS "Allow authenticated users to delete commercial real estate lenders" ON lenders_commercial_real_estate;

CREATE POLICY "Enable select for authenticated users" ON lenders_commercial_real_estate FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON lenders_commercial_real_estate FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON lenders_commercial_real_estate FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON lenders_commercial_real_estate FOR DELETE USING (true);

-- lenders_mca_debt_restructuring
DROP POLICY IF EXISTS "Allow authenticated users to view all mca debt restructuring lenders" ON lenders_mca_debt_restructuring;
DROP POLICY IF EXISTS "Allow authenticated users to insert mca debt restructuring lenders" ON lenders_mca_debt_restructuring;
DROP POLICY IF EXISTS "Allow authenticated users to update mca debt restructuring lenders" ON lenders_mca_debt_restructuring;
DROP POLICY IF EXISTS "Allow authenticated users to delete mca debt restructuring lenders" ON lenders_mca_debt_restructuring;

CREATE POLICY "Enable select for authenticated users" ON lenders_mca_debt_restructuring FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON lenders_mca_debt_restructuring FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON lenders_mca_debt_restructuring FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON lenders_mca_debt_restructuring FOR DELETE USING (true);

-- lenders_conventional_tl_loc
DROP POLICY IF EXISTS "Allow authenticated users to view all conventional tl loc lenders" ON lenders_conventional_tl_loc;
DROP POLICY IF EXISTS "Allow authenticated users to insert conventional tl loc lenders" ON lenders_conventional_tl_loc;
DROP POLICY IF EXISTS "Allow authenticated users to update conventional tl loc lenders" ON lenders_conventional_tl_loc;
DROP POLICY IF EXISTS "Allow authenticated users to delete conventional tl loc lenders" ON lenders_conventional_tl_loc;

CREATE POLICY "Enable select for authenticated users" ON lenders_conventional_tl_loc FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON lenders_conventional_tl_loc FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON lenders_conventional_tl_loc FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON lenders_conventional_tl_loc FOR DELETE USING (true);
