-- Fix users who exist in auth.users but not in user_profiles

-- Check for users missing profiles
SELECT 
    au.id,
    au.email,
    au.created_at,
    CASE WHEN up.id IS NULL THEN 'Missing Profile' ELSE 'Has Profile' END as status
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- Create profiles for users missing them
INSERT INTO user_profiles (id, full_name, email, referral_code, balance, user_level)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', 'User') as full_name,
    au.email,
    'ref' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0') as referral_code,
    0 as balance,
    1 as user_level
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- Verify all users now have profiles
SELECT 
    COUNT(*) as total_auth_users,
    COUNT(up.id) as users_with_profiles,
    COUNT(*) - COUNT(up.id) as users_missing_profiles
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id;
