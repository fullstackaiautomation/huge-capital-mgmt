-- Fix RLS policies for lenders_business_line_of_credit table
DROP POLICY IF EXISTS "Allow authenticated users to view all business line of credit lenders" ON lenders_business_line_of_credit;
DROP POLICY IF EXISTS "Allow authenticated users to insert business line of credit lenders" ON lenders_business_line_of_credit;
DROP POLICY IF EXISTS "Allow authenticated users to update business line of credit lenders" ON lenders_business_line_of_credit;
DROP POLICY IF EXISTS "Allow authenticated users to delete business line of credit lenders" ON lenders_business_line_of_credit;

CREATE POLICY "Allow authenticated users to view all business line of credit lenders"
  ON lenders_business_line_of_credit
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert business line of credit lenders"
  ON lenders_business_line_of_credit
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update business line of credit lenders"
  ON lenders_business_line_of_credit
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete business line of credit lenders"
  ON lenders_business_line_of_credit
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Fix RLS policies for lenders_mca table
DROP POLICY IF EXISTS "Allow authenticated users to view all mca lenders" ON lenders_mca;
DROP POLICY IF EXISTS "Allow authenticated users to insert mca lenders" ON lenders_mca;
DROP POLICY IF EXISTS "Allow authenticated users to update mca lenders" ON lenders_mca;
DROP POLICY IF EXISTS "Allow authenticated users to delete mca lenders" ON lenders_mca;

CREATE POLICY "Allow authenticated users to view all mca lenders"
  ON lenders_mca
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert mca lenders"
  ON lenders_mca
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update mca lenders"
  ON lenders_mca
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete mca lenders"
  ON lenders_mca
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Fix RLS policies for lenders_sba table
DROP POLICY IF EXISTS "Allow authenticated users to view all sba lenders" ON lenders_sba;
DROP POLICY IF EXISTS "Allow authenticated users to insert sba lenders" ON lenders_sba;
DROP POLICY IF EXISTS "Allow authenticated users to update sba lenders" ON lenders_sba;
DROP POLICY IF EXISTS "Allow authenticated users to delete sba lenders" ON lenders_sba;

CREATE POLICY "Allow authenticated users to view all sba lenders"
  ON lenders_sba
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert sba lenders"
  ON lenders_sba
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update sba lenders"
  ON lenders_sba
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete sba lenders"
  ON lenders_sba
  FOR DELETE
  USING (auth.role() = 'authenticated');
