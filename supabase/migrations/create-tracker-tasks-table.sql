-- Create tracker_tasks table
CREATE TABLE IF NOT EXISTS public.tracker_tasks (
  id TEXT PRIMARY KEY,
  task_name TEXT NOT NULL,
  description TEXT,
  assignee TEXT,
  area TEXT,
  due_date DATE,
  completed BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.tracker_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all tracker tasks"
  ON public.tracker_tasks
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert tracker tasks"
  ON public.tracker_tasks
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update tracker tasks"
  ON public.tracker_tasks
  FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete tracker tasks"
  ON public.tracker_tasks
  FOR DELETE
  USING (true);

-- Create index on due_date for faster queries
CREATE INDEX IF NOT EXISTS idx_tracker_tasks_due_date ON public.tracker_tasks(due_date);
