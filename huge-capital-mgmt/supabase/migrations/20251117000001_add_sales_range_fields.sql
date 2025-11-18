-- Add low and high end fields for average monthly sales
-- This allows us to capture ranges like "$100K-$250K" properly

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS average_monthly_sales_low numeric,
  ADD COLUMN IF NOT EXISTS average_monthly_sales_high numeric;

COMMENT ON COLUMN deals.average_monthly_sales IS 'Midpoint of sales range (calculated from low and high)';
COMMENT ON COLUMN deals.average_monthly_sales_low IS 'Lower bound of average monthly sales range';
COMMENT ON COLUMN deals.average_monthly_sales_high IS 'Upper bound of average monthly sales range';
