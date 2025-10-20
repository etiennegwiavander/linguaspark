# Progress Callback API Documentation

## Overview

The Progress Callback API provides real-time progress updates during AI lesson generation. This allows frontend components to display accurate progress information to users instead of simulated progress indicators.

## Core Interfaces

### ProgressUpdate

Represents a single progress update event during lesson generation.

```typescript
interface ProgressUpdate {
  step: string;           // Human-readable step name (e.g., "Generating vocabulary")
  progress: number;       // Percentage complete (0-100)
  phase: string;          // Phase identifier (e.g., "vocabulary", "reading")
  section?: string;       // Optional section identifier for multi-part phases
}
```

**Fields:**

- `step`: A user-friendly description of the current generation step. Examples:
  - "Generating warmup questions"
  - "Creating vocabulary list"
  - "Writing reading passage"
  
- `progress`: Overall completion percentage from 0 to 100. Calculated based on phase weights and current position in the generation sequence.

- `phase`: Internal identifier for the current generation phase. Matches the lesson section being generated:
  - `"warmup"`, `"vocabulary"`, `"reading"`, `"comprehension"`, `"discussion"`, `"dialogue"`, `"grammar"`, `"pronunciation"`, `"wrapup"`

- `section`: Optional sub-section identifier for phases that generate multiple parts (e.g., dialogue with multiple exchanges).

### ProgressCallback

Function signature for progress callback handlers.

```typescript
type ProgressCallback = (update: ProgressUpdate) => void;
```

**Usage:**

Callbacks are invoked synchronously during generation. They should be lightweight and avoid heavy computation or blocking operations.

### GenerateOptions

Extended options interface for the progressive generator.

```typescript
interface GenerateOptions {
  content: string;
  level: string;
  lessonType: string;
  onProgress?: ProgressCallback;  // Optional progress callback
}
```

**Fields:**

- `onProgress`: Optional callback function that receives progress updates. If not provided, generation proceeds without progress reporting.

## Phase Weights

Progress calculation uses configurable phase weights to ensure proportional progress reporting across different lesson types.

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

**How it works:**

1. Each phase has a weight representing its relative complexity/time
2. Total weight is calculated based on which sections are included in the lesson type
3. Progress percentage is calculated as: `(completed weight / total weight) * 100`
4. Different lesson types automatically adjust based on their included sections

## Usage Examples

### Basic Usage in Progressive Generator

```typescript
import { generateLesson } from '@/lib/progressive-generator';

const lesson = await generateLesson({
  content: extractedText,
  level: 'B1',
  lessonType: 'discussion',
  onProgress: (update) => {
    console.log(`${update.step}: ${update.progress}%`);
  }
});
```

### Streaming API Integration

```typescript
// app/api/generate-lesson-stream/route.ts
export async function POST(request: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const lesson = await generateLesson({
          content,
          level,
          lessonType,
          onProgress: (update) => {
            // Stream progress event to client
            const event = {
              type: 'progress',
              data: update
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
            );
          }
        });
        
        // Stream completion event
        const completeEvent = {
          type: 'complete',
          data: lesson
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(completeEvent)}\n\n`)
        );
      } catch (error) {
        // Handle errors...
      } finally {
        controller.close();
      }
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
```

### Frontend Component Usage

```typescript
'use client';
import { useState } from 'react';

export function LessonGenerator() {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  
  async function generateLesson() {
    const eventSource = new EventSource('/api/generate-lesson-stream');
    
    eventSource.addEventListener('message', (event) => {
      const { type, data } = JSON.parse(event.data);
      
      if (type === 'progress') {
        setProgress(data.progress);
        setCurrentStep(data.step);
      } else if (type === 'complete') {
        setLesson(data);
        eventSource.close();
      }
    });
  }
  
  return (
    <div>
      <div>Progress: {progress}%</div>
      <div>Current: {currentStep}</div>
    </div>
  );
}
```

## Error Handling

### Safe Callback Wrapper

The generator uses a safe callback wrapper to isolate errors:

```typescript
function safeProgressCallback(
  callback: ProgressCallback | undefined,
  update: ProgressUpdate
): void {
  if (!callback) return;
  
  try {
    callback(update);
  } catch (error) {
    // Log error but don't fail generation
    console.error('Progress callback error:', error);
  }
}
```

**Key Points:**

- Callback errors never interrupt lesson generation
- Errors are logged for debugging
- Generation continues even if progress reporting fails
- This ensures robustness and prevents UI issues from breaking core functionality

### Error State Reporting

When errors occur during generation, the current progress state is preserved:

```typescript
catch (error) {
  const errorEvent = {
    type: 'error',
    data: {
      message: 'Generation failed',
      code: classifyError(error),
      progress: currentProgress,  // Include last known progress
      phase: currentPhase
    }
  };
  // Stream error event...
}
```

## Backward Compatibility

The progress callback is completely optional:

```typescript
// Works without callback (backward compatible)
const lesson = await generateLesson({
  content: text,
  level: 'B1',
  lessonType: 'grammar'
  // No onProgress provided
});

