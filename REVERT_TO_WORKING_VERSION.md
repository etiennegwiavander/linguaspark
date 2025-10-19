# Revert to Working Version - Instructions

## Problem

Lesson generation is failing with **500 Internal Server Error** because Phase 1 integration added too much complexity to `lesson-generator.tsx`.

## Root Cause

The working version (commit `b11754f8`) was **simple and clean** (200 lines).  
The current version is **complex and broken** (600+ lines) with:
- Multiple useEffect hooks causing dependency issues
- Complex state management with extraction configs
- LessonInterfaceBridge integration causing async issues
- Over-engineered UI with extraction metadata cards

## Solution

**Revert to the working version with ONLY a minimal storage key fix.**

---

## Step-by-Step Fix

### Step 1: Backup Current Version

```powershell
# Already done - current version is in components/lesson-generator.tsx
```

### Step 2: Replace with Fixed Version

```powershell
# Copy the fixed version over the current one
Copy-Item components/lesson-generator-FIXED.tsx components/lesson-generator.tsx -Force
```

### Step 3: Test Lesson Generation

1. Open the app: `http://localhost:3000`
2. Paste some text into the content field
3. Select lesson type, level, and language
4. Click "Generate AI Lesson"
5. **Expected:** Lesson generates successfully (200 OK)

### Step 4: Test Extraction Flow

1. Open a webpage with content
2. Click Sparky button (if using extension)
3. Content should be extracted
4. Click "Generate AI Lesson"
5. **Expected:** Lesson generates successfully with enhanced metadata

---

## What Changed in the Fix

### Removed (Causing Issues):

❌ Complex useEffect hooks  
❌ LessonInterfaceBridge integration  
❌ extractionConfig state management  
❌ Extraction Information Card UI  
❌ Complex error handling for storage  
❌ Diagnostic logging everywhere  
❌ Enhanced lesson object manipulation  

### Kept (Essential):

✅ Simple state management  
✅ Basic validation  
✅ API call to `/api/generate-lesson`  
✅ Error handling for API responses  
✅ Progress indicators  

### Added (Minimal Fix):

✅ Support for both storage keys: `lessonConfiguration` (new) and `enhancedContent` (old)  
✅ Graceful fallback if storage is unavailable  

---

## The Minimal Storage Key Fix

**This is the ONLY change from the working version:**

```typescript
// OLD (Working version - b11754f8)
let enhancedContent = null
if (typeof window !== "undefined" && window.chrome?.storage) {
  const result = await new Promise((resolve) => {
    window.chrome.storage.local.get(["enhancedContent"], resolve)
  })
  enhancedContent = result.enhancedContent
}

// NEW (Fixed version - supports Phase 1)
let enhancedContent = null
if (typeof window !== "undefined" && window.chrome?.storage) {
  const result = await new Promise((resolve) => {
    window.chrome.storage.local.get(["lessonConfiguration", "enhancedContent"], resolve)
  })
  
  // Prefer new Phase 1 structure, fallback to old structure
  if (result.lessonConfiguration?.metadata) {
    enhancedContent = {
      metadata: result.lessonConfiguration.metadata,
      structuredContent: {},
      wordCount: result.lessonConfiguration.metadata.wordCount,
      readingTime: result.lessonConfiguration.metadata.readingTime
    }
  } else if (result.enhancedContent) {
    enhancedContent = result.enhancedContent
  }
}
```

**That's it. Nothing else changed.**

---

## Comparison

### Working Version (b11754f8)
- **Lines of code:** ~200
- **State variables:** 8
- **useEffect hooks:** 0
- **Imports:** 3 libraries
- **Complexity:** Low
- **Status:** ✅ Works perfectly

### Broken Version (Current)
- **Lines of code:** ~600
- **State variables:** 12
- **useEffect hooks:** 2 (with complex dependencies)
- **Imports:** 5 libraries + types
- **Complexity:** High
- **Status:** ❌ 500 Internal Server Error

