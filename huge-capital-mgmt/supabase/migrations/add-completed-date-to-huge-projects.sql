-- Add completed_date column to huge_projects table
ALTER TABLE huge_projects
ADD COLUMN IF NOT EXISTS completed_date TIMESTAMPTZ;

-- Add comment to the column
COMMENT ON COLUMN huge_projects.completed_date IS 'Date when the project was marked as completed';
