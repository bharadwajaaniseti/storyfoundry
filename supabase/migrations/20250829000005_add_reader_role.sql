-- Add 'reader' role to the profiles table and change default
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('reader','writer','pro','admin'));

-- Change the default role to 'reader' for new signups
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'reader';

-- Update the profile creation function to use selected role from signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'preferred_role', 'reader'),  -- Use selected role or default to 'reader'
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
