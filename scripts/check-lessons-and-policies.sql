-- Check Lessons and RLS Policies
-- Run this in Supabase SQL Editor

-- 1. Check if there are any lessons in the table
SELECT 
    COUNT(*) as total_lessons,
    COUNT(DISTINCT tutor_id) as unique_tutors
FROM lessons;

-- 2. Check lessons by tutor
SELECT 
    tutor_id,
    COUNT(*) as lesson_count,
    MAX(created_at) as last_lesson_created
FROM lessons
GROUP BY tutor_id;

-- 3. Check if tutors table has entries
SELECT 
    COUNT(*) as total_tutors,
    array_agg(email) as tutor_emails
FROM tutors;

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

-- 5. Check if RLS is enabled on lessons table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'lessons';

-- 6. Sample lessons (if any exist)
SELECT 
    id,
    tutor_id,
    title,
    lesson_type,
    student_level,
    target_language,
    created_at
FROM lessons
ORDER BY created_at DESC
LIMIT 5;

-- 7. Check foreign key constraints
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'lessons';
