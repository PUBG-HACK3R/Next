-- Fix the collect_daily_income function with correct date calculation
CREATE OR REPLACE FUNCTION collect_daily_income(
    investment_id_param INTEGER,
    user_id_param UUID
)
RETURNS JSON AS $$
DECLARE
    investment_record RECORD;
    plan_record RECORD;
    days_since_last_collection INTEGER;
    days_available_to_collect INTEGER;
    total_profit_to_pay NUMERIC;
    daily_profit NUMERIC;
    is_final_collection BOOLEAN := FALSE;
    referral_l1_user UUID;
    referral_l2_user UUID;
    referral_l3_user UUID;
    commission_l1 NUMERIC;
    commission_l2 NUMERIC;
    commission_l3 NUMERIC;
    admin_settings_record RECORD;
BEGIN
    -- Get investment details
    SELECT i.*
    INTO investment_record
    FROM investments i
    WHERE i.id = investment_id_param AND i.user_id = user_id_param AND i.status = 'active';
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Investment not found or not active');
    END IF;
    
    -- Get plan details
    SELECT duration_days, profit_percent, capital_return, name as plan_name
    INTO plan_record
    FROM plans
    WHERE id = investment_record.plan_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Plan not found');
    END IF;
    
    -- Calculate daily profit if not set
    IF investment_record.daily_profit_amount IS NULL THEN
        daily_profit := (investment_record.amount_invested * plan_record.profit_percent / 100) / plan_record.duration_days;
        UPDATE investments SET daily_profit_amount = daily_profit WHERE id = investment_id_param;
    ELSE
        daily_profit := investment_record.daily_profit_amount;
    END IF;
    
    -- Calculate days since last collection (CORRECTED LOGIC)
    IF investment_record.last_income_collection_date IS NULL THEN
        -- First collection - calculate days since start_date
        -- Only allow collection if at least 1 full day has passed
        days_since_last_collection := GREATEST(0, CURRENT_DATE - investment_record.start_date::DATE);
        
        -- Prevent collection on the same day as investment
        IF days_since_last_collection = 0 THEN
            RETURN json_build_object('success', false, 'error', 'Cannot collect income on the same day as investment. Please wait 24 hours.');
        END IF;
    ELSE
        -- Calculate days since last collection
        days_since_last_collection := CURRENT_DATE - investment_record.last_income_collection_date;
        
        -- Prevent collection if less than 1 day has passed
        IF days_since_last_collection = 0 THEN
            RETURN json_build_object('success', false, 'error', 'You can only collect income once per day. Please wait 24 hours.');
        END IF;
    END IF;
    
    -- Ensure we don't collect more than remaining days
    days_available_to_collect := LEAST(
        days_since_last_collection,
        plan_record.duration_days - investment_record.total_days_collected
    );
    
    -- Check if no days to collect
    IF days_available_to_collect <= 0 THEN
        RETURN json_build_object('success', false, 'error', 'No income available to collect today');
    END IF;
    
    -- Check if this is the final collection
    IF (investment_record.total_days_collected + days_available_to_collect) >= plan_record.duration_days THEN
        is_final_collection := TRUE;
        days_available_to_collect := plan_record.duration_days - investment_record.total_days_collected;
    END IF;
    
    -- Calculate total profit to pay
    total_profit_to_pay := daily_profit * days_available_to_collect;
    
    -- If final collection and capital return is true, add principal
    IF is_final_collection AND plan_record.capital_return THEN
        total_profit_to_pay := total_profit_to_pay + investment_record.amount_invested;
    END IF;
    
    -- Update user balance
    UPDATE user_profiles 
    SET balance = balance + total_profit_to_pay
    WHERE id = user_id_param;
    
    -- Update investment record
    UPDATE investments 
    SET 
        last_income_collection_date = CURRENT_DATE,
        total_days_collected = total_days_collected + days_available_to_collect,
        status = CASE WHEN is_final_collection THEN 'completed' ELSE 'active' END
    WHERE id = investment_id_param;
    
    -- Get admin settings for referral commissions
    SELECT referral_l1_percent, referral_l2_percent, referral_l3_percent
    INTO admin_settings_record
    FROM admin_settings
    WHERE id = 1;
    
    -- Get referral chain
    SELECT referred_by INTO referral_l1_user
    FROM user_profiles
    WHERE id = user_id_param;
    
    IF referral_l1_user IS NOT NULL THEN
        SELECT referred_by INTO referral_l2_user
        FROM user_profiles
        WHERE id = referral_l1_user;
        
        IF referral_l2_user IS NOT NULL THEN
            SELECT referred_by INTO referral_l3_user
            FROM user_profiles
            WHERE id = referral_l2_user;
        END IF;
    END IF;
    
    -- Calculate and distribute referral commissions (only on earnings, not capital)
    IF referral_l1_user IS NOT NULL THEN
        commission_l1 := (daily_profit * days_available_to_collect) * (admin_settings_record.referral_l1_percent / 100);
        UPDATE user_profiles SET balance = balance + commission_l1 WHERE id = referral_l1_user;
        
        -- Insert commission record
        INSERT INTO referral_commissions (
            referrer_id, 
            referred_user_id, 
            commission_amount, 
            commission_percent, 
            level, 
            status,
            created_at
        )
        VALUES (
            referral_l1_user, 
            user_id_param, 
            commission_l1, 
            admin_settings_record.referral_l1_percent, 
            1, 
            'Completed',
            NOW()
        );
    END IF;
    
    IF referral_l2_user IS NOT NULL THEN
        commission_l2 := (daily_profit * days_available_to_collect) * (admin_settings_record.referral_l2_percent / 100);
        UPDATE user_profiles SET balance = balance + commission_l2 WHERE id = referral_l2_user;
        
        INSERT INTO referral_commissions (
            referrer_id, 
            referred_user_id, 
            commission_amount, 
            commission_percent, 
            level, 
            status,
            created_at
        )
        VALUES (
            referral_l2_user, 
            user_id_param, 
            commission_l2, 
            admin_settings_record.referral_l2_percent, 
            2, 
            'Completed',
            NOW()
        );
    END IF;
    
    IF referral_l3_user IS NOT NULL THEN
        commission_l3 := (daily_profit * days_available_to_collect) * (admin_settings_record.referral_l3_percent / 100);
        UPDATE user_profiles SET balance = balance + commission_l3 WHERE id = referral_l3_user;
        
        INSERT INTO referral_commissions (
            referrer_id, 
            referred_user_id, 
            commission_amount, 
            commission_percent, 
            level, 
            status,
            created_at
        )
        VALUES (
            referral_l3_user, 
            user_id_param, 
            commission_l3, 
            admin_settings_record.referral_l3_percent, 
            3, 
            'Completed',
            NOW()
        );
    END IF;
    
    -- Return success response
    RETURN json_build_object(
        'success', true,
        'days_collected', days_available_to_collect,
        'profit_earned', total_profit_to_pay,
        'is_final_collection', is_final_collection,
        'commission_l1', COALESCE(commission_l1, 0),
        'commission_l2', COALESCE(commission_l2, 0),
        'commission_l3', COALESCE(commission_l3, 0)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
