-- Add missing profile fields for comprehensive user settings
-- This adds fields that are commonly needed for user profiles

-- Add new profile fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS twitter_handle TEXT,
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS marketing_emails BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS project_updates BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS collaboration_invites BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS profile_visibility TEXT CHECK (profile_visibility IN ('public', 'members', 'private')) DEFAULT 'public',
ADD COLUMN IF NOT EXISTS discoverable BOOLEAN DEFAULT true;

-- Update display_name from first_name + last_name when they exist
CREATE OR REPLACE FUNCTION public.update_display_name()
RETURNS TRIGGER AS $$
BEGIN
  -- If first_name or last_name changed and display_name is empty or auto-generated
  IF (OLD.first_name IS DISTINCT FROM NEW.first_name OR OLD.last_name IS DISTINCT FROM NEW.last_name) THEN
    -- Auto-generate display_name from first_name + last_name if both exist
    IF NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL THEN
      NEW.display_name = TRIM(NEW.first_name || ' ' || NEW.last_name);
    ELSIF NEW.first_name IS NOT NULL THEN
      NEW.display_name = NEW.first_name;
    ELSIF NEW.last_name IS NOT NULL THEN
      NEW.display_name = NEW.last_name;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update display_name
DROP TRIGGER IF EXISTS profiles_update_display_name ON public.profiles;
CREATE TRIGGER profiles_update_display_name
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_display_name();

-- Add comment for documentation
COMMENT ON TABLE public.profiles IS 'Extended user profiles with comprehensive settings and preferences';
COMMENT ON COLUMN public.profiles.first_name IS 'User first name';
COMMENT ON COLUMN public.profiles.last_name IS 'User last name';
COMMENT ON COLUMN public.profiles.website IS 'User personal/professional website URL';
COMMENT ON COLUMN public.profiles.twitter_handle IS 'Twitter/X handle (without @)';
COMMENT ON COLUMN public.profiles.email_notifications IS 'Receive important email notifications';
COMMENT ON COLUMN public.profiles.marketing_emails IS 'Receive marketing and promotional emails';
COMMENT ON COLUMN public.profiles.project_updates IS 'Receive notifications about project changes';
COMMENT ON COLUMN public.profiles.collaboration_invites IS 'Receive collaboration invitation notifications';
COMMENT ON COLUMN public.profiles.profile_visibility IS 'Who can see your profile: public, members only, or private';
COMMENT ON COLUMN public.profiles.discoverable IS 'Allow profile and projects to appear in search results';
