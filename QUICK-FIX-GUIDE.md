# 🚀 Quick Fix Deployment Guide

## The Issue (30 seconds)
When a user's investment completes, **ALL locked earnings from ALL investments** are transferred, not just that investment's earnings. Users lose capital and earnings.

## The Fix (2 minutes)

### 1. Go to Supabase Dashboard
- Open your Supabase project
- Go to SQL Editor

### 2. Copy and Run the Fix
Copy the entire content of `DEPLOY-LOCKED-EARNINGS-FIX.sql` and run it.

**What it does:**
- Creates new function: `transfer_investment_earnings_to_main(user_id, investment_id)`
- Updates `collect_daily_income()` to use the new function
- Verifies the deployment

### 3. Verify Success
You should see:
```
LOCKED EARNINGS BUG FIX DEPLOYED SUCCESSFULLY ✓
```

## Recovery (5 minutes)

### 1. Identify Affected Users
Copy and run `RECOVER-AFFECTED-USERS.sql`

**What it shows:**
- Users with multiple investments
- Balance discrepancies
- Missing earnings/capital

### 2. Review Results
- Look for "MISSING LOCKED EARNINGS ⚠️" status
- Check the amounts in "missing_earned_balance" column

### 3. Manual Recovery (If Needed)
For each affected user:
1. Calculate missing amount from the analysis
2. Manually add it back to their balance
3. Send them a message explaining the correction

**Example Recovery Query:**
```sql
UPDATE user_profiles 
SET balance = balance + 1200  -- Add missing amount
WHERE id = 'user-uuid-here';
```

## Testing (1 minute)

### Create a Test Investment
1. Create a 3-day plan investment: 1,000 PKR
2. Create a 7-day plan investment: 4,000 PKR
3. Collect daily income from both
4. Complete the 3-day plan

### Verify
- ✅ 3-day earnings transferred to main balance
- ✅ 3-day capital returned
- ✅ 7-day earnings remain in locked balance
- ✅ 7-day capital still locked

## Rollback (If Needed)

If something goes wrong, revert to the old function:

```sql
-- Revert to old (buggy) version
CREATE OR REPLACE FUNCTION collect_daily_income(investment_id_param INTEGER, user_id_param UUID)
RETURNS JSON AS $$
-- ... (use content from fix-income-transactions-recording.sql)
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Support

**Questions?** Check:
- `LOCKED-EARNINGS-BUG-REPORT.md` - Detailed explanation
- `DEPLOY-LOCKED-EARNINGS-FIX.sql` - Full deployment script
- `RECOVER-AFFECTED-USERS.sql` - Recovery analysis

---

**Time to Deploy:** ~5 minutes
**Time to Verify:** ~2 minutes
**Total:** ~7 minutes

**Status:** Ready to deploy 🟢
