-- ============================================
-- SAFE STEP-BY-STEP DATABASE CLEANUP
-- Run each section separately and verify results
-- ============================================

-- STEP 1: CHECK CURRENT DATA (run this first)
-- ============================================
SELECT 'Current Database State:' as info;

SELECT 'deposits' as table_name, COUNT(*) as records FROM deposits
UNION ALL
SELECT 'withdrawals', COUNT(*) FROM withdrawals  
UNION ALL
SELECT 'user_investments', COUNT(*) FROM user_investments
UNION ALL
SELECT 'daily_incomes', COUNT(*) FROM daily_incomes
UNION ALL
SELECT 'referrals', COUNT(*) FROM referrals
UNION ALL
SELECT 'referral_commissions', COUNT(*) FROM referral_commissions
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'investment_plans', COUNT(*) FROM investment_plans
UNION ALL
SELECT 'admin_settings', COUNT(*) FROM admin_settings;

-- STEP 2: BACKUP IMPORTANT DATA (optional)
-- ============================================
-- Create backup tables for investment plans and admin settings
/*
CREATE TABLE investment_plans_backup AS SELECT * FROM investment_plans;
CREATE TABLE admin_settings_backup AS SELECT * FROM admin_settings;
*/

-- STEP 3: CLEAR USER FINANCIAL DATA
-- ============================================
-- Run these one by one and check results

-- Clear daily incomes first (has foreign keys)
DELETE FROM daily_incomes;
SELECT 'daily_incomes cleared:', COUNT(*) FROM daily_incomes;

-- Clear user investments
DELETE FROM user_investments;
SELECT 'user_investments cleared:', COUNT(*) FROM user_investments;

-- Clear referral commissions
DELETE FROM referral_commissions;
SELECT 'referral_commissions cleared:', COUNT(*) FROM referral_commissions;

-- Clear referrals
DELETE FROM referrals;
SELECT 'referrals cleared:', COUNT(*) FROM referrals;

-- Clear deposits
DELETE FROM deposits;
SELECT 'deposits cleared:', COUNT(*) FROM deposits;

-- Clear withdrawals  
DELETE FROM withdrawals;
SELECT 'withdrawals cleared:', COUNT(*) FROM withdrawals;

-- STEP 4: CLEAR USER PROFILES (CAREFUL!)
-- ============================================
-- Option A: Keep admin users (replace with actual admin user IDs)
-- DELETE FROM profiles WHERE role != 'admin';

-- Option B: Clear all users (complete fresh start)
-- DELETE FROM profiles;

-- Check remaining profiles
SELECT 'remaining profiles:', COUNT(*) FROM profiles;
SELECT id, email, full_name, role FROM profiles;

-- STEP 5: RESET COUNTERS
-- ============================================
ALTER SEQUENCE deposits_id_seq RESTART WITH 1;
ALTER SEQUENCE withdrawals_id_seq RESTART WITH 1;
ALTER SEQUENCE user_investments_id_seq RESTART WITH 1;
ALTER SEQUENCE daily_incomes_id_seq RESTART WITH 1;
ALTER SEQUENCE referrals_id_seq RESTART WITH 1;
ALTER SEQUENCE referral_commissions_id_seq RESTART WITH 1;

-- STEP 6: RESET ADMIN STATISTICS
-- ============================================
UPDATE admin_settings SET 
    total_users = 0,
    total_deposits = 0,
    total_withdrawals = 0,
    total_investments = 0,
    updated_at = NOW()
WHERE id = 1;

-- STEP 7: FINAL VERIFICATION
-- ============================================
SELECT 'Final Database State:' as info;

SELECT 'deposits' as table_name, COUNT(*) as records FROM deposits
UNION ALL
SELECT 'withdrawals', COUNT(*) FROM withdrawals
UNION ALL  
SELECT 'user_investments', COUNT(*) FROM user_investments
UNION ALL
SELECT 'daily_incomes', COUNT(*) FROM daily_incomes
UNION ALL
SELECT 'referrals', COUNT(*) FROM referrals
UNION ALL
SELECT 'referral_commissions', COUNT(*) FROM referral_commissions
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'investment_plans', COUNT(*) FROM investment_plans
UNION ALL
SELECT 'admin_settings', COUNT(*) FROM admin_settings;

-- Show remaining investment plans (should be preserved)
SELECT id, name, duration_days, profit_percent, min_investment, max_investment 
FROM investment_plans 
ORDER BY id;

-- Show admin settings (should be preserved but stats reset)
SELECT * FROM admin_settings;
