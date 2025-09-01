-- Fix RLS policies for profile access requests
-- Allow requesters to update/delete their own requests

-- Allow requesters to update their own requests (for re-requesting after revocation)
CREATE POLICY "profile_access_requests_update_requester" ON public.profile_access_requests
  FOR UPDATE USING (requester_id = auth.uid())
  WITH CHECK (requester_id = auth.uid());

-- Allow requesters to delete their own requests
CREATE POLICY "profile_access_requests_delete_requester" ON public.profile_access_requests
  FOR DELETE USING (requester_id = auth.uid());

-- Allow profile owners to delete requests for their profile
CREATE POLICY "profile_access_requests_delete_owner" ON public.profile_access_requests
  FOR DELETE USING (profile_id = auth.uid());
