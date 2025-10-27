# Admin Save to Public Library - Debugging Guide

## Issue

Admin user clicks "Save to Library" but doesn't see the dialog to choose between personal/public library. Lesson saves directly to personal library instead.

## Debugging Steps Added

### 1. Console Logging

Added comprehensive logging to track the admin check process:

```typescript
// In useEffect admin check
console.log('[LessonDisplay] 🔍 Checking admin status...')
console.log('[LessonDisplay] 📡 Calling admin check API with userId:', userId)
console.log('[LessonDisplay] ✅ Admin check response:', data)
console.log('[LessonDisplay] 🎯 isAdmin set to:', data.isAdmin === true)

// In handleSaveToLibrary
console.log('[LessonDisplay] 💾 handleSaveToLibrary called, isAdmin:', isAdmin)
console.log('[LessonDisplay] ✅ User is admin, showing save location dialog')
```

### 2. Visual Admin Indicator

Added a green alert banner at the top of the page when admin mode is active:

```
✅ Admin Mode Active - You can save to public library
```

If you don't see this banner, you're not detected as an admin.

## How to Debug

### Step 1: Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Reload the page
4. Look for these log messages:
   ```
   [LessonDisplay] 🔍 Checking admin status...
   [LessonDisplay] 📡 Calling admin check API with userId: <your-user-id>
   [LessonDisplay] ✅ Admin check response: { isAdmin: true, userId: "..." }
   [LessonDisplay] 🎯 isAdmin set to: true
   ```

### Step 2: Check Visual Indicator

- If you see the green "Admin Mode Active" banner → Admin check is working
- If you don't see the banner → Admin check failed

### Step 3: Test Save Button

1. Click "Save to Library"
2. Check console for:
   ```
   [LessonDisplay] 💾 handleSaveToLibrary called, isAdmin: true
   [LessonDisplay] ✅ User is admin, showing save location dialog
   ```

## Common Issues

### Issue 1: No Session Data

**Console shows:**
```
[LessonDisplay] ❌ No session data found
```

**Solution:**
- You're not logged in
- Sign in at `/auth/admin/login` with `admin@admin.com` / `admin123`

### Issue 2: Admin Flag Not Set

**Console shows:**
```
[LessonDisplay] ✅ Admin check response: { isAdmin: false, userId: "..." }
```

**Solution:**
- The user exists but `is_admin` flag is not set in database
- Run this SQL in Supabase:
  ```sql
  UPDATE tutors SET is_admin = true WHERE email = 'admin@admin.com';
  ```

### Issue 3: User Doesn't Exist

**Console shows:**
```
[LessonDisplay] ❌ Admin check failed with status: 400
```

**Solution:**
- The admin user doesn't exist in Supabase Auth
- Follow the setup guide in `ADMIN_SETUP_GUIDE.md`

### Issue 4: API Error

**Console shows:**
```
[LessonDisplay] ❌ Failed to check admin status: <error>
```

**Solution:**
- Check if `/api/admin/check-status` endpoint is working
- Test manually:
  ```javascript
  fetch('/api/admin/check-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: '<your-user-id>' })
  }).then(r => r.json()).then(console.log)
  ```

## Manual Testing

### Test 1: Verify Admin Status

Open browser console and run:

```javascript
// Get session
const sessionData = localStorage.getItem('sb-jbkpnirowdvlwlgheqho-auth-token')
const session = JSON.parse(sessionData)
console.log('User ID:', session.user?.id)
console.log('Email:', session.user?.email)

// Check admin status
fetch('/api/admin/check-status', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: session.user.id })
})
.then(r => r.json())
.then(data => console.log('Admin status:', data))
```

### Test 2: Verify Database

Run this SQL in Supabase SQL Editor:

```sql
-- Check if admin user exists
SELECT id, email, is_admin, created_at
FROM tutors
WHERE email = 'admin@admin.com';

-- If user exists but is_admin is false, fix it:
UPDATE tutors SET is_admin = true WHERE email = 'admin@admin.com';
```

### Test 3: Force Admin Mode

For testing, you can temporarily force admin mode by adding this to the component:

```typescript
// TEMPORARY: Force admin mode for testing
useEffect(() => {
  setIsAdmin(true)
  console.log('🔧 FORCED ADMIN MODE FOR TESTING')
}, [])
```

## Expected Behavior

### For Admin Users

1. Page loads
2. Green banner appears: "✅ Admin Mode Active"
3. Console shows: `isAdmin set to: true`
4. Click "Save to Library"
5. Dialog appears with two options:
   - "Save to My Personal Library"
   - "Save to Public Library"

### For Regular Users

1. Page loads
2. No green banner
3. Console shows: `isAdmin set to: false`
4. Click "Save to Library"
5. Saves immediately to personal library (no dialog)

## Next Steps

1. **Check the console logs** - This will tell you exactly where the admin check is failing
2. **Look for the green banner** - Quick visual confirmation of admin status
3. **Verify database** - Make sure `is_admin = true` in the `tutors` table
4. **Test the API** - Manually call the admin check endpoint

Once you see the green banner and the console shows `isAdmin: true`, the save dialog should appear when you click "Save to Library".

## Remove Debug Code

After fixing the issue, remove these debug additions:

1. Remove the green admin banner alert
2. Remove or reduce console.log statements
3. Keep only essential error logging

## Related Files

- `components/lesson-display.tsx` - Main component with save logic
- `app/api/admin/check-status/route.ts` - Admin verification API
- `lib/admin-utils-server.ts` - Server-side admin utilities
- `ADMIN_SETUP_GUIDE.md` - Complete admin setup instructions
