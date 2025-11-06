-- Restore proper withdrawal time restrictions for production

-- 1. Restore the original withdrawal function
CREATE OR REPLACE FUNCTION is_withdrawal_allowed()
RETURNS BOOLEAN AS $$
DECLARE
    current_time_pk TIME;
    current_day TEXT;
    start_time TIME DEFAULT '11:00:00';
    end_time TIME DEFAULT '20:00:00';
    allowed_days TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    withdrawal_enabled BOOLEAN DEFAULT TRUE;
    auto_schedule BOOLEAN DEFAULT TRUE;
BEGIN
    -- Get admin settings
    SELECT 
        withdrawal_enabled, 
        withdrawal_start_time, 
        withdrawal_end_time,
        string_to_array(withdrawal_days_enabled, ','),
        withdrawal_auto_schedule
    INTO 
        withdrawal_enabled, 
        start_time, 
        end_time, 
        allowed_days,
        auto_schedule
    FROM admin_settings 
    WHERE id = 1;
    
    -- If withdrawals are disabled by admin
    IF NOT withdrawal_enabled THEN
        RETURN FALSE;
    END IF;
    
    -- If auto schedule is disabled, allow 24/7
    IF NOT auto_schedule THEN
        RETURN TRUE;
    END IF;
    
    -- Get current Pakistan time
    current_time_pk := (NOW() AT TIME ZONE 'Asia/Karachi')::TIME;
    current_day := LOWER(TO_CHAR(NOW() AT TIME ZONE 'Asia/Karachi', 'Day'));
    current_day := TRIM(current_day);
    
    -- Check if current day is allowed
    IF NOT (current_day = ANY(allowed_days)) THEN
        RETURN FALSE;
    END IF;
    
    -- Check if current time is within allowed hours
    IF current_time_pk >= start_time AND current_time_pk <= end_time THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
