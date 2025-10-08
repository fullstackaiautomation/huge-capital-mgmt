-- Create bugs_ideas table
CREATE TABLE IF NOT EXISTS public.bugs_ideas (
  id TEXT PRIMARY KEY,
  page TEXT NOT NULL,
  note TEXT NOT NULL,
  screenshot TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.bugs_ideas ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all bug/idea submissions"
  ON public.bugs_ideas
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert bug/idea submissions"
  ON public.bugs_ideas
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update bug/idea submissions"
  ON public.bugs_ideas
  FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete bug/idea submissions"
  ON public.bugs_ideas
  FOR DELETE
  USING (true);

-- Create index on submitted_at for faster queries
CREATE INDEX IF NOT EXISTS idx_bugs_ideas_submitted_at ON public.bugs_ideas(submitted_at);
