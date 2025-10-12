-- Quick Test Data for Pitch Rooms
-- This automatically uses your current user ID

-- Create test pitch rooms with your user as host
DO $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get the first user from auth.users (should be you)
  SELECT id INTO current_user_id FROM auth.users LIMIT 1;
  
  -- Insert test pitch rooms
  INSERT INTO pitch_rooms (
    title,
    description,
    host_id,
    scheduled_date,
    scheduled_time,
    max_participants,
    status,
    room_type,
    tags
  ) VALUES 
  (
    'Sci-Fi & Fantasy Showcase',
    'Present your science fiction and fantasy projects to industry professionals. Get feedback from experienced writers and connect with potential collaborators.',
    current_user_id,
    CURRENT_DATE + INTERVAL '3 days' + INTERVAL '14 hours',
    '2:00 PM PST',
    15,
    'upcoming',
    'public',
    ARRAY['sci-fi', 'fantasy', 'showcase']
  ),
  (
    'Independent Film Pitch Session',
    'Perfect for indie filmmakers looking for funding and collaboration. Present your screenplay or film concept to producers and fellow filmmakers.',
    current_user_id,
    CURRENT_DATE + INTERVAL '6 days' + INTERVAL '18 hours',
    '6:00 PM EST',
    10,
    'upcoming',
    'public',
    ARRAY['indie', 'film', 'funding']
  ),
  (
    'Comedy Writers Meetup',
    'Share your comedic scripts and get feedback from fellow comedy writers. Focus on sitcoms, sketch comedy, and comedic films.',
    current_user_id,
    CURRENT_DATE + INTERVAL '10 days' + INTERVAL '19 hours',
    '7:00 PM PST',
    12,
    'upcoming',
    'public',
    ARRAY['comedy', 'sitcom', 'humor']
  ),
  (
    'Horror & Thriller Workshop',
    'Pitch your horror and thriller projects. Learn techniques for building suspense and creating memorable scares.',
    current_user_id,
    CURRENT_DATE + INTERVAL '13 days' + INTERVAL '15 hours',
    '3:00 PM EST',
    8,
    'upcoming',
    'public',
    ARRAY['horror', 'thriller', 'suspense']
  ),
  (
    'Romance & Drama Pitch Night',
    'Share your romantic and dramatic stories. Get feedback on character development, emotional arcs, and relationship dynamics.',
    current_user_id,
    CURRENT_DATE + INTERVAL '16 days' + INTERVAL '17 hours',
    '5:00 PM PST',
    20,
    'upcoming',
    'public',
    ARRAY['romance', 'drama', 'emotional']
  );
  
  RAISE NOTICE 'Created 5 test pitch rooms for user: %', current_user_id;
END $$;

-- Verify the rooms were created
SELECT 
  id,
  title,
  scheduled_date,
  scheduled_time,
  max_participants,
  status,
  (SELECT display_name FROM profiles WHERE id = pitch_rooms.host_id) as host_name
FROM pitch_rooms
ORDER BY scheduled_date;
