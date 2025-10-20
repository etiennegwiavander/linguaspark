# Developer Guide: Progress and Export Improvements

## Overview

This guide provides practical examples and patterns for developers working with the progress callback system and markdown stripping utilities in the LinguaSpark lesson generation system.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Progress Tracking](#progress-tracking)
3. [Markdown Stripping](#markdown-stripping)
4. [Integration Patterns](#integration-patterns)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

## Quick Start

### Adding Progress Tracking to a New Generator

```typescript
import { generateLesson } from '@/lib/progressive-generator';


// Basic usage with progress tracking
const lesson = await generateLesson({
  content: extractedText,
  level: 'B1',
  lessonType: 'discussion',
  onProgress: (update) => {
    console.log(`${update.step}: ${update.progress}%`);
  }
});
```

### Adding Markdown Stripping to Exports

```typescript
import { stripMarkdown } from '@/lib/export-utils';

// Strip markdown from any text field
const cleanTitle = stripMarkdown(lesson.title);
const cleanVocab = lesson.vocabulary.map(item => ({
  word: stripMarkdown(item.word),
  meaning: stripMarkdown(item.meaning),
  example: stripMarkdown(item.example)
}));
```

## Progress Tracking

### Understanding Progress Updates

Progress updates provide real-time feedback during lesson generation:

```typescript
interface ProgressUpdate {
  step: string;      // "Generating vocabulary"
  progress: number;  // 25 (percentage)
  phase: string;     // "vocabulary"
  section?: string;  // Optional sub-section
}
```

### Implementing Progress in API Routes

```typescript
// app/api/generate-lesson-stream/route.ts
export async function POST(request: Request) {
  const { content, level, lessonType } = await request.json();
  
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const lesson = await generateLesson({
          content,
          level,
          lessonType,
          onProgress: (update) => {
            // Stream progress to client
            const event = {
              type: 'progress',
              data: update
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
            );
          }
        });
        
        // Stream completion
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'complete', data: lesson })}\n\n`)
        );
      } catch (error) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', data: { message: error.message } })}\n\n`)
        );
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

### Consuming Progress in React Components

```typescript
'use client';
import { useState } from 'react';

export function LessonGenerator() {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState(null);
  
  async function handleGenerate() {
    const eventSource = new EventSource('/api/generate-lesson-stream');
    
    eventSource.addEventListener('message', (event) => {
      const { type, data } = JSON.parse(event.data);
      
      switch (type) {
        case 'progress':
          setProgress(data.progress);
          setCurrentStep(data.step);
          break;
          
        case 'complete':
          setLesson(data);
          setProgress(100);
          eventSource.close();
          break;
          
        case 'error':
          setError(data.message);
          eventSource.close();
          break;
      }
    });
    
    eventSource.onerror = () => {
      setError('Connection lost');
      eventSource.close();
    };
  }
  
  return (
    <div>
      {progress > 0 && progress < 100 && (
        <div className="space-y-2">
          <div className="text-sm text-gray-600">{currentStep}</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-500">{progress}%</div>
        </div>
      )}
      
      {error && <div className="text-red-600">{error}</div>}
      {lesson && <LessonDisplay lesson={lesson} />}
      
      <button onClick={handleGenerate}>Generate Lesson</button>
    </div>
  );
}
```

### Phase Weights Configuration

Progress is calculated based on phase weights that reflect the relative complexity of each section:

```typescript
const DEFAULT_PHASE_WEIGHTS = {
  warmup: 10,        // Quick warmup questions
  vocabulary: 15,    // Vocabulary extraction and examples
  reading: 20,       // Longest section, most tokens
  comprehension: 10, // Question generation
  discussion: 10,    // Question generation
  dialogue: 15,      // Multi-turn dialogue creation
  grammar: 15,       // Grammar explanation and exercises
  pronunciation: 15, // Pronunciation guide with IPA
  wrapup: 5          // Quick wrap-up questions
};
```

**Customizing weights for specific lesson types:**

```typescript
function getPhaseWeights(lessonType: string): PhaseWeights {
  const weights = { ...DEFAULT_PHASE_WEIGHTS };
  
  // Adjust weights based on lesson type
  if (lessonType === 'grammar') {
    weights.grammar = 30; // Grammar lessons focus more on grammar
    weights.reading = 15;
  } else if (lessonType === 'pronunciation') {
    weights.pronunciation = 30;
    weights.reading = 15;
  }
  
  return weights;
}
```

