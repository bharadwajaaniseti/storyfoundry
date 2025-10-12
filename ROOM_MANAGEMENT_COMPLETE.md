# Pitch Room Management - Cancel & Delete Implementation

## 🎯 Features Added

### 1. **Cancel Room** (Soft Delete)
Marks a room as cancelled without permanently removing it.

**Use case:** Host wants to cancel the session but keep the record

**Restrictions:**
- ✅ Only host can cancel
- ❌ Cannot cancel completed rooms
- ✅ Can cancel upcoming or live rooms

**What happens:**
- Status changes to `'cancelled'`
- Room hidden from listings
- Participants can still see it in their history
- Data preserved for analytics

### 2. **Delete Room** (Hard Delete)
Permanently removes the room and all associated data.

**Use case:** Host wants to completely remove a room (maybe created by mistake)

**Restrictions:**
- ✅ Only host can delete
- ⚠️ Cannot be undone
- ⚠️ Deletes all participants, pitches, ratings

**What happens:**
- Room permanently deleted from database
- All related data removed (cascading delete)
- Participants lose access
- Irreversible action

---

## 🎨 User Interface

### Dropdown Menu (3-dot icon)
Instead of a simple "Manage" button, each hosted room now has a dropdown menu with:

1. **View Details / Manage Live Session**
   - Opens room details page
   - Text changes if room is live

2. **Cancel Room** (Orange - Warning)
   - Only shows for upcoming/live rooms
   - Requires confirmation dialog
   - Soft delete (keeps data)

3. **Delete Room** (Red - Danger)
   - Always available
   - Strong confirmation dialog
   - Hard delete (removes everything)

### Visual Design:
- **3-dot icon (⋮)** on the right side of each room card
- **Click to open** dropdown menu
- **Click outside** to close dropdown
- **Color-coded actions:**
  - Blue/Gray: View/Manage (safe)
  - Orange: Cancel (warning)
  - Red: Delete (danger)

---

## 🔧 API Functions

### `cancelPitchRoom(roomId)`
```typescript
// Marks room as cancelled
await cancelPitchRoom(roomId)

// Checks:
// - User must be authenticated
// - User must be the host
// - Room cannot be already completed
```

### `deletePitchRoom(roomId)`
```typescript
// Permanently deletes room
await deletePitchRoom(roomId)

// Checks:
// - User must be authenticated
// - User must be the host
// - Cascades to delete participants, pitches, ratings
```

---

## 💬 Confirmation Dialogs

### Cancel Confirmation:
```
Cancel "[Room Title]"?

This will mark the room as cancelled. Participants will be notified.

[Cancel] [OK]
```

### Delete Confirmation:
```
Delete "[Room Title]"?

This action cannot be undone. All data will be permanently removed.

[Cancel] [OK]
```

---

## 🔄 Complete Room Management Flow

```
CREATE ROOM
    ↓
UPCOMING (can cancel/delete)
    ↓
LIVE (can end/cancel/delete)
    ↓
COMPLETED (can only delete)
    ↓
CANCELLED (soft deleted, can delete)
```

### Actions Available by Status:

| Status | View | Start | End | Cancel | Delete |
|--------|------|-------|-----|--------|--------|
| Upcoming | ✅ | ✅ | ❌ | ✅ | ✅ |
| Live | ✅ | ❌ | ✅ | ✅ | ✅ |
| Completed | ✅ | ❌ | ❌ | ❌ | ✅ |
| Cancelled | ✅ | ❌ | ❌ | ❌ | ✅ |

---

## 📁 Files Modified

### 1. `src/lib/pitch-rooms.ts`
**New Functions:**
```typescript
cancelPitchRoom(roomId) // Soft delete (set status to cancelled)
deletePitchRoom(roomId) // Hard delete (remove from database)
```

### 2. `src/app/app/pitch-rooms/page.tsx`
**New Features:**
- Dropdown menu component with 3 options
- `handleCancelRoom()` - Cancel with confirmation
- `handleDeleteRoom()` - Delete with confirmation
- `openDropdownId` state for managing open dropdown
- Click-outside detection to close dropdown
- Icons: `MoreVertical`, `XCircle`, `Trash2`, `ExternalLink`

---

## 🎯 User Experience

### For Hosts:

1. **View Hosted Rooms**
   - See list of all your rooms
   - Each has a 3-dot menu (⋮)

2. **Open Menu**
   - Click the 3-dot icon
   - Dropdown appears with options

3. **View Details**
   - Click "View Details" or "Manage Live Session"
   - Opens room details page
   - Can start/end session, manage participants

4. **Cancel Room**
   - Click "Cancel Room" (orange)
   - Confirmation dialog appears
   - Room marked as cancelled
   - Hidden from listings but data preserved

5. **Delete Room**
   - Click "Delete Room" (red)
   - Strong warning in confirmation
   - Room permanently removed
   - All data deleted

### Toast Notifications:

✅ **Success:**
- "Room cancelled - The pitch room has been cancelled"
- "Room deleted - The pitch room has been permanently deleted"

❌ **Error:**
- "Failed to cancel room - [error message]"
- "Failed to delete room - [error message]"
- "Only the host can cancel the room"
- "Cannot cancel a completed session"

---

## 🔒 Security & Authorization

### Authorization Checks:
```typescript
// Both cancel and delete verify:
1. User is authenticated
2. User ID matches room's host_id
3. Throw error if unauthorized
```

### Database RLS:
- Existing RLS policies allow hosts to update their rooms
- Existing RLS policies allow hosts to delete their rooms
- No additional policies needed

---

## 🎨 Visual Indicators

### Dropdown Menu Styling:
```
┌─────────────────────────┐
│ 🔗 View Details         │ ← Gray/Blue (safe)
│ ⊗  Cancel Room          │ ← Orange (warning)
│ 🗑️  Delete Room          │ ← Red (danger)
└─────────────────────────┘
```

### Hover States:
- View Details: `hover:bg-gray-100`
- Cancel Room: `hover:bg-orange-50`
- Delete Room: `hover:bg-red-50`

---

## 📊 Database Impact

### Cancel Operation:
```sql
UPDATE pitch_rooms
SET status = 'cancelled', updated_at = NOW()
WHERE id = $roomId AND host_id = $userId;

-- No data deleted, just status change
```

### Delete Operation:
```sql
DELETE FROM pitch_rooms
WHERE id = $roomId AND host_id = $userId;

-- Cascades to delete:
-- - pitch_room_participants
-- - pitch_room_pitches
-- - pitch_room_ratings
```

---

## ✨ Summary

You can now **fully manage your pitch rooms**:

✅ **View** - Navigate to room details page
✅ **Start** - Begin a session (from details page)
✅ **End** - Complete a session (from details page)
✅ **Cancel** - Soft delete (keep history, hide from listings)
✅ **Delete** - Hard delete (permanent removal)

All actions:
- ✅ Require confirmation
- ✅ Check authorization (host only)
- ✅ Show toast notifications
- ✅ Refresh data automatically
- ✅ Have clear visual indicators (color-coding)

The dropdown menu provides a clean, organized way to manage all room actions in one place! 🎉
