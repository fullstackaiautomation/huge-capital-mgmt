-- Create daily_checklist table
CREATE TABLE IF NOT EXISTS daily_checklist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id VARCHAR(100) NOT NULL,
  title TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  frequency TEXT,
  notes TEXT,
  monday BOOLEAN DEFAULT false,
  tuesday BOOLEAN DEFAULT false,
  wednesday BOOLEAN DEFAULT false,
  thursday BOOLEAN DEFAULT false,
  friday BOOLEAN DEFAULT false,
  week_number INTEGER,
  week_start DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  user_id VARCHAR(100) DEFAULT 'dillon'
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_daily_checklist_week ON daily_checklist(week_number, week_start);
CREATE INDEX IF NOT EXISTS idx_daily_checklist_category ON daily_checklist(category);
CREATE INDEX IF NOT EXISTS idx_daily_checklist_user ON daily_checklist(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_checklist_task ON daily_checklist(task_id, user_id);

-- Create trigger to update updated_at on row update
CREATE OR REPLACE FUNCTION update_daily_checklist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_daily_checklist_updated_at BEFORE UPDATE ON daily_checklist
FOR EACH ROW EXECUTE PROCEDURE update_daily_checklist_updated_at();

-- Enable RLS (Row Level Security)
ALTER TABLE daily_checklist ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now
CREATE POLICY "Allow all operations on daily_checklist" ON daily_checklist
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);