# Supabase Client Hanging Issue - Root Cause & Fix

## Problem Summary
The lesson library page shows "0 of 0 lessons" and makes NO network requests to Supabase. The code execution stops at any Supabase auth or query call without throwing an error.

## Root Cause
The Supabase client (both `@supabase/ssr` and `@supabase/supabase-js`) is hanging on ALL async operations:
1. `supabase.auth.getUser()` - hangs indefinitely
2. `supabase.auth.getSession()` - hangs indefinitely  
3. `supabase.from().select()` - hangs indefinitely

This suggests the Supabase client is not properly initialized or there's a configuration issue preventing it from making network requests.

## Diagnostic Evidence
```
[LessonLibrary] Calling lessonService.getLessonsForUser with user.id: 762f0dc5-b66e-41f0-a3f4-f4e33a46bbe6
// Then nothing - no error, no network request, no response
```

## Possible Causes
1. **CORS issue** - Browser blocking Supabase requests
2. **Environment variables not loaded** - Client using placeholder values
3. **Supabase client bug** - Known issue with certain versions
4. **Network/firewall blocking** - Requests being blocked before they leave
5. **React Strict Mode** - Double-rendering causing state issues

## Solution Steps

### Step 1: Verify Environment Variables
Check that `.env.local` is being loaded:

```typescript
// In lib/supabase.ts
console.log('[Supabase] URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('[Supabase] Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
```

### Step 2: Check Network Tab
Open DevTools → Network tab and look for:
- Any requests to `*.supabase.co`
- Any CORS errors
- Any blocked requests

### Step 3: Try Direct Fetch
Bypass the Supabase client entirely:

```typescript
const response = await fetch(
  `${supabaseUrl}/rest/v1/lessons?tutor_id=eq.${user.id}`,
  {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    }
  }
)
```

### Step 4: Check Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Check if the project is active
3. Verify API keys are correct
4. Check if there are any service issues

### Step 5: Restart Dev Server
Sometimes Next.js caches environment variables:
```powershell
# Stop the dev server (Ctrl+C)
# Delete .next folder
Remove-Item -Recurse -Force .next
# Restart
npm run dev
```

## Current Status
- ✅ Supabase API is reachable (verified with PowerShell script)
- ✅ Lessons table exists and is accessible
- ✅ User is authenticated (user.id: 762f0dc5-b66e-41f0-a3f4-f4e33a46bbe6)
- ❌ Supabase client hangs on all async operations
- ❌ No network requests are being made

## Next Steps
1. Check browser Network tab for any Supabase requests
2. Check browser Console for any CORS or network errors
3. Try restarting the Next.js dev server
4. Try using direct fetch() instead of Supabase client
5. Check if there are any browser extensions blocking requests

## Workaround
If the Supabase client continues to hang, we can:
1. Use direct `fetch()` calls to the Supabase REST API
2. Create a custom API route that handles the database queries server-side
3. Use a different Supabase client library version
