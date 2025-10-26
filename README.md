# SmartGrow Mining - Cryptocurrency Mining Investment Platform

A mobile-first, online cryptocurrency mining investment platform for the Pakistani market built with Next.js, Supabase, and Tailwind CSS.

## 🌱 Features

### User Features
- **Authentication System**: Secure signup/login with email verification
- **Investment Plans**: Multiple time-based investment options (15-60 days)
- **Manual Deposits**: Bank transfer and Easypaisa integration with proof upload
- **Withdrawal System**: Secure withdrawal requests with account binding
- **User Dashboard**: Clean, mobile-first interface with bottom navigation
- **Referral System**: 3-level referral program for earning commissions
- **Transaction History**: Complete history of deposits, withdrawals, and investments

### Admin Features
- **Admin Panel**: Comprehensive management dashboard
- **Deposit Management**: Approve/reject deposit requests with proof verification
- **Withdrawal Management**: Process withdrawal requests
- **User Management**: View and manage user accounts and balances
- **Plan Management**: Create and manage investment plans (CRUD)
- **Site Settings**: Configure referral percentages and payment details

## 🚀 Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Database & Auth**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: Vercel (ready)
- **File Storage**: Supabase Storage (for deposit proofs)

## 📋 Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- Basic knowledge of React/Next.js

## ⚙️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd smartgrow-platform
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully initialized
3. Go to **Settings > API** in your Supabase dashboard
4. Copy the **Project URL** and **anon/public key**

### 3. Configure Environment Variables

1. Copy the environment template:
   ```bash
   cp env-template.txt .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 4. Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the entire content of `supabase-schema.sql`
3. Paste it into the SQL Editor and run it
4. This will create all necessary tables, policies, functions, and sample data

### 5. Configure Storage

1. In Supabase dashboard, go to **Storage**
2. The `deposit_proofs` bucket should be created automatically by the schema
3. If not, create it manually with the name `deposit_proofs`

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🔐 Admin Access

To access the admin panel, you need to manually set a user's `user_level` to `999` in the database:

1. Go to Supabase **Table Editor**
2. Open the `user_profiles` table
3. Find your user and set `user_level` to `999`
4. You can now access the admin panel at `/admin`

## 📱 Application Flow

### User Journey
1. **Landing**: Root path redirects based on authentication status
2. **Authentication**: Login/Signup with email verification
3. **Dashboard**: Mobile-first interface with bottom navigation
4. **Deposit**: Manual verification system with proof upload
5. **Investment**: Choose from available plans and invest
6. **Withdrawal**: Request withdrawals with bound accounts
7. **Profile**: Manage account settings and withdrawal details

### Admin Journey
1. **Admin Dashboard**: Overview of platform statistics
2. **Deposit Management**: Review and approve/reject deposits
3. **Withdrawal Management**: Process withdrawal requests
4. **User Management**: View and manage user accounts
5. **Plan Management**: Create and manage investment plans
6. **Settings**: Configure platform settings and payment details

## 🗂️ Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── signup/
│   │   └── forgot-password/
│   ├── dashboard/
│   │   ├── deposit/
│   │   ├── withdraw/
│   │   ├── wallet/
│   │   ├── profile/
│   │   └── my-investments/
│   ├── admin/
│   │   ├── deposits/
│   │   ├── withdrawals/
│   │   ├── users/
│   │   ├── plans/
│   │   └── settings/
│   └── globals.css
└── lib/
    ├── supabase.ts
    └── auth.ts
```

## 🔧 Key Features Implementation

### Authentication
- Supabase Auth with email/password
- Automatic user profile creation via database triggers
- Row Level Security (RLS) policies for data protection

### File Upload
- Supabase Storage for deposit proof images
- Automatic file organization by user ID
- Secure access with signed URLs

### Database Design
- Normalized schema with proper relationships
- Audit trails with created_at/updated_at timestamps
- Referential integrity and constraints

### Mobile-First Design
- Responsive Tailwind CSS classes
- Fixed bottom navigation for mobile
- Touch-friendly interface elements

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Environment Variables for Production

Make sure to add these in your Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 📊 Database Schema Overview

- **user_profiles**: Extended user information and balances
- **plans**: Investment plan configurations
- **investments**: User investment records
- **deposits**: Deposit requests and approvals
- **withdrawals**: Withdrawal requests and processing
- **admin_settings**: Platform configuration

## 🔒 Security Features

- Row Level Security (RLS) on all tables
- Admin role-based access control
- Secure file upload with user isolation
- Input validation and sanitization
- CSRF protection via Supabase

## 🎯 Future Enhancements

- **User Levels**: Upgrade system based on referral activity
- **Level-Based Plans**: Premium plans for higher-level users
- **Automated Payouts**: Integration with payment gateways
- **Mobile App**: React Native version
- **Analytics**: Advanced reporting and analytics

## 🐛 Troubleshooting

### Common Issues

1. **Environment Variables**: Make sure `.env.local` is properly configured
2. **Database Schema**: Ensure all SQL from `supabase-schema.sql` was executed
3. **Admin Access**: Set `user_level = 999` in the database for admin access
4. **File Upload**: Check Supabase Storage bucket permissions

### Support

For issues and questions:
1. Check the console for error messages
2. Verify Supabase configuration
3. Ensure all dependencies are installed
4. Check network connectivity to Supabase

## 📄 License

This project is built for SmartGrow Mining. All rights reserved.
