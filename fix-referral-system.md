# Fix Referral System - Step by Step

## Problem Identified:
1. ✅ **Referral counting** - FIXED (now shows referred users)
2. ✅ **Deposit tracking** - FIXED (now shows total deposits)
3. ❌ **Investment tracking** - Need to check table structure
4. ❌ **Commission payments** - Need to run SQL setup

## Steps to Complete the Fix:

### Step 1: Run the Referral Commission System SQL
Run this in your database (Supabase SQL Editor):

```sql
\i add-referral-commission-system.sql
```

### Step 2: Process Existing Deposits for Commissions
Run this to give you the 5% commission for existing deposits:

```sql
\i process-existing-deposits.sql
```

### Step 3: Check Investment Table Structure
We need to verify which table stores investments. Run this query:

```sql
-- Check if user_investments table exists
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('user_investments', 'investments', 'plans', 'user_plans')
ORDER BY table_name, ordinal_position;
```

### Step 4: After Running SQL Scripts
1. Check your balance - you should see the 5% commission added
2. Check referral page - should show proper investment data
3. Any new deposits will automatically trigger commissions

## Expected Results After Fix:
- ✅ Referral page shows 1 Level 1 referral
- ✅ Shows PKR 1,000 total deposits
- ✅ Shows active investment plans
- ✅ Your balance increases by PKR 50 (5% commission)
- ✅ Future deposits automatically trigger commissions

## Files Created:
- `add-referral-commission-system.sql` - Creates commission system
- `process-existing-deposits.sql` - Processes past deposits
- `fix-referral-system.md` - This instruction file
