-- Check if there's a user_id mismatch in bonus transactions

-- Show all bonus transactions with user info
SELECT 
    'All bonus transactions:' as info,
    bt.id,
    bt.user_id,
    bt.admin_id,
    bt.amount,
    bt.reason,
    bt.status,
    bt.created_at,
    up.full_name as user_name,
    up.email as user_email
FROM bonus_transactions bt
LEFT JOIN user_profiles up ON bt.user_id = up.id
ORDER BY bt.created_at DESC;

-- Check current authenticated user
SELECT 
    'Current user info:' as info,
    auth.uid() as current_auth_id,
    up.id as profile_id,
    up.full_name,
    up.email
FROM user_profiles up
WHERE up.id = auth.uid();

-- Find bonuses that should belong to current user but don't match
SELECT 
    'Potential mismatches:' as info,
    bt.id,
    bt.user_id::text as bonus_user_id,
    auth.uid()::text as current_user_id,
    bt.user_id = auth.uid() as ids_match,
    bt.amount,
    bt.reason
FROM bonus_transactions bt
ORDER BY bt.created_at DESC;
