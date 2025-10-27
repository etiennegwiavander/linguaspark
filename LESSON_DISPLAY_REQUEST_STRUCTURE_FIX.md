# Lesson Display Request Structure Fix

## Problem Identified
The error was coming from `lesson-display.tsx`, not from the popup page. You were testing from the regular web app, not from the extension.

The lesson-display component was sending the request in the wrong format (flat structure instead of nested).

## Root Cause
The `/api/public-lessons/create` API route expects:
```typescript
{
  lesson: { ... },
  metadata: { ... },
  userId?: string  // Optional, for extension context
}
```

But `lesson-display.tsx` was sending:
```typescript
{
  title: ...,
  lesson_type: ...,
  category: ...,
  tags: ...,
  // All flat, not nested
}
```

## Solution Applied

### Updated `components/lesson-display.tsx`

Changed the request structure to match the API expectations:

**Before:**
```typescript
body: JSON.stringify({
  title: safeLesson.lessonTitle,
  lesson_type: safeLesson.lessonType || "discussion",
  cefr_level: safeLesson.studentLevel || "B1",
  target_language: safeLesson.targetLanguage || "english",
  source_url: sourceUrl,
  lesson_data: safeLesson,
  category: metadata.category,
  tags: metadata.tags,
  estimated_duration_minutes: metadata.estimated_duration_minutes,
})
```

**After:**
```typescript
body: JSON.stringify({
  lesson: {
    title: safeLesson.lessonTitle,
    lesson_type: safeLesson.lessonType || "discussion",
    cefr_level: safeLesson.studentLevel || "B1",
    target_language: safeLesson.targetLanguage || "english",
    source_url: sourceUrl,
    lesson_data: safeLesson,
  },
  metadata: {
    category: metadata.category,
    tags: metadata.tags,
    estimated_duration_minutes: metadata.estimated_duration_minutes,
  }
  // No userId needed - web app uses session-based auth
})
```

### Also Fixed Response Handling

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

### Improved Error Messages

```typescript
const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}`
throw new Error(errorMessage)
```

## How Authentication Works

### Web App (lesson-display.tsx)
- Uses session-based authentication
- API route calls `createServerSupabaseClient()` to get user from session
- No userId parameter needed

### Extension Popup (popup page)
- Cannot use session-based auth (different context)
- Passes `userId` parameter explicitly
- API route uses the provided userId instead of session

## Testing

### To test from web app:
1. Login as admin
2. Generate a lesson
3. Click "Save to Library" button
4. Select "Save to Public Library"
5. Fill in admin dialog
6. Click "Save to Public Library"
7. Should work now! ✅

### To test from extension:
1. Open extension with `?saveToPublic=true`
2. Generate lesson
3. Admin dialog appears
4. Fill in metadata
5. Click save
6. Should work! ✅

## Files Modified

- `components/lesson-display.tsx` - Fixed request structure for web app

## Related Files

- `app/(protected)/popup/page.tsx` - Already has correct structure for extension
- `app/api/public-lessons/create/route.ts` - API route that expects nested structure

## Key Takeaway

Both the web app (lesson-display) and extension popup (popup page) need to send the same nested request structure to the API. The only difference is that the extension also includes a `userId` parameter since it can't use session-based auth.
