-- Create Admin User Setup Script
-- Run this in Supabase SQL Editor after creating the user via Supabase Auth

-- Step 1: First, create the user via Supabase Dashboard:
-- Go to Authentication > Users > Add User
-- Email: admin@admin.com
-- Password: admin123
-- Auto Confirm User: YES (important!)

-- Step 2: After creating the user, get their ID from the auth.users table
-- You can find it in the Authentication > Users page

-- Step 3: Run this script, replacing YOUR_USER_ID with the actual UUID

-- Example (replace with your actual user ID):
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW()
-- WHERE email = 'admin@admin.com';

-- Create or update tutor profile with admin flag
INSERT INTO tutors (id, email, is_admin, created_at, updated_at)
SELECT 
    id,
    email,
    true as is_admin,
    NOW() as created_at,
    NOW() as updated_at
FROM auth.users
WHERE email = 'admin@admin.com'
ON CONFLICT (id) 
DO UPDATE SET 
    is_admin = true,
    updated_at = NOW();

-- Verify the admin user was created
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    t.is_admin,
    t.created_at
FROM auth.users u
LEFT JOIN tutors t ON u.id = t.id
WHERE u.email = 'admin@admin.com';

-- Expected output:
-- id: [UUID]
-- email: admin@admin.com
-- email_confirmed_at: [timestamp] (should NOT be null)
-- is_admin: true
-- created_at: [timestamp]
