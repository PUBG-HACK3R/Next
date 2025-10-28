-- Create function to process earning-based referral commissions
CREATE OR REPLACE FUNCTION process_earning_commissions(user_id_param UUID, investment_id_param INTEGER, earning_amount DECIMAL)
RETURNS VOID AS $$
DECLARE
  settings_record RECORD;
  user_profile_record RECORD;
  current_referrer_id UUID;
  commission_rates DECIMAL[] := ARRAY[0, 0, 0];
  level INTEGER;
  commission_percent DECIMAL;
  commission_amount DECIMAL;
  next_referrer_record RECORD;
BEGIN
  -- Get admin settings for commission rates
  SELECT referral_l1_percent, referral_l2_percent, referral_l3_percent
  INTO settings_record
  FROM admin_settings 
  WHERE id = 1;
  
  IF NOT FOUND THEN
    RETURN; -- No settings found, skip commission processing
  END IF;
  
  -- Get user's referrer (L1)
  SELECT referred_by 
  INTO user_profile_record
  FROM user_profiles 
  WHERE id = user_id_param;
  
  IF NOT FOUND OR user_profile_record.referred_by IS NULL THEN
    RETURN; -- User has no referrer, skip commission processing
  END IF;
  
  -- Set up commission rates array
  commission_rates[1] := settings_record.referral_l1_percent;
  commission_rates[2] := settings_record.referral_l2_percent;
  commission_rates[3] := settings_record.referral_l3_percent;
  
  current_referrer_id := user_profile_record.referred_by;
  
  -- Process up to 3 levels of referrals
  FOR level IN 1..3 LOOP
    EXIT WHEN current_referrer_id IS NULL;
    
    commission_percent := commission_rates[level];
    
    -- L1 gets commission from both deposits and earnings
    -- L2/L3 only get commission from earnings (this is an earning, so all levels qualify)
    IF commission_percent > 0 THEN
      commission_amount := (earning_amount * commission_percent) / 100;
      
      -- Insert commission record
      INSERT INTO referral_commissions (
        referred_user_id,
        referrer_id,
        deposit_id,
        commission_amount,
        level,
        commission_percent,
        status
      ) VALUES (
        user_id_param,
        current_referrer_id,
        NULL, -- No deposit_id for earning-based commissions
        commission_amount,
        level,
        commission_percent,
        'Completed'
      );
      
      -- Update referrer's balance with commission
      PERFORM increment_user_balance(current_referrer_id, commission_amount);
      
      -- Get next level referrer
      SELECT referred_by 
      INTO next_referrer_record
      FROM user_profiles 
      WHERE id = current_referrer_id;
      
      current_referrer_id := next_referrer_record.referred_by;
    ELSE
      EXIT; -- No commission rate set, stop processing
    END IF;
  END LOOP;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
