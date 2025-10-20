# Manual Testing Guide: Progress Tracking & Markdown Stripping

## Overview
This guide provides step-by-step instructions for manually testing the progress tracking and markdown stripping features implemented in the progress-and-export-improvements spec.

## Test Environment Setup

### Prerequisites
- Chrome browser with LinguaSpark extension loaded
- Development server running (`npm run dev`)
- Valid Google AI API key configured
- Sample web content for extraction

### Starting the Test Environment
```powershell
# Start the development server
npm run dev
```

---

## Part 1: Progress Tracking Manual Tests

### Test 1.1: Visual Verification of Progress UI Updates

**Objective**: Verify that progress updates display correctly in real-time during lesson generation.

**Steps**:
1. Open the LinguaSpark application (http://localhost:3000)
2. Navigate to the lesson generator
3. Select a lesson type (e.g., "Discussion")
4. Select a CEFR level (e.g., "B1")
5. Enter or extract content (minimum 200 words)
6. Click "Generate Lesson"
7. **Observe the progress indicator**

**Expected Results**:
- [ ] Progress bar appears immediately when generation starts
- [ ] Progress percentage updates smoothly (not in large jumps)
- [ ] Current section name is displayed (e.g., "Generating vocabulary", "Generating reading passage")
- [ ] Progress moves through phases in logical order:
  - Warmup (0-10%)
  - Vocabulary (10-25%)
  - Reading (25-45%)
  - Comprehension (45-55%)
  - Discussion (55-65%)
  - Grammar (65-80%)
  - Pronunciation (80-95%)
  - Wrap-up (95-100%)
- [ ] Progress reaches 100% when lesson is complete
- [ ] No progress bar "jumps" or resets during generation

**Notes**:
_Record any observations about progress smoothness, timing, or display issues_

---

### Test 1.2: Progress Tracking with Different Lesson Types

**Objective**: Verify progress tracking works correctly for all lesson types.

**Test Cases**:

#### Test 1.2a: Discussion Lesson
1. Generate a Discussion lesson
2. Verify progress includes: warmup, vocabulary, reading, comprehension, discussion, wrap-up
3. Note the progress percentages for each phase

**Expected**: Progress should reflect the sections included in discussion lessons

#### Test 1.2b: Grammar Lesson
1. Generate a Grammar lesson
2. Verify progress includes: warmup, vocabulary, grammar, wrap-up
3. Note the progress percentages for each phase

**Expected**: Progress should skip sections not included in grammar lessons

#### Test 1.2c: Pronunciation Lesson
1. Generate a Pronunciation lesson
2. Verify progress includes: warmup, vocabulary, pronunciation, wrap-up
3. Note the progress percentages for each phase

**Expected**: Progress should reflect pronunciation-specific sections

**Checklist**:
- [ ] Discussion lesson progress is accurate
- [ ] Grammar lesson progress is accurate
- [ ] Pronunciation lesson progress is accurate
- [ ] Travel lesson progress is accurate
- [ ] Business lesson progress is accurate

---

### Test 1.3: Progress Tracking with Slow Network Conditions

**Objective**: Verify progress tracking remains responsive under slow network conditions.

**Steps**:
1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Select "Slow 3G" from the throttling dropdown
4. Generate a lesson
5. Observe progress updates

**Expected Results**:
- [ ] Progress updates continue to display even with slow network
- [ ] UI remains responsive
- [ ] Progress events are not lost or delayed excessively
- [ ] Error handling works if network times out
- [ ] Progress state is preserved if connection is interrupted

**Notes**:
_Record any issues with progress display under slow network conditions_

---

### Test 1.4: Progress Error State Handling

**Objective**: Verify progress is reported correctly when errors occur.

**Steps**:
1. Generate a lesson with invalid API key (temporarily modify .env.local)
2. Observe progress when error occurs
3. Restore valid API key
4. Generate a lesson with very long content (>10,000 words) to trigger token limit
5. Observe progress when error occurs

**Expected Results**:
- [ ] Progress shows which phase was active when error occurred
- [ ] Error message includes progress context
- [ ] Progress bar doesn't disappear immediately on error
- [ ] User can see how far generation progressed before failure

---

## Part 2: Markdown Stripping Manual Tests

### Test 2.1: Export Lessons and Inspect Word Documents

**Objective**: Verify that Word exports have all markdown syntax removed.

**Steps**:
1. Generate a complete lesson (any type, any level)
2. Wait for generation to complete
3. Click "Export to Word" button
4. Open the downloaded .docx file in Microsoft Word or compatible editor
5. Carefully inspect all sections for markdown syntax

**Inspection Checklist**:

#### Lesson Title
- [ ] No `**bold**` syntax visible
- [ ] No `__bold__` syntax visible
- [ ] No `*italic*` syntax visible
- [ ] No `_italic_` syntax visible

#### Warmup Section
- [ ] Questions have no markdown syntax
- [ ] Instructions have no markdown syntax

#### Vocabulary Section
- [ ] Vocabulary words have no markdown syntax
- [ ] Meanings have no markdown syntax
- [ ] Example sentences have no markdown syntax
- [ ] Vocabulary words are still emphasized (but not with markdown)

#### Reading Passage
- [ ] All paragraphs have no markdown syntax
- [ ] Text flows naturally without formatting markers
- [ ] Vocabulary words are emphasized without markdown

#### Comprehension Questions
- [ ] All questions have no markdown syntax
- [ ] Answer options (if present) have no markdown syntax

#### Discussion Questions
- [ ] All questions have no markdown syntax
- [ ] Follow-up prompts have no markdown syntax

#### Dialogue Section (if present)
- [ ] Character names have no markdown syntax
- [ ] Dialogue lines have no markdown syntax
- [ ] Stage directions have no markdown syntax

#### Grammar Section (if present)
- [ ] Grammar focus has no markdown syntax
- [ ] Examples have no markdown syntax
- [ ] Exercises have no markdown syntax

#### Pronunciation Section (if present)
- [ ] Words have no markdown syntax
- [ ] IPA transcriptions have no markdown syntax
- [ ] Practice sentences have no markdown syntax
- [ ] Tips have no markdown syntax

#### Wrap-up Section
- [ ] Questions have no markdown syntax
- [ ] Instructions have no markdown syntax

---

### Test 2.2: Verify Professional Appearance of Exports

**Objective**: Confirm that Word exports look professional and polished.

**Steps**:
1. Open the exported Word document
2. Review overall appearance and formatting
3. Check for consistency across sections

**Quality Checklist**:
- [ ] Typography is consistent throughout
- [ ] Spacing between sections is appropriate
- [ ] Headings are clearly distinguished
- [ ] Text is readable and well-formatted
- [ ] No formatting artifacts or glitches
- [ ] Vocabulary emphasis is visible but subtle
- [ ] Document looks professional and ready to use
- [ ] No visible markdown syntax anywhere

**Notes**:
_Record any formatting issues or areas for improvement_

---

### Test 2.3: Compare PDF and Word Export Consistency

**Objective**: Verify that PDF and Word exports handle markdown identically.

**Steps**:
1. Generate a lesson with rich markdown content
2. Export to PDF
3. Export to Word
4. Open both files side-by-side
5. Compare content across all sections

**Comparison Checklist**:
- [ ] Both formats have identical text content
- [ ] Both formats have markdown stripped consistently
- [ ] Vocabulary emphasis appears in both formats
- [ ] Formatting is equivalent (accounting for format differences)
- [ ] No markdown visible in either format

---

### Test 2.4: Test with Various Markdown Patterns

**Objective**: Verify markdown stripping handles edge cases and complex patterns.

**Test Cases**:

#### Test 2.4a: Nested Markdown
Generate a lesson and look for content with nested markdown like:
- `**bold with *italic* inside**`
- `*italic with **bold** inside*`

**Expected**: All markdown syntax removed, text preserved

#### Test 2.4b: Multiple Markdown in One Line
Look for content like:
- `**word1** and **word2** are important`
- `Use *this* and *that* carefully`

**Expected**: All markdown syntax removed, text preserved

#### Test 2.4c: Markdown at Line Boundaries
Look for content like:
- `**Start of line`
- `End of line**`

**Expected**: Markdown handled correctly even at boundaries

**Checklist**:
- [ ] Nested markdown is fully stripped
- [ ] Multiple markdown instances in one line are handled
- [ ] Markdown at line boundaries is handled
- [ ] Malformed markdown doesn't break export
- [ ] Empty markdown (`****` or `**`) is handled gracefully

---

## Part 3: Integration Testing

### Test 3.1: End-to-End Workflow

**Objective**: Test the complete workflow from content extraction to export.

**Steps**:
1. Open a webpage with the Chrome extension
2. Click the Sparky floating button
3. Extract content from the page
4. Confirm extraction
5. Generate a lesson (observe progress)
6. Wait for completion
7. Export to Word
8. Inspect the Word document

**Expected Results**:
- [ ] Content extraction works smoothly
- [ ] Progress tracking displays during generation
- [ ] Lesson generates successfully
- [ ] Export completes without errors
- [ ] Word document has no markdown syntax
- [ ] Document looks professional

---

### Test 3.2: Multiple Lesson Types in Sequence

**Objective**: Verify consistency across multiple lesson generations.

**Steps**:
1. Generate a Discussion lesson → Export to Word → Inspect
2. Generate a Grammar lesson → Export to Word → Inspect
3. Generate a Pronunciation lesson → Export to Word → Inspect
4. Compare all three exports

**Expected Results**:
- [ ] Progress tracking works for all lesson types
- [ ] All exports have markdown stripped
- [ ] Formatting is consistent across lesson types
- [ ] No degradation in quality across multiple generations

---

## Part 4: Regression Testing

### Test 4.1: Verify Existing Functionality

**Objective**: Ensure new features didn't break existing functionality.

**Checklist**:
- [ ] Lesson generation without progress callbacks still works
- [ ] PDF export still works correctly
- [ ] Non-streaming API routes still function
- [ ] All lesson types generate successfully
- [ ] Authentication and lesson storage work
- [ ] Content extraction from extension works
- [ ] UI remains responsive throughout

---

## Test Results Summary

### Progress Tracking Results

**Overall Assessment**: [ ] Pass / [ ] Fail / [ ] Needs Improvement

**Issues Found**:
1. 
2. 
3. 

**Recommendations**:
1. 
2. 
3. 

---

### Markdown Stripping Results

**Overall Assessment**: [ ] Pass / [ ] Fail / [ ] Needs Improvement

**Issues Found**:
1. 
2. 
3. 

**Recommendations**:
1. 
2. 
3. 

---

## Sign-off

**Tester Name**: _________________
**Date**: _________________
**Build Version**: _________________

**Overall Status**: [ ] Approved for Production / [ ] Needs Fixes / [ ] Blocked

**Additional Notes**:
_Use this space for any additional observations or recommendations_

