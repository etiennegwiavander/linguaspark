# Admin Login Credentials

## Quick Reference

```
Email:    admin@admin.com
Password: admin123
```

## Login URL

```
http://localhost:3000/auth/admin/login
```

## Setup Required

Before you can use these credentials, you must:

1. **Create the user in Supabase Auth**
   - Go to Supabase Dashboard > Authentication > Users
   - Add user with email `admin@admin.com` and password `admin123`
   - Make sure to check "Auto Confirm User"

2. **Set the admin flag in the database**
   ```sql
   UPDATE tutors SET is_admin = true WHERE email = 'admin@admin.com';
   ```

See `ADMIN_SETUP_GUIDE.md` for detailed instructions.

## What You Get

Once logged in as admin, you can:
- ✅ View admin statistics dashboard
- ✅ Create public lessons
- ✅ Edit any public lesson
- ✅ Delete any public lesson
- ✅ View all public lessons in the library
- ✅ Access admin-only features

## Security Note

⚠️ These are development credentials. For production:
- Use a strong, unique password
- Use a real email address
- Enable 2FA if possible
- Change credentials regularly
