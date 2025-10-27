-- Add purchase limit column to plans table
ALTER TABLE plans ADD COLUMN IF NOT EXISTS purchase_limit_per_user INTEGER DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN plans.purchase_limit_per_user IS 'Maximum number of times a user can purchase this plan. NULL means unlimited.';

-- Update existing plans with some default limits (you can adjust these)
UPDATE plans SET purchase_limit_per_user = 5 WHERE name ILIKE '%basic%';
UPDATE plans SET purchase_limit_per_user = 3 WHERE name ILIKE '%premium%';
UPDATE plans SET purchase_limit_per_user = 1 WHERE name ILIKE '%vip%';

-- Create function to check if user can purchase a plan
CREATE OR REPLACE FUNCTION can_user_purchase_plan(
    user_id_param UUID,
    plan_id_param INTEGER
)
RETURNS JSON AS $$
DECLARE
    plan_record RECORD;
    user_purchase_count INTEGER;
BEGIN
    -- Get plan details
    SELECT id, name, purchase_limit_per_user
    INTO plan_record
    FROM plans
    WHERE id = plan_id_param AND status IN ('Active', 'Premium');
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'can_purchase', false, 
            'error', 'Plan not found or not available'
        );
    END IF;
    
    -- If no limit set, user can purchase unlimited
    IF plan_record.purchase_limit_per_user IS NULL THEN
        RETURN json_build_object(
            'can_purchase', true,
            'remaining_purchases', -1,
            'message', 'Unlimited purchases allowed'
        );
    END IF;
    
    -- Count how many times user has purchased this plan
    SELECT COUNT(*)
    INTO user_purchase_count
    FROM investments
    WHERE user_id = user_id_param AND plan_id = plan_id_param;
    
    -- Check if user has reached the limit
    IF user_purchase_count >= plan_record.purchase_limit_per_user THEN
        RETURN json_build_object(
            'can_purchase', false,
            'error', 'Purchase limit reached',
            'message', format('You have reached the maximum purchase limit (%s times) for %s plan. Please choose another plan.', 
                plan_record.purchase_limit_per_user, 
                plan_record.name
            ),
            'purchases_made', user_purchase_count,
            'purchase_limit', plan_record.purchase_limit_per_user
        );
    END IF;
    
    -- User can still purchase
    RETURN json_build_object(
        'can_purchase', true,
        'remaining_purchases', plan_record.purchase_limit_per_user - user_purchase_count,
        'purchases_made', user_purchase_count,
        'purchase_limit', plan_record.purchase_limit_per_user,
        'message', format('You can purchase %s more time(s)', 
            plan_record.purchase_limit_per_user - user_purchase_count
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's purchase history for all plans
CREATE OR REPLACE FUNCTION get_user_plan_purchases(user_id_param UUID)
RETURNS TABLE (
    plan_id INTEGER,
    plan_name TEXT,
    purchase_count BIGINT,
    purchase_limit INTEGER,
    can_purchase_more BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as plan_id,
        p.name as plan_name,
        COALESCE(inv_count.count, 0) as purchase_count,
        p.purchase_limit_per_user as purchase_limit,
        CASE 
            WHEN p.purchase_limit_per_user IS NULL THEN true
            WHEN COALESCE(inv_count.count, 0) < p.purchase_limit_per_user THEN true
            ELSE false
        END as can_purchase_more
    FROM plans p
    LEFT JOIN (
        SELECT plan_id, COUNT(*) as count
        FROM investments
        WHERE user_id = user_id_param
        GROUP BY plan_id
    ) inv_count ON p.id = inv_count.plan_id
    WHERE p.status IN ('Active', 'Premium')
    ORDER BY p.min_investment ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
