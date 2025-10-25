# Server-Side Supabase Client - Complete Fix

## Problem
API routes couldn't access user sessions because they were using the browser-only Supabase client. This caused:
- ❌ Lessons not saving to database
- ❌ Library showing 0 lessons
- ❌ All API routes failing with "Auth session missing!"

## Root Cause
The app was using `createBrowserClient` everywhere, which only works in the browser and can't access cookies in API routes (server-side).

## Solution
Created a dual-client system:
- **Browser client** for client components (React components)
- **Server client** for API routes and server components

## Changes Made

### 1. Updated `lib/supabase.ts`
Added server-side client creation:

```typescript
import { createBrowserClient, createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Browser client (existing)
export const getSupabaseClient = () => { ... }

// NEW: Server client for API routes
export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies()
  
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Ignore if called from Server Component
        }
      },
    },
  })
}
```

### 2. Updated `lib/lessons.ts`
Made all methods work in both browser and server contexts:

```typescript
// Helper to get the appropriate client
async function getClient() {
  if (typeof window === 'undefined') {
    // Server context (API route)
    return await createServerSupabaseClient()
  }
  // Browser context
  return getSupabaseClient()
}

// All methods now use: const supabase = await getClient()
```

Updated all methods:
- `saveLesson()` - Now works from browser
- `getLessons()` - Now works from browser
- `getLesson()` - Now works from browser
- `updateLesson()` - Now works from browser
- `deleteLesson()` - Now works from browser
- `getStudents()` - Now works from browser
- `createStudent()` - Now works from browser

### 3. Updated API Routes
Changed to use server client:

**app/api/simple-lesson-check/route.ts:**
```typescript
const supabase = await createServerSupabaseClient()
```

**app/api/debug-lessons/route.ts:**
```typescript
const supabase = await createServerSupabaseClient()
```

## How It Works Now

### Browser Context (Client Components)
```typescript
// User clicks "Generate Lesson"
const { lessonService } = await import('@/lib/lessons')
await lessonService.saveLesson(data)
// ↓
// getClient() detects browser (window exists)
// ↓
// Uses getSupabaseClient() (browser client)
// ↓
// Accesses session from browser cookies
// ↓
// Saves to database ✅
```

### Server Context (API Routes)
```typescript
// API route called
const supabase = await createServerSupabaseClient()
const { data: { user } } = await supabase.auth.getUser()
// ↓
// createServerSupabaseClient() reads cookies from request
// ↓
// Gets user session from cookies
// ↓
// Returns user data ✅
```

## Testing

### Step 1: Test API Route
Visit: `http://localhost:3000/api/simple-lesson-check`

**Before:**
```json
{
  "error": "Authentication error",
  "details": "Auth session missing!"
}
```

**After:**
```json
{
  "success": true,
  "user": {
    "email": "your@email.com",
    "id": "..."
  },
  "lessons": {
    "userCount": X
  }
}
```

### Step 2: Generate a Lesson
1. Go to `/popup`
2. Generate a lesson
3. Check console for:
   ```
   [LessonService] Saving lesson for user: ...
   [LessonService] ✅ Lesson saved successfully: ...
   ```

### Step 3: Check Library
1. Go to `/library`
2. Should show your lessons!
3. Console should show:
   ```
   [LessonService] Successfully fetched X lessons
   ✅ Lessons loaded successfully!
   ```

## Files Modified

1. ✅ `lib/supabase.ts` - Added server client
2. ✅ `lib/lessons.ts` - Made all methods dual-context
3. ✅ `app/api/simple-lesson-check/route.ts` - Use server client
4. ✅ `app/api/debug-lessons/route.ts` - Use server client

## Key Concepts

### Browser Client
- Uses `createBrowserClient` from `@supabase/ssr`
- Accesses cookies via browser APIs
- Works in React components
- Singleton pattern (one instance)

### Server Client
- Uses `createServerClient` from `@supabase/ssr`
- Accesses cookies via Next.js `cookies()` API
- Works in API routes and Server Components
- Created fresh for each request

### Dual-Context Helper
```typescript
async function getClient() {
  if (typeof window === 'undefined') {
    return await createServerSupabaseClient() // Server
  }
  return getSupabaseClient() // Browser
}
```

This automatically picks the right client based on context!

## Why This Works

**The Problem:**
- Browser client can't be used in API routes
- API routes run on server, no `window` object
- Cookies need to be read differently on server

**The Solution:**
- Detect context with `typeof window === 'undefined'`
- Use appropriate client for each context
- Both clients access the same Supabase session
- Session stored in cookies, accessible from both sides

## Benefits

1. **Works Everywhere** - Same code works in browser and server
2. **Type Safe** - Full TypeScript support
3. **Secure** - Proper cookie handling
4. **Simple** - Just use `lessonService` methods
5. **Maintainable** - One source of truth

## Troubleshooting

### "Auth session missing" still appears
- Clear browser cookies
- Sign out and sign in again
- Check `.env.local` has correct Supabase keys
- Restart dev server

### Lessons still don't save
- Check console for specific error
- Verify you're signed in
- Check database RLS policies
- Run diagnostic endpoint

### TypeScript errors
- Make sure `@supabase/ssr` is installed
- Run `npm install @supabase/ssr`
- Restart TypeScript server

## Next Steps

1. **Restart dev server** - Changes need to take effect
2. **Clear browser cache** - Old session data
3. **Sign in again** - Fresh session
4. **Generate a lesson** - Test save
5. **Check library** - Should show lessons!

Everything should work now! 🎉
