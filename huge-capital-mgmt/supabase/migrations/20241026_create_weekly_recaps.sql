-- Create weekly_recaps table
CREATE TABLE IF NOT EXISTS weekly_recaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_number INTEGER NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  category VARCHAR(100) NOT NULL,
  what_was_done TEXT,
  quantity TEXT,
  wins_highlights TEXT,
  issues_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  user_id VARCHAR(100) DEFAULT 'dillon' -- For future multi-user support
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_weekly_recaps_week ON weekly_recaps(week_number, week_start);
CREATE INDEX IF NOT EXISTS idx_weekly_recaps_category ON weekly_recaps(category);
CREATE INDEX IF NOT EXISTS idx_weekly_recaps_user ON weekly_recaps(user_id);

-- Create trigger to update updated_at on row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_weekly_recaps_updated_at BEFORE UPDATE ON weekly_recaps
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE weekly_recaps ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (you can refine this later)
CREATE POLICY "Allow all operations on weekly_recaps" ON weekly_recaps
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);