## Markdown Stripping

### Basic Markdown Stripping

The `stripMarkdown` function removes markdown syntax while preserving content:

```typescript
import { stripMarkdown } from '@/lib/export-utils';

// Bold syntax
stripMarkdown('**bold text**')  // → 'bold text'
stripMarkdown('__bold text__')  // → 'bold text'

// Italic syntax
stripMarkdown('*italic text*')  // → 'italic text'
stripMarkdown('_italic text_')  // → 'italic text'

// Nested markdown
stripMarkdown('**bold with *italic* inside**')  // → 'bold with italic inside'

// Multiple patterns
stripMarkdown('**bold** and *italic*')  // → 'bold and italic'
```

### Applying to Word Exports

Apply markdown stripping to all text fields before rendering in Word documents:

```typescript
import { Document, Paragraph, TextRun, HeadingLevel } from 'docx';
import { stripMarkdown } from '@/lib/export-utils';

function createWordDocument(lesson: LessonData): Document {
  return new Document({
    sections: [{
      children: [
        // Title
        new Paragraph({
          text: stripMarkdown(lesson.title),
          heading: HeadingLevel.HEADING_1
        }),
        
        // Warmup section
        new Paragraph({
          text: 'Warmup',
          heading: HeadingLevel.HEADING_2
        }),
        new Paragraph({
          text: stripMarkdown(lesson.warmup.instructions),
          italics: true
        }),
        ...lesson.warmup.questions.map(q =>
          new Paragraph({
            text: `• ${stripMarkdown(q)}`,
            bullet: { level: 0 }
          })
        ),
        
        // Vocabulary section
        new Paragraph({
          text: 'Vocabulary',
          heading: HeadingLevel.HEADING_2
        }),
        ...lesson.vocabulary.map(item =>
          new Paragraph({
            children: [
              new TextRun({
                text: stripMarkdown(item.word),
                bold: true
              }),
              new TextRun({
                text: ` - ${stripMarkdown(item.meaning)}`
              }),
              new TextRun({
                text: `\nExample: ${stripMarkdown(item.example)}`,
                italics: true
              })
            ]
          })
        ),
        
        // Reading passage
        new Paragraph({
          text: 'Reading',
          heading: HeadingLevel.HEADING_2
        }),
        ...lesson.reading.paragraphs.map(para =>
          new Paragraph({
            text: stripMarkdown(para)
          })
        ),
        
        // Comprehension questions
        new Paragraph({
          text: 'Comprehension',
          heading: HeadingLevel.HEADING_2
        }),
        ...lesson.comprehension.questions.map((q, i) =>
          new Paragraph({
            text: `${i + 1}. ${stripMarkdown(q)}`
          })
        )
      ]
    }]
  });
}
```

### Safe Markdown Stripping

Always use safe wrappers in production to prevent export failures:

```typescript
function safeStripMarkdown(text: string): string {
  try {
    return stripMarkdown(text);
  } catch (error) {
    console.error('Markdown stripping error:', error);
    return text; // Return original if stripping fails
  }
}

// Use in exports
const cleanTitle = safeStripMarkdown(lesson.title);
```

### Batch Processing

Strip markdown from arrays of text:

```typescript
function stripMarkdownFromArray(items: string[]): string[] {
  return items.map(item => safeStripMarkdown(item));
}

// Usage
const cleanQuestions = stripMarkdownFromArray(lesson.comprehension.questions);
const cleanParagraphs = stripMarkdownFromArray(lesson.reading.paragraphs);
```

### Object Field Stripping

Strip markdown from specific fields in objects:

```typescript
function cleanVocabularyItems(items: VocabularyItem[]): VocabularyItem[] {
  return items.map(item => ({
    ...item,
    word: stripMarkdown(item.word),
    meaning: stripMarkdown(item.meaning),
    example: stripMarkdown(item.example)
    // Keep pronunciation as-is (IPA notation)
  }));
}

function cleanDialogueExchanges(exchanges: DialogueExchange[]): DialogueExchange[] {
  return exchanges.map(exchange => ({
    ...exchange,
    character: stripMarkdown(exchange.character),
    line: stripMarkdown(exchange.line)
  }));
}
```

