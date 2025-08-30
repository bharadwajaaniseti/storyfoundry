-- StoryFoundry Initial Schema Migration
-- This file contains the complete database schema for StoryFoundry

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS & PROFILES
-- Extends Supabase auth.users with application-specific profile data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('writer','pro','admin')) NOT NULL DEFAULT 'writer',
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  verified_pro BOOLEAN DEFAULT FALSE,
  company TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROJECTS
-- Core content entities created by writers
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  logline TEXT NOT NULL,
  synopsis TEXT,
  format TEXT CHECK (format IN ('screenplay','short_story','novel','treatment','pilot')) NOT NULL,
  genre TEXT,
  subgenre TEXT,
  est_budget_range TEXT,
  word_count INTEGER,
  cast_size INTEGER,
  language TEXT DEFAULT 'en',
  visibility TEXT CHECK (visibility IN ('private','preview','public')) DEFAULT 'preview',
  buzz_score NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROJECT ASSETS
-- Files associated with projects (covers, PDFs, supporting materials)
CREATE TABLE public.project_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  kind TEXT CHECK (kind IN ('cover','sample_pdf','full_pdf','supporting')) NOT NULL,
  storage_path TEXT NOT NULL,
  original_filename TEXT,
  bytes BIGINT,
  checksum TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACCESS REQUESTS
-- Pro users requesting access to preview or full content
CREATE TABLE public.access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  pro_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending','approved','denied')) DEFAULT 'pending',
  nda_required BOOLEAN DEFAULT TRUE,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  decided_at TIMESTAMPTZ,
  UNIQUE(project_id, pro_id)
);

-- ACCESS GRANTS
-- Approved access allowing users to view project content
CREATE TABLE public.access_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  viewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  scope TEXT CHECK (scope IN ('preview','full')) DEFAULT 'full',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, viewer_id)
);

-- IP TIMESTAMPS
-- Intellectual property timestamps for projects
CREATE TABLE public.ip_timestamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  content_hash TEXT NOT NULL,
  provider TEXT DEFAULT 'local',
  provider_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COLLABORATIONS
-- Team members working on projects with defined roles and splits
CREATE TABLE public.collaborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('coauthor','editor','translator','producer')) NOT NULL,
  royalty_split NUMERIC CHECK (royalty_split >= 0 AND royalty_split <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, member_id)
);

-- PITCH ROOMS
-- Scheduled events where projects can be pitched
CREATE TABLE public.pitch_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  theme TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  is_pro_only BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PITCH SUBMISSIONS
-- Projects submitted to pitch rooms
CREATE TABLE public.pitch_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.pitch_rooms(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  submitter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending','accepted','rejected','waitlist')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, project_id)
);

-- ENGAGEMENT EVENTS
-- User interactions with projects for buzz score calculation
CREATE TABLE public.engagement_events (
  id BIGSERIAL PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  kind TEXT CHECK (kind IN ('view','like','save','comment')) NOT NULL,
  weight NUMERIC DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUBSCRIPTIONS
-- User subscription tiers and Stripe integration
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tier TEXT CHECK (tier IN ('free','writer_plus','pro_plus')) DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_sub_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- INDEXES for performance
CREATE INDEX idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX idx_projects_visibility ON public.projects(visibility);
CREATE INDEX idx_projects_buzz_score ON public.projects(buzz_score DESC);
CREATE INDEX idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX idx_project_assets_project_id ON public.project_assets(project_id);
CREATE INDEX idx_access_requests_project_id ON public.access_requests(project_id);
CREATE INDEX idx_access_requests_pro_id ON public.access_requests(pro_id);
CREATE INDEX idx_access_grants_project_id ON public.access_grants(project_id);
CREATE INDEX idx_access_grants_viewer_id ON public.access_grants(viewer_id);
CREATE INDEX idx_engagement_events_project_id ON public.engagement_events(project_id);
CREATE INDEX idx_engagement_events_actor_id ON public.engagement_events(actor_id);
CREATE INDEX idx_engagement_events_created_at ON public.engagement_events(created_at DESC);

-- TRIGGERS for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
