-- Rollback Migration: Remove Public Lessons Feature
-- This script removes the public lessons table and admin functionality
-- Run this in Supabase SQL Editor if you need to rollback the migration

-- ============================================================================
-- WARNING: This will permanently delete all public lessons data!
-- ============================================================================

-- STEP 1: Drop triggers
DROP TRIGGER IF EXISTS update_public_lessons_updated_at ON public_lessons;

-- STEP 2: Drop RLS policies
DROP POLICY IF EXISTS "Public lessons are viewable by everyone" ON public_lessons;
DROP POLICY IF EXISTS "Authenticated users can create public lessons" ON public_lessons;
DROP POLICY IF EXISTS "Authenticated users can update public lessons" ON public_lessons;
DROP POLICY IF EXISTS "Only admins can delete public lessons" ON public_lessons;

-- STEP 3: Drop the public_lessons table (CASCADE will drop dependent objects)
DROP TABLE IF EXISTS public_lessons CASCADE;

-- STEP 4: Drop the trigger function if no other tables use it
-- Note: Only drop this if you're sure no other tables use this function
-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- STEP 5: Remove is_admin column from tutors table
ALTER TABLE tutors DROP COLUMN IF EXISTS is_admin;

-- STEP 6: Drop the admin index
DROP INDEX IF EXISTS idx_tutors_is_admin;

-- ============================================================================
-- Verification queries
-- ============================================================================

-- Verify public_lessons table was dropped
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'public_lessons';
-- Should return no rows

-- Verify is_admin column was removed
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'tutors' AND column_name = 'is_admin';
-- Should return no rows

-- ============================================================================
-- Rollback Complete
-- ============================================================================

