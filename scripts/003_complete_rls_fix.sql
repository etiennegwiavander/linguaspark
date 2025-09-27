-- Complete RLS fix for LinguaSpark
-- Run this in your Supabase SQL Editor

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Tutors can view own profile" ON tutors;
DROP POLICY IF EXISTS "Tutors can update own profile" ON tutors;
DROP POLICY IF EXISTS "Tutors can create own profile" ON tutors;

-- Create comprehensive RLS policies for tutors table
CREATE POLICY "Tutors can create own profile" ON tutors
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Tutors can view own profile" ON tutors
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Tutors can update own profile" ON tutors
  FOR UPDATE USING (auth.uid() = id);

-- Ensure the tutors table has the correct structure
-- Add a trigger to automatically set the ID to auth.uid() if not provided
CREATE OR REPLACE FUNCTION set_tutor_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.id IS NULL THEN
    NEW.id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS set_tutor_id_trigger ON tutors;
CREATE TRIGGER set_tutor_id_trigger
  BEFORE INSERT ON tutors
  FOR EACH ROW
  EXECUTE FUNCTION set_tutor_id();