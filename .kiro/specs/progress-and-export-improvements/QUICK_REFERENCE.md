# Quick Reference Guide

## Progress Tracking

### Basic Usage

```typescript
import { generateLesson } from '@/lib/progressive-generator';

const lesson = await generateLesson({
  content: 'Your extracted text here',
  level: 'B1',
  lessonType: 'discussion',
  onProgress: (update) => {
    console.log(`${update.step}: ${update.progress}%`);
  }
});
```

### Progress Update Interface

```typescript
interface ProgressUpdate {
  step: string;      // "Generating vocabulary"
  progress: number;  // 25 (0-100)
  phase: string;     // "vocabulary"
  section?: string;  // Optional sub-section
}
```

### React Component Example

```typescript
'use client';
import { useState } from 'react';

export function LessonGenerator() {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  
  async function handleGenerate() {
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
      <div className="text-sm text-gray-600">{currentStep}</div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-xs text-gray-500">{progress}%</div>
    </div>
  );
}
```

### API Route Example

```typescript
export async function POST(request: Request) {
  const { content, level, lessonType } = await request.json();
  
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
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
```

## Markdown Stripping

### Basic Usage

```typescript
import { stripMarkdown } from '@/lib/export-utils';

const cleanText = stripMarkdown('**bold** and *italic*');
// Result: "bold and italic"
```

### Common Patterns

```typescript
// Strip from title
const cleanTitle = stripMarkdown(lesson.title);

// Strip from array of strings
const cleanQuestions = lesson.comprehension.questions.map(q => stripMarkdown(q));

// Strip from vocabulary items
const cleanVocab = lesson.vocabulary.map(item => ({
  word: stripMarkdown(item.word),
  meaning: stripMarkdown(item.meaning),
  example: stripMarkdown(item.example)
}));

// Strip from dialogue
const cleanDialogue = lesson.dialogue.exchanges.map(ex => ({
  character: stripMarkdown(ex.character),
  line: stripMarkdown(ex.line)
}));
```

### Word Export Example

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
        
        // Vocabulary
        ...lesson.vocabulary.map(item =>
          new Paragraph({
            children: [
              new TextRun({
                text: stripMarkdown(item.word),
                bold: true
              }),
              new TextRun({
                text: ` - ${stripMarkdown(item.meaning)}`
              })
            ]
          })
        ),
        
        // Reading passage
        ...lesson.reading.paragraphs.map(para =>
          new Paragraph({
            text: stripMarkdown(para)
          })
        )
      ]
    }]
  });
}
```

### Safe Wrapper

```typescript
import { safeStripMarkdown } from '@/lib/export-utils';

// Returns original text if stripping fails
const cleanText = safeStripMarkdown(lesson.title);
```

## Testing

### Progress Callback Test

```typescript
import { describe, it, expect, vi } from 'vitest';
import { generateLesson } from '@/lib/progressive-generator';

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
```

### Markdown Stripping Test

```typescript
import { describe, it, expect } from 'vitest';
import { stripMarkdown } from '@/lib/export-utils';

it('should remove markdown syntax', () => {
  expect(stripMarkdown('**bold**')).toBe('bold');
  expect(stripMarkdown('*italic*')).toBe('italic');
  expect(stripMarkdown('**bold with *italic* inside**'))
    .toBe('bold with italic inside');
});
```

## Troubleshooting

### Progress Not Updating

```typescript
// ✅ Correct
await generateLesson({
  content,
  level,
  lessonType,
  onProgress: (update) => console.log(update)
});

// ❌ Wrong property name
await generateLesson({
  content,
  level,
  lessonType,
  progress: (update) => console.log(update) // Should be 'onProgress'
});
```

### Markdown Still Visible

```typescript
// ✅ Correct - strip all fields
new Paragraph({
  text: stripMarkdown(lesson.title)
});

// ❌ Missing stripMarkdown
new Paragraph({
  text: lesson.title // Markdown will be visible
});
```

## Phase Weights

```typescript
const DEFAULT_PHASE_WEIGHTS = {
  warmup: 10,        // 10% of total
  vocabulary: 15,    // 15% of total
  reading: 20,       // 20% of total (longest section)
  comprehension: 10,
  discussion: 10,
  dialogue: 15,
  grammar: 15,
  pronunciation: 15,
  wrapup: 5          // 5% of total
};
```

## Supported Markdown Syntax

| Syntax | Example | Result |
|--------|---------|--------|
| Bold (asterisks) | `**bold**` | `bold` |
| Bold (underscores) | `__bold__` | `bold` |
| Italic (asterisks) | `*italic*` | `italic` |
| Italic (underscores) | `_italic_` | `italic` |
| Nested | `**bold with *italic***` | `bold with italic` |

## Common Mistakes

### Progress Tracking

❌ **Don't** throw errors in callbacks:
```typescript
onProgress: (update) => {
  throw new Error('This breaks generation!');
}
```

✅ **Do** handle errors gracefully:
```typescript
onProgress: (update) => {
  try {
    updateUI(update);
  } catch (error) {
    console.error('UI update failed:', error);
  }
}
```

### Markdown Stripping

❌ **Don't** modify stored lesson data:
```typescript
lesson.title = stripMarkdown(lesson.title); // Modifies original
await saveLesson(lesson);
```

✅ **Do** strip only during export:
```typescript
await saveLesson(lesson); // Save with markdown
const doc = createWordDocument(lesson); // Strip during export
```

## Performance Tips

### Progress Tracking
- Keep callbacks lightweight (< 1ms)
- Avoid heavy computation in callbacks
- Debounce UI updates if needed

### Markdown Stripping
- Strip once per field (don't repeat)
- Use safe wrapper in production
- Cache stripped values if reused

## Links

- [Full Developer Guide](./DEVELOPER_GUIDE.md)
- [Progress Callback API](./PROGRESS_CALLBACK_API.md)
- [Markdown Stripping API](./MARKDOWN_STRIPPING_API.md)
- [Documentation Index](./DOCUMENTATION_INDEX.md)
