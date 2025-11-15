# Pre-Launch Testing Checklist

## Step 1: Apply the Final Fix
✅ Run `fix-double-counting-final.sql` in Supabase SQL Editor

## Step 2: Test Investment Flow

### Test Case 1: Single Investment - Collect All at Once
1. Deposit: 1,000 PKR
2. Buy 7-day plan (14% ROI)
3. Wait 7 days (or simulate)
4. Collect all 7 days at once
5. **Expected Result**: 1,000 capital + 140 profit = **1,140 PKR**
6. **Check**: Balance should be exactly 1,140 PKR

### Test Case 2: Single Investment - Daily Collections
1. Deposit: 1,000 PKR
2. Buy 7-day plan (14% ROI)
3. Collect day 1: +20 PKR → Earned Balance (locked)
4. Collect day 2: +20 PKR → Earned Balance (locked)
5. Collect day 3: +20 PKR → Earned Balance (locked)
6. Final collection (days 4-7): +80 PKR + 1,000 capital
7. **Expected Result**: 1,000 capital + 140 profit = **1,140 PKR**
8. **Check**: Balance should be exactly 1,140 PKR (not 1,200!)

### Test Case 3: Multiple Investments
1. Deposit: 3,000 PKR
2. Buy Investment A: 1,000 PKR (7-day, 14% ROI)
3. Buy Investment B: 2,000 PKR (7-day, 14% ROI)
4. Collect from A (days 1-3): 60 PKR → Earned Balance
5. Collect from B (days 1-2): 80 PKR → Earned Balance
6. Complete Investment A: Should get 1,000 + 140 = 1,140 PKR
7. **Check**: Earned Balance should still have 80 PKR from Investment B
8. Complete Investment B: Should get 2,000 + 280 = 2,280 PKR
9. **Final Balance**: 1,140 + 2,280 = 3,420 PKR ✅

## Step 3: Test Referral System
1. User A refers User B
2. User B deposits 1,000 PKR
3. **Check**: User A gets L1 commission
4. User B completes investment
5. **Check**: User A gets earning-based commission

## Step 4: Test Withdrawal
1. Complete an investment
2. Request withdrawal
3. **Check**: Withdrawal amount deducted correctly
4. **Check**: Fees calculated properly

## Step 5: Verify All Calculations

Run this SQL to verify:
```sql
-- Check for any balance discrepancies
SELECT 
  u.id,
  u.full_name,
  u.balance,
  u.earned_balance,
  COALESCE(d.total_deposits, 0) as total_deposits,
  COALESCE(w.total_withdrawals, 0) as total_withdrawals,
  COALESCE(i.completed_capital, 0) as completed_capital,
  COALESCE(inc.total_income, 0) as total_income,
  -- Expected balance calculation
  COALESCE(d.total_deposits, 0) 
  - COALESCE(w.total_withdrawals, 0) 
  + COALESCE(inc.total_income, 0) 
  + COALESCE(i.completed_capital, 0) as expected_balance,
  -- Difference
  u.balance - (
    COALESCE(d.total_deposits, 0) 
    - COALESCE(w.total_withdrawals, 0) 
    + COALESCE(inc.total_income, 0) 
    + COALESCE(i.completed_capital, 0)
  ) as difference
FROM user_profiles u
LEFT JOIN (
  SELECT user_id, SUM(amount_pkr) as total_deposits
  FROM deposits WHERE status = 'approved'
  GROUP BY user_id
) d ON u.id = d.user_id
LEFT JOIN (
  SELECT user_id, SUM(amount) as total_withdrawals
  FROM withdrawals WHERE status = 'approved'
  GROUP BY user_id
) w ON u.id = w.user_id
LEFT JOIN (
  SELECT user_id, SUM(amount_invested) as completed_capital
  FROM investments WHERE status = 'completed'
  GROUP BY user_id
) i ON u.id = i.user_id
LEFT JOIN (
  SELECT user_id, SUM(amount) as total_income
  FROM income_transactions WHERE status = 'completed'
  GROUP BY user_id
) inc ON u.id = inc.user_id
WHERE u.balance > 0 OR u.earned_balance > 0
ORDER BY difference DESC;
```

## ✅ All Tests Must Pass Before Launch

If any test fails, DO NOT launch. Fix the issue first.

## Step 6: Clean Database for Launch

**ONLY run this after ALL tests pass:**

```sql
-- ⚠️ WARNING: This will delete ALL test data!
-- Make sure you're ready to launch before running this

BEGIN;

-- 1. Delete all test transactions
DELETE FROM income_transactions;
DELETE FROM referral_commissions;
DELETE FROM withdrawals;
DELETE FROM deposits;
DELETE FROM investments;

-- 2. Reset all user balances (except admin)
UPDATE user_profiles 
SET balance = 0, 
    earned_balance = 0,
    updated_at = NOW()
WHERE user_level < 999;

-- 3. Optional: Delete test users (keep admin)
-- DELETE FROM user_profiles WHERE user_level < 999;

-- 4. Reset any counters or sequences if needed
-- ALTER SEQUENCE investments_id_seq RESTART WITH 1;
-- ALTER SEQUENCE deposits_id_seq RESTART WITH 1;
-- ALTER SEQUENCE withdrawals_id_seq RESTART WITH 1;

COMMIT;

-- Verify clean state
SELECT 'Database cleaned successfully' as status;
SELECT COUNT(*) as remaining_users FROM user_profiles;
SELECT COUNT(*) as remaining_investments FROM investments;
SELECT COUNT(*) as remaining_deposits FROM deposits;
```

## Step 7: Final Pre-Launch Checklist

- [ ] All test cases passed
- [ ] No balance discrepancies found
- [ ] Referral system working correctly
- [ ] Withdrawal system working correctly
- [ ] Admin panel accessible and functional
- [ ] Password management working
- [ ] Database cleaned (test data removed)
- [ ] Environment variables configured
- [ ] SUPABASE_SERVICE_ROLE_KEY set
- [ ] All SQL fixes applied
- [ ] Mobile responsive design tested
- [ ] Performance optimizations applied

## 🚀 Ready to Launch!

Once all checkboxes are ticked, you're ready to launch to real users!
