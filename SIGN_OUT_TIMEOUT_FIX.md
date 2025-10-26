# Sign Out Timeout Fix

## Issue
Sign out button was timing out after 3 seconds, showing:
```
[UserMenu] Sign out clicked
[UserMenu] Calling signOut()...
[AuthWrapper] Starting sign out...
[UserMenu] Sign out timeout, forcing reload...
```

The `supabase.auth.signOut()` call was hanging and never completing.

## Root Cause
1. **Supabase API hanging**: The `supabase.auth.signOut()` call was taking too long or not responding
2. **Conflicting timeout logic**: User-menu had its own 3-second timeout that was triggering before auth-wrapper could complete
3. **No timeout protection**: Auth-wrapper had no timeout on the Supabase call

## Solution

### 1. Simplified User Menu ✅
**File**: `components/user-menu.tsx`

Removed the timeout logic and reload handling from user-menu. Let auth-wrapper handle everything:

```typescript
const handleSignOut = async () => {
  console.log('[UserMenu] Sign out clicked')
  setIsSigningOut(true)
  
  try {
    console.log('[UserMenu] Calling signOut()...')
    // signOut in auth-wrapper will handle redirect
    await signOut()
  } catch (error) {
    console.error('[UserMenu] Sign out error:', error)
    // If error, still try to redirect
    window.location.href = '/'
  } finally {
    setIsSigningOut(false)
  }
}
```

**Changes**:
- ❌ Removed 3-second timeout
- ❌ Removed reload logic
- ✅ Simple try-catch with fallback redirect
- ✅ Always clears loading state

### 2. Added Timeout Protection to Auth Wrapper ✅
**File**: `components/auth-wrapper.tsx`

Added 5-second timeout to prevent hanging on Supabase call:

```typescript
const signOut = async () => {
  console.log('[AuthWrapper] Starting sign out...')
  
  try {
    // Add timeout to prevent hanging
    const signOutPromise = supabase.auth.signOut()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Sign out timeout')), 5000)
    )
    
    const { error } = await Promise.race([signOutPromise, timeoutPromise]) as any
    
    if (error) {
      console.error('[AuthWrapper] Sign out error:', error)
      // Don't throw, just continue to redirect
    }
  } catch (error) {
    console.error('[AuthWrapper] Sign out failed or timed out:', error)
    // Continue anyway
  }
  
  console.log('[AuthWrapper] Clearing state and redirecting...')
  // Clear user state immediately
  setUser(null)
  // Redirect to home page
  window.location.href = '/'
}
```

**Key Features**:
- ⏱️ 5-second timeout using `Promise.race()`
- 🛡️ Graceful error handling - doesn't throw
- 🔄 Always clears state and redirects, even on error
- 📝 Better logging for debugging

## How It Works Now

### Success Path:
1. User clicks "Sign out"
2. User-menu calls `signOut()`
3. Auth-wrapper calls `supabase.auth.signOut()` with 5s timeout
4. Supabase responds successfully
5. State cleared: `setUser(null)`
6. Redirect: `window.location.href = '/'`
7. User sees landing page

### Timeout Path:
1. User clicks "Sign out"
2. User-menu calls `signOut()`
3. Auth-wrapper calls `supabase.auth.signOut()` with 5s timeout
4. Supabase doesn't respond within 5 seconds
5. Timeout triggers, caught in try-catch
6. State cleared anyway: `setUser(null)`
7. Redirect anyway: `window.location.href = '/'`
8. User sees landing page (session cleared client-side)

### Error Path:
1. User clicks "Sign out"
2. User-menu calls `signOut()`
3. Auth-wrapper encounters error
4. Error caught and logged
5. State cleared anyway: `setUser(null)`
6. Redirect anyway: `window.location.href = '/'`
7. User sees landing page

## Benefits

1. **Always works**: Even if Supabase API fails, user gets signed out client-side
2. **No hanging**: 5-second timeout prevents indefinite waiting
3. **Better UX**: User sees immediate feedback and redirect
4. **Simpler code**: Single source of truth in auth-wrapper
5. **Graceful degradation**: Handles all error cases

## Testing

### Test Normal Sign Out:
1. Click "Sign out" button
2. Should see console logs:
   - `[UserMenu] Sign out clicked`
   - `[UserMenu] Calling signOut()...`
   - `[AuthWrapper] Starting sign out...`
   - `[AuthWrapper] Clearing state and redirecting...`
3. Should redirect to home page (/)
4. Should show landing page or sign-in form

### Test Slow Network:
1. Open DevTools → Network tab
2. Set throttling to "Slow 3G"
3. Click "Sign out"
4. Should still redirect within 5 seconds
5. May see timeout message in console

### Test Offline:
1. Open DevTools → Network tab
2. Set to "Offline"
3. Click "Sign out"
4. Should timeout after 5 seconds
5. Should still redirect to home page
6. Client-side session cleared

## Files Modified

1. `components/user-menu.tsx` - Simplified sign-out handler
2. `components/auth-wrapper.tsx` - Added timeout protection

## Related Issues

This fix also addresses:
- Sign out button appearing to do nothing
- User stuck in signed-in state
- Infinite loading on sign out
- Network issues preventing sign out
