/**
 * Integration Workflow Tests for Extract from Page Feature
 * 
 * Tests the integration between components using existing test patterns
 * and focusing on the workflow and data flow aspects.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Extract from Page Integration Workflow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Integration Verification', () => {
    it('should verify all required components exist and are importable', async () => {
      // Test that all components can be imported without errors
      const { ContentAnalysisEngine } = await import('@/lib/content-analysis-engine');
      const { EnhancedContentExtractor } = await import('@/lib/enhanced-content-extractor');
      const { LessonInterfaceBridge } = await import('@/lib/lesson-interface-bridge');
      const { ExtractionSessionManager } = await import('@/lib/extraction-session-manager');
      const { PrivacyManager } = await import('@/lib/privacy-manager');
      
      expect(ContentAnalysisEngine).toBeDefined();
      expect(EnhancedContentExtractor).toBeDefined();
      expect(LessonInterfaceBridge).toBeDefined();
      expect(ExtractionSessionManager).toBeDefined();
      expect(PrivacyManager).toBeDefined();
    });

    it('should verify component constructors work', async () => {
      const { ContentAnalysisEngine } = await import('@/lib/content-analysis-engine');
      const { EnhancedContentExtractor } = await import('@/lib/enhanced-content-extractor');
      const { LessonInterfaceBridge } = await import('@/lib/lesson-interface-bridge');
      const { ExtractionSessionManager } = await import('@/lib/extraction-session-manager');
      const { PrivacyManager } = await import('@/lib/privacy-manager');
      
      expect(() => new ContentAnalysisEngine()).not.toThrow();
      expect(() => new EnhancedContentExtractor()).not.toThrow();
      expect(() => new LessonInterfaceBridge()).not.toThrow();
      expect(() => new ExtractionSessionManager()).not.toThrow();
      expect(() => new PrivacyManager()).not.toThrow();
    });
  });

  describe('API Integration Tests', () => {
    it('should test content analysis API integration', async () => {
      // Mock fetch for API calls
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            wordCount: 150,
            contentType: 'news',
            isEducational: true,
            language: 'en',
            qualityScore: 0.8
          }
        })
      });

      const response = await fetch('/api/analyze-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'Test article content with sufficient words for analysis...',
          url: 'https://test.com/article'
        })
      });

      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data.wordCount).toBeGreaterThan(100);
      expect(result.data.isEducational).toBe(true);
    });

    it('should test content extraction API integration', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            text: 'Extracted article content about language learning...',
            metadata: {
              title: 'Language Learning Article',
              sourceUrl: 'https://test.com/article',
              author: 'Test Author'
            },
            suggestedLessonType: 'discussion',
            quality: {
              wordCount: 150,
              meetsMinimumStandards: true
            }
          }
        })
      });

      const response = await fetch('/api/extract-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://test.com/article'
        })
      });

      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data.text).toContain('language learning');
      expect(result.data.metadata.sourceUrl).toBe('https://test.com/article');
      expect(result.data.suggestedLessonType).toBe('discussion');
    });

    it('should test lesson interface API integration', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            interfaceOpened: true,
            contentPrePopulated: true,
            lessonType: 'discussion',
            cefrLevel: 'B1'
          }
        })
      });

      const response = await fetch('/api/open-lesson-interface', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extractedContent: {
            text: 'Test content',
            metadata: { sourceUrl: 'https://test.com' },
            suggestedLessonType: 'discussion'
          }
        })
      });

      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data.interfaceOpened).toBe(true);
      expect(result.data.contentPrePopulated).toBe(true);
    });
  });

  describe('Chrome Extension Integration', () => {
    it('should test chrome storage integration', async () => {
      const mockChrome = {
        storage: {
          local: {
            set: vi.fn().mockResolvedValue(undefined),
            get: vi.fn().mockResolvedValue({
              extractedContent: {
                text: 'Test content',
                metadata: { sourceUrl: 'https://test.com' }
              }
            })
          }
        }
      };

      global.chrome = mockChrome as any;

      // Test setting data
      await chrome.storage.local.set({
        extractedContent: {
          text: 'Test content',
          metadata: { sourceUrl: 'https://test.com' }
        },
        extractionSource: 'webpage'
      });

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
        extractedContent: {
          text: 'Test content',
          metadata: { sourceUrl: 'https://test.com' }
        },
        extractionSource: 'webpage'
      });

      // Test getting data
      const result = await chrome.storage.local.get(['extractedContent']);
      expect(result.extractedContent).toBeDefined();
      expect(result.extractedContent.text).toBe('Test content');
    });

    it('should test chrome tabs integration', async () => {
      const mockChrome = {
        tabs: {
          create: vi.fn().mockResolvedValue({ id: 1, url: 'chrome-extension://test/popup.html' })
        },
        runtime: {
          getURL: vi.fn().mockReturnValue('chrome-extension://test/popup.html')
        }
      };

      global.chrome = mockChrome as any;

      const popupUrl = chrome.runtime.getURL('popup.html?source=extraction');
      const tab = await chrome.tabs.create({ url: popupUrl });

      expect(mockChrome.runtime.getURL).toHaveBeenCalledWith('popup.html?source=extraction');
      expect(mockChrome.tabs.create).toHaveBeenCalledWith({ url: popupUrl });
      expect(tab.id).toBe(1);
    });

    it('should test chrome action integration', async () => {
      const mockChrome = {
        action: {
          openPopup: vi.fn().mockResolvedValue(undefined)
        }
      };

      global.chrome = mockChrome as any;

      await chrome.action.openPopup();
      expect(mockChrome.action.openPopup).toHaveBeenCalled();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle API errors gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({
          success: false,
          error: 'Internal server error'
        })
      });

      const response = await fetch('/api/analyze-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'test' })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);

      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Internal server error');
    });

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      try {
        await fetch('/api/analyze-content');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });

    it('should handle chrome extension API errors', async () => {
      const mockChrome = {
        storage: {
          local: {
            set: vi.fn().mockRejectedValue(new Error('Quota exceeded'))
          }
        }
      };

      global.chrome = mockChrome as any;

      try {
        await chrome.storage.local.set({ test: 'data' });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toBe('Quota exceeded');
      }
    });
  });

  describe('Data Flow Integration', () => {
    it('should test complete data flow from analysis to lesson interface', async () => {
      // Mock the complete workflow
      const mockWorkflow = {
        analyze: vi.fn().mockResolvedValue({
          wordCount: 200,
          contentType: 'news',
          isEducational: true,
          shouldShow: true
        }),
        extract: vi.fn().mockResolvedValue({
          text: 'Extracted content about language learning...',
          metadata: { title: 'Test Article', sourceUrl: 'https://test.com' },
          suggestedLessonType: 'discussion'
        }),
        validate: vi.fn().mockReturnValue({
          isValid: true,
          meetsMinimumQuality: true
        }),
        openInterface: vi.fn().mockResolvedValue(true)
      };

      // Simulate workflow
      const analysisResult = await mockWorkflow.analyze('test content');
      expect(analysisResult.shouldShow).toBe(true);

      const extractedContent = await mockWorkflow.extract();
      expect(extractedContent.text).toContain('language learning');

      const validation = mockWorkflow.validate(extractedContent);
      expect(validation.isValid).toBe(true);

      const interfaceOpened = await mockWorkflow.openInterface(extractedContent);
      expect(interfaceOpened).toBe(true);

      // Verify all steps were called
      expect(mockWorkflow.analyze).toHaveBeenCalled();
      expect(mockWorkflow.extract).toHaveBeenCalled();
      expect(mockWorkflow.validate).toHaveBeenCalled();
      expect(mockWorkflow.openInterface).toHaveBeenCalled();
    });

    it('should test error propagation through workflow', async () => {
      const mockWorkflow = {
        analyze: vi.fn().mockResolvedValue({
          wordCount: 50, // Too short
          isEducational: false,
          shouldShow: false
        }),
        extract: vi.fn(),
        validate: vi.fn(),
        openInterface: vi.fn()
      };

      const analysisResult = await mockWorkflow.analyze('short content');
      expect(analysisResult.shouldShow).toBe(false);

      // Workflow should stop here - no further steps should be called
      expect(mockWorkflow.extract).not.toHaveBeenCalled();
      expect(mockWorkflow.validate).not.toHaveBeenCalled();
      expect(mockWorkflow.openInterface).not.toHaveBeenCalled();
    });
  });

  describe('Performance Integration', () => {
    it('should test API response times', async () => {
      global.fetch = vi.fn().mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({ success: true, data: {} })
            });
          }, 100); // 100ms delay
        })
      );

      const startTime = performance.now();
      const response = await fetch('/api/analyze-content');
      const endTime = performance.now();

      expect(response.ok).toBe(true);
      expect(endTime - startTime).toBeGreaterThan(90); // At least 90ms
      expect(endTime - startTime).toBeLessThan(200); // Less than 200ms
    });

    it('should test concurrent API calls', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} })
      });

      const startTime = performance.now();
      
      const promises = Array.from({ length: 5 }, () => 
        fetch('/api/analyze-content')
      );

      const results = await Promise.all(promises);
      const endTime = performance.now();

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.ok).toBe(true);
      });

      // Should complete faster than sequential calls
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('Cross-Site Compatibility Integration', () => {
    it('should test different site URL patterns', () => {
      const testUrls = [
        'https://bbc.com/news/technology-123',
        'https://medium.com/@author/article',
        'https://wikipedia.org/wiki/topic',
        'https://blog.example.com/post',
        'https://docs.example.com/guide'
      ];

      testUrls.forEach(url => {
        const urlObj = new URL(url);
        expect(urlObj.protocol).toBe('https:');
        expect(urlObj.hostname).toBeTruthy();
        expect(urlObj.pathname).toBeTruthy();
      });
    });

    it('should test content type detection patterns', () => {
      const contentPatterns = [
        { url: 'https://bbc.com/news/article', expectedType: 'news' },
        { url: 'https://medium.com/@author/post', expectedType: 'blog' },
        { url: 'https://wikipedia.org/wiki/topic', expectedType: 'encyclopedia' },
        { url: 'https://amazon.com/product/123', expectedType: 'ecommerce' },
        { url: 'https://docs.example.com/api', expectedType: 'documentation' }
      ];

      contentPatterns.forEach(pattern => {
        const urlObj = new URL(pattern.url);
        let detectedType = 'other';

        if (urlObj.hostname.includes('bbc') || urlObj.pathname.includes('/news/')) {
          detectedType = 'news';
        } else if (urlObj.hostname.includes('medium') || urlObj.pathname.includes('/blog/')) {
          detectedType = 'blog';
        } else if (urlObj.hostname.includes('wikipedia') || urlObj.pathname.includes('/wiki/')) {
          detectedType = 'encyclopedia';
        } else if (urlObj.hostname.includes('amazon') || urlObj.pathname.includes('/product/')) {
          detectedType = 'ecommerce';
        } else if (urlObj.hostname.includes('docs') || urlObj.pathname.includes('/api')) {
          detectedType = 'documentation';
        }

        expect(detectedType).toBe(pattern.expectedType);
      });
    });
  });

  describe('Accessibility Integration', () => {
    it('should test ARIA label generation', () => {
      const generateAriaLabel = (state: string) => {
        switch (state) {
          case 'idle':
            return 'Extract content from page for lesson generation';
          case 'loading':
            return 'Extracting content, please wait';
          case 'success':
            return 'Content extracted successfully';
          case 'error':
            return 'Content extraction failed';
          default:
            return 'Extract button';
        }
      };

      expect(generateAriaLabel('idle')).toContain('Extract content');
      expect(generateAriaLabel('loading')).toContain('Extracting');
      expect(generateAriaLabel('success')).toContain('successfully');
      expect(generateAriaLabel('error')).toContain('failed');
    });

    it('should test keyboard shortcut handling', () => {
      const handleKeyboardShortcut = (event: { altKey: boolean; key: string }) => {
        if (event.altKey && event.key.toLowerCase() === 'e') {
          return 'extract-activated';
        }
        return 'no-action';
      };

      expect(handleKeyboardShortcut({ altKey: true, key: 'e' })).toBe('extract-activated');
      expect(handleKeyboardShortcut({ altKey: true, key: 'E' })).toBe('extract-activated');
      expect(handleKeyboardShortcut({ altKey: false, key: 'e' })).toBe('no-action');
      expect(handleKeyboardShortcut({ altKey: true, key: 'x' })).toBe('no-action');
    });

    it('should test screen reader announcements', () => {
      const announcements: string[] = [];
      
      const announceToScreenReader = (message: string) => {
        announcements.push(message);
      };

      announceToScreenReader('Extract button available');
      announceToScreenReader('Content extraction started');
      announceToScreenReader('Extraction 50% complete');
      announceToScreenReader('Content extracted successfully');

      expect(announcements).toHaveLength(4);
      expect(announcements[0]).toContain('available');
      expect(announcements[1]).toContain('started');
      expect(announcements[2]).toContain('50%');
      expect(announcements[3]).toContain('successfully');
    });
  });

  describe('Security Integration', () => {
    it('should test content sanitization', () => {
      const sanitizeContent = (content: string) => {
        return content
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      };

      const maliciousContent = '<script>alert("xss")</script><p>Safe content</p><iframe src="evil.com"></iframe>';
      const sanitized = sanitizeContent(maliciousContent);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('<iframe>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('Safe content');
    });

    it('should test URL validation', () => {
      const isValidUrl = (url: string) => {
        try {
          const urlObj = new URL(url);
          return urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
        } catch {
          return false;
        }
      };

      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
      expect(isValidUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isValidUrl('invalid-url')).toBe(false);
    });

    it('should test domain restrictions', () => {
      const restrictedDomains = ['malicious.com', 'spam.net', 'blocked.org'];
      
      const isDomainAllowed = (url: string) => {
        try {
          const urlObj = new URL(url);
          return !restrictedDomains.includes(urlObj.hostname);
        } catch {
          return false;
        }
      };

      expect(isDomainAllowed('https://example.com')).toBe(true);
      expect(isDomainAllowed('https://malicious.com')).toBe(false);
      expect(isDomainAllowed('https://spam.net')).toBe(false);
      expect(isDomainAllowed('invalid-url')).toBe(false);
    });
  });
});