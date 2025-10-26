# SmartGrow Mining - Testing Guide

## 🚀 Quick Start Testing

### Prerequisites
1. **Supabase Setup**: Create a Supabase project and run the SQL schema
2. **Environment Variables**: Set up `.env.local` with your Supabase credentials
3. **Development Server**: Run `npm run dev`

### Test Accounts Setup

#### Create Admin Account
1. Sign up with any email/password
2. Go to Supabase Table Editor → `user_profiles`
3. Set `user_level = 999` for admin access
4. Access admin panel at `/admin`

#### Create Test User Account
1. Sign up with different email/password
2. This will be a regular user account

## 📋 Testing Checklist

### Authentication Flow
- [ ] **Root Path Redirect**: Visit `/` - should redirect to `/login` if not authenticated
- [ ] **Sign Up**: Create new account at `/signup`
- [ ] **Email Verification**: Check if user profile is created automatically
- [ ] **Sign In**: Login at `/login` with created credentials
- [ ] **Forgot Password**: Test password reset at `/forgot-password`
- [ ] **Dashboard Redirect**: After login, should redirect to `/dashboard`

### User Dashboard Features

#### Navigation
- [ ] **Bottom Navigation**: Test all 4 tabs (Home, Active Plan, Wallet, Profile)
- [ ] **Top Bar**: Verify logo and balance display
- [ ] **Mobile Responsiveness**: Test on different screen sizes

#### Home Page (`/dashboard`)
- [ ] **Quick Actions**: Test all 4 buttons (Deposit, Withdraw, Invite, History)
- [ ] **Investment Plans**: Verify plans load from database
- [ ] **Plan Cards**: Check all plan details display correctly
- [ ] **Invest Now**: Click should navigate to investment page

#### Deposit Flow (`/dashboard/deposit`)
- [ ] **Payment Details**: Verify bank and Easypaisa info loads from admin settings
- [ ] **Copy Buttons**: Test copy-to-clipboard functionality
- [ ] **Form Validation**: Test all required fields
- [ ] **File Upload**: Upload payment proof image
- [ ] **Success State**: Verify success message after submission
- [ ] **Database Record**: Check `deposits` table for new record

#### Withdrawal Flow (`/dashboard/withdraw`)
- [ ] **Account Binding Check**: Should prompt to bind account if not done
- [ ] **Balance Validation**: Test insufficient funds error
- [ ] **Amount Validation**: Test minimum/maximum limits
- [ ] **Success Flow**: Verify balance deduction and withdrawal record
- [ ] **Database Updates**: Check `withdrawals` table and user balance

#### Wallet Page (`/dashboard/wallet`)
- [ ] **Balance Display**: Verify current balance shows correctly
- [ ] **Statistics**: Check active investments, earnings, withdrawals
- [ ] **Transaction List**: Verify recent transactions display
- [ ] **Empty State**: Test when no transactions exist

#### Profile Page (`/dashboard/profile`)
- [ ] **User Info**: Verify name, email, level display
- [ ] **Balance Toggle**: Test show/hide balance functionality
- [ ] **Account Update**: Test updating full name
- [ ] **Withdrawal Account**: Test binding bank/Easypaisa account
- [ ] **Form Validation**: Test required fields
- [ ] **Sign Out**: Test logout functionality

#### My Investments (`/dashboard/my-investments`)
- [ ] **Investment List**: Verify investments display correctly
- [ ] **Statistics**: Check total invested, active, completed counts
- [ ] **Progress Bars**: Test progress calculation for active investments
- [ ] **Empty State**: Test when no investments exist

#### Invite Page (`/dashboard/invite`)
- [ ] **Referral Link**: Verify unique link generation
- [ ] **Copy/Share**: Test link copying and sharing
- [ ] **Commission Rates**: Verify rates load from admin settings
- [ ] **Statistics**: Check referral counts (will be 0 initially)

#### Transaction History (`/dashboard/history`)
- [ ] **Transaction List**: Verify all transaction types display
- [ ] **Search**: Test search functionality
- [ ] **Filters**: Test type and status filters
- [ ] **Pagination**: Test if many transactions exist
- [ ] **Empty State**: Test when no transactions exist

#### Investment Flow (`/dashboard/invest/[id]`)
- [ ] **Plan Details**: Verify plan information loads correctly
- [ ] **Balance Check**: Verify available balance display
- [ ] **Amount Validation**: Test min/max investment limits
- [ ] **Quick Buttons**: Test minimum, 50%, all buttons
- [ ] **Return Calculator**: Verify profit calculations
- [ ] **Investment Process**: Test successful investment creation
- [ ] **Balance Deduction**: Verify balance updates immediately

### Admin Panel Features

#### Admin Access
- [ ] **Role Check**: Non-admin users should be redirected
- [ ] **Admin Navigation**: Test sidebar navigation
- [ ] **Mobile Menu**: Test mobile sidebar toggle

#### Admin Dashboard (`/admin`)
- [ ] **Statistics**: Verify all stats load correctly
- [ ] **Quick Actions**: Test navigation to management pages
- [ ] **System Status**: Check status indicators

#### Deposit Management (`/admin/deposits`)
- [ ] **Pending List**: Verify pending deposits display
- [ ] **User Information**: Check user details show correctly
- [ ] **Proof Viewing**: Test image proof modal
- [ ] **Approve Process**: Test approval and balance update
- [ ] **Reject Process**: Test rejection with reason
- [ ] **Database Updates**: Verify deposit status changes

