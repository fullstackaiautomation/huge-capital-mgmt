-- Migration: Rename opportunity_tasks to huge_projects and create hierarchical structure
-- Run this migration in your Supabase SQL editor

-- Step 1: Rename opportunity_tasks to huge_projects
ALTER TABLE public.opportunity_tasks RENAME TO huge_projects;

-- Step 2: Add new fields to huge_projects for project management
ALTER TABLE public.huge_projects
  ADD COLUMN IF NOT EXISTS project_month TEXT,
  ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_phases INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_phases INTEGER DEFAULT 0;

-- Step 3: Create projects_phases table
CREATE TABLE IF NOT EXISTS public.projects_phases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id TEXT NOT NULL REFERENCES public.huge_projects(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL,
  phase_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('Not Started', 'In Progress', 'Completed', 'Huge Help')) DEFAULT 'Not Started',
  estimated_time TEXT,
  completion_percentage INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, phase_number)
);

-- Step 4: Create phase_tasks table
CREATE TABLE IF NOT EXISTS public.phase_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_id UUID NOT NULL REFERENCES public.projects_phases(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES public.huge_projects(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  task_description TEXT,
  task_order INTEGER NOT NULL,
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  status TEXT CHECK (status IN ('Not Started', 'In Progress', 'Completed', 'Huge Help')) DEFAULT 'Not Started',
  assignee TEXT,
  estimated_time TEXT,
  integration TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.projects_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phase_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for projects_phases
CREATE POLICY "Authenticated users can view all project phases"
  ON public.projects_phases FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert project phases"
  ON public.projects_phases FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update project phases"
  ON public.projects_phases FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete project phases"
  ON public.projects_phases FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create policies for phase_tasks
CREATE POLICY "Authenticated users can view all phase tasks"
  ON public.phase_tasks FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert phase tasks"
  ON public.phase_tasks FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update phase tasks"
  ON public.phase_tasks FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete phase tasks"
  ON public.phase_tasks FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_projects_phases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_phases_updated_at
  BEFORE UPDATE ON public.projects_phases
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_phases_updated_at();

CREATE OR REPLACE FUNCTION update_phase_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_phase_tasks_updated_at
  BEFORE UPDATE ON public.phase_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_phase_tasks_updated_at();

-- Function to auto-update task start_date when status changes to 'In Progress'
CREATE OR REPLACE FUNCTION update_task_start_date()
RETURNS TRIGGER AS $$
BEGIN
  -- If status is changing to 'In Progress' and start_date is not set
  IF NEW.status = 'In Progress' AND OLD.status != 'In Progress' AND NEW.start_date IS NULL THEN
    NEW.start_date = NOW();
  END IF;

  -- If task is marked as completed and start_date is still null, set it to now
  IF NEW.status = 'Completed' AND NEW.start_date IS NULL THEN
    NEW.start_date = NOW();
  END IF;

  -- If task is marked as completed (checkbox or status), set completed_date
  IF (NEW.status = 'Completed' OR NEW.completed = TRUE) AND (OLD.status != 'Completed' OR OLD.completed = FALSE) THEN
    NEW.completed_date = NOW();
    NEW.completed = TRUE;
    NEW.status = 'Completed';
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER task_status_trigger
  BEFORE UPDATE ON public.phase_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_task_start_date();

-- Function to calculate phase completion percentage and update phase status
CREATE OR REPLACE FUNCTION update_phase_stats()
RETURNS TRIGGER AS $$
DECLARE
  total_tasks INTEGER;
  completed_tasks INTEGER;
  phase_completion INTEGER;
  phase_status TEXT;
  earliest_start_date TIMESTAMP WITH TIME ZONE;
  all_completed BOOLEAN;
BEGIN
  -- Get the phase_id (handle both INSERT/UPDATE/DELETE)
  DECLARE phase_uuid UUID;
  BEGIN
    IF TG_OP = 'DELETE' THEN
      phase_uuid := OLD.phase_id;
    ELSE
      phase_uuid := NEW.phase_id;
    END IF;

    -- Count total and completed tasks for this phase
    SELECT COUNT(*), COUNT(*) FILTER (WHERE completed = TRUE OR status = 'Completed')
    INTO total_tasks, completed_tasks
    FROM public.phase_tasks
    WHERE phase_id = phase_uuid;

    -- Calculate completion percentage
    IF total_tasks > 0 THEN
      phase_completion := (completed_tasks * 100) / total_tasks;
    ELSE
      phase_completion := 0;
    END IF;

    -- Determine phase status
    IF phase_completion = 100 THEN
      phase_status := 'Completed';
    ELSIF phase_completion > 0 THEN
      phase_status := 'In Progress';
    ELSE
      -- Check if any task is In Progress or Huge Help
      SELECT EXISTS(SELECT 1 FROM public.phase_tasks WHERE phase_id = phase_uuid AND status IN ('In Progress', 'Huge Help'))
      INTO all_completed;

      IF all_completed THEN
        phase_status := 'In Progress';
      ELSE
        phase_status := 'Not Started';
      END IF;
    END IF;

    -- Get earliest start date from tasks
    SELECT MIN(start_date)
    INTO earliest_start_date
    FROM public.phase_tasks
    WHERE phase_id = phase_uuid AND start_date IS NOT NULL;

    -- Calculate total estimated time (sum of all task estimated times)
    DECLARE total_est_time TEXT;
    BEGIN
      -- This is a simplified version - you may want to add more sophisticated time aggregation
      SELECT STRING_AGG(estimated_time, ', ')
      INTO total_est_time
      FROM public.phase_tasks
      WHERE phase_id = phase_uuid AND estimated_time IS NOT NULL;

      -- Update the phase
      UPDATE public.projects_phases
      SET
        completion_percentage = phase_completion,
        status = phase_status,
        start_date = COALESCE(projects_phases.start_date, earliest_start_date),
        completed_date = CASE WHEN phase_completion = 100 THEN NOW() ELSE NULL END,
        estimated_time = COALESCE(total_est_time, estimated_time)
      WHERE id = phase_uuid;
    END;
  END;

  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER phase_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.phase_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_phase_stats();

-- Function to update project stats based on phases
CREATE OR REPLACE FUNCTION update_project_stats()
RETURNS TRIGGER AS $$
DECLARE
  total_phases_count INTEGER;
  completed_phases_count INTEGER;
  project_completion INTEGER;
BEGIN
  -- Get the project_id
  DECLARE proj_id TEXT;
  BEGIN
    IF TG_OP = 'DELETE' THEN
      proj_id := OLD.project_id;
    ELSE
      proj_id := NEW.project_id;
    END IF;

    -- Count total and completed phases for this project
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'Completed')
    INTO total_phases_count, completed_phases_count
    FROM public.projects_phases
    WHERE project_id = proj_id;

    -- Calculate overall project completion percentage
    IF total_phases_count > 0 THEN
      project_completion := (completed_phases_count * 100) / total_phases_count;
    ELSE
      project_completion := 0;
    END IF;

    -- Update project with aggregated stats
    UPDATE public.huge_projects
    SET
      total_phases = total_phases_count,
      completed_phases = completed_phases_count,
      completion_percentage = project_completion
    WHERE id = proj_id;
  END;

  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER project_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.projects_phases
  FOR EACH ROW
  EXECUTE FUNCTION update_project_stats();

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_phases_project_id ON public.projects_phases(project_id);
CREATE INDEX IF NOT EXISTS idx_phase_tasks_phase_id ON public.phase_tasks(phase_id);
CREATE INDEX IF NOT EXISTS idx_phase_tasks_project_id ON public.phase_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_phase_tasks_order ON public.phase_tasks(phase_id, task_order);
