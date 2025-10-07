# MAX_TOKENS Comprehensive Fix - Root Cause Analysis & Solutions

## Problem Summary

Lesson generation is failing due to three interconnected issues:

1. **MAX_TOKENS_EXCEEDED errors** in vocabulary generation (primary)
2. **Incomplete JSON responses** in grammar generation (secondary)
3. **Variable scope error** in error handler (tertiary)

## Root Cause Analysis

### Issue 1: MAX_TOKENS in Vocabulary Generation

**What's happening:**

- The vocabulary prompt is ~640 tokens
- The AI response hits the MAX_TOKENS limit (likely 1024 or 2048 tokens)
- When MAX_TOKENS is hit, the response is incomplete
- The system throws `MAX_TOKENS_EXCEEDED` error instead of handling partial content

**Why it's happening:**

- The vocabulary prompt is extremely verbose with detailed instructions
- Multiple examples and requirements inflate the prompt size
- The AI tries to generate comprehensive responses that exceed limits
- No token budget management for output

**Evidence from logs:**

```
📊 Estimated input tokens: 640
⚠️ Hit MAX_TOKENS limit, response may be incomplete
❌ API call failed: MAX_TOKENS_EXCEEDED
```

### Issue 2: Incomplete JSON in Grammar Generation

**What's happening:**

- Grammar section receives truncated JSON responses
- First attempt: Only 96 chars of JSON
- Second attempt: 1632 chars but still incomplete at position 1493
- JSON parsing fails, causing section generation to fail

**Why it's happening:**

- Grammar prompt is ~1344 tokens (very large)
- Expected JSON response is complex and lengthy
- MAX_TOKENS cuts off the response mid-JSON
- No graceful handling of partial JSON

**Evidence from logs:**

```
📊 Estimated input tokens: 1344
⚠️ Hit MAX_TOKENS limit, response may be incomplete
⚠️ Extracted partial text (1632 chars) due to MAX_TOKENS
⚠️ JSON parsing failed: Expected ',' or '}' after property value
```

### Issue 3: Variable Scope Error

**What's happening:**

- In the catch block at line 163, `lessonType` is referenced
- But `lessonType` is defined inside the try block
- When error occurs, variable is out of scope

**Evidence from logs:**

```
⨯ ReferenceError: lessonType is not defined
at POST (webpack-internal:///(rsc)/./app/api/generate-lesson/route.ts:163:17)
```

## Solutions

### Solution 1: Reduce Vocabulary Prompt Size & Handle Partial Responses

**Changes needed in `lib/progressive-generator.ts`:**

1. **Simplify the vocabulary prompt** (reduce from ~640 to ~300 tokens)
2. **Accept partial responses** when MAX_TOKENS is hit
3. **Implement token budgeting** for vocabulary generation

**Specific fixes:**

- Remove redundant instructions
- Consolidate examples
- Use more concise language
- Add fallback for partial responses

### Solution 2: Reduce Grammar Prompt Size & Implement Streaming

**Changes needed in `lib/progressive-generator.ts`:**

1. **Drastically simplify grammar prompt** (reduce from ~1344 to ~500 tokens)
2. **Request smaller JSON structure**
3. **Implement response validation with retry logic**
4. **Consider breaking grammar into multiple smaller requests**

**Specific fixes:**

- Remove verbose instructions
- Request concise JSON format
- Add JSON validation before parsing
- Implement graceful degradation

### Solution 3: Fix Variable Scope in Error Handler

**Changes needed in `app/api/generate-lesson/route.ts`:**

1. **Move variable declarations outside try block**
2. **Ensure all variables used in catch are in scope**

### Solution 4: Implement Global Token Budget Management

**New approach:**

- Set maximum output tokens per request (e.g., 800 tokens)
- Monitor cumulative token usage
- Adjust prompt complexity based on available budget
- Implement progressive detail reduction

## Implementation Priority

### Priority 1 (Critical - Blocks all generation):

1. Fix variable scope error in route.ts
2. Reduce vocabulary prompt size by 50%
3. Handle partial vocabulary responses gracefully

### Priority 2 (High - Causes frequent failures):

1. Reduce grammar prompt size by 60%
2. Implement JSON validation before parsing
3. Add retry logic with simplified prompts

### Priority 3 (Medium - Improves reliability):

1. Implement token budget management
2. Add response length monitoring
3. Create adaptive prompt sizing

## Recommended Token Budgets

Based on typical model limits (2048 tokens total):

| Section               | Input Tokens | Output Tokens | Total | Buffer |
| --------------------- | ------------ | ------------- | ----- | ------ |
| Vocabulary (per word) | 200          | 300           | 500   | 25%    |
| Grammar               | 400          | 600           | 1000  | 40%    |
| Reading               | 250          | 400           | 650   | 35%    |
| Discussion            | 300          | 400           | 700   | 30%    |
| Comprehension         | 100          | 200           | 300   | 50%    |

## Testing Strategy

1. **Unit tests** for each prompt generator
2. **Token counting** validation
3. **Partial response handling** tests
4. **End-to-end** lesson generation with various content lengths
5. **Stress testing** with maximum content size

## Success Metrics

- ✅ Zero MAX_TOKENS errors in vocabulary generation
- ✅ Zero JSON parsing errors in grammar generation
- ✅ 100% lesson generation success rate
- ✅ Average generation time < 2 minutes
- ✅ Token usage < 80% of available budget per section

## Next Steps

1. Implement Priority 1 fixes immediately
2. Test with real content
3. Monitor token usage patterns
4. Iterate on prompt optimization
5. Document optimal prompt patterns
