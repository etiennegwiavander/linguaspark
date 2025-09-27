-- Fix: Add missing INSERT policy for tutors table
-- This allows authenticated users to create their own tutor profile

-- Add the missing INSERT policy for tutors
CREATE POLICY "Tutors can create own profile" ON tutors
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Also add a policy to allow users to insert with their auth.uid() as the id
-- This is more practical for the signup flow
DROP POLICY IF EXISTS "Tutors can create own profile" ON tutors;

CREATE POLICY "Tutors can create own profile" ON tutors
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    (id = auth.uid() OR id IS NULL)
  );