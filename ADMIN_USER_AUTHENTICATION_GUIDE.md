# Admin User Authentication Guide

## How Admin Users Log In or Create Accounts

### Overview
LinguaSpark uses **Supabase Authentication** for user management. Admin users go through the same authentication flow as regular users, but they have an additional `is_admin` flag in the database that grants them special privileges.

---

## User Registration & Login Flow

### 1. **Account Creation (Sign Up)**

Currently, LinguaSpark uses Supabase's built-in authentication, but **there is no dedicated sign-up page in the codebase yet**. Here's how it works:

#### Current Implementation
- The `AuthWrapper` component (`components/auth-wrapper.tsx`) provides authentication context
- It has `signUp()` and `signIn()` methods
- **However, there's no UI page for sign-up/sign-in currently implemented**

#### What Needs to Be Created
You need to create authentication pages:

**Option 1: Create Sign-Up/Sign-In Pages**
```
app/(public)/signup/page.tsx  - Sign up form
app/(public)/signin/page.tsx  - Sign in form
```

**Option 2: Use Supabase Auth UI (Recommended)**
Install Supabase Auth UI component:
```bash
npm install @supabase/auth-ui-react @supabase/auth-ui-shared
```

Then create a simple auth page that uses the pre-built UI.

### 2. **Current Authentication Flow**

```
User clicks "Get Started" on landing page
    ↓
Redirects to /popup (protected route)
    ↓
AuthWrapper checks if user is authenticated
    ↓
If NOT authenticated → Redirects to /signin
    ↓
/signin page doesn't exist yet! (This is the gap)
```

---

## How to Make a User an Admin

### Method 1: Direct Database Update (Current Method)

After a user creates an account through Supabase, you manually set their admin status:

```sql
-- Connect to your Supabase database via SQL Editor

-- Make a specific user an admin
UPDATE tutors
SET is_admin = true
WHERE email = 'admin@example.com';

-- Verify admin status
SELECT id, email, full_name, is_admin
FROM tutors
WHERE is_admin = true;
```

### Method 2: During Sign-Up (Recommended for Production)

You could modify the sign-up flow to allow admin designation:

```typescript
// In a future admin management page
const makeUserAdmin = async (userId: string) => {
  const { error } = await supabase
    .from('tutors')
    .update({ is_admin: true })
    .eq('id', userId);
    
  if (error) throw error;
};
```

### Method 3: Environment Variable (For First Admin)

Set the first admin email in environment variables:

```env
# .env.local
NEXT_PUBLIC_FIRST_ADMIN_EMAIL=admin@example.com
```

Then in the sign-up flow:
```typescript
const signUp = async (email: string, password: string, fullName?: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) throw error;

  // Auto-promote first admin
  if (email === process.env.NEXT_PUBLIC_FIRST_ADMIN_EMAIL) {
    await supabase
      .from('tutors')
      .update({ is_admin: true })
      .eq('email', email);
  }
};
```

---

## Complete Authentication Setup Guide

### Step 1: Create Authentication Pages

Create `app/(public)/auth/page.tsx`:

```typescript
"use client"

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { getSupabaseClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthPage() {
  const supabase = getSupabaseClient()
  const router = useRouter()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        router.push('/popup')
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase])

  return (
    <div className="min-h-screen bg-vintage-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-vintage-brown mb-2">
            LinguaSpark
          </h1>
          <p className="text-vintage-brown/70">
            Sign in to create professional lessons
          </p>
        </div>
        
        <div className="vintage-card p-8">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            redirectTo={`${window.location.origin}/popup`}
          />
        </div>
      </div>
    </div>
  )
}
```

### Step 2: Update Landing Page Navigation

The landing page already routes to `/popup`, but you should update it to route to `/auth` first:

```typescript
// In app/(public)/(landing)/page.tsx
const handleGetStarted = () => {
  router.push("/auth");  // Changed from /popup
};
```

### Step 3: Update AuthWrapper Redirect

In `components/auth-wrapper.tsx`, update the redirect:

```typescript
// Change this line:
window.location.href = '/signin'

// To:
window.location.href = '/auth'
```

---

## Admin User Workflow

### For the First Admin User

1. **Set up Supabase project** (already done)
2. **Run the public lessons migration** (already done)
3. **Create an account**:
   - Go to `/auth` page
   - Sign up with email/password
   - Confirm email (if email confirmation is enabled)

4. **Manually set admin status**:
   ```sql
   UPDATE tutors
   SET is_admin = true
   WHERE email = 'your-email@example.com';
   ```

5. **Sign in** and you now have admin privileges!

### For Additional Admin Users

Once you have one admin, you can create an admin panel to promote other users:

```typescript
// Future admin panel component
const AdminUserManagement = () => {
  const promoteToAdmin = async (userId: string) => {
    const response = await fetch('/api/admin/promote-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    
    if (response.ok) {
      alert('User promoted to admin!');
    }
  };
  
  // ... UI to list users and promote them
};
```

---

## How Admin Status is Checked

### In the Frontend
```typescript
// Check if current user is admin
const { data: tutor } = await supabase
  .from('tutors')
  .select('is_admin')
  .eq('id', user.id)
  .single();

const isAdmin = tutor?.is_admin || false;
```

### In API Routes
```typescript
// lib/admin-utils-server.ts
export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('tutors')
    .select('is_admin')
    .eq('id', userId)
    .single();
    
  if (error || !data) return false;
  return data.is_admin === true;
}
```

### In Components
```typescript
// Check admin status in a component
const [isAdmin, setIsAdmin] = useState(false);

useEffect(() => {
  const checkAdmin = async () => {
    const response = await fetch('/api/admin/check-status');
    const { isAdmin } = await response.json();
    setIsAdmin(isAdmin);
  };
  
  checkAdmin();
}, []);

// Conditionally render admin features
{isAdmin && (
  <Button onClick={createPublicLesson}>
    Create Public Lesson
  </Button>
)}
```

---

## Summary

### Current State
- ✅ Authentication system exists (Supabase)
- ✅ Admin role system exists (database)
- ✅ Admin checking functions exist
- ❌ **No sign-up/sign-in UI pages** (this is the gap!)

### What You Need to Do

1. **Create authentication pages** (`/auth` or `/signin` and `/signup`)
2. **Update landing page** to route to auth page
3. **Create your first account** through the auth page
4. **Manually set admin status** in database
5. **Sign in** and start creating public lessons!

### Quick Start for Testing

**Temporary Solution**: Use Supabase Dashboard directly
1. Go to your Supabase project dashboard
2. Navigate to Authentication → Users
3. Click "Add User" to create a test account
4. Go to SQL Editor and run:
   ```sql
   UPDATE tutors SET is_admin = true WHERE email = 'test@example.com';
   ```
5. Use those credentials to sign in through the app

**Permanent Solution**: Create the auth pages as described above.

---

## Admin Privileges

Once a user has `is_admin = true`, they can:

✅ Create public lessons (via Sparky workflow)
✅ Edit any public lesson
✅ Delete any public lesson
✅ View admin statistics dashboard
✅ See admin-specific UI elements
✅ Access admin-only API endpoints

Regular users (is_admin = false) can:
✅ View all public lessons
✅ Edit public lessons
✅ Export public lessons
❌ Cannot delete public lessons
❌ Cannot see admin statistics
❌ Cannot create public lessons

---

## Next Steps

1. Create the authentication UI pages
2. Test the complete flow
3. Consider adding an admin panel for user management
4. Add email verification (optional but recommended)
5. Implement password reset functionality

