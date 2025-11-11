-- Create storage buckets for deals
INSERT INTO storage.buckets (id, name, public, created_at, updated_at, owner, owner_id)
VALUES
  (
    'deal-documents',
    'deal-documents',
    false,
    NOW(),
    NOW(),
    NULL,
    NULL
  )
ON CONFLICT (id) DO NOTHING;

-- RLS Policy for deal-documents bucket
-- Allow authenticated users to upload files to their own deal folders
CREATE POLICY "Users can upload deal documents"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'deal-documents'
    AND auth.role() = 'authenticated'
    -- Path format: user_id/deal_id/filename
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to read only their own deal documents
CREATE POLICY "Users can read their own deal documents"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'deal-documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to delete their own deal documents
CREATE POLICY "Users can delete their own deal documents"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'deal-documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to update their own deal documents
CREATE POLICY "Users can update their own deal documents"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'deal-documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
