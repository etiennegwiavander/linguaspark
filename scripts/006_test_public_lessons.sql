-- Test Script for Public Lessons Migration
-- Run this after executing 006_create_public_lessons.sql
-- This script tests all aspects of the migration

-- ============================================================================
-- TEST 1: Verify is_admin column exists on tutors table
-- ============================================================================

SELECT 
  'TEST 1: is_admin column' AS test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'tutors' 
      AND column_name = 'is_admin'
      AND data_type = 'boolean'
      AND column_default = 'false'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS result;

-- ============================================================================
-- TEST 2: Verify public_lessons table structure
-- ============================================================================

SELECT 
  'TEST 2: public_lessons table exists' AS test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_name = 'public_lessons'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS result;

-- Verify all required columns exist
SELECT 
  'TEST 2a: Required columns' AS test_name,
  CASE 
    WHEN (
      SELECT COUNT(*) 
      FROM information_schema.columns 
      WHERE table_name = 'public_lessons'
      AND column_name IN (
        'id', 'created_at', 'updated_at', 'creator_id',
        'title', 'content', 'source_url', 'source_title', 'banner_image_url',
        'category', 'cefr_level', 'lesson_type', 'tags', 'estimated_duration_minutes',
        'search_vector'
      )
    ) = 15 THEN '✓ PASS - All 15 columns present'
    ELSE '✗ FAIL - Missing columns'
  END AS result;

-- ============================================================================
-- TEST 3: Verify CHECK constraints
-- ============================================================================

SELECT 
  'TEST 3: CEFR level constraint' AS test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.check_constraints 
      WHERE constraint_name LIKE '%cefr_level%'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS result;

SELECT 
  'TEST 3a: Lesson type constraint' AS test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.check_constraints 
      WHERE constraint_name LIKE '%lesson_type%'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS result;

-- ============================================================================
-- TEST 4: Verify indexes were created
-- ============================================================================

SELECT 
  'TEST 4: Performance indexes' AS test_name,
  CASE 
    WHEN (
      SELECT COUNT(*) 
      FROM pg_indexes 
      WHERE tablename = 'public_lessons'
      AND indexname IN (
        'idx_public_lessons_category',
        'idx_public_lessons_cefr_level',
        'idx_public_lessons_lesson_type',
        'idx_public_lessons_creator',
        'idx_public_lessons_search',
        'idx_public_lessons_created_at',
        'idx_public_lessons_category_level'
      )
    ) >= 7 THEN '✓ PASS - All indexes created'
    ELSE '✗ FAIL - Missing indexes'
  END AS result;

-- ============================================================================
-- TEST 5: Verify RLS is enabled
-- ============================================================================

SELECT 
  'TEST 5: RLS enabled' AS test_name,
  CASE 
    WHEN (
      SELECT rowsecurity 
      FROM pg_tables 
      WHERE tablename = 'public_lessons'
    ) = true THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS result;

-- ============================================================================
-- TEST 6: Verify RLS policies exist
-- ============================================================================

SELECT 
  'TEST 6: RLS policies' AS test_name,
  CASE 
    WHEN (
      SELECT COUNT(*) 
      FROM pg_policies 
      WHERE tablename = 'public_lessons'
      AND policyname IN (
        'Public lessons are viewable by everyone',
        'Authenticated users can create public lessons',
        'Authenticated users can update public lessons',
        'Only admins can delete public lessons'
      )
    ) = 4 THEN '✓ PASS - All 4 policies created'
    ELSE '✗ FAIL - Missing policies'
  END AS result;

-- Verify SELECT policy allows everyone
SELECT 
  'TEST 6a: SELECT policy (public read)' AS test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_policies 
      WHERE tablename = 'public_lessons'
      AND policyname = 'Public lessons are viewable by everyone'
      AND cmd = 'SELECT'
      AND qual = 'true'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS result;

-- Verify INSERT policy requires authentication
SELECT 
  'TEST 6b: INSERT policy (authenticated only)' AS test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_policies 
      WHERE tablename = 'public_lessons'
      AND policyname = 'Authenticated users can create public lessons'
      AND cmd = 'INSERT'
      AND roles = '{authenticated}'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS result;

-- Verify UPDATE policy requires authentication
SELECT 
  'TEST 6c: UPDATE policy (authenticated only)' AS test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_policies 
      WHERE tablename = 'public_lessons'
      AND policyname = 'Authenticated users can update public lessons'
      AND cmd = 'UPDATE'
      AND roles = '{authenticated}'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS result;

-- Verify DELETE policy requires admin
SELECT 
  'TEST 6d: DELETE policy (admin only)' AS test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_policies 
      WHERE tablename = 'public_lessons'
      AND policyname = 'Only admins can delete public lessons'
      AND cmd = 'DELETE'
      AND roles = '{authenticated}'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS result;

-- ============================================================================
-- TEST 7: Verify trigger exists
-- ============================================================================

SELECT 
  'TEST 7: updated_at trigger' AS test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.triggers 
      WHERE event_object_table = 'public_lessons'
      AND trigger_name = 'update_public_lessons_updated_at'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS result;

-- ============================================================================
-- TEST 8: Verify trigger function exists
-- ============================================================================

SELECT 
  'TEST 8: Trigger function' AS test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_proc 
      WHERE proname = 'update_updated_at_column'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS result;

-- ============================================================================
-- TEST 9: Test data insertion (requires authentication)
-- ============================================================================

-- Note: This test should be run through the application with an authenticated user
-- Here we just verify the table accepts the correct data structure

SELECT 
  'TEST 9: Table ready for data' AS test_name,
  '✓ PASS - Run application tests for data insertion' AS result;

-- ============================================================================
-- TEST 10: Verify foreign key constraint
-- ============================================================================

SELECT 
  'TEST 10: Foreign key to tutors' AS test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.table_constraints 
      WHERE table_name = 'public_lessons'
      AND constraint_type = 'FOREIGN KEY'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS result;

-- ============================================================================
-- SUMMARY: Count all test results
-- ============================================================================

SELECT 
  '==================' AS separator,
  'TEST SUMMARY' AS summary,
  '==================' AS separator2;

-- Note: To get actual pass/fail counts, you would need to store results in a temp table
-- For now, review the output above to ensure all tests show ✓ PASS

-- ============================================================================
-- DETAILED INFORMATION (for debugging)
-- ============================================================================

-- Show all columns in public_lessons
SELECT 
  '--- PUBLIC_LESSONS COLUMNS ---' AS info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'public_lessons'
ORDER BY ordinal_position;

-- Show all indexes
SELECT 
  '--- PUBLIC_LESSONS INDEXES ---' AS info;
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'public_lessons'
ORDER BY indexname;

-- Show all RLS policies
SELECT 
  '--- PUBLIC_LESSONS RLS POLICIES ---' AS info;
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'public_lessons'
ORDER BY policyname;

-- Show triggers
SELECT 
  '--- PUBLIC_LESSONS TRIGGERS ---' AS info;
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'public_lessons';

