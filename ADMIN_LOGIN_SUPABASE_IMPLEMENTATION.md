# Admin Login with Supabase Implementation

## Overview

The admin login system uses Supabase authentication with simple, memorable credentials stored in the Supabase database. This provides proper authentication while keeping it easy to use for development.

## How It Works

### Authentication Flow

1. User navigates to `/auth/admin/login`
2. Enters email (`admin@admin.com`) and password (`admin123`)
3. System authenticates with Supabase Auth
4. System checks `tutors.is_admin` flag in database
5. If admin, redirects to `/popup`
6. If not admin, signs out and shows error

### Database Structure

```sql
-- tutors table
CREATE TABLE tutors (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Admin Verification

**Server-Side** (`lib/admin-utils-server.ts`):
```typescript
export async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('tutors')
    .select('is_admin')
    .eq('id', userId)
    .single();
  
  return data?.is_admin === true;
}
```

**Client-Side** (uses Supabase session):
```typescript
const { data: { session } } = await supabase.auth.getSession();
if (session) {
  const { data: tutor } = await supabase
    .from('tutors')
    .select('is_admin')
    .eq('id', session.user.id)
    .single();
  
  const isAdmin = tutor?.is_admin === true;
}
```

## Files Modified

### 1. Admin Login Page
**File**: `app/(public)/auth/admin/login/page.tsx`

- Uses Supabase `signInWithPassword()`
- Verifies admin status after authentication
- Shows credentials on page for easy reference
- Auto-redirects if already authenticated as admin

### 2. Admin Check API
**File**: `app/api/admin/check-status/route.ts`

- Accepts `userId` from request
- Calls `isAdmin()` from server utilities
- Returns admin status

### 3. Admin Utilities (Server)
**File**: `lib/admin-utils-server.ts`

- `isAdmin(userId)` - Check if user is admin
- `verifyAdmin(userId)` - Throw error if not admin
- `getAdminStats(adminId)` - Get admin statistics
- `requireAdmin(request)` - Middleware for API routes
- `getAdminInfo(userId)` - Get admin user details

## Setup Instructions

### Quick Setup (3 steps)

1. **Create user in Supabase Dashboard**
   ```
   Email: admin@admin.com
   Password: admin123
   Auto Confirm: ✅
   ```

2. **Set admin flag in database**
   ```sql
   UPDATE tutors SET is_admin = true 
   WHERE email = 'admin@admin.com';
   ```

3. **Test login**
   - Go to `http://localhost:3000/auth/admin/login`
   - Enter credentials
   - Should redirect to `/popup`

See `ADMIN_SETUP_GUIDE.md` for detailed instructions.

## Admin Credentials

```
Email:    admin@admin.com
Password: admin123
```

These are displayed on the login page itself for convenience.

## Security Features

✅ **Proper Authentication**
- Uses Supabase Auth (not localStorage)
- Session-based authentication
- Secure password hashing

✅ **Database Verification**
- Admin status stored in database
- Server-side verification
- Can't be spoofed from client

✅ **Access Control**
- Non-admin users are signed out if they try admin login
- Admin status checked on every protected operation
- API routes verify admin status server-side

## Admin Features

Once authenticated as admin, users can:

- **View Admin Dashboard**
  - Total lessons count
  - Lessons by category breakdown
  - Lessons by CEFR level breakdown
  - Recent lessons list
  - Personal lesson count

- **Manage Public Lessons**
  - Create new public lessons
  - Edit existing lessons
  - Delete lessons
  - View all lessons

- **Access Admin UI**
  - Admin stats panel in sidebar
  - Admin-only buttons and controls
  - Special admin indicators

## API Endpoints

### Check Admin Status
```typescript
POST /api/admin/check-status
Body: { userId: string }
Response: { isAdmin: boolean, userId: string }
```

### Get Admin Stats
```typescript
GET /api/admin/stats
Headers: { Authorization: Bearer <token> }
Response: { AdminStats }
```

### Create Public Lesson
```typescript
POST /api/public-lessons/create
Headers: { Authorization: Bearer <token> }
Body: { lesson data }
Response: { lesson }
```

## Testing

### Manual Testing

1. **Test Admin Login**
   ```
   URL: /auth/admin/login
   Email: admin@admin.com
   Password: admin123
   Expected: Redirect to /popup
   ```

2. **Test Non-Admin Rejection**
   ```
   Create regular user
   Try to login at /auth/admin/login
   Expected: "Access denied" error
   ```

3. **Test Admin Features**
   ```
   Login as admin
   Check sidebar for admin panel
   Try creating a public lesson
   Try editing a lesson
   Try deleting a lesson
   ```

### Automated Testing

See `test/admin-utils-server.test.ts` for unit tests.

## Troubleshooting

### Can't Login

**Check**:
1. User exists in Supabase Auth
2. Email is confirmed
3. Password is correct
4. `is_admin` flag is set to `true`

**Fix**:
```sql
-- Verify user exists
SELECT * FROM auth.users WHERE email = 'admin@admin.com';

-- Verify admin flag
SELECT * FROM tutors WHERE email = 'admin@admin.com';

-- Set admin flag if missing
UPDATE tutors SET is_admin = true WHERE email = 'admin@admin.com';
```

### "Access Denied" Error

**Problem**: User exists but `is_admin = false`

**Fix**:
```sql
UPDATE tutors SET is_admin = true WHERE email = 'admin@admin.com';
```

### Admin Features Not Showing

**Check**:
1. User is logged in
2. Session is valid
3. `is_admin` flag is true
4. Browser cache is cleared

**Fix**: Sign out and sign in again

## Production Considerations

For production deployment:

1. **Change Credentials**
   - Use strong, unique password
   - Use real email address
   - Don't display credentials on login page

2. **Add Security**
   - Enable 2FA
   - Add rate limiting
   - Implement session timeout
   - Add audit logging

3. **Environment Variables**
   - Store admin email in env var
   - Use secrets management
   - Rotate credentials regularly

4. **Monitoring**
   - Log admin actions
   - Monitor failed login attempts
   - Alert on suspicious activity

## Related Files

- `ADMIN_SETUP_GUIDE.md` - Detailed setup instructions
- `ADMIN_CREDENTIALS.md` - Quick credential reference
- `scripts/007_create_admin_user.sql` - SQL setup script
- `lib/admin-utils-server.ts` - Server-side utilities
- `app/(public)/auth/admin/login/page.tsx` - Login page
- `components/admin-stats-panel.tsx` - Admin dashboard
- `components/admin-lesson-creation-dialog.tsx` - Lesson creation

## Summary

The admin system now uses proper Supabase authentication with simple credentials (`admin@admin.com` / `admin123`) that are easy to remember for development. The admin status is stored in the database and verified server-side for security. All admin features are properly protected and only accessible to authenticated admin users.
