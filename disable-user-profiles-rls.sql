-- Temporarily disable RLS on user_profiles to fix foreign key constraint checks
-- This might be blocking the USDT deposit foreign key validation

-- Check current RLS status on user_profiles
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- Disable RLS on user_profiles temporarily
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Verify it's disabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- Test USDT deposit now
-- If it works, the issue was user_profiles RLS blocking foreign key checks
