# Implementation Plan

## Overview

This implementation plan covers two critical improvements:

1. **Real-Time Progress Tracking**: Replace simulated progress with actual callback-based progress from AI generation
2. **Markdown Stripping in Word Exports**: Systematically remove markdown syntax from all Word export text fields

## Status Summary

- **Progress Tracking**: Partially implemented (simulated delays in streaming API)
- **Markdown Stripping**: Partially implemented (only in PDF exports, incomplete in Word exports)

---

## Phase 1: Progress Callback Infrastructure

- [x] 1. Add progress callback interface and types to progressive generator

  - Define `ProgressCallback` type signature
  - Define `ProgressUpdate` interface with step, progress, phase, and section fields
  - Add optional `onProgress` parameter to `GenerateOptions` interface
  - _Requirements: 2.1, 2.2, 2.5_

- [x] 2. Implement phase weight configuration for proportional progress

  - Create `PhaseWeights` interface and `DEFAULT_PHASE_WEIGHTS` constant
  - Implement progress calculation logic based on phase weights
  - Handle different lesson types with varying section combinations
  - _Requirements: 2.6, 1.5_

- [x] 3. Add safe callback wrapper for error isolation

  - Implement `safeProgressCallback` function to catch callback errors
  - Ensure callback failures don't break generation process
  - Add error logging for callback failures
  - _Requirements: 2.4, 5.4_

- [x] 4. Integrate progress callbacks into section generation methods

  - Add callback invocations at start of each section generation
  - Calculate and report progress percentage for each section
  - Update callbacks on section completion
  - Apply to: warmup, vocabulary, reading, comprehension, discussion, grammar, pronunciation, wrapup
  - _Requirements: 1.2, 1.3, 2.2, 2.3_

---

## Phase 2: Streaming API Integration

- [x] 5. Update streaming API to accept and use progress callbacks

  - Modify `/api/generate-lesson-stream` to create progress callback function
  - Pass callback to progressive generator when invoking generation
  - Remove simulated setTimeout delays
  - _Requirements: 1.1, 1.4, 5.3_

- [x] 6. Stream real-time progress events to frontend

  - Emit SSE progress events when callback is invoked
  - Include structured data: step name, progress percentage, phase, section
  - Maintain existing event format for backward compatibility
  - _Requirements: 1.2, 1.3, 2.5_

- [x] 7. Implement error state progress reporting

  - Report current progress state when errors occur
  - Include phase and section information in error events
  - Ensure progress state is preserved in error responses
  - _Requirements: 1.6_

---

## Phase 3: Frontend Progress Display

- [x] 8. Update LessonGenerator component to consume real progress events

  - Remove simulated progress logic from component
  - Update progress state based on actual SSE events
  - Display phase-specific progress information
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 9. Enhance progress UI with detailed step information

  - Display current generation step/section to user
  - Show phase-specific progress indicators
  - Update UI smoothly as progress events arrive
  - _Requirements: 1.2, 1.3_

---

## Phase 4: Markdown Stripping Implementation

- [x] 10. Implement centralized stripMarkdown utility function

  - Create `stripMarkdown(text: string): string` function in export-utils.ts
  - Handle bold syntax: `**text**` and `__text__`
  - Handle italic syntax: `*text*` and `_text_`
  - Handle nested markdown recursively
  - Preserve actual text content without formatting markers
  - _Requirements: 3.1, 3.2, 3.13, 3.14_

- [x] 11. Add comprehensive unit tests for markdown stripping

  - Test bold syntax removal
  - Test italic syntax removal
  - Test nested markdown handling
  - Test edge cases: empty strings, no markdown, malformed markdown
  - _Requirements: 3.13, 3.14_

- [x] 12. Apply markdown stripping to all Word export text fields

  - Strip markdown from lesson title
  - Strip markdown from section instructions
  - Strip markdown from vocabulary (words, meanings, examples)
  - Strip markdown from reading passage paragraphs
  - Strip markdown from comprehension questions
  - Strip markdown from discussion questions
  - Strip markdown from dialogue (character names and lines)
  - Strip markdown from grammar (focus, examples, exercises)
  - Strip markdown from pronunciation (words, IPA, sentences, tips)
  - Strip markdown from wrap-up questions
  - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12_

- [x] 13. Implement safe markdown stripping with error handling

  - Wrap stripMarkdown calls in try-catch blocks
  - Return original text if stripping fails
  - Log errors without breaking export process
  - _Requirements: 5.2_

---

## Phase 5: Export Consistency and Validation

- [x] 14. Verify PDF and Word export consistency

  - Ensure both formats apply identical markdown stripping
  - Test with lessons containing various markdown patterns
  - Validate output quality across both formats
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 15. Test backward compatibility

  - Verify generation works without progress callbacks
  - Verify exports work with lessons without markdown
  - Ensure non-streaming API continues to function
  - Test all existing lesson types and sections
  - _Requirements: 5.1, 5.2, 5.3, 5.5_

---

## Phase 6: Testing and Documentation

- [x] 16. Create integration tests for progress tracking

  - Test streaming API with progress updates
  - Verify progress aggregation across multiple AI calls
  - Test progress reporting with different lesson types
  - Verify error state progress reporting
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6_

- [x] 17. Create integration tests for markdown stripping

  - Test Word export with markdown in all sections
  - Compare PDF and Word export consistency
  - Test with real AI-generated content
  - Verify all lesson types and sections
  - _Requirements: 3.1-3.14, 4.1-4.4_

- [x] 18. Perform manual testing and validation

  - Visual verification of progress UI updates
  - Test with slow network conditions
  - Export lessons and inspect Word documents manually

  - Verify no visible markdown syntax remains
  - Confirm professional appearance of exports
  - _Requirements: 1.1, 1.2, 3.1-3.14_

- [x] 19. Update documentation

  - Document progress callback interface and usage
  - Document markdown stripping utility function
  - Add examples for developers
  - Update export documentation

  - _Requirements: All_
