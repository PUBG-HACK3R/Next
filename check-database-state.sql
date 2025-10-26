-- Check current state of user_profiles table

-- 1. Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public';

-- 3. Check if there are any existing user profiles
SELECT COUNT(*) as total_users, 
       COUNT(email) as users_with_email,
       COUNT(*) - COUNT(email) as users_without_email
FROM user_profiles;

-- 4. Sample of existing data (if any)
SELECT id, full_name, email, referral_code, created_at
FROM user_profiles 
LIMIT 5;
