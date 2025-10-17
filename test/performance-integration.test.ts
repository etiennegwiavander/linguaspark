/**
 * Performance Integration Tests for Extract from Page Feature
 * 
 * Tests performance characteristics, memory usage, and scalability
 * of the extraction system under various conditions.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContentAnalysisEngine } from '@/lib/content-analysis-engine';
import { EnhancedContentExtractor } from '@/lib/enhanced-content-extractor';
import { FloatingActionButton } from '@/components/floating-action-button';
import { ExtractionSessionManager } from '@/lib/extraction-session-manager';

// Performance monitoring utilities
class PerformanceMonitor {
  private startTime: number = 0;
  private memoryStart: number = 0;

  start() {
    this.startTime = performance.now();
    this.memoryStart = this.getMemoryUsage();
  }

  end() {
    const endTime = performance.now();
    const memoryEnd = this.getMemoryUsage();
    
    return {
      duration: endTime - this.startTime,
      memoryDelta: memoryEnd - this.memoryStart,
      memoryEnd,
    };
  }

  private getMemoryUsage(): number {
    // Use performance.memory if available (Chrome)
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    // Fallback for other browsers
    return 0;
  }
}

// Generate test content of various sizes
const generateTestContent = (wordCount: number): string => {
  const words = [
    'language', 'learning', 'education', 'student', 'teacher', 'grammar',
    'vocabulary', 'pronunciation', 'conversation', 'fluency', 'comprehension',
    'reading', 'writing', 'listening', 'speaking', 'practice', 'exercise',
    'lesson', 'course', 'curriculum', 'assessment', 'progress', 'achievement',
  ];
  
  const sentences: string[] = [];
  let currentWordCount = 0;
  
  while (currentWordCount < wordCount) {
    const sentenceLength = Math.floor(Math.random() * 15) + 5; // 5-20 words per sentence
    const sentence = Array.from({ length: sentenceLength }, () => 
      words[Math.floor(Math.random() * words.length)]
    ).join(' ');
    
    sentences.push(sentence + '.');
    currentWordCount += sentenceLength;
  }
  
  return sentences.join(' ');
};

const createMockDocument = (content: string) => ({
  querySelector: vi.fn(() => ({
    innerHTML: `<article><h1>Test Article</h1><p>${content}</p></article>`,
    textContent: content,
    querySelectorAll: vi.fn(() => []),
  })),
  querySelectorAll: vi.fn(() => []),
  createElement: vi.fn(),
  body: { appendChild: vi.fn(), removeChild: vi.fn() },
});

describe('Performance Integration Tests', () => {
  let analysisEngine: ContentAnalysisEngine;
  let extractor: EnhancedContentExtractor;
  let button: FloatingActionButton;
  let sessionManager: ExtractionSessionManager;
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    analysisEngine = new ContentAnalysisEngine();
    extractor = new EnhancedContentExtractor();
    button = new FloatingActionButton();
    sessionManager = new ExtractionSessionManager();
    monitor = new PerformanceMonitor();

    // Mock window and chrome APIs
    global.window = {
      innerWidth: 1024,
      innerHeight: 768,
      location: { href: 'https://test.com/article' },
    } as any;

    global.chrome = {
      storage: { local: { set: vi.fn(), get: vi.fn() } },
      runtime: { getURL: vi.fn() },
    } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Content Analysis Performance', () => {
    it('should analyze small content (100-500 words) quickly', async () => {
      const content = generateTestContent(300);
      global.document = createMockDocument(content) as any;

      monitor.start();
      const result = await analysisEngine.analyzePageContent();
      const metrics = monitor.end();

      expect(result.wordCount).toBeGreaterThan(250);
      expect(metrics.duration).toBeLessThan(100); // Should complete in under 100ms
      expect(metrics.memoryDelta).toBeLessThan(1024 * 1024); // Less than 1MB memory increase
    });

    it('should analyze medium content (500-2000 words) efficiently', async () => {
      const content = generateTestContent(1000);
      global.document = createMockDocument(content) as any;

      monitor.start();
      const result = await analysisEngine.analyzePageContent();
      const metrics = monitor.end();

      expect(result.wordCount).toBeGreaterThan(900);
      expect(metrics.duration).toBeLessThan(300); // Should complete in under 300ms
      expect(metrics.memoryDelta).toBeLessThan(2 * 1024 * 1024); // Less than 2MB memory increase
    });

    it('should handle large content (2000+ words) within acceptable limits', async () => {
      const content = generateTestContent(5000);
      global.document = createMockDocument(content) as any;

      monitor.start();
      const result = await analysisEngine.analyzePageContent();
      const metrics = monitor.end();

      expect(result.wordCount).toBeGreaterThan(4500);
      expect(metrics.duration).toBeLessThan(1000); // Should complete in under 1 second
      expect(metrics.memoryDelta).toBeLessThan(5 * 1024 * 1024); // Less than 5MB memory increase
    });

    it('should maintain performance with repeated analysis', async () => {
      const content = generateTestContent(500);
      global.document = createMockDocument(content) as any;

      const durations: number[] = [];
      
      // Perform 10 consecutive analyses
      for (let i = 0; i < 10; i++) {
        monitor.start();
        await analysisEngine.analyzePageContent();
        const metrics = monitor.end();
        durations.push(metrics.duration);
      }

      // Performance should not degrade significantly
      const firstDuration = durations[0];
      const lastDuration = durations[durations.length - 1];
      expect(lastDuration).toBeLessThan(firstDuration * 2); // No more than 2x slower

      // Average duration should be reasonable
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      expect(avgDuration).toBeLessThan(200);
    });
  });

  describe('Content Extraction Performance', () => {
    it('should extract content efficiently across different sizes', async () => {
      const testSizes = [100, 500, 1000, 2000, 5000];
      const results: { size: number; duration: number; memoryDelta: number }[] = [];

      for (const size of testSizes) {
        const content = generateTestContent(size);
        global.document = createMockDocument(content) as any;

        monitor.start();
        const extracted = await extractor.extractPageContent();
        const metrics = monitor.end();

        results.push({
          size,
          duration: metrics.duration,
          memoryDelta: metrics.memoryDelta,
        });

        expect(extracted.text).toBeTruthy();
        expect(extracted.quality.wordCount).toBeGreaterThan(size * 0.8); // Allow for some variance
      }

      // Performance should scale reasonably with content size
      results.forEach((result, index) => {
        if (index > 0) {
          const prevResult = results[index - 1];
          const sizeRatio = result.size / prevResult.size;
          const durationRatio = result.duration / prevResult.duration;
          
          // Duration should not increase more than 3x the size ratio
          expect(durationRatio).toBeLessThan(sizeRatio * 3);
        }
      });
    });

    it('should handle concurrent extractions efficiently', async () => {
      const concurrentCount = 5;
      const content = generateTestContent(1000);
      
      monitor.start();
      
      const promises = Array.from({ length: concurrentCount }, async (_, i) => {
        global.document = createMockDocument(content + ` variant ${i}`) as any;
        return extractor.extractPageContent();
      });

      const results = await Promise.all(promises);
      const metrics = monitor.end();

      // All extractions should succeed
      expect(results).toHaveLength(concurrentCount);
      results.forEach(result => {
        expect(result.text).toBeTruthy();
      });

      // Concurrent execution should be more efficient than sequential
      expect(metrics.duration).toBeLessThan(concurrentCount * 500); // Less than 500ms per extraction
    });

    it('should clean up resources after extraction', async () => {
      const content = generateTestContent(2000);
      global.document = createMockDocument(content) as any;

      const initialMemory = monitor.getMemoryUsage();
      
      // Perform multiple extractions
      for (let i = 0; i < 5; i++) {
        await extractor.extractPageContent();
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));

      const finalMemory = monitor.getMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be minimal after cleanup
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
    });
  });

  describe('UI Performance', () => {
    it('should show/hide button quickly', async () => {
      monitor.start();
      
      button.show();
      expect(button.isVisible()).toBe(true);
      
      button.hide();
      expect(button.isVisible()).toBe(false);
      
      const metrics = monitor.end();
      expect(metrics.duration).toBeLessThan(50); // Should be nearly instantaneous
    });

    it('should handle drag operations smoothly', async () => {
      button.show();
      
      const dragEvents = Array.from({ length: 100 }, (_, i) => ({
        clientX: 100 + i,
        clientY: 100 + i,
        type: 'mousemove',
      }));

      monitor.start();
      
      button.startDrag({ clientX: 100, clientY: 100 } as MouseEvent);
      
      for (const event of dragEvents) {
        button.handleDrag(event as MouseEvent);
      }
      
      button.endDrag();
      
      const metrics = monitor.end();
      
      // Drag handling should be smooth
      expect(metrics.duration).toBeLessThan(200); // 100 drag events in under 200ms
    });

    it('should animate state changes efficiently', async () => {
      button.show();
      
      const stateChanges = [
        () => button.setLoadingState(true),
        () => button.setProgressState(25),
        () => button.setProgressState(50),
        () => button.setProgressState(75),
        () => button.setProgressState(100),
        () => button.showSuccess(),
        () => button.setLoadingState(false),
      ];

      monitor.start();
      
      for (const change of stateChanges) {
        change();
        // Small delay to simulate real usage
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      const metrics = monitor.end();
      
      // State changes should be smooth
      expect(metrics.duration).toBeLessThan(300);
    });
  });

  describe('Session Management Performance', () => {
    it('should handle multiple concurrent sessions efficiently', async () => {
      const sessionCount = 10;
      
      monitor.start();
      
      const sessions = Array.from({ length: sessionCount }, (_, i) => 
        sessionManager.startSession(`https://test${i}.com/article`)
      );

      // Simulate session activities
      for (const session of sessions) {
        sessionManager.updateSessionProgress(session.sessionId, 50);
        sessionManager.updateSessionProgress(session.sessionId, 100);
        sessionManager.completeSession(session.sessionId);
      }
      
      const metrics = monitor.end();
      
      expect(metrics.duration).toBeLessThan(100); // Should handle 10 sessions quickly
      expect(sessionManager.getActiveSessions()).toHaveLength(0); // All completed
    });

    it('should clean up old sessions automatically', async () => {
      // Create many sessions
      const sessions = Array.from({ length: 50 }, (_, i) => 
        sessionManager.startSession(`https://test${i}.com/article`)
      );

      // Complete them
      sessions.forEach(session => {
        sessionManager.completeSession(session.sessionId);
      });

      monitor.start();
      
      // Trigger cleanup
      sessionManager.cleanupOldSessions();
      
      const metrics = monitor.end();
      
      expect(metrics.duration).toBeLessThan(50); // Cleanup should be fast
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory during normal operation', async () => {
      const initialMemory = monitor.getMemoryUsage();
      
      // Simulate normal usage pattern
      for (let i = 0; i < 20; i++) {
        const content = generateTestContent(500);
        global.document = createMockDocument(content) as any;
        
        // Full extraction cycle
        await analysisEngine.analyzePageContent();
        const extracted = await extractor.extractPageContent();
        
        // UI interactions
        button.show();
        button.setLoadingState(true);
        button.setProgressState(100);
        button.showSuccess();
        button.hide();
        
        // Session management
        const session = sessionManager.startSession(`https://test${i}.com`);
        sessionManager.completeSession(session.sessionId);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      await new Promise(resolve => setTimeout(resolve, 100));
      
      const finalMemory = monitor.getMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable for 20 operations
      expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024); // Less than 20MB total
    });

    it('should handle memory pressure gracefully', async () => {
      // Simulate memory pressure by creating large content
      const largeContent = generateTestContent(10000);
      
      monitor.start();
      
      try {
        global.document = createMockDocument(largeContent) as any;
        
        const result = await analysisEngine.analyzePageContent();
        const extracted = await extractor.extractPageContent();
        
        expect(result).toBeTruthy();
        expect(extracted).toBeTruthy();
        
        const metrics = monitor.end();
        
        // Should complete even with large content
        expect(metrics.duration).toBeLessThan(2000); // 2 seconds max
        
      } catch (error) {
        // If memory pressure causes failure, it should be handled gracefully
        expect(error.message).toContain('memory');
      }
    });
  });

  describe('Scalability Tests', () => {
    it('should maintain performance with increasing page complexity', async () => {
      const complexityLevels = [
        { elements: 10, nesting: 2 },
        { elements: 50, nesting: 3 },
        { elements: 100, nesting: 4 },
        { elements: 200, nesting: 5 },
      ];

      const results: { complexity: number; duration: number }[] = [];

      for (const level of complexityLevels) {
        // Create complex DOM structure
        const complexContent = Array.from({ length: level.elements }, (_, i) => 
          `<div class="level-${i % level.nesting}">Content ${i}</div>`
        ).join('');

        global.document = createMockDocument(complexContent) as any;
        
        monitor.start();
        await analysisEngine.analyzePageContent();
        const metrics = monitor.end();

        results.push({
          complexity: level.elements,
          duration: metrics.duration,
        });
      }

      // Performance should degrade gracefully with complexity
      results.forEach((result, index) => {
        if (index > 0) {
          const prevResult = results[index - 1];
          const complexityRatio = result.complexity / prevResult.complexity;
          const durationRatio = result.duration / prevResult.duration;
          
          // Duration should not increase more than 2x the complexity ratio
          expect(durationRatio).toBeLessThan(complexityRatio * 2);
        }
      });
    });

    it('should handle rapid successive operations', async () => {
      const operationCount = 50;
      const content = generateTestContent(200);
      global.document = createMockDocument(content) as any;

      monitor.start();
      
      // Rapid successive analyses
      const promises = Array.from({ length: operationCount }, () => 
        analysisEngine.analyzePageContent()
      );

      const results = await Promise.all(promises);
      const metrics = monitor.end();

      // All operations should succeed
      expect(results).toHaveLength(operationCount);
      results.forEach(result => {
        expect(result.wordCount).toBeGreaterThan(0);
      });

      // Should handle rapid operations efficiently
      expect(metrics.duration).toBeLessThan(operationCount * 20); // Less than 20ms per operation
    });
  });
});