-- Migration: Create Public Lessons Feature
-- This script adds admin functionality and creates the public lessons table
-- Run this in Supabase SQL Editor

-- ============================================================================
-- STEP 1: Add is_admin column to tutors table
-- ============================================================================

ALTER TABLE tutors ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create index for admin lookups
CREATE INDEX IF NOT EXISTS idx_tutors_is_admin ON tutors(is_admin) WHERE is_admin = true;

-- ============================================================================
-- STEP 2: Create public_lessons table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public_lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Creator information
  creator_id UUID REFERENCES tutors(id) ON DELETE SET NULL,
  
  -- Lesson content (same structure as lessons table)
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  source_url TEXT,
  source_title TEXT,
  banner_image_url TEXT,
  
  -- Categorization
  category TEXT NOT NULL,
  cefr_level TEXT NOT NULL CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1')),
  lesson_type TEXT NOT NULL CHECK (lesson_type IN ('discussion', 'grammar', 'travel', 'business', 'pronunciation')),
  
  -- Additional metadata
  tags TEXT[],
  estimated_duration_minutes INTEGER,
  
  -- Search optimization
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(source_title, ''))
  ) STORED
);

-- ============================================================================
-- STEP 3: Create indexes for performance optimization
-- ============================================================================

-- Indexes for filtering
CREATE INDEX IF NOT EXISTS idx_public_lessons_category ON public_lessons(category);
CREATE INDEX IF NOT EXISTS idx_public_lessons_cefr_level ON public_lessons(cefr_level);
CREATE INDEX IF NOT EXISTS idx_public_lessons_lesson_type ON public_lessons(lesson_type);
CREATE INDEX IF NOT EXISTS idx_public_lessons_creator ON public_lessons(creator_id);

-- Index for full-text search
CREATE INDEX IF NOT EXISTS idx_public_lessons_search ON public_lessons USING GIN(search_vector);

-- Index for sorting by creation date
CREATE INDEX IF NOT EXISTS idx_public_lessons_created_at ON public_lessons(created_at DESC);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_public_lessons_category_level ON public_lessons(category, cefr_level);

-- ============================================================================
-- STEP 4: Create trigger for updated_at timestamp
-- ============================================================================

-- Create or replace the trigger function (reusable for multiple tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for public_lessons table
DROP TRIGGER IF EXISTS update_public_lessons_updated_at ON public_lessons;
CREATE TRIGGER update_public_lessons_updated_at
  BEFORE UPDATE ON public_lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 5: Enable Row Level Security
-- ============================================================================

ALTER TABLE public_lessons ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: Create RLS policies for public lessons
-- ============================================================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Public lessons are viewable by everyone" ON public_lessons;
DROP POLICY IF EXISTS "Authenticated users can create public lessons" ON public_lessons;
DROP POLICY IF EXISTS "Authenticated users can update public lessons" ON public_lessons;
DROP POLICY IF EXISTS "Only admins can delete public lessons" ON public_lessons;

-- Policy 1: Public read access (authenticated and unauthenticated)
-- Requirement 12.1: Allow read access to all users
CREATE POLICY "Public lessons are viewable by everyone"
  ON public_lessons
  FOR SELECT
  USING (true);

-- Policy 2: Authenticated users can insert
-- Requirement 12.2: Allow insert for authenticated users
CREATE POLICY "Authenticated users can create public lessons"
  ON public_lessons
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy 3: Authenticated users can update any public lesson
-- Requirement 12.3: Allow update for authenticated users
CREATE POLICY "Authenticated users can update public lessons"
  ON public_lessons
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy 4: Only admins can delete
-- Requirements 12.4, 12.5: Only admins can delete, non-admins are denied
CREATE POLICY "Only admins can delete public lessons"
  ON public_lessons
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tutors
      WHERE tutors.id = auth.uid()
      AND tutors.is_admin = true
    )
  );

-- ============================================================================
-- STEP 7: Verification queries
-- ============================================================================

-- Verify the is_admin column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'tutors' AND column_name = 'is_admin';

-- Verify the public_lessons table was created
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'public_lessons'
ORDER BY ordinal_position;

-- Verify indexes were created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'public_lessons'
ORDER BY indexname;

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'public_lessons';

-- Verify RLS policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'public_lessons'
ORDER BY policyname;

-- Verify trigger was created
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'public_lessons';

-- ============================================================================
-- STEP 8: Grant necessary permissions (if needed)
-- ============================================================================

-- Grant usage on the table to authenticated users
GRANT SELECT ON public_lessons TO authenticated;
GRANT INSERT ON public_lessons TO authenticated;
GRANT UPDATE ON public_lessons TO authenticated;
GRANT DELETE ON public_lessons TO authenticated;

-- Grant usage on the table to anonymous users (for read-only access)
GRANT SELECT ON public_lessons TO anon;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Summary:
-- ✓ Added is_admin column to tutors table
-- ✓ Created public_lessons table with all required fields
-- ✓ Created 7 indexes for performance optimization
-- ✓ Created updated_at trigger
-- ✓ Enabled Row Level Security
-- ✓ Created 4 RLS policies (read for all, insert/update for authenticated, delete for admins only)
-- ✓ Granted necessary permissions

