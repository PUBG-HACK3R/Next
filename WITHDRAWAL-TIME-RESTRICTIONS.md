# Withdrawal Time Restrictions System

## Overview
The Withdrawal Time Restrictions system automatically controls when users can make withdrawal requests based on Pakistani time zones and business hours. The system allows withdrawals from **11 AM to 8 PM, Monday to Saturday** (Pakistani time) with admin override capabilities.

## Features Implemented

### 1. Database Schema (`add-withdrawal-time-restrictions.sql`)
- **Withdrawal settings** in `admin_settings` table
- **Automatic time checking** functions
- **Admin control functions** for manual override
- **Withdrawal logs** for tracking admin actions
- **Database triggers** to prevent withdrawals outside allowed times

### 2. API Endpoints
- **GET `/api/withdrawal/status`** - Check current withdrawal availability
- **POST `/api/withdrawal/status`** - Admin actions (toggle, update times)

### 3. React Components
- **`WithdrawalStatus`** - Shows current availability and schedule
- **`AdminWithdrawalSettings`** - Admin panel for managing settings

### 4. Updated Withdrawal Page
- **Real-time status display** showing availability
- **Form disabled** when withdrawals not allowed
- **Clear messaging** about withdrawal schedule

## System Configuration

### Default Settings
```sql
withdrawal_enabled: TRUE                    -- Master switch
withdrawal_start_time: '11:00:00'          -- 11 AM Pakistani time
withdrawal_end_time: '20:00:00'            -- 8 PM Pakistani time
withdrawal_days_enabled: 'monday,tuesday,wednesday,thursday,friday,saturday'
withdrawal_timezone: 'Asia/Karachi'        -- Pakistani timezone
withdrawal_auto_schedule: TRUE             -- Enable automatic restrictions
```

### Time Zone Handling
- All times are converted to **Pakistani Standard Time (PKT)**
- Uses `Asia/Karachi` timezone for calculations
- Automatic daylight saving time handling

## Database Functions

### `is_withdrawal_allowed()`
Returns `BOOLEAN` indicating if withdrawals are currently allowed.

**Logic:**
1. Check if admin has disabled withdrawals (`withdrawal_enabled = FALSE`)
2. If auto schedule is disabled, allow withdrawals (manual control only)
3. Check current Pakistani time against allowed hours
4. Check current Pakistani day against allowed days
5. Return `TRUE` only if all conditions are met

### `get_withdrawal_status()`
Returns detailed `JSON` with withdrawal status information:
```json
{
  "withdrawal_allowed": true/false,
  "manual_override": true/false,
  "admin_disabled": true/false,
  "current_time_pk": "2024-01-15T14:30:00+05:00",
  "current_day": "monday",
  "allowed_days": ["monday", "tuesday", ...],
  "allowed_hours": {
    "start": "11:00:00",
    "end": "20:00:00"
  },
  "next_available_time": "2024-01-16T11:00:00+05:00",
  "timezone": "Asia/Karachi"
}
```

### Admin Functions

#### `admin_toggle_withdrawals(enabled BOOLEAN)`
Master switch to enable/disable all withdrawals.

#### `admin_toggle_withdrawal_schedule(auto_enabled BOOLEAN)`
Toggle automatic time restrictions:
- `TRUE`: Enforce time/day restrictions
- `FALSE`: Allow 24/7 withdrawals (when enabled)

#### `admin_update_withdrawal_times(start_time, end_time, allowed_days)`
Update withdrawal schedule settings.

## Admin Control Panel

### Features
1. **Master Toggle** - Enable/disable all withdrawals
2. **Auto Schedule Toggle** - Enable/disable time restrictions
3. **Time Settings** - Configure allowed hours and days
4. **Reason Logging** - Track why changes were made
5. **Current Status Display** - Show active configuration

### Usage
```typescript
// Toggle withdrawals
await fetch('/api/withdrawal/status', {
  method: 'POST',
  body: JSON.stringify({
    action: 'toggle_withdrawals',
    enabled: false,
    reason: 'System maintenance'
  })
})

// Update schedule
await fetch('/api/withdrawal/status', {
  method: 'POST',
  body: JSON.stringify({
    action: 'update_times',
    start_time: '10:00:00',
    end_time: '21:00:00',
    allowed_days: 'monday,tuesday,wednesday,thursday,friday,saturday,sunday'
  })
})
```

