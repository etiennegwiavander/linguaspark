# Bearer Token Authentication Fix

## Problem
The API route was returning "You must be logged in to create public lessons" even though the web app was sending a valid Bearer token in the Authorization header.

## Root Cause
The `createServerSupabaseClient()` function only reads authentication from cookies, not from the Authorization header. When the web app sends a Bearer token, it was being ignored.

## Solution
Updated `/api/public-lessons/create` to handle both authentication methods:

1. **Bearer Token (from Authorization header)** - For web app requests
2. **Cookie-based session** - For server-side requests
3. **userId parameter** - For extension requests

### Implementation

```typescript
// Check if Authorization header is present
const authHeader = request.headers.get('authorization');

if (authHeader && authHeader.startsWith('Bearer ')) {
  // Extract and use the Bearer token
  const token = authHeader.substring(7);
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader
      }
    }
  });
  const result = await supabase.auth.getUser(token);
  user = result.data.user;
} else {
  // Fall back to cookie-based session
  const supabase = await createServerSupabaseClient();
  const result = await supabase.auth.getUser();
  user = result.data.user;
}
```

## How It Works Now

### Three Authentication Paths

1. **Extension Context** (userId parameter)
   - Extension sends `userId` in request body
   - API verifies admin status using userId
   - No session or token needed

2. **Web App** (Bearer token)
   - Web app sends `Authorization: Bearer <token>` header
   - API creates Supabase client with the token
   - Gets user from token
   - Verifies admin status

3. **Server-Side** (Cookie session)
   - Server components use cookie-based auth
   - API reads from cookies via `createServerSupabaseClient()`
   - Gets user from session
   - Verifies admin status

## Why This Was Needed

Next.js API routes with Supabase SSR have two common patterns:

1. **Cookie-based** - For server components and pages
2. **Token-based** - For client-side API calls

The original code only supported cookie-based auth, which doesn't work when the client sends a Bearer token.

## Files Modified

- `app/api/public-lessons/create/route.ts` - Added Bearer token support

## Testing

### Test from Web App:
1. Login as admin
2. Generate a lesson
3. Click "Save to Public Library"
4. Fill in admin dialog
5. Click save
6. Should work now! ✅

### Test from Extension:
1. Open extension with `?saveToPublic=true`
2. Generate lesson
3. Fill in admin dialog
4. Click save
5. Should work! ✅

## Key Takeaway

When building Next.js API routes that need to work with both server-side and client-side requests, you need to handle multiple authentication methods:
- Bearer tokens from client-side fetch calls
- Cookies from server-side requests
- Custom parameters for special contexts (like extensions)
