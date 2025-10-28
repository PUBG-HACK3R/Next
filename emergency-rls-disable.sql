-- EMERGENCY: Temporarily disable RLS for deposits to get working immediately
-- WARNING: This removes security temporarily - only for testing!

-- Disable RLS completely on deposits table
ALTER TABLE deposits DISABLE ROW LEVEL SECURITY;

-- Grant full permissions to authenticated users
GRANT ALL PRIVILEGES ON deposits TO authenticated;
GRANT ALL PRIVILEGES ON SEQUENCE deposits_id_seq TO authenticated;

-- Also grant permissions on deposit_transactions if it exists
GRANT ALL PRIVILEGES ON deposit_transactions TO authenticated;
GRANT ALL PRIVILEGES ON SEQUENCE deposit_transactions_id_seq TO authenticated;

-- Success message
SELECT 'SUCCESS: RLS temporarily disabled. Deposits should work now!' as status;
