# Design Document: Progress and Export Improvements

## Overview

This design addresses two critical improvements to the LinguaSpark lesson generation system:

1. **Real-Time Progress Tracking**: Replace simulated progress with actual callback-based progress reporting from the AI generation process
2. **Systematic Markdown Stripping**: Ensure all Word exports have markdown syntax removed for professional output

The design maintains backward compatibility while introducing a callback-based architecture that decouples progress reporting from the generation logic. For exports, we'll implement a centralized markdown stripping utility that applies consistently across all content types.

## Architecture

### Progress Tracking Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Client)                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  LessonGenerator Component                             │ │
│  │  - Manages UI state                                    │ │
│  │  - Displays progress updates                           │ │
│  │  - Handles streaming responses                         │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Server-Sent Events (SSE)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 API Route (Server)                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  /api/generate-lesson-stream                           │ │
│  │  - Accepts progress callback                           │ │
│  │  - Streams progress events to client                   │ │
│  │  - Delegates to progressive generator                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Function call with callback
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Progressive Generator (lib/)                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  progressive-generator.ts                              │ │
│  │  - Invokes callback at each generation phase           │ │
│  │  - Calculates proportional progress                    │ │
│  │  - Handles multi-section generation                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Design Decision**: Use callback-based architecture rather than event emitters or observables to maintain simplicity and avoid additional dependencies. Callbacks provide sufficient flexibility while keeping the implementation straightforward.

### Export Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Export Utils (lib/)                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  export-utils.ts                                       │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  stripMarkdown(text: string): string             │ │ │
│  │  │  - Removes **bold** and __bold__                 │ │ │
│  │  │  - Removes *italic* and _italic_                 │ │ │
│  │  │  - Handles nested markdown                       │ │ │
│  │  │  - Preserves actual text content                 │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                                                        │ │
│  │  Applied to all text fields before rendering:        │ │
│  │  - Lesson titles                                      │ │
│  │  - Section instructions                               │ │
│  │  - Vocabulary (words, meanings, examples)            │ │
│  │  - Reading passages                                   │ │
│  │  - Questions (comprehension, discussion, wrap-up)    │ │
│  │  - Dialogue (character names, lines)                 │ │
│  │  - Grammar (focus, examples, exercises)              │ │
│  │  - Pronunciation (words, IPA, sentences, tips)       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Design Decision**: Centralize markdown stripping in a single utility function rather than duplicating logic across export functions. This ensures consistency and makes future updates easier. Apply stripping at the export layer rather than storage layer to preserve original AI-generated content.

## Components and Interfaces

### Progress Callback Interface

```typescript
interface ProgressUpdate {
  step: string;           // Human-readable step name (e.g., "Generating vocabulary")
  progress: number;       // Percentage complete (0-100)
  phase: string;          // Phase identifier (e.g., "vocabulary", "reading")
  section?: string;       // Optional section identifier for multi-part phases
}

type ProgressCallback = (update: ProgressUpdate) => void;
```

**Design Rationale**: The interface provides structured progress information that can be displayed to users while remaining flexible enough to support different generation strategies. The optional `section` field allows for granular progress reporting within complex phases.

### Progressive Generator Signature

```typescript
interface GenerateOptions {
  content: string;
  level: string;
  lessonType: string;
  onProgress?: ProgressCallback;  // Optional callback for backward compatibility
}

async function generateLesson(options: GenerateOptions): Promise<LessonData>
```

**Design Decision**: Make the progress callback optional to maintain backward compatibility with existing code that doesn't need progress reporting. This allows gradual migration of the codebase.

### Streaming API Response Format

```typescript
// Server-Sent Event format
interface StreamEvent {
  type: 'progress' | 'complete' | 'error';
  data: ProgressUpdate | LessonData | ErrorInfo;
}

// Progress event
data: {"type":"progress","data":{"step":"Generating vocabulary","progress":20,"phase":"vocabulary"}}

// Completion event
data: {"type":"complete","data":{...lessonData}}

// Error event
data: {"type":"error","data":{"message":"Generation failed","code":"QUOTA_EXCEEDED"}}
```

**Design Rationale**: Use Server-Sent Events (SSE) for real-time progress updates as they're simpler than WebSockets for unidirectional server-to-client communication and have built-in reconnection support.

