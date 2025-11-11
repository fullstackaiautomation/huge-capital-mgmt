-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all bug/request submissions" ON bugs_requests;
DROP POLICY IF EXISTS "Users can insert bug/request submissions" ON bugs_requests;
DROP POLICY IF EXISTS "Users can update bug/request submissions" ON bugs_requests;
DROP POLICY IF EXISTS "Users can delete bug/request submissions" ON bugs_requests;

-- Drop table if exists to start fresh
DROP TABLE IF EXISTS bugs_requests;

-- Create bugs_requests table
CREATE TABLE public.bugs_requests (
  id TEXT PRIMARY KEY,
  page TEXT NOT NULL,
  note TEXT NOT NULL,
  screenshot TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_by TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.bugs_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all bug/request submissions"
  ON public.bugs_requests
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert bug/request submissions"
  ON public.bugs_requests
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update bug/request submissions"
  ON public.bugs_requests
  FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete bug/request submissions"
  ON public.bugs_requests
  FOR DELETE
  USING (true);

-- Create index on submitted_at for faster queries
CREATE INDEX idx_bugs_requests_submitted_at ON public.bugs_requests(submitted_at);
