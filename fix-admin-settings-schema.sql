-- Fix admin_settings table schema by adding missing columns

-- Add missing columns if they don't exist
DO $$ 
BEGIN 
    -- Add max_investment_amount column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_settings' 
        AND column_name = 'max_investment_amount'
    ) THEN
        ALTER TABLE admin_settings 
        ADD COLUMN max_investment_amount NUMERIC DEFAULT 50000;
        RAISE NOTICE 'Added max_investment_amount column';
    END IF;

    -- Add referral_l1_deposit_percent column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_settings' 
        AND column_name = 'referral_l1_deposit_percent'
    ) THEN
        ALTER TABLE admin_settings 
        ADD COLUMN referral_l1_deposit_percent NUMERIC DEFAULT 5;
        RAISE NOTICE 'Added referral_l1_deposit_percent column';
    END IF;

    -- Add min_deposit_amount column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_settings' 
        AND column_name = 'min_deposit_amount'
    ) THEN
        ALTER TABLE admin_settings 
        ADD COLUMN min_deposit_amount NUMERIC DEFAULT 500;
        RAISE NOTICE 'Added min_deposit_amount column';
    END IF;

    -- Add min_withdrawal_amount column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_settings' 
        AND column_name = 'min_withdrawal_amount'
    ) THEN
        ALTER TABLE admin_settings 
        ADD COLUMN min_withdrawal_amount NUMERIC DEFAULT 100;
        RAISE NOTICE 'Added min_withdrawal_amount column';
    END IF;

    -- Add withdrawal_fee_percent column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_settings' 
        AND column_name = 'withdrawal_fee_percent'
    ) THEN
        ALTER TABLE admin_settings 
        ADD COLUMN withdrawal_fee_percent NUMERIC DEFAULT 3;
        RAISE NOTICE 'Added withdrawal_fee_percent column';
    END IF;

    -- Add whatsapp_support_number column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_settings' 
        AND column_name = 'whatsapp_support_number'
    ) THEN
        ALTER TABLE admin_settings 
        ADD COLUMN whatsapp_support_number TEXT;
        RAISE NOTICE 'Added whatsapp_support_number column';
    END IF;

    -- Add whatsapp_group_link column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_settings' 
        AND column_name = 'whatsapp_group_link'
    ) THEN
        ALTER TABLE admin_settings 
        ADD COLUMN whatsapp_group_link TEXT;
        RAISE NOTICE 'Added whatsapp_group_link column';
    END IF;

    -- Add deposit_details column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_settings' 
        AND column_name = 'deposit_details'
    ) THEN
        ALTER TABLE admin_settings 
        ADD COLUMN deposit_details JSONB DEFAULT '{
            "bank": {
                "name": "",
                "account": "",
                "title": ""
            },
            "easypaisa": {
                "number": "",
                "title": ""
            }
        }'::jsonb;
        RAISE NOTICE 'Added deposit_details column';
    END IF;

END $$;

-- Update existing record with default values for any NULL columns
UPDATE admin_settings 
SET 
    max_investment_amount = COALESCE(max_investment_amount, 50000),
    referral_l1_deposit_percent = COALESCE(referral_l1_deposit_percent, 5),
    min_deposit_amount = COALESCE(min_deposit_amount, 500),
    min_withdrawal_amount = COALESCE(min_withdrawal_amount, 100),
    withdrawal_fee_percent = COALESCE(withdrawal_fee_percent, 3),
    deposit_details = COALESCE(deposit_details, '{
        "bank": {
            "name": "Bank Name",
            "account": "1234567890",
            "title": "Account Title"
        },
        "easypaisa": {
            "number": "03001234567",
            "title": "EasyPaisa Title"
        }
    }'::jsonb)
WHERE id = 1;

-- Insert default record if none exists
INSERT INTO admin_settings (
    id,
    referral_l1_percent,
    referral_l1_deposit_percent,
    referral_l2_percent,
    referral_l3_percent,
    min_deposit_amount,
    min_withdrawal_amount,
    withdrawal_fee_percent,
    max_investment_amount,
    whatsapp_support_number,
    whatsapp_group_link,
    deposit_details
) VALUES (
    1,
    5,
    5,
    3,
    2,
    500,
    100,
    3,
    50000,
    NULL,
    NULL,
    '{
        "bank": {
            "name": "Bank Name",
            "account": "1234567890",
            "title": "Account Title"
        },
        "easypaisa": {
            "number": "03001234567",
            "title": "EasyPaisa Title"
        }
    }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Add comments to explain columns
COMMENT ON COLUMN admin_settings.max_investment_amount IS 'Maximum investment amount allowed per transaction in PKR';
COMMENT ON COLUMN admin_settings.referral_l1_deposit_percent IS 'Commission percentage for L1 referrals on deposits';
COMMENT ON COLUMN admin_settings.min_deposit_amount IS 'Minimum deposit amount allowed in PKR';
COMMENT ON COLUMN admin_settings.min_withdrawal_amount IS 'Minimum withdrawal amount allowed in PKR';
COMMENT ON COLUMN admin_settings.withdrawal_fee_percent IS 'Fee percentage charged on withdrawals';
COMMENT ON COLUMN admin_settings.whatsapp_support_number IS 'WhatsApp support contact number';
COMMENT ON COLUMN admin_settings.whatsapp_group_link IS 'WhatsApp group invitation link';
COMMENT ON COLUMN admin_settings.deposit_details IS 'JSON object containing bank and EasyPaisa deposit details';

-- Verify all columns exist
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'admin_settings' 
ORDER BY ordinal_position;
