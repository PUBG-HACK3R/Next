-- Update commission system to implement new L1 deposit + earnings structure
-- L1: Gets commission from deposits + earnings
-- L2/L3: Only get commission from earnings

-- First, update the deposit commission function to use separate L1 deposit percentage
-- and ensure L2/L3 don't get deposit commissions
CREATE OR REPLACE FUNCTION calculate_referral_commissions()
RETURNS TRIGGER AS $$
DECLARE
    referred_user_profile RECORD;
    level1_referrer_profile RECORD;
    admin_settings RECORD;
    commission_amount DECIMAL(10,2);
BEGIN
    -- Only process when deposit status changes to 'Completed'
    IF NEW.status = 'Completed' AND (OLD.status IS NULL OR OLD.status != 'Completed') THEN
        
        -- Get admin settings for commission percentages
        SELECT 
            referral_l1_percent, 
            referral_l2_percent, 
            referral_l3_percent,
            referral_l1_deposit_percent 
        INTO admin_settings 
        FROM admin_settings 
        WHERE id = 1;
        
        -- Get the user who made the deposit
        SELECT * INTO referred_user_profile 
        FROM user_profiles 
        WHERE id = NEW.user_id;
        
        -- Check if user was referred by someone
        IF referred_user_profile.referred_by IS NOT NULL THEN
            
            -- Level 1 Commission (Direct referrer) - ONLY L1 gets deposit commission
            SELECT * INTO level1_referrer_profile 
            FROM user_profiles 
            WHERE referral_code = referred_user_profile.referred_by;
            
            IF level1_referrer_profile.id IS NOT NULL THEN
                -- Use the separate L1 deposit commission percentage
                commission_amount := NEW.amount * (admin_settings.referral_l1_deposit_percent / 100.0);
                
                -- Insert Level 1 deposit commission
                INSERT INTO referral_commissions (
                    referrer_id, referred_user_id, deposit_id, 
                    commission_amount, commission_percent, level, status
                ) VALUES (
                    level1_referrer_profile.id, referred_user_profile.id, NEW.id,
                    commission_amount, admin_settings.referral_l1_deposit_percent, 1, 'Completed'
                );
                
                -- Update referrer's balance
                UPDATE user_profiles 
                SET balance = balance + commission_amount 
                WHERE id = level1_referrer_profile.id;
                
                -- NOTE: L2 and L3 do NOT get deposit commissions anymore
                -- They will only get earnings commissions from the daily income system
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the daily income collection function to ensure proper earnings commission distribution
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
    admin_settings_record RECORD;
    commission_l1 NUMERIC := 0;
    commission_l2 NUMERIC := 0;
    commission_l3 NUMERIC := 0;
BEGIN
    -- Get investment record
    SELECT * INTO investment_record
    FROM investments
    WHERE id = investment_id_param AND user_id = user_id_param AND status = 'active';
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Investment not found or not active');
    END IF;
    
    -- Get plan details
    SELECT duration_days, profit_percent, capital_return, name as plan_name
    INTO plan_record
    FROM plans
    WHERE id = investment_record.plan_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Investment plan not found');
    END IF;
    
    -- Calculate daily profit if not set
    IF investment_record.daily_profit_amount IS NULL THEN
        daily_profit := (investment_record.amount_invested * plan_record.profit_percent / 100) / plan_record.duration_days;
        UPDATE investments SET daily_profit_amount = daily_profit WHERE id = investment_id_param;
    ELSE
        daily_profit := investment_record.daily_profit_amount;
    END IF;
    
    -- Calculate days since last collection
    IF investment_record.last_income_collection_date IS NULL THEN
        days_since_last_collection := EXTRACT(DAY FROM (CURRENT_DATE - investment_record.start_date::DATE)) + 1;
    ELSE
        days_since_last_collection := EXTRACT(DAY FROM (CURRENT_DATE - investment_record.last_income_collection_date));
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
    
    -- Get admin settings for commission calculations
    SELECT referral_l1_percent, referral_l2_percent, referral_l3_percent
    INTO admin_settings_record
    FROM admin_settings
    WHERE id = 1;
    
    -- Get referral chain for earnings commissions
    SELECT up.referred_by INTO referral_l1_user
    FROM user_profiles up
    WHERE up.id = user_id_param;
    
    IF referral_l1_user IS NOT NULL THEN
        SELECT up.referred_by INTO referral_l2_user
        FROM user_profiles up
        WHERE up.referral_code = referral_l1_user;
        
        IF referral_l2_user IS NOT NULL THEN
            SELECT up.referred_by INTO referral_l3_user
            FROM user_profiles up
            WHERE up.referral_code = referral_l2_user;
        END IF;
    END IF;
    
    -- Calculate and distribute earnings commissions (ALL LEVELS get earnings commissions)
    -- L1: Gets earnings commission (in addition to deposit commission)
    IF referral_l1_user IS NOT NULL THEN
        commission_l1 := (daily_profit * days_available_to_collect) * (admin_settings_record.referral_l1_percent / 100);
        UPDATE user_profiles SET balance = balance + commission_l1 
        WHERE referral_code = referral_l1_user;
        
        -- Insert commission record for earnings
        INSERT INTO referral_commissions (referrer_id, referred_user_id, commission_amount, commission_percent, level, status, created_at)
        SELECT id, user_id_param, commission_l1, admin_settings_record.referral_l1_percent, 1, 'Completed', NOW()
        FROM user_profiles WHERE referral_code = referral_l1_user;
    END IF;
    
    -- L2: Gets earnings commission only (no deposit commission)
    IF referral_l2_user IS NOT NULL THEN
        commission_l2 := (daily_profit * days_available_to_collect) * (admin_settings_record.referral_l2_percent / 100);
        UPDATE user_profiles SET balance = balance + commission_l2 
        WHERE referral_code = referral_l2_user;
        
        -- Insert commission record for earnings
        INSERT INTO referral_commissions (referrer_id, referred_user_id, commission_amount, commission_percent, level, status, created_at)
        SELECT id, user_id_param, commission_l2, admin_settings_record.referral_l2_percent, 2, 'Completed', NOW()
        FROM user_profiles WHERE referral_code = referral_l2_user;
    END IF;
    
    -- L3: Gets earnings commission only (no deposit commission)
    IF referral_l3_user IS NOT NULL THEN
        commission_l3 := (daily_profit * days_available_to_collect) * (admin_settings_record.referral_l3_percent / 100);
        UPDATE user_profiles SET balance = balance + commission_l3 
        WHERE referral_code = referral_l3_user;
        
        -- Insert commission record for earnings
        INSERT INTO referral_commissions (referrer_id, referred_user_id, commission_amount, commission_percent, level, status, created_at)
        SELECT id, user_id_param, commission_l3, admin_settings_record.referral_l3_percent, 3, 'Completed', NOW()
        FROM user_profiles WHERE referral_code = referral_l3_user;
    END IF;
    
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
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON FUNCTION calculate_referral_commissions() IS 'Calculates deposit commissions - only L1 gets deposit commissions using referral_l1_deposit_percent';
COMMENT ON FUNCTION collect_daily_income(INTEGER, UUID) IS 'Calculates earnings commissions - all levels (L1, L2, L3) get earnings commissions using their respective percentages';

SELECT 'Commission system updated successfully - L1 gets deposit+earnings, L2/L3 get earnings only' AS status;
