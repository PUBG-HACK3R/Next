-- ============================================================================
-- RECOVERY SCRIPT: Fix balances for users affected by locked earnings bug
-- ============================================================================
--
-- This script identifies and fixes users who lost capital/earnings due to 
-- the bug where ALL locked earnings were transferred when one investment completed.
--
-- IMPORTANT: Review the findings first, then uncomment DELETE/UPDATE statements
-- ============================================================================

-- ============================================================================
-- STEP 1: IDENTIFY AFFECTED USERS
-- ============================================================================
-- Users who had multiple active investments and one completed

SELECT 'STEP 1: Identifying affected users' AS step;

-- Find users with completed investments and check their balance history
CREATE TEMPORARY TABLE affected_users AS
SELECT DISTINCT 
  u.id,
  u.full_name,
  u.email,
  u.balance,
  u.earned_balance,
  COUNT(DISTINCT i.id) as total_investments,
  SUM(CASE WHEN i.status = 'active' THEN 1 ELSE 0 END) as active_investments,
  SUM(CASE WHEN i.status = 'completed' THEN 1 ELSE 0 END) as completed_investments
FROM user_profiles u
LEFT JOIN investments i ON u.id = i.user_id
GROUP BY u.id, u.full_name, u.email, u.balance, u.earned_balance
HAVING COUNT(DISTINCT i.id) > 1 
  AND SUM(CASE WHEN i.status = 'completed' THEN 1 ELSE 0 END) > 0
  AND SUM(CASE WHEN i.status = 'active' THEN 1 ELSE 0 END) > 0;

SELECT * FROM affected_users;

-- ============================================================================
-- STEP 2: ANALYZE BALANCE DISCREPANCIES
-- ============================================================================

SELECT 'STEP 2: Analyzing balance discrepancies' AS step;

-- For each affected user, calculate what their balance SHOULD be
CREATE TEMPORARY TABLE balance_analysis AS
SELECT 
  u.id,
  u.full_name,
  u.balance as current_balance,
  u.earned_balance as current_earned_balance,
  
  -- Calculate expected earned balance from active investments
  COALESCE(SUM(CASE 
    WHEN i.status = 'active' THEN 
      (SELECT COALESCE(SUM(amount), 0) 
       FROM income_transactions 
       WHERE user_id = u.id 
         AND investment_id = i.id 
         AND status = 'completed')
    ELSE 0
  END), 0) as expected_earned_balance,
  
  -- Calculate total earnings from all completed investments
  COALESCE(SUM(CASE 
    WHEN i.status = 'completed' THEN 
      (SELECT COALESCE(SUM(amount), 0) 
       FROM income_transactions 
       WHERE user_id = u.id 
         AND investment_id = i.id 
         AND status = 'completed')
    ELSE 0
  END), 0) as completed_investment_earnings,
  
  -- Calculate total capital from completed investments
  COALESCE(SUM(CASE 
    WHEN i.status = 'completed' AND p.capital_return THEN i.amount_invested
    ELSE 0
  END), 0) as returned_capital
  
FROM affected_users u
LEFT JOIN investments i ON u.id = i.user_id
LEFT JOIN plans p ON i.plan_id = p.id
GROUP BY u.id, u.full_name, u.balance, u.earned_balance;

SELECT 
  id,
  full_name,
  current_balance,
  current_earned_balance,
  expected_earned_balance,
  completed_investment_earnings,
  returned_capital,
  CASE 
    WHEN current_earned_balance < expected_earned_balance THEN 'MISSING LOCKED EARNINGS ⚠️'
    ELSE 'BALANCE OK ✓'
  END as status
FROM balance_analysis;

-- ============================================================================
-- STEP 3: DETAILED TRANSACTION ANALYSIS
-- ============================================================================

SELECT 'STEP 3: Detailed transaction analysis per user' AS step;

-- Show detailed breakdown for each affected user
SELECT 
  u.id,
  u.full_name,
  i.id as investment_id,
  i.status,
  i.amount_invested,
  p.name as plan_name,
  p.duration_days,
  p.profit_percent,
  p.capital_return,
  COALESCE(SUM(it.amount), 0) as total_earnings_from_investment,
  CASE 
    WHEN i.status = 'completed' AND p.capital_return 
    THEN i.amount_invested + COALESCE(SUM(it.amount), 0)
    WHEN i.status = 'completed' 
    THEN COALESCE(SUM(it.amount), 0)
    ELSE COALESCE(SUM(it.amount), 0)
  END as expected_transfer_amount
FROM affected_users u
JOIN investments i ON u.id = i.user_id
JOIN plans p ON i.plan_id = p.id
LEFT JOIN income_transactions it ON u.id = it.user_id AND i.id = it.investment_id AND it.status = 'completed'
GROUP BY u.id, u.full_name, i.id, i.status, i.amount_invested, p.name, p.duration_days, p.profit_percent, p.capital_return
ORDER BY u.id, i.id;

-- ============================================================================
-- STEP 4: RECOVERY RECOMMENDATIONS
-- ============================================================================

SELECT 'STEP 4: Recovery recommendations' AS step;

-- For users with missing earned balance, calculate recovery amount
SELECT 
  ba.id,
  ba.full_name,
  ba.current_earned_balance,
  ba.expected_earned_balance,
  (ba.expected_earned_balance - ba.current_earned_balance) as missing_earned_balance,
  'MANUAL REVIEW REQUIRED' as action
FROM balance_analysis ba
WHERE ba.current_earned_balance < ba.expected_earned_balance;

-- ============================================================================
-- STEP 5: MANUAL RECOVERY (UNCOMMENT AFTER REVIEW)
-- ============================================================================
-- 
-- Only uncomment and run these after reviewing the analysis above
-- and confirming the amounts are correct.
--
-- Option A: Restore earned balance for users with active investments
-- UPDATE user_profiles 
-- SET earned_balance = (
--   SELECT COALESCE(SUM(amount), 0)
--   FROM income_transactions it
--   JOIN investments i ON it.investment_id = i.id
--   WHERE it.user_id = user_profiles.id
--     AND i.status = 'active'
--     AND it.status = 'completed'
-- )
-- WHERE id IN (SELECT id FROM affected_users);
--
-- Option B: Add missing capital back to balance for completed investments
-- UPDATE user_profiles
-- SET balance = balance + (
--   SELECT COALESCE(SUM(CASE 
--     WHEN p.capital_return THEN i.amount_invested
--     ELSE 0
--   END), 0)
--   FROM investments i
--   JOIN plans p ON i.plan_id = p.id
--   WHERE i.user_id = user_profiles.id
--     AND i.status = 'completed'
-- )
-- WHERE id IN (SELECT id FROM affected_users);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'RECOVERY ANALYSIS COMPLETE' AS status;
SELECT 'Review the results above and contact support for manual recovery if needed' AS next_step;
