# 📊 Admin User Investments Manager - Complete Guide

## Overview

The **User Investments Manager** is a new admin panel feature that allows you to:
1. View all user investments in one place
2. Monitor investment status and progress
3. **Manually give earnings to users** who didn't receive them on the last day
4. Track investment history and details

## Access

**Location:** Admin Panel → User Investments (or `/admin/user-investments`)

**Requirements:** Admin level access (user_level >= 999)

---

## Features

### 1. User List (Left Panel)

**View all users with investments:**
- Search by name or email
- See quick stats: active plans, completed plans
- Click to select a user and view their investments

**Search functionality:**
- Real-time search as you type
- Searches by user name and email
- Filters results instantly

### 2. User Summary (Top Right)

When you select a user, you'll see:
- **Active Plans:** Number of currently running investments
- **Completed Plans:** Number of finished investments
- **Total Invested:** Sum of all investment amounts
- **Total Earnings:** Sum of all profits from completed investments

### 3. Investment Details (Bottom Right)

For each user investment, you can see:

**Quick View:**
- Plan name and status (active/completed)
- Investment amount and profit percentage
- Duration and days collected
- Days remaining (for active plans)

**Expanded View (Click to expand):**
- Start date and end date
- Last collection date
- Expected earnings calculation
- **Manual Earnings Section** (for completed plans)

---

## Manual Earnings Feature

### When to Use

Use this feature when:
- ✅ A user's plan completed but they didn't receive final earnings
- ✅ There was a system error that prevented earnings transfer
- ✅ You need to manually compensate a user
- ✅ A user missed their final collection day

### How to Give Manual Earnings

**Step 1:** Select a user from the list

**Step 2:** Find the completed investment plan

**Step 3:** Click to expand the investment details

**Step 4:** Look for "Give Manual Earnings" section (yellow box)

**Step 5:** Click the eye icon to show the input form

**Step 6:** Enter the amount in PKR

**Step 7:** Click "Give Earnings" button

**Step 8:** Confirm the success message

**Result:** 
- Amount is added to user's main balance
- Transaction is recorded in income_transactions table
- Admin log is created for audit trail

---

## Example Scenarios

### Scenario 1: User Missed Final Collection

**Problem:**
- 3-day plan completed
- User didn't collect final day earnings
- User lost 100 PKR profit

**Solution:**
1. Go to Admin → User Investments
2. Search for the user
3. Find the completed 3-day plan
4. Expand it
5. Click eye icon in "Give Manual Earnings"
6. Enter: 100
7. Click "Give Earnings"
8. User receives 100 PKR

### Scenario 2: System Error Lost Earnings

**Problem:**
- 7-day plan completed
- System error prevented earnings transfer
- User should have received 700 PKR profit + 4000 PKR capital
- Capital was returned but earnings were lost

**Solution:**
1. Go to Admin → User Investments
2. Search for the user
3. Find the completed 7-day plan
4. Expand it
5. Click eye icon in "Give Manual Earnings"
6. Enter: 700 (the missing earnings)
7. Click "Give Earnings"
8. User receives 700 PKR

---

## Investment Status Meanings

| Status | Meaning | Can Give Earnings? |
|--------|---------|-------------------|
| **Active** | Currently running | ❌ No |
| **Completed** | Finished (end date passed) | ✅ Yes |
| **Cancelled** | Cancelled by user or admin | ❌ No |

---

## Data Recorded

When you give manual earnings, the system records:

1. **User Balance Update**
   - Amount added to user's main balance
   - Immediately available for withdrawal

2. **Income Transaction**
   - Investment ID
   - Amount given
   - Marked as "final collection"
   - Timestamp

3. **Admin Log**
   - Admin action recorded
   - User ID
   - Investment ID
   - Amount
   - Reason (if provided)
   - Timestamp

---

## Best Practices

### ✅ DO:
- Document why you're giving earnings
- Verify the investment details before giving earnings
- Check if user already received the earnings
- Use reasonable amounts (match expected profit)
- Give earnings only for completed plans
- Keep records for audit purposes

### ❌ DON'T:
- Give earnings for active plans (they're still running)
- Give excessive amounts without reason
- Give earnings multiple times for same plan
- Skip verification steps
- Give earnings without checking investment details

---

## Troubleshooting

### Issue: Can't see "Give Manual Earnings" button

**Cause:** Investment is not completed yet

**Solution:** Wait for investment to complete or check investment status

### Issue: "Failed to add earnings" error

**Cause:** System error or invalid amount

**Solution:**
1. Check amount is positive number
2. Verify user ID is correct
3. Try again or contact support

### Issue: User didn't receive the earnings

**Cause:** 
- Amount not added to balance
- User needs to refresh page
- System delay

**Solution:**
1. Refresh the page
2. Check user's balance in "Manage Users"
3. Try giving earnings again

---

## Related Features

**See Also:**
- [Admin Users Manager](/admin/users) - Manage user balances directly
- [Manage Plans](/admin/plans) - View and edit investment plans
- [Manage Deposits](/admin/deposits) - Handle user deposits
- [Manage Withdrawals](/admin/withdrawals) - Process withdrawals

---

## API Endpoint

**Endpoint:** `POST /api/admin/investments/manual-earnings`

**Request:**
```json
{
  "investmentId": 123,
  "userId": "user-uuid",
  "amount": 500,
  "reason": "Missed final collection"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully added 500 PKR to user balance",
  "investment": { ... }
}
```

---

## Audit Trail

All manual earnings are logged for security:

**View Logs:**
1. Go to Admin Panel
2. Check admin_logs table
3. Filter by action: "manual_earnings_given"
4. See who gave earnings, when, and how much

---

## Security

- ✅ Admin-only access (user_level >= 999)
- ✅ All actions logged
- ✅ Amount validation
- ✅ User verification
- ✅ Transaction recording
- ✅ Audit trail maintained

---

## Tips & Tricks

### Tip 1: Quick Search
Use email to quickly find users:
- Type user's email in search box
- Results filter in real-time

### Tip 2: Bulk View
Click multiple users to compare their investments:
- See patterns in earnings
- Identify users with issues
- Track completion rates

### Tip 3: Export Data
You can export investment data:
1. Select all investments
2. Copy to spreadsheet
3. Analyze trends

### Tip 4: Verify Before Giving
Always check:
- Investment status is "completed"
- Expected earnings amount
- User's current balance
- Last collection date

---

## FAQ

**Q: Can I give earnings for active plans?**
A: No, only for completed plans. Active plans are still running.

**Q: What if I give earnings by mistake?**
A: Contact support. The transaction is logged and can be reversed.

**Q: How much should I give?**
A: Match the expected profit amount shown in the investment details.

**Q: Will user see this in their history?**
A: Yes, it appears as an income transaction in their account.

**Q: Can I give earnings multiple times?**
A: Yes, but verify each time to avoid duplicates.

**Q: Is there a limit on amount?**
A: No hard limit, but use reasonable amounts.

---

## Support

**Questions?** Contact admin support or check:
- Investment details for expected earnings
- User's transaction history
- Admin logs for audit trail

---

**Status:** ✅ Live and Ready to Use

**Last Updated:** November 19, 2025

**Version:** 1.0
