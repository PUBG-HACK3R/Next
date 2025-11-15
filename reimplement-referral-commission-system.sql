-- ============================================================================
-- REFERRAL COMMISSION SYSTEM REIMPLEMENTATION
-- ============================================================================
-- Commission Structure:
-- L1: 5% deposit commission + 5% earning commission
-- L2: 3% earning commission only
-- L3: 2% earning commission only
-- All rates are dynamically controlled from admin_settings table
-- ============================================================================

-- Step 1: Create or replace the function to process deposit commissions
CREATE OR REPLACE FUNCTION process_deposit_referral_commissions(
    p_user_id UUID,
    p_deposit_id INTEGER,
    p_deposit_amount NUMERIC
)
RETURNS VOID AS $$
DECLARE
    v_referrer_id UUID;
    v_level INTEGER := 1;
    v_commission_amount NUMERIC;
    v_commission_rate NUMERIC;
    v_admin_settings RECORD;
BEGIN
    -- Get admin settings for commission rates
    SELECT referral_l1_percent, referral_l1_deposit_percent, referral_l2_percent, referral_l3_percent
    INTO v_admin_settings
    FROM admin_settings
    WHERE id = 1;

    -- Get the direct referrer (L1)
    SELECT referred_by INTO v_referrer_id
    FROM user_profiles
    WHERE id = p_user_id;

    -- Process L1 deposit commission (5% by default)
    IF v_referrer_id IS NOT NULL THEN
        v_commission_rate := COALESCE(v_admin_settings.referral_l1_deposit_percent, 5);
        
        IF v_commission_rate > 0 THEN
            v_commission_amount := (p_deposit_amount * v_commission_rate) / 100;
            
            -- Insert L1 deposit commission
            INSERT INTO referral_commissions (
                referrer_id,
                referred_user_id,
                deposit_id,
                commission_type,
                level,
                amount,
                source_amount,
                commission_rate,
                status,
                created_at
            ) VALUES (
                v_referrer_id,
                p_user_id,
                p_deposit_id,
                'deposit',
                1,
                v_commission_amount,
                p_deposit_amount,
                v_commission_rate,
                'completed',
                NOW()
            );
            
            -- Update referrer's balance
            UPDATE user_profiles
            SET balance = balance + v_commission_amount
            WHERE id = v_referrer_id;
            
            RAISE NOTICE 'L1 Deposit Commission: % PKR (% rate) for user %', 
                v_commission_amount, v_commission_rate, v_referrer_id;
        END IF;

        -- Process L2 deposit commission (L2 does NOT get deposit commission, only earning)
        -- Get L2 referrer
        SELECT referred_by INTO v_referrer_id
        FROM user_profiles
        WHERE id = v_referrer_id;

        -- Process L3 deposit commission (L3 does NOT get deposit commission, only earning)
        -- Get L3 referrer (for reference, but no commission)
        IF v_referrer_id IS NOT NULL THEN
            SELECT referred_by INTO v_referrer_id
            FROM user_profiles
            WHERE id = v_referrer_id;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create or replace the function to process earning commissions
CREATE OR REPLACE FUNCTION process_earning_referral_commissions(
    p_user_id UUID,
    p_investment_id INTEGER,
    p_earning_amount NUMERIC
)
RETURNS VOID AS $$
DECLARE
    v_referrer_id UUID;
    v_next_referrer_id UUID;
    v_level INTEGER;
    v_commission_amount NUMERIC;
    v_commission_rate NUMERIC;
    v_admin_settings RECORD;
