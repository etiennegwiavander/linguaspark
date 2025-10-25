-- Check lessons table structure and data
-- Run this in Supabase SQL Editor

-- 1. Check if lessons table exists and its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'lessons'
ORDER BY ordinal_position;

-- 2. Check all lessons with tutor info
SELECT 
    l.id,
    l.title,
    l.lesson_type,
    l.student_level,
    l.target_language,
    l.tutor_id,
    l.created_at,
    l.source_url,
    t.email as tutor_email
FROM lessons l
LEFT JOIN auth.users t ON l.tutor_id = t.id
ORDER BY l.created_at DESC
LIMIT 20;

-- 3. Count lessons per tutor
SELECT 
    l.tutor_id,
    t.email as tutor_email,
    COUNT(*) as lesson_count,
    MAX(l.created_at) as last_lesson_created
FROM lessons l
LEFT JOIN auth.users t ON l.tutor_id = t.id
GROUP BY l.tutor_id, t.email
ORDER BY lesson_count DESC;

-- 4. Check RLS policies on lessons table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'lessons';

-- 5. Check if there are any lessons without tutor_id
SELECT COUNT(*) as lessons_without_tutor
FROM lessons
WHERE tutor_id IS NULL;