### Fixed Version (lesson-generator-FIXED.tsx)
- **Lines of code:** ~210
- **State variables:** 8
- **useEffect hooks:** 0
- **Imports:** 3 libraries
- **Complexity:** Low
- **Status:** ✅ Should work perfectly

---

## Why This Fix Works

### 1. Removes useEffect Complexity

The broken version had useEffect hooks with overlapping dependencies:

```typescript
useEffect(() => {
  // Sets selectedText, lessonType, studentLevel
}, [initialText, sourceUrl, lessonType, studentLevel, targetLanguage])
```

This creates infinite re-render loops because it depends on variables it modifies.

**Fixed:** No useEffect hooks. Simple, direct state management.

### 2. Removes Async Integration Issues

The broken version called async functions in useEffect:

```typescript
useEffect(() => {
  const checkExtractionSource = async () => {
    const isExtraction = await LessonInterfaceBridge.isExtractionSource()
    // ... more async calls ...
  }
  checkExtractionSource()
}, [hasAppliedInitialValues])
```

If these async calls fail or return unexpected data, the entire component breaks.

**Fixed:** No async calls in component initialization. Only in the button click handler.

### 3. Removes Complex State Management

The broken version had 4 extra state variables for extraction:

```typescript
const [isExtractionSource, setIsExtractionSource] = useState(false)
const [extractionConfig, setExtractionConfig] = useState<LessonPreConfiguration | null>(null)
const [showExtractionInfo, setShowExtractionInfo] = useState(false)
const [hasAppliedInitialValues, setHasAppliedInitialValues] = useState(false)
```

These create complex state interactions and race conditions.

**Fixed:** Only the essential 8 state variables from the working version.

### 4. Removes UI Complexity

The broken version had a 200+ line Extraction Information Card with complex conditional rendering.

**Fixed:** Simple, clean UI with just the essential form fields.

---

## Testing Checklist

After applying the fix:

- [ ] **Manual Entry Test**
  1. Open app
  2. Paste text
  3. Select type, level, language
  4. Click "Generate AI Lesson"
  5. **Expected:** Lesson generates successfully

- [ ] **Extraction Test** (if using extension)
  1. Open webpage
  2. Click Sparky button
  3. Content extracted
  4. Click "Generate AI Lesson"
  5. **Expected:** Lesson generates with metadata

- [ ] **Console Check**
  1. Open browser console (F12)
  2. Look for errors
  3. **Expected:** No errors

- [ ] **API Response Check**
  1. Open Network tab
  2. Generate lesson
  3. Check `/api/generate-lesson` response
  4. **Expected:** 200 OK, not 500

- [ ] **Lesson Display Check**
  1. After generation
  2. Check lesson structure
  3. **Expected:** All sections present and formatted correctly

---

## If Still Failing

If lesson generation still fails after applying this fix, the issue is NOT in `lesson-generator.tsx`.

Check these files instead:

1. **`app/api/generate-lesson/route.ts`** - API route handler
2. **`lib/lesson-ai-generator-server.ts`** - AI generation logic
3. **`lib/google-ai-server.ts`** - Google AI API integration

Look for:
- Changes in request body structure
- Changes in validation logic
- Changes in AI prompts or token limits
- Changes in error handling

---

## Rollback Plan

If the fix doesn't work, you can always revert to the exact working commit:

```powershell
# Revert just the lesson-generator.tsx file
git checkout b11754f837295ef17698c21127975570157937a2 -- components/lesson-generator.tsx
```

---

## Summary

**Problem:** Over-engineering broke lesson generation  
**Solution:** Revert to simple working version + minimal storage key fix  
**Result:** Lesson generation should work again  

**Key Lesson:** Keep it simple. The working version was 200 lines and perfect. Don't over-engineer.

---

## Next Steps

1. Apply the fix (copy lesson-generator-FIXED.tsx)
2. Test lesson generation
3. If it works, commit the fix
4. If it doesn't work, check the API route and server-side logic
5. Report back with console logs and error messages

**Status:** 🔧 Fix ready to apply
