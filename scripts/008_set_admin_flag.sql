-- Set Admin Flag for User
-- Run this script to make a specific user an admin

-- Replace with your actual user ID from the console logs
-- Your user ID: 67cbea4f-c49e-4d45-a112-309f942f6120

-- Set admin flag for the specific user
UPDATE tutors
SET is_admin = true
WHERE id = '67cbea4f-c49e-4d45-a112-309f942f6120';

-- Verify the update
SELECT id, email, is_admin, created_at
FROM tutors
WHERE id = '67cbea4f-c49e-4d45-a112-309f942f6120';

-- Alternative: Set admin by email if you know it
-- UPDATE tutors
-- SET is_admin = true
-- WHERE email = 'admin@admin.com';

-- Check all admin users
SELECT id, email, is_admin, created_at
FROM tutors
WHERE is_admin = true;
