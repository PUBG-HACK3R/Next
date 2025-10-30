-- Add announcement settings to admin_settings table
ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS announcement_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS announcement_title VARCHAR(255) DEFAULT 'Announcement',
ADD COLUMN IF NOT EXISTS announcement_text TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS announcement_type VARCHAR(50) DEFAULT 'info'; -- info, warning, success, error

-- Update the existing record with default announcement settings
UPDATE admin_settings 
SET 
    announcement_enabled = false,
    announcement_title = 'Welcome to SmartGrow!',
    announcement_text = 'Start your investment journey with our secure and profitable mining plans.',
    announcement_type = 'info'
WHERE id = 1;
