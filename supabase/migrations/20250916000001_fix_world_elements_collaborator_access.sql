-- Fix world_elements and project_chapters RLS policies to allow collaborators access
-- Currently only owners can access these tables, but active collaborators should also be able to

-- =============================
-- WORLD ELEMENTS POLICIES
-- =============================

-- Drop existing world_elements policies
DROP POLICY IF EXISTS "Users can view world elements of their projects" ON public.world_elements;
DROP POLICY IF EXISTS "Users can create world elements for their projects" ON public.world_elements;
DROP POLICY IF EXISTS "Users can update world elements of their projects" ON public.world_elements;
DROP POLICY IF EXISTS "Users can delete world elements of their projects" ON public.world_elements;

-- Create new world_elements policies that include collaborators

-- SELECT: Owner OR active collaborator
CREATE POLICY "world_elements_select_policy" ON public.world_elements
  FOR SELECT USING (
    -- Owner can see their project's world elements
    project_id IN (
      SELECT id FROM public.projects WHERE owner_id = auth.uid()
    )
    OR
    -- Active collaborators can see world elements  
    EXISTS (
      SELECT 1 FROM public.project_collaborators pc
      WHERE pc.project_id = world_elements.project_id 
      AND pc.user_id = auth.uid()
      AND pc.status = 'active'
    )
  );

-- INSERT: Owner OR active collaborator
CREATE POLICY "world_elements_insert_policy" ON public.world_elements
  FOR INSERT WITH CHECK (
    -- Owner can create world elements for their projects
    project_id IN (
      SELECT id FROM public.projects WHERE owner_id = auth.uid()
    )
    OR
    -- Active collaborators can create world elements
    EXISTS (
      SELECT 1 FROM public.project_collaborators pc
      WHERE pc.project_id = world_elements.project_id 
      AND pc.user_id = auth.uid()
      AND pc.status = 'active'
    )
  );

-- UPDATE: Owner OR active collaborator  
CREATE POLICY "world_elements_update_policy" ON public.world_elements
  FOR UPDATE USING (
    -- Owner can update their project's world elements
    project_id IN (
      SELECT id FROM public.projects WHERE owner_id = auth.uid()
    )
    OR
    -- Active collaborators can update world elements
    EXISTS (
      SELECT 1 FROM public.project_collaborators pc
      WHERE pc.project_id = world_elements.project_id 
      AND pc.user_id = auth.uid()
      AND pc.status = 'active'
    )
  );

-- DELETE: Owner OR active collaborator with write permissions
CREATE POLICY "world_elements_delete_policy" ON public.world_elements
  FOR DELETE USING (
    -- Owner can delete their project's world elements
    project_id IN (
      SELECT id FROM public.projects WHERE owner_id = auth.uid()
    )
    OR
    -- Active collaborators with write permissions can delete world elements
    EXISTS (
      SELECT 1 FROM public.project_collaborators pc
      WHERE pc.project_id = world_elements.project_id 
      AND pc.user_id = auth.uid()
      AND pc.status = 'active'
      AND (pc.permissions->>'write')::boolean = true
    )
  );

-- =============================
-- PROJECT CHAPTERS POLICIES  
-- =============================

-- Check if project_chapters table exists and has RLS enabled
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_chapters') THEN
    -- Enable RLS if not already enabled
    ALTER TABLE public.project_chapters ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "project_chapters_select_policy" ON public.project_chapters;
    DROP POLICY IF EXISTS "project_chapters_insert_policy" ON public.project_chapters;
    DROP POLICY IF EXISTS "project_chapters_update_policy" ON public.project_chapters;
    DROP POLICY IF EXISTS "project_chapters_delete_policy" ON public.project_chapters;
    
    -- Create new project_chapters policies that include collaborators
    
    -- SELECT: Owner OR active collaborator
    CREATE POLICY "project_chapters_select_policy" ON public.project_chapters
      FOR SELECT USING (
        -- Owner can see their project's chapters
        project_id IN (
          SELECT id FROM public.projects WHERE owner_id = auth.uid()
        )
        OR
        -- Active collaborators can see chapters
        EXISTS (
          SELECT 1 FROM public.project_collaborators pc
          WHERE pc.project_id = project_chapters.project_id 
          AND pc.user_id = auth.uid()
          AND pc.status = 'active'
        )
      );

    -- INSERT: Owner OR active collaborator
    CREATE POLICY "project_chapters_insert_policy" ON public.project_chapters
      FOR INSERT WITH CHECK (
        -- Owner can create chapters for their projects
        project_id IN (
          SELECT id FROM public.projects WHERE owner_id = auth.uid()
        )
        OR
        -- Active collaborators can create chapters
        EXISTS (
          SELECT 1 FROM public.project_collaborators pc
          WHERE pc.project_id = project_chapters.project_id 
          AND pc.user_id = auth.uid()
          AND pc.status = 'active'
        )
      );

    -- UPDATE: Owner OR active collaborator
    CREATE POLICY "project_chapters_update_policy" ON public.project_chapters
      FOR UPDATE USING (
        -- Owner can update their project's chapters
        project_id IN (
          SELECT id FROM public.projects WHERE owner_id = auth.uid()
        )
        OR
        -- Active collaborators can update chapters
        EXISTS (
          SELECT 1 FROM public.project_collaborators pc
          WHERE pc.project_id = project_chapters.project_id 
          AND pc.user_id = auth.uid()
          AND pc.status = 'active'
        )
      );

    -- DELETE: Owner OR active collaborator with write permissions
    CREATE POLICY "project_chapters_delete_policy" ON public.project_chapters
      FOR DELETE USING (
        -- Owner can delete their project's chapters
        project_id IN (
          SELECT id FROM public.projects WHERE owner_id = auth.uid()
        )
        OR
        -- Active collaborators with write permissions can delete chapters
        EXISTS (
          SELECT 1 FROM public.project_collaborators pc
          WHERE pc.project_id = project_chapters.project_id 
          AND pc.user_id = auth.uid()
          AND pc.status = 'active'
          AND (pc.permissions->>'write')::boolean = true
        )
      );
      
    RAISE NOTICE 'Updated project_chapters RLS policies to include collaborator access';
  ELSE
    RAISE NOTICE 'project_chapters table does not exist, skipping chapter policies';
  END IF;
END
$$;

-- Migration completed successfully
-- RLS policies for world_elements and project_chapters have been updated to allow collaborator access