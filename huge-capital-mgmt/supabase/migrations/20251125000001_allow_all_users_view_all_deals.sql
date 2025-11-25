-- Allow all authenticated users to view all deals
-- This enables brokers to see deals from other brokers in the pipeline

-- ============================================
-- DEALS TABLE
-- ============================================

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view their own deals" ON deals;

-- Create new SELECT policy allowing all authenticated users to view all deals
CREATE POLICY "Authenticated users can view all deals"
  ON deals
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Keep INSERT restricted to own user_id
DROP POLICY IF EXISTS "Users can create deals" ON deals;
CREATE POLICY "Users can create their own deals"
  ON deals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Keep UPDATE restricted to own deals
DROP POLICY IF EXISTS "Users can update their own deals" ON deals;
CREATE POLICY "Users can update their own deals"
  ON deals
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Keep DELETE restricted to own deals
DROP POLICY IF EXISTS "Users can delete their own deals" ON deals;
CREATE POLICY "Users can delete their own deals"
  ON deals
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- DEAL_OWNERS TABLE
-- ============================================

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view owners of their deals" ON deal_owners;

-- Create new SELECT policy allowing all authenticated users to view all deal owners
CREATE POLICY "Authenticated users can view all deal owners"
  ON deal_owners
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Keep INSERT restricted
DROP POLICY IF EXISTS "Users can create owners for their deals" ON deal_owners;
CREATE POLICY "Users can create owners for their deals"
  ON deal_owners
  FOR INSERT
  WITH CHECK (
    deal_id IN (
      SELECT id FROM deals WHERE user_id = auth.uid()
    )
  );

-- Keep UPDATE restricted
DROP POLICY IF EXISTS "Users can update owners of their deals" ON deal_owners;
CREATE POLICY "Users can update owners of their deals"
  ON deal_owners
  FOR UPDATE
  USING (
    deal_id IN (
      SELECT id FROM deals WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    deal_id IN (
      SELECT id FROM deals WHERE user_id = auth.uid()
    )
  );

-- Keep DELETE restricted
DROP POLICY IF EXISTS "Users can delete owners of their deals" ON deal_owners;
CREATE POLICY "Users can delete owners of their deals"
  ON deal_owners
  FOR DELETE
  USING (
    deal_id IN (
      SELECT id FROM deals WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- DEAL_BANK_STATEMENTS TABLE
-- ============================================

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view statements of their deals" ON deal_bank_statements;

-- Create new SELECT policy allowing all authenticated users to view all statements
CREATE POLICY "Authenticated users can view all deal bank statements"
  ON deal_bank_statements
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Keep INSERT restricted
DROP POLICY IF EXISTS "Users can create statements for their deals" ON deal_bank_statements;
CREATE POLICY "Users can create statements for their deals"
  ON deal_bank_statements
  FOR INSERT
  WITH CHECK (
    deal_id IN (
      SELECT id FROM deals WHERE user_id = auth.uid()
    )
  );

-- Keep UPDATE restricted
DROP POLICY IF EXISTS "Users can update statements of their deals" ON deal_bank_statements;
CREATE POLICY "Users can update statements of their deals"
  ON deal_bank_statements
  FOR UPDATE
  USING (
    deal_id IN (
      SELECT id FROM deals WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    deal_id IN (
      SELECT id FROM deals WHERE user_id = auth.uid()
    )
  );

-- Keep DELETE restricted
DROP POLICY IF EXISTS "Users can delete statements of their deals" ON deal_bank_statements;
CREATE POLICY "Users can delete statements of their deals"
  ON deal_bank_statements
  FOR DELETE
  USING (
    deal_id IN (
      SELECT id FROM deals WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- DEAL_FUNDING_POSITIONS TABLE
-- ============================================

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view funding positions of their deals" ON deal_funding_positions;

-- Create new SELECT policy allowing all authenticated users to view all funding positions
CREATE POLICY "Authenticated users can view all deal funding positions"
  ON deal_funding_positions
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Keep INSERT restricted
DROP POLICY IF EXISTS "Users can create funding positions for their deals" ON deal_funding_positions;
CREATE POLICY "Users can create funding positions for their deals"
  ON deal_funding_positions
  FOR INSERT
  WITH CHECK (
    statement_id IN (
      SELECT dbs.id
      FROM deal_bank_statements dbs
      INNER JOIN deals d ON dbs.deal_id = d.id
      WHERE d.user_id = auth.uid()
    )
  );

-- Keep UPDATE restricted
DROP POLICY IF EXISTS "Users can update funding positions of their deals" ON deal_funding_positions;
CREATE POLICY "Users can update funding positions of their deals"
  ON deal_funding_positions
  FOR UPDATE
  USING (
    statement_id IN (
      SELECT dbs.id
      FROM deal_bank_statements dbs
      INNER JOIN deals d ON dbs.deal_id = d.id
      WHERE d.user_id = auth.uid()
    )
  )
  WITH CHECK (
    statement_id IN (
      SELECT dbs.id
      FROM deal_bank_statements dbs
      INNER JOIN deals d ON dbs.deal_id = d.id
      WHERE d.user_id = auth.uid()
    )
  );

-- Keep DELETE restricted
DROP POLICY IF EXISTS "Users can delete funding positions of their deals" ON deal_funding_positions;
CREATE POLICY "Users can delete funding positions of their deals"
  ON deal_funding_positions
  FOR DELETE
  USING (
    statement_id IN (
      SELECT dbs.id
      FROM deal_bank_statements dbs
      INNER JOIN deals d ON dbs.deal_id = d.id
      WHERE d.user_id = auth.uid()
    )
  );

-- ============================================
-- DEAL_LENDER_MATCHES TABLE
-- ============================================

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view lender matches of their deals" ON deal_lender_matches;

-- Create new SELECT policy allowing all authenticated users to view all lender matches
CREATE POLICY "Authenticated users can view all deal lender matches"
  ON deal_lender_matches
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Keep INSERT restricted
DROP POLICY IF EXISTS "Users can create lender matches for their deals" ON deal_lender_matches;
CREATE POLICY "Users can create lender matches for their deals"
  ON deal_lender_matches
  FOR INSERT
  WITH CHECK (
    deal_id IN (
      SELECT id FROM deals WHERE user_id = auth.uid()
    )
  );

-- Keep UPDATE restricted
DROP POLICY IF EXISTS "Users can update lender matches of their deals" ON deal_lender_matches;
CREATE POLICY "Users can update lender matches of their deals"
  ON deal_lender_matches
  FOR UPDATE
  USING (
    deal_id IN (
      SELECT id FROM deals WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    deal_id IN (
      SELECT id FROM deals WHERE user_id = auth.uid()
    )
  );

-- Keep DELETE restricted
DROP POLICY IF EXISTS "Users can delete lender matches of their deals" ON deal_lender_matches;
CREATE POLICY "Users can delete lender matches of their deals"
  ON deal_lender_matches
  FOR DELETE
  USING (
    deal_id IN (
      SELECT id FROM deals WHERE user_id = auth.uid()
    )
  );
