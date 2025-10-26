-- Add WhatsApp support number to admin_settings table
-- This migration adds customer support functionality

-- Add WhatsApp support number column to admin_settings table
ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS whatsapp_support_number TEXT;

-- Add WhatsApp group link column to admin_settings table
ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS whatsapp_group_link TEXT;

-- Add missing columns that might be needed
ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS min_deposit_amount INTEGER DEFAULT 500;

ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS min_withdrawal_amount INTEGER DEFAULT 100;

ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS withdrawal_fee_percent DECIMAL(5,2) DEFAULT 3.0;

-- Update existing admin_settings record with default values if it exists
UPDATE admin_settings 
SET 
    min_deposit_amount = COALESCE(min_deposit_amount, 500),
    min_withdrawal_amount = COALESCE(min_withdrawal_amount, 100),
    withdrawal_fee_percent = COALESCE(withdrawal_fee_percent, 3.0),
    whatsapp_support_number = COALESCE(whatsapp_support_number, NULL),
    whatsapp_group_link = COALESCE(whatsapp_group_link, NULL)
WHERE id = 1;

-- Insert default admin_settings record if it doesn't exist
INSERT INTO admin_settings (
    id,
    referral_l1_percent,
    referral_l2_percent,
    referral_l3_percent,
    min_deposit_amount,
    min_withdrawal_amount,
    withdrawal_fee_percent,
    whatsapp_support_number,
    whatsapp_group_link,
    deposit_details
)
SELECT 
    1,
    5.0,
    3.0,
    2.0,
    500,
    100,
    3.0,
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
            "title": "Account Title"
        }
    }'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM admin_settings WHERE id = 1);

-- Add comments to the table
COMMENT ON COLUMN admin_settings.whatsapp_support_number IS 'WhatsApp number for customer support (include country code, e.g., +923001234567)';
COMMENT ON COLUMN admin_settings.whatsapp_group_link IS 'WhatsApp group invitation link for users to join community group';