## Integration Patterns

### Full Lesson Generation with Progress and Export

Complete example integrating both features:

```typescript
// API Route
export async function POST(request: Request) {
  const { content, level, lessonType, format } = await request.json();
  
  if (format === 'stream') {
    // Streaming with progress
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const lesson = await generateLesson({
          content,
          level,
          lessonType,
          onProgress: (update) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'progress', data: update })}\n\n`)
            );
          }
        });
        
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'complete', data: lesson })}\n\n`)
        );
        controller.close();
      }
    });
    
    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream' }
    });
  } else {
    // Non-streaming (backward compatible)
    const lesson = await generateLesson({ content, level, lessonType });
    return Response.json({ success: true, data: lesson });
  }
}

// Export Route
export async function POST(request: Request) {
  const { lesson, format } = await request.json();
  
  if (format === 'word') {
    const doc = createWordDocument(lesson); // Uses stripMarkdown internally
    const buffer = await Packer.toBuffer(doc);
    
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${stripMarkdown(lesson.title)}.docx"`
      }
    });
  } else {
    // PDF export
    const pdf = createPDFDocument(lesson); // Also uses stripMarkdown
    return new Response(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${stripMarkdown(lesson.title)}.pdf"`
      }
    });
  }
}
```

### Error Handling Pattern

Comprehensive error handling for both features:

```typescript
async function generateLessonWithProgress(options: GenerateOptions) {
  let lastProgress: ProgressUpdate | null = null;
  
  try {
    const lesson = await generateLesson({
      ...options,
      onProgress: (update) => {
        lastProgress = update;
        options.onProgress?.(update);
      }
    });
    
    return { success: true, data: lesson };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error.message,
        code: classifyError(error),
        progress: lastProgress // Include last known progress
      }
    };
  }
}
```

## Testing

### Unit Tests for Progress Callbacks

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
    expect(callback.mock.calls.length).toBeGreaterThan(0);
    
    // Verify structure of progress updates
    callback.mock.calls.forEach(([update]) => {
      expect(update).toMatchObject({
        step: expect.any(String),
        progress: expect.any(Number),
        phase: expect.any(String)
      });
      expect(update.progress).toBeGreaterThanOrEqual(0);
      expect(update.progress).toBeLessThanOrEqual(100);
    });
  });
  
  it('should work without callback (backward compatible)', async () => {
    const lesson = await generateLesson({
      content: 'test content',
      level: 'B1',
      lessonType: 'discussion'
    });
    
    expect(lesson).toBeDefined();
    expect(lesson.title).toBeDefined();
  });
  
  it('should handle callback errors gracefully', async () => {
    const faultyCallback = vi.fn(() => {
      throw new Error('Callback error');
    });
    
    // Should not throw
    await expect(generateLesson({
      content: 'test content',
      level: 'B1',
      lessonType: 'discussion',
      onProgress: faultyCallback
    })).resolves.toBeDefined();
  });
});
```

### Unit Tests for Markdown Stripping

```typescript
import { describe, it, expect } from 'vitest';
import { stripMarkdown } from '@/lib/export-utils';

describe('stripMarkdown', () => {
  describe('bold syntax', () => {
    it('should remove ** bold syntax', () => {
      expect(stripMarkdown('**bold**')).toBe('bold');
      expect(stripMarkdown('text **bold** text')).toBe('text bold text');
    });
    
    it('should remove __ bold syntax', () => {
      expect(stripMarkdown('__bold__')).toBe('bold');
      expect(stripMarkdown('text __bold__ text')).toBe('text bold text');
    });
  });
  
  describe('italic syntax', () => {
    it('should remove * italic syntax', () => {
      expect(stripMarkdown('*italic*')).toBe('italic');
      expect(stripMarkdown('text *italic* text')).toBe('text italic text');
    });
    
    it('should remove _ italic syntax', () => {
      expect(stripMarkdown('_italic_')).toBe('italic');
      expect(stripMarkdown('text _italic_ text')).toBe('text italic text');
    });
  });
  
  describe('nested markdown', () => {
    it('should handle nested bold and italic', () => {
      expect(stripMarkdown('**bold with *italic* inside**'))
        .toBe('bold with italic inside');
      expect(stripMarkdown('*italic with **bold** inside*'))
        .toBe('italic with bold inside');
    });
  });
  
  describe('edge cases', () => {
    it('should handle empty strings', () => {
      expect(stripMarkdown('')).toBe('');
    });
    
    it('should handle text without markdown', () => {
      expect(stripMarkdown('plain text')).toBe('plain text');
    });
    
    it('should preserve underscores in words', () => {
      expect(stripMarkdown('variable_name')).toBe('variable_name');
    });
    
    it('should handle malformed markdown', () => {
      expect(stripMarkdown('**incomplete')).toBe('**incomplete');
      expect(stripMarkdown('*also incomplete')).toBe('*also incomplete');
    });
  });
});
```

