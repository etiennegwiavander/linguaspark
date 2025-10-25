# View Lesson Loading Fix

## Problem
When clicking "View Lesson" in the library, users were routed to `/popup?lessonId=<id>` but saw the lesson generator page instead of the actual lesson. The lesson wasn't loading from the database.

## Root Cause
The popup page was using `lessonService.getLesson()` which was hanging due to Supabase client issues. This caused the lesson to never load, leaving `generatedLesson` as `null`, which triggered the generator view instead of the lesson display.

## Solution

### 1. Created GET Lesson API Route
**File**: `app/api/get-lesson/route.ts`

New API endpoint that fetches a single lesson by ID:
- Accepts GET requests with lesson ID as query parameter (`?id=<lesson-id>`)
- Validates authentication via Authorization header
- Ensures user owns the lesson (via RLS policy)
- Returns the complete lesson object including `lesson_data`

```typescript
GET /api/get-lesson?id=<lesson-id>
Headers: Authorization: Bearer <token>
Response: { lesson: { id, title, lesson_data, ... } }
```

### 2. Updated Popup Page to Use API
**File**: `app/popup/page.tsx`

Updated the lesson loading logic in the `useEffect` hook:
- Detects `lessonId` query parameter
- Gets auth token from localStorage
- Calls `/api/get-lesson` API route
- Sets the lesson data to display
- Persists to localStorage for continuity

## How It Works

### Flow:
1. User clicks "View Lesson" in library
2. Routes to `/popup?lessonId=<id>`
3. Popup page detects `lessonId` parameter
4. Fetches lesson from API with auth token
5. Sets `generatedLesson` state with lesson data
6. LessonDisplay component renders the lesson

### URL Patterns:
- **New lesson generation**: `/popup?source=extraction&sessionId=...&title=...`
- **View saved lesson**: `/popup?lessonId=<uuid>`
- **Both work correctly now!**

## Testing

1. Go to `/library`
2. Click "View Lesson" on any lesson
3. Should route to `/popup?lessonId=<id>`
4. Lesson should load and display immediately
5. Check console for: `✅ Loaded lesson from database: <title>`

## Console Messages

Success flow:
```
[LinguaSpark Popup] 🔍 Loading lesson from database with ID: <id>
[API] Get lesson - Getting auth token from request headers
[API] Fetching lesson: <id>
[API] Authenticated user: <user-id>
[API] ✅ Lesson fetched successfully: <title>
[LinguaSpark Popup] ✅ Loaded lesson from database: <title>
```

## Files Modified

- `app/api/get-lesson/route.ts` - New API route for fetching lessons
- `app/popup/page.tsx` - Updated to use API instead of hanging lessonService

## Benefits

1. **Reliable Loading**: Uses API route that doesn't hang
2. **Fast**: Direct database query with proper auth
3. **Secure**: RLS policies ensure users only see their own lessons
4. **Consistent**: Same auth pattern as save/delete operations
5. **Error Handling**: Clear error messages if lesson not found

## Related Files

- `app/api/save-lesson/route.ts` - Save lessons
- `app/api/delete-lesson/route.ts` - Delete lessons
- `app/api/get-lessons/route.ts` - List all lessons
- `app/api/get-lesson/route.ts` - Get single lesson (NEW)

All lesson operations now use reliable API routes instead of the hanging lessonService!
