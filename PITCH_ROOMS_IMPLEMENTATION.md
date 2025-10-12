# Pitch Rooms Feature - Implementation Guide

## Overview
The Pitch Rooms feature allows writers to host and join virtual pitch sessions where they can present their projects to industry professionals and fellow creators.

## What's Been Implemented

### ✅ 1. Database Schema (`create-pitch-rooms-schema.sql`)

**Tables Created:**
- `pitch_rooms` - Stores pitch room information (title, description, schedule, host, status)
- `pitch_room_participants` - Tracks who has joined each room
- `pitch_room_pitches` - Stores project pitches submitted to rooms
- `pitch_room_ratings` - Stores feedback and ratings on pitches

**Key Features:**
- Row Level Security (RLS) policies for all tables
- Automatic participant counting
- Automatic rating calculation for pitches
- Indexes for performance optimization
- Triggers for updating timestamps and ratings

### ✅ 2. API Functions (`src/lib/pitch-rooms.ts`)

**Available Functions:**
- `getUpcomingPitchRooms()` - Fetch all upcoming public rooms with participant counts
- `getMyHostedRooms()` - Get rooms hosted by current user
- `getRoomParticipantCount()` - Get number of participants in a room
- `isUserParticipant()` - Check if user has joined a room
- `createPitchRoom()` - Create a new pitch room
- `joinPitchRoom()` - Join a room as participant
- `leavePitchRoom()` - Leave a room
- `getRoomParticipants()` - Get list of all participants
- `submitPitch()` - Submit a project pitch to a room
- `getRoomPitches()` - Get all pitches in a room
- `getPitchRoomStats()` - Get weekly statistics

### ✅ 3. Updated Pitch Rooms Page (`src/app/app/pitch-rooms/page.tsx`)

**Features:**
- Real-time loading of upcoming pitch rooms
- Display of user's hosted rooms
- Join/Leave functionality with loading states
- Participant count tracking
- Room status indicators (Open/Full)
- Weekly statistics sidebar
- Responsive design
- Error handling with toast notifications

## Installation Steps

### Step 1: Apply Database Schema

You need to run the SQL schema in your Supabase project:

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Open the file `create-pitch-rooms-schema.sql`
4. Copy all contents
5. Paste into Supabase SQL Editor
6. Click **Run** to execute all statements

**What this creates:**
- 4 new tables with proper relationships
- RLS policies for security
- Helper functions for counting and ratings
- Triggers for automatic updates

### Step 2: Verify Installation

Run this query in SQL Editor to verify tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'pitch_%';
```

You should see:
- pitch_rooms
- pitch_room_participants  
- pitch_room_pitches
- pitch_room_ratings

### Step 3: Create Test Data (Optional)

To test the feature, create some sample rooms:

```sql
-- Insert a test pitch room
INSERT INTO pitch_rooms (
  title,
  description,
  host_id,
  scheduled_date,
  scheduled_time,
  max_participants,
  status
) VALUES (
  'Sci-Fi & Fantasy Showcase',
  'Present your science fiction and fantasy projects to industry professionals',
  'YOUR_USER_ID_HERE', -- Replace with your actual user ID
  '2025-01-15',
  '2:00 PM PST',
  15,
  'upcoming'
);
```

## Features & Usage

### For Participants

**Browse Rooms:**
- View all upcoming pitch rooms on the main page
- See participant counts, schedule, and host information
- Filter by tags (future enhancement)

**Join a Room:**
- Click "Join Room" button
- System checks if room is full
- Automatically added to participants list
- Can leave at any time

**Submit a Pitch:**
- Must be a participant first
- Select a project from your library
- Submit for presentation in the room

### For Hosts

**Create a Room:**
- Click "Host a Pitch Room" (to be implemented)
- Fill in title, description, schedule
- Set max participants
- Choose room type (public/private/invite-only)

**Manage Room:**
- View participants list
- Approve pitch submissions
- Set pitch order
- Update room details

## Next Steps

### 🔨 To Do:

1. **Create Host Room Modal/Form**
   - Form to create new pitch rooms
   - Date/time picker
   - Max participants input
   - Room type selection
   - Tags input

2. **Pitch Submission Feature**
   - Modal to select project from user's library
   - Submit pitch to joined room
   - View submitted pitches

3. **Real-time Updates**
   - Supabase real-time subscriptions
   - Live participant count updates
   - New room notifications

4. **Room Details Page**
   - Dedicated page for each room (`/app/pitch-rooms/[id]`)
   - Participant list
   - Pitch queue
   - Chat/discussion (future)

5. **Video Integration** (Future)
   - Integration with video conferencing
   - Screen sharing for presentations
   - Recording capabilities

## Technical Notes

### Database Relationships

```
profiles (users)
   ↓
pitch_rooms (rooms)
   ↓
   ├─→ pitch_room_participants (who joined)
   ├─→ pitch_room_pitches (projects pitched)
   │      ↓
   │   pitch_room_ratings (feedback)
   └─→ projects (what's being pitched)
```

### Security

All tables have RLS enabled:
- Users can only see public rooms or rooms they've joined
- Hosts can manage their own rooms
- Participants can view other participants in their rooms
- Only room members can submit pitches and ratings

### Performance

Indexes created on:
- `host_id`, `scheduled_date`, `status` on pitch_rooms
- `room_id`, `user_id` on participants
- `room_id`, `presenter_id` on pitches
- `pitch_id` on ratings

## API Usage Examples

```typescript
// Load upcoming rooms
const rooms = await getUpcomingPitchRooms()

// Create a new room
const room = await createPitchRoom({
  title: 'My Pitch Room',
  description: 'Come pitch your projects!',
  scheduled_date: '2025-01-20',
  scheduled_time: '3:00 PM EST',
  max_participants: 10
})

// Join a room
await joinPitchRoom(roomId)

// Submit a pitch
await submitPitch(roomId, projectId)

// Get stats
const stats = await getPitchRoomStats()
```

## Troubleshooting

**"Cannot read properties of undefined"**
- Make sure database schema is applied
- Check Supabase connection in .env.local

**"Room is full" error**
- Room has reached max_participants limit
- Host can increase limit or user must wait

**RLS Policy errors**
- Ensure user is authenticated
- Check that RLS policies were created correctly
- Verify user has proper role/permissions

## File Structure

```
src/
├── lib/
│   └── pitch-rooms.ts          # API functions
├── app/
│   └── app/
│       └── pitch-rooms/
│           └── page.tsx         # Main page
└── (to be created)
    └── app/
        └── pitch-rooms/
            ├── [id]/
            │   └── page.tsx     # Room details
            └── create/
                └── page.tsx     # Create room form
```

## Support

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs in dashboard
3. Verify RLS policies are not blocking requests
4. Ensure .env.local has correct credentials

---

**Status:** Core functionality complete ✅  
**Next Priority:** Create Host Room modal and form
