# ✅ Deployment Checklist

## Pre-Deployment

- [ ] Read `FIX-SUMMARY-FOR-USER.md` to understand the issue
- [ ] Read `LOCKED-EARNINGS-BUG-REPORT.md` for technical details
- [ ] Create database backup (optional but recommended)
- [ ] Notify team about upcoming deployment
- [ ] Schedule maintenance window if needed

## Deployment Phase

### Step 1: Deploy the Fix
- [ ] Open Supabase SQL Editor
- [ ] Copy content from `DEPLOY-LOCKED-EARNINGS-FIX.sql`
- [ ] Paste into SQL Editor
- [ ] Run the script
- [ ] Verify success message: `LOCKED EARNINGS BUG FIX DEPLOYED SUCCESSFULLY ✓`
- [ ] Check for any errors in output

### Step 2: Verify Functions Created
- [ ] Run verification query to check `transfer_investment_earnings_to_main` exists
- [ ] Run verification query to check `collect_daily_income` updated
- [ ] Confirm both functions show in pg_proc

## Recovery Phase

### Step 3: Analyze Affected Users
- [ ] Copy content from `RECOVER-AFFECTED-USERS.sql`
- [ ] Paste into new SQL query
- [ ] Run the analysis script
- [ ] Review "Affected Users" results
- [ ] Review "Balance Analysis" results
- [ ] Identify users with "MISSING LOCKED EARNINGS ⚠️"
- [ ] Note down user IDs and missing amounts
- [ ] Export results for record keeping

### Step 4: Manual Recovery
For each affected user:
- [ ] Calculate recovery amount from analysis
- [ ] Prepare UPDATE query
- [ ] Execute UPDATE query
- [ ] Verify update with SELECT query
- [ ] Document recovery in spreadsheet
- [ ] Prepare notification message

### Step 5: Notify Users
For each recovered user:
- [ ] Send notification message
- [ ] Include recovered amount
- [ ] Include apology for inconvenience
- [ ] Provide support contact info
- [ ] Request confirmation of receipt

## Testing Phase

### Step 6: Create Test Investments
- [ ] Log in as test user
- [ ] Create 3-day investment: 1,000 PKR
- [ ] Create 7-day investment: 4,000 PKR
- [ ] Verify both investments created successfully

### Step 7: Test Daily Income Collection
- [ ] Wait 24 hours (or adjust system time)
- [ ] Collect income from 3-day investment
- [ ] Verify amount in locked balance
- [ ] Collect income from 7-day investment
- [ ] Verify total in locked balance
- [ ] Check both amounts are separate

### Step 8: Test First Investment Completion
- [ ] Wait for 3-day investment to complete
- [ ] Collect final income
- [ ] Verify 3-day marked as "completed"
- [ ] Verify 3-day capital returned to main balance
- [ ] Verify 3-day earnings transferred to main balance
- [ ] Verify 7-day earnings still in locked balance
- [ ] Verify 7-day still marked as "active"

### Step 9: Test Second Investment Completion
- [ ] Wait for 7-day investment to complete
- [ ] Collect final income
- [ ] Verify 7-day marked as "completed"
- [ ] Verify 7-day capital returned to main balance
- [ ] Verify 7-day earnings transferred to main balance
- [ ] Verify locked balance is now 0
- [ ] Verify all funds accounted for

## Verification Phase

### Step 10: Final Verification
- [ ] Check function deployment with query
- [ ] Verify helper function exists
- [ ] Monitor production for errors
- [ ] Check user complaints/support tickets
- [ ] Verify no new investment issues reported

### Step 11: Documentation
- [ ] Document deployment date and time
- [ ] Document affected users and recovery amounts
- [ ] Document test results
- [ ] Create incident report
- [ ] Archive all deployment scripts

## Post-Deployment

### Step 12: Monitoring
- [ ] Monitor investment completions for 24 hours
- [ ] Check locked earnings calculations
- [ ] Verify capital returns
- [ ] Watch for user complaints
- [ ] Check error logs for issues

### Step 13: Communication
- [ ] Update status page if applicable
- [ ] Notify team of successful deployment
- [ ] Send summary report to management
- [ ] Thank team for their work

## Rollback Plan (If Needed)

- [ ] Have rollback script ready
- [ ] Test rollback in staging (if available)
- [ ] Document rollback procedure
- [ ] Notify team of rollback if executed
- [ ] Investigate root cause of failure
- [ ] Plan redeployment

## Sign-Off

- [ ] Deployment completed successfully
- [ ] All tests passed
- [ ] All affected users recovered
- [ ] No critical issues found
- [ ] Ready for production monitoring

---

## Timeline

| Phase | Task | Time | Completed |
|-------|------|------|-----------|
| Pre | Preparation | 5 min | ☐ |
| Deploy | Deploy Fix | 2 min | ☐ |
| Deploy | Verify Functions | 1 min | ☐ |
| Recovery | Analyze Users | 3 min | ☐ |
| Recovery | Manual Recovery | 30 min | ☐ |
| Recovery | Notify Users | 10 min | ☐ |
| Test | Create Investments | 2 min | ☐ |
| Test | Collect Income | 5 min | ☐ |
| Test | Complete First | 5 min | ☐ |
| Test | Complete Second | 5 min | ☐ |
| Verify | Final Verification | 5 min | ☐ |
| Verify | Documentation | 10 min | ☐ |
| Post | Monitoring | 30 min | ☐ |
| Post | Communication | 5 min | ☐ |
| **Total** | **All Steps** | **~118 min** | **☐** |

---

## Notes

**Deployment Date:** _______________
**Deployed By:** _______________
**Affected Users:** _______________
**Total Recovery Amount:** _______________
**Issues Encountered:** _______________
**Resolution:** _______________

---

## Sign-Off

- **Deployed By:** _________________ Date: _______
- **Verified By:** _________________ Date: _______
- **Approved By:** _________________ Date: _______

---

**Status:** Ready for deployment ✅
**Priority:** CRITICAL 🔴
**Estimated Time:** ~2 hours (including recovery and testing)
