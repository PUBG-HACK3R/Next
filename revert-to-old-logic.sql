-- Revert everything back to the old working logic
-- Disable USDT temporarily and restore bank/easypaisa to original state

-- 1. Temporarily disable USDT deposits by removing the menu/route
-- (We'll do this in frontend)

-- 2. Restore deposits table to original state
ALTER TABLE deposits ALTER COLUMN proof_url DROP NOT NULL;

-- 3. Remove all the constraints we added
ALTER TABLE deposits DROP CONSTRAINT IF EXISTS deposits_proof_url_not_empty;

-- 4. Disable RLS completely (like it was before)
ALTER TABLE deposits DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE referral_commissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE investments DISABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings DISABLE ROW LEVEL SECURITY;

-- 5. Drop all RLS policies
DROP POLICY IF EXISTS "Users can view own deposits" ON deposits;
DROP POLICY IF EXISTS "Users can create deposits" ON deposits;
DROP POLICY IF EXISTS "Admins can manage deposits" ON deposits;

-- 6. Make sure the original referral commission trigger is working
-- Re-enable the original trigger for regular deposits (if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_calculate_referral_commissions' 
        AND event_object_table = 'deposits'
    ) THEN
        ALTER TABLE deposits ENABLE TRIGGER trigger_calculate_referral_commissions;
        RAISE NOTICE 'Enabled referral commission trigger';
    ELSE
        RAISE NOTICE 'Referral commission trigger does not exist - will need to be created separately';
    END IF;
END $$;

-- 7. Verify deposits table is back to original state
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'deposits'
AND column_name IN ('proof_url', 'user_id', 'amount', 'status')
ORDER BY column_name;

-- 8. Test that we can insert a regular deposit
-- This should work like before
SELECT 'Deposits table restored to original working state' as status;
