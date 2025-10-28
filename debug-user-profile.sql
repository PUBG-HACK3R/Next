-- Debug user profile issues

-- 1. Check current authenticated user
SELECT 
    auth.uid() as current_user_id,
    auth.jwt() ->> 'email' as user_email;

-- 2. Check if this user exists in user_profiles
SELECT 
    id,
    full_name,
    email,
    user_level,
    created_at
FROM user_profiles 
WHERE id = auth.uid();

-- 3. List all user_profiles to see what users exist
SELECT 
    id,
    full_name,
    email,
    created_at
FROM user_profiles 
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check if there are any auth users without profiles
SELECT 
    au.id,
    au.email,
    up.id as profile_id
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL
LIMIT 5;