### Integration Tests

```typescript
describe('Streaming API with Progress', () => {
  it('should stream progress events during generation', async () => {
    const response = await fetch('/api/generate-lesson-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'test content',
        level: 'B1',
        lessonType: 'discussion'
      })
    });
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    const events = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const text = decoder.decode(value);
      const lines = text.split('\n\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          events.push(JSON.parse(line.slice(6)));
        }
      }
    }
    
    // Verify we got progress events
    const progressEvents = events.filter(e => e.type === 'progress');
    expect(progressEvents.length).toBeGreaterThan(0);
    
    // Verify progress increases
    const progressValues = progressEvents.map(e => e.data.progress);
    for (let i = 1; i < progressValues.length; i++) {
      expect(progressValues[i]).toBeGreaterThanOrEqual(progressValues[i - 1]);
    }
    
    // Verify completion event
    const completeEvent = events.find(e => e.type === 'complete');
    expect(completeEvent).toBeDefined();
    expect(completeEvent.data).toHaveProperty('title');
  });
});

describe('Word Export with Markdown Stripping', () => {
  it('should strip markdown from all sections', async () => {
    const lesson = {
      title: '**Test Lesson**',
      warmup: {
        instructions: '*Think about these questions*',
        questions: ['What is **important**?']
      },
      vocabulary: [
        { word: '**crucial**', meaning: '*very important*', example: 'This is __crucial__' }
      ],
      reading: {
        paragraphs: ['This is **bold** text.']
      }
    };
    
    const response = await fetch('/api/export-lesson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lesson, format: 'word' })
    });
    
    const buffer = await response.arrayBuffer();
    const doc = await loadWordDocument(buffer);
    const text = extractTextFromDocument(doc);
    
    // Verify no markdown syntax remains
    expect(text).not.toContain('**');
    expect(text).not.toContain('__');
    expect(text).not.toContain('*');
    expect(text).not.toContain('_');
    
    // Verify content is preserved
    expect(text).toContain('Test Lesson');
    expect(text).toContain('crucial');
    expect(text).toContain('very important');
  });
});
```

## Troubleshooting

### Progress Not Updating

**Symptoms:**
- Progress bar stays at 0%
- No progress events received
- Callback not being invoked

**Solutions:**

1. Verify callback is passed correctly:
```typescript
// ✅ Correct
await generateLesson({
  content,
  level,
  lessonType,
  onProgress: (update) => console.log(update)
});

// ❌ Incorrect
await generateLesson({
  content,
  level,
  lessonType,
  progress: (update) => console.log(update) // Wrong property name
});
```

2. Check streaming API setup:
```typescript
// Ensure proper SSE headers
return new Response(stream, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  }
});
```

3. Verify EventSource connection:
```typescript
const eventSource = new EventSource('/api/generate-lesson-stream');

eventSource.onerror = (error) => {
  console.error('EventSource error:', error);
};
```

### Markdown Still Visible in Exports

**Symptoms:**
- `**bold**` or `*italic*` visible in Word documents
- Inconsistent stripping across sections

**Solutions:**

1. Verify stripMarkdown is called on all fields:
```typescript
// Check every text field
const doc = new Document({
  sections: [{
    children: [
      new Paragraph({ text: stripMarkdown(lesson.title) }), // ✅
      new Paragraph({ text: lesson.subtitle }), // ❌ Missing stripMarkdown
    ]
  }]
});
```

