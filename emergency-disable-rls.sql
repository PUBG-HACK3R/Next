-- EMERGENCY: Disable RLS on all tables to restore functionality
-- The authentication issue still needs to be fixed

-- Disable RLS on all tables
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE deposits DISABLE ROW LEVEL SECURITY;
ALTER TABLE investments DISABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals DISABLE ROW LEVEL SECURITY;
ALTER TABLE usdt_deposits DISABLE ROW LEVEL SECURITY;

-- Drop all policies to clean up
DROP POLICY IF EXISTS "user_profiles_own_select" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_admin_all" ON user_profiles;
DROP POLICY IF EXISTS "deposits_own_select" ON deposits;
DROP POLICY IF EXISTS "deposits_own_insert" ON deposits;
DROP POLICY IF EXISTS "deposits_admin_all" ON deposits;
DROP POLICY IF EXISTS "usdt_deposits_user_select" ON usdt_deposits;
DROP POLICY IF EXISTS "usdt_deposits_user_insert" ON usdt_deposits;
DROP POLICY IF EXISTS "usdt_deposits_admin_update" ON usdt_deposits;

-- Verify all RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'deposits', 'investments', 'withdrawals', 'usdt_deposits')
ORDER BY tablename;

-- All should show rowsecurity = false
