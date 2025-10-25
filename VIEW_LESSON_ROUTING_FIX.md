# View Lesson Button Routing Fix

## Problem
The "View Lesson" button in the lesson library was routing users to the landing page (`/`) instead of displaying the lesson. This happened because:

1. The lesson library was routing to `/?lessonId=${lesson.id}`
2. The landing page (`app/page.tsx`) is a marketing page with no lesson display logic
3. The popup page (`app/popup/page.tsx`) is where lessons should be displayed

## Solution

### 1. Fixed Routing in Lesson Library
**File**: `components/lesson-library.tsx`

Changed the `handleViewLesson` function to route to the popup page:

```typescript
const handleViewLesson = (lesson: Lesson) => {
  // Navigate to popup page with lesson data
  router.push(`/popup?lessonId=${lesson.id}`)
}
```

### 2. Added Lesson Loading Logic to Popup Page
**File**: `app/popup/page.tsx`

Changes made:
- Fixed TypeScript typing: `useState<any>(null)` instead of `useState(null)`
- Enhanced the `useEffect` hook to check for `lessonId` query parameter
- Load the lesson from database using `lessonService.getLesson()`
- Added comprehensive error handling and logging
- Display user-friendly error messages if lesson fails to load

```typescript
// Fixed state typing
const [generatedLesson, setGeneratedLesson] = useState<any>(null)

// Enhanced lesson loading with error handling
useEffect(() => {
  const loadLesson = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const lessonId = urlParams.get('lessonId')
      
      if (lessonId) {
        console.log('[LinguaSpark Popup] 🔍 Loading lesson from database with ID:', lessonId)
        
        try {
          const { lessonService } = await import('@/lib/lessons')
          const lesson = await lessonService.getLesson(lessonId)
          
          if (lesson) {
            console.log('[LinguaSpark Popup] ✅ Loaded lesson from database:', lesson.title)
            setGeneratedLesson(lesson.lesson_data)
            setSourceUrl(lesson.source_url || '')
            localStorage.setItem('linguaspark_current_lesson', JSON.stringify(lesson.lesson_data))
            return
          } else {
            console.error('[LinguaSpark Popup] ❌ Lesson not found')
            alert('Lesson not found. It may have been deleted or you may not have permission to view it.')
          }
        } catch (loadError) {
          console.error('[LinguaSpark Popup] ❌ Error loading lesson:', loadError)
          alert(`Failed to load lesson: ${loadError.message}`)
        }
        return
      }
      
      // Fallback to localStorage if no lessonId in URL
      const savedLesson = localStorage.getItem('linguaspark_current_lesson')
      if (savedLesson) {
        const lesson = JSON.parse(savedLesson)
        setGeneratedLesson(lesson)
      }
    } catch (error) {
      console.error('[LinguaSpark Popup] Failed to load lesson:', error)
    }
  }
  loadLesson()
}, [])
```

## Testing Steps

1. **Open the lesson library**: Navigate to `/library`
2. **Click "View Lesson"**: Click the button on any lesson card
3. **Check the URL**: Should redirect to `/popup?lessonId=<lesson-id>`
4. **Verify lesson loads**: The lesson should display in the LessonDisplay component
5. **Check console**: Look for success messages like "✅ Loaded lesson from database"

## Troubleshooting

If the lesson doesn't load:

1. **Check browser console** for error messages:
   - Authentication errors: "No authenticated user"
   - Permission errors: "Lesson not found" 
   - Network errors: Check Supabase connection

2. **Verify authentication**: Make sure you're signed in
   - Check if UserMenu shows your email
   - Try signing out and back in

3. **Check lesson ownership**: The lesson must belong to your account
   - RLS policies ensure users can only view their own lessons

4. **Check browser network tab**: Look for the database query
   - Should see a request to Supabase
   - Check response for errors

## Files Modified

- `components/lesson-library.tsx` - Fixed routing destination
- `app/popup/page.tsx` - Added lesson loading from URL parameter with error handling

## Related Services

The fix uses the existing `lessonService.getLesson(id)` method from `lib/lessons.ts`, which:
- Authenticates the user via Supabase
- Fetches the lesson from the `lessons` table
- Ensures the lesson belongs to the authenticated user (RLS policy)
- Returns the complete lesson data including `lesson_data` field
