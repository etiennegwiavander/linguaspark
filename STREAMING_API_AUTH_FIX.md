# Streaming API Authentication Fix

## Problem
When clicking "Generate AI Lesson", the streaming API returned an authentication error:
```
AUTH_ERROR: Authentication required
Error ID: AUTH_1761402002091
```

## Root Cause
The streaming API route (`/api/generate-lesson-stream`) was trying to authenticate using `supabase.auth.getUser()` without any token, which always fails in API routes. The lesson generator component wasn't sending the authentication token in the request headers.

## Solution

### 1. Updated Lesson Generator to Send Auth Token
**File**: `components/lesson-generator.tsx`

Added code to retrieve the auth token from localStorage and include it in the API request:

```typescript
// Get auth token from localStorage
const sessionData = localStorage.getItem('sb-jbkpnirowdvlwlgheqho-auth-token')
let authToken = ''
if (sessionData) {
  try {
    const session = JSON.parse(sessionData)
    authToken = session.access_token
  } catch (e) {
    console.error('[LessonGenerator] Failed to parse session data:', e)
  }
}

// Call the streaming AI generation API
const response = await fetch("/api/generate-lesson-stream", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {})
  },
  body: JSON.stringify(requestBody),
})
```

### 2. Updated Streaming API to Use Authorization Header
**File**: `app/api/generate-lesson-stream/route.ts`

Changed authentication to expect and validate the Authorization header:

```typescript
// Get auth token from request headers
const authHeader = request.headers.get('Authorization')

if (!authHeader) {
  controller.enqueue(
    encoder.encode(createSSEMessage({
      type: 'error',
      error: {
        type: 'AUTH_ERROR',
        message: 'Authentication required - no authorization header',
        errorId: `AUTH_${Date.now()}`
      },
      progressState: currentProgressState
    }))
  )
  controller.close()
  return
}

// Verify the token by creating a client with it
const supabase = createClient()
const token = authHeader.replace('Bearer ', '')
const { data: { user }, error: authError } = await supabase.auth.getUser(token)

if (authError || !user) {
  controller.enqueue(
    encoder.encode(createSSEMessage({
      type: 'error',
      error: {
        type: 'AUTH_ERROR',
        message: 'Invalid or expired token',
        errorId: `AUTH_${Date.now()}`
      },
      progressState: currentProgressState
    }))
  )
  controller.close()
  return
}
```

## Testing

1. Make sure you're signed in (check UserMenu in top right)
2. Go to `/popup` page
3. Enter or extract some content
4. Click "Generate AI Lesson"
5. The lesson should generate successfully with progress updates

## Files Modified

- `components/lesson-generator.tsx` - Added auth token to API request
- `app/api/generate-lesson-stream/route.ts` - Updated to use Authorization header

## Notes

This fix aligns the streaming API authentication with the pattern used in other API routes like `/api/get-lessons`. The auth token is retrieved from localStorage (where Supabase stores it) and passed via the Authorization header.
