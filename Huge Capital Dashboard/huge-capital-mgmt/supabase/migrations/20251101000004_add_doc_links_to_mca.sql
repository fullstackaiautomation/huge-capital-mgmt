-- Add portal_url, preferred_industries_doc_link, and restricted_industries_doc_link columns to MCA table
ALTER TABLE lenders_mca
ADD COLUMN IF NOT EXISTS portal_url TEXT;

ALTER TABLE lenders_mca
ADD COLUMN IF NOT EXISTS preferred_industries_doc_link TEXT;

ALTER TABLE lenders_mca
ADD COLUMN IF NOT EXISTS restricted_industries_doc_link TEXT;