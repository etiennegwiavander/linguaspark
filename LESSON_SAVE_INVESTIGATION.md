# Lesson Save Investigation & Fix

## Problem
1. Lesson library shows "0 of 0 lessons" even though lessons exist in database
2. Not all generated lessons are being saved to the database

## Root Causes Identified

### Issue 1: Tutor Profile May Not Exist
The database schema requires:
- `lessons.tutor_id` → references `tutors.id`
- `tutors.id` → must match `auth.uid()`

If a user signs in but doesn't have a tutor profile, lesson saves will fail silently.

### Issue 2: Error Handling is Silent
In `app/popup/page.tsx`, the `handleLessonGenerated` function catches database errors but doesn't show them to the user:

```typescript
try {
  await lessonService.saveLesson(...)
  console.log('[LinguaSpark Popup] ✅ Lesson saved to database')
} catch (error) {
  console.error('[LinguaSpark Popup] Failed to save lesson to database:', error)
  // Don't block the UI if database save fails ← SILENT FAILURE
}
```

### Issue 3: RLS Policies May Be Blocking Reads
The lessons are queried with:
```sql
.eq("tutor_id", user.data.user.id)
```

If the tutor_id doesn't match auth.uid(), RLS will block the query.

## Investigation Steps

1. **Check if tutor profile exists for current user**
   - Visit: `/api/debug-lessons`
   - This will show user ID and whether lessons exist

2. **Run SQL diagnostic**
   - Execute `scripts/check-lessons-database.sql` in Supabase SQL Editor
   - This will show all lessons and their tutor associations

3. **Check browser console**
   - Look for "Failed to save lesson to database" errors
   - These indicate the actual problem

## Fixes Applied

### Fix 1: Debug API Endpoint
Created `/api/debug-lessons` to diagnose the issue.

### Fix 2: SQL Diagnostic Script
Created `scripts/check-lessons-database.sql` to check database state.

### Next Steps
1. Run the debug endpoint to see what's happening
2. Based on results, we'll either:
   - Ensure tutor profiles are created automatically
   - Fix RLS policies
   - Add better error handling and user feedback
