# Admin Save to Public Library Fix

## Problem

When an admin user saved a lesson using the "Save to Library" button, it only saved to their personal library (`lessons` table) and not to the public library (`public_lessons` table). Admin users need the ability to save lessons to the public library so they can be shared with all users.

## Solution

Added functionality to detect admin users and provide them with a choice dialog when saving lessons:

1. **Personal Library** - Saves to the user's private `lessons` table (existing behavior)
2. **Public Library** - Saves to the shared `public_lessons` table with metadata

## Changes Made

### 1. Updated `components/lesson-display.tsx`

#### Added Imports
```typescript
import { AdminLessonCreationDialog } from "@/components/admin-lesson-creation-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
```

#### Added State Variables
```typescript
const [showSaveLocationDialog, setShowSaveLocationDialog] = useState(false)
const [showAdminLessonDialog, setShowAdminLessonDialog] = useState(false)
const [isAdmin, setIsAdmin] = useState(false)
```

#### Added Admin Check
```typescript
useEffect(() => {
  const checkAdminStatus = async () => {
    try {
      const sessionData = localStorage.getItem('sb-jbkpnirowdvlwlgheqho-auth-token')
      if (!sessionData) return
      
      const session = JSON.parse(sessionData)
      const userId = session.user?.id
      
      if (!userId) return
      
      const response = await fetch('/api/admin/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      
      if (response.ok) {
        const data = await response.json()
        setIsAdmin(data.isAdmin === true)
      }
    } catch (error) {
      console.error('Failed to check admin status:', error)
    }
  }
  
  checkAdminStatus()
}, [])
```

#### Modified Save Function
```typescript
const handleSaveToLibrary = async () => {
  // If admin, show dialog to choose where to save
  if (isAdmin) {
    setShowSaveLocationDialog(true)
    return
  }
  
  // Non-admin: save to personal library directly
  await saveToPersonalLibrary()
}
```

#### Added New Functions

**saveToPersonalLibrary()** - Renamed from original `handleSaveToLibrary`, saves to personal library

**saveToPublicLibrary(metadata)** - New function that saves to public library with metadata:
```typescript
const saveToPublicLibrary = async (metadata: any) => {
  // ... saves to /api/public-lessons/create with category, tags, etc.
}
```

#### Added Dialog Components

1. **Save Location Dialog** - Asks admin where to save:
   - "Save to My Personal Library" button
   - "Save to Public Library" button
   - Cancel button

2. **Admin Lesson Creation Dialog** - Collects public lesson metadata:
   - Category (required)
   - Tags (optional)
   - Estimated duration (optional)

## User Flow

### For Regular Users
1. Click "Save to Library"
2. Lesson saves to personal library immediately
3. Success message shown

### For Admin Users
1. Click "Save to Library"
2. Dialog appears: "Choose where to save this lesson"
3. Two options:
   - **Personal Library**: Saves privately (same as regular users)
   - **Public Library**: Opens metadata dialog
4. If Public Library chosen:
   - Metadata dialog appears
   - Admin fills in category (required), tags, duration
   - Click "Save to Public Library"
   - Lesson saves to public library
   - Success message shown

## API Endpoints Used

### Personal Library
- **POST** `/api/save-lesson`
- Saves to `lessons` table
- Requires: title, lesson_type, student_level, target_language, lesson_data

### Public Library
- **POST** `/api/public-lessons/create`
- Saves to `public_lessons` table
- Requires: title, lesson_type, cefr_level, target_language, lesson_data, category
- Optional: tags, estimated_duration_minutes, source_url

## Testing

### Test as Regular User
1. Generate a lesson
2. Click "Save to Library"
3. Should save immediately to personal library
4. Check "My Library" sidebar - lesson should appear

### Test as Admin User
1. Login as admin (`admin@admin.com` / `admin123`)
2. Generate a lesson
3. Click "Save to Library"
4. Dialog should appear with two options
5. Test Personal Library:
   - Click "Save to My Personal Library"
   - Should save to personal library
   - Check "My Library" sidebar
6. Test Public Library:
   - Generate another lesson
   - Click "Save to Library"
   - Click "Save to Public Library"
   - Metadata dialog should appear
   - Fill in category (e.g., "General English")
   - Add tags (e.g., "conversation", "beginner")
   - Set duration (e.g., "45")
   - Click "Save to Public Library"
   - Should save successfully
   - Check public library at `/library` - lesson should appear

## Database Tables

### Personal Library (`lessons`)
- Stores user's private lessons
- Each user can only see their own lessons
- RLS policies enforce user isolation

### Public Library (`public_lessons`)
- Stores shared lessons visible to all users
- Only admins can create/edit/delete
- All users can view and export
- Includes metadata: category, tags, duration

## Benefits

1. **Admin Flexibility**: Admins can choose where to save each lesson
2. **Content Curation**: Admins can build a public library of quality lessons
3. **User Access**: All users benefit from curated public lessons
4. **Separation**: Personal and public libraries remain separate
5. **Metadata**: Public lessons have rich metadata for discovery

## Future Enhancements

- Bulk import lessons to public library
- Convert personal lessons to public
- Public lesson approval workflow
- Analytics on public lesson usage
- User ratings and reviews
- Lesson collections/playlists

## Related Files

- `components/lesson-display.tsx` - Main component with save logic
- `components/admin-lesson-creation-dialog.tsx` - Metadata collection dialog
- `app/api/save-lesson/route.ts` - Personal library API
- `app/api/public-lessons/create/route.ts` - Public library API
- `lib/admin-utils-server.ts` - Admin verification utilities
- `lib/public-lessons-server.ts` - Public lesson database operations

## Summary

Admin users now have the ability to save lessons to either their personal library or the public library. When saving to the public library, they provide metadata (category, tags, duration) to make lessons discoverable. This enables admins to curate a high-quality public lesson library that benefits all users.
