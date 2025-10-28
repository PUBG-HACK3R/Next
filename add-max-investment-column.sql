-- Add missing max_investment_amount column to admin_settings table

-- Check if the column exists before adding it
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_settings' 
        AND column_name = 'max_investment_amount'
    ) THEN
        ALTER TABLE admin_settings 
        ADD COLUMN max_investment_amount NUMERIC DEFAULT 50000;
        
        -- Update existing record with default value
        UPDATE admin_settings 
        SET max_investment_amount = 50000 
        WHERE id = 1 AND max_investment_amount IS NULL;
        
        RAISE NOTICE 'Added max_investment_amount column to admin_settings table';
    ELSE
        RAISE NOTICE 'max_investment_amount column already exists';
    END IF;
END $$;

-- Add comment to explain the column
COMMENT ON COLUMN admin_settings.max_investment_amount IS 'Maximum investment amount allowed per transaction in PKR';

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'admin_settings' 
AND column_name = 'max_investment_amount';
