-- Enforce only 'reader' and 'writer' roles - Remove 'pro' and 'admin'
-- This migration ensures the database only supports reader/writer roles

-- First, update any existing pro/admin users to writer role
UPDATE public.profiles 
SET role = 'writer' 
WHERE role IN ('pro', 'admin');

-- Update the role constraint to only allow reader/writer
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('reader', 'writer'));

-- Ensure default role is 'reader'
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'reader';

-- Update subscription tiers to reflect reader/writer plans only
ALTER TABLE public.subscriptions
DROP CONSTRAINT IF EXISTS subscriptions_tier_check;

ALTER TABLE public.subscriptions
ADD CONSTRAINT subscriptions_tier_check 
CHECK (tier IN (
  'free_reader', 'reader_plus', 'reader_pro',
  'free_writer', 'writer_plus', 'writer_pro'
));

-- Update any existing subscription tiers that might reference old roles
UPDATE public.subscriptions 
SET tier = CASE 
  WHEN tier LIKE '%pro%' OR tier LIKE '%admin%' THEN 'writer_pro'
  WHEN tier LIKE '%plus%' THEN 'writer_plus'  
  ELSE 'free_writer'
END
WHERE tier NOT IN ('free_reader', 'reader_plus', 'reader_pro', 'free_writer', 'writer_plus', 'writer_pro');

-- Update RLS policies to remove pro/admin references
DROP POLICY IF EXISTS "access_requests_insert_pro" ON public.access_requests;
DROP POLICY IF EXISTS "access_requests_insert_paid_users" ON public.access_requests;
DROP POLICY IF EXISTS "pitch_rooms_insert_pro" ON public.pitch_rooms;
DROP POLICY IF EXISTS "pitch_rooms_insert_writer_pro" ON public.pitch_rooms;

-- Access requests: Only users with paid reader/writer plans can request access
CREATE POLICY "access_requests_insert_paid_users" ON public.access_requests
  FOR INSERT WITH CHECK (
    auth.uid() = pro_id 
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.subscriptions s ON p.id = s.user_id
      WHERE p.id = auth.uid() 
      AND s.tier NOT IN ('free_reader', 'free_writer')
    )
  );

-- Pitch rooms: Only users with pro writer plans can create pitch rooms
CREATE POLICY "pitch_rooms_insert_writer_pro" ON public.pitch_rooms
  FOR INSERT WITH CHECK (
    auth.uid() = host_id 
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.subscriptions s ON p.id = s.user_id
      WHERE p.id = auth.uid() 
      AND p.role = 'writer'
      AND s.tier = 'writer_pro'
    )
  );

-- Update the auto-create function to only handle reader/writer roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile with selected role (reader or writer only)
  INSERT INTO public.profiles (id, role, display_name, updated_at)
  VALUES (
    NEW.id,
    CASE 
      WHEN COALESCE(NEW.raw_user_meta_data->>'preferred_role', 'reader') = 'writer' 
      THEN 'writer'
      ELSE 'reader'
    END,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = CASE 
      WHEN EXCLUDED.role = 'writer' THEN 'writer'
      ELSE 'reader'
    END,
    display_name = EXCLUDED.display_name,
    updated_at = NOW();

  -- Create default subscription based on role
  INSERT INTO public.subscriptions (user_id, tier)
  VALUES (
    NEW.id,
    CASE 
      WHEN COALESCE(NEW.raw_user_meta_data->>'preferred_role', 'reader') = 'writer' 
      THEN 'free_writer'
      ELSE 'free_reader'
    END
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
