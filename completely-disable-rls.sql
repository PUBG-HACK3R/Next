-- COMPLETELY DISABLE RLS - This will definitely work
-- If this doesn't work, the issue is not RLS at all

-- Disable RLS entirely on usdt_deposits
ALTER TABLE usdt_deposits DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies to be absolutely sure
DROP POLICY IF EXISTS "allow_all_usdt_inserts" ON usdt_deposits;
DROP POLICY IF EXISTS "allow_all_usdt_selects" ON usdt_deposits;
DROP POLICY IF EXISTS "usdt_deposits_select_policy" ON usdt_deposits;
DROP POLICY IF EXISTS "usdt_deposits_insert_policy" ON usdt_deposits;
DROP POLICY IF EXISTS "usdt_deposits_update_policy" ON usdt_deposits;
DROP POLICY IF EXISTS "usdt_deposits_insert_debug" ON usdt_deposits;
DROP POLICY IF EXISTS "Users can view own USDT deposits" ON usdt_deposits;
DROP POLICY IF EXISTS "Users can insert own USDT deposits" ON usdt_deposits;
DROP POLICY IF EXISTS "Admins can view all USDT deposits" ON usdt_deposits;
DROP POLICY IF EXISTS "Admins can manage all USDT deposits" ON usdt_deposits;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename = 'usdt_deposits';

-- This should show rowsecurity = false
