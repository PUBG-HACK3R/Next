-- Withdrawal Time Restrictions System
-- Allows withdrawals from 11 AM to 8 PM Pakistani time, Monday to Saturday
-- Includes admin override functionality

-- Add withdrawal settings to admin_settings table
ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS withdrawal_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS withdrawal_start_time TIME DEFAULT '11:00:00',
ADD COLUMN IF NOT EXISTS withdrawal_end_time TIME DEFAULT '20:00:00',
ADD COLUMN IF NOT EXISTS withdrawal_days_enabled TEXT DEFAULT 'monday,tuesday,wednesday,thursday,friday,saturday',
ADD COLUMN IF NOT EXISTS withdrawal_timezone TEXT DEFAULT 'Asia/Karachi',
ADD COLUMN IF NOT EXISTS withdrawal_auto_schedule BOOLEAN DEFAULT TRUE;

-- Update admin_settings with default values
UPDATE admin_settings SET 
    withdrawal_enabled = TRUE,
    withdrawal_start_time = '11:00:00',
    withdrawal_end_time = '20:00:00',
    withdrawal_days_enabled = 'monday,tuesday,wednesday,thursday,friday,saturday',
    withdrawal_timezone = 'Asia/Karachi',
    withdrawal_auto_schedule = TRUE
WHERE id = 1;

-- Function to check if withdrawals are currently allowed
CREATE OR REPLACE FUNCTION is_withdrawal_allowed()
RETURNS BOOLEAN AS $$
DECLARE
    settings RECORD;
    current_time_pk TIME;
    current_day_pk TEXT;
    allowed_days TEXT[];
    is_day_allowed BOOLEAN := FALSE;
    is_time_allowed BOOLEAN := FALSE;
