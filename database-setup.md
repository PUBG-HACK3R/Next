# 🗄️ SmartGrow Database Manager

## 📦 Installation

1. **Install required dependencies:**
```bash
npm install @supabase/supabase-js dotenv
```

2. **Make sure your `.env.local` file has:**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🚀 Usage

### 1. Check Database Structure
```bash
node database-manager.js check
```
This will show you all tables and record counts.

### 2. Preview Cleanup (Safe - No Deletions)
```bash
node database-manager.js clean --dry-run
```
This shows what WOULD be deleted without actually deleting anything.

### 3. Clean Database (Keep Admin Users)
```bash
node database-manager.js clean
```
This deletes all user data but keeps admin users.

### 4. Clean Everything (Nuclear Option)
```bash
node database-manager.js clean --delete-all
```
⚠️ **WARNING**: This deletes ALL users including admins!

### 5. Verify Current State
```bash
node database-manager.js verify
```
Shows current database state and remaining data.

## 🎯 What Gets Deleted

✅ **Deleted:**
- All user profiles (except admins)
- All investments
- All deposits & withdrawals
- All referrals & commissions
- All daily income records

✅ **Preserved:**
- Investment plans (your products)
- Admin settings
- Database structure
- Admin users (if using `clean` without `--delete-all`)

## 🔧 Customization

Edit the script to change admin emails:
```javascript
adminEmails: ['admin@smartgrow.com', 'your-admin@email.com']
```

## 📋 Step-by-Step Process

1. **First, check what you have:**
   ```bash
   node database-manager.js check
   ```

2. **Preview the cleanup:**
   ```bash
   node database-manager.js clean --dry-run
   ```

3. **If everything looks good, clean:**
   ```bash
   node database-manager.js clean
   ```

4. **Verify results:**
   ```bash
   node database-manager.js verify
   ```

## 🆘 Manual Tasks After Cleanup

After running the script, you still need to manually:

1. **Clear Supabase Auth Users:**
   - Go to Supabase Dashboard → Authentication → Users
   - Delete all non-admin users

2. **Clear Storage Buckets:**
   - Go to Storage → Buckets
   - Empty `deposit_proofs` bucket
   - Empty any other user file buckets

3. **Verify RLS Policies:**
   - Check that Row Level Security policies are still active
   - Test user registration and login

## 🚨 Safety Features

- **Dry run mode** - preview before deleting
- **Admin user protection** - keeps specified admin emails
- **Foreign key handling** - deletes in correct order
- **Error handling** - continues even if some tables don't exist
- **Verification** - shows results after cleanup

## 🔍 Troubleshooting

**If you get permission errors:**
- Make sure you're using `SUPABASE_SERVICE_ROLE_KEY` (not anon key)
- Check that the service role key has admin permissions

**If tables are not found:**
- The script handles missing tables gracefully
- It will show which tables exist and skip missing ones

**If you want to start completely fresh:**
1. Run `node database-manager.js clean --delete-all`
2. Manually clear Auth users in Supabase dashboard
3. Clear all storage buckets
4. Test user registration
