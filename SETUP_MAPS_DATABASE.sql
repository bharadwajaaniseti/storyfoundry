-- Maps Annotation Tables Setup
-- Run this SQL script in your Supabase SQL editor to enable map annotations
-- Links to existing world_elements table where category = 'maps'

-- Create dedicated annotation tables for better performance and querying
-- These tables link directly to world_elements instead of a separate maps table

-- Step 1: Create annotation tables linked to world_elements

-- Pins table
CREATE TABLE IF NOT EXISTS public.map_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_element_id UUID REFERENCES public.world_elements(id) ON DELETE CASCADE NOT NULL,
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Labels table
CREATE TABLE IF NOT EXISTS public.map_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_element_id UUID REFERENCES public.world_elements(id) ON DELETE CASCADE NOT NULL,
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  text TEXT NOT NULL,
  font_size INTEGER DEFAULT 14,
  color TEXT DEFAULT '#000000',
  background_color TEXT,
  rotation FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Zones table
CREATE TABLE IF NOT EXISTS public.map_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_element_id UUID REFERENCES public.world_elements(id) ON DELETE CASCADE NOT NULL,
  points JSONB NOT NULL, -- Array of {x, y} coordinates
  fill_color TEXT DEFAULT '#3b82f6',
  border_color TEXT DEFAULT '#1e40af',
  border_style TEXT DEFAULT 'solid',
  border_width INTEGER DEFAULT 2,
  opacity FLOAT DEFAULT 0.3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Measurements table
