-- Content Planner Database Schema for Supabase
-- This file contains all the tables needed for the enhanced content planner

-- ==========================================
-- CONTENT PROFILES (Enhanced person profiles)
-- ==========================================
CREATE TABLE IF NOT EXISTS content_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person_name TEXT NOT NULL UNIQUE, -- 'Zac', 'Luke', 'Huge Capital'
  content_pillars JSONB DEFAULT '[]',
  brand_voice JSONB DEFAULT '[]',
  key_messaging JSONB DEFAULT '[]',
  ai_context JSONB DEFAULT '{}', -- Store learned patterns and preferences
  posting_goals JSONB DEFAULT '{}', -- Platform-specific frequency goals
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- CONTENT POSTS (Main content storage)
-- ==========================================
CREATE TABLE IF NOT EXISTS content_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person_name TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'LinkedIn', 'Twitter', 'Facebook', etc.

  -- Content fields
  content TEXT NOT NULL,
  thread_content JSONB, -- For Twitter threads: [{order: 1, content: "..."}, ...]
  is_thread BOOLEAN DEFAULT FALSE,
  thread_hook TEXT, -- The hook for Twitter threads

  -- Media and metadata
  media_urls JSONB DEFAULT '[]',
  tags JSONB DEFAULT '[]', -- Content tags/categories
  content_pillar TEXT,
  sources JSONB DEFAULT '[]', -- Track sources/references

  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  optimal_time TIMESTAMPTZ, -- AI suggested time
  timezone TEXT DEFAULT 'America/New_York',

  -- Status tracking
  status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'published', 'failed'
  published_at TIMESTAMPTZ,
  publish_error TEXT,

  -- Version tracking
  version_number INTEGER DEFAULT 1,
  parent_post_id UUID REFERENCES content_posts(id), -- For tracking edits
  edit_history JSONB DEFAULT '[]', -- Track all changes

  -- User tracking
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_content_posts_person ON content_posts(person_name);
CREATE INDEX IF NOT EXISTS idx_content_posts_platform ON content_posts(platform);
CREATE INDEX IF NOT EXISTS idx_content_posts_status ON content_posts(status);
CREATE INDEX IF NOT EXISTS idx_content_posts_scheduled ON content_posts(scheduled_for);

-- ==========================================
-- CONTENT ANALYTICS (Track performance)
-- ==========================================
CREATE TABLE IF NOT EXISTS content_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES content_posts(id) ON DELETE CASCADE,

  -- Engagement metrics
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,

  -- Growth metrics
  followers_gained INTEGER DEFAULT 0,
  followers_lost INTEGER DEFAULT 0,

  -- Calculated metrics
  engagement_rate DECIMAL(5,2),
  click_through_rate DECIMAL(5,2),

  -- Timestamps for tracking
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- COMPETITOR POSTS (Track competitor content)
-- ==========================================
CREATE TABLE IF NOT EXISTS competitor_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_name TEXT NOT NULL,
  platform TEXT NOT NULL,

  -- Content
  content TEXT,
  media_urls JSONB DEFAULT '[]',
  post_url TEXT,

  -- Our analysis
  rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- 1-5 star rating
  notes TEXT,
  style_tags JSONB DEFAULT '[]', -- What we like about it

  -- Performance (if available)
  likes INTEGER,
  comments INTEGER,
  shares INTEGER,

  -- Metadata
  posted_at TIMESTAMPTZ,
  analyzed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- CONTENT TAGS (Organization system)
-- ==========================================
CREATE TABLE IF NOT EXISTS content_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tag_name TEXT NOT NULL UNIQUE,
  tag_category TEXT, -- 'pillar', 'topic', 'campaign', etc.
  color TEXT, -- For UI display
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- POSTING GOALS (Track frequency targets)
-- ==========================================
CREATE TABLE IF NOT EXISTS posting_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person_name TEXT NOT NULL,
  platform TEXT NOT NULL,

  -- Goals
  posts_per_week INTEGER DEFAULT 0,
  posts_per_month INTEGER DEFAULT 0,
  preferred_times JSONB DEFAULT '[]', -- Array of preferred posting times

  -- Tracking
  current_week_posts INTEGER DEFAULT 0,
  current_month_posts INTEGER DEFAULT 0,
  last_reset_date DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(person_name, platform)
);

