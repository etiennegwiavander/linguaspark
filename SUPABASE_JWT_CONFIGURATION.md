# Supabase JWT Token Configuration

## Problem
JWT tokens expire quickly (default is 1 hour), causing authentication issues.

## Solution: Increase JWT Expiry Time

### Step 1: Update Supabase Project Settings

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **Auth**
4. Scroll to **JWT Settings**
5. Find **JWT expiry limit**
6. Change from `3600` (1 hour) to `86400` (24 hours) or higher
7. Click **Save**

### Step 2: Enable Auto Token Refresh

The Supabase client is now configured to automatically refresh tokens before they expire. This is handled in `lib/supabase.ts`:

```typescript
auth: {
  persistSession: true,
  autoRefreshToken: true,  // Automatically refresh before expiry
  detectSessionInUrl: true,
  flowType: 'pkce',
}
```

### Step 3: Monitor Token Refresh

Check the browser console for these messages:
- `[Supabase] Token refreshed successfully` - Token was auto-refreshed
- `[Supabase] Auth state changed: TOKEN_REFRESHED` - Refresh event fired

### Recommended JWT Expiry Times

- **Development**: 86400 seconds (24 hours)
- **Production**: 3600-7200 seconds (1-2 hours) with auto-refresh enabled

### Alternative: Use Refresh Tokens

Supabase automatically handles refresh tokens. The client will:
1. Store the refresh token in localStorage
2. Use it to get a new access token before the current one expires
3. Update the session automatically

### Troubleshooting

If tokens still expire:
1. Check that `autoRefreshToken: true` is set
2. Verify the refresh token is stored in localStorage
3. Check browser console for refresh errors
4. Ensure the Supabase project allows token refresh

### Manual Token Refresh

If needed, you can manually refresh the token:

```typescript
const { data, error } = await supabase.auth.refreshSession()
if (error) {
  console.error('Failed to refresh session:', error)
} else {
  console.log('Session refreshed successfully')
}
```

## Current Configuration

The app is now configured to:
- ✅ Auto-refresh tokens before expiry
- ✅ Persist sessions in localStorage
- ✅ Detect sessions from URL (for OAuth flows)
- ✅ Use PKCE flow for enhanced security
- ✅ Monitor auth state changes

## Next Steps

1. Update JWT expiry in Supabase dashboard (recommended: 24 hours for dev)
2. Test that tokens refresh automatically
3. Monitor console for refresh events
4. Sign out and sign back in to get a fresh token with new expiry time
