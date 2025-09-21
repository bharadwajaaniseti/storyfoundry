-- Drop any incorrect foreign key constraints that might reference a non-existent 'timelines' table
-- and ensure the timeline_id column correctly references world_elements(id)

-- First, check if there are any constraints referencing 'timelines' table
DO $$
DECLARE
    constraint_rec RECORD;
BEGIN
    -- Check for any constraints on timeline_events that reference 'timelines'
    FOR constraint_rec IN 
        SELECT 
            tc.constraint_name,
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = 'timeline_events'
          AND tc.table_schema = 'public'
          AND ccu.table_name = 'timelines'
    LOOP
        RAISE NOTICE 'Found bad constraint: % on table % column % references %.%', 
                     constraint_rec.constraint_name,
                     constraint_rec.table_name,
                     constraint_rec.column_name,
                     constraint_rec.foreign_table_name,
                     constraint_rec.foreign_column_name;
        
        -- Drop the bad constraint
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', 
                       constraint_rec.table_name, 
                       constraint_rec.constraint_name);
        
        RAISE NOTICE 'Dropped constraint: %', constraint_rec.constraint_name;
    END LOOP;
END $$;

-- Ensure timeline_id column exists and has correct foreign key constraint
DO $$
BEGIN
    -- Add timeline_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'timeline_events' 
        AND column_name = 'timeline_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE timeline_events 
        ADD COLUMN timeline_id UUID;
        RAISE NOTICE 'Added timeline_id column';
    END IF;

    -- Drop any existing foreign key constraint on timeline_id
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'timeline_events' 
        AND constraint_name = 'timeline_events_timeline_id_fkey'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE timeline_events DROP CONSTRAINT timeline_events_timeline_id_fkey;
        RAISE NOTICE 'Dropped existing timeline_id foreign key constraint';
    END IF;

    -- Add correct foreign key constraint
    ALTER TABLE timeline_events 
    ADD CONSTRAINT timeline_events_timeline_id_fkey 
    FOREIGN KEY (timeline_id) 
    REFERENCES world_elements(id) 
    ON DELETE CASCADE;
    
    RAISE NOTICE 'Added correct foreign key constraint: timeline_events.timeline_id -> world_elements.id';
END $$;

-- Add index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_timeline_events_timeline_id ON timeline_events(timeline_id);