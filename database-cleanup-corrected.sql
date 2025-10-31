-- ============================================
-- CORRECTED SMARTGROW DATABASE CLEANUP SCRIPT
-- Using actual table names from your schema
-- ============================================
-- ⚠️  WARNING: This will delete ALL user data!
-- Run check-actual-tables.sql FIRST to verify table names
-- ============================================

-- Step 1: Check what tables actually exist
SELECT 'Checking existing tables...' as status;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Step 2: Show current data counts
SELECT 'Current data counts:' as status;

-- Only run these if tables exist (check output above first)
SELECT 'investments' as table_name, COUNT(*) as records FROM investments;
SELECT 'deposits' as table_name, COUNT(*) as records FROM deposits;
SELECT 'withdrawals' as table_name, COUNT(*) as records FROM withdrawals;
SELECT 'referrals' as table_name, COUNT(*) as records FROM referrals;
SELECT 'profiles' as table_name, COUNT(*) as records FROM profiles;

-- Step 3: Clear user data (CORRECTED TABLE NAMES)
-- ============================================

-- Clear investments and related data
DELETE FROM daily_incomes WHERE id > 0;  -- Clear this first (has foreign keys)
DELETE FROM investments WHERE id > 0;    -- Correct table name

-- Clear user financial transactions  
DELETE FROM deposits WHERE id > 0;
DELETE FROM withdrawals WHERE id > 0;

-- Clear user referral data
DELETE FROM referral_commissions WHERE id > 0;  -- Clear this first (has foreign keys)
DELETE FROM referrals WHERE id > 0;

-- Clear user profiles (CAREFUL - this deletes all users!)
-- Uncomment ONE of these options:

-- Option 1: Delete ALL users (complete fresh start)
-- DELETE FROM profiles WHERE id IS NOT NULL;

-- Option 2: Keep specific admin users (replace with actual admin IDs)
-- DELETE FROM profiles WHERE email NOT IN ('admin@smartgrow.com', 'your-admin@email.com');

-- Option 3: Keep users with admin role (if you have role column)
-- DELETE FROM profiles WHERE role != 'admin' OR role IS NULL;

-- Step 4: Reset sequences (CORRECTED SEQUENCE NAMES)
-- ============================================
ALTER SEQUENCE IF EXISTS deposits_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS withdrawals_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS investments_id_seq RESTART WITH 1;  -- Corrected name
ALTER SEQUENCE IF EXISTS daily_incomes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS referrals_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS referral_commissions_id_seq RESTART WITH 1;

-- Step 5: Reset admin statistics (if admin_settings table exists)
-- ============================================
UPDATE admin_settings SET 
    total_users = 0,
    total_deposits = 0,
    total_withdrawals = 0,
    total_investments = 0,
    updated_at = NOW()
WHERE id = 1;

-- Step 6: Final verification
-- ============================================
SELECT 'Final verification - remaining records:' as status;

SELECT 'investments' as table_name, COUNT(*) as remaining FROM investments
UNION ALL
SELECT 'deposits', COUNT(*) FROM deposits
UNION ALL
SELECT 'withdrawals', COUNT(*) FROM withdrawals
UNION ALL
SELECT 'referrals', COUNT(*) FROM referrals
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles;

-- Show what should remain (investment plans and admin settings)
SELECT 'Investment plans (should remain):' as info;
SELECT id, name, duration_days, profit_percent FROM plans ORDER BY id;

SELECT 'Admin settings (should remain):' as info;  
SELECT * FROM admin_settings;