### Markdown Stripping Utility

```typescript
/**
 * Strips markdown formatting from text while preserving content
 * Handles: **bold**, __bold__, *italic*, _italic_
 * Recursively processes nested markdown
 */
function stripMarkdown(text: string): string {
  if (!text) return text;
  
  let result = text;
  
  // Remove bold syntax (** and __)
  result = result.replace(/\*\*(.+?)\*\*/g, '$1');
  result = result.replace(/__(.+?)__/g, '$1');
  
  // Remove italic syntax (* and _)
  result = result.replace(/\*(.+?)\*/g, '$1');
  result = result.replace(/_(.+?)_/g, '$1');
  
  return result;
}
```

**Design Decision**: Use regex-based stripping rather than a full markdown parser to keep the implementation lightweight and focused on the specific markdown syntax used in LinguaSpark lessons. The recursive nature of regex replacement handles nested markdown automatically.

## Data Models

### Progress State Model

```typescript
interface ProgressState {
  currentPhase: string;
  currentStep: string;
  overallProgress: number;
  phaseProgress: Map<string, number>;
  startTime: number;
  estimatedCompletion?: number;
}
```

**Design Rationale**: Track both overall and per-phase progress to provide detailed feedback. Include timing information for potential ETA calculations in future iterations.

### Phase Weight Configuration

```typescript
interface PhaseWeights {
  [phase: string]: number;
}

const DEFAULT_PHASE_WEIGHTS: PhaseWeights = {
  warmup: 10,
  vocabulary: 15,
  reading: 20,
  comprehension: 10,
  discussion: 10,
  dialogue: 15,
  grammar: 15,
  pronunciation: 15,
  wrapup: 5
};
```

**Design Decision**: Use configurable phase weights to calculate proportional progress across different lesson types. Different lesson types include different sections, so weights allow accurate progress calculation regardless of which sections are generated.

## Error Handling

### Progress Callback Error Handling

```typescript
function safeProgressCallback(callback: ProgressCallback | undefined, update: ProgressUpdate): void {
  if (!callback) return;
  
  try {
    callback(update);
  } catch (error) {
    // Log error but don't fail generation
    console.error('Progress callback error:', error);
  }
}
```

**Design Rationale**: Isolate progress reporting errors from the core generation logic. If progress reporting fails, lesson generation should continue successfully. This ensures robustness and prevents UI issues from breaking core functionality.

### Markdown Stripping Error Handling

```typescript
function safeStripMarkdown(text: string): string {
  try {
    return stripMarkdown(text);
  } catch (error) {
    console.error('Markdown stripping error:', error);
    return text; // Return original text if stripping fails
  }
}
```

**Design Decision**: Fail gracefully by returning the original text if markdown stripping encounters an error. This ensures exports always succeed even if the stripping logic has issues.

## Testing Strategy

### Progress Tracking Tests

1. **Unit Tests**
   - Test progress callback invocation at each phase
   - Verify progress percentage calculations
   - Test callback error isolation
   - Verify backward compatibility (no callback provided)

2. **Integration Tests**
   - Test streaming API with progress updates
   - Verify progress aggregation across multiple AI calls
   - Test progress reporting with different lesson types
   - Verify error state progress reporting

3. **Manual Testing**
   - Visual verification of progress UI updates
   - Test with slow network conditions
   - Verify progress accuracy across all lesson types

### Markdown Stripping Tests

1. **Unit Tests**
   - Test bold syntax removal (`**text**`, `__text__`)
   - Test italic syntax removal (`*text*`, `_text_`)
   - Test nested markdown handling
   - Test edge cases (empty strings, no markdown, malformed markdown)

2. **Integration Tests**
   - Test Word export with markdown in all sections
   - Compare PDF and Word export consistency
   - Test with real AI-generated content
   - Verify all lesson types and sections

3. **Visual Testing**
   - Export lessons and manually inspect Word documents
   - Verify no visible markdown syntax remains
   - Confirm formatting appears professional

## Implementation Phases

### Phase 1: Progress Callback Infrastructure
1. Add progress callback parameter to progressive generator
2. Implement progress calculation logic with phase weights
3. Add callback invocations at each generation phase
4. Implement safe callback wrapper for error isolation

