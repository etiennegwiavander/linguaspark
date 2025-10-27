# Lesson Content Structure Fix

## Problem
The API was returning "Lesson content validation failed" because the lesson structure being sent didn't match what the validator expected.

## Root Cause
The API expects `lesson` to be a `LessonContent` object with this structure:
```typescript
{
  title: string,
  warmup: {...},
  vocabulary: {...},
  // ... other sections
  metadata: {
    cefr_level: string,
    lesson_type: string,
    source_url: string
  }
}
```

But we were sending:
```typescript
{
  title: string,
  lesson_type: string,  // ← Wrong! Should be in metadata
  cefr_level: string,   // ← Wrong! Should be in metadata
  lesson_data: {...}    // ← Wrong! Should be flattened
}
```

## Solution
Updated both `lesson-display.tsx` and `popup/page.tsx` to send the correct structure:

### Before:
```typescript
lesson: {
  title: safeLesson.lessonTitle,
  lesson_type: safeLesson.lessonType,
  cefr_level: safeLesson.studentLevel,
  lesson_data: safeLesson,  // Nested incorrectly
}
```

### After:
```typescript
// Prepare lesson content with proper metadata structure
const lessonContent = {
  ...safeLesson,  // Spread the actual lesson content
  title: safeLesson.lessonTitle || safeLesson.title,
  metadata: {
    ...safeLesson.metadata,
    cefr_level: safeLesson.studentLevel || "B1",
    lesson_type: safeLesson.lessonType || "discussion",
    source_url: sourceUrl,
  }
};

// Send it
lesson: lessonContent
```

## How the API Uses This

The `createPublicLesson` function extracts fields from the lesson content:

```typescript
const lessonData = {
  creator_id: userId,
  title: content.title,                    // From lesson.title
  content: content,                        // The full lesson
  cefr_level: content.metadata.cefr_level, // From lesson.metadata
  lesson_type: content.metadata.lesson_type, // From lesson.metadata
  source_url: content.metadata.source_url,  // From lesson.metadata
  category: metadata.category,             // From metadata param
  tags: metadata.tags,                     // From metadata param
  estimated_duration_minutes: metadata.estimated_duration_minutes,
};
```

## Key Points

1. **Lesson Content** = The actual lesson structure (warmup, vocabulary, etc.) + metadata
2. **Metadata Parameter** = Only category, tags, and estimated_duration_minutes
3. **Title, cefr_level, lesson_type, source_url** = Must be in `lesson.metadata`

## Files Modified

- `components/lesson-display.tsx` - Fixed lesson content structure for web app
- `app/(protected)/popup/page.tsx` - Fixed lesson content structure for extension

## Testing

Try saving a public lesson now. The validation should pass because:
- ✅ Lesson content has the correct structure
- ✅ Metadata fields are in the right place
- ✅ Title, cefr_level, lesson_type are in lesson.metadata
- ✅ Category, tags, estimated_duration are in the metadata parameter

## Expected Result

The lesson should save successfully to the public library! 🎉
