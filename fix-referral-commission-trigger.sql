-- Fix referral commission trigger to work with 'approved' status
-- This ensures commissions are processed when deposits are approved

-- Step 1: Drop all existing deposit-related triggers to avoid conflicts
DROP TRIGGER IF EXISTS deposit_commission_trigger ON deposits CASCADE;
DROP TRIGGER IF EXISTS trigger_calculate_referral_commissions ON deposits CASCADE;
DROP TRIGGER IF EXISTS trigger_deposit_commissions ON deposits CASCADE;
DROP TRIGGER IF EXISTS referral_commission_trigger ON deposits CASCADE;

-- Step 2: Drop old functions with CASCADE
DROP FUNCTION IF EXISTS trigger_deposit_commissions() CASCADE;
DROP FUNCTION IF EXISTS trigger_calculate_referral_commissions() CASCADE;
DROP FUNCTION IF EXISTS calculate_referral_commissions() CASCADE;
DROP FUNCTION IF EXISTS process_deposit_commission_trigger() CASCADE;

-- Step 3: Create a clean, simple trigger function that works with 'approved' status
CREATE OR REPLACE FUNCTION process_deposit_commission_trigger()
RETURNS TRIGGER AS $$
DECLARE
  referrer_id UUID;
  l1_commission DECIMAL;
  l2_commission DECIMAL;
  l3_commission DECIMAL;
  l1_percent DECIMAL;
  l2_percent DECIMAL;
  l3_percent DECIMAL;
  current_referrer UUID;
  level INTEGER;
BEGIN
  -- Only process when deposit status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Get the depositor's referrer
    SELECT referred_by INTO referrer_id
    FROM user_profiles
    WHERE id = NEW.user_id;
    
    -- If user has a referrer, process commissions
    IF referrer_id IS NOT NULL THEN
      
      -- Get commission percentages from admin_settings
      SELECT referral_l1_percent, referral_l2_percent, referral_l3_percent
      INTO l1_percent, l2_percent, l3_percent
      FROM admin_settings
      WHERE id = 1;
      
      -- Level 1 Commission
      IF l1_percent > 0 THEN
        l1_commission := (NEW.amount_pkr * l1_percent) / 100;
        
        -- Insert commission record
        INSERT INTO referral_commissions (
          referrer_id,
          referred_user_id,
          commission_type,
          level,
          amount,
          source_amount,
          commission_rate,
          deposit_id,
          status,
          created_at
        ) VALUES (
          referrer_id,
          NEW.user_id,
          'deposit',
          1,
          l1_commission,
          NEW.amount_pkr,
          l1_percent,
          NEW.id,
          'completed',
          NOW()
        );
        
        -- Update referrer's balance
        UPDATE user_profiles
        SET balance = COALESCE(balance, 0) + l1_commission,
            updated_at = NOW()
        WHERE id = referrer_id;
        
        -- Level 2 Commission
        SELECT referred_by INTO current_referrer
        FROM user_profiles
        WHERE id = referrer_id;
        
        IF current_referrer IS NOT NULL AND l2_percent > 0 THEN
          l2_commission := (NEW.amount_pkr * l2_percent) / 100;
          
          INSERT INTO referral_commissions (
            referrer_id,
            referred_user_id,
            commission_type,
            level,
            amount,
            source_amount,
            commission_rate,
            deposit_id,
            status,
            created_at
          ) VALUES (
            current_referrer,
            NEW.user_id,
            'deposit',
            2,
            l2_commission,
            NEW.amount_pkr,
            l2_percent,
            NEW.id,
            'completed',
            NOW()
          );
          
          UPDATE user_profiles
          SET balance = COALESCE(balance, 0) + l2_commission,
              updated_at = NOW()
          WHERE id = current_referrer;
          
          -- Level 3 Commission
          SELECT referred_by INTO referrer_id
          FROM user_profiles
          WHERE id = current_referrer;
          
          IF referrer_id IS NOT NULL AND l3_percent > 0 THEN
            l3_commission := (NEW.amount_pkr * l3_percent) / 100;
            
            INSERT INTO referral_commissions (
              referrer_id,
              referred_user_id,
              commission_type,
              level,
              amount,
              source_amount,
              commission_rate,
              deposit_id,
              status,
              created_at
            ) VALUES (
              referrer_id,
              NEW.user_id,
              'deposit',
              3,
              l3_commission,
              NEW.amount_pkr,
              l3_percent,
              NEW.id,
              'completed',
              NOW()
            );
            
            UPDATE user_profiles
            SET balance = COALESCE(balance, 0) + l3_commission,
                updated_at = NOW()
            WHERE id = referrer_id;
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create the new trigger
CREATE TRIGGER deposit_commission_trigger
  AFTER UPDATE ON deposits
  FOR EACH ROW
  EXECUTE FUNCTION process_deposit_commission_trigger();

-- Step 5: Verify the setup
SELECT 'Deposit commission trigger fixed and activated!' as status;
