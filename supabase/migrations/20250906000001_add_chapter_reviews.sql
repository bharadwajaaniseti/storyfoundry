-- Add chapter reviews system for detailed chapter feedback
-- This migration adds a comprehensive review system for chapter-level feedback

-- Create chapter reviews table
CREATE TABLE IF NOT EXISTS chapter_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID REFERENCES project_chapters(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- One review per user per chapter
  UNIQUE(chapter_id, user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_chapter_reviews_chapter_id ON chapter_reviews(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_reviews_user_id ON chapter_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_chapter_reviews_rating ON chapter_reviews(rating);

-- Add RLS policies
ALTER TABLE chapter_reviews ENABLE ROW LEVEL SECURITY;

-- Chapter reviews policies
CREATE POLICY "Users can view reviews on accessible chapters" ON chapter_reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_chapters pc
      JOIN projects p ON p.id = pc.project_id
      WHERE pc.id = chapter_reviews.chapter_id 
      AND (
        p.owner_id = auth.uid() OR 
        p.visibility IN ('public', 'preview') OR
        EXISTS (
          SELECT 1 FROM collaborations col 
          WHERE col.project_id = p.id AND col.member_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Authenticated users can create reviews on accessible chapters" ON chapter_reviews
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM project_chapters pc
      JOIN projects p ON p.id = pc.project_id
      WHERE pc.id = chapter_reviews.chapter_id 
      AND (
        p.owner_id = auth.uid() OR 
        p.visibility IN ('public', 'preview') OR
        EXISTS (
          SELECT 1 FROM collaborations col 
          WHERE col.project_id = p.id AND col.member_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update their own reviews" ON chapter_reviews
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own reviews" ON chapter_reviews
  FOR DELETE USING (user_id = auth.uid());

-- Create function for automatic updated_at timestamps
CREATE OR REPLACE FUNCTION update_chapter_review_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updated_at timestamps
DROP TRIGGER IF EXISTS trigger_update_chapter_review_updated_at ON chapter_reviews;
CREATE TRIGGER trigger_update_chapter_review_updated_at
  BEFORE UPDATE ON chapter_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_chapter_review_updated_at();
