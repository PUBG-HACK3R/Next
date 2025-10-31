-- ============================================
-- SMARTGROW PLATFORM - DATABASE CLEANUP SCRIPT
-- FOR FRESH USER LAUNCH
-- ============================================
-- ⚠️  WARNING: This will delete ALL user data!
-- Only run this for a fresh production launch
-- ============================================

-- Step 1: Disable foreign key constraints temporarily
SET session_replication_role = replica;

-- Step 2: Clear all user-generated data (keep structure and admin settings)
-- ============================================

-- Clear user investments and related data
DELETE FROM user_investments WHERE id > 0;
DELETE FROM daily_incomes WHERE id > 0;

-- Clear user financial transactions
DELETE FROM deposits WHERE id > 0;
DELETE FROM withdrawals WHERE id > 0;

-- Clear user referral data
DELETE FROM referrals WHERE id > 0;
DELETE FROM referral_commissions WHERE id > 0;

-- Clear user profiles (keep admin users if needed)
-- Option 1: Delete ALL users (complete fresh start)
DELETE FROM profiles WHERE id != 'your-admin-user-id-here';

-- Option 2: Keep admin users only (replace with actual admin emails)
-- DELETE FROM profiles WHERE email NOT IN ('admin@smartgrow.com', 'support@smartgrow.com');

-- Clear auth users from Supabase Auth (this needs to be done via Supabase dashboard)
-- Go to Authentication > Users and delete all non-admin users

-- Step 3: Reset sequences and auto-increment counters
-- ============================================
ALTER SEQUENCE IF EXISTS deposits_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS withdrawals_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS user_investments_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS daily_incomes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS referrals_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS referral_commissions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS investment_plans_id_seq RESTART WITH 1;

-- Step 4: Keep essential data (investment plans, admin settings)
-- ============================================
-- Investment plans should remain (these are your product offerings)
-- Admin settings should remain (platform configuration)
-- You may want to reset some admin settings to default values:

UPDATE admin_settings SET 
    total_users = 0,
    total_deposits = 0,
    total_withdrawals = 0,
    total_investments = 0
WHERE id = 1;

-- Step 5: Clear storage buckets (run these in Supabase dashboard)
-- ============================================
-- Go to Storage and clear these buckets:
-- - deposit_proofs (all user uploaded files)
-- - withdrawal_proofs (if exists)
-- - profile_images (if exists)

-- Step 6: Re-enable foreign key constraints
SET session_replication_role = DEFAULT;

-- Step 7: Verify cleanup
-- ============================================
SELECT 'deposits' as table_name, COUNT(*) as remaining_records FROM deposits
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
SELECT 'profiles', COUNT(*) FROM profiles;

-- ============================================
-- POST-CLEANUP CHECKLIST
-- ============================================
/*
After running this script:

1. ✅ Verify all user data is cleared
2. ✅ Check that investment plans are still intact
3. ✅ Confirm admin settings are preserved
4. ✅ Test user registration works
5. ✅ Test investment flow works
6. ✅ Clear Supabase Auth users manually
7. ✅ Clear Storage buckets manually
8. ✅ Update any hardcoded admin user IDs
9. ✅ Test admin panel functionality
10. ✅ Backup this clean database state

MANUAL TASKS (do in Supabase Dashboard):
- Authentication > Users: Delete all non-admin users
- Storage: Empty all buckets (deposit_proofs, etc.)
- Check RLS policies are still active
- Verify API keys and environment variables
*/

-- ============================================
-- OPTIONAL: Reset specific admin settings
-- ============================================
/*
UPDATE admin_settings SET 
    min_deposit_amount = 100,
    min_withdrawal_amount = 100,
    withdrawal_fee_percent = 3,
    referral_l1_percent = 5,
    referral_l2_percent = 2,
    referral_l3_percent = 1,
    whatsapp_support_number = '+1234567890',
    whatsapp_group_link = 'https://chat.whatsapp.com/your-group-link'
WHERE id = 1;
*/
