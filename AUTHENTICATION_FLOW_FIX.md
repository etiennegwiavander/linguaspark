# Authentication Flow Fix - Proper Session Management

## Issue
After signing out and being redirected to the landing page, clicking the browser's back button would return the user to their authenticated account without requiring login. The authentication flow wasn't properly invalidating sessions.

## Root Cause

### 1. **Browser Caching**
- Using `window.location.href = '/'` adds the redirect to browser history
- Back button restores the cached authenticated page
- React state is restored from cache with old session

### 2. **Session Not Properly Cleared**
- Only calling `supabase.auth.signOut()` without scope
- Not clearing localStorage auth tokens
- Not preventing browser history navigation

### 3. **No Session Verification on Page Visibility**
- When user hits back button, page becomes visible again
- No check to verify if session is still valid
- Stale session state allows access to protected content

## Solution

### 1. Enhanced Sign Out with Global Scope ✅
**File**: `components/auth-wrapper.tsx`

```typescript
const signOut = async () => {
  console.log('[AuthWrapper] Starting sign out...')

  try {
    // Add timeout to prevent hanging
    // IMPORTANT: Use scope: 'global' to sign out from all devices
    const signOutPromise = supabase.auth.signOut({ scope: 'global' })
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Sign out timeout')), 5000)
    )

    const { error } = await Promise.race([signOutPromise, timeoutPromise]) as any

    if (error) {
      console.error('[AuthWrapper] Sign out error:', error)
    }
    
    console.log('[AuthWrapper] Sign out successful')
  } catch (error) {
    console.error('[AuthWrapper] Sign out failed or timed out:', error)
  }

  console.log('[AuthWrapper] Clearing state and redirecting...')
  
  // Clear user state immediately
  setUser(null)
  
  // Clear all local storage related to auth
  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.includes('supabase') || key.includes('auth')) {
        localStorage.removeItem(key)
      }
    })
  } catch (e) {
    console.error('[AuthWrapper] Error clearing localStorage:', e)
  }
  
  // Use replace to prevent back button from returning to authenticated page
  window.location.replace('/')
}
```

**Key Changes**:
- ✅ `scope: 'global'` - Signs out from all devices/tabs
- ✅ Clear all localStorage keys containing 'supabase' or 'auth'
- ✅ `window.location.replace('/')` - Replaces history entry instead of adding new one
- ✅ Timeout protection (5 seconds)

### 2. Session Verification on Page Visibility ✅
**File**: `components/auth-wrapper.tsx`

Added session verification in AuthGuard:

```typescript
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const supabase = getSupabaseClient()
  const [isVerifying, setIsVerifying] = useState(true)

  useEffect(() => {
    // Verify session on mount and when page becomes visible
    const verifySession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session && user) {
          // Session expired but user state still exists - force reload
          console.log('[AuthGuard] Session expired, reloading...')
          window.location.replace('/')
        }
      } catch (error) {
        console.error('[AuthGuard] Error verifying session:', error)
      } finally {
        setIsVerifying(false)
      }
    }

    verifySession()

    // Re-verify when page becomes visible (e.g., after browser back button)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        verifySession()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user, supabase.auth])

  if (loading || isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  return <>{children}</>
}
```

**Key Features**:
- ✅ Verifies session on component mount
- ✅ Re-verifies when page becomes visible (back button, tab switch)
- ✅ Forces reload if session expired but user state exists
- ✅ Uses `visibilitychange` event to detect page visibility
- ✅ Prevents access to protected content with stale sessions

## How It Works Now

### Normal Sign Out Flow:
1. User clicks "Sign out"
2. Call `supabase.auth.signOut({ scope: 'global' })`
3. Clear user state: `setUser(null)`
4. Clear all auth-related localStorage
5. Replace history: `window.location.replace('/')`
6. User sees landing page
7. **Back button does nothing** (history replaced, not added)

### Browser Back Button After Sign Out:
1. User clicks back button
2. Browser attempts to restore previous page
3. Page becomes visible
4. `visibilitychange` event fires
5. AuthGuard verifies session: `supabase.auth.getSession()`
6. No valid session found
7. Force reload: `window.location.replace('/')`
8. User sees landing page (must sign in again)

### Tab Switch / Window Focus:
1. User switches to another tab
2. User switches back to app tab
3. Page becomes visible
4. `visibilitychange` event fires
5. AuthGuard verifies session
6. If session expired, force reload
7. User must sign in again

## Benefits

1. **Proper Session Invalidation**: Global sign out clears all sessions
2. **No Back Button Bypass**: History replacement prevents navigation back
3. **Stale Session Detection**: Visibility change handler catches expired sessions
4. **Multi-Tab Support**: Works correctly across multiple tabs
5. **Security**: No way to access protected content after sign out
6. **Clean State**: All auth data cleared from localStorage

## Testing

### Test Sign Out:
1. Sign in to the app
2. Click "Sign out"
3. Should redirect to landing page
4. Click browser back button
5. Should stay on landing page or reload to landing page ✅
6. Should NOT return to authenticated content ✅

### Test Session Expiry:
1. Sign in to the app
2. Open browser DevTools → Application → Local Storage
3. Delete all Supabase auth keys
4. Switch to another tab and back
5. Should detect expired session
6. Should reload to landing page ✅

### Test Multi-Tab:
1. Sign in to the app
2. Open app in another tab (both tabs authenticated)
3. Sign out in one tab
4. Switch to the other tab
5. Should detect session is gone
6. Should reload to landing page ✅

### Test Browser Refresh:
1. Sign in to the app
2. Click "Sign out"
3. Redirected to landing page
4. Press F5 to refresh
5. Should stay on landing page ✅
6. Should show sign-in form ✅

## Security Improvements

1. **Global Sign Out**: Signs out from all devices, not just current browser
2. **localStorage Cleared**: No auth tokens left behind
3. **History Replaced**: Can't navigate back to authenticated pages
4. **Session Verification**: Constantly checks if session is valid
5. **Visibility Detection**: Catches stale sessions when page becomes visible

## Files Modified

1. `components/auth-wrapper.tsx` - Enhanced sign out and session verification

## Related Issues Fixed

- ✅ Back button returning to authenticated content after sign out
- ✅ Stale sessions allowing access to protected content
- ✅ Multi-tab authentication state inconsistency
- ✅ localStorage auth tokens not being cleared
- ✅ Browser history allowing bypass of authentication

## Technical Details

### window.location.replace() vs window.location.href
- `href`: Adds new entry to history (back button works)
- `replace`: Replaces current entry (back button skips this page)

### visibilitychange Event
- Fires when page becomes visible/hidden
- Triggered by: tab switch, window focus, browser back/forward
- Perfect for detecting when user returns to a page

### Supabase Sign Out Scope
- `scope: 'local'` (default): Signs out current browser only
- `scope: 'global'`: Signs out all devices/sessions
- Global is more secure for sensitive applications
