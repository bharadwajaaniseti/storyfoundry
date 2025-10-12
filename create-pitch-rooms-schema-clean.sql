-- Pitch Rooms Schema - Step by Step Execution
-- Execute these statements ONE AT A TIME in Supabase SQL Editor

-- STEP 1: Create Tables
-- =====================

-- Table 1: pitch_rooms
CREATE TABLE pitch_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_time TEXT NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 15,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed', 'cancelled')),
  room_type TEXT DEFAULT 'public' CHECK (room_type IN ('public', 'private', 'invite_only')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2: pitch_room_participants
CREATE TABLE pitch_room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES pitch_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'participant' CHECK (role IN ('host', 'participant', 'presenter', 'observer')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'joined' CHECK (status IN ('joined', 'left', 'removed')),
  UNIQUE(room_id, user_id)
);

-- Table 3: pitch_room_pitches
CREATE TABLE pitch_room_pitches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES pitch_rooms(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  presenter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pitch_order INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'presenting', 'completed')),
  feedback_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0.0,
  presented_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 4: pitch_room_ratings
CREATE TABLE pitch_room_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pitch_id UUID NOT NULL REFERENCES pitch_room_pitches(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES pitch_rooms(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pitch_id, rater_id)
);

-- STEP 2: Create Indexes
-- =====================

CREATE INDEX idx_pitch_rooms_host_id ON pitch_rooms(host_id);
CREATE INDEX idx_pitch_rooms_scheduled_date ON pitch_rooms(scheduled_date);
CREATE INDEX idx_pitch_rooms_status ON pitch_rooms(status);
CREATE INDEX idx_pitch_room_participants_room_id ON pitch_room_participants(room_id);
CREATE INDEX idx_pitch_room_participants_user_id ON pitch_room_participants(user_id);
CREATE INDEX idx_pitch_room_pitches_room_id ON pitch_room_pitches(room_id);
CREATE INDEX idx_pitch_room_pitches_presenter_id ON pitch_room_pitches(presenter_id);
CREATE INDEX idx_pitch_room_ratings_pitch_id ON pitch_room_ratings(pitch_id);

-- STEP 3: Enable RLS
-- =====================

ALTER TABLE pitch_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitch_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitch_room_pitches ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitch_room_ratings ENABLE ROW LEVEL SECURITY;

-- STEP 4: RLS Policies for pitch_rooms
-- =====================

CREATE POLICY "Public rooms are viewable by everyone"
  ON pitch_rooms FOR SELECT
  USING (room_type = 'public' OR host_id = auth.uid());

CREATE POLICY "Users can create their own rooms"
  ON pitch_rooms FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their own rooms"
  ON pitch_rooms FOR UPDATE
  USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete their own rooms"
  ON pitch_rooms FOR DELETE
  USING (auth.uid() = host_id);

-- STEP 5: RLS Policies for pitch_room_participants
-- =====================

CREATE POLICY "Participants can view room members"
  ON pitch_room_participants FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM pitch_room_participants WHERE room_id = pitch_room_participants.room_id
    )
  );

CREATE POLICY "Users can join rooms"
  ON pitch_room_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their participation"
  ON pitch_room_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- STEP 6: RLS Policies for pitch_room_pitches
-- =====================

CREATE POLICY "Room participants can view pitches"
  ON pitch_room_pitches FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM pitch_room_participants WHERE room_id = pitch_room_pitches.room_id
    )
  );

CREATE POLICY "Users can create their own pitches"
  ON pitch_room_pitches FOR INSERT
  WITH CHECK (auth.uid() = presenter_id);

CREATE POLICY "Presenters can update their pitches"
  ON pitch_room_pitches FOR UPDATE
  USING (auth.uid() = presenter_id);

-- STEP 7: RLS Policies for pitch_room_ratings
-- =====================

CREATE POLICY "Room participants can view ratings"
  ON pitch_room_ratings FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM pitch_room_participants WHERE room_id = pitch_room_ratings.room_id
    )
  );

CREATE POLICY "Users can create ratings"
  ON pitch_room_ratings FOR INSERT
  WITH CHECK (auth.uid() = rater_id);

CREATE POLICY "Users can update their ratings"
  ON pitch_room_ratings FOR UPDATE
  USING (auth.uid() = rater_id);

-- STEP 8: Create Functions
-- =====================

CREATE OR REPLACE FUNCTION get_room_participant_count(room_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM pitch_room_participants
  WHERE pitch_room_participants.room_id = $1
    AND status = 'joined';
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION update_pitch_rating(pitch_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE pitch_room_pitches
  SET 
    rating_average = (
      SELECT COALESCE(AVG(rating), 0)
      FROM pitch_room_ratings
      WHERE pitch_room_ratings.pitch_id = update_pitch_rating.pitch_id
    ),
    feedback_count = (
      SELECT COUNT(*)
      FROM pitch_room_ratings
      WHERE pitch_room_ratings.pitch_id = update_pitch_rating.pitch_id
    )
  WHERE id = update_pitch_rating.pitch_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_update_pitch_rating()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_pitch_rating(NEW.pitch_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 9: Create Triggers
-- =====================

CREATE TRIGGER on_rating_change
  AFTER INSERT OR UPDATE ON pitch_room_ratings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_pitch_rating();

CREATE TRIGGER update_pitch_rooms_updated_at
  BEFORE UPDATE ON pitch_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
