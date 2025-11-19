# 🚨 CRITICAL BUG FIX: Locked Earnings Transfer Issue

## Problem Summary

**Severity:** 🔴 CRITICAL - Affects user capital and earnings

When an investment plan completes, the system is transferring **ALL locked earnings from ALL investments**, not just the completed plan. This causes users to lose capital and earnings from their other active investments.

## Real-World Example (From Your Report)

**User purchased:**
- Plan 1: 1,000 PKR (3-day plan)
- Plan 2: 4,000 PKR (7-day plan)

**What should happen:**
- Day 1-3: Collect daily income from Plan 1 → stored in locked earnings
- Day 1-7: Collect daily income from Plan 2 → stored in locked earnings
- Day 3: Plan 1 completes → Transfer only Plan 1 earnings + capital to main balance
- Day 7: Plan 2 completes → Transfer only Plan 2 earnings + capital to main balance

**What actually happened (BUG):**
- Day 1-3: Collect daily income from both plans → stored in locked earnings
- Day 3: Plan 1 completes → **Transfer ALL locked earnings from BOTH plans** ❌
- Result: User loses Plan 2 capital + earnings, Plan 2 shows as completed but no funds received

## Root Cause

**File:** `fix-income-transactions-recording.sql` (Line 90)

```sql
IF is_final_collection THEN
    -- Final collection: Add profit + capital to main balance
    IF investment_record.capital_return THEN
      PERFORM increment_user_balance(user_id_param, total_profit + investment_record.amount_invested);
    ELSE
      PERFORM increment_user_balance(user_id_param, total_profit);
    END IF;
    
    -- ❌ BUG: Transfers ALL earned_balance, not just this investment's earnings
    PERFORM transfer_earned_to_main(user_id_param);
```

The `transfer_earned_to_main()` function:
```sql
UPDATE user_profiles 
SET balance = balance + earned_balance,
    earned_balance = 0  -- ❌ Resets ALL earned balance to 0
WHERE id = user_id;
```

## Solution

**New Function:** `transfer_investment_earnings_to_main(user_id, investment_id)`

This function:
1. Calculates earnings **only from the specific completed investment**
2. Transfers only those earnings to main balance
3. Keeps earnings from other active investments locked

```sql
CREATE OR REPLACE FUNCTION transfer_investment_earnings_to_main(
  user_id_param UUID, 
  investment_id_param INTEGER
)
RETURNS DECIMAL AS $$
DECLARE
  total_investment_earnings DECIMAL := 0;
BEGIN
  -- Calculate total earnings from THIS SPECIFIC investment only
  SELECT COALESCE(SUM(amount), 0) INTO total_investment_earnings
  FROM income_transactions 
  WHERE user_id = user_id_param 
    AND investment_id = investment_id_param  -- ✅ Only this investment
    AND status = 'completed';
  
  IF total_investment_earnings > 0 THEN
    -- Add investment earnings to main balance
    UPDATE user_profiles 
    SET balance = balance + total_investment_earnings,
        updated_at = NOW()
    WHERE id = user_id_param;
    
    -- Subtract only THIS investment's earnings from earned_balance
    UPDATE user_profiles 
    SET earned_balance = GREATEST(0, earned_balance - total_investment_earnings),
        updated_at = NOW()
    WHERE id = user_id_param;
  END IF;
  
  RETURN total_investment_earnings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Deployment Steps

### Step 1: Deploy the Fix
Run `DEPLOY-LOCKED-EARNINGS-FIX.sql` in your Supabase SQL editor:
- Creates the new helper function
- Updates `collect_daily_income()` to use the fix
- Verifies the deployment

### Step 2: Identify Affected Users
Run `RECOVER-AFFECTED-USERS.sql` to:
- Find users with multiple investments where one completed
- Analyze balance discrepancies
- Generate recovery recommendations

### Step 3: Manual Recovery (If Needed)
For users who lost funds:
1. Review the analysis from Step 2
2. Manually restore their earned balance and capital
3. Notify them of the correction

## How It Works After Fix

**Scenario:** User with 3-day and 7-day plans

```
Timeline:
Day 1: User collects 100 PKR from 3-day plan
       → earned_balance = 100 PKR (from 3-day)
       
Day 1: User collects 500 PKR from 7-day plan
       → earned_balance = 600 PKR (100 from 3-day + 500 from 7-day)

Day 3: 3-day plan completes, user collects final 100 PKR
       → transfer_investment_earnings_to_main(user_id, investment_id=3day)
       → Only transfers 200 PKR (3-day earnings)
       → balance = balance + 200 + 1000 (capital)
       → earned_balance = 400 PKR (only 7-day earnings remain)

Day 7: 7-day plan completes, user collects final 500 PKR
       → transfer_investment_earnings_to_main(user_id, investment_id=7day)
       → Only transfers 3500 PKR (7-day earnings)
       → balance = balance + 3500 + 4000 (capital)
       → earned_balance = 0 PKR (all collected)
```

## Files Modified

1. **DEPLOY-LOCKED-EARNINGS-FIX.sql** - Deployment script with fix
2. **RECOVER-AFFECTED-USERS.sql** - Recovery analysis script
3. **collect_daily_income()** function - Updated to use new helper function

## Testing Checklist

- [ ] Deploy fix to production database
- [ ] Run recovery analysis to identify affected users
- [ ] Test with new investments (3-day + 7-day plans)
- [ ] Verify locked earnings remain intact when one plan completes
- [ ] Verify capital is returned correctly
- [ ] Verify balance calculations are accurate
- [ ] Notify affected users of correction

## Impact

**Before Fix:**
- ❌ Users lose capital and earnings from active investments
- ❌ Completed plans show but funds not received
- ❌ Major trust issue for real users

**After Fix:**
- ✅ Only completed investment earnings transferred
- ✅ Other active investments remain locked
- ✅ Capital returned correctly
- ✅ User trust restored

## Status

- **Issue Identified:** ✅
- **Solution Created:** ✅
- **Deployment Script Ready:** ✅
- **Recovery Script Ready:** ✅
- **Pending:** Database deployment and user recovery

---

**Priority:** 🔴 CRITICAL - Deploy immediately to prevent further user losses
