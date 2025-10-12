# Past & Completed Rooms Feature

## Overview
Added a new section to display completed and cancelled pitch rooms, allowing users to review past sessions and see the history of pitch rooms they participated in or hosted.

## Changes Made

### 1. **New API Function** (`src/lib/pitch-rooms.ts`)
- Added `getPastPitchRooms()` function to fetch completed and cancelled rooms
- Returns last 20 past rooms sorted by date (most recent first)
- Includes participant counts and user participation status
- Filters for rooms with status `'completed'` or `'cancelled'`

### 2. **Updated Hosted Rooms Function** (`src/lib/pitch-rooms.ts`)
- Modified `getMyHostedRooms()` to include `'live'` status rooms
- Now filters for `['upcoming', 'live']` instead of just `'upcoming'`
- This keeps active/current rooms in "My Hosted Rooms" section
- Completed/cancelled hosted rooms appear in "Past & Completed Rooms" section

### 3. **Updated Main Page** (`src/app/app/pitch-rooms/page.tsx`)
- Added `pastRooms` state variable
- Added `getPastPitchRooms` to imports
- Updated `loadData()` to fetch past rooms in parallel with other data
- Added new "Past & Completed Rooms" section in the UI

## Features

### Past & Completed Rooms Section

**Location**: Displayed after "My Hosted Rooms" section

**Visual Design**:
- Semi-transparent cards (`opacity-75`) that become fully opaque on hover
- Status badges:
  - ✓ **Completed** - Green badge for successfully completed rooms
  - ✕ **Cancelled** - Gray badge for cancelled rooms
- Shows room details: title, description, date, time, participant count
- Displays host information for rooms you didn't host
- Simple "View Details" button instead of dropdown menu

**Room Information Displayed**:
1. Room title and status badge
2. Description
3. Scheduled date and time
4. Total participant count (no max limit shown)
5. Host name (for rooms you didn't host)
6. View Details button

**Empty State**:
- Calendar icon
- "No past rooms" message
- Helpful text: "Completed and cancelled rooms will appear here"

### Status Badges

**Completed Rooms**:
```
✓ Completed
- Green background (#10B981)
- Indicates room was successfully completed
- Usually auto-completed 3 hours after going live
- Or manually ended by host
```

**Cancelled Rooms**:
```
✕ Cancelled
- Gray background
- Indicates room was cancelled before starting
- Can be cancelled by host before scheduled time
```

### Room Distribution

**Upcoming Pitch Rooms**:
- Shows rooms with status `'upcoming'` that aren't hosted by you
- Filters out past-time rooms for non-participants
- Public rooms anyone can join

**My Hosted Rooms**:
- Shows your rooms with status `'upcoming'` or `'live'`
- Active rooms you're currently managing
- Includes dropdown menu for Edit/Cancel/Delete actions

**Past & Completed Rooms**:
- Shows ALL past rooms (yours and others)
- Rooms with status `'completed'` or `'cancelled'`
- Limited to last 20 rooms
- Sorted by date (newest first)
- Read-only view (no edit/delete actions)

## Data Flow

### Load Sequence
```javascript
const [upcoming, hosted, past, statistics] = await Promise.all([
  getUpcomingPitchRooms(),    // Public upcoming rooms
  getMyHostedRooms(),          // Your active rooms
  getPastPitchRooms(),         // All past rooms
  getPitchRoomStats()          // Statistics
])
```

### Room Lifecycle

1. **Created** → Status: `upcoming` → Appears in "My Hosted Rooms" and "Upcoming Pitch Rooms"
2. **Time Passed** → Auto-update runs → Status: `live` → Still in "My Hosted Rooms"
3. **Session Ended** → Manual or auto → Status: `completed` → Moves to "Past & Completed Rooms"
4. **Cancelled** → Manual action → Status: `cancelled` → Moves to "Past & Completed Rooms"

## SQL Query Details

### getPastPitchRooms()
```typescript
.from('pitch_rooms')
.select('*, host:profiles!...')
.in('status', ['completed', 'cancelled'])
.order('scheduled_date', { ascending: false })
.limit(20)
```

**Features**:
- Joins with profiles table to get host information
- Orders by scheduled date descending (newest first)
- Limits to 20 rooms to prevent performance issues
- Includes participant count via RPC function
- Checks if current user was a participant

### getMyHostedRooms() (Updated)
```typescript
.from('pitch_rooms')
.select('*, host:profiles!...')
.eq('host_id', user.id)
.in('status', ['upcoming', 'live'])  // Changed from just 'upcoming'
.order('scheduled_date', { ascending: true })
```

## User Experience

### Viewing Past Rooms

1. Scroll down to "Past & Completed Rooms" section
2. See list of recently completed/cancelled rooms
3. Hover over cards to see full opacity
4. Click "View Details" to see full room information
5. On room details page, can still see all participants, pitches, etc.

### Status Transitions

**Upcoming → Live**:
- Happens automatically when scheduled time passes
- Or manually via "Start Session" button
- Remains in "My Hosted Rooms" section

**Live → Completed**:
- Happens automatically 3 hours after starting
- Or manually via "End Session" button
- Moves from "My Hosted Rooms" to "Past & Completed Rooms"

**Upcoming → Cancelled**:
- Manual action by host
- Via "Cancel Room" in dropdown menu
- Immediately moves to "Past & Completed Rooms"

## Benefits

### For Participants
- Review past rooms they attended
- See which rooms were completed vs cancelled
- Access historical session information
- Track their pitch room participation history

### For Hosts
- Archive of completed sessions
- See which rooms were successful
- Reference for planning future rooms
- Historical data for analytics

### For Platform
- Provides historical context
- Shows platform activity
- Enables future features (ratings, reviews, replays)
- Data for success metrics

## Performance Considerations

### Pagination
- Limited to 20 most recent rooms
- Prevents loading too much data at once
- Can be expanded with "Load More" button in future

### Parallel Loading
- Past rooms load simultaneously with other data
- Uses `Promise.all()` for efficiency
- Doesn't block rendering of other sections

### Participant Counts
- Uses RPC function for efficient counting
- Bypasses RLS with SECURITY DEFINER
- Single query per room (could be optimized with batch query)

## Future Enhancements

1. **Pagination**: "Load More" button to show older rooms
2. **Filters**: Filter by status (completed/cancelled), date range, host
3. **Search**: Search past rooms by title or description
4. **Statistics**: Show success rate, average participants, etc.
5. **Export**: Download CSV of past rooms
6. **Reviews**: Allow participants to rate/review completed rooms
7. **Replays**: Watch recordings of past sessions (if recorded)
8. **Analytics**: Detailed insights on past room performance

## Testing Checklist

- [x] Past rooms display correctly
- [x] Status badges show appropriate colors
- [x] Completed rooms have green badge
- [x] Cancelled rooms have gray badge
- [x] View Details button navigates correctly
- [x] Host information displays for non-hosted rooms
- [x] Participant count shows correctly
- [x] Empty state displays when no past rooms
- [x] Loading state shows while fetching
- [ ] Test with 20+ past rooms (pagination needed)
- [ ] Verify performance with many rooms

## Notes

- Past rooms are read-only (no edit/delete actions)
- Both your hosted rooms and rooms you participated in appear here
- Rooms are sorted by scheduled date, not completion date
- Limit of 20 rooms prevents performance issues
- Host information shown to provide context for non-hosted rooms

