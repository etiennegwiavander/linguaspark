# Lesson Library Database Fix - Complete Solution

## Problems Identified

### 1. Lessons Not Being Saved
**Root Cause**: Tutor profile may not exist when trying to save lessons
- The `lessons` table requires `tutor_id` to reference `tutors.id`
- If user signs in but tutor profile doesn't exist, saves fail silently

### 2. Library Shows 0 Lessons
**Root Cause**: Same as above - if tutor profile doesn't exist, RLS blocks queries

### 3. Silent Failures
**Root Cause**: Error handling was catching and hiding database errors

## Fixes Applied

### Fix 1: Auto-Create Tutor Profile on Lesson Save
Modified `lib/lessons.ts` → `saveLesson()`:
- Check if tutor profile exists before saving lesson
- If not, automatically create one
- Added detailed logging for debugging

```typescript
// Check if tutor profile exists
const { data: tutorProfile } = await supabase
  .from("tutors")
  .select("id")
  .eq("id", user.id)
  .single()

// Create if missing
if (!tutorProfile) {
  await supabase.from("tutors").insert({
    id: user.id,
    email: user.email || '',
  })
}
```

### Fix 2: Better Error Handling
Modified `app/popup/page.tsx` → `handleLessonGenerated()`:
- Added detailed logging of save attempts
- Show user-friendly error message if save fails
- Log full error details to console for debugging

### Fix 3: Debug Tools
Created diagnostic tools:
1. **API Endpoint**: `/api/debug-lessons`
   - Shows current user ID
   - Lists user's lessons
   - Lists all lessons (to check RLS)

2. **SQL Script**: `scripts/check-lessons-database.sql`
   - Check table structure
   - View all lessons with tutor info
   - Count lessons per tutor
   - Check RLS policies
   - Find orphaned lessons

## Testing Instructions

### Step 1: Check Current State
1. Open browser console (F12)
2. Navigate to `/api/debug-lessons`
3. Check the response:
   - Does `user.id` exist?
   - Does `userLessons.count` show lessons?
   - Does `allLessons.data` show any lessons?

### Step 2: Generate a New Lesson
1. Go to the main page
2. Generate a lesson
3. Watch the console for these logs:
   ```
   [LinguaSpark Popup] 💾 Attempting to save lesson to database...
   [LessonService] Saving lesson for user: <user-id>
   [LessonService] ✅ Lesson saved successfully: <lesson-id>
   [LinguaSpark Popup] ✅ Lesson saved to database with ID: <lesson-id>
   ```

4. If you see errors, check:
   - `[LessonService] Tutor profile not found, creating one...`
   - `[LessonService] ✅ Tutor profile created`

### Step 3: Verify in Library
1. Navigate to `/library`
2. Should now show your lessons
3. Console should show:
   ```
   🔍 Checking authentication...
   ✅ User authenticated: <email>
   🔍 Loading lessons from Supabase...
   ✅ Lessons loaded: X lessons
   ```

### Step 4: Check Database (Optional)
Run `scripts/check-lessons-database.sql` in Supabase SQL Editor to see:
- All lessons in database
- Tutor associations
- RLS policies

## Expected Behavior After Fix

### When Generating Lessons
- ✅ Lesson saves to localStorage (for immediate display)
- ✅ Lesson saves to database (for library)
- ✅ If tutor profile missing, creates it automatically
- ✅ Shows error alert if save fails (with details in console)

### When Viewing Library
- ✅ Shows all user's lessons
- ✅ Filters work correctly
- ✅ Can delete lessons
- ✅ Can view lesson details

## Troubleshooting

### If lessons still don't save:
1. Check console for error messages
2. Visit `/api/debug-lessons` to see user ID
3. Run SQL diagnostic script
4. Check if RLS policies are correct
5. Verify Supabase connection in `.env.local`

### If library still shows 0 lessons:
1. Check if lessons exist in database (SQL script)
2. Verify tutor_id matches user ID
3. Check RLS policies allow SELECT
4. Look for authentication errors in console

### If you see "No authenticated user":
1. Sign in again
2. Check Supabase auth configuration
3. Verify `.env.local` has correct Supabase keys

## Database Schema Reference

```sql
-- Tutors table
tutors (
  id UUID PRIMARY KEY,  -- Must match auth.uid()
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Lessons table
lessons (
  id UUID PRIMARY KEY,
  tutor_id UUID REFERENCES tutors(id),  -- Must exist in tutors table
  title TEXT,
  lesson_type TEXT,
  student_level TEXT,
  target_language TEXT,
  source_url TEXT,
  lesson_data JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## Next Steps

If issues persist after these fixes:
1. Run the debug endpoint and share results
2. Run the SQL diagnostic and share results
3. Check browser console for specific error messages
4. Verify database migrations have been run
