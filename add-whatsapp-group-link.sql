-- Add WhatsApp Group Link to admin_settings table
-- This migration adds WhatsApp group functionality for user community

-- Add WhatsApp group link column to admin_settings table
ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS whatsapp_group_link TEXT;

-- Update existing admin_settings record with default value if it exists
UPDATE admin_settings 
SET whatsapp_group_link = COALESCE(whatsapp_group_link, NULL)
WHERE id = 1;

-- Insert default admin_settings record if it doesn't exist (with group link field)
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

-- Add comment to the new column
COMMENT ON COLUMN admin_settings.whatsapp_group_link IS 'WhatsApp group invitation link for users to join community group (e.g., https://chat.whatsapp.com/...)';

-- Verify the column was added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'admin_settings' 
AND column_name = 'whatsapp_group_link';
