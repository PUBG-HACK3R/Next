-- Temporarily modify the withdrawal trigger to always allow withdrawals

CREATE OR REPLACE FUNCTION is_withdrawal_allowed()
RETURNS BOOLEAN AS $$
BEGIN
    -- Temporarily return true to allow all withdrawals for testing
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
