# Library Page Diagnostic Steps

## Current Status
✅ Supabase API is reachable
✅ Lessons table exists and is accessible
⚠️ No lessons found in the database (0 lessons)

## Root Cause Analysis

The library page is showing "0 of 0 lessons" because:
1. The database query is working correctly
2. But there are no lessons in the database yet
3. You need to create a lesson first to see it in the library

## Solution: Create a Test Lesson

### Option 1: Use the App (Recommended)

1. Go to `http://localhost:3000`
2. Sign in with your account
3. Fill in the lesson generation form:
   - Enter some text content (or use "Extract from Page")
   - Select lesson type (e.g., "Discussion")
   - Select student level (e.g., "B1")
   - Select target language (e.g., "English")
4. Click "Generate Lesson"
5. Wait for the lesson to generate
6. The lesson should automatically save
7. Go to `http://localhost:3000/library` to see your lesson

### Option 2: Insert Test Data via SQL

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Run this query to get your user ID:
   ```sql
   SELECT id, email FROM auth.users;
   ```
5. Copy your user ID
6. Open `scripts/insert-test-lesson.sql`
7. Replace `YOUR_USER_ID` with your actual user ID (3 places)
8. Replace `your-email@example.com` with your actual email
9. Run the modified SQL in Supabase SQL Editor
10. Refresh `http://localhost:3000/library`

### Option 3: Use the Test API Endpoint

1. Make sure you're signed in at `http://localhost:3000`
2. Open `http://localhost:3000/api/test-lessons-direct`
3. Check the response - it should show your user info
4. If it shows "No authenticated user", sign in first

## Verify the Fix

After creating a lesson, check:

1. **In Supabase Dashboard:**
   - Go to Table Editor → lessons
   - You should see at least one row
   - Verify `tutor_id` matches your user ID

2. **In the App:**
   - Go to `http://localhost:3000/library`
   - You should see "1 of 1 lessons" (or more)
   - The lesson card should display

3. **In Browser Console:**
   - Open DevTools (F12) → Console
   - You should see:
     ```
     [LessonService] Successfully fetched 1 lessons
     ```

## Check Network Activity

To verify the database call is being made:

1. Open `http://localhost:3000/library`
2. Open DevTools (F12) → Network tab
3. Filter by "supabase"
4. You should see:
   - `POST /auth/v1/user` (authentication check)
   - `GET /rest/v1/lessons?...` (fetching lessons)
5. Click on the lessons request
6. Check the Response tab - should show an array of lessons

## Common Issues

### Issue: "No authenticated user"
**Solution:** Sign in at `http://localhost:3000` first

### Issue: Lessons exist but library shows 0
**Solution:** Check if `tutor_id` in lessons matches your user ID

### Issue: Network request fails with 403
**Solution:** Check RLS policies - run `scripts/check-lessons-and-policies.sql`

### Issue: Lesson saves but doesn't appear in library
**Solution:** 
1. Check browser console for errors
2. Verify the lesson's `tutor_id` matches your user ID
3. Try refreshing the page

## Next Steps

Once you have at least one lesson in the database:
1. The library page should display it correctly
2. You can test filtering and searching
3. You can test viewing and deleting lessons
4. The "0 of 0 lessons" issue will be resolved

## Quick Test Command

Run this to test everything:
```powershell
.\test-authenticated-query.ps1
```

This will open the test endpoint in your browser and show if authentication is working.
