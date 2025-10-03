-- Add priority column to opportunity_tasks table
ALTER TABLE public.opportunity_tasks
ADD COLUMN IF NOT EXISTS priority INTEGER CHECK (priority >= 1 AND priority <= 10);

-- Set default value for existing rows (optional)
-- UPDATE public.opportunity_tasks
-- SET priority = 5
-- WHERE priority IS NULL;
