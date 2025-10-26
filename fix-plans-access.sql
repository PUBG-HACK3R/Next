-- Fix plans access issues
-- Run this in Supabase SQL Editor

-- Enable RLS on plans table
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read active plans
CREATE POLICY "Anyone can view active plans" ON plans
    FOR SELECT USING (status IN ('Active', 'Premium'));

-- Alternative: Disable RLS on plans table if you want public access
-- ALTER TABLE plans DISABLE ROW LEVEL SECURITY;
