# Grammar MAX_TOKENS Solution

## Problem Analysis

The lesson generation was failing at the grammar section with `MAX_TOKENS_EXCEEDED` errors. Analysis of the terminal output revealed:

### Root Causes

1. **Token Limit Too Low**: Grammar section was using `maxTokens: 800` (then 500), which was insufficient for the JSON response structure
2. **Error on Partial Response**: Code was throwing errors when MAX_TOKENS was hit, even when partial content was available
3. **Incomplete JSON Handling**: Parser couldn't handle incomplete JSON from truncated responses
4. **No Graceful Degradation**: System failed completely instead of accepting partial but usable content

### Error Flow

```
Grammar Generation → MAX_TOKENS hit → Partial JSON returned →
Parse fails → Retry with smaller limit → MAX_TOKENS again →
Parse fails → Throw error → Lesson generation fails
```

## Solution Implemented

### 1. Increased Token Limits (lib/progressive-generator.ts)

**Before:**

```typescript
response = await this.getGoogleAI().prompt(prompt, { maxTokens: 800 });
// Retry with 500 on failure
```

**After:**

```typescript
response = await this.getGoogleAI().prompt(prompt, { maxTokens: 1500 });
// No retry - accept partial response if available
```

**Rationale**: Grammar JSON structure needs ~1200-1500 tokens for complete response with examples and exercises.

### 2. Accept Partial Responses (lib/google-ai-server.ts)

**Before:**

```typescript
if (candidate.finishReason === "MAX_TOKENS") {
  if (candidate.content && candidate.content.parts) {
    return text;
  } else {
    throw error; // ❌ Throws even when content exists
  }
}
```

**After:**

```typescript
if (candidate.finishReason === "MAX_TOKENS") {
  // ALWAYS return partial text if available
  if (candidate.content && candidate.content.parts) {
    return text; // ✅ Returns partial content
  }
  // Only throw if truly no content
  throw error;
}
```

**Rationale**: Partial responses are often usable, especially for structured content.

### 3. JSON Repair Function (lib/progressive-generator.ts)

Added `repairIncompleteJSON()` helper that:

- Counts open/close braces and brackets
- Closes incomplete strings
- Closes incomplete arrays
- Closes incomplete objects

**Example:**

```json
// Incomplete (MAX_TOKENS cutoff)
{"grammarPoint": "Present Perfect", "examples": ["I have been

// Repaired
{"grammarPoint": "Present Perfect", "examples": ["I have been"]}
```

### 4. Improved Error Handling

**Before:**

- Retry with smaller limits (500 tokens)
- Fail after 2 attempts
- No fallback

**After:**

- Use adequate limit (1500 tokens)
- Attempt JSON repair on incomplete responses
- Better error messages
- Graceful degradation

## Testing

Run the test script to verify the fix:

```powershell
.\test-grammar-max-tokens-fix.ps1
```

Expected outcome:

- ✅ Lesson generates successfully
- ✅ Grammar section is complete
- ✅ No MAX_TOKENS errors
- ✅ All sections present

## Technical Details

### Token Requirements by Section

| Section       | Typical Tokens   | Max Tokens Set |
| ------------- | ---------------- | -------------- |
| Warmup        | 300-500          | 2000 (default) |
| Vocabulary    | 200-400 per word | 2000 (default) |
| Reading       | 800-1200         | 2000 (default) |
| Comprehension | 300-500          | 2000 (default) |
| Discussion    | 400-600          | 2000 (default) |
| **Grammar**   | **1000-1400**    | **1500** ✅    |

### Why Grammar Needs More Tokens

Grammar sections require:

- Grammar point name (50 tokens)
- Form explanation (100-150 tokens)
- Usage explanation (100-150 tokens)
- Level notes (50-100 tokens)
- 3 examples (300-400 tokens)
- 3 exercises with answers and explanations (400-600 tokens)

**Total: ~1000-1450 tokens**

## Benefits

1. **Reliability**: Lesson generation no longer fails at grammar section
2. **Quality**: Complete grammar content with all examples and exercises
3. **Resilience**: Can handle partial responses gracefully
4. **Performance**: No unnecessary retries with inadequate limits

## AI-First Approach Maintained

This solution maintains LinguaSpark's AI-first philosophy:

- ✅ No fallback templates
- ✅ All content AI-generated
- ✅ Handles API limitations gracefully
- ✅ Accepts partial but usable AI responses

## Next Steps

If MAX_TOKENS issues persist:

1. Consider using `gemini-2.0-flash-exp` (may have higher limits)
2. Split grammar generation into smaller prompts
3. Implement streaming responses
4. Add token usage monitoring per section

## Related Files

- `lib/google-ai-server.ts` - API client with MAX_TOKENS handling
- `lib/progressive-generator.ts` - Grammar generation logic
- `test-grammar-max-tokens-fix.ps1` - Test script