### Phase 2: Streaming API Integration
5. Update `/api/generate-lesson-stream` to accept and use callbacks
6. Implement SSE streaming for progress updates
7. Add error handling for streaming failures
8. Test streaming with various lesson types

### Phase 3: Frontend Progress Display
9. Update LessonGenerator component to consume progress events
10. Implement real-time progress UI updates
11. Add error state handling in progress display
12. Remove simulated progress delays

### Phase 4: Markdown Stripping Implementation
13. Implement `stripMarkdown` utility function
14. Add comprehensive unit tests for markdown stripping
15. Apply stripping to all Word export text fields
16. Verify consistency between PDF and Word exports

### Phase 5: Testing and Validation
17. Run comprehensive test suite
18. Perform manual testing of progress tracking
19. Perform manual testing of Word exports
20. Document any edge cases or limitations

## Performance Considerations

### Progress Callback Performance

**Concern**: Frequent callback invocations could impact generation performance.

**Mitigation**: 
- Callbacks are lightweight and only update UI state
- No heavy computation in callback path
- Async nature of generation means callbacks don't block AI calls

**Expected Impact**: Negligible (< 1ms per callback)

### Markdown Stripping Performance

**Concern**: Regex operations on large text fields could slow exports.

**Mitigation**:
- Regex operations are highly optimized in modern JavaScript engines
- Stripping happens once per field during export (not real-time)
- Export is already an async operation with user expectation of delay

**Expected Impact**: Minimal (< 50ms for typical lesson)

## Security Considerations

### Progress Callback Security

- Callbacks execute in server context, not exposed to client manipulation
- No user input processed in callback logic
- Error isolation prevents callback failures from exposing sensitive data

### Markdown Stripping Security

- Regex patterns are static and not user-configurable
- No code execution or eval() usage
- Stripping only removes formatting, doesn't modify semantic content
- No risk of injection attacks as output is rendered in Word/PDF format

## Backward Compatibility

### Progress Tracking Compatibility

- Progress callback is optional parameter (default: undefined)
- Existing code without callbacks continues to work unchanged
- Non-streaming API routes remain functional
- No breaking changes to existing interfaces

### Export Compatibility

- Markdown stripping only affects Word exports (PDF already handles markdown)
- Lessons without markdown export unchanged
- No changes to export API signatures
- Existing export functionality preserved

## Future Enhancements

### Progress Tracking Enhancements

1. **Estimated Time Remaining**: Calculate ETA based on phase completion rates
2. **Cancellation Support**: Allow users to cancel in-progress generation
3. **Progress Persistence**: Save progress state for recovery after errors
4. **Detailed Phase Breakdown**: Show sub-steps within each phase

### Export Enhancements

1. **Configurable Markdown Handling**: Allow users to choose markdown preservation
2. **Rich Text Formatting**: Convert markdown to actual bold/italic formatting in exports
3. **Custom Export Templates**: Allow tutors to customize export styling
4. **Batch Export**: Export multiple lessons simultaneously with progress tracking

## Dependencies

### Existing Dependencies
- `progressive-generator.ts` - Core generation logic
- `export-utils.ts` - Export functionality
- `/api/generate-lesson-stream` - Streaming API endpoint
- `LessonGenerator` component - Frontend UI

### No New Dependencies Required
- Implementation uses existing Node.js and browser APIs
- No additional npm packages needed
- Leverages existing TypeScript and React infrastructure

## Rollout Strategy

### Development
1. Implement progress callback infrastructure
2. Add comprehensive tests
3. Update streaming API
4. Implement markdown stripping
5. Update frontend to consume progress events

### Testing
1. Run automated test suite
2. Manual testing with various lesson types
3. Cross-browser testing for streaming
4. Export validation across different content types

### Deployment
1. Deploy backend changes (API routes, generators)
2. Deploy frontend changes (progress UI)
3. Monitor error rates and performance metrics
4. Gather user feedback on progress accuracy

### Rollback Plan
- Progress callback is optional, can be disabled via feature flag
- Markdown stripping can be conditionally applied
- No database migrations required
- Easy rollback to previous version if issues arise
