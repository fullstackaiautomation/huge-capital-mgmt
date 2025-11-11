-- Update status column to include Ungraded option
ALTER TABLE public.opportunity_tasks
DROP CONSTRAINT IF EXISTS opportunity_tasks_status_check;

ALTER TABLE public.opportunity_tasks
ADD CONSTRAINT opportunity_tasks_status_check
CHECK (status IN ('Completed', 'In Progress', 'Testing', 'Next Up', 'Bench', 'Huge Help', 'Ungraded'));
