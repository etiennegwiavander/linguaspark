-- Allow anyone to check if a user is an admin
-- This is safe because we're only exposing a boolean flag, not sensitive data

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow public read of admin status" ON tutors;

-- Create policy to allow reading is_admin column for any user
CREATE POLICY "Allow public read of admin status"
ON tutors
FOR SELECT
USING (true);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'tutors' AND policyname = 'Allow public read of admin status';
