# Final Fix Plan - Markdown & Progress

## Current Status
- ✅ PDF export: Markdown stripping DONE (in `addText` function)
- ⚠️ Word export: Need to apply `stripMarkdown()` to ~30 text fields
- ⚠️ Progress tracking: Currently using fake 500ms delays

## Option A: Safe & Quick (RECOMMENDED)
**What:** Fix markdown only, keep delays but make them more realistic
**Risk:** VERY LOW
**Time:** 10 minutes
**Result:** No asterisks, progress feels better

### Changes:
1. Apply `stripMarkdown()` to all Word export text fields containing user content:
   - Questions (warmup, comprehension, discussion, wrapup)
   - Vocabulary (words, meanings, examples)
   - Reading passage
   - Dialogue lines
   - Grammar examples
   - Pronunciation text

2. Adjust delays in streaming API to be more realistic:
   - Phase 1 steps: 1-2 seconds each (actual AI calls)
   - Phase 2 steps: 2-3 seconds each (more complex generation)
   - Total: ~15-20 seconds of visible progress

## Option B: Proper But Risky
**What:** Real progress callbacks + markdown fix
**Risk:** MEDIUM-HIGH
**Time:** 1-2 hours + testing
**Result:** True real-time progress

### Changes Required:
1. Refactor `lessonAIServerGenerator.generateLesson()` to accept progress callback
2. Add progress emissions at each generation step
3. Update streaming API to use real callbacks
4. Test thoroughly to ensure generation doesn't break
5. Apply markdown stripping

### Risks:
- Callback errors could break generation
- Progress emissions might slow down generation
- Error handling becomes more complex
- Need extensive testing

## My Recommendation

**Do Option A now:**
- Fixes the visible bug (asterisks)
- Makes progress feel more realistic
- Zero risk to generation
- Can be done quickly

**Do Option B later:**
- When you have time for proper testing
- As a separate, dedicated task
- With ability to roll back if needed

## Implementation for Option A

### 1. Markdown Stripping (30 fields)
Apply `stripMarkdown()` wrapper to these text fields:
```typescript
// Before
text: question,
text: item.meaning,
text: line.line,
text: example,

// After  
text: stripMarkdown(question),
text: stripMarkdown(item.meaning),
text: stripMarkdown(line.line),
text: stripMarkdown(example),
```

### 2. Realistic Delays
Update streaming API delays:
```typescript
// Phase 1 - Core structure (lighter AI calls)
await new Promise(resolve => setTimeout(resolve, 1500)) // was 500ms

// Phase 2 - Complex content (heavier AI calls)
await new Promise(resolve => setTimeout(resolve, 2500)) // was 500ms
```

## Your Decision

Which option do you want?
- **A**: Safe markdown fix + better delays (recommended)
- **B**: Full refactor with real callbacks (risky)
- **C**: Just markdown fix, keep current delays

Let me know and I'll proceed accordingly.
