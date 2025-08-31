-- Add tables for project viewing features

-- Drop existing tables if they exist (safe recreation)
DROP TABLE IF EXISTS public.project_comments CASCADE;
DROP TABLE IF EXISTS public.reading_progress CASCADE;
DROP TABLE IF EXISTS public.writer_favorites CASCADE;

-- Project comments table
CREATE TABLE public.project_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.project_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Reading progress table
CREATE TABLE public.reading_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  progress_percentage DECIMAL(5,2) DEFAULT 0 NOT NULL CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  last_position INTEGER DEFAULT 0 NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(project_id, user_id)
);

-- Writer favorites table (for following writers)
CREATE TABLE public.writer_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  writer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(follower_id, writer_id),
  CHECK (follower_id != writer_id)
);

-- Add indexes for performance
CREATE INDEX idx_project_comments_project_id ON public.project_comments(project_id);
CREATE INDEX idx_project_comments_user_id ON public.project_comments(user_id);
CREATE INDEX idx_project_comments_parent_id ON public.project_comments(parent_id);
CREATE INDEX idx_project_comments_created_at ON public.project_comments(created_at DESC);

CREATE INDEX idx_reading_progress_project_id ON public.reading_progress(project_id);
CREATE INDEX idx_reading_progress_user_id ON public.reading_progress(user_id);
CREATE INDEX idx_reading_progress_updated_at ON public.reading_progress(updated_at DESC);

CREATE INDEX idx_writer_favorites_follower_id ON public.writer_favorites(follower_id);
CREATE INDEX idx_writer_favorites_writer_id ON public.writer_favorites(writer_id);

-- Enable RLS on new tables
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.writer_favorites ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_comments
CREATE POLICY "Comments are viewable by everyone"
  ON public.project_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_comments.project_id 
      AND projects.visibility = 'public'
    )
  );

CREATE POLICY "Users can insert their own comments"
  ON public.project_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.project_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.project_comments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for reading_progress
CREATE POLICY "Users can view their own reading progress"
  ON public.reading_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reading progress"
  ON public.reading_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading progress"
  ON public.reading_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS policies for writer_favorites
CREATE POLICY "Users can view their own favorites"
  ON public.writer_favorites FOR SELECT
  USING (auth.uid() = follower_id);

CREATE POLICY "Writers can see their followers"
  ON public.writer_favorites FOR SELECT
  USING (auth.uid() = writer_id);

CREATE POLICY "Users can manage their own favorites"
  ON public.writer_favorites FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can remove their own favorites"
  ON public.writer_favorites FOR DELETE
  USING (auth.uid() = follower_id);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_project_comments
  BEFORE UPDATE ON public.project_comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_reading_progress
  BEFORE UPDATE ON public.reading_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
