-- Maps Annotation Tables Setup (Fixed Version)
-- Run this SQL script in your Supabase SQL editor to enable map annotations
-- Links to existing world_elements table where category = 'maps'

-- Step 0: Verify prerequisites
DO $$
BEGIN
    -- Check if world_elements table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'world_elements') THEN
        RAISE EXCEPTION 'world_elements table does not exist. Please create it first.';
    END IF;
    
    -- Check if projects table exists (needed for RLS)
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
        RAISE EXCEPTION 'projects table does not exist. Please create it first.';
    END IF;
    
    RAISE NOTICE 'Prerequisites check passed';
END $$;

-- Step 1: Create annotation tables linked to world_elements

-- Pins table
CREATE TABLE IF NOT EXISTS public.map_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_element_id UUID NOT NULL,
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
  world_element_id UUID NOT NULL,
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
  world_element_id UUID NOT NULL,
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
  world_element_id UUID NOT NULL,
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
  world_element_id UUID NOT NULL,
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

-- Step 1.5: Add missing columns and foreign key constraints after tables are created
DO $$
BEGIN
    -- Check and add world_element_id column to map_pins if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'map_pins' 
                  AND column_name = 'world_element_id' 
                  AND table_schema = 'public') THEN
        ALTER TABLE public.map_pins ADD COLUMN world_element_id UUID NOT NULL;
        RAISE NOTICE 'Added world_element_id column to map_pins';
    END IF;
    
    -- Check and add world_element_id column to map_labels if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'map_labels' 
                  AND column_name = 'world_element_id' 
                  AND table_schema = 'public') THEN
        ALTER TABLE public.map_labels ADD COLUMN world_element_id UUID NOT NULL;
        RAISE NOTICE 'Added world_element_id column to map_labels';
    END IF;
    
    -- Check and add world_element_id column to map_zones if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'map_zones' 
                  AND column_name = 'world_element_id' 
                  AND table_schema = 'public') THEN
        ALTER TABLE public.map_zones ADD COLUMN world_element_id UUID NOT NULL;
        RAISE NOTICE 'Added world_element_id column to map_zones';
    END IF;
    
    -- Check and add world_element_id column to map_measurements if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'map_measurements' 
                  AND column_name = 'world_element_id' 
                  AND table_schema = 'public') THEN
        ALTER TABLE public.map_measurements ADD COLUMN world_element_id UUID NOT NULL;
        RAISE NOTICE 'Added world_element_id column to map_measurements';
    END IF;
    
    -- Check and add world_element_id column to map_decorations if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'map_decorations' 
                  AND column_name = 'world_element_id' 
                  AND table_schema = 'public') THEN
        ALTER TABLE public.map_decorations ADD COLUMN world_element_id UUID NOT NULL;
        RAISE NOTICE 'Added world_element_id column to map_decorations';
    END IF;
    
    RAISE NOTICE 'Column checks completed';
END $$;

