-- Temporarily disable RLS on bonus_transactions for testing

-- Disable RLS
ALTER TABLE bonus_transactions DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'bonus_transactions';

-- This should show rowsecurity = false
