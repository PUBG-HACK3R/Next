-- Test the new earning-based commission system

-- Step 1: Check current commission settings
SELECT 
  referral_l1_percent,
  referral_l2_percent, 
  referral_l3_percent
FROM admin_settings 
WHERE id = 1;

-- Step 2: Check the referral chain (make sure we have 4 levels)
-- Replace with actual user IDs from your test accounts
SELECT 
  id,
  full_name,
  referred_by,
  referral_code
FROM user_profiles 
WHERE full_name IN ('test1', 'test2', 'test3', 'test4')
ORDER BY created_at;

-- Step 3: After approving a deposit, check all commissions created
SELECT 
  rc.*,
  up.full_name as referrer_name,
  up2.full_name as referred_user_name
FROM referral_commissions rc
LEFT JOIN user_profiles up ON rc.referrer_id = up.id
LEFT JOIN user_profiles up2 ON rc.referred_user_id = up2.id
ORDER BY rc.created_at DESC
LIMIT 10;

-- Step 4: Check balance updates
SELECT 
  id,
  full_name,
  balance
FROM user_profiles 
WHERE full_name IN ('test1', 'test2', 'test3', 'test4')
ORDER BY full_name;

-- Expected results for 1000 PKR deposit by test4:
-- test3 (L1): +50 PKR (5% of 1000) + balance increase
-- test2 (L2): +1.5 PKR (3% of 50) + balance increase  
-- test1 (L3): +0.03 PKR (2% of 1.5) + balance increase