-- Step 1.6: Add foreign key constraints after ensuring columns exist
DO $$
BEGIN
    -- Add foreign key constraints only if they don't already exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                  WHERE constraint_name = 'fk_map_pins_world_element' 
                  AND table_name = 'map_pins') THEN
        ALTER TABLE public.map_pins 
        ADD CONSTRAINT fk_map_pins_world_element 
        FOREIGN KEY (world_element_id) REFERENCES public.world_elements(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint to map_pins';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                  WHERE constraint_name = 'fk_map_labels_world_element' 
                  AND table_name = 'map_labels') THEN
        ALTER TABLE public.map_labels 
        ADD CONSTRAINT fk_map_labels_world_element 
        FOREIGN KEY (world_element_id) REFERENCES public.world_elements(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint to map_labels';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                  WHERE constraint_name = 'fk_map_zones_world_element' 
                  AND table_name = 'map_zones') THEN
        ALTER TABLE public.map_zones 
        ADD CONSTRAINT fk_map_zones_world_element 
        FOREIGN KEY (world_element_id) REFERENCES public.world_elements(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint to map_zones';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                  WHERE constraint_name = 'fk_map_measurements_world_element' 
                  AND table_name = 'map_measurements') THEN
        ALTER TABLE public.map_measurements 
        ADD CONSTRAINT fk_map_measurements_world_element 
        FOREIGN KEY (world_element_id) REFERENCES public.world_elements(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint to map_measurements';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                  WHERE constraint_name = 'fk_map_decorations_world_element' 
                  AND table_name = 'map_decorations') THEN
        ALTER TABLE public.map_decorations 
        ADD CONSTRAINT fk_map_decorations_world_element 
        FOREIGN KEY (world_element_id) REFERENCES public.world_elements(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint to map_decorations';
    END IF;
    
    RAISE NOTICE 'Foreign key constraints setup completed';
END $$;

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
    -- Drop existing triggers if they exist
    DROP TRIGGER IF EXISTS map_pins_updated_at ON public.map_pins;
    DROP TRIGGER IF EXISTS map_labels_updated_at ON public.map_labels;
    DROP TRIGGER IF EXISTS map_zones_updated_at ON public.map_zones;
    DROP TRIGGER IF EXISTS map_measurements_updated_at ON public.map_measurements;
    DROP TRIGGER IF EXISTS map_decorations_updated_at ON public.map_decorations;
    
    -- Create new triggers
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
      
    RAISE NOTICE 'Updated triggers created successfully';
  ELSE
    RAISE NOTICE 'handle_updated_at function not found, skipping triggers';
  END IF;
END $$;

-- Step 4: Enable RLS on annotation tables
ALTER TABLE public.map_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_decorations ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for annotation tables
DO $$
DECLARE
    table_name TEXT;
    table_names TEXT[] := ARRAY['map_pins', 'map_labels', 'map_zones', 'map_measurements', 'map_decorations'];
    policy_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY table_names
    LOOP
        -- Drop existing policies if they exist
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %s_select_own ON public.%s', table_name, table_name);
            EXECUTE format('DROP POLICY IF EXISTS %s_insert_own ON public.%s', table_name, table_name);
            EXECUTE format('DROP POLICY IF EXISTS %s_update_own ON public.%s', table_name, table_name);
            EXECUTE format('DROP POLICY IF EXISTS %s_delete_own ON public.%s', table_name, table_name);
        EXCEPTION WHEN OTHERS THEN
            -- Ignore errors if policies don't exist
            NULL;
        END;
        
        -- SELECT policy
        policy_name := table_name || '_select_own';
        EXECUTE format('
            CREATE POLICY "%s" ON public.%s
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.world_elements 
                    JOIN public.projects ON projects.id = world_elements.project_id
                    WHERE world_elements.id = %s.world_element_id 
                    AND projects.owner_id = auth.uid()
                )
            )', policy_name, table_name, table_name);
            
        -- INSERT policy
        policy_name := table_name || '_insert_own';
        EXECUTE format('
            CREATE POLICY "%s" ON public.%s
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.world_elements 
                    JOIN public.projects ON projects.id = world_elements.project_id
                    WHERE world_elements.id = %s.world_element_id 
                    AND projects.owner_id = auth.uid()
                )
            )', policy_name, table_name, table_name);
            
        -- UPDATE policy
        policy_name := table_name || '_update_own';
        EXECUTE format('
            CREATE POLICY "%s" ON public.%s
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM public.world_elements 
                    JOIN public.projects ON projects.id = world_elements.project_id
                    WHERE world_elements.id = %s.world_element_id 
                    AND projects.owner_id = auth.uid()
                )
            )', policy_name, table_name, table_name);
            
        -- DELETE policy
        policy_name := table_name || '_delete_own';
        EXECUTE format('
            CREATE POLICY "%s" ON public.%s
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM public.world_elements 
                    JOIN public.projects ON projects.id = world_elements.project_id
                    WHERE world_elements.id = %s.world_element_id 
                    AND projects.owner_id = auth.uid()
                )
            )', policy_name, table_name, table_name);
    END LOOP;
    
    RAISE NOTICE 'RLS policies created successfully for all annotation tables';
END $$;

-- Step 6: Create storage bucket for map images (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('maps', 'maps', true)
ON CONFLICT (id) DO NOTHING;

-- Step 7: Create storage policies for map images
DO $$
BEGIN
    -- Drop existing storage policies if they exist
    BEGIN
        DROP POLICY IF EXISTS "Map images are publicly accessible" ON storage.objects;
        DROP POLICY IF EXISTS "Users can upload map images for their projects" ON storage.objects;
        DROP POLICY IF EXISTS "Users can update map images for their projects" ON storage.objects;
        DROP POLICY IF EXISTS "Users can delete map images for their projects" ON storage.objects;
    EXCEPTION WHEN OTHERS THEN
        -- Ignore errors if policies don't exist
        NULL;
    END;
    
    -- Allow public read access to map images  
    CREATE POLICY "Map images are publicly accessible" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'maps');

    -- Allow users to upload map images for their own projects
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

    -- Allow users to update map images for their own projects
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

    -- Allow users to delete map images for their own projects
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
    
    RAISE NOTICE 'Storage policies created successfully';
END $$;

-- Verify the setup
SELECT 'Map annotation tables (linked to world_elements) setup completed successfully!' as result;

-- Show created tables for verification
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'map_%'
ORDER BY tablename;