-- =====================================================
-- FIX SCREENPLAY ELEMENTS PUBLIC ACCESS
-- Allow readers to view screenplay elements for public/preview projects
-- =====================================================

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "screenplay_elements_select" ON public.screenplay_elements;

-- Create new policy that allows public/preview access
CREATE POLICY "screenplay_elements_select" ON public.screenplay_elements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = screenplay_elements.project_id
      AND (
        -- Owner can always view
        p.owner_id = auth.uid()
        -- Active collaborators can view
        OR EXISTS (
          SELECT 1 FROM public.project_collaborators pc
          WHERE pc.project_id = p.id
          AND pc.user_id = auth.uid()
          AND pc.status = 'active'
        )
        -- Anyone can view public or preview projects
        OR p.visibility IN ('public', 'preview')
      )
    )
  );

-- Also update screenplay_scenes policy for consistency
DROP POLICY IF EXISTS "screenplay_scenes_select" ON public.screenplay_scenes;

CREATE POLICY "screenplay_scenes_select" ON public.screenplay_scenes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = screenplay_scenes.project_id
      AND (
        p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.project_collaborators pc
          WHERE pc.project_id = p.id
          AND pc.user_id = auth.uid()
          AND pc.status = 'active'
        )
        OR p.visibility IN ('public', 'preview')
      )
    )
  );

-- Update screenplay_characters policy for consistency
DROP POLICY IF EXISTS "screenplay_characters_select" ON public.screenplay_characters;

CREATE POLICY "screenplay_characters_select" ON public.screenplay_characters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = screenplay_characters.project_id
      AND (
        p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.project_collaborators pc
          WHERE pc.project_id = p.id
          AND pc.user_id = auth.uid()
          AND pc.status = 'active'
        )
        OR p.visibility IN ('public', 'preview')
      )
    )
  );

-- Update screenplay_revisions policy (read-only for public)
DROP POLICY IF EXISTS "screenplay_revisions_select" ON public.screenplay_revisions;

CREATE POLICY "screenplay_revisions_select" ON public.screenplay_revisions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = screenplay_revisions.project_id
      AND (
        p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.project_collaborators pc
          WHERE pc.project_id = p.id
          AND pc.user_id = auth.uid()
          AND pc.status = 'active'
        )
        OR p.visibility IN ('public', 'preview')
      )
    )
  );

-- Update screenplay_comments policy (public can view, not create)
DROP POLICY IF EXISTS "screenplay_comments_select" ON public.screenplay_comments;

CREATE POLICY "screenplay_comments_select" ON public.screenplay_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = screenplay_comments.project_id
      AND (
        p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.project_collaborators pc
          WHERE pc.project_id = p.id
          AND pc.user_id = auth.uid()
          AND pc.status = 'active'
        )
        OR p.visibility IN ('public', 'preview')
      )
    )
  );
