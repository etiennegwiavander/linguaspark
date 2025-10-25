# Check if Supabase API is Receiving Calls

## Step 1: Open Browser DevTools Network Tab

1. Open `http://localhost:3000/library` in your browser
2. Press F12 to open DevTools
3. Click on the **Network** tab
4. Refresh the page (Ctrl+R or Cmd+R)

## Step 2: Look for Supabase API Calls

Filter the network requests by typing your Supabase URL or "supabase" in the filter box.

You should see requests like:
- `POST https://[your-project].supabase.co/auth/v1/user` (authentication check)
- `GET https://[your-project].supabase.co/rest/v1/lessons?...` (fetching lessons)

## Step 3: Inspect the Request

Click on the lessons request and check:

### Request Headers
- Should include `Authorization: Bearer [token]`
- Should include `apikey: [your-anon-key]`

### Query Parameters
- `tutor_id=eq.[user-id]`
- `order=created_at.desc`
- `limit=100`

### Response
- Status: 200 OK (success) or 4xx/5xx (error)
- Body: Array of lesson objects or error message

## What to Look For

### ✅ Good Signs:
- You see a request to `/rest/v1/lessons`
- Status is 200 OK
- Response body is an array (even if empty: `[]`)

### ❌ Problem Signs:
- **No requests to Supabase** → The function isn't being called at all
- **401 Unauthorized** → Authentication token is missing or invalid
- **403 Forbidden** → RLS policies are blocking access
- **404 Not Found** → Table doesn't exist or wrong URL
- **Request hangs/times out** → Network or CORS issue

## Step 4: Test Direct API Endpoint

Open a new browser tab and navigate to:
```
http://localhost:3000/api/test-lessons-direct
```

This will show you the raw response from the database query.

## Step 5: Check Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Table Editor** → **lessons** table
4. Verify that lessons exist with your `tutor_id`
5. Go to **Authentication** → **Users** and note your user ID
6. Check if any lessons have `tutor_id` matching your user ID

## Common Issues and Solutions

### Issue: No network requests to Supabase
**Cause:** The `getLessons` function isn't being called
**Solution:** Check if `user` is defined in the component

### Issue: 401 Unauthorized
**Cause:** No valid authentication token
**Solution:** Sign out and sign back in to refresh the token

### Issue: 403 Forbidden
**Cause:** RLS policies blocking access
**Solution:** Check RLS policies in Supabase dashboard

### Issue: Empty array returned
**Cause:** No lessons exist for this user
**Solution:** Create a test lesson first

### Issue: Request to wrong tutor_id
**Cause:** User ID mismatch
**Solution:** Verify the user ID in auth matches tutor_id in lessons table
