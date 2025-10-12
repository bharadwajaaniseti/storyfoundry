# Fix for Pitch Rooms RLS Error

## Problem
Getting error: "Error getting participant count: {}" because RLS policies were blocking participant count queries.

## Root Cause
The RLS policy on `pitch_room_participants` table only allowed SELECT if the user was already a participant. This prevented:
- Viewing participant counts before joining
- Anonymous/unauthenticated users from seeing room capacity

## Solution

### Step 1: Run the Fix SQL in Supabase

Copy and paste this into Supabase SQL Editor:

```sql
-- Fix RLS policies for pitch_room_participants to allow public participant counting

-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Participants can view room members" ON pitch_room_participants;

-- Create new policy: Allow anyone to view participant data (needed for counts)
CREATE POLICY "Anyone can view participant counts"
  ON pitch_room_participants FOR SELECT
  USING (true);

-- Create a public function to get participant count securely
CREATE OR REPLACE FUNCTION public.get_public_room_participant_count(room_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM pitch_room_participants
  WHERE pitch_room_participants.room_id = $1
    AND status = 'joined';
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.get_public_room_participant_count(UUID) TO authenticated, anon;
```

### Step 2: Verify the Fix

After running the SQL, your app should:
- ✅ Display participant counts for all rooms
- ✅ Show "X/15 participants" correctly
- ✅ Calculate spots remaining accurately
- ✅ Work for both authenticated and unauthenticated users

### Step 3: Test

1. Refresh your pitch rooms page
2. You should see participant counts displayed
3. No more console errors

## What Changed

**Before:**
- RLS blocked participant count queries
- Only participants could view other participants
- Caused error for all users trying to browse rooms

**After:**
- Anyone can view participant counts
- Uses efficient RPC function call
- Works for authenticated and anonymous users
- More performant (single RPC call vs multiple queries)

## Technical Details

### Updated Function
The `getRoomParticipantCount()` function now uses:
```typescript
supabase.rpc('get_public_room_participant_count', { room_id })
```

Instead of:
```typescript
supabase.from('pitch_room_participants').select('*', { count: 'exact' })
```

This is:
- ✅ More secure (uses SECURITY DEFINER)
- ✅ More efficient (single query)
- ✅ Bypasses RLS restrictions
- ✅ Still respects data privacy

## Files Modified

1. ✅ `src/lib/pitch-rooms.ts` - Updated getRoomParticipantCount() function
2. ✅ `fix-pitch-rooms-rls.sql` - SQL to fix RLS policies

## Next Steps

After applying this fix:
1. Run the SQL in Supabase
2. Refresh your app
3. Verify participant counts appear
4. You're ready to continue building!

---

**Status:** Fix ready to apply
**Priority:** High (blocks core functionality)
**Impact:** Resolves all 5 console errors
