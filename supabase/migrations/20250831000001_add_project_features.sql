-- Add AI and IP protection features to projects table

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS ip_protection_enabled BOOLEAN DEFAULT FALSE;

-- Update existing projects to have default values
UPDATE public.projects 
SET ai_enabled = FALSE, ip_protection_enabled = FALSE 
WHERE ai_enabled IS NULL OR ip_protection_enabled IS NULL;
