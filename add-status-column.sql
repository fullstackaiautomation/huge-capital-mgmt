-- Add status column to opportunity_tasks table
ALTER TABLE public.opportunity_tasks
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('Completed', 'In Progress', 'Testing', 'Next Up', 'Bench', 'Huge Help'));

-- Set default value for existing rows
UPDATE public.opportunity_tasks
SET status = 'Next Up'
WHERE status IS NULL;