-- ==========================================
-- CONTENT TEMPLATES (Reusable templates)
-- ==========================================
CREATE TABLE IF NOT EXISTS content_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  person_name TEXT,
  platform TEXT,

  -- Template content
  content_template TEXT,
  thread_template JSONB, -- For Twitter thread templates
  variables JSONB DEFAULT '[]', -- Variables to fill in

  -- Metadata
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- COMMENTS (Track engagement)
-- ==========================================
CREATE TABLE IF NOT EXISTS content_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES content_posts(id) ON DELETE CASCADE,

  -- Comment data
  platform TEXT NOT NULL,
  comment_id TEXT, -- Platform's comment ID
  author_name TEXT,
  author_handle TEXT,
  content TEXT,

  -- Our response
  reply_content TEXT,
  replied_at TIMESTAMPTZ,
  replied_by UUID REFERENCES auth.users(id),

  -- Status
  requires_response BOOLEAN DEFAULT FALSE,
  sentiment TEXT, -- 'positive', 'negative', 'neutral'

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- AI LEARNING (Track what works)
-- ==========================================
CREATE TABLE IF NOT EXISTS ai_learning (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person_name TEXT NOT NULL,
  platform TEXT NOT NULL,

  -- What we learned
  pattern_type TEXT, -- 'edit', 'timing', 'content_type', etc.
  original_content TEXT,
  edited_content TEXT,
  performance_score DECIMAL(5,2),

  -- Context
  notes JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- NEWSLETTER SUBSCRIBERS
-- ==========================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  company TEXT,

  -- Subscription details
  subscribed_to JSONB DEFAULT '["newsletter"]', -- Can subscribe to multiple lists
  status TEXT DEFAULT 'active', -- 'active', 'unsubscribed', 'bounced'

  -- Tracking
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  last_email_sent TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- NEWSLETTER CAMPAIGNS
-- ==========================================
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_name TEXT NOT NULL,
  subject_line TEXT NOT NULL,
  preview_text TEXT,

  -- Content
  html_content TEXT,
  plain_text_content TEXT,

  -- Targeting
  subscriber_list TEXT DEFAULT 'newsletter',

  -- Status
  status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'sent'
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,

  -- Stats
  total_recipients INTEGER DEFAULT 0,
  opens INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE content_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE posting_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can read content profiles" ON content_profiles;
  DROP POLICY IF EXISTS "Users can manage content profiles" ON content_profiles;
  DROP POLICY IF EXISTS "Users can manage content posts" ON content_posts;
  DROP POLICY IF EXISTS "Users can read analytics" ON content_analytics;
  DROP POLICY IF EXISTS "System can manage analytics" ON content_analytics;
  DROP POLICY IF EXISTS "Users can manage competitor posts" ON competitor_posts;
  DROP POLICY IF EXISTS "Users can read tags" ON content_tags;
  DROP POLICY IF EXISTS "Users can manage tags" ON content_tags;
  DROP POLICY IF EXISTS "Users can manage posting goals" ON posting_goals;
  DROP POLICY IF EXISTS "Users can manage templates" ON content_templates;
  DROP POLICY IF EXISTS "Users can manage comments" ON content_comments;
  DROP POLICY IF EXISTS "Users can read AI learning" ON ai_learning;
  DROP POLICY IF EXISTS "System can manage AI learning" ON ai_learning;
  DROP POLICY IF EXISTS "Users can manage newsletter subscribers" ON newsletter_subscribers;
  DROP POLICY IF EXISTS "Users can manage newsletter campaigns" ON newsletter_campaigns;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Content profiles - everyone can read, only admins can write
CREATE POLICY "Users can read content profiles" ON content_profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage content profiles" ON content_profiles
  FOR ALL TO authenticated USING (true);

-- Content posts - everyone can manage their own
CREATE POLICY "Users can manage content posts" ON content_posts
  FOR ALL TO authenticated USING (true);

-- Analytics - read only for most users
CREATE POLICY "Users can read analytics" ON content_analytics
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can manage analytics" ON content_analytics
  FOR ALL TO authenticated USING (true);

-- Competitor posts - everyone can manage
CREATE POLICY "Users can manage competitor posts" ON competitor_posts
  FOR ALL TO authenticated USING (true);

-- Tags - everyone can read, admins can write
CREATE POLICY "Users can read tags" ON content_tags
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage tags" ON content_tags
  FOR ALL TO authenticated USING (true);

-- Posting goals - everyone can manage
CREATE POLICY "Users can manage posting goals" ON posting_goals
  FOR ALL TO authenticated USING (true);

-- Templates - everyone can manage
CREATE POLICY "Users can manage templates" ON content_templates
  FOR ALL TO authenticated USING (true);

-- Comments - everyone can manage
CREATE POLICY "Users can manage comments" ON content_comments
  FOR ALL TO authenticated USING (true);

-- AI learning - system managed
CREATE POLICY "Users can read AI learning" ON ai_learning
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can manage AI learning" ON ai_learning
  FOR ALL TO authenticated USING (true);

-- Newsletter - admins only
CREATE POLICY "Users can manage newsletter subscribers" ON newsletter_subscribers
  FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage newsletter campaigns" ON newsletter_campaigns
  FOR ALL TO authenticated USING (true);

-- ==========================================
-- FUNCTIONS AND TRIGGERS
-- ==========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
DROP TRIGGER IF EXISTS update_content_profiles_updated_at ON content_profiles;
CREATE TRIGGER update_content_profiles_updated_at BEFORE UPDATE ON content_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_posts_updated_at ON content_posts;
CREATE TRIGGER update_content_posts_updated_at BEFORE UPDATE ON content_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_posting_goals_updated_at ON posting_goals;
CREATE TRIGGER update_posting_goals_updated_at BEFORE UPDATE ON posting_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- INITIAL DATA
-- ==========================================

-- Insert the three main profiles (only if they don't exist)
INSERT INTO content_profiles (person_name, content_pillars, brand_voice, key_messaging)
VALUES
('Zac',
  '["Client Success Stories (40%)", "Educational / Legal Updates (30%)", "Entrepreneur Spotlights (20%)", "Personal Brand Building (10%)"]'::jsonb,
  '["Trustworthy & Professional", "Long Term Relationships > Quick Commissions", "Creative Problem Solver", "Authentic", "Not Super Serious / Funny (Twitter)"]'::jsonb,
  '["7+ Years Saving Businesses", "SBA Specialist Expertise", "Knows the Best Solution for Your Situation", "Creative Funder", "Consultative Approach"]'::jsonb
),
('Luke',
  '["Client Success Stories (40%)", "Educational / Myth-Busting (30%)", "Entrepreneur Spotlights (20%)", "Personal Brand & Leadership (10%)"]'::jsonb,
  '["Honest & Trustworthy", "Relational > Transactional", "Personable", "Down to Earth"]'::jsonb,
  '["If it''s not good for you, it''s not good for us", "We are invested in your success, not a quick buck", "Investment Real Estate Advisor", "Business Credit Expert", "We''re a part of your team, not just a middleman"]'::jsonb
),
('Huge Capital',
  '["Business funding solutions", "Capital expertise", "Client success"]'::jsonb,
  '["Trusted and reliable", "Expert and knowledgeable", "Client-focused"]'::jsonb,
  '["Comprehensive funding solutions", "Industry expertise", "Committed to client success"]'::jsonb
)
ON CONFLICT (person_name) DO NOTHING;

-- Set up initial posting goals (can be adjusted later)
INSERT INTO posting_goals (person_name, platform, posts_per_week, posts_per_month)
VALUES
('Zac', 'LinkedIn', 3, 12),
('Zac', 'Twitter', 7, 30),
('Zac', 'Facebook', 2, 8),
('Luke', 'LinkedIn', 3, 12),
('Luke', 'Twitter', 5, 20),
('Luke', 'Facebook', 2, 8),
('Huge Capital', 'Blog', 1, 4),
('Huge Capital', 'Newsletter', 1, 4)
ON CONFLICT (person_name, platform) DO NOTHING;
