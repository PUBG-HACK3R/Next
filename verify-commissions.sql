-- ============================================================================
-- VERIFY REFERRAL COMMISSION SYSTEM
-- ============================================================================

-- Step 1: Check current commission rates
SELECT 
  'COMMISSION RATES' AS section,
  referral_l1_deposit_percent AS "L1 Deposit %",
  referral_l1_percent AS "L1 Earning %",
  referral_l2_percent AS "L2 Earning %",
  referral_l3_percent AS "L3 Earning %"
FROM admin_settings
WHERE id = 1;

-- Step 2: Count commissions by type and level
SELECT 
  'COMMISSION SUMMARY' AS section,
  commission_type,
  level,
  COUNT(*) as count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount
FROM referral_commissions
GROUP BY commission_type, level
ORDER BY commission_type, level;

-- Step 3: Recent deposit commissions (should be L1 only)
SELECT 
  'RECENT DEPOSIT COMMISSIONS' AS section,
  id,
  level,
  amount,
  commission_rate,
  created_at
FROM referral_commissions
WHERE commission_type = 'deposit'
ORDER BY created_at DESC
LIMIT 10;

-- Step 4: Recent earning commissions (should be L1, L2, L3)
SELECT 
  'RECENT EARNING COMMISSIONS' AS section,
  id,
  level,
  amount,
  commission_rate,
  created_at
FROM referral_commissions
WHERE commission_type = 'earning'
ORDER BY created_at DESC
LIMIT 10;

-- Step 5: Verify L2 and L3 have NO deposit commissions
SELECT 
  'VERIFICATION: L2/L3 Deposit Commissions (should be 0)' AS section,
  COUNT(*) as count
FROM referral_commissions
WHERE commission_type = 'deposit' AND level IN (2, 3);

-- Step 6: Verify all levels have earning commissions
SELECT 
  'VERIFICATION: Earning Commissions by Level' AS section,
  level,
  COUNT(*) as count,
  SUM(amount) as total
FROM referral_commissions
WHERE commission_type = 'earning'
GROUP BY level
ORDER BY level;

-- Step 7: User balances (should include commissions)
SELECT 
  'TOP USERS BY BALANCE' AS section,
  full_name,
  email,
  balance,
  user_level
FROM user_profiles
ORDER BY balance DESC
LIMIT 10;
