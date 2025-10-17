/**
 * Integration Tests for Extract from Page Button Feature
 * 
 * Tests the complete end-to-end flow from button display to lesson generation,
 * cross-site compatibility, error handling, and performance metrics.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContentAnalysisEngine } from '@/lib/content-analysis-engine';
import { EnhancedContentExtractor } from '@/lib/enhanced-content-extractor';
import { LessonInterfaceBridge } from '@/lib/lesson-interface-bridge';
import { ExtractionSessionManager } from '@/lib/extraction-session-manager';
import { PrivacyManager } from '@/lib/privacy-manager';
import { ExtractButtonIntegration } from '@/lib/extract-button-integration';

// Mock DOM environment for testing
const mockDocument = {
  createElement: vi.fn(),
  body: { appendChild: vi.fn(), removeChild: vi.fn() },
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

const mockWindow = {
  innerWidth: 1024,
  innerHeight: 768,
  location: { href: 'https://example.com/article' },
  chrome: {
    storage: {
      local: {
        set: vi.fn(),
        get: vi.fn(),
      },
    },
    runtime: {
      getURL: vi.fn(),
    },
    tabs: {
      create: vi.fn(),
    },
  },
};

// Test data for different site types
const testSites = {
  news: {
    url: 'https://bbc.com/news/article',
    content: `
      <article>
        <h1>Breaking News: Important Event</h1>
        <p>This is a news article with substantial content for testing. It contains multiple paragraphs with educational value.</p>
        <p>The article discusses important topics that would be suitable for language learning lessons.</p>
        <p>It has proper structure with headings and paragraphs that make it ideal for content extraction.</p>
      </article>
    `,
    expectedType: 'news',
    expectedWordCount: 45,
  },
  educational: {
    url: 'https://wikipedia.org/wiki/topic',
    content: `
      <div class="mw-content-text">
        <h1>Educational Topic</h1>
        <p>This is an educational article from Wikipedia with comprehensive information about a specific topic.</p>
        <h2>Overview</h2>
        <p>The overview section provides detailed background information that would be valuable for language learners.</p>
        <h2>Details</h2>
        <p>This section contains more specific information with technical vocabulary and complex sentence structures.</p>
      </div>
    `,
    expectedType: 'encyclopedia',
    expectedWordCount: 52,
  },
  blog: {
    url: 'https://medium.com/@author/post',
    content: `
      <article>
        <h1>How to Learn Languages Effectively</h1>
        <p>Learning a new language can be challenging but rewarding. This blog post explores effective strategies.</p>
        <p>First, immersion is key. Try to surround yourself with the language as much as possible.</p>
        <p>Second, practice regularly. Consistency is more important than intensity when learning languages.</p>
        <p>Finally, don't be afraid to make mistakes. They are an essential part of the learning process.</p>
      </article>
    `,
    expectedType: 'blog',
    expectedWordCount: 68,
  },
  ecommerce: {
    url: 'https://amazon.com/product/123',
    content: `
      <div class="product-page">
        <h1>Product Name</h1>
        <div class="price">$29.99</div>
        <button>Add to Cart</button>
        <div class="reviews">Customer reviews...</div>
      </div>
    `,
    expectedType: 'ecommerce',
    expectedWordCount: 8,
  },
};

describe('Extract from Page Integration Tests', () => {
  let analysisEngine: ContentAnalysisEngine;
  let extractor: EnhancedContentExtractor;
  let bridge: LessonInterfaceBridge;
  let sessionManager: ExtractionSessionManager;
  let privacyManager: PrivacyManager;
  let integration: ExtractButtonIntegration;

  beforeEach(() => {
    // Setup test environment
    global.document = mockDocument as any;
    global.window = mockWindow as any;
    global.chrome = mockWindow.chrome as any;

    // Initialize components
    analysisEngine = new ContentAnalysisEngine();
    extractor = new EnhancedContentExtractor();
    bridge = new LessonInterfaceBridge();
    sessionManager = new ExtractionSessionManager();
    privacyManager = new PrivacyManager();
    integration = new ExtractButtonIntegration();

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup
    vi.restoreAllMocks();
  });

  describe('End-to-End Extraction Flow', () => {
    it('should complete full extraction flow from button click to lesson interface', async () => {
      // Setup: Mock a suitable page
      const mockContent = testSites.educational.content;
      mockDocument.querySelector.mockReturnValue({
        textContent: 'Educational article content with sufficient words for extraction...',
        innerHTML: mockContent,
      });

      // Step 1: Page analysis should show button
      const analysisResult = await analysisEngine.analyzePageContent();
      expect(analysisResult.wordCount).toBeGreaterThan(200);
      expect(analysisResult.isEducational).toBe(true);

      const shouldShow = analysisEngine.isContentSuitable(analysisResult);
      expect(shouldShow).toBe(true);

      // Step 2: Button should be displayed
      button.show();
      expect(button.isVisible()).toBe(true);

      // Step 3: User clicks extract button
      const extractionPromise = integration.handleExtractClick();

      // Step 4: Content extraction should succeed
      const extractedContent = await extractor.extractPageContent();
      expect(extractedContent.text).toBeTruthy();
      expect(extractedContent.metadata.sourceUrl).toBe(mockWindow.location.href);

      // Step 5: Content validation should pass
      const validation = extractor.validateContent(extractedContent);
      expect(validation.isValid).toBe(true);

      // Step 6: Lesson interface should open with pre-populated content
      await bridge.openLessonInterface(extractedContent);
      expect(mockWindow.chrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          extractedContent: expect.any(Object),
          extractionSource: 'webpage',
        })
      );

      // Step 7: Session should be tracked
      const session = sessionManager.getCurrentSession();
      expect(session).toBeTruthy();
      expect(session?.status).toBe('complete');
    });

    it('should handle extraction confirmation dialog', async () => {
      const mockContent = testSites.news.content;
      mockDocument.querySelector.mockReturnValue({
        textContent: 'News article content...',
        innerHTML: mockContent,
      });

      const extractedContent = await extractor.extractPageContent();
      
      // Mock user confirmation
      const confirmationSpy = vi.spyOn(bridge, 'showExtractionConfirmation')
        .mockResolvedValue(true);

      await bridge.openLessonInterface(extractedContent);
      
      expect(confirmationSpy).toHaveBeenCalledWith(extractedContent);
    });

    it('should handle user cancellation in confirmation dialog', async () => {
      const mockContent = testSites.blog.content;
      mockDocument.querySelector.mockReturnValue({
        textContent: 'Blog content...',
        innerHTML: mockContent,
      });

      const extractedContent = await extractor.extractPageContent();
      
      // Mock user cancellation
      vi.spyOn(bridge, 'showExtractionConfirmation')
        .mockResolvedValue(false);

      const result = await bridge.openLessonInterface(extractedContent);
      
      expect(result).toBe(false);
      expect(mockWindow.chrome.storage.local.set).not.toHaveBeenCalled();
    });
  });

  describe('Cross-Site Compatibility', () => {
    it('should work correctly on news sites (BBC, CNN, Reuters)', async () => {
      const newsSites = [
        'https://bbc.com/news/article',
        'https://cnn.com/news/story',
        'https://reuters.com/article',
      ];

      for (const url of newsSites) {
        mockWindow.location.href = url;
        mockDocument.querySelector.mockReturnValue({
          textContent: testSites.news.content,
          innerHTML: testSites.news.content,
        });

        const analysisResult = await analysisEngine.analyzePageContent();
        expect(analysisResult.contentType).toBe('news');
        expect(analysisResult.isEducational).toBe(true);

        const extractedContent = await extractor.extractPageContent();
        expect(extractedContent.metadata.sourceUrl).toBe(url);
        expect(extractedContent.suggestedLessonType).toBe('discussion');
      }
    });

    it('should work correctly on educational sites (Wikipedia, Khan Academy)', async () => {
      const educationalSites = [
        'https://wikipedia.org/wiki/topic',
        'https://khanacademy.org/lesson',
        'https://coursera.org/course',
      ];

      for (const url of educationalSites) {
        mockWindow.location.href = url;
        mockDocument.querySelector.mockReturnValue({
          textContent: testSites.educational.content,
          innerHTML: testSites.educational.content,
        });

        const analysisResult = await analysisEngine.analyzePageContent();
        expect(analysisResult.contentType).toBe('encyclopedia');
        expect(analysisResult.isEducational).toBe(true);

        const extractedContent = await extractor.extractPageContent();
        expect(extractedContent.metadata.sourceUrl).toBe(url);
        expect(['discussion', 'grammar']).toContain(extractedContent.suggestedLessonType);
      }
    });

    it('should work correctly on blog platforms (Medium, WordPress)', async () => {
      const blogSites = [
        'https://medium.com/@author/post',
        'https://wordpress.com/blog/post',
        'https://blogger.com/post',
      ];

      for (const url of blogSites) {
        mockWindow.location.href = url;
        mockDocument.querySelector.mockReturnValue({
          textContent: testSites.blog.content,
          innerHTML: testSites.blog.content,
        });

        const analysisResult = await analysisEngine.analyzePageContent();
        expect(analysisResult.contentType).toBe('blog');
        expect(analysisResult.isEducational).toBe(true);

        const extractedContent = await extractor.extractPageContent();
        expect(extractedContent.metadata.sourceUrl).toBe(url);
        expect(extractedContent.suggestedLessonType).toBe('discussion');
      }
    });

    it('should correctly exclude e-commerce and social media sites', async () => {
      const excludedSites = [
        'https://amazon.com/product/123',
        'https://facebook.com/post',
        'https://twitter.com/status',
        'https://instagram.com/post',
      ];

      for (const url of excludedSites) {
        mockWindow.location.href = url;
        mockDocument.querySelector.mockReturnValue({
          textContent: testSites.ecommerce.content,
          innerHTML: testSites.ecommerce.content,
        });

        const analysisResult = await analysisEngine.analyzePageContent();
        expect(analysisResult.isEducational).toBe(false);
        
        const shouldShow = analysisEngine.isContentSuitable(analysisResult);
        expect(shouldShow).toBe(false);
      }
    });
  });

  describe('Error Handling and Recovery Scenarios', () => {
    it('should handle insufficient content gracefully', async () => {
      mockDocument.querySelector.mockReturnValue({
        textContent: 'Short content',
        innerHTML: '<p>Short content</p>',
      });

      const analysisResult = await analysisEngine.analyzePageContent();
      expect(analysisResult.wordCount).toBeLessThan(200);

      const shouldShow = analysisEngine.isContentSuitable(analysisResult);
      expect(shouldShow).toBe(false);

      // Button should not be displayed
      const buttonVisible = button.isVisible();
      expect(buttonVisible).toBe(false);
    });

    it('should handle content extraction failures', async () => {
      mockDocument.querySelector.mockReturnValue(null);

      try {
        await extractor.extractPageContent();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeTruthy();
        expect(error.message).toContain('extraction failed');
      }

      // Should show error state in button
      button.showError('Content extraction failed');
      expect(button.getState().error).toBeTruthy();
    });

    it('should handle network errors during lesson interface opening', async () => {
      const extractedContent = await extractor.extractPageContent();
      
      // Mock network failure
      mockWindow.chrome.storage.local.set.mockRejectedValue(new Error('Network error'));

      try {
        await bridge.openLessonInterface(extractedContent);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Network error');
      }
    });

    it('should provide retry mechanisms for failed extractions', async () => {
      let attemptCount = 0;
      const mockExtract = vi.spyOn(extractor, 'extractPageContent')
        .mockImplementation(async () => {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error('Temporary failure');
          }
          return {
            text: 'Successfully extracted content',
            metadata: { sourceUrl: mockWindow.location.href },
          } as any;
        });

      // Should retry and eventually succeed
      const result = await integration.handleExtractClickWithRetry();
      expect(result).toBeTruthy();
      expect(attemptCount).toBe(3);
    });

    it('should handle privacy manager restrictions', async () => {
      // Mock robots.txt restriction
      vi.spyOn(privacyManager, 'canExtractFromDomain').mockReturnValue(false);

      const canExtract = privacyManager.canExtractFromDomain('restricted-site.com');
      expect(canExtract).toBe(false);

      // Should show appropriate error message
      button.showError('Content extraction not allowed on this site');
      expect(button.getState().error).toContain('not allowed');
    });

    it('should handle unsupported languages', async () => {
      mockDocument.querySelector.mockReturnValue({
        textContent: 'Contenu en français qui n\'est pas supporté',
        innerHTML: '<p>Contenu en français qui n\'est pas supporté</p>',
      });

      const analysisResult = await analysisEngine.analyzePageContent();
      expect(analysisResult.language).toBe('fr');
      
      const shouldShow = analysisEngine.isContentSuitable(analysisResult);
      expect(shouldShow).toBe(false);
    });
  });

  describe('Performance Tests', () => {
    it('should analyze page content within acceptable time limits', async () => {
      const startTime = performance.now();
      
      // Mock large page content
      const largeContent = 'word '.repeat(5000);
      mockDocument.querySelector.mockReturnValue({
        textContent: largeContent,
        innerHTML: `<div>${largeContent}</div>`,
      });

      await analysisEngine.analyzePageContent();
      
      const endTime = performance.now();
      const analysisTime = endTime - startTime;
      
      // Analysis should complete within 500ms
      expect(analysisTime).toBeLessThan(500);
    });

    it('should extract content within acceptable time limits', async () => {
      const startTime = performance.now();
      
      mockDocument.querySelector.mockReturnValue({
        textContent: testSites.educational.content,
        innerHTML: testSites.educational.content,
      });

      await extractor.extractPageContent();
      
      const endTime = performance.now();
      const extractionTime = endTime - startTime;
      
      // Extraction should complete within 1000ms
      expect(extractionTime).toBeLessThan(1000);
    });

    it('should maintain reasonable memory usage during extraction', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Perform multiple extractions
      for (let i = 0; i < 10; i++) {
        mockDocument.querySelector.mockReturnValue({
          textContent: testSites.blog.content,
          innerHTML: testSites.blog.content,
        });
        
        await extractor.extractPageContent();
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should handle concurrent extraction requests efficiently', async () => {
      const startTime = performance.now();
      
      // Create multiple concurrent extraction requests
      const promises = Array.from({ length: 5 }, async (_, i) => {
        mockDocument.querySelector.mockReturnValue({
          textContent: `Content ${i}: ${testSites.news.content}`,
          innerHTML: testSites.news.content,
        });
        
        return extractor.extractPageContent();
      });

      const results = await Promise.all(promises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // All extractions should complete
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.text).toBeTruthy();
      });
      
      // Should complete within reasonable time (2 seconds for 5 concurrent requests)
      expect(totalTime).toBeLessThan(2000);
    });

    it('should clean up resources after extraction completion', async () => {
      const session = sessionManager.startSession('test-url');
      
      mockDocument.querySelector.mockReturnValue({
        textContent: testSites.educational.content,
        innerHTML: testSites.educational.content,
      });

      await extractor.extractPageContent();
      sessionManager.completeSession(session.sessionId);
      
      // Session should be cleaned up
      const currentSession = sessionManager.getCurrentSession();
      expect(currentSession?.status).toBe('complete');
      
      // Memory should be released
      expect(sessionManager.getActiveSessions()).toHaveLength(0);
    });
  });

  describe('Cross-Browser Compatibility', () => {
    it('should work with different Chrome extension APIs', async () => {
      // Test with different API versions
      const apiVersions = [
        { version: 'mv2', tabs: { create: vi.fn() } },
        { version: 'mv3', action: { openPopup: vi.fn() } },
      ];

      for (const api of apiVersions) {
        global.chrome = { ...mockWindow.chrome, ...api } as any;
        
        const extractedContent = await extractor.extractPageContent();
        await bridge.openLessonInterface(extractedContent);
        
        // Should work with both API versions
        expect(mockWindow.chrome.storage.local.set).toHaveBeenCalled();
      }
    });

    it('should adapt to different viewport sizes', async () => {
      const viewports = [
        { width: 320, height: 568 }, // Mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1920, height: 1080 }, // Desktop
      ];

      for (const viewport of viewports) {
        mockWindow.innerWidth = viewport.width;
        mockWindow.innerHeight = viewport.height;
        
        button.show();
        const position = button.calculateOptimalPosition();
        
        // Button should be positioned appropriately for each viewport
        expect(position.x).toBeGreaterThan(0);
        expect(position.y).toBeGreaterThan(0);
        expect(position.x).toBeLessThan(viewport.width);
        expect(position.y).toBeLessThan(viewport.height);
      }
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain accessibility during extraction flow', async () => {
      button.show();
      
      // Should have proper ARIA labels
      expect(button.getAriaLabel()).toBeTruthy();
      expect(button.getAriaDescription()).toBeTruthy();
      
      // Should support keyboard navigation
      const keyboardEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      button.handleKeyboardActivation(keyboardEvent);
      
      expect(button.isKeyboardAccessible()).toBe(true);
    });

    it('should provide screen reader announcements during extraction', async () => {
      const announcements: string[] = [];
      const mockAnnounce = vi.fn((message: string) => {
        announcements.push(message);
      });
      
      button.setScreenReaderAnnouncer(mockAnnounce);
      
      // Simulate extraction flow
      button.setLoadingState(true);
      button.setProgressState(50);
      button.showSuccess();
      
      expect(announcements).toContain('Content extraction started');
      expect(announcements).toContain('Extraction 50% complete');
      expect(announcements).toContain('Content extracted successfully');
    });
  });
});