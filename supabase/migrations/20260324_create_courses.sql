-- Create courses table for storing YouTube video links
-- This table stores course/video information with YouTube integration

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT NOT NULL,
  youtube_video_id TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER, -- in seconds
  category TEXT,
  is_premium BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_display_order ON courses(display_order);
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON courses(is_active);
CREATE INDEX IF NOT EXISTS idx_courses_youtube_video_id ON courses(youtube_video_id);

-- Enable Row Level Security
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courses
CREATE POLICY "Anyone can view active courses"
  ON courses FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Service role can do anything with courses"
  ON courses FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
