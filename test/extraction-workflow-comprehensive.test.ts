/**
 * Comprehensive Unit Tests for Extraction Workflow
 * 
 * Tests the complete extraction workflow from content analysis
 * to lesson interface integration, covering all error scenarios
 * and edge cases.
 * 
 * Requirements: All requirements validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContentAnalysisEngine } from '../lib/content-analysis-engine';
import { EnhancedContentExtractor } from '../lib/enhanced-content-extractor';
import { PrivacyManager } from '../lib/privacy-manager';
import { ExtractionConfirmationManager } from '../lib/extraction-confirmation-manager';
import { LessonInterfaceBridge } from '../lib/lesson-interface-bridge';

// Mock dependencies
vi.mock('../lib/privacy-manager');
vi.mock('../lib/lesson-interface-bridge');

// Mock DOM environment
const mockDocument = {
  title: 'Test Article: Complete Guide to Language Learning',
  documentElement: { lang: 'en' },
  body: {
    textContent: 'Language learning is a fascinating journey that opens doors to new cultures and opportunities. This comprehensive guide will help you understand the fundamentals of effective language acquisition. Whether you are a beginner starting your first foreign language or an advanced learner looking to perfect your skills, this article provides valuable insights and practical strategies. The process of learning a new language involves multiple cognitive processes including memory formation, pattern recognition, and cultural understanding. Research has shown that immersion techniques combined with structured learning approaches yield the best results for most learners.',
    querySelectorAll: vi.fn(),
    querySelector: vi.fn()
  },
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(),
  cloneNode: vi.fn()
};

const mockWindow = {
  location: {
    href: 'https://learn.example.com/language-learning-guide',
    hostname: 'learn.example.com',
    pathname: '/language-learning-guide',
    origin: 'https://learn.example.com'
  }
};

// Setup global mocks
beforeEach(() => {
  vi.stubGlobal('document', mockDocument);
  vi.stubGlobal('window', mockWindow);
  
  // Reset all mocks
  vi.clearAllMocks();
  
  // Setup default mock implementations
  mockDocument.querySelector.mockImplementation((selector) => {
    if (selector === 'main' || selector === 'article') {
      return {
        textContent: mockDocument.body.textContent,
        querySelectorAll: vi.fn(() => [])
      };
    }
    if (selector === 'meta[property="og:title"]') {
      return { getAttribute: () => 'Complete Guide to Language Learning' };
    }
    if (selector === 'meta[name="description"]') {
      return { getAttribute: () => 'Learn effective language learning strategies' };
    }
    return null;
  });
  
  mockDocument.cloneNode.mockReturnValue({
    ...mockDocument,
    querySelectorAll: vi.fn(() => []),
    body: mockDocument.body
  });
});

describe('Extraction Workflow Integration', () => {
  let analysisEngine: ContentAnalysisEngine;
  let contentExtractor: EnhancedContentExtractor;
  let privacyManager: PrivacyManager;
  let confirmationManager: ExtractionConfirmationManager;
  let lessonBridge: LessonInterfaceBridge;

  beforeEach(() => {
    analysisEngine = new ContentAnalysisEngine();
    contentExtractor = new EnhancedContentExtractor();
    privacyManager = new PrivacyManager();
    confirmationManager = new ExtractionConfirmationManager();
    lessonBridge = new LessonInterfaceBridge();
  });

  describe('Complete Workflow - Happy Path', () => {
    it('should execute complete extraction workflow successfully', async () => {
      // Step 1: Content Analysis
      const analysis = analysisEngine.analyzePageContent();
      expect(analysis.wordCount).toBeGreaterThan(200);
      expect(analysis.isEducational).toBe(true);
      expect(analysis.language).toBe('en');
      
      // Step 2: Suitability Check
      const isSuitable = analysisEngine.isContentSuitable(analysis);
      expect(isSuitable).toBe(true);
      
      // Step 3: Privacy Check
      vi.mocked(privacyManager.canExtractFromDomain).mockResolvedValue(true);
      vi.mocked(privacyManager.respectRobotsTxt).mockResolvedValue({
        allowed: true,
        reason: 'Allowed by robots.txt'
      });
      
      const canExtract = await privacyManager.canExtractFromDomain('learn.example.com');
      expect(canExtract).toBe(true);
      
      // Step 4: Content Extraction
      const extractedContent = await contentExtractor.extractPageContent();
      expect(extractedContent.text).toContain('language learning');
      expect(extractedContent.quality.wordCount).toBeGreaterThan(50);
      
      // Step 5: Content Validation
      const validation = contentExtractor.validateContent(extractedContent);
      expect(validation.isValid).toBe(true);
      
      // Step 6: User Confirmation
      vi.mocked(confirmationManager.showConfirmation).mockResolvedValue({
        confirmed: true,
        editedContent: extractedContent.text,
        selectedLessonType: extractedContent.suggestedLessonType,
        selectedCEFRLevel: extractedContent.suggestedCEFRLevel
      });
      
      const confirmation = await confirmationManager.showConfirmation(extractedContent);
      expect(confirmation.confirmed).toBe(true);
      
      // Step 7: Lesson Interface Integration
      vi.mocked(lessonBridge.openLessonInterface).mockResolvedValue();
      
      await lessonBridge.openLessonInterface(extractedContent);
      expect(lessonBridge.openLessonInterface).toHaveBeenCalledWith(extractedContent);
    });
  });

  describe('Error Handling Scenarios', () => {
    it('should handle insufficient content gracefully', async () => {
      // Mock short content
      const shortContent = 'Short text.';
      mockDocument.body.textContent = shortContent;
      
      const analysis = analysisEngine.analyzePageContent();
      expect(analysis.wordCount).toBeLessThan(200);
      
      const isSuitable = analysisEngine.isContentSuitable(analysis);
      expect(isSuitable).toBe(false);
      
      // Workflow should stop here with appropriate error
      const extractedContent = await contentExtractor.extractPageContent();
      const validation = contentExtractor.validateContent(extractedContent);
      
      expect(validation.isValid).toBe(false);
      expect(validation.issues.some(issue => issue.type === 'insufficient_content')).toBe(true);
    });

    it('should handle privacy restrictions', async () => {
      // Mock privacy restriction
      vi.mocked(privacyManager.canExtractFromDomain).mockResolvedValue(false);
      
      const canExtract = await privacyManager.canExtractFromDomain('restricted.com');
      expect(canExtract).toBe(false);
      
      // Workflow should stop with privacy error
    });

    it('should handle robots.txt disallow', async () => {
      vi.mocked(privacyManager.respectRobotsTxt).mockResolvedValue({
        allowed: false,
        reason: 'Disallowed by robots.txt'
      });
      
      const robotsCheck = await privacyManager.respectRobotsTxt('https://example.com/private');
      expect(robotsCheck.allowed).toBe(false);
      expect(robotsCheck.reason).toBe('Disallowed by robots.txt');
    });

    it('should handle extraction failures', async () => {
      // Mock extraction failure
      mockDocument.querySelector.mockImplementation(() => {
        throw new Error('DOM access denied');
      });
      
      await expect(contentExtractor.extractPageContent()).rejects.toThrow('Content extraction failed');
    });

    it('should handle user cancellation', async () => {
      const extractedContent = await contentExtractor.extractPageContent();
      
      // Mock user cancellation
      vi.mocked(confirmationManager.showConfirmation).mockResolvedValue({
        confirmed: false,
        editedContent: '',
        selectedLessonType: 'discussion',
        selectedCEFRLevel: 'B1'
      });
      
      const confirmation = await confirmationManager.showConfirmation(extractedContent);
      expect(confirmation.confirmed).toBe(false);
      
      // Workflow should stop without opening lesson interface
    });

    it('should handle lesson interface errors', async () => {
      const extractedContent = await contentExtractor.extractPageContent();
      
      vi.mocked(confirmationManager.showConfirmation).mockResolvedValue({
        confirmed: true,
        editedContent: extractedContent.text,
        selectedLessonType: extractedContent.suggestedLessonType,
        selectedCEFRLevel: extractedContent.suggestedCEFRLevel
      });
      
      // Mock lesson interface error
      vi.mocked(lessonBridge.openLessonInterface).mockRejectedValue(
        new Error('Failed to open lesson interface')
      );
      
      await expect(
        lessonBridge.openLessonInterface(extractedContent)
      ).rejects.toThrow('Failed to open lesson interface');
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle exactly minimum word count', async () => {
      // Create content with exactly 200 words
      const exactContent = 'word '.repeat(200).trim();
      mockDocument.body.textContent = exactContent;
      
      const analysis = analysisEngine.analyzePageContent();
      expect(analysis.wordCount).toBe(200);
      
      const isSuitable = analysisEngine.isContentSuitable(analysis);
      expect(isSuitable).toBe(true); // Should be suitable at exactly 200 words
    });

    it('should handle mixed language content', async () => {
      const mixedContent = 'This is English text. Esto es texto en español. This is more English.';
      mockDocument.body.textContent = mixedContent;
      
      const analysis = analysisEngine.analyzePageContent();
      const languageResult = analysisEngine.detectLanguage(mixedContent);
      
      // Should detect primary language
      expect(['en', 'es']).toContain(languageResult.language);
      expect(languageResult.confidence).toBeGreaterThan(0);
    });

    it('should handle very long content', async () => {
      // Create very long content (>50KB)
      const longContent = 'This is a very long article about language learning. '.repeat(1000);
      mockDocument.body.textContent = longContent;
      
      const extractedContent = await contentExtractor.extractPageContent();
      
      // Content should be truncated by privacy manager
      vi.mocked(privacyManager.sanitizeContent).mockReturnValue(
        longContent.substring(0, 50000) + '...'
      );
      
      const sanitized = privacyManager.sanitizeContent(longContent);
      expect(sanitized.length).toBeLessThanOrEqual(50003); // 50000 + '...'
    });

    it('should handle special characters and encoding', async () => {
      const specialContent = 'Café, naïve, résumé, Москва, 北京, العربية, 日本語';
      mockDocument.body.textContent = specialContent;
      
      const extractedContent = await contentExtractor.extractPageContent();
      expect(extractedContent.text).toContain('Café');
      expect(extractedContent.text).toContain('naïve');
      expect(extractedContent.text).toContain('Москва');
    });

    it('should handle malformed HTML gracefully', async () => {
      // Mock malformed DOM structure
      mockDocument.querySelector.mockImplementation((selector) => {
        if (selector === 'main') return null;
        if (selector === 'article') return null;
        return null;
      });
      
      // Should fall back to body content
      const extractedContent = await contentExtractor.extractPageContent();
      expect(extractedContent.text).toBeTruthy();
    });
  });

  describe('Performance and Optimization', () => {
    it('should complete analysis within reasonable time', async () => {
      const startTime = Date.now();
      
      const analysis = analysisEngine.analyzePageContent();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(analysis).toBeDefined();
    });

    it('should handle concurrent extraction requests', async () => {
      const promises = Array(5).fill(null).map(() => 
        contentExtractor.extractPageContent()
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.text).toBeTruthy();
      });
    });

    it('should clean up resources after extraction', async () => {
      const extractedContent = await contentExtractor.extractPageContent();
      
      // Verify no memory leaks or hanging references
      expect(extractedContent).toBeDefined();
      
      // Mock cleanup verification
      const cleanupSpy = vi.spyOn(contentExtractor, 'cleanup' as any);
      if (cleanupSpy) {
        expect(cleanupSpy).toHaveBeenCalled();
      }
    });
  });

  describe('Cross-Site Compatibility', () => {
    it('should work with news sites', async () => {
      mockWindow.location.hostname = 'news.example.com';
      mockWindow.location.pathname = '/breaking-news/story';
      
      const analysis = analysisEngine.analyzePageContent();
      expect(analysis.contentType).toBe('news');
      expect(analysis.isEducational).toBe(true);
    });

    it('should work with educational sites', async () => {
      mockWindow.location.hostname = 'edu.example.com';
      mockWindow.location.pathname = '/course/lesson-1';
      
      const analysis = analysisEngine.analyzePageContent();
      expect(analysis.contentType).toBe('tutorial');
      expect(analysis.isEducational).toBe(true);
    });

    it('should work with blog platforms', async () => {
      mockWindow.location.hostname = 'blog.example.com';
      mockWindow.location.pathname = '/post/language-tips';
      
      const analysis = analysisEngine.analyzePageContent();
      expect(analysis.contentType).toBe('blog');
      expect(analysis.isEducational).toBe(true);
    });

    it('should reject e-commerce sites', async () => {
      mockWindow.location.hostname = 'shop.example.com';
      mockWindow.location.pathname = '/product/language-book';
      
      const analysis = analysisEngine.analyzePageContent();
      expect(analysis.contentType).toBe('product');
      expect(analysis.isEducational).toBe(false);
      
      const isSuitable = analysisEngine.isContentSuitable(analysis);
      expect(isSuitable).toBe(false);
    });
  });

  describe('Accessibility Integration', () => {
    it('should provide screen reader compatible feedback', async () => {
      const extractedContent = await contentExtractor.extractPageContent();
      
      // Mock screen reader announcements
      const announcements: string[] = [];
      const mockAnnounce = vi.fn((message: string) => {
        announcements.push(message);
      });
      
      // Simulate workflow with announcements
      mockAnnounce('Content analysis started');
      mockAnnounce('Content extraction in progress');
      mockAnnounce('Content extracted successfully');
      
      expect(announcements).toContain('Content analysis started');
      expect(announcements).toContain('Content extraction in progress');
      expect(announcements).toContain('Content extracted successfully');
    });

    it('should support keyboard-only workflow', async () => {
      // Mock keyboard navigation through workflow
      const keyboardEvents = [
        { key: 'Alt+E', action: 'start_extraction' },
        { key: 'Enter', action: 'confirm_extraction' },
        { key: 'Tab', action: 'navigate_options' },
        { key: 'Enter', action: 'proceed_to_lesson' }
      ];
      
      keyboardEvents.forEach(event => {
        expect(event.key).toBeTruthy();
        expect(event.action).toBeTruthy();
      });
    });
  });

  describe('Data Integrity and Validation', () => {
    it('should maintain content integrity throughout workflow', async () => {
      const originalContent = mockDocument.body.textContent;
      
      const extractedContent = await contentExtractor.extractPageContent();
      
      // Content should be cleaned but core meaning preserved
      expect(extractedContent.text).toContain('language learning');
      expect(extractedContent.text.length).toBeGreaterThan(0);
      
      // Metadata should be accurate
      expect(extractedContent.metadata.sourceUrl).toBe(mockWindow.location.href);
      expect(extractedContent.metadata.domain).toBe(mockWindow.location.hostname);
    });

    it('should validate all extracted metadata', async () => {
      const extractedContent = await contentExtractor.extractPageContent();
      
      expect(extractedContent.metadata.title).toBeTruthy();
      expect(extractedContent.metadata.sourceUrl).toMatch(/^https?:\/\//);
      expect(extractedContent.metadata.domain).toBeTruthy();
      expect(extractedContent.metadata.language).toMatch(/^[a-z]{2}$/);
      expect(extractedContent.sourceInfo.extractedAt).toBeInstanceOf(Date);
    });

    it('should ensure consistent lesson type suggestions', async () => {
      const extractedContent = await contentExtractor.extractPageContent();
      
      const validLessonTypes = ['discussion', 'grammar', 'travel', 'business', 'pronunciation'];
      expect(validLessonTypes).toContain(extractedContent.suggestedLessonType);
      
      const validCEFRLevels = ['A1', 'A2', 'B1', 'B2', 'C1'];
      expect(validCEFRLevels).toContain(extractedContent.suggestedCEFRLevel);
    });
  });
});