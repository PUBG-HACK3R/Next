-- Debug why bonus transactions aren't showing

-- Check current user
SELECT 
    'Current auth user:' as info,
    auth.uid() as auth_user_id;

-- Check if user has a profile
SELECT 
    'User profile:' as info,
    id,
    full_name,
    balance
FROM user_profiles
WHERE id = auth.uid();

-- Check all bonus transactions (bypass RLS temporarily)
SELECT 
    'All bonus transactions (no RLS):' as info,
    bt.id,
    bt.user_id,
    bt.admin_id,
    bt.amount,
    bt.reason,
    bt.status,
    bt.created_at
FROM bonus_transactions bt
ORDER BY bt.created_at DESC;

-- Check if current user has any bonuses
SELECT 
    'Bonuses for current user:' as info,
    bt.*
FROM bonus_transactions bt
WHERE bt.user_id = auth.uid();

-- Check with RLS disabled (run as admin)
ALTER TABLE bonus_transactions DISABLE ROW LEVEL SECURITY;

SELECT 
    'All bonuses (RLS disabled):' as info,
    bt.id,
    bt.user_id::text as user_id_text,
    auth.uid()::text as current_user_text,
    bt.user_id = auth.uid() as is_match,
    bt.amount,
    bt.reason
FROM bonus_transactions bt
ORDER BY bt.created_at DESC;

-- Re-enable RLS
ALTER TABLE bonus_transactions ENABLE ROW LEVEL SECURITY;
