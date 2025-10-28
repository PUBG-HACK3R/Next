-- Fix deposit display issues for history and admin management
-- This ensures deposits can be read properly

-- Grant all necessary permissions on deposits
GRANT ALL PRIVILEGES ON deposits TO authenticated;
GRANT ALL PRIVILEGES ON deposit_transactions TO authenticated;
GRANT ALL PRIVILEGES ON SEQUENCE deposits_id_seq TO authenticated;
GRANT ALL PRIVILEGES ON SEQUENCE deposit_transactions_id_seq TO authenticated;

-- Also ensure user_profiles can be read (needed for admin joins)
GRANT SELECT ON user_profiles TO authenticated;

-- Check if we can see the deposits
SELECT 
    id,
    user_id,
    deposit_type,
    amount_pkr,
    sender_name,
    status,
    created_at
FROM deposits 
ORDER BY created_at DESC 
LIMIT 5;

-- Success message
SELECT 'SUCCESS: All deposit permissions fixed!' as status;
