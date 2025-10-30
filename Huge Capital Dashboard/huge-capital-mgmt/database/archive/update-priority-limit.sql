-- Remove the old constraint
ALTER TABLE public.opportunity_tasks
DROP CONSTRAINT IF EXISTS opportunity_tasks_priority_check;

-- Add new constraint allowing 1-50
ALTER TABLE public.opportunity_tasks
ADD CONSTRAINT opportunity_tasks_priority_check CHECK (priority >= 1 AND priority <= 50);
