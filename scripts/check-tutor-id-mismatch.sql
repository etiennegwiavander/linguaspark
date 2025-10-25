-- Check for tutor_id mismatch
-- Run this in Supabase SQL Editor

-- 1. Check all lessons and their tutor_ids
SELECT 
    id,
    title,
    tutor_id,
    created_at
FROM lessons
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check all tutors
SELECT 
    id,
    email,
    created_at
FROM tutors
ORDER BY created_at DESC;

-- 3. Check auth users
SELECT 
    id,
    email,
    created_at
FROM auth.users
ORDER BY created_at DESC;

-- 4. Find lessons with no matching tutor
SELECT 
    l.id as lesson_id,
    l.title,
    l.tutor_id,
    t.email as tutor_email
FROM lessons l
LEFT JOIN tutors t ON l.tutor_id = t.id
WHERE t.id IS NULL;

-- 5. Count lessons by tutor_id
SELECT 
    tutor_id,
    COUNT(*) as lesson_count
FROM lessons
GROUP BY tutor_id;
