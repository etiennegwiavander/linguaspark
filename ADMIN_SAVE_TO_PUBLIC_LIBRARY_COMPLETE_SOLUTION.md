# Admin Save to Public Library - Complete Solution

## Summary
The admin dialog appears correctly, but saving to public library fails because the web app doesn't handle the `saveToPublic` URL parameter.

## What Works
✅ Admin check API (`/api/admin/check-status`) - Working
✅ RLS policy for reading `is_admin` column - Working  
✅ Extension shows admin dialog - Working
✅ Extension sets `saveToPublic=true` URL parameter - Working
✅ Create public lesson API accepts `userId` parameter - Working

## What's Missing
❌ The popup page (`app/(protected)/popup/page.tsx`) doesn't read the `saveToPublic` URL parameter
❌ The popup page doesn't call the public lessons API when `saveToPublic=true`

## The Fix Needed

The popup page needs to be updated to:

1. Read the `saveToPublic` parameter from the URL:
```typescript
const urlParams = new URLSearchParams(window.location.search)
const saveToPublic = urlParams.get('saveToPublic') === 'true'
```

2. When saving a lesson, check if `saveToPublic` is true
3. If true, call `/api/public-lessons/create` instead of `/api/save-lesson`
4. Include the userId in the request body
5. Show the admin lesson creation dialog to collect metadata (category, tags, etc.)

## Implementation Steps

### Step 1: Update the popup page to read saveToPublic parameter

In `app/(protected)/popup/page.tsx`, add state for saveToPublic:

```typescript
const [saveToPublic, setSaveToPublic] = useState(false)

useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search)
  const shouldSaveToPublic = urlParams.get('saveToPublic') === 'true'
  setSaveToPublic(shouldSaveToPublic)
}, [])
```

### Step 2: Update the save function

Find where the lesson is saved (around line 310-350) and modify it to:

```typescript
if (saveToPublic) {
  // Show admin dialog to collect metadata
  // Then call /api/public-lessons/create with userId
} else {
  // Existing save logic to /api/save-lesson
}
```

### Step 3: Integrate the AdminLessonCreationDialog component

The component already exists at `components/admin-lesson-creation-dialog.tsx`. Import and use it in the popup page.

## Alternative Quick Solution

For immediate testing, you can:
1. Log into the web app at `http://localhost:3000`
2. Use the admin panel in the workspace sidebar
3. Create public lessons directly from there

The extension integration can be completed later as a separate task.

## Files Modified
- ✅ `scripts/009_allow_admin_check.sql` - RLS policy created
- ✅ `lib/admin-utils-server.ts` - Admin check function fixed
- ✅ `app/api/public-lessons/create/route.ts` - API updated to accept userId
- ⏳ `app/(protected)/popup/page.tsx` - Needs update to handle saveToPublic

## Testing
Once the popup page is updated:
1. Open the extension on any webpage
2. Extract content and generate a lesson
3. As an admin, you'll see the "Save to Public Library" option
4. Select it and fill in the metadata
5. The lesson should save to the public_lessons table

