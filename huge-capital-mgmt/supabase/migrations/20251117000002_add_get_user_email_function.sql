-- Create a function to get user email from auth.users
-- This allows the client to fetch broker information for deals

CREATE OR REPLACE FUNCTION public.get_user_email(user_uuid UUID)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT email FROM auth.users WHERE id = user_uuid;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_email(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_user_email IS 'Returns the email address for a given user ID from auth.users';
