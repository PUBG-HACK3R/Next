# Referral Commission System - Reimplemented

## Overview
The referral commission system has been reimplemented to provide a clear, dynamic commission structure that can be managed from the admin panel.

## Commission Structure

### Level 1 (L1) - Direct Referrer
- **Deposit Commission**: 5% (default, configurable)
- **Earning Commission**: 5% (default, configurable)
- **Gets commission from**: Both deposits AND earnings

### Level 2 (L2) - Referrer's Referrer
- **Deposit Commission**: ❌ NONE
- **Earning Commission**: 3% (default, configurable)
- **Gets commission from**: Earnings ONLY

### Level 3 (L3) - L2's Referrer
- **Deposit Commission**: ❌ NONE
- **Earning Commission**: 2% (default, configurable)
- **Gets commission from**: Earnings ONLY

## Dynamic Configuration

All commission rates are controlled from the Admin Panel:
- **Admin Panel → Settings → Referral Commission Settings**
- Fields:
  - `referral_l1_deposit_percent` - L1 deposit commission rate
  - `referral_l1_percent` - L1 earning commission rate
  - `referral_l2_percent` - L2 earning commission rate
  - `referral_l3_percent` - L3 earning commission rate

## How It Works

### Deposit Commission Flow
1. User makes a deposit
2. Admin approves the deposit
3. **Only L1** receives commission (5% by default)
4. L2 and L3 do NOT receive deposit commissions
5. Commission is added to referrer's balance immediately

### Earning Commission Flow
1. User completes an investment plan
2. Investment status changes to 'completed'
3. Earning is calculated: `investment_amount * profit_percent / 100`
4. **All three levels** (L1, L2, L3) receive earning commissions:
   - L1: 5% of earnings
   - L2: 3% of earnings
   - L3: 2% of earnings
5. Commissions are added to each referrer's balance

## Database Functions

### `process_deposit_referral_commissions()`
- Triggered when deposit is approved
- Processes L1 deposit commission only
- Updates referrer balance

### `process_earning_referral_commissions()`
- Triggered when investment is completed
- Processes L1, L2, L3 earning commissions
- Updates all referrer balances

## API Integration

### Deposit Approval (`/api/admin/deposits`)
- When admin approves a deposit:
  1. Deposit amount is added to user's balance
  2. L1 referrer gets deposit commission (if applicable)
  3. L2 and L3 are skipped for deposit commissions

### Investment Completion
- When investment status changes to 'completed':
  1. Earning amount is calculated
  2. L1 referrer gets earning commission
  3. L2 referrer gets earning commission
  4. L3 referrer gets earning commission

## Important Notes

⚠️ **Active Users**: This system is designed to work seamlessly with existing active users without disrupting their commissions.

✅ **Backward Compatible**: The system maintains all existing referral data and commission records.

✅ **Dynamic**: All rates can be changed in real-time from the admin panel and apply to future commissions.

## Testing

To verify the system is working:

1. **Deposit Commission**: 
   - Create a test user with a referrer
   - Make a deposit
   - Admin approves deposit
   - Check that only L1 gets commission

2. **Earning Commission**:
   - Create investment for referred user
   - Wait for investment to complete
   - Check that L1, L2, L3 all get earning commissions

## SQL Scripts

- `reimplement-referral-commission-system.sql` - Main implementation script with functions and triggers

## Files Modified

- `app/api/admin/deposits/route.ts` - Updated deposit approval logic to only give L1 deposit commission
- `app/admin/settings/page.tsx` - Already has correct commission rate fields

## Current Default Rates (in admin_settings)

```
referral_l1_deposit_percent = 5%
referral_l1_percent = 0% (currently set to 0 per user request)
referral_l2_percent = 0% (currently set to 0 per user request)
referral_l3_percent = 0% (currently set to 0 per user request)
```

Note: All rates are currently 0% as per the user's recent request to disable all commissions.
