# Authentication Error Fix - Public Lesson Save

## Problem
When trying to save a lesson to the public library from the extension popup, the error "Failed to save lesson: AUTHENTICATION_REQUIRED" was occurring.

## Root Cause
The popup was sending the request body in the wrong format. The API route `/api/public-lessons/create` expects:

```typescript
{
  lesson: {
    title: string,
    lesson_type: string,
    cefr_level: string,
    target_language: string,
    source_url?: string,
    lesson_data: object
  },
  metadata: {
    category: string,
    tags?: string[],
    estimated_duration_minutes?: number
  },
  userId?: string
}
```

But the popup was sending:

```typescript
{
  title: string,
  lesson_type: string,
  cefr_level: string,
  target_language: string,
  source_url?: string,
  lesson_data: object,
  category: string,
  tags?: string[],
  estimated_duration_minutes?: number,
  userId?: string
}
```

This caused the API to not recognize the `userId` parameter and fall back to session-based authentication, which doesn't work in the extension context.

## Solution

### 1. Fixed Request Structure
Updated `app/(protected)/popup/page.tsx` to send the correct request structure:

```typescript
body: JSON.stringify({
  lesson: {
    title: generatedLesson.lessonTitle,
    lesson_type: generatedLesson.lessonType || "discussion",
    cefr_level: generatedLesson.studentLevel || "B1",
    target_language: generatedLesson.targetLanguage || "english",
    source_url: sourceUrl || undefined,
    lesson_data: generatedLesson,
  },
  metadata: {
    category: metadata.category,
    tags: metadata.tags,
    estimated_duration_minutes: metadata.estimated_duration_minutes,
  },
  userId: userId, // Now properly recognized by API
})
```

### 2. Fixed Response Handling
Updated the response handling to match the API's actual response format:

**Before:**
```typescript
const { lesson } = await response.json()
console.log('Lesson saved with ID:', lesson.id)
```

**After:**
```typescript
const result = await response.json()
console.log('Lesson saved with ID:', result.lesson_id)
```

### 3. Improved Error Messages
Enhanced error handling to show the actual error message from the API:

```typescript
const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}`
throw new Error(errorMessage)
```

## How the API Handles Authentication

The `/api/public-lessons/create` route has two authentication paths:

### Path 1: Extension Context (with userId)
```typescript
if (userId) {
  // Verify the user is an admin
  const adminStatus = await isAdmin(userId);
  if (!adminStatus) {
    return 403 PERMISSION_DENIED
  }
  authenticatedUserId = userId;
}
```

### Path 2: Web App Context (session-based)
```typescript
else {
  // Get authenticated user from session
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return 401 AUTHENTICATION_REQUIRED  // ← This was being triggered
  }
  
  authenticatedUserId = user.id;
}
```

## Why It Failed Before

1. The API couldn't find `userId` in the request body (it was nested incorrectly)
2. It fell back to session-based authentication
3. Session-based auth doesn't work in extension popup context
4. Returned `AUTHENTICATION_REQUIRED` error

## Why It Works Now

1. The API correctly finds `userId` in the request body
2. It uses the extension authentication path
3. Verifies admin status using the provided userId
4. Creates the public lesson successfully

## Testing

To verify the fix works:

1. Open extension as admin user
2. Click "Save to Public Library"
3. Generate a lesson
4. Fill in the admin dialog (category required)
5. Click "Save to Public Library"
6. Should see success alert
7. Check public library for the lesson

## Files Modified

- `app/(protected)/popup/page.tsx` - Fixed request structure and response handling

## Related Files

- `app/api/public-lessons/create/route.ts` - API route that expects the correct structure
- `lib/public-lessons-server.ts` - Server-side logic for creating public lessons
- `lib/admin-utils-server.ts` - Admin verification logic

## Key Takeaway

When working with APIs that have multiple authentication paths, ensure the request structure matches exactly what the API expects. Even small structural differences can cause the API to take the wrong authentication path.