// Works with callback (new functionality)
const lesson = await generateLesson({
  content: text,
  level: 'B1',
  lessonType: 'grammar',
  onProgress: (update) => console.log(update)
});
```

## Performance Considerations

- Callbacks are lightweight and execute synchronously
- No heavy computation should occur in callback handlers
- Typical callback overhead: < 1ms per invocation
- Progress updates occur at phase boundaries (8-10 times per lesson)
- No impact on AI generation performance

## Testing

### Unit Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { generateLesson } from '@/lib/progressive-generator';

describe('Progress Callbacks', () => {
  it('should invoke callback with progress updates', async () => {
    const callback = vi.fn();
    
    await generateLesson({
      content: 'test content',
      level: 'B1',
      lessonType: 'discussion',
      onProgress: callback
    });
    
    expect(callback).toHaveBeenCalled();
    expect(callback.mock.calls[0][0]).toMatchObject({
      step: expect.any(String),
      progress: expect.any(Number),
      phase: expect.any(String)
    });
  });
  
  it('should work without callback', async () => {
    const lesson = await generateLesson({
      content: 'test content',
      level: 'B1',
      lessonType: 'discussion'
      // No callback
    });
    
    expect(lesson).toBeDefined();
  });
});
```

### Integration Tests

```typescript
describe('Streaming API Progress', () => {
  it('should stream progress events', async () => {
    const response = await fetch('/api/generate-lesson-stream', {
      method: 'POST',
      body: JSON.stringify({ content: 'test', level: 'B1', lessonType: 'discussion' })
    });
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let progressEvents = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const text = decoder.decode(value);
      const lines = text.split('\n\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const event = JSON.parse(line.slice(6));
          if (event.type === 'progress') {
            progressEvents++;
          }
        }
      }
    }
    
    expect(progressEvents).toBeGreaterThan(0);
  });
});
```

## Best Practices

1. **Keep Callbacks Lightweight**: Avoid heavy computation or blocking operations in callbacks
2. **Handle Errors Gracefully**: Always wrap callback logic in try-catch blocks
3. **Update UI Efficiently**: Debounce or throttle UI updates if needed for performance
4. **Preserve Progress State**: Store progress information for error recovery
5. **Test Without Callbacks**: Ensure generation works when callbacks are not provided
6. **Log Callback Errors**: Always log callback errors for debugging without failing generation

## Common Patterns

### Progress Bar Component

```typescript
function ProgressBar({ progress, step }: { progress: number; step: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{step}</span>
        <span>{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
```

### Phase-Specific Progress Display

```typescript
function PhaseProgress({ phase, progress }: { phase: string; progress: number }) {
  const phaseLabels = {
    warmup: '🔥 Warming up',
    vocabulary: '📚 Building vocabulary',
    reading: '📖 Creating reading passage',
    comprehension: '❓ Writing questions',
    discussion: '💬 Preparing discussion',
    dialogue: '🗣️ Crafting dialogue',
    grammar: '✏️ Explaining grammar',
    pronunciation: '🔊 Adding pronunciation',
    wrapup: '✅ Wrapping up'
  };
  
  return (
    <div>
      <div>{phaseLabels[phase] || phase}</div>
      <div>{progress}%</div>
    </div>
  );
}
```

## Troubleshooting

### Progress Not Updating

**Problem**: Progress callback is not being invoked.

**Solutions**:
- Verify callback is passed to `generateLesson()`
- Check that streaming API is forwarding the callback
- Ensure no errors are thrown in callback logic
- Verify network connection for SSE streaming

### Inaccurate Progress Percentages

**Problem**: Progress jumps or doesn't reach 100%.

**Solutions**:
- Verify phase weights match the lesson type sections
- Check that all phases invoke the callback
- Ensure progress calculation includes all active phases
- Review phase weight configuration for the lesson type

### Callback Errors Breaking Generation

**Problem**: Errors in callback stop lesson generation.

**Solutions**:
- Ensure `safeProgressCallback` wrapper is used
- Add try-catch blocks around callback invocations
- Log errors without throwing
- Test callback error handling

## Related Documentation

- [Design Document](.kiro/specs/progress-and-export-improvements/design.md)
- [Requirements Document](.kiro/specs/progress-and-export-improvements/requirements.md)
- [Markdown Stripping API](./MARKDOWN_STRIPPING_API.md)
- [Progressive Generator Source](../../lib/progressive-generator.ts)
- [Streaming API Source](../../app/api/generate-lesson-stream/route.ts)
