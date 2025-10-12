-- Fix RLS policies for pitch_room_participants to allow public participant counting

-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Participants can view room members" ON pitch_room_participants;

-- Create new policies:
-- 1. Allow anyone to count participants (for displaying room capacity)
CREATE POLICY "Anyone can view participant counts"
  ON pitch_room_participants FOR SELECT
  USING (true);

-- Alternative approach: Use a function to get participant count
-- This is more secure as it only exposes the count, not individual participant data

-- Create a public function to get participant count
CREATE OR REPLACE FUNCTION public.get_public_room_participant_count(room_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM pitch_room_participants
  WHERE pitch_room_participants.room_id = $1
    AND status = 'joined';
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.get_public_room_participant_count(UUID) TO authenticated, anon;
