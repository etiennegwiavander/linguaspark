# User Menu with Sign Out - Added

## What I Added

A user menu with sign-out functionality that appears on all pages.

### Features:
- **User avatar** with initials
- **Dropdown menu** showing:
  - User's name and email
  - Profile option (disabled for now)
  - Sign out button

### Where It Appears:
- **Library page** (`/library`) - Top right corner
- **Main page** (`/popup`) - Top right corner
- Any other page wrapped with AuthWrapper

## How to Sign Out

### Method 1: Use the User Menu (Recommended)
1. Look for your **avatar/initials** in the top right corner
2. Click on it
3. Click **"Sign out"**
4. You'll be signed out and redirected to the sign-in form

### Method 2: Clear Browser Storage (If menu doesn't work)
1. Open browser console (F12)
2. Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Find "Local Storage" → your domain
4. Clear all items
5. Refresh the page

### Method 3: Use Console Command
1. Open browser console (F12)
2. Type:
   ```javascript
   localStorage.clear()
   sessionStorage.clear()
   location.reload()
   ```
3. Press Enter

## User Menu Component

Created `components/user-menu.tsx` with:
- Avatar showing user initials
- Dropdown with user info
- Sign out button with loading state
- Proper error handling

## Files Modified

1. **components/user-menu.tsx** (NEW)
   - User menu component with sign-out

2. **components/lesson-library.tsx**
   - Added UserMenu to header

3. **app/popup/page.tsx**
   - Added UserMenu to header
   - Added header section with app title

## What It Looks Like

```
┌─────────────────────────────────────────────┐
│  LinguaSpark              [User Avatar] ▼   │
│  Transform content...                       │
└─────────────────────────────────────────────┘

When you click the avatar:
┌──────────────────────┐
│ John Doe             │
│ john@example.com     │
├──────────────────────┤
│ 👤 Profile           │
├──────────────────────┤
│ 🚪 Sign out          │
└──────────────────────┘
```

## Testing

1. **Refresh your browser** to see the changes
2. Look for your **avatar in the top right**
3. Click it to see the menu
4. Click "Sign out" to test

## Troubleshooting

### "I don't see the user menu"
- Hard refresh (Ctrl+Shift+R)
- Check browser console for errors
- Make sure you're signed in

### "Sign out doesn't work"
- Check console for errors
- Try Method 2 or 3 above
- Restart dev server

### "I want to switch accounts"
1. Sign out using the menu
2. Sign in with different credentials
3. Or use browser incognito mode for testing

## Additional Features (Future)

The user menu can be extended to include:
- Profile settings
- Account preferences
- Theme toggle
- Help/documentation links
- Keyboard shortcuts

## Sign In Again

After signing out:
1. You'll see the sign-in form
2. Enter your credentials
3. Click "Sign In"
4. You'll be back in the app

## Multiple Accounts

To test with multiple accounts:
- Use different browser profiles
- Use incognito/private windows
- Sign out and sign in with different credentials

## Security Note

The sign-out process:
1. Clears Supabase session
2. Removes auth tokens
3. Redirects to sign-in form
4. Prevents unauthorized access

Your data remains safe in the database and is only accessible when you sign in again.
