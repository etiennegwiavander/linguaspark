-- Fix tutor_id mismatch for existing lessons
-- Run this in Supabase SQL Editor

-- STEP 1: Check current situation
-- See all lessons and their tutor_ids
SELECT 
    id,
    title,
    tutor_id,
    created_at
FROM lessons
ORDER BY created_at DESC;

-- See all auth users
SELECT 
    id,
    email
FROM auth.users;

-- STEP 2: Update lessons to match your current user
-- Replace 'YOUR_CURRENT_USER_ID' with your actual user ID from auth.users
-- Example: UPDATE lessons SET tutor_id = '762f0dc5-b66e-41f0-a3f4-f4e33a46bbe6';

-- Uncomment and run this after replacing YOUR_CURRENT_USER_ID:
-- UPDATE lessons 
-- SET tutor_id = 'YOUR_CURRENT_USER_ID'
-- WHERE tutor_id IS NULL OR tutor_id != 'YOUR_CURRENT_USER_ID';

-- STEP 3: Ensure tutor profile exists
-- Replace 'YOUR_CURRENT_USER_ID' and 'your-email@example.com'
-- INSERT INTO tutors (id, email)
-- VALUES ('YOUR_CURRENT_USER_ID', 'your-email@example.com')
-- ON CONFLICT (id) DO NOTHING;

-- STEP 4: Verify the fix
-- SELECT 
--     l.id,
--     l.title,
--     l.tutor_id,
--     t.email as tutor_email
-- FROM lessons l
-- LEFT JOIN tutors t ON l.tutor_id = t.id;
