-- Temporary fix: Disable auto profile creation to prevent role conflicts
-- We'll handle profile creation manually in the auth callback

-- Drop the existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Comment out the function for now
-- We'll handle profile creation manually in the callback
/*
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
*/
