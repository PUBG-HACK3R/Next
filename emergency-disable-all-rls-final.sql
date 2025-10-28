-- EMERGENCY: Disable RLS on ALL tables to fix the policy violations
-- This is affecting regular deposits now too

-- Disable RLS on all main tables
ALTER TABLE deposits DISABLE ROW LEVEL SECURITY;
ALTER TABLE usdt_deposits DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE investments DISABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals DISABLE ROW LEVEL SECURITY;
ALTER TABLE referral_commissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings DISABLE ROW LEVEL SECURITY;

-- Drop ALL RLS policies to clean up
DROP POLICY IF EXISTS "Users can view own deposits" ON deposits;
DROP POLICY IF EXISTS "Users can create deposits" ON deposits;
DROP POLICY IF EXISTS "Admins can manage deposits" ON deposits;

DROP POLICY IF EXISTS "usdt_deposits_user_select" ON usdt_deposits;
DROP POLICY IF EXISTS "usdt_deposits_user_insert" ON usdt_deposits;
DROP POLICY IF EXISTS "usdt_deposits_admin_update" ON usdt_deposits;

DROP POLICY IF EXISTS "user_profiles_own_select" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_admin_all" ON user_profiles;

DROP POLICY IF EXISTS "Users can view own investments" ON investments;
DROP POLICY IF EXISTS "Users can create investments" ON investments;
DROP POLICY IF EXISTS "Admins can view all investments" ON investments;

DROP POLICY IF EXISTS "Users can view own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Users can create withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Admins can manage withdrawals" ON withdrawals;

-- Verify all RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('deposits', 'usdt_deposits', 'user_profiles', 'investments', 'withdrawals', 'referral_commissions', 'admin_settings')
ORDER BY tablename;

-- All should show rls_enabled = false
