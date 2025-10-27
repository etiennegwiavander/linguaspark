# Fix Admin Flag - Quick Guide

## Problem

Your user ID `67cbea4f-c49e-4d45-a112-309f942f6120` exists in the database but the `is_admin` flag is set to `false`.

## Solution

Run this SQL command in your Supabase SQL Editor:

```sql
UPDATE tutors
SET is_admin = true
WHERE id = '67cbea4f-c49e-4d45-a112-309f942f6120';
```

## Steps

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Paste this SQL:
   ```sql
   UPDATE tutors
   SET is_admin = true
   WHERE id = '67cbea4f-c49e-4d45-a112-309f942f6120';
   
   -- Verify it worked
   SELECT id, email, is_admin FROM tutors WHERE id = '67cbea4f-c49e-4d45-a112-309f942f6120';
   ```
5. Click **Run** (or press Ctrl+Enter)
6. You should see the result showing `is_admin: true`

### Option 2: Using the Script File

1. Open `scripts/008_set_admin_flag.sql`
2. The user ID is already filled in
3. Copy the entire content
4. Paste into Supabase SQL Editor
5. Run it

## Verify

After running the SQL:

1. **Reload your app page** (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
2. **Check the console** - You should now see:
   ```
   [LessonDisplay] ✅ Admin check response: { isAdmin: true, userId: "67cbea4f-c49e-4d45-a112-309f942f6120" }
   [LessonDisplay] 🎯 isAdmin set to: true
   ```
3. **Look for the green banner** at the top of the page:
   ```
   ✅ Admin Mode Active - You can save to public library
   ```

## Test

1. Generate a lesson
2. Click "Save to Library"
3. You should now see a dialog with two options:
   - "Save to My Personal Library"
   - "Save to Public Library"

## Why This Happened

When you created the admin user with email `admin@admin.com`, the user was created in Supabase Auth, but when the `tutors` table record was auto-created (on first login), the `is_admin` flag defaulted to `false`.

The SQL command above manually sets it to `true`.

## Alternative: Set by Email

If you're not sure of the user ID, you can also set admin by email:

```sql
UPDATE tutors
SET is_admin = true
WHERE email = 'admin@admin.com';

-- Verify
SELECT id, email, is_admin FROM tutors WHERE email = 'admin@admin.com';
```

## Check All Admins

To see all admin users in your database:

```sql
SELECT id, email, is_admin, created_at
FROM tutors
WHERE is_admin = true
ORDER BY created_at DESC;
```

## Troubleshooting

### "No rows updated"

**Problem**: The user doesn't exist in the `tutors` table yet.

**Solution**: 
1. Make sure you've logged in at least once with the admin account
2. Check if the user exists:
   ```sql
   SELECT * FROM tutors WHERE id = '67cbea4f-c49e-4d45-a112-309f942f6120';
   ```
3. If no results, the tutor record wasn't created. Sign out and sign in again.

### Still showing `isAdmin: false` after update

**Problem**: Browser cache or session issue.

**Solution**:
1. Hard refresh the page (Ctrl+Shift+R)
2. Clear browser cache
3. Sign out and sign in again
4. Check the database again to confirm `is_admin = true`

## Success!

Once you see the green banner and the console shows `isAdmin: true`, you're all set! The save dialog will now appear when you click "Save to Library".
