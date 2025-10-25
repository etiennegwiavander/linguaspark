-- Fix RLS Policies for Lessons Table
-- Run this in Supabase SQL Editor

-- STEP 1: Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'lessons';

-- STEP 2: Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'lessons';

-- STEP 3: Drop all existing policies on lessons table
DROP POLICY IF EXISTS "Tutors can view own lessons" ON lessons;
DROP POLICY IF EXISTS "Tutors can insert own lessons" ON lessons;
DROP POLICY IF EXISTS "Tutors can update own lessons" ON lessons;
DROP POLICY IF EXISTS "Tutors can delete own lessons" ON lessons;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON lessons;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON lessons;
DROP POLICY IF EXISTS "Enable update for users based on tutor_id" ON lessons;
DROP POLICY IF EXISTS "Enable delete for users based on tutor_id" ON lessons;

-- STEP 4: Create new, correct RLS policies
CREATE POLICY "Tutors can view own lessons" ON lessons
  FOR SELECT
  USING (auth.uid() = tutor_id);

CREATE POLICY "Tutors can insert own lessons" ON lessons
  FOR INSERT
  WITH CHECK (auth.uid() = tutor_id);

CREATE POLICY "Tutors can update own lessons" ON lessons
  FOR UPDATE
  USING (auth.uid() = tutor_id)
  WITH CHECK (auth.uid() = tutor_id);

CREATE POLICY "Tutors can delete own lessons" ON lessons
  FOR DELETE
  USING (auth.uid() = tutor_id);

-- STEP 5: Verify RLS is enabled (it should be)
-- If this returns 'f' (false), run: ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- STEP 6: Test the policies
-- This should now return your lessons
SELECT id, title, tutor_id, created_at
FROM lessons
ORDER BY created_at DESC
LIMIT 5;
