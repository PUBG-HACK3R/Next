-- Check current admin settings for commission rates
SELECT 
  referral_l1_percent,
  referral_l2_percent, 
  referral_l3_percent,
  min_deposit_amount
FROM admin_settings 
WHERE id = 1;

-- Check if there are any existing referral commissions
SELECT 
  rc.*,
  up.full_name as referrer_name
FROM referral_commissions rc
LEFT JOIN user_profiles up ON rc.referrer_id = up.id
ORDER BY rc.created_at DESC
LIMIT 10;

-- Check user referral relationships
SELECT 
  id,
  full_name,
  referral_code,
  referred_by,
  created_at
FROM user_profiles 
ORDER BY created_at DESC
LIMIT 5;
