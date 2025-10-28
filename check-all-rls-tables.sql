-- Check ALL tables with RLS enabled and their policies
-- The error might be coming from a different table

-- 1. Find all tables with RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE rowsecurity = true
ORDER BY tablename;

-- 2. Check policies on user_profiles (might be blocking the foreign key check)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 3. Check policies on any other tables that might be involved
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('deposits', 'investments', 'withdrawals')
ORDER BY tablename, policyname;
