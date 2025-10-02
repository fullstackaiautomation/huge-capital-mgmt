-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create AI Tasks table
CREATE TABLE IF NOT EXISTS public.ai_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_name TEXT NOT NULL,
  description TEXT,
  connectors TEXT[] DEFAULT '{}',
  task_area TEXT,
  task_type TEXT,
  opportunity_level TEXT CHECK (opportunity_level IN ('High', 'Medium', 'Low')),
  start_date DATE,
  estimated_completion_date DATE,
  status TEXT CHECK (status IN ('Not Started', 'In Progress', 'Blocked', 'Complete')) DEFAULT 'Not Started',
  checklist JSONB DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for ai_tasks
ALTER TABLE public.ai_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_tasks (all authenticated users can read/write)
CREATE POLICY "Authenticated users can view all tasks"
  ON public.ai_tasks FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert tasks"
  ON public.ai_tasks FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update tasks"
  ON public.ai_tasks FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete tasks"
  ON public.ai_tasks FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create Content Drafts table
CREATE TABLE IF NOT EXISTS public.content_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform TEXT CHECK (platform IN ('LinkedIn', 'Facebook', 'Instagram', 'Blog')) NOT NULL,
  schedule_type TEXT NOT NULL,
  content TEXT NOT NULL,
  preview_data JSONB,
  status TEXT CHECK (status IN ('Pending', 'Approved', 'Scheduled', 'Published')) DEFAULT 'Pending',
  author UUID REFERENCES auth.users(id),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for content_drafts
ALTER TABLE public.content_drafts ENABLE ROW LEVEL SECURITY;

-- Create policies for content_drafts
CREATE POLICY "Authenticated users can view all content"
  ON public.content_drafts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert content"
  ON public.content_drafts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update content"
  ON public.content_drafts FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete content"
  ON public.content_drafts FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_tasks_updated_at
  BEFORE UPDATE ON public.ai_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_drafts_updated_at
  BEFORE UPDATE ON public.content_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
