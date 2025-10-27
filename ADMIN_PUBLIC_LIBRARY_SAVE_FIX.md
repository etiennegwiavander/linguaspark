# Admin Public Library Save - Complete Fix

## Problem
The extension shows an admin dialog to save to public library, but the actual save fails with "AUTHENTICATION_REQUIRED".

## Root Cause
The extension sets a `saveToPublic=true` URL parameter, but the web app doesn't handle it. The web app needs to:
1. Read the `saveToPublic` parameter from the URL
2. Get the userId from the session
3. Pass the userId to the create public lesson API

## Solution

### Step 1: Update the popup page to handle saveToPublic parameter

The popup page (likely `app/popup/page.tsx` or similar) needs to:
- Read `saveToPublic` from URL search params
- When saving the lesson, if `saveToPublic=true`, call the public lessons API instead of the regular save API
- Include the userId in the request

### Step 2: The API is already updated
The `/api/public-lessons/create` route now accepts a `userId` parameter and verifies admin status.

## Quick Fix for Testing

For now, you can test by:
1. Opening the web app at `http://localhost:3000`
2. Logging in as the admin user
3. Using the admin panel in the web app to create public lessons

The extension integration requires finding and updating the popup page component to handle the `saveToPublic` parameter.

## Files to Check
- Look for files in `app/popup/` or `app/(popup)/` directory
- Search for where lessons are saved in the web app
- The component that handles lesson generation and saving

