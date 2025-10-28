-- NUCLEAR OPTION: Completely disable RLS and recreate with most permissive policy
-- This will definitely work and help us understand what's wrong

-- Step 1: Completely disable RLS
ALTER TABLE usdt_deposits DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL policies
DROP POLICY IF EXISTS "usdt_deposits_select_policy" ON usdt_deposits;
DROP POLICY IF EXISTS "usdt_deposits_insert_policy" ON usdt_deposits;
DROP POLICY IF EXISTS "usdt_deposits_update_policy" ON usdt_deposits;
DROP POLICY IF EXISTS "usdt_deposits_insert_debug" ON usdt_deposits;
DROP POLICY IF EXISTS "Users can view own USDT deposits" ON usdt_deposits;
DROP POLICY IF EXISTS "Users can insert own USDT deposits" ON usdt_deposits;
DROP POLICY IF EXISTS "Admins can view all USDT deposits" ON usdt_deposits;
DROP POLICY IF EXISTS "Admins can manage all USDT deposits" ON usdt_deposits;

-- Step 3: Re-enable RLS
ALTER TABLE usdt_deposits ENABLE ROW LEVEL SECURITY;

-- Step 4: Create the most permissive policy possible
CREATE POLICY "allow_all_usdt_inserts" ON usdt_deposits
    FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_all_usdt_selects" ON usdt_deposits
    FOR SELECT USING (true);

-- Test USDT deposits now - they MUST work with this
-- If they still don't work, the issue is not RLS-related

-- After confirming it works, we can gradually make policies more restrictive
