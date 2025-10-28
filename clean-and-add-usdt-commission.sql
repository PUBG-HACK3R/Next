-- Clean existing data and add USDT commission system
-- This handles the constraint violation issue

-- Step 1: Check what's in referral_commissions table
SELECT 'Current referral_commissions data:' as info;
SELECT COUNT(*) as total_rows FROM referral_commissions;
SELECT COUNT(*) as null_deposit_id FROM referral_commissions WHERE deposit_id IS NULL;

-- Step 2: Add usdt_deposit_id column first (without constraints)
ALTER TABLE referral_commissions 
ADD COLUMN IF NOT EXISTS usdt_deposit_id INTEGER;

-- Step 3: Clean up any invalid rows (rows with NULL deposit_id that shouldn't exist)
-- We'll keep valid commission records and delete only truly invalid ones
DELETE FROM referral_commissions 
WHERE deposit_id IS NULL 
AND commission_amount IS NULL;

-- Step 4: For remaining NULL deposit_id rows, we'll leave them as regular commission records
-- Just make the deposit_id column nullable
ALTER TABLE referral_commissions 
ALTER COLUMN deposit_id DROP NOT NULL;

-- Step 5: Add foreign key for usdt_deposit_id
ALTER TABLE referral_commissions 
ADD CONSTRAINT referral_commissions_usdt_deposit_id_fkey 
FOREIGN KEY (usdt_deposit_id) REFERENCES usdt_deposits(id) ON DELETE CASCADE;

-- Step 6: Create the commission calculation function for USDT
CREATE OR REPLACE FUNCTION calculate_usdt_referral_commissions()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    referrer_id UUID;
    commission_amount DECIMAL;
    settings_record RECORD;
    deposit_amount DECIMAL;
    level_counter INTEGER := 1;
BEGIN
    RAISE NOTICE 'Calculating USDT commissions for deposit ID: %, Amount: % PKR', NEW.id, NEW.amount_pkr;
    
    -- Get admin settings
    SELECT referral_l1_percent, referral_l2_percent, referral_l3_percent 
    INTO settings_record
    FROM admin_settings 
    ORDER BY id DESC 
    LIMIT 1;
    
    IF NOT FOUND THEN
        RAISE NOTICE 'No admin settings found, skipping commission calculation';
        RETURN NEW;
    END IF;
    
    RAISE NOTICE 'Commission rates - L1: %, L2: %, L3: %', 
        settings_record.referral_l1_percent, 
        settings_record.referral_l2_percent, 
        settings_record.referral_l3_percent;
    
    deposit_amount := NEW.amount_pkr;
    current_user_id := NEW.user_id;
    
    -- Find the user's referrer chain and calculate commissions
    SELECT referred_by INTO referrer_id FROM user_profiles WHERE id = current_user_id;
    
    -- Level 1 Commission
    IF referrer_id IS NOT NULL THEN
        commission_amount := deposit_amount * (settings_record.referral_l1_percent / 100.0);
        
        INSERT INTO referral_commissions (
            referrer_id, 
            referred_user_id, 
            usdt_deposit_id, 
            commission_amount, 
            commission_level, 
            commission_percent
        ) VALUES (
            referrer_id,
            current_user_id,
            NEW.id,
            commission_amount,
            1,
            settings_record.referral_l1_percent
        );
        
        UPDATE user_profiles SET balance = balance + commission_amount WHERE id = referrer_id;
        RAISE NOTICE 'L1 Commission: % PKR paid to user %', commission_amount, referrer_id;
        
        -- Level 2 Commission
        SELECT referred_by INTO referrer_id FROM user_profiles WHERE id = referrer_id;
        IF referrer_id IS NOT NULL THEN
            commission_amount := deposit_amount * (settings_record.referral_l2_percent / 100.0);
            
            INSERT INTO referral_commissions (
                referrer_id, 
                referred_user_id, 
                usdt_deposit_id, 
                commission_amount, 
                commission_level, 
                commission_percent
            ) VALUES (
                referrer_id,
                current_user_id,
                NEW.id,
                commission_amount,
                2,
                settings_record.referral_l2_percent
            );
            
            UPDATE user_profiles SET balance = balance + commission_amount WHERE id = referrer_id;
            RAISE NOTICE 'L2 Commission: % PKR paid to user %', commission_amount, referrer_id;
            
            -- Level 3 Commission
            SELECT referred_by INTO referrer_id FROM user_profiles WHERE id = referrer_id;
            IF referrer_id IS NOT NULL THEN
                commission_amount := deposit_amount * (settings_record.referral_l3_percent / 100.0);
                
                INSERT INTO referral_commissions (
                    referrer_id, 
                    referred_user_id, 
                    usdt_deposit_id, 
                    commission_amount, 
                    commission_level, 
                    commission_percent
                ) VALUES (
                    referrer_id,
                    current_user_id,
                    NEW.id,
                    commission_amount,
                    3,
                    settings_record.referral_l3_percent
                );
                
                UPDATE user_profiles SET balance = balance + commission_amount WHERE id = referrer_id;
                RAISE NOTICE 'L3 Commission: % PKR paid to user %', commission_amount, referrer_id;
            END IF;
        END IF;
    ELSE
        RAISE NOTICE 'User % has no referrer, no commissions calculated', current_user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger for future USDT deposits
DROP TRIGGER IF EXISTS trigger_calculate_usdt_referral_commissions ON usdt_deposits;
CREATE TRIGGER trigger_calculate_usdt_referral_commissions
    AFTER INSERT ON usdt_deposits
    FOR EACH ROW
    EXECUTE FUNCTION calculate_usdt_referral_commissions();

-- Step 8: Process existing USDT deposits that don't have commissions yet
DO $$
DECLARE
    deposit_rec RECORD;
    processed_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Processing existing USDT deposits for commission calculation...';
    
    FOR deposit_rec IN 
        SELECT * FROM usdt_deposits 
        WHERE id NOT IN (
            SELECT COALESCE(usdt_deposit_id, 0) 
            FROM referral_commissions 
            WHERE usdt_deposit_id IS NOT NULL
        )
        ORDER BY created_at ASC
    LOOP
        RAISE NOTICE 'Processing USDT deposit ID: %, User: %, Amount: % PKR', 
            deposit_rec.id, deposit_rec.user_id, deposit_rec.amount_pkr;
        
        -- Manually trigger the commission calculation
        PERFORM calculate_usdt_referral_commissions() 
        FROM (SELECT deposit_rec.*) AS NEW;
        
        processed_count := processed_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Processed % existing USDT deposits for commission calculation', processed_count;
END $$;

-- Step 9: Verify the results
SELECT 'Commission calculation complete. Summary:' as info;
SELECT COUNT(*) as total_usdt_commissions 
FROM referral_commissions 
WHERE usdt_deposit_id IS NOT NULL;

SELECT 
    commission_level,
    COUNT(*) as count,
    SUM(commission_amount) as total_amount
FROM referral_commissions 
WHERE usdt_deposit_id IS NOT NULL
GROUP BY commission_level
ORDER BY commission_level;
