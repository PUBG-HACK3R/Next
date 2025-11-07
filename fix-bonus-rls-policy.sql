-- Fix RLS policies for bonus_transactions to allow users to see their bonuses

-- First, check current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'bonus_transactions';

-- Drop existing policies and recreate them correctly
DROP POLICY IF EXISTS "Users can view own bonus transactions" ON bonus_transactions;
DROP POLICY IF EXISTS "Admins can manage all bonus transactions" ON bonus_transactions;

-- Create policy for users to view their own bonuses
CREATE POLICY "Users can view own bonus transactions" 
ON bonus_transactions
FOR SELECT 
USING (user_id = auth.uid());

-- Create policy for admins to manage all bonuses
CREATE POLICY "Admins can manage all bonus transactions" 
ON bonus_transactions
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND user_level >= 5
    )
);

-- Verify RLS is enabled
ALTER TABLE bonus_transactions ENABLE ROW LEVEL SECURITY;

-- Test query to see if bonuses are visible
SELECT 
    'Bonus transactions for current user:' as info,
    bt.*
FROM bonus_transactions bt
WHERE bt.user_id = auth.uid()
ORDER BY bt.created_at DESC
LIMIT 5;

-- Show all bonus transactions (admin view)
SELECT 
    'All bonus transactions:' as info,
    bt.id,
    bt.user_id,
    up.full_name as user_name,
    bt.amount,
    bt.reason,
    bt.status,
    bt.created_at
FROM bonus_transactions bt
JOIN user_profiles up ON bt.user_id = up.id
ORDER BY bt.created_at DESC
LIMIT 10;
