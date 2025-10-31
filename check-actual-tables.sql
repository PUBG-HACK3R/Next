-- ============================================
-- CHECK ACTUAL SUPABASE TABLES
-- Run this FIRST to see what tables actually exist
-- ============================================

-- 1. List all your actual tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Count records in each table (if tables exist)
-- Run each SELECT separately to see which tables exist

-- Check if these tables exist:
SELECT 'investments' as table_name, COUNT(*) as records FROM investments;
SELECT 'plans' as table_name, COUNT(*) as records FROM plans;  
SELECT 'profiles' as table_name, COUNT(*) as records FROM profiles;
SELECT 'deposits' as table_name, COUNT(*) as records FROM deposits;
SELECT 'withdrawals' as table_name, COUNT(*) as records FROM withdrawals;
SELECT 'referrals' as table_name, COUNT(*) as records FROM referrals;
SELECT 'referral_commissions' as table_name, COUNT(*) as records FROM referral_commissions;
SELECT 'daily_incomes' as table_name, COUNT(*) as records FROM daily_incomes;
SELECT 'admin_settings' as table_name, COUNT(*) as records FROM admin_settings;

-- 3. Show table structure for main tables
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'investments' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
