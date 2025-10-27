-- Process existing completed deposits for referral commissions
-- This script will manually process all completed deposits that haven't been processed yet

DO $$
DECLARE
    deposit_record RECORD;
    referred_user_profile RECORD;
    level1_referrer_profile RECORD;
    level2_referrer_profile RECORD;
    level3_referrer_profile RECORD;
    admin_settings RECORD;
    commission_amount DECIMAL(10,2);
    existing_commission RECORD;
BEGIN
    -- Get admin settings for commission percentages
    SELECT referral_l1_percent, referral_l2_percent, referral_l3_percent 
    INTO admin_settings 
    FROM admin_settings 
    WHERE id = 1;
    
    RAISE NOTICE 'Admin settings: L1=%, L2=%, L3=%', 
        admin_settings.referral_l1_percent, 
        admin_settings.referral_l2_percent, 
        admin_settings.referral_l3_percent;
    
    -- Loop through all completed deposits
    FOR deposit_record IN 
        SELECT * FROM deposits 
        WHERE status = 'Completed' 
        ORDER BY created_at ASC
    LOOP
        RAISE NOTICE 'Processing deposit ID: %, Amount: %, User: %', 
            deposit_record.id, deposit_record.amount, deposit_record.user_id;
        
        -- Check if commission already exists for this deposit
        SELECT * INTO existing_commission 
        FROM referral_commissions 
        WHERE deposit_id = deposit_record.id;
        
        IF existing_commission.id IS NOT NULL THEN
            RAISE NOTICE 'Commission already exists for deposit %', deposit_record.id;
            CONTINUE;
        END IF;
        
        -- Get the user who made the deposit
        SELECT * INTO referred_user_profile 
        FROM user_profiles 
        WHERE id = deposit_record.user_id;
        
        RAISE NOTICE 'User profile: %, referred_by: %', 
            referred_user_profile.full_name, referred_user_profile.referred_by;
        
        -- Check if user was referred by someone
        IF referred_user_profile.referred_by IS NOT NULL THEN
            
            -- Level 1 Commission (Direct referrer)
            SELECT * INTO level1_referrer_profile 
            FROM user_profiles 
            WHERE referral_code = referred_user_profile.referred_by;
            
            IF level1_referrer_profile.id IS NOT NULL THEN
                commission_amount := deposit_record.amount * (admin_settings.referral_l1_percent / 100.0);
                
                RAISE NOTICE 'Level 1 referrer: %, Commission: %', 
                    level1_referrer_profile.full_name, commission_amount;
                
                -- Insert Level 1 commission
                INSERT INTO referral_commissions (
                    referrer_id, referred_user_id, deposit_id, 
                    commission_amount, commission_percent, level, status
                ) VALUES (
                    level1_referrer_profile.id, referred_user_profile.id, deposit_record.id,
                    commission_amount, admin_settings.referral_l1_percent, 1, 'Completed'
                );
                
                -- Update referrer's balance
                UPDATE user_profiles 
                SET balance = balance + commission_amount 
                WHERE id = level1_referrer_profile.id;
                
                -- Level 2 Commission (Referrer's referrer)
                IF level1_referrer_profile.referred_by IS NOT NULL THEN
                    SELECT * INTO level2_referrer_profile 
                    FROM user_profiles 
                    WHERE referral_code = level1_referrer_profile.referred_by;
                    
                    IF level2_referrer_profile.id IS NOT NULL THEN
                        commission_amount := deposit_record.amount * (admin_settings.referral_l2_percent / 100.0);
                        
                        RAISE NOTICE 'Level 2 referrer: %, Commission: %', 
                            level2_referrer_profile.full_name, commission_amount;
                        
                        -- Insert Level 2 commission
                        INSERT INTO referral_commissions (
                            referrer_id, referred_user_id, deposit_id, 
                            commission_amount, commission_percent, level, status
                        ) VALUES (
                            level2_referrer_profile.id, referred_user_profile.id, deposit_record.id,
                            commission_amount, admin_settings.referral_l2_percent, 2, 'Completed'
                        );
                        
                        -- Update referrer's balance
                        UPDATE user_profiles 
                        SET balance = balance + commission_amount 
                        WHERE id = level2_referrer_profile.id;
                        
                        -- Level 3 Commission (Level 2 referrer's referrer)
                        IF level2_referrer_profile.referred_by IS NOT NULL THEN
                            SELECT * INTO level3_referrer_profile 
                            FROM user_profiles 
                            WHERE referral_code = level2_referrer_profile.referred_by;
                            
                            IF level3_referrer_profile.id IS NOT NULL THEN
                                commission_amount := deposit_record.amount * (admin_settings.referral_l3_percent / 100.0);
                                
                                RAISE NOTICE 'Level 3 referrer: %, Commission: %', 
                                    level3_referrer_profile.full_name, commission_amount;
                                
                                -- Insert Level 3 commission
                                INSERT INTO referral_commissions (
                                    referrer_id, referred_user_id, deposit_id, 
                                    commission_amount, commission_percent, level, status
                                ) VALUES (
                                    level3_referrer_profile.id, referred_user_profile.id, deposit_record.id,
                                    commission_amount, admin_settings.referral_l3_percent, 3, 'Completed'
                                );
                                
                                -- Update referrer's balance
                                UPDATE user_profiles 
                                SET balance = balance + commission_amount 
                                WHERE id = level3_referrer_profile.id;
                            END IF;
                        END IF;
                    END IF;
                END IF;
            ELSE
                RAISE NOTICE 'No referrer found for referral code: %', referred_user_profile.referred_by;
            END IF;
        ELSE
            RAISE NOTICE 'User was not referred by anyone';
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Finished processing existing deposits';
END $$;
