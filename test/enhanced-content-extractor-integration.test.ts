/**
 * Integration tests for Enhanced Content Extractor
 * 
 * Tests the enhanced content extraction engine in a more realistic environment.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnhancedContentExtractor } from '../lib/enhanced-content-extractor';

describe('EnhancedContentExtractor Integration', () => {
  let extractor: EnhancedContentExtractor;

  beforeEach(() => {
    extractor = new EnhancedContentExtractor();
    
    // Setup minimal DOM environment
    const mockDocument = {
      cloneNode: vi.fn().mockReturnValue({
        querySelectorAll: vi.fn().mockReturnValue([]),
        body: {
          textContent: 'Sample content for testing the enhanced content extraction functionality. This content should be long enough to meet minimum requirements.',
          querySelectorAll: vi.fn().mockReturnValue([])
        }
      }),
      querySelector: vi.fn().mockImplementation((selector) => {
        if (selector === 'main' || selector === 'article') {
          return {
            textContent: 'This is a comprehensive article about language learning and educational content creation. The article discusses various methodologies for creating effective lessons from web content. It covers topics such as content analysis, quality assessment, and lesson type determination. The content is structured with clear paragraphs and provides valuable insights for educators.',
            querySelectorAll: vi.fn().mockReturnValue([])
          };
        }
        if (selector === 'title') {
          return { textContent: 'Language Learning Guide' };
        }
        if (selector === 'meta[property="og:title"]') {
          return { getAttribute: () => 'Enhanced Language Learning Guide' };
        }
        return null;
      }),
      querySelectorAll: vi.fn().mockReturnValue([]),
      body: {
        textContent: 'Sample body content',
        querySelectorAll: vi.fn().mockReturnValue([])
      },
      documentElement: {
        lang: 'en'
      },
      title: 'Test Article'
    };

    const mockWindow = {
      location: {
        href: 'https://example.com/article/language-learning',
        hostname: 'example.com',
        pathname: '/article/language-learning',
        origin: 'https://example.com'
      },
      document: mockDocument,
      navigator: {
        userAgent: 'Test User Agent'
      }
    };

    vi.stubGlobal('window', mockWindow);
    vi.stubGlobal('document', mockDocument);
    vi.stubGlobal('navigator', mockWindow.navigator);
  });

  it('should extract and validate content successfully', async () => {
    const result = await extractor.extractPageContent();

    // Verify basic extraction
    expect(result).toBeDefined();
    expect(result.text).toBeTruthy();
    expect(result.text.length).toBeGreaterThan(100);

    // Verify metadata
    expect(result.metadata.title).toBe('Enhanced Language Learning Guide');
    expect(result.metadata.sourceUrl).toBe('https://example.com/article/language-learning');
    expect(result.metadata.domain).toBe('example.com');
    expect(result.metadata.language).toBe('en');

    // Verify quality analysis
    expect(result.quality.wordCount).toBeGreaterThan(0);
    expect(result.quality.suitabilityScore).toBeGreaterThan(0);
    expect(result.quality.complexity).toMatch(/^(beginner|intermediate|advanced)$/);

    // Verify suggestions
    expect(['discussion', 'grammar', 'travel', 'business', 'pronunciation']).toContain(result.suggestedLessonType);
    expect(['A1', 'A2', 'B1', 'B2', 'C1']).toContain(result.suggestedCEFRLevel);

    // Verify source info
    expect(result.sourceInfo.url).toBe('https://example.com/article/language-learning');
    expect(result.sourceInfo.domain).toBe('example.com');
    expect(result.sourceInfo.extractedAt).toBeInstanceOf(Date);
  });

  it('should validate extracted content', async () => {
    const extractedContent = await extractor.extractPageContent();
    const validation = extractor.validateContent(extractedContent);

    expect(validation).toBeDefined();
    expect(validation.isValid).toBeDefined();
    expect(validation.meetsMinimumQuality).toBeDefined();
    expect(Array.isArray(validation.issues)).toBe(true);
    expect(Array.isArray(validation.warnings)).toBe(true);
    expect(Array.isArray(validation.recommendations)).toBe(true);
  });

  it('should handle content with insufficient length', async () => {
    // Mock short content
    vi.mocked(document.querySelector).mockImplementation((selector) => {
      if (selector === 'main' || selector === 'article') {
        return {
          textContent: 'Short content.',
          querySelectorAll: vi.fn().mockReturnValue([])
        };
      }
      return null;
    });

    const result = await extractor.extractPageContent();
    const validation = extractor.validateContent(result);

    expect(validation.isValid).toBe(false);
    expect(validation.issues.some(issue => issue.type === 'insufficient_content')).toBe(true);
  });

  it('should suggest appropriate lesson types', async () => {
    // Test business content
    vi.mocked(document.querySelector).mockImplementation((selector) => {
      if (selector === 'main' || selector === 'article') {
        return {
          textContent: 'This comprehensive business guide covers corporate strategy, marketing techniques, and sales management. Learn about revenue optimization, profit maximization, and effective business presentations for modern companies.',
          querySelectorAll: vi.fn().mockReturnValue([])
        };
      }
      if (selector === 'title') {
        return { textContent: 'Business Strategy and Management Guide' };
      }
      return null;
    });

    const result = await extractor.extractPageContent();
    expect(result.suggestedLessonType).toBe('business');
  });

  it('should suggest appropriate CEFR levels', async () => {
    // Test simple content for A1/A2
    vi.mocked(document.querySelector).mockImplementation((selector) => {
      if (selector === 'main' || selector === 'article') {
        return {
          textContent: 'This is easy text. It has simple words. The sentences are short. Students can read this well. It is good for beginners. They will understand it quickly.',
          querySelectorAll: vi.fn().mockReturnValue([])
        };
      }
      return null;
    });

    const result = await extractor.extractPageContent();
    expect(['A1', 'A2']).toContain(result.suggestedCEFRLevel);
  });
});