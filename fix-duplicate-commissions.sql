-- ============================================================================
-- FIX DUPLICATE COMMISSIONS
-- ============================================================================
-- This script removes duplicate commission records that were created
-- when both the API and database trigger processed commissions simultaneously

-- Step 1: Identify duplicate commissions
SELECT 
  'DUPLICATE COMMISSIONS FOUND' AS info,
  deposit_id,
  referrer_id,
  referred_user_id,
  commission_type,
  level,
  COUNT(*) as duplicate_count,
  SUM(amount) as total_amount
FROM referral_commissions
WHERE commission_type = 'deposit' AND deposit_id IS NOT NULL
GROUP BY deposit_id, referrer_id, referred_user_id, commission_type, level
HAVING COUNT(*) > 1;

-- Step 2: For each duplicate, keep only the first one and delete the rest
-- This query shows which records will be deleted
SELECT 
  'RECORDS TO DELETE' AS info,
  id,
  deposit_id,
  referrer_id,
  level,
  amount,
  created_at
FROM referral_commissions rc1
WHERE commission_type = 'deposit' 
  AND deposit_id IS NOT NULL
  AND id NOT IN (
    -- Keep only the earliest record for each deposit+referrer+level combination
    SELECT MIN(id)
    FROM referral_commissions rc2
    WHERE rc2.commission_type = 'deposit'
      AND rc2.deposit_id = rc1.deposit_id
      AND rc2.referrer_id = rc1.referrer_id
      AND rc2.level = rc1.level
  )
ORDER BY deposit_id, created_at;

-- Step 3: Delete duplicate commissions (UNCOMMENT TO EXECUTE)
-- DELETE FROM referral_commissions
-- WHERE commission_type = 'deposit' 
--   AND deposit_id IS NOT NULL
--   AND id NOT IN (
--     SELECT MIN(id)
--     FROM referral_commissions rc2
--     WHERE rc2.commission_type = 'deposit'
--       AND rc2.deposit_id = referral_commissions.deposit_id
--       AND rc2.referrer_id = referral_commissions.referrer_id
--       AND rc2.level = referral_commissions.level
--   );

-- Step 4: Verify duplicates are removed
SELECT 
  'VERIFICATION' AS info,
  deposit_id,
  referrer_id,
  referred_user_id,
  commission_type,
  level,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM referral_commissions
WHERE commission_type = 'deposit' AND deposit_id IS NOT NULL
GROUP BY deposit_id, referrer_id, referred_user_id, commission_type, level
HAVING COUNT(*) > 1;

-- Step 5: Recalculate and fix user balances if needed
-- This shows the total commission each user should have received
SELECT 
  'COMMISSION TOTALS BY REFERRER' AS info,
  referrer_id,
  SUM(CASE WHEN commission_type = 'deposit' THEN amount ELSE 0 END) as deposit_commissions,
  SUM(CASE WHEN commission_type = 'earning' THEN amount ELSE 0 END) as earning_commissions,
  SUM(amount) as total_commissions
FROM referral_commissions
GROUP BY referrer_id
ORDER BY total_commissions DESC;