BEGIN
    -- Get admin settings for commission rates
    SELECT referral_l1_percent, referral_l2_percent, referral_l3_percent
    INTO v_admin_settings
    FROM admin_settings
    WHERE id = 1;

    -- Get the direct referrer (L1)
    SELECT referred_by INTO v_referrer_id
    FROM user_profiles
    WHERE id = p_user_id;

    -- Process L1 earning commission (5% by default)
    IF v_referrer_id IS NOT NULL THEN
        v_commission_rate := COALESCE(v_admin_settings.referral_l1_percent, 5);
        
        IF v_commission_rate > 0 THEN
            v_commission_amount := (p_earning_amount * v_commission_rate) / 100;
            
            -- Insert L1 earning commission
            INSERT INTO referral_commissions (
                referrer_id,
                referred_user_id,
                investment_id,
                commission_type,
                level,
                amount,
                source_amount,
                commission_rate,
                status,
                created_at
            ) VALUES (
                v_referrer_id,
                p_user_id,
                p_investment_id,
                'earning',
                1,
                v_commission_amount,
                p_earning_amount,
                v_commission_rate,
                'completed',
                NOW()
            );
            
            -- Update referrer's balance
            UPDATE user_profiles
            SET balance = balance + v_commission_amount
            WHERE id = v_referrer_id;
            
            RAISE NOTICE 'L1 Earning Commission: % PKR (% rate) for user %', 
                v_commission_amount, v_commission_rate, v_referrer_id;
        END IF;

        -- Get L2 referrer
        SELECT referred_by INTO v_next_referrer_id
        FROM user_profiles
        WHERE id = v_referrer_id;

        -- Process L2 earning commission (3% by default, NO deposit commission)
        IF v_next_referrer_id IS NOT NULL THEN
            v_commission_rate := COALESCE(v_admin_settings.referral_l2_percent, 3);
            
            IF v_commission_rate > 0 THEN
                v_commission_amount := (p_earning_amount * v_commission_rate) / 100;
                
                -- Insert L2 earning commission
                INSERT INTO referral_commissions (
                    referrer_id,
                    referred_user_id,
                    investment_id,
                    commission_type,
                    level,
                    amount,
                    source_amount,
                    commission_rate,
                    status,
                    created_at
                ) VALUES (
                    v_next_referrer_id,
                    p_user_id,
                    p_investment_id,
                    'earning',
                    2,
                    v_commission_amount,
                    p_earning_amount,
                    v_commission_rate,
                    'completed',
                    NOW()
                );
                
                -- Update referrer's balance
                UPDATE user_profiles
                SET balance = balance + v_commission_amount
                WHERE id = v_next_referrer_id;
                
                RAISE NOTICE 'L2 Earning Commission: % PKR (% rate) for user %', 
                    v_commission_amount, v_commission_rate, v_next_referrer_id;
            END IF;

            -- Get L3 referrer
            SELECT referred_by INTO v_referrer_id
            FROM user_profiles
            WHERE id = v_next_referrer_id;

            -- Process L3 earning commission (2% by default, NO deposit commission)
            IF v_referrer_id IS NOT NULL THEN
                v_commission_rate := COALESCE(v_admin_settings.referral_l3_percent, 2);
                
                IF v_commission_rate > 0 THEN
                    v_commission_amount := (p_earning_amount * v_commission_rate) / 100;
                    
                    -- Insert L3 earning commission
                    INSERT INTO referral_commissions (
                        referrer_id,
                        referred_user_id,
                        investment_id,
                        commission_type,
                        level,
                        amount,
                        source_amount,
                        commission_rate,
                        status,
                        created_at
                    ) VALUES (
                        v_referrer_id,
                        p_user_id,
                        p_investment_id,
                        'earning',
                        3,
                        v_commission_amount,
                        p_earning_amount,
                        v_commission_rate,
                        'completed',
                        NOW()
                    );
                    
                    -- Update referrer's balance
                    UPDATE user_profiles
                    SET balance = balance + v_commission_amount
                    WHERE id = v_referrer_id;
                    
                    RAISE NOTICE 'L3 Earning Commission: % PKR (% rate) for user %', 
                        v_commission_amount, v_commission_rate, v_referrer_id;
                END IF;
            END IF;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create wrapper function for deposit commission trigger
CREATE OR REPLACE FUNCTION trigger_process_deposit_commissions()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM process_deposit_referral_commissions(NEW.user_id, NEW.id, NEW.amount_pkr);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for deposit commissions
DROP TRIGGER IF EXISTS trigger_deposit_referral_commissions ON deposits;

CREATE TRIGGER trigger_deposit_referral_commissions
AFTER UPDATE ON deposits
FOR EACH ROW
WHEN (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved'))
EXECUTE FUNCTION trigger_process_deposit_commissions();

-- Step 4: Create wrapper function for earning commission trigger
CREATE OR REPLACE FUNCTION trigger_process_earning_commissions()
RETURNS TRIGGER AS $$
DECLARE
    v_earning_amount NUMERIC;
BEGIN
    -- Calculate earning amount
    SELECT (NEW.amount_invested * (p.profit_percent / 100))
    INTO v_earning_amount
    FROM plans p
    WHERE p.id = NEW.plan_id;
    
    PERFORM process_earning_referral_commissions(NEW.user_id, NEW.id, v_earning_amount);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for earning commissions (when investment completes)
DROP TRIGGER IF EXISTS trigger_earning_referral_commissions ON investments;

CREATE TRIGGER trigger_earning_referral_commissions
AFTER UPDATE ON investments
FOR EACH ROW
WHEN (NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed'))
EXECUTE FUNCTION trigger_process_earning_commissions();

-- Step 5: Verify the setup
SELECT 'Referral Commission System Reimplemented Successfully' AS status;

-- Step 6: Display current commission rates from admin settings
SELECT 
    'Current Commission Rates:' AS info,
    referral_l1_deposit_percent AS "L1 Deposit %",
    referral_l1_percent AS "L1 Earning %",
    referral_l2_percent AS "L2 Earning %",
    referral_l3_percent AS "L3 Earning %"
FROM admin_settings
WHERE id = 1;
