-- ============================================
-- CLEAN DATABASE FOR PRODUCTION LAUNCH
-- ⚠️ WARNING: This will delete ALL test data!
-- Only run this after ALL tests pass!
-- ============================================

-- Step 1: Backup check - Show what will be deleted
SELECT '=== DATA TO BE DELETED ===' as info;

SELECT 'Total Users' as item, COUNT(*) as count FROM user_profiles WHERE user_level < 999;
SELECT 'Total Investments' as item, COUNT(*) as count FROM investments;
SELECT 'Total Deposits' as item, COUNT(*) as count FROM deposits;
SELECT 'Total Withdrawals' as item, COUNT(*) as count FROM withdrawals;
SELECT 'Total Income Transactions' as item, COUNT(*) as count FROM income_transactions;
SELECT 'Total Referral Commissions' as item, COUNT(*) as count FROM referral_commissions;

-- Step 2: Show admin users (will be kept)
SELECT '=== ADMIN USERS (WILL BE KEPT) ===' as info;
SELECT id, full_name, email, user_level, balance, earned_balance 
FROM user_profiles 
WHERE user_level >= 999;

-- Step 3: Confirm before proceeding
SELECT '⚠️ REVIEW THE DATA ABOVE ⚠️' as warning;
SELECT 'If you want to proceed, uncomment and run the section below' as instruction;

-- ============================================
-- UNCOMMENT THIS SECTION TO ACTUALLY CLEAN
-- ============================================

/*
BEGIN;

-- Delete all transactions
DELETE FROM income_transactions;
DELETE FROM referral_commissions;
DELETE FROM withdrawals;
DELETE FROM deposits;
DELETE FROM investments;

-- Reset user balances (keep admin users)
UPDATE user_profiles 
SET balance = 0, 
    earned_balance = 0,
    total_deposits = 0,
    total_withdrawals = 0,
    updated_at = NOW()
WHERE user_level < 999;

-- Optional: Delete test users (uncomment if you want to remove test users)
-- DELETE FROM user_profiles WHERE user_level < 999;

COMMIT;

-- Verify clean state
SELECT '✅ DATABASE CLEANED SUCCESSFULLY!' as status;
SELECT 'Remaining users:' as info, COUNT(*) as count FROM user_profiles;
SELECT 'Remaining investments:' as info, COUNT(*) as count FROM investments;
SELECT 'Remaining deposits:' as info, COUNT(*) as count FROM deposits;
SELECT 'Remaining withdrawals:' as info, COUNT(*) as count FROM withdrawals;
SELECT 'Remaining transactions:' as info, COUNT(*) as count FROM income_transactions;

SELECT '🚀 READY FOR PRODUCTION LAUNCH! 🚀' as status;
*/
