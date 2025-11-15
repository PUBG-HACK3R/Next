-- Update WhatsApp Support Number in Admin Settings
UPDATE admin_settings 
SET whatsapp_support_number = '+1(753)528-2586'
WHERE id = 1;

-- Verify the update
SELECT id, whatsapp_support_number FROM admin_settings WHERE id = 1;
