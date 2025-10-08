-- Add completed_date column to tracker_tasks table
ALTER TABLE tracker_tasks
ADD COLUMN IF NOT EXISTS completed_date TIMESTAMPTZ;

-- Add comment to the column
COMMENT ON COLUMN tracker_tasks.completed_date IS 'Date when the task was marked as completed';
