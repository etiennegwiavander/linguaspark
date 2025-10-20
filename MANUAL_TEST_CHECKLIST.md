# Manual Testing Checklist

Quick reference checklist for manual testing of progress tracking and markdown stripping features.

## Pre-Testing Setup

- [ ] Development server running (`npm run dev`)
- [ ] Chrome extension loaded (if testing extraction)
- [ ] Valid API key configured in `.env.local`
- [ ] Browser DevTools ready for network testing

---

## Progress Tracking Tests

### Visual Verification
- [ ] Progress bar appears when generation starts
- [ ] Progress percentage updates smoothly
- [ ] Current section name displays correctly
- [ ] Progress reaches 100% on completion
- [ ] No progress bar jumps or resets

### Different Lesson Types
- [ ] Discussion lesson progress accurate
- [ ] Grammar lesson progress accurate
- [ ] Pronunciation lesson progress accurate
- [ ] Travel lesson progress accurate
- [ ] Business lesson progress accurate

### Slow Network Conditions
- [ ] Progress updates with "Slow 3G" throttling
- [ ] UI remains responsive
- [ ] No lost progress events
- [ ] Error handling works on timeout

### Error State Handling
- [ ] Progress shows active phase on error
- [ ] Error message includes progress context
- [ ] Progress preserved on failure

---

## Markdown Stripping Tests

### Word Export Inspection

#### All Sections Checked
- [ ] Lesson title - no markdown
- [ ] Warmup questions - no markdown
- [ ] Vocabulary (words, meanings, examples) - no markdown
- [ ] Reading passage - no markdown
- [ ] Comprehension questions - no markdown
- [ ] Discussion questions - no markdown
- [ ] Dialogue (if present) - no markdown
- [ ] Grammar (if present) - no markdown
- [ ] Pronunciation (if present) - no markdown
- [ ] Wrap-up questions - no markdown

#### Markdown Patterns Tested
- [ ] `**bold**` syntax removed
- [ ] `__bold__` syntax removed
- [ ] `*italic*` syntax removed
- [ ] `_italic_` syntax removed
- [ ] Nested markdown handled
- [ ] Multiple markdown in one line handled

### Professional Appearance
- [ ] Typography consistent throughout
- [ ] Spacing appropriate between sections
- [ ] Headings clearly distinguished
- [ ] Text readable and well-formatted
- [ ] No formatting artifacts
- [ ] Document looks professional

### PDF/Word Consistency
- [ ] Both formats have identical text
- [ ] Both formats strip markdown consistently
- [ ] Formatting equivalent (accounting for format differences)
- [ ] No markdown visible in either format

---

## Integration Tests

### End-to-End Workflow
- [ ] Content extraction works
- [ ] Progress displays during generation
- [ ] Lesson generates successfully
- [ ] Export completes without errors
- [ ] Word document has no markdown
- [ ] Document looks professional

### Multiple Lesson Types
- [ ] Discussion lesson → Export → Inspect ✓
- [ ] Grammar lesson → Export → Inspect ✓
- [ ] Pronunciation lesson → Export → Inspect ✓
- [ ] Consistency across all exports

---

## Regression Tests

### Existing Functionality
- [ ] Lesson generation without callbacks works
- [ ] PDF export works correctly
- [ ] Non-streaming API routes function
- [ ] All lesson types generate successfully
- [ ] Authentication and storage work
- [ ] Content extraction works
- [ ] UI remains responsive

---

## Test Results

**Progress Tracking**: [ ] Pass / [ ] Fail / [ ] Needs Work

**Markdown Stripping**: [ ] Pass / [ ] Fail / [ ] Needs Work

**Overall Status**: [ ] Approved / [ ] Needs Fixes / [ ] Blocked

---

## Issues Found

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

## Notes

_______________________________________________
_______________________________________________
_______________________________________________

**Tested By**: _________________ **Date**: _________
