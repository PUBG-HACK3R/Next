-- Debug commission processing step by step

-- 1. Check the exact user_profiles structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('id', 'referred_by');

-- 2. Test the referral lookup that the code does
SELECT 
  id,
  full_name,
  referred_by
FROM user_profiles 
WHERE id = '146bc3aa-7a23-4c78-95eb-981d2da8f7b9'; -- test2's ID

-- 3. Check if test1 exists in user_profiles
SELECT 
  id,
  full_name
FROM user_profiles 
WHERE id = 'ff317889-de03-4a28-b91c-a9dab1166435'; -- test1's ID

-- 4. Test the commission calculation manually
SELECT 
  '146bc3aa-7a23-4c78-95eb-981d2da8f7b9' as user_id,
  'ff317889-de03-4a28-b91c-a9dab1166435' as referrer_id,
  12 as deposit_id,
  (1000.00 * 5) / 100 as commission_amount,
  1 as commission_level,
  5 as commission_percent;
