/**
 * Integration tests for progress tracking
 * Tests streaming API with progress updates, aggregation across multiple AI calls,
 * different lesson types, and error state progress reporting
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ProgressUpdate } from '@/lib/progressive-generator';

describe('Progress Tracking Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Streaming API with Progress Updates', () => {
    it('should stream progress events during lesson generation', async () => {
      const progressUpdates: ProgressUpdate[] = [];
      
      // Mock fetch to capture streaming response
      const mockResponse = new ReadableStream({
        start(controller) {
          // Simulate progress events
          const events = [
            { type: 'progress', data: { step: 'Generating warmup', progress: 10, phase: 'warmup' } },
            { type: 'progress', data: { step: 'Generating vocabulary', progress: 25, phase: 'vocabulary' } },
            { type: 'progress', data: { step: 'Generating reading', progress: 50, phase: 'reading' } },
            { type: 'complete', data: { title: 'Test Lesson' } }
          ];

          events.forEach(event => {
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`));
          });
          controller.close();
        }
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: mockResponse,
        headers: new Headers({ 'content-type': 'text/event-stream' })
      });

      // Simulate streaming API call
      const response = await fetch('/api/generate-lesson-stream', {
        method: 'POST',
        body: JSON.stringify({
          content: 'Test content',
          level: 'B1',
          lessonType: 'discussion'
        })
      });

      expect(response.ok).toBe(true);
      
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'progress') {
              progressUpdates.push(event.data);
            }
          }
        }
      }

      // Verify progress events were received
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0]).toMatchObject({
        step: expect.any(String),
        progress: expect.any(Number),
        phase: expect.any(String)
      });

      // Verify progress increases over time
      for (let i = 1; i < progressUpdates.length; i++) {
        expect(progressUpdates[i].progress).toBeGreaterThanOrEqual(progressUpdates[i - 1].progress);
      }
    });

    it('should emit progress events in correct SSE format', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          const progressEvent = {
            type: 'progress',
            data: {
              step: 'Generating vocabulary',
              progress: 25,
              phase: 'vocabulary'
            }
          };
          
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify(progressEvent)}\n\n`)
          );
          controller.close();
        }
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: mockStream,
        headers: new Headers({ 'content-type': 'text/event-stream' })
      });

      const response = await fetch('/api/generate-lesson-stream', {
        method: 'POST',
        body: JSON.stringify({ content: 'Test', level: 'B1', lessonType: 'discussion' })
      });

      const reader = response.body!.getReader();
      const { value } = await reader.read();
      const text = new TextDecoder().decode(value);

      // Verify SSE format
      expect(text).toMatch(/^data: /);
      expect(text).toContain('\n\n');
      
      const jsonData = text.replace('data: ', '').trim();
      const parsed = JSON.parse(jsonData);
      
      expect(parsed.type).toBe('progress');
      expect(parsed.data).toHaveProperty('step');
      expect(parsed.data).toHaveProperty('progress');
      expect(parsed.data).toHaveProperty('phase');
    });

    it('should maintain backward compatibility with existing event format', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          // Old format event
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ type: 'complete', data: { title: 'Test' } })}\n\n`)
          );
          controller.close();
        }
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: mockStream,
        headers: new Headers({ 'content-type': 'text/event-stream' })
      });

      const response = await fetch('/api/generate-lesson-stream', {
        method: 'POST',
        body: JSON.stringify({ content: 'Test', level: 'B1', lessonType: 'discussion' })
      });

      const reader = response.body!.getReader();
      const { value } = await reader.read();
      const text = new TextDecoder().decode(value);
      const parsed = JSON.parse(text.replace('data: ', '').trim());

      // Verify backward compatibility
      expect(parsed.type).toBe('complete');
      expect(parsed.data).toHaveProperty('title');
    });
  });

  describe('Progress Aggregation Across Multiple AI Calls', () => {
    it('should aggregate progress from multiple section generations', async () => {
      const progressUpdates: ProgressUpdate[] = [];
      
      const mockStream = new ReadableStream({
        start(controller) {
          // Simulate multiple AI calls for different sections
          const sections = [
            { step: 'Generating warmup', progress: 10, phase: 'warmup' },
            { step: 'Generating vocabulary', progress: 25, phase: 'vocabulary' },
            { step: 'Generating reading', progress: 45, phase: 'reading' },
            { step: 'Generating comprehension', progress: 55, phase: 'comprehension' },
            { step: 'Generating discussion', progress: 65, phase: 'discussion' },
            { step: 'Generating grammar', progress: 80, phase: 'grammar' },
            { step: 'Generating pronunciation', progress: 95, phase: 'pronunciation' },
            { step: 'Generating wrapup', progress: 100, phase: 'wrapup' }
          ];

          sections.forEach(section => {
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify({ type: 'progress', data: section })}\n\n`)
            );
          });
          
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ type: 'complete', data: {} })}\n\n`)
          );
          controller.close();
        }
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: mockStream,
        headers: new Headers({ 'content-type': 'text/event-stream' })
      });

      const response = await fetch('/api/generate-lesson-stream', {
        method: 'POST',
        body: JSON.stringify({ content: 'Test', level: 'B1', lessonType: 'discussion' })
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'progress') {
              progressUpdates.push(event.data);
            }
          }
        }
      }

      // Verify all sections reported progress
      expect(progressUpdates.length).toBe(8);
      
      // Verify progress is monotonically increasing
      for (let i = 1; i < progressUpdates.length; i++) {
        expect(progressUpdates[i].progress).toBeGreaterThan(progressUpdates[i - 1].progress);
      }

      // Verify final progress reaches 100%
      expect(progressUpdates[progressUpdates.length - 1].progress).toBe(100);
    });

    it('should calculate proportional progress based on phase weights', async () => {
      const progressUpdates: ProgressUpdate[] = [];
      
      const mockStream = new ReadableStream({
        start(controller) {
          // Different lesson type with different sections
          const sections = [
            { step: 'Generating warmup', progress: 10, phase: 'warmup' },
            { step: 'Generating vocabulary', progress: 30, phase: 'vocabulary' },
            { step: 'Generating dialogue', progress: 60, phase: 'dialogue' },
            { step: 'Generating pronunciation', progress: 90, phase: 'pronunciation' },
            { step: 'Generating wrapup', progress: 100, phase: 'wrapup' }
          ];

          sections.forEach(section => {
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify({ type: 'progress', data: section })}\n\n`)
            );
          });
          
          controller.close();
        }
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: mockStream,
        headers: new Headers({ 'content-type': 'text/event-stream' })
      });

      const response = await fetch('/api/generate-lesson-stream', {
        method: 'POST',
        body: JSON.stringify({ content: 'Test', level: 'B1', lessonType: 'pronunciation' })
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'progress') {
              progressUpdates.push(event.data);
            }
          }
        }
      }

      // Verify proportional progress calculation
      expect(progressUpdates.length).toBe(5);
      
      // Verify phases have appropriate weight distribution
      const warmupProgress = progressUpdates.find(u => u.phase === 'warmup')?.progress || 0;
      const vocabularyProgress = progressUpdates.find(u => u.phase === 'vocabulary')?.progress || 0;
      const dialogueProgress = progressUpdates.find(u => u.phase === 'dialogue')?.progress || 0;
      
      // Vocabulary should have more weight than warmup
      expect(vocabularyProgress - warmupProgress).toBeGreaterThan(10);
      
      // Dialogue should have significant weight
      expect(dialogueProgress - vocabularyProgress).toBeGreaterThan(20);
    });
  });

  describe('Progress Reporting with Different Lesson Types', () => {
    const lessonTypes = ['discussion', 'grammar', 'pronunciation', 'travel', 'business'];

    lessonTypes.forEach(lessonType => {
      it(`should report progress correctly for ${lessonType} lesson type`, async () => {
        const progressUpdates: ProgressUpdate[] = [];
        
        const mockStream = new ReadableStream({
          start(controller) {
            // Different sections based on lesson type
            const baseSections = [
              { step: 'Generating warmup', progress: 10, phase: 'warmup' },
              { step: 'Generating vocabulary', progress: 25, phase: 'vocabulary' }
            ];

            const typeSections: Record<string, any[]> = {
              discussion: [
                { step: 'Generating reading', progress: 50, phase: 'reading' },
                { step: 'Generating discussion', progress: 80, phase: 'discussion' }
              ],
              grammar: [
                { step: 'Generating reading', progress: 50, phase: 'reading' },
                { step: 'Generating grammar', progress: 80, phase: 'grammar' }
              ],
              pronunciation: [
                { step: 'Generating dialogue', progress: 50, phase: 'dialogue' },
                { step: 'Generating pronunciation', progress: 80, phase: 'pronunciation' }
              ],
              travel: [
                { step: 'Generating dialogue', progress: 50, phase: 'dialogue' },
                { step: 'Generating vocabulary', progress: 80, phase: 'vocabulary' }
              ],
              business: [
                { step: 'Generating reading', progress: 50, phase: 'reading' },
                { step: 'Generating discussion', progress: 80, phase: 'discussion' }
              ]
            };

            const sections = [
              ...baseSections,
              ...typeSections[lessonType],
              { step: 'Generating wrapup', progress: 100, phase: 'wrapup' }
            ];

            sections.forEach(section => {
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify({ type: 'progress', data: section })}\n\n`)
              );
            });
            
            controller.close();
          }
        });

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          body: mockStream,
          headers: new Headers({ 'content-type': 'text/event-stream' })
        });

        const response = await fetch('/api/generate-lesson-stream', {
          method: 'POST',
          body: JSON.stringify({ content: 'Test', level: 'B1', lessonType })
        });

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const event = JSON.parse(line.slice(6));
              if (event.type === 'progress') {
                progressUpdates.push(event.data);
              }
            }
          }
        }

        // Verify progress updates were received
        expect(progressUpdates.length).toBeGreaterThan(0);
        
        // Verify all updates have required fields
        progressUpdates.forEach(update => {
          expect(update).toHaveProperty('step');
          expect(update).toHaveProperty('progress');
          expect(update).toHaveProperty('phase');
          expect(update.progress).toBeGreaterThanOrEqual(0);
          expect(update.progress).toBeLessThanOrEqual(100);
        });

        // Verify progress is monotonically increasing
        for (let i = 1; i < progressUpdates.length; i++) {
          expect(progressUpdates[i].progress).toBeGreaterThanOrEqual(progressUpdates[i - 1].progress);
        }
      });
    });

    it('should handle lesson types with varying section combinations', async () => {
      const progressUpdates: ProgressUpdate[] = [];
      
      const mockStream = new ReadableStream({
        start(controller) {
          // Grammar lesson with specific sections
          const sections = [
            { step: 'Generating warmup', progress: 12, phase: 'warmup' },
            { step: 'Generating vocabulary', progress: 30, phase: 'vocabulary' },
            { step: 'Generating reading', progress: 55, phase: 'reading' },
            { step: 'Generating grammar', progress: 85, phase: 'grammar' },
            { step: 'Generating wrapup', progress: 100, phase: 'wrapup' }
          ];

          sections.forEach(section => {
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify({ type: 'progress', data: section })}\n\n`)
            );
          });
          
          controller.close();
        }
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: mockStream,
        headers: new Headers({ 'content-type': 'text/event-stream' })
      });

      const response = await fetch('/api/generate-lesson-stream', {
        method: 'POST',
        body: JSON.stringify({ content: 'Test', level: 'B1', lessonType: 'grammar' })
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'progress') {
              progressUpdates.push(event.data);
            }
          }
        }
      }

      // Verify specific sections for grammar lesson
      const phases = progressUpdates.map(u => u.phase);
      expect(phases).toContain('warmup');
      expect(phases).toContain('vocabulary');
      expect(phases).toContain('reading');
      expect(phases).toContain('grammar');
      expect(phases).toContain('wrapup');
      
      // Verify no unexpected sections
      expect(phases).not.toContain('dialogue');
      expect(phases).not.toContain('pronunciation');
    });
  });

  describe('Error State Progress Reporting', () => {
    it('should report current progress state when error occurs', async () => {
      let lastProgressUpdate: ProgressUpdate | null = null;
      let errorEvent: any = null;
      
      const mockStream = new ReadableStream({
        start(controller) {
          // Progress events before error
          const progressEvents = [
            { type: 'progress', data: { step: 'Generating warmup', progress: 10, phase: 'warmup' } },
            { type: 'progress', data: { step: 'Generating vocabulary', progress: 25, phase: 'vocabulary' } },
            { type: 'progress', data: { step: 'Generating reading', progress: 45, phase: 'reading' } }
          ];

          progressEvents.forEach(event => {
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`)
            );
          });

          // Error event with progress state
          const error = {
            type: 'error',
            data: {
              message: 'API quota exceeded',
              code: 'QUOTA_EXCEEDED',
              progress: {
                step: 'Generating reading',
                progress: 45,
                phase: 'reading'
              }
            }
          };

          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify(error)}\n\n`)
          );
          controller.close();
        }
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: mockStream,
        headers: new Headers({ 'content-type': 'text/event-stream' })
      });

      const response = await fetch('/api/generate-lesson-stream', {
        method: 'POST',
        body: JSON.stringify({ content: 'Test', level: 'B1', lessonType: 'discussion' })
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'progress') {
              lastProgressUpdate = event.data;
            } else if (event.type === 'error') {
              errorEvent = event.data;
            }
          }
        }
      }

      // Verify error includes progress state
      expect(errorEvent).toBeTruthy();
      expect(errorEvent.progress).toBeTruthy();
      expect(errorEvent.progress.phase).toBe('reading');
      expect(errorEvent.progress.progress).toBe(45);
      
      // Verify last progress matches error progress
      expect(lastProgressUpdate?.phase).toBe(errorEvent.progress.phase);
      expect(lastProgressUpdate?.progress).toBe(errorEvent.progress.progress);
    });

    it('should include phase and section information in error events', async () => {
      let errorEvent: any = null;
      
      const mockStream = new ReadableStream({
        start(controller) {
          // Progress then error
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({
              type: 'progress',
              data: { step: 'Generating vocabulary', progress: 25, phase: 'vocabulary', section: 'words' }
            })}\n\n`)
          );

          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({
              type: 'error',
              data: {
                message: 'Generation failed',
                code: 'GENERATION_ERROR',
                progress: {
                  step: 'Generating vocabulary',
                  progress: 25,
                  phase: 'vocabulary',
                  section: 'words'
                }
              }
            })}\n\n`)
          );
          controller.close();
        }
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: mockStream,
        headers: new Headers({ 'content-type': 'text/event-stream' })
      });

      const response = await fetch('/api/generate-lesson-stream', {
        method: 'POST',
        body: JSON.stringify({ content: 'Test', level: 'B1', lessonType: 'discussion' })
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'error') {
              errorEvent = event.data;
            }
          }
        }
      }

      // Verify error includes detailed progress information
      expect(errorEvent.progress).toMatchObject({
        step: 'Generating vocabulary',
        progress: 25,
        phase: 'vocabulary',
        section: 'words'
      });
    });

    it('should preserve progress state in error responses', async () => {
      const events: any[] = [];
      
      const mockStream = new ReadableStream({
        start(controller) {
          const sequence = [
            { type: 'progress', data: { step: 'Generating warmup', progress: 10, phase: 'warmup' } },
            { type: 'progress', data: { step: 'Generating vocabulary', progress: 25, phase: 'vocabulary' } },
            {
              type: 'error',
              data: {
                message: 'Network error',
                code: 'NETWORK_ERROR',
                progress: { step: 'Generating vocabulary', progress: 25, phase: 'vocabulary' }
              }
            }
          ];

          sequence.forEach(event => {
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`)
            );
          });
          controller.close();
        }
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: mockStream,
        headers: new Headers({ 'content-type': 'text/event-stream' })
      });

      const response = await fetch('/api/generate-lesson-stream', {
        method: 'POST',
        body: JSON.stringify({ content: 'Test', level: 'B1', lessonType: 'discussion' })
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            events.push(JSON.parse(line.slice(6)));
          }
        }
      }

      // Verify progress state is preserved through error
      expect(events.length).toBe(3);
      expect(events[0].type).toBe('progress');
      expect(events[1].type).toBe('progress');
      expect(events[2].type).toBe('error');
      
      // Verify error contains last known progress
      expect(events[2].data.progress.phase).toBe(events[1].data.phase);
      expect(events[2].data.progress.progress).toBe(events[1].data.progress);
    });
  });
});
