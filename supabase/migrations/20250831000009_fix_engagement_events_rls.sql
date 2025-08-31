-- Add missing RLS policies for engagement_events DELETE operations
-- This allows users to remove their own bookmarks and engagement events

-- Users can only delete their own engagement events (bookmarks, likes, etc.)
CREATE POLICY "engagement_events_delete_own" ON public.engagement_events
  FOR DELETE USING (auth.uid() = actor_id);

-- Users can update their own engagement events (if needed for weight changes, etc.)
CREATE POLICY "engagement_events_update_own" ON public.engagement_events
  FOR UPDATE USING (auth.uid() = actor_id) 
  WITH CHECK (auth.uid() = actor_id);
