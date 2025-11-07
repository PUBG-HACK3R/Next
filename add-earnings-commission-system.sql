-- Add earnings commission system for when investments complete

-- Create function to calculate earnings commissions when investment completes
CREATE OR REPLACE FUNCTION calculate_earnings_commissions()
RETURNS TRIGGER AS $$
DECLARE
    investment_record RECORD;
    investor_profile RECORD;
    level1_referrer_profile RECORD;
    level2_referrer_profile RECORD;
    level3_referrer_profile RECORD;
    admin_settings RECORD;
    total_earnings DECIMAL(10,2);
    commission_amount DECIMAL(10,2);
    existing_commission_count INTEGER;
BEGIN
    -- Only process when investment status changes to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        
        -- Check for existing earnings commissions to prevent duplicates
        SELECT COUNT(*) INTO existing_commission_count
        FROM referral_commissions 
        WHERE deposit_id IS NULL  -- earnings commissions have no deposit_id
        AND referred_user_id = NEW.user_id
        AND created_at::date = CURRENT_DATE;  -- today's commissions
        
        IF existing_commission_count > 0 THEN
            RAISE NOTICE 'Earnings commission already exists for user %, skipping', NEW.user_id;
            RETURN NEW;
        END IF;
        
        -- Get investment details with plan info
        SELECT 
            i.*,
            p.profit_percent,
            p.duration_days,
            p.name as plan_name
        INTO investment_record
        FROM investments i
        JOIN plans p ON i.plan_id = p.id
        WHERE i.id = NEW.id;
        
        -- Calculate total earnings (investment amount * profit percentage)
        total_earnings := investment_record.amount_invested * (investment_record.profit_percent / 100.0);
        
        RAISE NOTICE 'Processing earnings commissions for completed investment ID: %, Total earnings: % PKR', 
            NEW.id, total_earnings;
        
        -- Get admin settings for commission percentages
        SELECT 
            referral_l1_percent, 
            referral_l2_percent, 
            referral_l3_percent
        INTO admin_settings 
        FROM admin_settings 
        WHERE id = 1;
        
        -- Get the investor profile
        SELECT * INTO investor_profile 
        FROM user_profiles 
        WHERE id = NEW.user_id;
        
        -- Check if investor was referred by someone
        IF investor_profile.referred_by IS NOT NULL THEN
            
            -- Level 1 Earnings Commission (Direct referrer)
            SELECT * INTO level1_referrer_profile 
            FROM user_profiles 
            WHERE id = investor_profile.referred_by;
            
            IF level1_referrer_profile.id IS NOT NULL THEN
                commission_amount := total_earnings * (admin_settings.referral_l1_percent / 100.0);
                
                RAISE NOTICE 'Level 1 EARNINGS commission: % PKR ({}%) for %', 
                    commission_amount, admin_settings.referral_l1_percent, level1_referrer_profile.full_name;
                
                -- Insert Level 1 earnings commission
                INSERT INTO referral_commissions (
                    referrer_id, 
                    referred_user_id, 
                    deposit_id,        -- NULL for earnings commissions
                    commission_amount, 
                    commission_percent, 
                    level, 
                    status
                ) VALUES (
                    level1_referrer_profile.id, 
                    investor_profile.id, 
                    NULL,              -- No deposit_id for earnings
                    commission_amount, 
                    admin_settings.referral_l1_percent, 
                    1, 
                    'Completed'
                );
                
                -- Update L1 referrer balance
                UPDATE user_profiles 
                SET balance = balance + commission_amount 
                WHERE id = level1_referrer_profile.id;
                
                -- Level 2 Earnings Commission (L1's referrer)
                IF level1_referrer_profile.referred_by IS NOT NULL THEN
                    SELECT * INTO level2_referrer_profile 
                    FROM user_profiles 
                    WHERE id = level1_referrer_profile.referred_by;
                    
                    IF level2_referrer_profile.id IS NOT NULL THEN
                        commission_amount := total_earnings * (admin_settings.referral_l2_percent / 100.0);
                        
                        RAISE NOTICE 'Level 2 EARNINGS commission: % PKR ({}%) for %', 
                            commission_amount, admin_settings.referral_l2_percent, level2_referrer_profile.full_name;
                        
                        -- Insert Level 2 earnings commission
                        INSERT INTO referral_commissions (
                            referrer_id, referred_user_id, deposit_id,
                            commission_amount, commission_percent, level, status
                        ) VALUES (
                            level2_referrer_profile.id, investor_profile.id, NULL,
                            commission_amount, admin_settings.referral_l2_percent, 2, 'Completed'
                        );
                        
                        -- Update L2 referrer balance
                        UPDATE user_profiles 
                        SET balance = balance + commission_amount 
                        WHERE id = level2_referrer_profile.id;
                        
                        -- Level 3 Earnings Commission (L2's referrer)
                        IF level2_referrer_profile.referred_by IS NOT NULL THEN
                            SELECT * INTO level3_referrer_profile 
                            FROM user_profiles 
                            WHERE id = level2_referrer_profile.referred_by;
                            
                            IF level3_referrer_profile.id IS NOT NULL THEN
                                commission_amount := total_earnings * (admin_settings.referral_l3_percent / 100.0);
                                
                                RAISE NOTICE 'Level 3 EARNINGS commission: % PKR ({}%) for %', 
                                    commission_amount, admin_settings.referral_l3_percent, level3_referrer_profile.full_name;
                                
                                -- Insert Level 3 earnings commission
                                INSERT INTO referral_commissions (
                                    referrer_id, referred_user_id, deposit_id,
                                    commission_amount, commission_percent, level, status
                                ) VALUES (
                                    level3_referrer_profile.id, investor_profile.id, NULL,
                                    commission_amount, admin_settings.referral_l3_percent, 3, 'Completed'
                                );
                                
                                -- Update L3 referrer balance
                                UPDATE user_profiles 
                                SET balance = balance + commission_amount 
                                WHERE id = level3_referrer_profile.id;
                            END IF;
                        END IF;
                    END IF;
                END IF;
            END IF;
        ELSE
            RAISE NOTICE 'Investor was not referred by anyone';
        END IF;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in earnings commission calculation: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for earnings commissions when investment completes
CREATE TRIGGER earnings_commission_trigger
    AFTER UPDATE ON investments
    FOR EACH ROW
    EXECUTE FUNCTION calculate_earnings_commissions();

-- Verify the trigger was created
SELECT 
    'Earnings commission system created!' as status,
    trigger_name, 
    event_manipulation
FROM information_schema.triggers 
WHERE event_object_table = 'investments'
AND trigger_name = 'earnings_commission_trigger';

-- Show the complete commission structure
SELECT 
    'Commission Structure:' as info
UNION ALL
SELECT 'DEPOSITS: L1 gets ' || COALESCE(referral_l1_deposit_percent, 5) || '% when deposit approved'
FROM admin_settings WHERE id = 1
UNION ALL  
SELECT 'EARNINGS: L1 gets ' || referral_l1_percent || '% when investment completes'
FROM admin_settings WHERE id = 1
UNION ALL
SELECT 'EARNINGS: L2 gets ' || referral_l2_percent || '% when investment completes'
FROM admin_settings WHERE id = 1
UNION ALL
SELECT 'EARNINGS: L3 gets ' || referral_l3_percent || '% when investment completes'
FROM admin_settings WHERE id = 1;
