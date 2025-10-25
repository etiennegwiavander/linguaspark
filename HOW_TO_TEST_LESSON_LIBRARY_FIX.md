# How to Test the Lesson Library Fix

## What Was Fixed

1. ✅ Lessons now save to database automatically
2. ✅ Tutor profiles are created automatically if missing
3. ✅ Library shows all your lessons correctly
4. ✅ Better error messages and logging
5. ✅ Fixed infinite loop bug
6. ✅ Fixed missing icon import

## Quick Test (5 minutes)

### Step 1: Check Current State
1. Open your browser and navigate to your app
2. Open Developer Console (F12)
3. Go to `/api/debug-lessons`
4. You should see JSON with:
   - `user.email`: Your email
   - `userLessons.count`: Number of your lessons
   - `allLessons.data`: Array of lessons in database

**What to look for:**
- If `userLessons.count` is 0 but `allLessons.data` has items, there's an RLS issue
- If both are 0, no lessons exist yet (expected for new users)

### Step 2: Generate a Test Lesson
1. Go to the main page (`/popup`)
2. Enter some text or extract from a page
3. Select lesson type, level, and language
4. Click "Generate Lesson"
5. **Watch the console** - you should see:
   ```
   [LinguaSpark Popup] 💾 Attempting to save lesson to database...
   [LessonService] Saving lesson for user: <your-user-id>
   [LessonService] Tutor profile not found, creating one...  (if first time)
   [LessonService] ✅ Tutor profile created  (if first time)
   [LessonService] ✅ Lesson saved successfully: <lesson-id>
   [LinguaSpark Popup] ✅ Lesson saved to database with ID: <lesson-id>
   ```

**If you see errors:**
- Read the error message carefully
- Copy the full error from console
- Check the troubleshooting section below

### Step 3: Verify in Library
1. Navigate to `/library`
2. You should see your lesson(s)
3. Console should show:
   ```
   🔍 Checking authentication...
   ✅ User authenticated: <your-email>
   🔍 Loading lessons from Supabase...
   ✅ Lessons loaded: 1 lessons
   ```

**If you see "0 of 0 lessons":**
- Check console for errors
- Go back to `/api/debug-lessons` to verify lesson was saved
- See troubleshooting section

### Step 4: Test Filters and Actions
1. Try searching for your lesson
2. Try filtering by level/type/language
3. Click "View Lesson" - should navigate to main page with lesson loaded
4. Try deleting a lesson (optional)

## Detailed Diagnostics

### Option 1: Use the Test Page
1. Navigate to `/test-lesson-save.html`
2. Click "Run Diagnostics"
3. Review the results
4. Follow the on-screen instructions

### Option 2: Check Database Directly
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste contents of `scripts/check-lessons-database.sql`
4. Run the queries
5. Review results:
   - Query 1: Table structure
   - Query 2: All lessons with tutor info
   - Query 3: Lessons per tutor
   - Query 4: RLS policies
   - Query 5: Orphaned lessons

## Common Issues & Solutions

### Issue: "No authenticated user"
**Symptoms**: Library shows sign-in message, console shows authentication errors

**Solutions**:
1. Sign in to your app
2. Check `.env.local` has correct Supabase keys:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
   ```
3. Restart dev server after changing env vars

### Issue: "Failed to save lesson to database"
**Symptoms**: Alert appears after generating lesson, console shows error

**Solutions**:
1. Check the specific error message in console
2. Common errors:
   - **"No authenticated user"**: Sign in again
   - **"Failed to create tutor profile"**: Check RLS policies
   - **"violates foreign key constraint"**: Database schema issue
3. Run `/api/debug-lessons` to check user status

### Issue: Library shows "0 of 0 lessons" but lessons exist
**Symptoms**: `/api/debug-lessons` shows lessons in `allLessons` but not `userLessons`

**Solutions**:
1. Check if `tutor_id` matches your user ID:
   ```sql
   SELECT id, title, tutor_id FROM lessons;
   SELECT id, email FROM auth.users;
   ```
2. If they don't match, there's a data migration issue
3. Run the tutor profile creation script

### Issue: Infinite "No authenticated user" logs
**Symptoms**: Console floods with repeated messages

**Solution**: This should be fixed now. If it still happens:
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Check if you have the latest code

### Issue: "AlertCircle is not defined"
**Symptoms**: Error in lesson-library component

**Solution**: This should be fixed now. If it still happens:
1. Check `components/lesson-library.tsx` has:
   ```typescript
   import { ..., AlertCircle } from "lucide-react"
   ```
2. Restart dev server

## What to Share If Issues Persist

If you still have problems, please share:

1. **Console logs** from generating a lesson
2. **Response** from `/api/debug-lessons`
3. **Results** from SQL diagnostic queries
4. **Screenshots** of any error messages
5. **Your user ID** (from debug endpoint)

## Database Migrations

If you haven't run the database migrations yet:

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run these scripts in order:
   - `scripts/001_create_tables.sql`
   - `scripts/002_fix_tutor_insert_policy.sql`
   - `scripts/003_complete_rls_fix.sql`
   - `scripts/004_auto_create_tutor_profile.sql`

## Success Criteria

You'll know everything is working when:

✅ Generating a lesson shows success logs in console
✅ `/api/debug-lessons` shows your lessons
✅ `/library` displays your lessons
✅ No error messages or infinite loops
✅ Can filter, search, and view lessons
✅ Can delete lessons

## Performance Notes

- First lesson save may be slower (creates tutor profile)
- Subsequent saves should be fast
- Library loads up to 100 lessons at once
- Filters are client-side (instant)

## Next Steps After Testing

Once everything works:
1. Generate a few more lessons to test thoroughly
2. Try different lesson types and levels
3. Test the export functionality
4. Check that lessons persist across browser sessions
5. Test on different browsers if needed

---

**Need Help?**
- Check console logs first
- Run diagnostics endpoints
- Review error messages carefully
- Share specific error details if asking for help
