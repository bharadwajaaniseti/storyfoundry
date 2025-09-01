-- Add profile access request system for private profiles
-- This allows users to request access to private profiles and owners to manage those requests

-- PROFILE ACCESS REQUESTS
-- Users requesting access to private profiles
CREATE TABLE public.profile_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending','approved','denied')) DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  decided_at TIMESTAMPTZ,
  UNIQUE(profile_id, requester_id)
);

-- PROFILE ACCESS GRANTS
-- Approved access allowing users to view private profiles
CREATE TABLE public.profile_access_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  granted_to_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  granted_by_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, granted_to_id)
);

-- NOTIFICATIONS
-- System notifications for various events
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('profile_access_request', 'profile_access_granted', 'profile_access_denied', 'follow', 'project_comment', 'collaboration_invite')) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES for performance
CREATE INDEX idx_profile_access_requests_profile_id ON public.profile_access_requests(profile_id);
CREATE INDEX idx_profile_access_requests_requester_id ON public.profile_access_requests(requester_id);
CREATE INDEX idx_profile_access_requests_status ON public.profile_access_requests(status);
CREATE INDEX idx_profile_access_grants_profile_id ON public.profile_access_grants(profile_id);
CREATE INDEX idx_profile_access_grants_granted_to_id ON public.profile_access_grants(granted_to_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- RLS POLICIES
ALTER TABLE public.profile_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profile access requests policies
-- Profile owners and requesters can view their requests
CREATE POLICY "profile_access_requests_select_involved" ON public.profile_access_requests
  FOR SELECT USING (
    requester_id = auth.uid() OR 
    profile_id = auth.uid()
  );

-- Only authenticated users can create access requests (not to themselves)
CREATE POLICY "profile_access_requests_insert_auth" ON public.profile_access_requests
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    requester_id = auth.uid() AND 
    profile_id != auth.uid()
  );

-- Only profile owners can update request status
CREATE POLICY "profile_access_requests_update_owner" ON public.profile_access_requests
  FOR UPDATE USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Profile access grants policies
-- Profile owners and granted users can view grants
CREATE POLICY "profile_access_grants_select_involved" ON public.profile_access_grants
  FOR SELECT USING (
    profile_id = auth.uid() OR 
    granted_to_id = auth.uid()
  );

-- Only profile owners can insert grants
CREATE POLICY "profile_access_grants_insert_owner" ON public.profile_access_grants
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    granted_by_id = auth.uid() AND 
    profile_id = auth.uid()
  );

-- Only profile owners can delete grants
CREATE POLICY "profile_access_grants_delete_owner" ON public.profile_access_grants
  FOR DELETE USING (profile_id = auth.uid());

-- Notifications policies
-- Users can only see their own notifications
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

-- Only the system can insert notifications (through functions)
CREATE POLICY "notifications_insert_system" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to create notifications
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle profile access request decisions
CREATE OR REPLACE FUNCTION public.handle_profile_access_decision(
  p_request_id UUID,
  p_status TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  request_record RECORD;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Get the request details
  SELECT * INTO request_record
  FROM public.profile_access_requests
  WHERE id = p_request_id AND profile_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update the request status
  UPDATE public.profile_access_requests
  SET status = p_status, decided_at = NOW()
  WHERE id = p_request_id;
  
  -- If approved, create an access grant
  IF p_status = 'approved' THEN
    INSERT INTO public.profile_access_grants (profile_id, granted_to_id, granted_by_id)
    VALUES (request_record.profile_id, request_record.requester_id, auth.uid())
    ON CONFLICT (profile_id, granted_to_id) DO NOTHING;
    
    notification_title := 'Profile Access Granted';
    notification_message := 'Your request to view this profile has been approved.';
  ELSE
    notification_title := 'Profile Access Denied';
    notification_message := 'Your request to view this profile has been denied.';
  END IF;
  
  -- Create notification for the requester
  PERFORM public.create_notification(
    request_record.requester_id,
    'profile_access_' || p_status,
    notification_title,
    notification_message,
    jsonb_build_object('profile_id', request_record.profile_id)
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE public.profile_access_requests IS 'Requests for access to private profiles';
COMMENT ON TABLE public.profile_access_grants IS 'Granted access to private profiles';
COMMENT ON TABLE public.notifications IS 'System notifications for users';
COMMENT ON FUNCTION public.create_notification IS 'Helper function to create notifications';
COMMENT ON FUNCTION public.handle_profile_access_decision IS 'Handle approval/denial of profile access requests';