BEGIN
    -- Get withdrawal settings
    SELECT 
        withdrawal_enabled,
        withdrawal_start_time,
        withdrawal_end_time,
        withdrawal_days_enabled,
        withdrawal_auto_schedule
    INTO settings
    FROM admin_settings 
    WHERE id = 1;
    
    -- If withdrawals are manually disabled by admin, return false
    IF NOT settings.withdrawal_enabled THEN
        RETURN FALSE;
    END IF;
    
    -- If auto schedule is disabled, allow withdrawals (manual control only)
    IF NOT settings.withdrawal_auto_schedule THEN
        RETURN TRUE;
    END IF;
    
    -- Get current time in Pakistani timezone
    current_time_pk := (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Karachi')::TIME;
    current_day_pk := LOWER(TO_CHAR(NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Karachi', 'Day'));
    current_day_pk := TRIM(current_day_pk);
    
    -- Parse allowed days
    allowed_days := STRING_TO_ARRAY(settings.withdrawal_days_enabled, ',');
    
    -- Check if current day is allowed
    SELECT TRUE INTO is_day_allowed
    FROM UNNEST(allowed_days) AS day
    WHERE TRIM(day) = current_day_pk;
    
    -- If day is not allowed, return false
    IF NOT COALESCE(is_day_allowed, FALSE) THEN
        RETURN FALSE;
    END IF;
    
    -- Check if current time is within allowed hours
    IF current_time_pk >= settings.withdrawal_start_time 
       AND current_time_pk <= settings.withdrawal_end_time THEN
        is_time_allowed := TRUE;
    END IF;
    
    RETURN COALESCE(is_time_allowed, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Function to get withdrawal status with detailed information
CREATE OR REPLACE FUNCTION get_withdrawal_status()
RETURNS JSON AS $$
DECLARE
    settings RECORD;
    current_time_pk TIME;
    current_day_pk TEXT;
    current_datetime_pk TIMESTAMP;
    allowed_days TEXT[];
    is_allowed BOOLEAN;
    next_available_time TIMESTAMP;
    status_info JSON;
BEGIN
    -- Get withdrawal settings
    SELECT 
        withdrawal_enabled,
        withdrawal_start_time,
        withdrawal_end_time,
        withdrawal_days_enabled,
        withdrawal_auto_schedule,
        withdrawal_timezone
    INTO settings
    FROM admin_settings 
    WHERE id = 1;
    
    -- Get current Pakistani time
    current_datetime_pk := NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Karachi';
    current_time_pk := current_datetime_pk::TIME;
    current_day_pk := LOWER(TO_CHAR(current_datetime_pk, 'Day'));
    current_day_pk := TRIM(current_day_pk);
    
    -- Check if withdrawals are allowed
    is_allowed := is_withdrawal_allowed();
    
    -- Calculate next available time if not currently allowed
    IF NOT is_allowed AND settings.withdrawal_auto_schedule THEN
        -- Find next available day and time
        FOR i IN 0..7 LOOP
            DECLARE
                check_date DATE;
                check_day TEXT;
                check_datetime TIMESTAMP;
            BEGIN
                check_date := (current_datetime_pk + (i || ' days')::INTERVAL)::DATE;
                check_day := LOWER(TO_CHAR(check_date, 'Day'));
                check_day := TRIM(check_day);
                
                -- Check if this day is in allowed days
                IF check_day = ANY(STRING_TO_ARRAY(settings.withdrawal_days_enabled, ',')) THEN
                    check_datetime := check_date + settings.withdrawal_start_time;
                    
                    -- If it's today, make sure we're not past the end time
                    IF i = 0 AND current_time_pk > settings.withdrawal_end_time THEN
                        CONTINUE;
                    END IF;
                    
                    -- If it's today and we're before start time, use start time
                    IF i = 0 AND current_time_pk < settings.withdrawal_start_time THEN
                        next_available_time := current_datetime_pk::DATE + settings.withdrawal_start_time;
                        EXIT;
                    END IF;
                    
                    -- For future days, use start time
                    IF i > 0 THEN
                        next_available_time := check_datetime;
                        EXIT;
                    END IF;
                END IF;
            END;
        END LOOP;
    END IF;
    
    -- Build status JSON
    status_info := JSON_BUILD_OBJECT(
        'withdrawal_allowed', is_allowed,
        'manual_override', NOT settings.withdrawal_auto_schedule,
        'admin_disabled', NOT settings.withdrawal_enabled,
        'current_time_pk', current_datetime_pk,
        'current_day', current_day_pk,
        'allowed_days', STRING_TO_ARRAY(settings.withdrawal_days_enabled, ','),
        'allowed_hours', JSON_BUILD_OBJECT(
            'start', settings.withdrawal_start_time,
            'end', settings.withdrawal_end_time
        ),
        'next_available_time', next_available_time,
        'timezone', settings.withdrawal_timezone
    );
    
    RETURN status_info;
END;
$$ LANGUAGE plpgsql;

-- Function for admin to toggle withdrawal availability
CREATE OR REPLACE FUNCTION admin_toggle_withdrawals(enabled BOOLEAN)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE admin_settings 
    SET withdrawal_enabled = enabled
    WHERE id = 1;
    
    RETURN enabled;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for admin to toggle auto schedule
CREATE OR REPLACE FUNCTION admin_toggle_withdrawal_schedule(auto_enabled BOOLEAN)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE admin_settings 
    SET withdrawal_auto_schedule = auto_enabled
    WHERE id = 1;
    
    RETURN auto_enabled;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update withdrawal time settings
CREATE OR REPLACE FUNCTION admin_update_withdrawal_times(
    start_time TIME,
    end_time TIME,
    allowed_days TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE admin_settings 
    SET 
        withdrawal_start_time = start_time,
        withdrawal_end_time = end_time,
        withdrawal_days_enabled = allowed_days
    WHERE id = 1;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to check withdrawal time before allowing withdrawal requests
CREATE OR REPLACE FUNCTION check_withdrawal_time_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Only check for new withdrawal requests
    IF TG_OP = 'INSERT' THEN
        -- Check if withdrawals are currently allowed
        IF NOT is_withdrawal_allowed() THEN
            RAISE EXCEPTION 'Withdrawals are not available at this time. Please check withdrawal hours: 11 AM - 8 PM (Monday to Saturday, Pakistani time)';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on withdrawals table
DROP TRIGGER IF EXISTS withdrawal_time_check ON withdrawals;
CREATE TRIGGER withdrawal_time_check
    BEFORE INSERT ON withdrawals
    FOR EACH ROW EXECUTE FUNCTION check_withdrawal_time_trigger();

-- Create withdrawal_logs table to track admin actions
CREATE TABLE IF NOT EXISTS withdrawal_logs (
    id SERIAL PRIMARY KEY,
    admin_id UUID REFERENCES user_profiles(id),
    action TEXT NOT NULL, -- 'enabled', 'disabled', 'schedule_enabled', 'schedule_disabled', 'time_updated'
    old_value TEXT,
    new_value TEXT,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to log admin withdrawal actions
CREATE OR REPLACE FUNCTION log_withdrawal_admin_action(
    admin_user_id UUID,
    action_type TEXT,
    old_val TEXT DEFAULT NULL,
    new_val TEXT DEFAULT NULL,
    reason_text TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO withdrawal_logs (admin_id, action, old_value, new_value, reason)
    VALUES (admin_user_id, action_type, old_val, new_val, reason_text);
END;
$$ LANGUAGE plpgsql;

-- Row Level Security for withdrawal_logs
ALTER TABLE withdrawal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view withdrawal logs" ON withdrawal_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_level >= 999
        )
    );

CREATE POLICY "Admins can insert withdrawal logs" ON withdrawal_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_level >= 999
        )
    );
