-- Add tool_colors column to huge_projects table
ALTER TABLE huge_projects
ADD COLUMN IF NOT EXISTS tool_colors JSONB DEFAULT '{}'::jsonb;

-- Add comment to the column
COMMENT ON COLUMN huge_projects.tool_colors IS 'Stores color customizations for integration/tool badges as JSON object';
