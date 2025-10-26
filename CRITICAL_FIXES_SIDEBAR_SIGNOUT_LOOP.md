# Critical Fixes: Sidebar, Sign Out, and Infinite Loop

## Issues Fixed

### 1. Mobile Sidebar Expands on Reload ✅
**File**: `components/lesson-display.tsx`

**Problem**: Sidebar defaulted to expanded (`false`) on mobile, showing immediately on page load

**Solution**: Changed initial state to collapsed (`true`)
```typescript
const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true) // Start collapsed on mobile
```

**Result**: Sidebar now starts hidden on mobile, user must tap toggle button to open it

---

### 2. Sign Out Button Doesn't Work ✅
**File**: `components/auth-wrapper.tsx`

**Problem**: Sign out was calling `supabase.auth.signOut()` but not redirecting or clearing state properly

**Solution**: Added explicit state clearing and redirect after sign out
```typescript
const signOut = async () => {
  console.log('[AuthWrapper] Starting sign out...')
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('[AuthWrapper] Sign out error:', error)
    throw error
  }
  console.log('[AuthWrapper] Sign out successful, clearing state...')
  // Clear user state immediately
  setUser(null)
  // Redirect to home page
  window.location.href = '/'
}
```

**Result**: 
- User state cleared immediately
- Redirects to home page (landing page)
- Shows sign-in form for unauthenticated users

---

### 3. Fast Refresh Infinite Loop ✅
**File**: `components/lesson-generator.tsx`

**Problem**: useEffect had state setters in the effect body AND those same states in the dependency array, causing infinite loop:
1. Effect runs
2. Sets `lessonType`, `studentLevel`, `targetLanguage`
3. Dependencies change
4. Effect runs again
5. Loop continues forever

**Original Code**:
```typescript
useEffect(() => {
  if (initialText && initialText !== selectedText) {
    setSelectedText(initialText)
    
    if (urlType && !lessonType) {
      setLessonType(urlType)  // ❌ Sets lessonType
    }
    
    if (urlLevel && !studentLevel) {
      setStudentLevel(urlLevel)  // ❌ Sets studentLevel
    }
    
    if (!targetLanguage) {
      setTargetLanguage("english")  // ❌ Sets targetLanguage
    }
  }
}, [initialText, sourceUrl, lessonType, studentLevel, targetLanguage])  // ❌ Depends on what it sets!
```

**Solution**: Removed state setters from dependency array
```typescript
useEffect(() => {
  // ... same logic ...
  // Only depend on initialText and sourceUrl to avoid infinite loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [initialText, sourceUrl])  // ✅ Only external dependencies
```

**Additional Fix**: Second useEffect should only run once on mount
```typescript
useEffect(() => {
  const checkExtractionSource = async () => {
    // ... extraction logic ...
  }
  checkExtractionSource()
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])  // ✅ Empty array = run once on mount
```

**Result**: No more infinite re-renders, Fast Refresh completes normally

---

### 4. Workspace Sidebar useEffect Warning ✅
**File**: `components/workspace-sidebar.tsx`

**Problem**: useEffect missing function in dependency array (React warning)

**Solution**: Added eslint disable comment since the function doesn't need to be in deps
```typescript
useEffect(() => {
  if (expandedSections.history && lessonHistory.length === 0) {
    loadLessonHistory()
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [expandedSections.history])
```

---

## Testing

### Test Mobile Sidebar:
1. Open app on mobile (< 1024px width)
2. Sidebar should be hidden by default
3. Toggle button at top-left should show ChevronRight
4. Tap button to open sidebar
5. Reload page - sidebar should be hidden again ✅

### Test Sign Out:
1. Sign in to the app
2. Click "Sign out" button in header
3. Should see console logs: "Starting sign out..." → "Sign out successful..."
4. Should redirect to home page (/)
5. Should show landing page or sign-in form ✅

### Test No More Loops:
1. Open browser console
2. Load the app
3. Should see normal Fast Refresh messages
4. Should NOT see repeated "[Fast Refresh] rebuilding" messages
5. App should be stable and responsive ✅

---

## Root Cause Analysis

### Infinite Loop Cause:
The classic React anti-pattern: **useEffect that modifies its own dependencies**

```
Effect runs → Sets state → Dependencies change → Effect runs → Sets state → ...
```

This is why React's exhaustive-deps rule exists - to catch these issues!

### Prevention:
- Only include **external** values in dependency arrays
- If you're setting state inside useEffect, don't depend on that state
- Use eslint-disable comments carefully and document why
- Consider using `useRef` for values that shouldn't trigger re-renders

---

## Files Modified

1. `components/lesson-display.tsx` - Mobile sidebar default state
2. `components/auth-wrapper.tsx` - Sign out with redirect
3. `components/lesson-generator.tsx` - Fixed infinite loop in useEffect
4. `components/workspace-sidebar.tsx` - Fixed useEffect warning

---

## Impact

- **Mobile UX**: Sidebar no longer blocks content on page load
- **Authentication**: Sign out now works properly with redirect
- **Performance**: No more infinite re-renders consuming CPU/memory
- **Developer Experience**: No more console spam from Fast Refresh
