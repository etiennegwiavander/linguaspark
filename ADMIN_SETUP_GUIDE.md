# Admin User Setup Guide

This guide explains how to create an admin user in Supabase with simple credentials.

## Quick Setup

### Step 1: Create User in Supabase Auth

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Users**
3. Click **"Add User"** (or "Invite")
4. Fill in the details:
   - **Email**: `admin@admin.com`
   - **Password**: `admin123`
   - **Auto Confirm User**: ✅ Check this (so you don't need to verify email)
5. Click **"Create User"** or **"Send Invitation"**

### Step 2: Set Admin Flag in Database

After creating the user, you need to mark them as an admin in the `tutors` table.

**Option A: Using Supabase SQL Editor**

1. Go to **SQL Editor** in your Supabase Dashboard
2. Run this query (replace `<USER_UUID>` with the actual user ID):

```sql
-- Find the user ID first
SELECT id, email FROM auth.users WHERE email = 'admin@admin.com';

-- Then update the tutors table (replace <USER_UUID> with the ID from above)
UPDATE tutors
SET is_admin = true
WHERE id = '<USER_UUID>';

-- Verify it worked
SELECT id, email, is_admin FROM tutors WHERE is_admin = true;
```

**Option B: Using the provided script**

1. Open `scripts/007_create_admin_user.sql`
2. Replace `<USER_UUID>` with your admin user's UUID
3. Run the script in Supabase SQL Editor

### Step 3: Test the Login

1. Navigate to `http://localhost:3000/auth/admin/login`
2. Enter credentials:
   - **Email**: `admin@admin.com`
   - **Password**: `admin123`
3. Click **"Sign In as Admin"**
4. You should be redirected to `/popup` with admin privileges

## Admin Credentials

```
Email: admin@admin.com
Password: admin123
```

These credentials are displayed on the login page for easy reference.

## Troubleshooting

### "Failed to verify admin status"

**Problem**: The user exists in Supabase Auth but not in the `tutors` table.

**Solution**: The `tutors` table should auto-populate when a user signs in for the first time. Try:

1. Sign in once as a regular user (not admin) to trigger the auto-creation
2. Then run the SQL to set `is_admin = true`

Or manually insert the tutor record:

```sql
INSERT INTO tutors (id, email, is_admin)
VALUES ('<USER_UUID>', 'admin@admin.com', true)
ON CONFLICT (id) DO UPDATE SET is_admin = true;
```

### "Access denied. This login is for admin users only"

**Problem**: The user exists but `is_admin` is not set to `true`.

**Solution**: Run the UPDATE query:

```sql
UPDATE tutors SET is_admin = true WHERE email = 'admin@admin.com';
```

### "Invalid login credentials"

**Problem**: The email/password combination doesn't exist in Supabase Auth.

**Solution**: 
1. Check if the user exists in **Authentication** > **Users**
2. If not, create the user following Step 1
3. If yes, try resetting the password in the Supabase Dashboard

### User created but can't sign in

**Problem**: Email confirmation required.

**Solution**: 
1. Go to **Authentication** > **Users**
2. Find the admin user
3. Click the three dots menu
4. Select **"Confirm Email"**

## Checking Admin Status

### In the Database

```sql
SELECT 
  t.id,
  t.email,
  t.is_admin,
  t.created_at,
  au.email_confirmed_at
FROM tutors t
JOIN auth.users au ON t.id = au.id
WHERE t.is_admin = true;
```

### In the Application

Once logged in, admin users will see:
- Admin stats panel in the sidebar
- "Create Public Lesson" button
- Edit/Delete buttons on public lessons
- Admin-only features throughout the app

## Security Notes

⚠️ **For Development Only**

These simple credentials (`admin@admin.com` / `admin123`) are suitable for development and testing only.

**For Production:**
1. Use a strong, unique password
2. Use a real email address
3. Enable email confirmation
4. Consider adding 2FA
5. Implement proper admin role management
6. Use environment variables for sensitive data
7. Add audit logging for admin actions

## Changing Admin Credentials

To use different credentials:

1. **Update the login page** (`app/(public)/auth/admin/login/page.tsx`):
   - Change the placeholder text in the email input
   - Update the credentials shown in the info box

2. **Create the user in Supabase** with your desired email/password

3. **Set the admin flag** using the SQL queries above

## Multiple Admin Users

You can have multiple admin users. Just repeat the process for each user:

```sql
-- Set multiple users as admin
UPDATE tutors SET is_admin = true WHERE email IN (
  'admin@admin.com',
  'admin2@example.com',
  'superadmin@example.com'
);
```

## Removing Admin Access

To revoke admin privileges:

```sql
UPDATE tutors SET is_admin = false WHERE email = 'admin@admin.com';
```

## Database Schema

The `tutors` table should have an `is_admin` column:

```sql
-- Check if is_admin column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tutors' AND column_name = 'is_admin';

-- If it doesn't exist, add it
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
```

## Next Steps

After setting up your admin user:

1. Test the login flow
2. Verify admin features are visible
3. Try creating a public lesson
4. Test editing and deleting lessons
5. Check the admin stats panel

For more information, see:
- `lib/admin-utils-server.ts` - Server-side admin utilities
- `components/admin-stats-panel.tsx` - Admin dashboard
- `components/admin-lesson-creation-dialog.tsx` - Lesson creation UI
