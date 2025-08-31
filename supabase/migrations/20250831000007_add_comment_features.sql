-- Add comment likes/dislikes table
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID REFERENCES public.project_comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_like BOOLEAN NOT NULL, -- true for like, false for dislike
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure one reaction per user per comment
    UNIQUE(comment_id, user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id);

-- Add RLS policies
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can view comment likes
CREATE POLICY "Anyone can view comment likes" ON public.comment_likes
    FOR SELECT USING (true);

-- Users can manage their own likes
CREATE POLICY "Users can manage their own likes" ON public.comment_likes
    FOR ALL USING (auth.uid() = user_id);

-- Add like/dislike counts to comments (computed)
-- We'll compute these in the application rather than storing them

-- Grant permissions
GRANT ALL ON public.comment_likes TO anon, authenticated;
