# Pitch Room Edit Feature

## Overview
Added the ability to edit existing pitch rooms that are in "upcoming" status. This allows hosts to update room details before the session starts.

## Changes Made

### 1. **New API Function** (`src/lib/pitch-rooms.ts`)
- Added `updatePitchRoom()` function to update existing rooms
- Validates that only the host can update their rooms
- Supports updating: title, description, scheduled_date, scheduled_time, max_participants, room_type, tags

### 2. **Updated Modal Component** (`src/components/host-pitch-room-modal.tsx`)
- Added `editingRoom` prop to support both create and edit modes
- Added `useEffect` to populate form with existing room data when editing
- Updated header and button text to reflect current mode (Create vs Edit)
- Changed time input from text to `type="time"` for proper 24-hour format
- Import PitchRoom type from `@/lib/pitch-rooms`

### 3. **Updated Main Page** (`src/app/app/pitch-rooms/page.tsx`)
- Added `editingRoom` state to track which room is being edited
- Added "Edit Room" option in dropdown menu (only for upcoming rooms)
- Updated modal props to pass `editingRoom` and reset it on close
- Removed debug "Update Status" button and `lastUpdateTime` state
- Added Edit icon to imports

### 4. **Fixed Time Format Issue** (`update-pitch-room-status.sql`)
- Updated SQL function to properly handle time format
- Changed from `CONCAT(scheduled_date, ' ', scheduled_time)::timestamp` to `(scheduled_date::date + scheduled_time::time)`
- This properly combines date and time types instead of string concatenation

## Features

### Edit Room Button
- Located in the dropdown menu (3-dot icon) on hosted rooms
- **Only visible for rooms with status = 'upcoming'**
- Opens the same modal used for creating rooms, but pre-filled with existing data
- Blue styling to differentiate from destructive actions

### Modal Behavior
- **Create Mode**: Empty form, "Create Pitch Room" title, green submit button
- **Edit Mode**: Pre-filled form, "Edit Pitch Room" title, "Update Room" button
- Form resets when switching between modes
- Success toast shows appropriate message for each mode

### Dropdown Menu Order
1. **View Details** / **Manage Live Session** (gray)
2. **Edit Room** (blue) - Only for upcoming rooms
3. **Cancel Room** (orange) - Only for active rooms (not completed/cancelled)
4. **Delete Room** (red) - Always available

## Validation

### Update Permission
- Only the room host can edit the room
- Verified server-side in `updatePitchRoom()` function
- Returns error if non-host attempts to update

### Edit Restrictions
- Edit button only appears for rooms with `status = 'upcoming'`
- Cannot edit live, completed, or cancelled rooms
- This prevents changes during or after sessions

## Time Format Fix

### Problem
- Old format: Time stored as text like "9:54 PM"
- SQL function couldn't parse this format
- Rooms weren't auto-updating to "live" status

### Solution
- Changed time input to HTML5 time picker (`type="time"`)
- Automatically provides 24-hour format (e.g., "21:54:00")
- Updated SQL function to properly combine date + time types
- Now works correctly with PostgreSQL timestamp operations

### Migration Needed
For existing rooms with text-format times, run in Supabase SQL Editor:
```sql
-- Fix existing rooms with text times (e.g., "9:54 PM")
-- You'll need to manually convert each one or delete and recreate
UPDATE pitch_rooms 
SET scheduled_time = '21:54:00'  -- Convert to 24-hour format
WHERE title = 'Test Artwork';
```

## User Experience

### Creating a New Room
1. Click "Host a Pitch Room" button
2. Fill out form with room details
3. Select time using time picker (shows as 12-hour or 24-hour based on browser locale)
4. Click "Create Pitch Room"
5. Toast confirmation appears
6. Room appears in "Your Hosted Rooms" section

### Editing an Existing Room
1. Find room in "Your Hosted Rooms" section
2. Click 3-dot menu icon
3. Click "Edit Room" (only visible for upcoming rooms)
4. Modal opens with all current room data pre-filled
5. Make desired changes
6. Click "Update Room"
7. Toast confirmation appears
8. Changes reflect immediately in the room list

### What Can Be Edited
- ✅ Title
- ✅ Description
- ✅ Scheduled date
- ✅ Scheduled time
- ✅ Max participants
- ✅ Room type (Public/Private/Invite Only)
- ✅ Tags

### What Cannot Be Edited
- ❌ Host (always the creator)
- ❌ Room ID
- ❌ Creation date
- ❌ Current status (managed automatically)

## Status Management

Rooms can only be edited when status is "upcoming". Once a room transitions to other states, editing is disabled:

- **upcoming** → ✅ Can edit
- **live** → ❌ Cannot edit (can only end session)
- **completed** → ❌ Cannot edit (historical record)
- **cancelled** → ❌ Cannot edit (historical record)

## Technical Notes

### Type Safety
- Modal properly types `editingRoom` as `PitchRoom | null`
- Import PitchRoom type from `@/lib/pitch-rooms` where it's defined
- All form data properly typed

### State Management
- `editingRoom` state tracks which room is being edited
- Reset to `null` when modal closes (both cancel and save)
- Reset to `null` after successful update
- Prevents stale data when switching between create/edit modes

### Auto-Update Integration
- Time format fix ensures auto-update function works correctly
- SQL function runs every 60 seconds client-side
- Updates room status from "upcoming" to "live" when scheduled time passes
- Rooms auto-complete after 3 hours in "live" status

## Testing Checklist

- [x] Create new room with time picker
- [x] Edit existing upcoming room
- [x] Verify edit button only shows for upcoming rooms
- [x] Verify only host can edit their rooms
- [x] Verify form pre-fills with correct data
- [x] Verify changes save correctly
- [x] Verify toast messages show appropriate text
- [x] Verify time format works with auto-update
- [ ] Test with rooms at different statuses
- [ ] Test permission denial for non-hosts

## Future Enhancements

1. **Participant Limit Changes**: Notify or handle participants if max_participants reduced below current count
2. **Schedule Change Notifications**: Notify participants when date/time changes
3. **Edit History**: Track changes made to rooms
4. **Bulk Edit**: Allow editing multiple rooms at once
5. **Quick Edit**: Inline editing for simple fields like title