CREATE TABLE IF NOT EXISTS public.map_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_element_id UUID REFERENCES public.world_elements(id) ON DELETE CASCADE NOT NULL,
  measurement_type TEXT NOT NULL CHECK (measurement_type IN ('distance', 'area', 'perimeter')),
  points JSONB NOT NULL, -- Array of {x, y} coordinates
  unit TEXT DEFAULT 'px' CHECK (unit IN ('px', 'ft', 'm', 'km', 'mi', 'custom')),
  custom_unit TEXT,
  scale FLOAT, -- pixels per unit
  color TEXT DEFAULT '#ef4444',
  show_label BOOLEAN DEFAULT true,
  label_position TEXT DEFAULT 'auto' CHECK (label_position IN ('auto', 'start', 'middle', 'end')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Decorations table
CREATE TABLE IF NOT EXISTS public.map_decorations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_element_id UUID REFERENCES public.world_elements(id) ON DELETE CASCADE NOT NULL,
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  shape TEXT NOT NULL,
  size INTEGER DEFAULT 20,
  color TEXT DEFAULT '#3b82f6',
  stroke_color TEXT,
  stroke_width INTEGER DEFAULT 2,
  fill_opacity FLOAT DEFAULT 0.8,
  stroke_opacity FLOAT DEFAULT 1.0,
  rotation FLOAT DEFAULT 0,
  custom_svg TEXT,
  text TEXT,
  font_size INTEGER,
  text_color TEXT,
  style TEXT DEFAULT 'solid',
  gradient JSONB,
  shadow BOOLEAN DEFAULT false,
  layer INTEGER DEFAULT 0,
  decoration_type TEXT,
  grid_color TEXT,
  grid_opacity FLOAT,
  text_overlay TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_map_pins_world_element_id ON public.map_pins(world_element_id);
CREATE INDEX IF NOT EXISTS idx_map_labels_world_element_id ON public.map_labels(world_element_id);
CREATE INDEX IF NOT EXISTS idx_map_zones_world_element_id ON public.map_zones(world_element_id);
CREATE INDEX IF NOT EXISTS idx_map_measurements_world_element_id ON public.map_measurements(world_element_id);
CREATE INDEX IF NOT EXISTS idx_map_decorations_world_element_id ON public.map_decorations(world_element_id);

-- Step 3: Add updated_at triggers (if handle_updated_at function exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_updated_at') THEN
    CREATE TRIGGER map_pins_updated_at
      BEFORE UPDATE ON public.map_pins
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
      
    CREATE TRIGGER map_labels_updated_at
      BEFORE UPDATE ON public.map_labels
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
      
    CREATE TRIGGER map_zones_updated_at
      BEFORE UPDATE ON public.map_zones
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
      
    CREATE TRIGGER map_measurements_updated_at
      BEFORE UPDATE ON public.map_measurements
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
      
    CREATE TRIGGER map_decorations_updated_at
      BEFORE UPDATE ON public.map_decorations
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- Step 4: Enable RLS on annotation tables
ALTER TABLE public.map_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_decorations ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for annotation tables
-- Create policies for annotation tables linked to world_elements
DO $$
DECLARE
    table_name TEXT;
    table_names TEXT[] := ARRAY['map_pins', 'map_labels', 'map_zones', 'map_measurements', 'map_decorations'];
    policy_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY table_names
    LOOP
        -- SELECT policy
        policy_name := table_name || '_select_own';
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = table_name AND policyname = policy_name) THEN
            EXECUTE format('
                CREATE POLICY "%s" ON public.%s
                FOR SELECT USING (
                    EXISTS (
                        SELECT 1 FROM public.world_elements 
                        WHERE world_elements.id = %s.world_element_id 
                        AND world_elements.project_id IN (
                            SELECT id FROM public.projects WHERE owner_id = auth.uid()
                        )
                    )
                )', policy_name, table_name, table_name);
        END IF;
            
        -- INSERT policy
        policy_name := table_name || '_insert_own';
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = table_name AND policyname = policy_name) THEN
            EXECUTE format('
                CREATE POLICY "%s" ON public.%s
                FOR INSERT WITH CHECK (
                    EXISTS (
                        SELECT 1 FROM public.world_elements 
                        WHERE world_elements.id = %s.world_element_id 
                        AND world_elements.project_id IN (
                            SELECT id FROM public.projects WHERE owner_id = auth.uid()
                        )
                    )
                )', policy_name, table_name, table_name);
        END IF;
            
        -- UPDATE policy
        policy_name := table_name || '_update_own';
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = table_name AND policyname = policy_name) THEN
            EXECUTE format('
                CREATE POLICY "%s" ON public.%s
                FOR UPDATE USING (
                    EXISTS (
                        SELECT 1 FROM public.world_elements 
                        WHERE world_elements.id = %s.world_element_id 
                        AND world_elements.project_id IN (
                            SELECT id FROM public.projects WHERE owner_id = auth.uid()
                        )
                    )
                )', policy_name, table_name, table_name);
        END IF;
            
        -- DELETE policy
        policy_name := table_name || '_delete_own';
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = table_name AND policyname = policy_name) THEN
            EXECUTE format('
                CREATE POLICY "%s" ON public.%s
                FOR DELETE USING (
                    EXISTS (
                        SELECT 1 FROM public.world_elements 
                        WHERE world_elements.id = %s.world_element_id 
                        AND world_elements.project_id IN (
                            SELECT id FROM public.projects WHERE owner_id = auth.uid()
                        )
                    )
                )', policy_name, table_name, table_name);
        END IF;
    END LOOP;
END $$;

-- Step 6: Create storage bucket for map images (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('maps', 'maps', true)
ON CONFLICT (id) DO NOTHING;

-- Step 7: Create storage policies for map images
-- Allow public read access to map images  
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Map images are publicly accessible') THEN
        CREATE POLICY "Map images are publicly accessible" 
        ON storage.objects FOR SELECT 
        USING (bucket_id = 'maps');
    END IF;
END $$;

-- Allow users to upload map images for their own projects
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can upload map images for their projects') THEN
        CREATE POLICY "Users can upload map images for their projects" 
        ON storage.objects FOR INSERT 
        WITH CHECK (
          bucket_id = 'maps' 
          AND auth.uid() IS NOT NULL
          AND (storage.foldername(name))[1] = 'maps'
          AND EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id::text = (storage.foldername(name))[2]
            AND projects.owner_id = auth.uid()
          )
        );
    END IF;
END $$;

-- Allow users to update map images for their own projects
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can update map images for their projects') THEN
        CREATE POLICY "Users can update map images for their projects" 
        ON storage.objects FOR UPDATE 
        USING (
          bucket_id = 'maps' 
          AND auth.uid() IS NOT NULL
          AND (storage.foldername(name))[1] = 'maps'
          AND EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id::text = (storage.foldername(name))[2]
            AND projects.owner_id = auth.uid()
          )
        );
    END IF;
END $$;

-- Allow users to delete map images for their own projects
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can delete map images for their projects') THEN
        CREATE POLICY "Users can delete map images for their projects" 
        ON storage.objects FOR DELETE 
        USING (
          bucket_id = 'maps' 
          AND auth.uid() IS NOT NULL
          AND (storage.foldername(name))[1] = 'maps'
          AND EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id::text = (storage.foldername(name))[2]
            AND projects.owner_id = auth.uid()
          )
        );
    END IF;
END $$;

-- Verify the setup
SELECT 'Map annotation tables (linked to world_elements) setup completed successfully!' as result;