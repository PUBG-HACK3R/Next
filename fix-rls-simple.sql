-- Simple RLS Fix - Drop all policies and recreate
-- Run this in Supabase SQL Editor

-- Step 1: Drop ALL existing policies to avoid conflicts
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all policies on user_profiles
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON user_profiles';
    END LOOP;
    
    -- Drop all policies on plans
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'plans') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON plans';
    END LOOP;
END $$;

-- Step 2: Disable RLS completely for now
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE plans DISABLE ROW LEVEL SECURITY;

-- This will make everything publicly accessible for testing
-- You can re-enable RLS later once everything is working
