-- Create Admin User Script
-- This script creates an admin user account in Supabase
-- 
-- IMPORTANT: Run this script AFTER creating the user in Supabase Auth
-- 
-- Steps to create admin user:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User" and create user with:
--    Email: admin@admin.com
--    Password: admin123
--    (Make sure to uncheck "Auto Confirm User" if you want to confirm manually)
-- 3. Copy the user's UUID from the users table
-- 4. Run this script, replacing <USER_UUID> with the actual UUID

-- Update the tutor record to set is_admin = true
-- Replace <USER_UUID> with the actual UUID of the admin user
UPDATE tutors
SET is_admin = true
WHERE id = '<USER_UUID>';

-- Verify the admin user was created
SELECT id, email, is_admin, created_at
FROM tutors
WHERE is_admin = true;

-- Alternative: If you know the email, you can use this query
-- UPDATE tutors
-- SET is_admin = true
-- WHERE email = 'admin@admin.com';
