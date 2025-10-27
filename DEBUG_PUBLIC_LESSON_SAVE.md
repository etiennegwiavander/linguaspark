# Debug Guide: Public Lesson Save Authentication Error

## Current Status
The "AUTHENTICATION_REQUIRED" error persists when trying to save a lesson to the public library from the extension.

## Debugging Steps

### Step 1: Check Browser Console Logs
Open the browser console (F12) and look for these log messages when you try to save:

1. **On page load (with saveToPublic=true):**
   ```
   [LinguaSpark Popup] 🔍 saveToPublic parameter detected
   [LinguaSpark Popup] 📦 Session data structure: {...}
   [LinguaSpark Popup] 👤 User ID set to: <user-id>
   [LinguaSpark Popup] 👑 Admin status: true/false
   ```

2. **When clicking "Save to Public Library" in dialog:**
   ```
   [LinguaSpark Popup] 💾 Saving lesson to public library...
   [LinguaSpark Popup] 🔑 userId: <user-id>
   [LinguaSpark Popup] 📝 metadata: {...}
   [LinguaSpark Popup] 📤 Request body structure: {...}
   ```

### Step 2: Verify What's Being Sent
Check the console for the "Request body structure" log. It should show:
```javascript
{
  hasLesson: true,
  hasMetadata: true,
  hasUserId: true,
  userId: "<actual-user-id-string>"
}
```

**If `hasUserId` is false or `userId` is null:**
- The problem is that the userId isn't being captured on mount
- Check the "Session data structure" log to see if `user.id` exists

**If `hasUserId` is true and userId has a value:**
- The problem is on the API side
- The API isn't recognizing the userId parameter

### Step 3: Check Network Tab
1. Open DevTools → Network tab
2. Try to save the lesson
3. Find the request to `/api/public-lessons/create`
4. Click on it and check:
   - **Request Payload**: Should show the nested structure with `lesson`, `metadata`, and `userId`
   - **Response**: Should show the error details

### Step 4: Verify Session Storage
In the console, run:
```javascript
const sessionData = localStorage.getItem('sb-jbkpnirowdvlwlgheqho-auth-token')
const session = JSON.parse(sessionData)
console.log('Session:', session)
console.log('User ID:', session.user?.id)
```

This will show if the user ID is available in the session.

### Step 5: Test API Directly
You can test the API directly from the console:

```javascript
const sessionData = localStorage.getItem('sb-jbkpnirowdvlwlgheqho-auth-token')
const session = JSON.parse(sessionData)

fetch('/api/public-lessons/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  },
  body: JSON.stringify({
    lesson: {
      title: "Test Lesson",
      lesson_type: "discussion",
      cefr_level: "B1",
      target_language: "english",
      lesson_data: { lessonTitle: "Test" }
    },
    metadata: {
      category: "general-english"
    },
    userId: session.user.id
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

## Possible Issues and Solutions

### Issue 1: userId is null
**Symptom:** Console shows `userId: null` or `hasUserId: false`

**Cause:** The session doesn't have a user object or user.id

**Solution:** Check if you're logged in properly. Try logging out and back in.

### Issue 2: API doesn't recognize userId
**Symptom:** userId is sent but API still returns AUTHENTICATION_REQUIRED

**Cause:** The API route might not be parsing the request body correctly

**Solution:** Check the API route code at `app/api/public-lessons/create/route.ts`

### Issue 3: Wrong request structure
**Symptom:** Network tab shows flat structure instead of nested

**Cause:** Code isn't using the updated structure

**Solution:** Verify the popup page code has the nested structure:
```typescript
{
  lesson: { ... },
  metadata: { ... },
  userId: "..."
}
```

### Issue 4: Authorization header not working
**Symptom:** API can't read the auth token

**Cause:** Extension context might not pass headers correctly

**Solution:** The userId parameter should bypass this, but verify the Authorization header is being sent in Network tab

## Expected Flow

1. User opens extension with `?saveToPublic=true`
2. Popup reads parameter and checks admin status
3. Popup stores userId from session
4. User generates lesson
5. Admin dialog appears
6. User fills metadata and clicks save
7. Popup sends request with:
   - Nested lesson object
   - Nested metadata object
   - userId parameter
8. API receives request
9. API finds userId in body
10. API verifies admin status using userId
11. API creates public lesson
12. Success!

## What to Report

Please provide:
1. All console logs from the popup page
2. Screenshot of Network tab showing the request payload
3. The response from the API (from Network tab)
4. Result of running the session check (Step 4)

This will help identify exactly where the flow is breaking.
