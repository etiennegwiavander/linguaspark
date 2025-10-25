# Save to Library Button Implementation

## Problem
Generated lessons were only being saved to localStorage but not to the Supabase database. Users needed a way to manually save lessons to their library.

## Solution
Added a "Save to Library" button in the lesson display workspace sidebar that allows users to manually save any displayed lesson to the database.

## Changes Made

### 1. Updated WorkspaceSidebar Component
**File**: `components/workspace-sidebar.tsx`

- Added `Save` icon import from lucide-react
- Added new props:
  - `onSaveToLibrary?: () => void` - Handler function for saving
  - `isSavingToLibrary?: boolean` - Loading state
- Added "Save to Library" button in the export section (appears first, with primary styling)

```typescript
{onSaveToLibrary && (
  <Button
    variant="default"
    size="sm"
    className="w-full justify-start text-xs"
    onClick={onSaveToLibrary}
    disabled={isSavingToLibrary}
  >
    {isSavingToLibrary ? (
      <>
        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
        Saving...
      </>
    ) : (
      <>
        <Save className="mr-2 h-3.5 w-3.5" />
        Save to Library
      </>
    )}
  </Button>
)}
```

### 2. Updated LessonDisplay Component
**File**: `components/lesson-display.tsx`

- Added `isSavingToLibrary` state
- Created `handleSaveToLibrary` function that:
  - Extracts source URL from lesson metadata or extraction source
  - Calls `lessonService.saveLesson()` with proper lesson data
  - Shows success/error alerts
  - Includes comprehensive logging for debugging

```typescript
const handleSaveToLibrary = async () => {
  setIsSavingToLibrary(true)
  setExportError("")

  try {
    console.log('[LessonDisplay] 💾 Saving lesson to library...')
    
    const sourceUrl = safeLesson.metadata?.sourceUrl || 
                     safeLesson.extractionSource?.url || 
                     undefined

    const { lessonService } = await import('@/lib/lessons')
    const savedLesson = await lessonService.saveLesson({
      title: safeLesson.lessonTitle,
      lesson_type: safeLesson.lessonType || "discussion",
      student_level: safeLesson.studentLevel || "B1",
      target_language: safeLesson.targetLanguage || "english",
      source_url: sourceUrl,
      lesson_data: safeLesson,
    })

    console.log('[LessonDisplay] ✅ Lesson saved to library with ID:', savedLesson.id)
    alert('Lesson saved to library successfully!')
  } catch (error) {
    console.error('[LessonDisplay] ❌ Failed to save lesson:', error)
    // Error handling with user-friendly messages
  } finally {
    setIsSavingToLibrary(false)
  }
}
```

- Passed new props to WorkspaceSidebar:
  - `onSaveToLibrary={handleSaveToLibrary}`
  - `isSavingToLibrary={isSavingToLibrary}`

## How to Use

1. Generate or view a lesson
2. Open the workspace sidebar (left side)
3. Expand the "Export" section
4. Click "Save to Library" button
5. Wait for confirmation alert
6. Check `/library` page to see the saved lesson

## Features

- **Loading State**: Button shows spinner and "Saving..." text while saving
- **Error Handling**: Shows alerts with specific error messages if save fails
- **Success Feedback**: Shows success alert when lesson is saved
- **Console Logging**: Detailed logs for debugging (with emojis for easy scanning)
- **Source URL Preservation**: Automatically includes source URL if available from metadata

## Testing

To test the button:

1. Generate a new lesson or load an existing one from localStorage
2. Click the "Save to Library" button in the sidebar
3. Check browser console for save messages:
   - `💾 Saving lesson to library...`
   - `✅ Lesson saved to library with ID: ...`
4. Navigate to `/library` to verify the lesson appears
5. Check Supabase database to confirm the lesson was inserted

## Files Modified

- `components/workspace-sidebar.tsx` - Added button and props
- `components/lesson-display.tsx` - Added handler and state

## Next Steps

To make lessons save automatically on generation (not just manually):
1. Investigate why `handleLessonGenerated` in `app/popup/page.tsx` isn't being called
2. Ensure the lesson generator properly calls the callback after generation
3. Add better error handling for automatic saves
