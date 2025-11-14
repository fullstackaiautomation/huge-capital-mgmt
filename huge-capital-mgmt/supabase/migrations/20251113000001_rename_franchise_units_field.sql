-- Rename franchise_units_percent to franchise_units and change type from NUMERIC to INTEGER
-- This field represents a count of franchise units owned, not a percentage

ALTER TABLE deals
  RENAME COLUMN franchise_units_percent TO franchise_units;

-- Change type from NUMERIC (decimal) to INTEGER
ALTER TABLE deals
  ALTER COLUMN franchise_units TYPE INTEGER USING franchise_units::INTEGER;