2. Use safe wrapper to catch errors:
```typescript
function safeStripMarkdown(text: string): string {
  try {
    return stripMarkdown(text);
  } catch (error) {
    console.error('Strip error:', error, 'Text:', text);
    return text;
  }
}
```

3. Test with actual AI-generated content:
```typescript
// Don't just test with synthetic data
const realLesson = await generateLesson({ /* ... */ });
const doc = createWordDocument(realLesson);
// Manually inspect the exported document
```

### Performance Issues

**Symptoms:**
- Slow export generation
- UI freezing during progress updates
- High memory usage

**Solutions:**

1. Debounce progress updates:
```typescript
import { debounce } from 'lodash';

const debouncedUpdate = debounce((update) => {
  setProgress(update.progress);
  setCurrentStep(update.step);
}, 100);

onProgress: debouncedUpdate
```

2. Optimize markdown stripping:
```typescript
// Cache stripped values if used multiple times
const strippedCache = new Map<string, string>();

function cachedStripMarkdown(text: string): string {
  if (strippedCache.has(text)) {
    return strippedCache.get(text)!;
  }
  const result = stripMarkdown(text);
  strippedCache.set(text, result);
  return result;
}
```

3. Profile to identify bottlenecks:
```typescript
console.time('export');
const doc = createWordDocument(lesson);
console.timeEnd('export');
```

## Best Practices

### Progress Tracking

1. **Always provide meaningful step names**
```typescript
// ✅ Good
onProgress({ step: 'Generating vocabulary list', progress: 20, phase: 'vocabulary' });

// ❌ Bad
onProgress({ step: 'Step 2', progress: 20, phase: 'vocab' });
```

2. **Keep callbacks lightweight**
```typescript
// ✅ Good - just update state
onProgress: (update) => setProgress(update.progress);

// ❌ Bad - heavy computation
onProgress: (update) => {
  performExpensiveCalculation();
  updateDatabase();
  sendAnalytics();
};
```

3. **Handle errors gracefully**
```typescript
onProgress: (update) => {
  try {
    updateUI(update);
  } catch (error) {
    console.error('UI update failed:', error);
    // Don't throw - let generation continue
  }
};
```

### Markdown Stripping

1. **Strip at export time, not storage time**
```typescript
// ✅ Good - preserve original content
const lesson = await generateLesson({ /* ... */ });
await saveLesson(lesson); // Save with markdown
const doc = createWordDocument(lesson); // Strip during export

// ❌ Bad - lose original formatting
const lesson = await generateLesson({ /* ... */ });
lesson.title = stripMarkdown(lesson.title); // Modifies original
await saveLesson(lesson);
```

2. **Apply consistently across all formats**
```typescript
// Both PDF and Word should use same stripping
function exportLesson(lesson: LessonData, format: 'pdf' | 'word') {
  const cleanLesson = {
    ...lesson,
    title: stripMarkdown(lesson.title),
    // ... strip all fields
  };
  
  return format === 'pdf' 
    ? createPDF(cleanLesson)
    : createWord(cleanLesson);
}
```

3. **Test with real AI content**
```typescript
// Use actual generated lessons for testing
const lesson = await generateLesson({ /* real params */ });
const exported = await exportToWord(lesson);
// Manually verify the output
```

## Additional Resources

- [Progress Callback API Documentation](./PROGRESS_CALLBACK_API.md)
- [Markdown Stripping API Documentation](./MARKDOWN_STRIPPING_API.md)
- [Design Document](./design.md)
- [Requirements Document](./requirements.md)
- [Progressive Generator Source](../../lib/progressive-generator.ts)
- [Export Utils Source](../../lib/export-utils.ts)
- [Integration Tests](../../test/progress-tracking-integration.test.ts)

## Getting Help

If you encounter issues not covered in this guide:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review the API documentation for [Progress Callbacks](./PROGRESS_CALLBACK_API.md) and [Markdown Stripping](./MARKDOWN_STRIPPING_API.md)
3. Look at the integration tests for working examples
4. Check the console for error messages
5. Verify your implementation against the examples in this guide

## Contributing

When adding new features or fixing bugs:

1. Update relevant documentation files
2. Add tests for new functionality
3. Follow existing patterns and conventions
4. Update this guide with new examples if applicable
5. Ensure backward compatibility unless explicitly breaking
