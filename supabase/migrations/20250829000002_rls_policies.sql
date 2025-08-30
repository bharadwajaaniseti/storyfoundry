-- Row Level Security (RLS) Policies for StoryFoundry
-- This migration sets up security policies to control data access

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_timestamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pitch_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pitch_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
-- Users can view all profiles (for public discovery)
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- PROJECTS POLICIES
-- Public and preview projects are viewable by authenticated users
CREATE POLICY "projects_select_public" ON public.projects
  FOR SELECT USING (
    visibility IN ('public', 'preview') 
    OR owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.access_grants 
      WHERE project_id = projects.id AND viewer_id = auth.uid()
    )
  );

-- Only owners can insert projects
CREATE POLICY "projects_insert_own" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Only owners can update their projects
CREATE POLICY "projects_update_own" ON public.projects
  FOR UPDATE USING (auth.uid() = owner_id);

-- Only owners can delete their projects
CREATE POLICY "projects_delete_own" ON public.projects
  FOR DELETE USING (auth.uid() = owner_id);

-- PROJECT ASSETS POLICIES
-- No direct select access - assets must be accessed through signed URLs
-- Only owners can manage assets
CREATE POLICY "project_assets_select_own" ON public.project_assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_assets.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "project_assets_insert_own" ON public.project_assets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "project_assets_update_own" ON public.project_assets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_assets.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "project_assets_delete_own" ON public.project_assets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_assets.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

-- ACCESS REQUESTS POLICIES
-- Project owners and requesting pros can view access requests
CREATE POLICY "access_requests_select_involved" ON public.access_requests
  FOR SELECT USING (
    pro_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = access_requests.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

-- Only pros can create access requests
CREATE POLICY "access_requests_insert_pro" ON public.access_requests
  FOR INSERT WITH CHECK (
    auth.uid() = pro_id 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('pro', 'admin')
    )
  );

-- Only project owners can update access requests (approve/deny)
CREATE POLICY "access_requests_update_owner" ON public.access_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = access_requests.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

-- ACCESS GRANTS POLICIES
-- Viewers and project owners can see grants
CREATE POLICY "access_grants_select_involved" ON public.access_grants
  FOR SELECT USING (
    viewer_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = access_grants.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

-- Only project owners can create grants
CREATE POLICY "access_grants_insert_owner" ON public.access_grants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_id 
      AND projects.owner_id = auth.uid()
    )
  );

-- Only project owners can delete grants
CREATE POLICY "access_grants_delete_owner" ON public.access_grants
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = access_grants.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

-- IP TIMESTAMPS POLICIES
-- Only project owners can manage IP timestamps
CREATE POLICY "ip_timestamps_select_owner" ON public.ip_timestamps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = ip_timestamps.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "ip_timestamps_insert_owner" ON public.ip_timestamps
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_id 
      AND projects.owner_id = auth.uid()
    )
  );

-- COLLABORATIONS POLICIES
-- Project owners and collaborators can view collaborations
CREATE POLICY "collaborations_select_involved" ON public.collaborations
  FOR SELECT USING (
    member_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = collaborations.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

-- Only project owners can manage collaborations
CREATE POLICY "collaborations_insert_owner" ON public.collaborations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "collaborations_update_owner" ON public.collaborations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = collaborations.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "collaborations_delete_owner" ON public.collaborations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = collaborations.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

-- PITCH ROOMS POLICIES
-- All authenticated users can view pitch rooms
CREATE POLICY "pitch_rooms_select_all" ON public.pitch_rooms
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only verified pros and admins can create pitch rooms
CREATE POLICY "pitch_rooms_insert_pro" ON public.pitch_rooms
  FOR INSERT WITH CHECK (
    auth.uid() = host_id 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR (profiles.role = 'pro' AND profiles.verified_pro = true))
    )
  );

-- Only hosts can update their pitch rooms
CREATE POLICY "pitch_rooms_update_host" ON public.pitch_rooms
  FOR UPDATE USING (auth.uid() = host_id);

-- Only hosts can delete their pitch rooms
CREATE POLICY "pitch_rooms_delete_host" ON public.pitch_rooms
  FOR DELETE USING (auth.uid() = host_id);

-- PITCH SUBMISSIONS POLICIES
-- Room hosts and submitters can view submissions
CREATE POLICY "pitch_submissions_select_involved" ON public.pitch_submissions
  FOR SELECT USING (
    submitter_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.pitch_rooms 
      WHERE pitch_rooms.id = pitch_submissions.room_id 
      AND pitch_rooms.host_id = auth.uid()
    )
  );

-- Only project owners can submit their projects
CREATE POLICY "pitch_submissions_insert_owner" ON public.pitch_submissions
  FOR INSERT WITH CHECK (
    auth.uid() = submitter_id 
    AND EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_id 
      AND projects.owner_id = auth.uid()
    )
  );

-- Only room hosts can update submission status
CREATE POLICY "pitch_submissions_update_host" ON public.pitch_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.pitch_rooms 
      WHERE pitch_rooms.id = pitch_submissions.room_id 
      AND pitch_rooms.host_id = auth.uid()
    )
  );

-- ENGAGEMENT EVENTS POLICIES
-- Users can view engagement on projects they have access to
CREATE POLICY "engagement_events_select_access" ON public.engagement_events
  FOR SELECT USING (
    actor_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = engagement_events.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

-- Users can only create engagement events for themselves
CREATE POLICY "engagement_events_insert_own" ON public.engagement_events
  FOR INSERT WITH CHECK (auth.uid() = actor_id);

-- SUBSCRIPTIONS POLICIES
-- Users can only view and manage their own subscriptions
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "subscriptions_insert_own" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subscriptions_update_own" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- STORAGE POLICIES
-- Set up storage bucket policies for project assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-assets', 'project-assets', false);

-- Only project owners can upload assets
CREATE POLICY "project_assets_upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'project-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Only project owners can view their assets
CREATE POLICY "project_assets_view" ON storage.objects FOR SELECT USING (
  bucket_id = 'project-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Only project owners can delete their assets
CREATE POLICY "project_assets_delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'project-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
