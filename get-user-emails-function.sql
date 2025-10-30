-- Create a function to get user emails for admin
-- This function should be run in your Supabase SQL editor

CREATE OR REPLACE FUNCTION get_user_emails(user_ids UUID[])
RETURNS TABLE(id UUID, email TEXT)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    au.id,
    au.email
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
$$;

-- Grant execute permission to authenticated users (you may want to restrict this further)
GRANT EXECUTE ON FUNCTION get_user_emails(UUID[]) TO authenticated;

-- Alternative: Create a view that joins user_profiles with auth.users
CREATE OR REPLACE VIEW admin_users_with_email AS
SELECT 
  up.*,
  au.email as auth_email
FROM user_profiles up
LEFT JOIN auth.users au ON up.id = au.id;

-- Grant select permission on the view
GRANT SELECT ON admin_users_with_email TO authenticated;