#### Withdrawal Management (`/admin/withdrawals`)
- [ ] **Pending List**: Verify pending withdrawals display
- [ ] **Account Details**: Check withdrawal account info
- [ ] **Approve Process**: Test approval (no balance change)
- [ ] **Reject Process**: Test rejection with balance refund
- [ ] **Missing Account**: Test handling of unbound accounts

#### User Management (`/admin/users`)
- [ ] **User List**: Verify all users display in table
- [ ] **Search**: Test user search functionality
- [ ] **User Details**: Test user detail modal
- [ ] **Balance Edit**: Test manual balance adjustment
- [ ] **Statistics**: Verify user stats calculation

#### Plan Management (`/admin/plans`)
- [ ] **Plan Grid**: Verify all plans display correctly
- [ ] **Add Plan**: Test creating new investment plan
- [ ] **Edit Plan**: Test updating existing plan
- [ ] **Delete Plan**: Test plan deletion with confirmation
- [ ] **Form Validation**: Test all required fields

#### Settings Management (`/admin/settings`)
- [ ] **Load Settings**: Verify current settings display
- [ ] **Referral Rates**: Test updating commission percentages
- [ ] **Payment Details**: Test updating bank/Easypaisa info
- [ ] **Save Process**: Verify settings update successfully
- [ ] **Preview**: Check settings preview section

## 🔧 Database Testing

### Manual Database Checks
1. **User Profiles**: Verify automatic creation on signup
2. **Deposits**: Check status updates and balance changes
3. **Withdrawals**: Verify balance deductions and refunds
4. **Investments**: Check investment records and calculations
5. **Admin Settings**: Verify settings persistence

### SQL Functions Testing
```sql
-- Test balance increment (for deposit approval)
SELECT increment_user_balance('user-uuid-here', 1000);

-- Test balance decrement (for withdrawals/investments)
SELECT decrement_user_balance('user-uuid-here', 500);
```

## 🐛 Common Issues & Solutions

### Authentication Issues
- **Redirect Loop**: Check environment variables
- **Profile Not Created**: Verify database trigger is working
- **Admin Access Denied**: Ensure user_level = 999 in database

### File Upload Issues
- **Upload Fails**: Check Supabase Storage bucket exists
- **Permission Denied**: Verify storage policies are correct
- **File Not Displaying**: Check signed URL generation

### Balance Issues
- **Balance Not Updating**: Check SQL functions are working
- **Negative Balance**: Verify validation in withdrawal/investment flows
- **Incorrect Calculations**: Check profit calculation formulas

### UI/UX Issues
- **Mobile Navigation**: Test bottom navbar on mobile devices
- **Responsive Design**: Check all pages on different screen sizes
- **Loading States**: Verify loading indicators work correctly

## 📱 Mobile Testing

### Responsive Design
- [ ] **iPhone SE (375px)**: Test smallest mobile screen
- [ ] **iPhone 12 (390px)**: Test standard mobile
- [ ] **iPad (768px)**: Test tablet view
- [ ] **Desktop (1024px+)**: Test desktop layout

### Touch Interactions
- [ ] **Bottom Navigation**: Easy thumb access
- [ ] **Form Inputs**: Proper keyboard types
- [ ] **Buttons**: Adequate touch targets
- [ ] **Modals**: Easy to close on mobile

## 🚀 Performance Testing

### Page Load Times
- [ ] **Dashboard**: Should load quickly with cached data
- [ ] **Image Loading**: Deposit proofs should load efficiently
- [ ] **Database Queries**: Check for N+1 query issues

### Optimization Checks
- [ ] **Image Optimization**: Verify Next.js image optimization
- [ ] **Bundle Size**: Check for unnecessary imports
- [ ] **API Calls**: Minimize redundant database calls

## 🔒 Security Testing

### Authentication Security
- [ ] **Protected Routes**: Verify all dashboard routes require auth
- [ ] **Admin Routes**: Verify admin-only access
- [ ] **Session Management**: Test logout and session expiry

### Data Security
- [ ] **RLS Policies**: Users can only see their own data
- [ ] **File Access**: Users can only access their own uploads
- [ ] **Admin Permissions**: Admins can access all data

### Input Validation
- [ ] **SQL Injection**: Test with malicious inputs
- [ ] **XSS Prevention**: Test script injection attempts
- [ ] **File Upload**: Test malicious file uploads

## 📊 Final Checklist

### Core Functionality
- [ ] User registration and authentication works
- [ ] Deposit flow with admin approval works
- [ ] Investment creation and tracking works
- [ ] Withdrawal flow with balance management works
- [ ] Admin panel fully functional
- [ ] Mobile-responsive design works

### Data Integrity
- [ ] All database relationships work correctly
- [ ] Balance calculations are accurate
- [ ] Transaction history is complete
- [ ] User permissions are enforced

### User Experience
- [ ] Navigation is intuitive
- [ ] Error messages are helpful
- [ ] Success states are clear
- [ ] Loading states provide feedback

## 🎯 Production Readiness

### Before Deployment
1. **Environment Variables**: Set production Supabase credentials
2. **Admin Account**: Create production admin account
3. **Sample Data**: Add real investment plans
4. **Payment Details**: Update with real bank/Easypaisa accounts
5. **Testing**: Complete full testing cycle
6. **Documentation**: Ensure README is up to date

### Post-Deployment
1. **SSL Certificate**: Verify HTTPS is working
2. **Domain Setup**: Configure custom domain if needed
3. **Monitoring**: Set up error tracking
4. **Backups**: Ensure database backups are configured
5. **Performance**: Monitor page load times

---

**Note**: This platform is now feature-complete and ready for testing. All major functionality has been implemented according to the original requirements.
