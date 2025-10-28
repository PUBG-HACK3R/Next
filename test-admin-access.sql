-- Test if admin user can access USDT deposits

-- Check current user level
SELECT id, full_name, user_level, email 
FROM user_profiles 
WHERE id = auth.uid();

-- Check if current user is admin (user_level >= 999)
SELECT 
    CASE 
        WHEN user_level >= 999 THEN 'ADMIN'
        ELSE 'REGULAR USER'
    END as user_type,
    user_level
FROM user_profiles 
WHERE id = auth.uid();

-- Try to access USDT deposits as current user
SELECT 
    id,
    user_id,
    amount_usdt,
    amount_pkr,
    status,
    created_at
FROM usdt_deposits 
ORDER BY created_at DESC 
LIMIT 5;

-- Try the exact query that the admin page uses
SELECT 
    usdt_deposits.*,
    user_profiles.full_name
FROM usdt_deposits
LEFT JOIN user_profiles ON usdt_deposits.user_id = user_profiles.id
ORDER BY usdt_deposits.created_at DESC 
LIMIT 5;
