-- Temporary fix: Disable RLS for USDT deposits to test functionality
-- WARNING: This removes security temporarily - only for testing!

-- Disable RLS on usdt_deposits table
ALTER TABLE usdt_deposits DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables 
WHERE tablename = 'usdt_deposits';

-- After testing, you can re-enable with:
-- ALTER TABLE usdt_deposits ENABLE ROW LEVEL SECURITY;
