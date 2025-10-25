# Diagnose Library Issue - Step by Step

## The Problem
Library shows "0 of 0 lessons" and stays on "Loading lessons..."

## Quick Diagnosis

### Step 1: Check Simple Diagnostic
1. Make sure your dev server is running (`npm run dev`)
2. Open your browser
3. Navigate to: `http://localhost:3000/api/simple-lesson-check`
4. You'll see a JSON response

### Step 2: Interpret the Results

Look at the `diagnosis` section in the JSON:

**If `issue` is "NO_TUTOR_PROFILE":**
- Your user account exists but tutor profile is missing
- This should be auto-created when you save a lesson
- Try generating a new lesson

**If `issue` is "NO_LESSONS_YET":**
- You haven't generated any lessons yet
- Go to main page and generate one
- Then check library again

**If `issue` is "LESSONS_EXIST_BUT_NOT_YOURS":**
- Lessons exist in database but belong to different user
- This means you're signed in as a different user than who created the lessons
- Check `user.email` in the response

**If `issue` is "FETCH_ERROR":**
- There's a database query error
- Check `lessons.errors.fetch` for details
- Likely an RLS policy issue

**If `issue` is "OK":**
- Everything should be working
- If library still shows 0, check browser console for errors

### Step 3: Check Browser Console

1. Open browser console (F12)
2. Navigate to `/library`
3. Look for these log messages:

**Expected (working):**
```
🔍 Checking authentication...
✅ User authenticated: your@email.com
🔍 Loading lessons from Supabase...
[LessonService] getLessons called with limit: 100 offset: 0
[LessonService] Fetching lessons for user: <user-id>
[LessonService] Successfully fetched X lessons
✅ Lessons loaded successfully!
📊 Number of lessons: X
```

**If you see errors:**
- Copy the full error message
- Check what step it fails at
- See troubleshooting below

### Step 4: Generate a Test Lesson

1. Go to main page (`/popup`)
2. Enter some text (or use "Extract from Page")
3. Select:
   - Lesson Type: Discussion
   - Student Level: B1
   - Target Language: English
4. Click "Generate Lesson"
5. Watch console for:
   ```
   [LinguaSpark Popup] 💾 Attempting to save lesson to database...
   [LessonService] Saving lesson for user: <user-id>
   [LessonService] ✅ Lesson saved successfully: <lesson-id>
   ```

6. If you see "Tutor profile not found, creating one..." - that's normal for first lesson
7. After lesson generates, go to `/library` - it should appear

## Common Issues

### Issue: "Loading lessons..." never finishes

**Check:**
1. Browser console for errors
2. `/api/simple-lesson-check` for diagnosis
3. Network tab to see if API call is made

**Likely causes:**
- Not signed in
- Database connection issue
- RLS policy blocking query

### Issue: Lesson generates but doesn't appear in library

**Check:**
1. Console during lesson generation - did save succeed?
2. `/api/simple-lesson-check` - does `lessons.userCount` increase?
3. If count increases but library shows 0, it's a frontend issue

**Likely causes:**
- Save failed silently (check console)
- Tutor profile missing (should auto-create)
- RLS policy issue

### Issue: "No authenticated user"

**Solution:**
1. Sign in to your app
2. Check `.env.local` has correct Supabase keys
3. Restart dev server after changing env vars

## PowerShell Test Script

Run this to quickly check:

```powershell
.\test-debug-endpoint.ps1
```

Or manually:
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/simple-lesson-check" | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

## What to Share for Help

If issues persist, please share:

1. **Output from `/api/simple-lesson-check`**
2. **Browser console logs** when visiting `/library`
3. **Browser console logs** when generating a lesson
4. **Your user email** (from the diagnostic)
5. **Screenshot** of the library page

## Next Steps Based on Diagnosis

### If NO_TUTOR_PROFILE:
- Generate a lesson (will auto-create profile)
- Or run SQL: `INSERT INTO tutors (id, email) VALUES ('<your-user-id>', '<your-email>');`

### If NO_LESSONS_YET:
- Generate your first lesson
- Should work normally

### If LESSONS_EXIST_BUT_NOT_YOURS:
- You're signed in as different user
- Sign in as the user who created the lessons
- Or generate new lessons with current user

### If FETCH_ERROR:
- Check RLS policies in Supabase
- Run `scripts/001_create_tables.sql` if not done
- Check database connection

### If OK but library still broken:
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check for JavaScript errors in console
- Check if component is rendering correctly
