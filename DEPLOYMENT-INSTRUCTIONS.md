# 🚀 Step-by-Step Deployment Instructions

## Overview
This guide walks you through deploying the critical locked earnings bug fix.

**Total Time:** ~10 minutes
**Difficulty:** Easy
**Risk Level:** Low (only updates functions, no data loss)

---

## Phase 1: Preparation (1 minute)

### 1.1 Backup Your Database
- Go to Supabase Dashboard → Project Settings → Backups
- Create a manual backup (optional but recommended)

### 1.2 Open SQL Editor
- Go to Supabase Dashboard
- Click "SQL Editor" in the left sidebar
- Click "New Query"

---

## Phase 2: Deploy the Fix (2 minutes)

### 2.1 Copy the Fix Script
1. Open file: `DEPLOY-LOCKED-EARNINGS-FIX.sql`
2. Select all content (Ctrl+A)
3. Copy (Ctrl+C)

### 2.2 Paste and Run
1. In Supabase SQL Editor, paste the script
2. Click "Run" button (or Ctrl+Enter)
3. Wait for completion

### 2.3 Verify Success
You should see output:
```
LOCKED EARNINGS BUG FIX DEPLOYED SUCCESSFULLY ✓
```

**If you see errors:**
- Check that you're in the correct database
- Ensure all required functions exist (increment_user_balance, etc.)
- Contact support if issues persist

---

## Phase 3: Analyze Affected Users (3 minutes)

### 3.1 Run Recovery Analysis
1. Open file: `RECOVER-AFFECTED-USERS.sql`
2. Copy all content
3. Paste in new SQL query in Supabase
4. Click "Run"

### 3.2 Review Results
The script will show:
- **Affected Users:** Users with multiple investments
- **Balance Analysis:** Current vs. expected balances
- **Missing Amounts:** How much each user is missing

### 3.3 Identify Users to Recover
Look for rows with:
- `status = 'MISSING LOCKED EARNINGS ⚠️'`
- `missing_earned_balance > 0`

Note down the user IDs and missing amounts.

---

## Phase 4: Manual Recovery (5 minutes per user)

### 4.1 For Each Affected User

**Step 1: Calculate Recovery Amount**
```
Recovery Amount = missing_earned_balance (from analysis)
```

**Step 2: Update User Balance**
```sql
UPDATE user_profiles 
SET balance = balance + [RECOVERY_AMOUNT]
WHERE id = '[USER_ID]';
```

**Example:**
```sql
UPDATE user_profiles 
SET balance = balance + 1200
WHERE id = '550e8400-e29b-41d4-a716-446655440000';
```

**Step 3: Verify Update**
```sql
SELECT id, full_name, balance, earned_balance 
FROM user_profiles 
WHERE id = '[USER_ID]';
```

### 4.2 Notify User
Send message to user:
```
Hi [User Name],

We identified and fixed a critical bug in our investment system that 
affected your account. We've restored [AMOUNT] PKR to your balance.

Your balance has been updated from [OLD] to [NEW] PKR.

Thank you for your patience!
```

---

## Phase 5: Testing (2 minutes)

### 5.1 Create Test Investments
1. Log in as a test user
2. Create a 3-day investment: 1,000 PKR
3. Create a 7-day investment: 4,000 PKR

### 5.2 Collect Income
1. Wait 24 hours (or adjust system time for testing)
2. Collect daily income from both investments
3. Verify both show earnings in locked balance

### 5.3 Complete First Investment
1. Wait for 3-day investment to complete
2. Collect final income
3. Verify:
   - ✅ 3-day investment marked as completed
   - ✅ 3-day capital returned to main balance
   - ✅ 3-day earnings transferred to main balance
   - ✅ 7-day earnings still in locked balance
   - ✅ 7-day investment still active

### 5.4 Complete Second Investment
1. Wait for 7-day investment to complete
2. Collect final income
3. Verify:
   - ✅ 7-day investment marked as completed
   - ✅ 7-day capital returned to main balance
   - ✅ 7-day earnings transferred to main balance
   - ✅ Locked balance is now 0

---

## Phase 6: Verification (1 minute)

### 6.1 Check Function Deployment
```sql
SELECT prosrc FROM pg_proc 
WHERE proname = 'collect_daily_income' 
LIMIT 1;
```

Should contain: `transfer_investment_earnings_to_main`

### 6.2 Check Helper Function
```sql
SELECT COUNT(*) FROM pg_proc 
WHERE proname = 'transfer_investment_earnings_to_main';
```

Should return: `1`

### 6.3 Monitor Production
- Watch for user complaints about investments
- Monitor locked earnings calculations
- Check that completed investments transfer correctly

---

## Rollback Plan (If Needed)

If something goes wrong, you can revert:

```sql
-- Revert to old version (from fix-income-transactions-recording.sql)
CREATE OR REPLACE FUNCTION collect_daily_income(investment_id_param INTEGER, user_id_param UUID)
RETURNS JSON AS $$
-- ... (copy content from fix-income-transactions-recording.sql)
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Then notify users of the issue.

---

## Troubleshooting

### Issue: "Function not found" error
**Solution:** Ensure all dependencies exist:
- `increment_user_balance()`
- `increment_earned_balance()`
- `process_earning_commissions()`
- `income_transactions` table

### Issue: "Permission denied" error
**Solution:** Ensure you're using a role with SECURITY DEFINER permissions

### Issue: Affected users not showing in recovery analysis
**Solution:** 
- Check if users have multiple investments
- Verify investments have different statuses (active + completed)
- Run analysis again with correct user IDs

### Issue: Recovery amounts don't match
**Solution:**
- Verify income_transactions table has all records
- Check that investment_id values are correct
- Manually calculate: sum of all income_transactions for user

---

## Success Checklist

- [ ] Backup created
- [ ] Fix deployed successfully
- [ ] Recovery analysis completed
- [ ] Affected users identified
- [ ] User balances recovered
- [ ] Users notified
- [ ] Test investments created
- [ ] Test investments completed
- [ ] All verifications passed
- [ ] Monitoring in place

---

## Support

**Questions?** Check:
- `LOCKED-EARNINGS-BUG-REPORT.md` - Detailed explanation
- `QUICK-FIX-GUIDE.md` - Quick reference
- `BUG-SUMMARY.txt` - Issue summary

**Still stuck?** Contact your database administrator.

---

## Timeline

| Phase | Task | Time | Status |
|-------|------|------|--------|
| 1 | Preparation | 1 min | ⏳ |
| 2 | Deploy Fix | 2 min | ⏳ |
| 3 | Analyze Users | 3 min | ⏳ |
| 4 | Manual Recovery | 5 min | ⏳ |
| 5 | Testing | 2 min | ⏳ |
| 6 | Verification | 1 min | ⏳ |
| **Total** | **All Phases** | **~14 min** | **Ready** |

---

**Status:** ✅ Ready to Deploy
**Priority:** 🔴 CRITICAL
**Estimated Completion:** 15 minutes
