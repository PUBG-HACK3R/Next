-- Check current authenticated user
SELECT 
    auth.uid() as current_user_id,
    auth.jwt() ->> 'email' as user_email;

-- Check if this user exists in user_profiles
SELECT 
    id,
    full_name,
    email,
    user_level,
    created_at
FROM user_profiles 
WHERE id = auth.uid();
