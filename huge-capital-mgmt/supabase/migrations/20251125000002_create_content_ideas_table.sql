-- Content Ideas Table
-- Stores AI-generated content ideas for each person based on their content pillars

CREATE TABLE IF NOT EXISTS content_ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person_name TEXT NOT NULL, -- 'Zac', 'Luke', 'Huge Capital'
  platform TEXT NOT NULL, -- 'LinkedIn', 'Twitter', 'Facebook', etc.

  -- Idea content
  idea_title TEXT NOT NULL, -- Short title/hook for the idea
  idea_description TEXT, -- Longer description of what to write about
  content_pillar TEXT, -- Which pillar this idea maps to

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'dismissed', 'used')),
  -- pending: just generated, waiting for review
  -- approved: user liked it (thumbs up)
  -- dismissed: user didn't like it (thumbs down)
  -- used: idea was converted into an actual post

  -- Metadata
  generated_by TEXT DEFAULT 'ai', -- 'ai' or 'manual'
  post_id UUID REFERENCES content_posts(id), -- Link to post if idea was used

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  dismissed_at TIMESTAMPTZ, -- When the idea was dismissed
  used_at TIMESTAMPTZ -- When the idea was converted to a post
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_content_ideas_person ON content_ideas(person_name);
CREATE INDEX IF NOT EXISTS idx_content_ideas_platform ON content_ideas(platform);
CREATE INDEX IF NOT EXISTS idx_content_ideas_status ON content_ideas(status);
CREATE INDEX IF NOT EXISTS idx_content_ideas_pillar ON content_ideas(content_pillar);

-- Enable RLS
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can read content ideas" ON content_ideas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage content ideas" ON content_ideas
  FOR ALL TO authenticated USING (true);

-- Also allow anonymous access for development (remove in production if needed)
CREATE POLICY "Anon can read content ideas" ON content_ideas
  FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can manage content ideas" ON content_ideas
  FOR ALL TO anon USING (true);

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_content_ideas_updated_at ON content_ideas;
CREATE TRIGGER update_content_ideas_updated_at BEFORE UPDATE ON content_ideas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
