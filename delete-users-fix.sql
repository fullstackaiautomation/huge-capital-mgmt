-- Fix: Allow user deletion by updating foreign key constraints
-- Run this in Supabase SQL Editor to fix the "Database error deleting user" issue

-- Drop existing foreign key constraints and recreate with CASCADE DELETE

-- Fix ai_tasks table
ALTER TABLE public.ai_tasks
DROP CONSTRAINT IF EXISTS ai_tasks_created_by_fkey;

ALTER TABLE public.ai_tasks
ADD CONSTRAINT ai_tasks_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Fix content_drafts table
ALTER TABLE public.content_drafts
DROP CONSTRAINT IF EXISTS content_drafts_author_fkey;

ALTER TABLE public.content_drafts
ADD CONSTRAINT content_drafts_author_fkey
FOREIGN KEY (author)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Fix profiles table (this one should cascade delete the profile when user is deleted)
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Now you can delete users and all their related data will be automatically deleted
