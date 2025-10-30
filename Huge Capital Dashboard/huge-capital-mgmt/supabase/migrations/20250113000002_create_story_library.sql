-- Story Library for storing funding story transcripts and voice memo content
-- This captures real stories from Zac and Luke to use in content generation

CREATE TABLE IF NOT EXISTS story_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_name TEXT NOT NULL CHECK (person_name IN ('Zac', 'Luke', 'Huge Capital')),
  title TEXT NOT NULL,
  transcript TEXT NOT NULL,
  story_type TEXT CHECK (story_type IN ('funding_success', 'client_challenge', 'industry_insight', 'personal_experience', 'case_study', 'other')),
  funding_type TEXT CHECK (funding_type IN ('SBA 7(a)', 'SBA 504', 'Construction Loan', 'Equipment Financing', 'Working Capital', 'Commercial Real Estate', 'Business Acquisition', 'Other')),
  themes TEXT[], -- Array of themes like ['client_transformation', 'overcoming_obstacles', 'speed_to_close']
  key_takeaways TEXT[], -- Main points/lessons from the story
  client_industry TEXT, -- e.g., 'Construction', 'Manufacturing', 'Healthcare'
  loan_amount_range TEXT, -- e.g., '100k-500k', '500k-1M', '1M-5M', '5M+'

  -- Source information
  source_type TEXT CHECK (source_type IN ('voice_memo', 'slack_message', 'call_transcript', 'manual_entry', 'other')),
  source_url TEXT, -- Link to Slack message, recording, etc.
  recorded_date TIMESTAMPTZ,

  -- Metadata
  is_approved BOOLEAN DEFAULT false, -- For review before using in content
  usage_notes TEXT, -- Special instructions for using this story

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for tracking which stories were used in which content
CREATE TABLE IF NOT EXISTS content_story_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES content_posts(id) ON DELETE CASCADE,
  story_id UUID REFERENCES story_library(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(content_id, story_id)
);

-- Indexes for common queries
CREATE INDEX idx_story_library_person ON story_library(person_name);
CREATE INDEX idx_story_library_type ON story_library(story_type);
CREATE INDEX idx_story_library_funding_type ON story_library(funding_type);
CREATE INDEX idx_story_library_approved ON story_library(is_approved);
CREATE INDEX idx_story_library_created ON story_library(created_at DESC);
CREATE INDEX idx_content_story_usage_content ON content_story_usage(content_id);
CREATE INDEX idx_content_story_usage_story ON content_story_usage(story_id);

-- RLS Policies
ALTER TABLE story_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_story_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can read story library" ON story_library;
  DROP POLICY IF EXISTS "Users can insert story library" ON story_library;
  DROP POLICY IF EXISTS "Users can update story library" ON story_library;
  DROP POLICY IF EXISTS "Users can delete story library" ON story_library;
  DROP POLICY IF EXISTS "Users can read story usage" ON content_story_usage;
  DROP POLICY IF EXISTS "Users can insert story usage" ON content_story_usage;
  DROP POLICY IF EXISTS "Users can delete story usage" ON content_story_usage;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Story Library Policies
CREATE POLICY "Users can read story library" ON story_library
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert story library" ON story_library
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update story library" ON story_library
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can delete story library" ON story_library
  FOR DELETE TO authenticated USING (true);

-- Story Usage Policies
CREATE POLICY "Users can read story usage" ON content_story_usage
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert story usage" ON content_story_usage
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can delete story usage" ON content_story_usage
  FOR DELETE TO authenticated USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_story_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER story_library_updated_at
  BEFORE UPDATE ON story_library
  FOR EACH ROW
  EXECUTE FUNCTION update_story_library_updated_at();
