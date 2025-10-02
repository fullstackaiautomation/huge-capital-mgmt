-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create opportunity_tasks table for AI Automation Tasks page
CREATE TABLE IF NOT EXISTS public.opportunity_tasks (
  id TEXT PRIMARY KEY,
  task_name TEXT NOT NULL,
  impact_score INTEGER,
  effort_score INTEGER,
  input_score INTEGER,
  zac_score INTEGER,
  luke_score INTEGER,
  opportunity_level TEXT CHECK (opportunity_level IN ('Quick Wins', 'Big Wins', 'Mid Opportunities', 'Ungraded')) NOT NULL,
  tools TEXT[] DEFAULT '{}',
  summary TEXT,
  goal TEXT,
  start_date TEXT,
  finish_date TEXT,
  impact_on TEXT[] DEFAULT '{}',
  tg_projection TEXT,
  steps_checklist JSONB DEFAULT '[]',
  integration_checklist JSONB DEFAULT '[]',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.opportunity_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies (all authenticated users can read/write)
CREATE POLICY "Authenticated users can view all opportunity tasks"
  ON public.opportunity_tasks FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert opportunity tasks"
  ON public.opportunity_tasks FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update opportunity tasks"
  ON public.opportunity_tasks FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete opportunity tasks"
  ON public.opportunity_tasks FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_opportunity_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_opportunity_tasks_updated_at
  BEFORE UPDATE ON public.opportunity_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_opportunity_tasks_updated_at();

-- Create custom_tools table to store custom integration tools
CREATE TABLE IF NOT EXISTS public.custom_tools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for custom_tools
ALTER TABLE public.custom_tools ENABLE ROW LEVEL SECURITY;

-- Create policies for custom_tools
CREATE POLICY "Authenticated users can view all custom tools"
  ON public.custom_tools FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert custom tools"
  ON public.custom_tools FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