## User Experience

### Withdrawal Page Features
1. **Status Display** - Shows current availability with detailed information
2. **Real-time Updates** - Status refreshes every 5 minutes
3. **Form Disabled** - Inputs disabled when withdrawals not allowed
4. **Clear Messaging** - Explains when withdrawals will be available next
5. **Visual Indicators** - Color-coded status (green/red)

### Status Messages
- ✅ **"Withdrawals Available"** - Can make withdrawals now
- ❌ **"Withdrawals Not Available"** - Outside allowed hours/days
- ⚠️ **"Temporarily Disabled by Admin"** - Manual override active
- 🔄 **"Manual Override Active"** - 24/7 availability enabled

## Error Handling

### Database Trigger Protection
When users try to submit withdrawals outside allowed times:
```sql
RAISE EXCEPTION 'Withdrawals are not available at this time. Please check withdrawal hours: 11 AM - 8 PM (Monday to Saturday, Pakistani time)';
```

### Frontend Validation
- Form disabled when withdrawals not allowed
- Clear error messages with next available time
- Real-time status updates prevent stale information

## Logging and Audit Trail

### Admin Actions Logged
All admin changes are recorded in `withdrawal_logs` table:
- **Action type** (enabled, disabled, schedule_enabled, etc.)
- **Old and new values**
- **Admin user ID**
- **Reason for change**
- **Timestamp**

### Log Types
- `enabled` / `disabled` - Master switch changes
- `schedule_enabled` / `schedule_disabled` - Auto schedule changes
- `time_updated` - Schedule time/day changes

## Installation Steps

1. **Run Database Migration**:
   ```sql
   \i add-withdrawal-time-restrictions.sql
   ```

2. **Deploy Components**:
   - `WithdrawalStatus.tsx` - User status display
   - `AdminWithdrawalSettings.tsx` - Admin control panel

3. **Update Withdrawal Page**:
   - Import and use `WithdrawalStatus` component
   - Add withdrawal availability checks

4. **Configure Settings** (Optional):
   ```sql
   UPDATE admin_settings SET 
       withdrawal_start_time = '10:00:00',
       withdrawal_end_time = '22:00:00',
       withdrawal_days_enabled = 'monday,tuesday,wednesday,thursday,friday,saturday,sunday'
   WHERE id = 1;
   ```

## Testing

### Test Scenarios
1. **Time Restrictions** - Try withdrawals outside 11 AM - 8 PM
2. **Day Restrictions** - Try withdrawals on Sunday
3. **Admin Override** - Disable auto schedule, verify 24/7 access
4. **Master Disable** - Turn off withdrawals completely
5. **Timezone Handling** - Verify Pakistani time calculations

### Manual Testing
```sql
-- Check current status
SELECT get_withdrawal_status();

-- Test withdrawal attempt
SELECT is_withdrawal_allowed();

-- Simulate different times (for testing)
-- Note: This requires temporarily modifying the function
```

## Security Features

- **Row Level Security** enabled on all new tables
- **Admin-only functions** with `SECURITY DEFINER`
- **Audit logging** for all admin actions
- **Input validation** on all parameters
- **Timezone safety** prevents manipulation

## Future Enhancements

1. **Holiday Calendar** - Disable withdrawals on Pakistani holidays
2. **Different Schedules** - VIP users with extended hours
3. **Notification System** - Alert users when withdrawals become available
4. **Mobile App Integration** - Push notifications for availability
5. **Analytics Dashboard** - Track withdrawal patterns and peak times

## Support

### For Users
- Withdrawal status is displayed on the withdrawal page
- Contact support via WhatsApp for urgent withdrawal needs
- Check the schedule for next available withdrawal time

### For Admins
- Use the admin panel to manage withdrawal settings
- All changes are logged for audit purposes
- Emergency override available for urgent situations

The withdrawal time restrictions system is now fully functional and provides both automatic scheduling and manual admin control for optimal flexibility and security!
