-- Add user_follows table for following functionality
-- This allows users to follow other writers

CREATE TABLE public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id) -- Prevent users from following themselves
);

-- Add indexes for performance
CREATE INDEX idx_user_follows_follower_id ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following_id ON public.user_follows(following_id);
CREATE INDEX idx_user_follows_created_at ON public.user_follows(created_at DESC);

-- RLS Policies
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Users can read all follow relationships (for follower counts, etc.)
CREATE POLICY "Anyone can view follow relationships" ON public.user_follows
  FOR SELECT USING (true);

-- Users can only create follows where they are the follower
CREATE POLICY "Users can follow others" ON public.user_follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Users can only delete follows where they are the follower (unfollow)
CREATE POLICY "Users can unfollow others" ON public.user_follows
  FOR DELETE USING (auth.uid() = follower_id);

-- No updates allowed on follow relationships
CREATE POLICY "No updates on follow relationships" ON public.user_follows
  FOR UPDATE USING (false);

COMMENT ON TABLE public.user_follows IS 'Tracks user following relationships for social features';
