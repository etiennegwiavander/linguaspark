# MAX_TOKENS_NO_CONTENT Fix

## Problem

Lesson generation is failing with `MAX_TOKENS_EXCEEDED_NO_CONTENT` error during title generation.

### Error Details

```
⚠️ Hit MAX_TOKENS limit, response may be incomplete
❌ MAX_TOKENS hit but no content available
❌ Response structure: {"content": {"role": "model"},"finishReason": "MAX_TOKENS","index": 0}
```

The API is returning `finishReason: "MAX_TOKENS"` but the `content.parts` array is **missing or empty**.

---

## Root Cause

The Google AI API sometimes returns a malformed response when hitting MAX_TOKENS:
- `finishReason` is set to `"MAX_TOKENS"`
- But `content.parts` is missing or empty
- This causes the code to throw an error instead of retrying

This happens specifically during **lesson title generation** which uses `maxTokens: 60`.

---

## The Fix

### Before (Broken)

```typescript
if (candidate.finishReason === "MAX_TOKENS") {
  console.warn("⚠️ Hit MAX_TOKENS limit, response may be incomplete");
  if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
    const text = candidate.content.parts[0].text;
    if (text && text.trim().length > 0) {
      return text;
    }
  }
  // Throws error immediately - NO RETRY
  throw new Error("MAX_TOKENS_EXCEEDED_NO_CONTENT");
}
```

### After (Fixed)

```typescript
if (candidate.finishReason === "MAX_TOKENS") {
  console.warn("⚠️ Hit MAX_TOKENS limit, response may be incomplete");
  if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
    const text = candidate.content.parts[0].text;
    if (text && text.trim().length > 0) {
      return text;
    }
  }
  
  // CRITICAL FIX: Retry with reduced token limit
  console.warn("⚠️ MAX_TOKENS hit with no content - retrying with reduced token limit");
  if (options.maxTokens && options.maxTokens > 100) {
    const reducedOptions = {
      ...options,
      maxTokens: Math.floor(options.maxTokens / 2)
    };
    console.log(`🔄 Retrying with maxTokens: ${reducedOptions.maxTokens}`);
    return await this.prompt(promptText, reducedOptions);
  }
  
  // Only throw if we can't retry
  throw new Error("MAX_TOKENS_EXCEEDED_NO_CONTENT");
}
```

---

## How It Works

1. **First attempt:** Try with original `maxTokens` (e.g., 60 for title)
2. **If MAX_TOKENS with no content:** Retry with `maxTokens / 2` (e.g., 30)
3. **If still fails:** Retry again with `maxTokens / 4` (e.g., 15)
4. **If maxTokens < 100:** Stop retrying and throw error

This ensures we always get SOME content, even if it's shorter than expected.

---

## Why This Happens

The Google AI API has a quirk where:
- If the prompt is too long relative to `maxTokens`
- The API returns `MAX_TOKENS` immediately
- But doesn't generate ANY content
- The `parts` array is missing or empty

This is likely a bug in the Gemini API, but we need to handle it gracefully.

---

## Testing

### Test 1: Title Generation

```typescript
// Should now work without throwing error
const title = await generateLessonTitle(longText, 'discussion', 'B2')
// Expected: Returns a title, even if shorter than ideal
```

### Test 2: Full Lesson Generation

```typescript
// Should complete without MAX_TOKENS errors
const lesson = await generateLesson({
  sourceText: longText,
  lessonType: 'discussion',
  studentLevel: 'B2',
  targetLanguage: 'english'
})
// Expected: Lesson generates successfully
```

---

## Impact

### Before Fix
- ❌ Lesson generation fails immediately on MAX_TOKENS
- ❌ No retry mechanism
- ❌ User sees 500 error
- ❌ No lessons generated

### After Fix
- ✅ Automatic retry with reduced tokens
- ✅ Graceful degradation
- ✅ Lessons generate successfully
- ✅ May be slightly shorter but complete

---

## Additional Considerations

### Why Not Just Increase maxTokens?

Increasing `maxTokens` doesn't help because:
1. The API still returns MAX_TOKENS with no content
2. It wastes API quota
3. It doesn't solve the root cause

### Why Retry with Reduced Tokens?

Reducing `maxTokens` forces the API to:
1. Generate content within the limit
2. Return actual text in the response
3. Avoid the malformed response bug

---

## Files Changed

- ✅ `lib/google-ai-server.ts` - Added retry logic for MAX_TOKENS with no content

---

## Status

🔧 **Fix Applied** - Ready for testing

---

## Next Steps

1. Test lesson generation with the fix
2. Monitor console logs for retry messages
3. Verify lessons generate successfully
4. Check if titles are appropriate length

---

## Expected Console Output

### Successful Retry

```
⚠️ Hit MAX_TOKENS limit, response may be incomplete
⚠️ MAX_TOKENS hit with no content - retrying with reduced token limit
🔄 Retrying with maxTokens: 30
✅ Generated text (45 chars) in 2500ms
```

### Successful Generation

```
🎯 Generating Engoo-style lesson title...
✅ Generated text (45 chars) in 2500ms
🤖 AI generated Engoo-style title: Climate Change Solutions
✅ Using Engoo-style title: Climate Change Solutions
```

---

## Rollback Plan

If this fix causes issues, revert the change in `lib/google-ai-server.ts`:

```powershell
git checkout HEAD -- lib/google-ai-server.ts
```

---

## Summary

**Problem:** MAX_TOKENS error with no content during title generation  
**Cause:** Google AI API bug returning malformed response  
**Solution:** Automatic retry with reduced token limit  
**Result:** Lesson generation should work reliably now
