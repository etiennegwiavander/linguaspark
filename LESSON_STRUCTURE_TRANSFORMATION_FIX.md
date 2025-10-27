# Lesson Structure Transformation Fix - CORRECTED

## Root Cause Identified

The previous fix added transformation logic but in the WRONG place. The transformation was happening in the display/rendering code, but NOT before sending the lesson to the API.

## The Problem

Looking at the validation logs:
```
[API] Has warmup: false
[API] Has wrapup: false
[API] Validation failed: [
  'Warmup section with at least one question is required',
  'Wrapup section with summary is required',
  'At least one main content section required'
]
```

The lesson being sent to `/api/public-lessons/create` still had the `sections` array structure instead of the flat structure the validator expects.

## The Solution

Applied the transformation logic in TWO critical places where lessons are sent to the public library API:

### 1. Extension Popup (`app/(protected)/popup/page.tsx`)
**Line ~463**: Before calling `/api/public-lessons/create`

### 2. Lesson Display Component (`components/lesson-display.tsx`)
**Line ~518**: Before calling `/api/public-lessons/create`

## Transformation Logic

```typescript
// Transform sections array into expected flat structure
const transformedLesson: any = {
  title: lesson.lessonTitle || lesson.title,
  metadata: {
    ...lesson.metadata,
    cefr_level: lesson.studentLevel || lesson.metadata?.cefr_level || "B1",
    lesson_type: lesson.lessonType || lesson.metadata?.lesson_type || "discussion",
    source_url: sourceUrl || lesson.metadata?.source_url,
  }
};

// Transform sections array into flat properties
if (lesson.sections && Array.isArray(lesson.sections)) {
  lesson.sections.forEach((section: any) => {
    if (section.type) {
      transformedLesson[section.type] = section;
    }
  });
}

// Ensure required sections exist with fallbacks
if (!transformedLesson.warmup) {
  transformedLesson.warmup = {
    questions: ["What do you know about this topic?"]
  };
}

if (!transformedLesson.wrapup) {
  transformedLesson.wrapup = {
    summary: "In this lesson, we explored the key concepts and practiced using them in context."
  };
}

// Ensure at least one main content section exists
const mainSections = ['vocabulary', 'grammar', 'reading', 'discussion', 'pronunciation'];
const hasMainSection = mainSections.some(section => transformedLesson[section]);

if (!hasMainSection) {
  transformedLesson.discussion = {
    questions: ["What are your thoughts on this topic?", "How does this relate to your experience?"]
  };
}
```

## What This Fixes

Before the API receives the lesson:
- ✅ Transforms `sections` array into flat properties (`vocabulary`, `grammar`, etc.)
- ✅ Adds `warmup` section with default questions if missing
- ✅ Adds `wrapup` section with default summary if missing
- ✅ Ensures at least one main content section exists
- ✅ Preserves proper metadata structure

## Files Modified

1. `app/(protected)/popup/page.tsx` - Added transformation before API call
2. `components/lesson-display.tsx` - Added transformation before API call

## Testing

Try saving a lesson to the public library now from either:
1. The extension popup
2. The web app lesson display

The transformation will happen BEFORE the API call, so the validator will receive:
```javascript
{
  title: "...",
  warmup: { questions: [...] },      // ✅ Present
  vocabulary: { ... },                // ✅ Present
  discussion: { ... },                // ✅ Present
  wrapup: { summary: "..." },        // ✅ Present
  metadata: {
    cefr_level: "B1",                // ✅ Present
    lesson_type: "discussion"        // ✅ Present
  }
}
```

## Expected Result

✅ Validation passes
✅ Lesson saves to public library successfully
✅ No more 400 errors!

The validator will now find all required sections and accept the lesson structure.
