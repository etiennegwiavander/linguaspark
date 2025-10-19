# Final MAX_TOKENS Fix - Complete Solution

## Problem

The retry logic wasn't working because:
1. Title generation uses `maxTokens: 60`
2. Retry condition was `if (maxTokens > 100)` 
3. Since 60 < 100, it never retried
4. Result: Immediate failure with `MAX_TOKENS_EXCEEDED_NO_CONTENT`

## The Fix

### Changed Retry Logic

**Before (Broken):**
```typescript
if (options.maxTokens && options.maxTokens > 100) {
  // Retry with half
  return await this.prompt(promptText, { maxTokens: maxTokens / 2 });
}
// Throw error - NO RETRY for values < 100
```

**After (Fixed):**
```typescript
// Retry if maxTokens > 20
if (options.maxTokens && options.maxTokens > 20) {
  const reducedTokens = Math.max(20, Math.floor(options.maxTokens / 2));
  return await this.prompt(promptText, { maxTokens: reducedTokens });
}

// If maxTokens <= 20, try without limit (use default 8000)
if (options.maxTokens && options.maxTokens <= 20) {
  return await this.prompt(promptText, { maxTokens: undefined });
}

// Only throw if truly can't retry
throw error;
```

## How It Works Now

### Scenario 1: Title Generation (maxTokens: 60)

1. **First attempt:** `maxTokens: 60` → MAX_TOKENS with no content
2. **Retry 1:** `maxTokens: 30` (60 / 2)
3. **Retry 2:** `maxTokens: 20` (30 / 2, but clamped to minimum 20)
4. **Retry 3:** `maxTokens: undefined` (use default 8000)
5. **Success:** Returns generated title

### Scenario 2: Already Low maxTokens (maxTokens: 30)

1. **First attempt:** `maxTokens: 30` → MAX_TOKENS with no content
2. **Retry 1:** `maxTokens: 20` (30 / 2, clamped to 20)
3. **Retry 2:** `maxTokens: undefined` (use default 8000)
4. **Success:** Returns content

### Scenario 3: Very Low maxTokens (maxTokens: 15)

1. **First attempt:** `maxTokens: 15` → MAX_TOKENS with no content
2. **Retry 1:** `maxTokens: undefined` (skip to unlimited since 15 < 20)
3. **Success:** Returns content

## Why This Works

### The Root Cause

The Google AI API has a bug where:
- If `maxTokens` is set too low for the prompt
- It returns `finishReason: "MAX_TOKENS"` immediately
- But `content.parts` is missing or empty
- No actual content is generated

### The Solution

By progressively:
1. **Reducing maxTokens** - Forces API to work within constraints
2. **Removing maxTokens limit** - Lets API use default (8000 tokens)
3. **Multiple retries** - Ensures we eventually get content

## Testing

### Test Case 1: Title Generation

```typescript
// This should now work
const title = await generateLessonTitle(longText, 'discussion', 'B2')
// Expected: Returns a title after 1-3 retries
```

### Expected Console Output

```
🎯 Generating Engoo-style lesson title...
🌐 API Request [req_xxx] - Attempt 1/4
⚠️ Hit MAX_TOKENS limit, response may be incomplete
⚠️ MAX_TOKENS hit with no content - retrying with reduced token limit
🔄 Retrying with maxTokens: 30
🌐 API Request [req_yyy] - Attempt 1/4
✅ Generated text (45 chars) in 2500ms
🤖 AI generated Engoo-style title: Climate Change Solutions
✅ Using Engoo-style title: Climate Change Solutions
```

## Files Changed

- ✅ `lib/google-ai-server.ts` - Fixed retry logic with lower threshold and unlimited fallback

## Key Changes

1. **Lower retry threshold:** `> 100` → `> 20`
2. **Minimum clamp:** Ensures `maxTokens` never goes below 20 during retry
3. **Unlimited fallback:** If still failing at 20, try without limit
4. **Progressive degradation:** Gracefully handles all token limit scenarios

## Status

🔧 **Fix Applied** - Ready for final testing

## Next Steps

1. Test lesson generation
2. Verify title generates successfully
3. Check console for retry messages
4. Confirm no MAX_TOKENS errors

## Expected Result

✅ **Lesson generation should work reliably now, even with low maxTokens values**

---

## Rollback

If needed:
```powershell
git checkout HEAD -- lib/google-ai-server.ts
```

## Summary

**Problem:** Retry threshold too high (100), title uses 60  
**Solution:** Lower threshold to 20, add unlimited fallback  
**Result:** Reliable lesson generation with automatic retry
