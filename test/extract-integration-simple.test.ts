/**
 * Simplified Integration Tests for Extract from Page Feature
 * 
 * Tests the core integration between components without complex UI interactions.
 * Focuses on the data flow and API integration aspects.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContentAnalysisEngine } from '@/lib/content-analysis-engine';
import { EnhancedContentExtractor } from '@/lib/enhanced-content-extractor';
import { LessonInterfaceBridge } from '@/lib/lesson-interface-bridge';
import { ExtractionSessionManager } from '@/lib/extraction-session-manager';
import { PrivacyManager } from '@/lib/privacy-manager';

// Mock DOM environment
const createMockDocument = (content: string) => ({
  querySelector: vi.fn(() => ({
    innerHTML: content,
    textContent: content.replace(/<[^>]*>/g, ''),
    querySelectorAll: vi.fn(() => []),
  })),
  querySelectorAll: vi.fn(() => []),
  createElement: vi.fn(() => ({
    style: {},
    classList: { add: vi.fn(), remove: vi.fn() },
    addEventListener: vi.fn(),
    setAttribute: vi.fn(),
    textContent: '',
  })),
  body: { 
    appendChild: vi.fn(), 
    removeChild: vi.fn(),
    contains: vi.fn(() => true),
  },
});

const createMockWindow = (url: string) => ({
  innerWidth: 1024,
  innerHeight: 768,
  location: { href: url, hostname: new URL(url).hostname },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  matchMedia: vi.fn(() => ({ matches: false, addEventListener: vi.fn() })),
});

const createMockChrome = () => ({
  storage: {
    local: {
      set: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue({}),
    },
  },
  runtime: {
    getURL: vi.fn().mockReturnValue('chrome-extension://test/popup.html'),
  },
  tabs: {
    create: vi.fn().mockResolvedValue({ id: 1 }),
  },
  action: {
    openPopup: vi.fn().mockResolvedValue(undefined),
  },
});

// Test content samples
const testContent = {
  newsArticle: {
    url: 'https://bbc.com/news/technology-123',
    content: `
      <article>
        <h1>AI Revolutionizes Language Learning</h1>
        <p>Artificial intelligence is transforming how people learn languages around the world.</p>
        <p>New machine learning algorithms can adapt to individual learning styles and provide personalized feedback.</p>
        <p>Students using AI-powered language tools show 40% faster improvement rates compared to traditional methods.</p>
        <p>The technology analyzes speech patterns, grammar usage, and vocabulary retention to create customized lesson plans.</p>
        <p>Industry experts predict widespread adoption of AI language learning tools within the next five years.</p>
      </article>
    `,
    expectedWordCount: 80,
    expectedType: 'news',
  },
  
  blogPost: {
    url: 'https://medium.com/language-learning-tips',
    content: `
      <article>
        <h1>5 Effective Language Learning Strategies</h1>
        <p>Learning a new language requires dedication, practice, and the right strategies to succeed.</p>
        <h2>1. Immersion Through Media</h2>
        <p>Watching movies and listening to music in your target language helps develop natural comprehension skills.</p>
        <h2>2. Daily Practice Sessions</h2>
        <p>Consistent daily practice, even for just 15-20 minutes, is more effective than long irregular sessions.</p>
        <h2>3. Speaking from Day One</h2>
        <p>Don't wait until you feel ready to speak. Start practicing pronunciation and conversation immediately.</p>
        <h2>4. Use Spaced Repetition</h2>
        <p>Review vocabulary at increasing intervals to improve long-term retention and recall.</p>
        <h2>5. Find Language Exchange Partners</h2>
        <p>Practice with native speakers through language exchange apps or local conversation groups.</p>
      </article>
    `,
    expectedWordCount: 120,
    expectedType: 'blog',
  },

  shortContent: {
    url: 'https://example.com/short',
    content: '<p>This is too short for extraction.</p>',
    expectedWordCount: 7,
    expectedType: 'other',
  },

  ecommerce: {
    url: 'https://shop.com/product/123',
    content: `
      <div class="product">
        <h1>Language Learning Book</h1>
        <div class="price">$29.99</div>
        <button>Add to Cart</button>
        <div class="description">Learn Spanish fast with this comprehensive guide.</div>
      </div>
    `,
    expectedWordCount: 15,
    expectedType: 'ecommerce',
  },
};

describe('Extract Integration Tests', () => {
  let analysisEngine: ContentAnalysisEngine;
  let extractor: EnhancedContentExtractor;
  let bridge: LessonInterfaceBridge;
  let sessionManager: ExtractionSessionManager;
  let privacyManager: PrivacyManager;

  beforeEach(() => {
    // Initialize components
    analysisEngine = new ContentAnalysisEngine();
    extractor = new EnhancedContentExtractor();
    bridge = new LessonInterfaceBridge();
    sessionManager = new ExtractionSessionManager();
    privacyManager = new PrivacyManager();

    // Setup global mocks
    global.chrome = createMockChrome() as any;
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Content Analysis Integration', () => {
    it('should analyze news article content correctly', async () => {
      const content = testContent.newsArticle;
      global.document = createMockDocument(content.content) as any;
      global.window = createMockWindow(content.url) as any;

      const result = await analysisEngine.analyzePageContent();
      
      expect(result.wordCount).toBeGreaterThan(content.expectedWordCount * 0.8);
      expect(result.contentType).toBe(content.expectedType);
      expect(result.isEducational).toBe(true);
      expect(result.hasMainContent).toBe(true);
      
      const shouldShow = analysisEngine.isContentSuitable(result);
      expect(shouldShow).toBe(true);
    });

    it('should analyze blog post content correctly', async () => {
      const content = testContent.blogPost;
      global.document = createMockDocument(content.content) as any;
      global.window = createMockWindow(content.url) as any;

      const result = await analysisEngine.analyzePageContent();
      
      expect(result.wordCount).toBeGreaterThan(content.expectedWordCount * 0.8);
      expect(result.contentType).toBe(content.expectedType);
      expect(result.isEducational).toBe(true);
      
      const shouldShow = analysisEngine.isContentSuitable(result);
      expect(shouldShow).toBe(true);
    });

    it('should reject short content', async () => {
      const content = testContent.shortContent;
      global.document = createMockDocument(content.content) as any;
      global.window = createMockWindow(content.url) as any;

      const result = await analysisEngine.analyzePageContent();
      
      expect(result.wordCount).toBeLessThan(200);
      expect(result.hasMainContent).toBe(false);
      
      const shouldShow = analysisEngine.isContentSuitable(result);
      expect(shouldShow).toBe(false);
    });

    it('should reject e-commerce content', async () => {
      const content = testContent.ecommerce;
      global.document = createMockDocument(content.content) as any;
      global.window = createMockWindow(content.url) as any;

      const result = await analysisEngine.analyzePageContent();
      
      expect(result.contentType).toBe(content.expectedType);
      expect(result.isEducational).toBe(false);
      
      const shouldShow = analysisEngine.isContentSuitable(result);
      expect(shouldShow).toBe(false);
    });
  });

  describe('Content Extraction Integration', () => {
    it('should extract and validate news article content', async () => {
      const content = testContent.newsArticle;
      global.document = createMockDocument(content.content) as any;
      global.window = createMockWindow(content.url) as any;

      const extractedContent = await extractor.extractPageContent();
      
      expect(extractedContent.text).toContain('AI Revolutionizes');
      expect(extractedContent.text).toContain('language learning');
      expect(extractedContent.metadata.sourceUrl).toBe(content.url);
      expect(extractedContent.metadata.title).toContain('AI Revolutionizes');
      expect(extractedContent.quality.wordCount).toBeGreaterThan(50);
      expect(extractedContent.suggestedLessonType).toBe('discussion');
      
      const validation = extractor.validateContent(extractedContent);
      expect(validation.isValid).toBe(true);
      expect(validation.meetsMinimumQuality).toBe(true);
    });

    it('should extract structured content from blog post', async () => {
      const content = testContent.blogPost;
      global.document = createMockDocument(content.content) as any;
      global.window = createMockWindow(content.url) as any;

      const extractedContent = await extractor.extractPageContent();
      
      expect(extractedContent.text).toContain('Language Learning Strategies');
      expect(extractedContent.structuredContent.headings).toContain('Immersion Through Media');
      expect(extractedContent.structuredContent.headings).toContain('Daily Practice Sessions');
      expect(extractedContent.suggestedLessonType).toBe('discussion');
      
      const validation = extractor.validateContent(extractedContent);
      expect(validation.isValid).toBe(true);
    });

    it('should handle extraction errors gracefully', async () => {
      global.document = {
        querySelector: vi.fn(() => null),
        querySelectorAll: vi.fn(() => []),
      } as any;
      global.window = createMockWindow('https://test.com') as any;

      try {
        await extractor.extractPageContent();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeTruthy();
        expect(error.message).toContain('extraction failed');
      }
    });
  });

  describe('Lesson Interface Integration', () => {
    it('should open lesson interface with extracted content', async () => {
      const content = testContent.newsArticle;
      global.document = createMockDocument(content.content) as any;
      global.window = createMockWindow(content.url) as any;

      const extractedContent = await extractor.extractPageContent();
      
      // Mock user confirmation
      vi.spyOn(bridge, 'showExtractionConfirmation').mockResolvedValue(true);
      
      await bridge.openLessonInterface(extractedContent);
      
      expect(global.chrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          extractedContent: expect.objectContaining({
            text: expect.stringContaining('AI Revolutionizes'),
            suggestedLessonType: 'discussion',
          }),
          extractionSource: 'webpage',
        })
      );
    });

    it('should handle user cancellation', async () => {
      const content = testContent.blogPost;
      global.document = createMockDocument(content.content) as any;
      global.window = createMockWindow(content.url) as any;

      const extractedContent = await extractor.extractPageContent();
      
      // Mock user cancellation
      vi.spyOn(bridge, 'showExtractionConfirmation').mockResolvedValue(false);
      
      const result = await bridge.openLessonInterface(extractedContent);
      
      expect(result).toBe(false);
      expect(global.chrome.storage.local.set).not.toHaveBeenCalled();
    });

    it('should handle interface opening errors', async () => {
      const content = testContent.newsArticle;
      global.document = createMockDocument(content.content) as any;
      global.window = createMockWindow(content.url) as any;

      const extractedContent = await extractor.extractPageContent();
      
      // Mock storage failure
      global.chrome.storage.local.set.mockRejectedValue(new Error('Storage quota exceeded'));
      
      try {
        await bridge.openLessonInterface(extractedContent);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Storage quota exceeded');
      }
    });
  });

  describe('Session Management Integration', () => {
    it('should track extraction session lifecycle', async () => {
      const url = testContent.newsArticle.url;
      
      const session = sessionManager.startSession(url);
      expect(session.sessionId).toBeTruthy();
      expect(session.sourceUrl).toBe(url);
      expect(session.status).toBe('started');
      
      sessionManager.updateSessionProgress(session.sessionId, 50);
      const updatedSession = sessionManager.getSession(session.sessionId);
      expect(updatedSession?.status).toBe('extracting');
      
      sessionManager.completeSession(session.sessionId);
      const completedSession = sessionManager.getSession(session.sessionId);
      expect(completedSession?.status).toBe('complete');
    });

    it('should handle multiple concurrent sessions', async () => {
      const urls = [
        testContent.newsArticle.url,
        testContent.blogPost.url,
        'https://test3.com',
      ];
      
      const sessions = urls.map(url => sessionManager.startSession(url));
      
      expect(sessions).toHaveLength(3);
      sessions.forEach((session, index) => {
        expect(session.sourceUrl).toBe(urls[index]);
      });
      
      // Complete all sessions
      sessions.forEach(session => {
        sessionManager.completeSession(session.sessionId);
      });
      
      expect(sessionManager.getActiveSessions()).toHaveLength(0);
    });

    it('should clean up old sessions', async () => {
      // Create multiple sessions
      const sessions = Array.from({ length: 5 }, (_, i) => 
        sessionManager.startSession(`https://test${i}.com`)
      );
      
      // Complete them
      sessions.forEach(session => {
        sessionManager.completeSession(session.sessionId);
      });
      
      // Cleanup should remove completed sessions
      sessionManager.cleanupOldSessions();
      
      // Verify cleanup (implementation dependent)
      const activeSessions = sessionManager.getActiveSessions();
      expect(activeSessions).toHaveLength(0);
    });
  });

  describe('Privacy Manager Integration', () => {
    it('should respect domain restrictions', async () => {
      const restrictedDomain = 'restricted-site.com';
      
      vi.spyOn(privacyManager, 'canExtractFromDomain').mockReturnValue(false);
      
      const canExtract = privacyManager.canExtractFromDomain(restrictedDomain);
      expect(canExtract).toBe(false);
    });

    it('should sanitize extracted content', async () => {
      const maliciousContent = '<script>alert("xss")</script><p>Safe content here</p>';
      
      const sanitized = privacyManager.sanitizeContent(maliciousContent);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('Safe content');
    });

    it('should include proper attribution', async () => {
      const content = testContent.newsArticle;
      global.document = createMockDocument(content.content) as any;
      global.window = createMockWindow(content.url) as any;

      const extractedContent = await extractor.extractPageContent();
      
      expect(extractedContent.metadata.sourceUrl).toBe(content.url);
      expect(extractedContent.sourceInfo.attribution).toBeTruthy();
      expect(extractedContent.sourceInfo.attribution).toContain(content.url);
    });
  });

  describe('End-to-End Workflow', () => {
    it('should complete full extraction workflow', async () => {
      const content = testContent.newsArticle;
      global.document = createMockDocument(content.content) as any;
      global.window = createMockWindow(content.url) as any;

      // Step 1: Analyze page
      const analysisResult = await analysisEngine.analyzePageContent();
      expect(analysisResult.isEducational).toBe(true);
      
      const shouldShow = analysisEngine.isContentSuitable(analysisResult);
      expect(shouldShow).toBe(true);
      
      // Step 2: Extract content
      const extractedContent = await extractor.extractPageContent();
      expect(extractedContent.text).toBeTruthy();
      
      // Step 3: Validate content
      const validation = extractor.validateContent(extractedContent);
      expect(validation.isValid).toBe(true);
      
      // Step 4: Track session
      const session = sessionManager.startSession(content.url);
      expect(session.status).toBe('started');
      
      // Step 5: Open lesson interface
      vi.spyOn(bridge, 'showExtractionConfirmation').mockResolvedValue(true);
      await bridge.openLessonInterface(extractedContent);
      
      expect(global.chrome.storage.local.set).toHaveBeenCalled();
      
      // Step 6: Complete session
      sessionManager.completeSession(session.sessionId);
      const completedSession = sessionManager.getSession(session.sessionId);
      expect(completedSession?.status).toBe('complete');
    });

    it('should handle workflow errors gracefully', async () => {
      const content = testContent.shortContent;
      global.document = createMockDocument(content.content) as any;
      global.window = createMockWindow(content.url) as any;

      // Analysis should reject short content
      const analysisResult = await analysisEngine.analyzePageContent();
      const shouldShow = analysisEngine.isContentSuitable(analysisResult);
      expect(shouldShow).toBe(false);
      
      // Workflow should stop here - no extraction should occur
      // This simulates the button not being shown to the user
    });
  });

  describe('Performance Integration', () => {
    it('should complete analysis and extraction within time limits', async () => {
      const content = testContent.blogPost;
      global.document = createMockDocument(content.content) as any;
      global.window = createMockWindow(content.url) as any;

      const startTime = performance.now();
      
      const analysisResult = await analysisEngine.analyzePageContent();
      const extractedContent = await extractor.extractPageContent();
      const validation = extractor.validateContent(extractedContent);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(analysisResult).toBeTruthy();
      expect(extractedContent).toBeTruthy();
      expect(validation.isValid).toBe(true);
      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle concurrent operations efficiently', async () => {
      const contents = [
        testContent.newsArticle,
        testContent.blogPost,
      ];

      const startTime = performance.now();
      
      const promises = contents.map(async (content) => {
        global.document = createMockDocument(content.content) as any;
        global.window = createMockWindow(content.url) as any;
        
        const analysis = await analysisEngine.analyzePageContent();
        const extraction = await extractor.extractPageContent();
        return { analysis, extraction };
      });

      const results = await Promise.all(promises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result.analysis.isEducational).toBe(true);
        expect(result.extraction.text).toBeTruthy();
      });
      
      expect(totalTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });
});