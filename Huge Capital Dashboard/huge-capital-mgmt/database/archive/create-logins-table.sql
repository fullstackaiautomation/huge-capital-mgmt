-- Create logins table
CREATE TABLE IF NOT EXISTS logins (
  id BIGSERIAL PRIMARY KEY,
  site_name VARCHAR(255) NOT NULL,
  link TEXT,
  username VARCHAR(255),
  password VARCHAR(255),
  two_fa VARCHAR(255),
  purpose TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on site_name for faster sorting
CREATE INDEX IF NOT EXISTS idx_logins_site_name ON logins(site_name);

-- Enable RLS (Row Level Security)
ALTER TABLE logins ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read all logins
CREATE POLICY "Allow authenticated users to read logins"
ON logins FOR SELECT
TO authenticated
USING (true);

-- Allow all authenticated users to insert logins
CREATE POLICY "Allow authenticated users to insert logins"
ON logins FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow all authenticated users to update logins
CREATE POLICY "Allow authenticated users to update logins"
ON logins FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow all authenticated users to delete logins
CREATE POLICY "Allow authenticated users to delete logins"
ON logins FOR DELETE
TO authenticated
USING (true);
