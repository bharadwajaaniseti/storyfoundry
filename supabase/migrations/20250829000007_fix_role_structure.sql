-- Fix role structure: Only 'reader' and 'writer' roles
-- Purchase plans are handled separately in subscriptions table

-- Update profiles table role constraint to only allow reader/writer
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('reader', 'writer'));

-- Keep default as 'reader'
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'reader';

-- Update subscription tiers to reflect reader/writer plans
ALTER TABLE public.subscriptions
DROP CONSTRAINT IF EXISTS subscriptions_tier_check;

ALTER TABLE public.subscriptions
ADD CONSTRAINT subscriptions_tier_check 
CHECK (tier IN (
  'free_reader', 'reader_plus', 'reader_pro',
  'free_writer', 'writer_plus', 'writer_pro'
));

-- Set default subscription tier based on role
ALTER TABLE public.subscriptions
ALTER COLUMN tier SET DEFAULT 'free_reader';

-- Update RLS policies to use only reader/writer roles

-- Remove old pro-specific policies and update with reader/writer logic
DROP POLICY IF EXISTS "access_requests_insert_pro" ON public.access_requests;
DROP POLICY IF EXISTS "pitch_rooms_insert_pro" ON public.pitch_rooms;

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

-- Update auto-create function to handle role properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile with selected role
  INSERT INTO public.profiles (id, role, display_name, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'preferred_role', 'reader'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
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
