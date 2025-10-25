# Test Database Directly

## The Issue

The library shows "0 of 0 lessons" and logs stop after calling `getLessons()`.

## Most Likely Causes

1. **No lessons exist** - You haven't generated any lessons yet
2. **Database tables don't exist** - Migrations haven't been run
3. **RLS policies blocking** - Can't query lessons table

## Quick Tests

### Test 1: Check if you've generated any lessons

**Have you successfully generated a lesson since signing in?**

If NO → That's the problem! Generate a lesson first:
1. Go to `/popup`
2. Enter some text
3. Generate a lesson
4. Check console for save confirmation

### Test 2: Check Supabase Dashboard

1. Go to your Supabase dashboard
2. Click "Table Editor"
3. Look for these tables:
   - `tutors`
   - `lessons`
   - `students`

**If tables don't exist** → Run migrations in `scripts/` folder

### Test 3: Check if lessons table has data

In Supabase SQL Editor, run:
```sql
SELECT COUNT(*) FROM lessons;
```

If error → Tables don't exist
If 0 → No lessons created yet
If > 0 → Lessons exist, check tutor_id

### Test 4: Check your tutor profile

```sql
SELECT * FROM tutors WHERE email = 'vanshidy@gmail.com';
```

If no results → Tutor profile doesn't exist

### Test 5: Check RLS policies

```sql
SELECT * FROM pg_policies WHERE tablename = 'lessons';
```

Should show policies for SELECT, INSERT, UPDATE, DELETE

## Most Likely Solution

**You probably just need to generate a lesson!**

The library is working correctly - it's just empty because you haven't created any lessons with this account yet.

## Steps to Fix

1. **Go to `/popup`**
2. **Paste some text** (at least 200 words)
3. **Select:**
   - Lesson Type: Discussion
   - Level: B1
   - Language: English
4. **Click "Generate Lesson"**
5. **Watch console** for:
   ```
   [LinguaSpark Popup] 💾 Attempting to save lesson to database...
   [LessonService] Saving lesson for user: ...
   ```
6. **If you see errors** → Share them with me
7. **If no errors** → Go to `/library` and refresh

## If Database Tables Don't Exist

Run these SQL scripts in Supabase SQL Editor (in order):

1. `scripts/001_create_tables.sql`
2. `scripts/002_fix_tutor_insert_policy.sql`
3. `scripts/003_complete_rls_fix.sql`
4. `scripts/004_auto_create_tutor_profile.sql`

## Debug: Add More Logging

If `getLessons()` is still failing silently, the issue is in the Supabase query itself. The logs stop because an error is being thrown but not logged.

Let me check the code...
