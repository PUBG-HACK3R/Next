# Fresh Deposit System Setup Guide

## Overview
Your deposit system has been completely rebuilt with a fresh database schema, new API endpoints, and modern frontend components. This guide will help you set up and deploy the new system.

## 🗄️ Database Setup

### Step 1: Run the Fresh Database Schema
Execute the SQL file to create the new deposit system:

```sql
-- Run this in your Supabase SQL editor
\i fresh-deposit-system.sql
```

This will:
- Drop old problematic tables (`usdt_deposits`, old `deposits`)
- Create new clean `deposits` table with better structure
- Add `deposit_transactions` table for tracking balance updates
- Update `admin_settings` with new deposit configuration
- Create proper RLS policies
- Add stored procedures for deposit approval/rejection

### Step 2: Configure Admin Settings
Update your admin settings with proper values:

```sql
UPDATE admin_settings SET 
    min_deposit_amount = 1000,  -- Minimum PKR deposit
    usdt_wallet_address = 'YOUR_ACTUAL_USDT_WALLET_ADDRESS',
    min_usdt_deposit = 10,      -- Minimum USDT deposit
    usdt_to_pkr_rate = 280,     -- Current USDT to PKR rate
    usdt_chains = '[
        {"name":"TRC20","network":"Tron","enabled":true},
        {"name":"BEP20","network":"BSC","enabled":true}
    ]'::jsonb,
    deposit_details = '{
        "bank": {
            "name": "Your Bank Name",
            "account": "1234567890",
            "title": "SmartGrow Mining"
        },
        "easypaisa": {
            "number": "03001234567",
            "title": "SmartGrow Mining"
        }
    }'::jsonb
WHERE id = 1;
```

## 🚀 API Endpoints

The following new API endpoints have been created:

### User Endpoints
- `GET /api/deposits` - Get user's deposit history with pagination
- `POST /api/deposits` - Submit new deposit request
- `POST /api/deposits/upload` - Upload deposit proof files
- `GET /api/admin/settings` - Get admin settings (public for deposit form)

### Admin Endpoints
- `GET /api/admin/deposits` - Get all deposits for admin review
- `PATCH /api/admin/deposits` - Approve/reject deposits
- `PUT /api/admin/settings` - Update admin settings

## 🎨 Frontend Components

### New Components Created
1. **Fresh Deposit Page** (`/dashboard/deposit/page.tsx`)
   - Modern UI with method selection (Bank, EasyPaisa, USDT)
   - Real-time form validation
   - File upload with progress
   - Success/error handling
   - Integrated deposit history

2. **Deposit History Component** (`/components/DepositHistory.tsx`)
   - Paginated deposit list
   - Status indicators
   - Detailed transaction info
   - Admin rejection reasons display

## 🔧 Features

### For Users
- ✅ **Multiple Deposit Methods**: Bank Transfer, EasyPaisa, USDT Crypto
- ✅ **Real-time Validation**: Form validation with helpful error messages
- ✅ **File Upload**: Secure proof upload with size/type validation
- ✅ **Copy to Clipboard**: Easy copying of account details
- ✅ **Deposit History**: View all past deposits with status
- ✅ **USDT Calculator**: Auto-calculate PKR equivalent for USDT deposits
- ✅ **Responsive Design**: Works on all devices

### For Admins
- ✅ **Deposit Management**: Approve/reject deposits with reasons
- ✅ **Automatic Processing**: Balance updates and referral commissions
- ✅ **Transaction Tracking**: Complete audit trail
- ✅ **Settings Management**: Update deposit limits and account details

## 🔐 Security Features

- **Row Level Security (RLS)**: Users can only see their own deposits
- **File Upload Security**: Image validation and size limits
- **Admin Authentication**: Proper admin role checking
- **SQL Injection Protection**: Parameterized queries
- **CSRF Protection**: Proper API authentication

## 📱 Usage

### For Users
1. Navigate to `/dashboard/deposit`
2. Choose deposit method (Bank/EasyPaisa/USDT)
3. Fill in required details
4. Upload payment proof (required for USDT, optional for others)
5. Submit and track status in history

### For Admins
1. Access admin deposit management
2. Review pending deposits
3. Approve with automatic balance/commission processing
4. Reject with reason if needed

## 🛠️ Testing

### Test the Complete Flow
1. **User Deposit Submission**:
   - Test all three deposit methods
   - Verify form validation
   - Test file upload functionality

2. **Admin Processing**:
   - Test deposit approval
   - Verify balance updates
   - Check referral commission processing

3. **Error Handling**:
   - Test with invalid data
   - Test file upload errors
   - Test network failures

## 🚨 Important Notes

1. **Update Environment Variables**: Ensure your Supabase credentials are correct
2. **Storage Bucket**: The `deposit-proofs` bucket will be created automatically
3. **Admin User**: Make sure you have a user with `user_level >= 999` for admin access
4. **USDT Wallet**: Update the USDT wallet address in admin settings before enabling USDT deposits

## 🔄 Migration from Old System

The new system is designed to be a complete replacement. The old deposit tables will be dropped and recreated with the new schema. Make sure to:

1. **Backup existing data** if needed
2. **Run the fresh schema** to create new tables
3. **Update admin settings** with correct values
4. **Test thoroughly** before going live

## 📞 Support

If you encounter any issues:
1. Check the browser console for errors
2. Check the server logs for API errors
3. Verify database permissions and RLS policies
4. Ensure all environment variables are set correctly

The new deposit system is now ready for production use! 🎉
