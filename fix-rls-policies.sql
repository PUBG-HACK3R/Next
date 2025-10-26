-- Fix RLS Policy Issues - Remove Infinite Recursion
-- Run this in Supabase SQL Editor

-- Step 1: Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own data" ON user_profiles;
DROP POLICY IF EXISTS "Anyone can view active plans" ON plans;

-- Step 2: Disable RLS temporarily to clear any issues
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE plans DISABLE ROW LEVEL SECURITY;

-- Step 3: Re-enable RLS with proper policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple, non-recursive policies

-- User profiles: Users can only see and edit their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Plans: Everyone can view active plans (no authentication required)
CREATE POLICY "Public can view active plans" ON plans
    FOR SELECT USING (status IN ('Active', 'Premium'));

-- Admins can manage everything
CREATE POLICY "Admins can manage user profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_level >= 999
        )
    );

CREATE POLICY "Admins can manage plans" ON plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_level >= 999
        )
    );
