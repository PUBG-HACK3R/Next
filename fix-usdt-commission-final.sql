-- Final fix for USDT commission system
-- This version correctly processes existing deposits

-- Step 1: Add missing columns if they don't exist
ALTER TABLE referral_commissions 
ADD COLUMN IF NOT EXISTS usdt_deposit_id INTEGER;

ALTER TABLE referral_commissions 
ADD COLUMN IF NOT EXISTS commission_level INTEGER;

ALTER TABLE referral_commissions 
ADD COLUMN IF NOT EXISTS commission_percent DECIMAL(5,2);

-- Step 2: Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'referral_commissions_usdt_deposit_id_fkey'
    ) THEN
        ALTER TABLE referral_commissions 
        ADD CONSTRAINT referral_commissions_usdt_deposit_id_fkey 
        FOREIGN KEY (usdt_deposit_id) REFERENCES usdt_deposits(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 3: Make deposit_id nullable
ALTER TABLE referral_commissions 
ALTER COLUMN deposit_id DROP NOT NULL;

-- Step 4: Create the commission calculation function (for future deposits)
CREATE OR REPLACE FUNCTION calculate_usdt_referral_commissions()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    referrer_id UUID;
    commission_amount DECIMAL;
    settings_record RECORD;
    deposit_amount DECIMAL;
BEGIN
    -- Get admin settings
    SELECT referral_l1_percent, referral_l2_percent, referral_l3_percent 
    INTO settings_record
    FROM admin_settings 
    ORDER BY id DESC 
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;
    
    deposit_amount := NEW.amount_pkr;
    current_user_id := NEW.user_id;
    
    -- Level 1 Commission
    SELECT referred_by INTO referrer_id FROM user_profiles WHERE id = current_user_id;
    IF referrer_id IS NOT NULL THEN
        commission_amount := deposit_amount * (settings_record.referral_l1_percent / 100.0);
        
        INSERT INTO referral_commissions (
            referrer_id, referred_user_id, usdt_deposit_id, 
            commission_amount, commission_level, commission_percent
        ) VALUES (
            referrer_id, current_user_id, NEW.id,
            commission_amount, 1, settings_record.referral_l1_percent
        );
        
        UPDATE user_profiles SET balance = balance + commission_amount WHERE id = referrer_id;
        
        -- Level 2 Commission
        SELECT referred_by INTO referrer_id FROM user_profiles WHERE id = referrer_id;
        IF referrer_id IS NOT NULL THEN
            commission_amount := deposit_amount * (settings_record.referral_l2_percent / 100.0);
            
            INSERT INTO referral_commissions (
                referrer_id, referred_user_id, usdt_deposit_id, 
                commission_amount, commission_level, commission_percent
            ) VALUES (
                referrer_id, current_user_id, NEW.id,
                commission_amount, 2, settings_record.referral_l2_percent
            );
            
            UPDATE user_profiles SET balance = balance + commission_amount WHERE id = referrer_id;
            
            -- Level 3 Commission
            SELECT referred_by INTO referrer_id FROM user_profiles WHERE id = referrer_id;
            IF referrer_id IS NOT NULL THEN
                commission_amount := deposit_amount * (settings_record.referral_l3_percent / 100.0);
                
                INSERT INTO referral_commissions (
                    referrer_id, referred_user_id, usdt_deposit_id, 
                    commission_amount, commission_level, commission_percent
                ) VALUES (
                    referrer_id, current_user_id, NEW.id,
                    commission_amount, 3, settings_record.referral_l3_percent
                );
                
                UPDATE user_profiles SET balance = balance + commission_amount WHERE id = referrer_id;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger for future USDT deposits
DROP TRIGGER IF EXISTS trigger_calculate_usdt_referral_commissions ON usdt_deposits;
CREATE TRIGGER trigger_calculate_usdt_referral_commissions
    AFTER INSERT ON usdt_deposits
    FOR EACH ROW
    EXECUTE FUNCTION calculate_usdt_referral_commissions();

-- Step 6: Process existing USDT deposits manually (correct approach)
DO $$
DECLARE
    deposit_rec RECORD;
    current_user_id UUID;
    referrer_id UUID;
    commission_amount DECIMAL;
    settings_record RECORD;
    deposit_amount DECIMAL;
    processed_count INTEGER := 0;
BEGIN
    -- Get admin settings
    SELECT referral_l1_percent, referral_l2_percent, referral_l3_percent 
    INTO settings_record
    FROM admin_settings 
    ORDER BY id DESC 
    LIMIT 1;
    
    IF NOT FOUND THEN
        RAISE NOTICE 'No admin settings found, cannot calculate commissions';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Processing existing USDT deposits with rates: L1=%, L2=%, L3=%', 
        settings_record.referral_l1_percent, 
        settings_record.referral_l2_percent, 
        settings_record.referral_l3_percent;
    
    -- Process each USDT deposit that doesn't have commissions yet
    FOR deposit_rec IN 
        SELECT * FROM usdt_deposits 
        WHERE id NOT IN (
            SELECT COALESCE(usdt_deposit_id, 0) 
            FROM referral_commissions 
            WHERE usdt_deposit_id IS NOT NULL
        )
        ORDER BY created_at ASC
    LOOP
        deposit_amount := deposit_rec.amount_pkr;
        current_user_id := deposit_rec.user_id;
        
        RAISE NOTICE 'Processing USDT deposit ID=%, User=%, Amount=% PKR', 
            deposit_rec.id, current_user_id, deposit_amount;
        
        -- Level 1 Commission
        SELECT referred_by INTO referrer_id FROM user_profiles WHERE id = current_user_id;
        IF referrer_id IS NOT NULL THEN
            commission_amount := deposit_amount * (settings_record.referral_l1_percent / 100.0);
            
            INSERT INTO referral_commissions (
                referrer_id, referred_user_id, usdt_deposit_id, 
                commission_amount, commission_level, commission_percent
            ) VALUES (
                referrer_id, current_user_id, deposit_rec.id,
                commission_amount, 1, settings_record.referral_l1_percent
            );
            
            UPDATE user_profiles SET balance = balance + commission_amount WHERE id = referrer_id;
            RAISE NOTICE 'L1 Commission: % PKR to user %', commission_amount, referrer_id;
            
            -- Level 2 Commission
            SELECT referred_by INTO referrer_id FROM user_profiles WHERE id = referrer_id;
            IF referrer_id IS NOT NULL THEN
                commission_amount := deposit_amount * (settings_record.referral_l2_percent / 100.0);
                
                INSERT INTO referral_commissions (
                    referrer_id, referred_user_id, usdt_deposit_id, 
                    commission_amount, commission_level, commission_percent
                ) VALUES (
                    referrer_id, current_user_id, deposit_rec.id,
                    commission_amount, 2, settings_record.referral_l2_percent
                );
                
                UPDATE user_profiles SET balance = balance + commission_amount WHERE id = referrer_id;
                RAISE NOTICE 'L2 Commission: % PKR to user %', commission_amount, referrer_id;
                
                -- Level 3 Commission
                SELECT referred_by INTO referrer_id FROM user_profiles WHERE id = referrer_id;
                IF referrer_id IS NOT NULL THEN
                    commission_amount := deposit_amount * (settings_record.referral_l3_percent / 100.0);
                    
                    INSERT INTO referral_commissions (
                        referrer_id, referred_user_id, usdt_deposit_id, 
                        commission_amount, commission_level, commission_percent
                    ) VALUES (
                        referrer_id, current_user_id, deposit_rec.id,
                        commission_amount, 3, settings_record.referral_l3_percent
                    );
                    
                    UPDATE user_profiles SET balance = balance + commission_amount WHERE id = referrer_id;
                    RAISE NOTICE 'L3 Commission: % PKR to user %', commission_amount, referrer_id;
                END IF;
            END IF;
        ELSE
            RAISE NOTICE 'User % has no referrer, no commissions calculated', current_user_id;
        END IF;
        
        processed_count := processed_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Processed % existing USDT deposits', processed_count;
END $$;

-- Step 7: Show results
SELECT 'USDT Commission Summary:' as info;
SELECT 
    commission_level,
    COUNT(*) as count,
    SUM(commission_amount) as total_amount
FROM referral_commissions 
WHERE usdt_deposit_id IS NOT NULL
GROUP BY commission_level
ORDER BY commission_level;
