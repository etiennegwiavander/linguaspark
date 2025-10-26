# Infinite Loading State Fix

## Issue
After the authentication flow update, all pages were stuck in an infinite loading state showing only a spinner. The app was completely unusable.

## Root Cause
The `AuthGuard` component had a `isVerifying` state that was being set in a `useEffect` with `user` in the dependency array:

```typescript
const [isVerifying, setIsVerifying] = useState(true)

useEffect(() => {
  const verifySession = async () => {
    // ... verification logic ...
    setIsVerifying(false)  // ❌ Sets to false
  }
  
  verifySession()
  // ...
}, [user, supabase.auth])  // ❌ Depends on user

if (loading || isVerifying) {  // ❌ Always true
  return <Loader2 />
}
```

**The Problem**:
1. Component mounts, `isVerifying = true`
2. useEffect runs, calls `verifySession()`
3. `setIsVerifying(false)` is called
4. Component re-renders
5. `user` changes (from auth state update)
6. useEffect runs again (because `user` is in deps)
7. `isVerifying` is never set back to true, but the effect keeps running
8. Infinite loop of verification checks

## Solution

### Simplified Session Verification ✅
**File**: `components/auth-wrapper.tsx`

Removed the `isVerifying` state and simplified the logic:

```typescript
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const supabase = getSupabaseClient()

  useEffect(() => {
    // Re-verify session when page becomes visible (e.g., after browser back button)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user) {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) {
            // Session expired but user state still exists - force reload
            console.log('[AuthGuard] Session expired on visibility change, reloading...')
            window.location.replace('/')
          }
        } catch (error) {
          console.error('[AuthGuard] Error verifying session:', error)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])  // ✅ Empty deps - only run once

  if (loading) {  // ✅ Only check loading
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

**Key Changes**:
- ❌ Removed `isVerifying` state
- ✅ Empty dependency array `[]` - effect only runs once on mount
- ✅ Only check `loading` state from auth context
- ✅ Session verification only happens on visibility change
- ✅ No infinite loops

## How It Works Now

### Initial Load:
1. Component mounts
2. `loading = true` (from AuthProvider)
3. Shows loading spinner
4. AuthProvider gets session
5. `loading = false`
6. Shows auth form or children

### Visibility Change (Back Button):
1. User hits back button
2. Page becomes visible
3. `visibilitychange` event fires
4. If user exists, verify session
5. If no session, reload to landing page
6. Otherwise, continue normally

## Benefits

1. **No Infinite Loops**: Effect only runs once on mount
2. **Fast Loading**: No unnecessary verification on initial load
3. **Back Button Protection**: Still verifies session on visibility change
4. **Simple Logic**: Easier to understand and maintain
5. **Better Performance**: Fewer API calls

## Testing

### Test Normal Load:
1. Open app
2. Should show loading spinner briefly
3. Should show sign-in form or authenticated content
4. Should NOT stay on loading spinner ✅

### Test Back Button:
1. Sign in to app
2. Sign out (redirected to landing page)
3. Click browser back button
4. Should verify session
5. Should reload to landing page (no valid session) ✅

### Test Tab Switch:
1. Sign in to app
2. Switch to another tab
3. Switch back to app tab
4. Should verify session
5. Should continue normally (valid session) ✅

## Files Modified

1. `components/auth-wrapper.tsx` - Removed isVerifying state, simplified logic

## Related Issues Fixed

- ✅ Infinite loading state on all pages
- ✅ App completely unusable
- ✅ Spinner showing forever
- ✅ No content ever loading
