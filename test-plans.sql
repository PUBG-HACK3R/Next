-- Test queries to check if plans exist in database
-- Run these in Supabase SQL Editor to debug

-- Check if plans table exists and has data
SELECT COUNT(*) as total_plans FROM plans;

-- Check all plans in the database
SELECT * FROM plans;

-- Check plans with specific status
SELECT * FROM plans WHERE status IN ('Active', 'Premium');

-- Check if RLS is blocking the query (run as authenticated user)
SELECT 
    schemaname,
    tablename,
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'plans';

-- Check RLS policies on plans table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'plans';
