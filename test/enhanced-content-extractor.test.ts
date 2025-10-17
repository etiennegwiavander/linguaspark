/**
 * Unit tests for Enhanced Content Extractor
 * 
 * Tests the enhanced content extraction engine with validation,
 * structured content preservation, and lesson type suggestions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnhancedContentExtractor, type ExtractedContent, type ValidationResult } from '../lib/enhanced-content-extractor';

// Mock DOM environment
const mockDocument = {
  cloneNode: vi.fn(),
  querySelectorAll: vi.fn(),
  querySelector: vi.fn(),
  body: {
    textContent: 'Sample body content for testing purposes.',
    querySelectorAll: vi.fn(),
    querySelector: vi.fn()
  },
  documentElement: {
    lang: 'en'
  },
  title: 'Test Article Title'
};

const mockWindow = {
  location: {
    href: 'https://example.com/article/test',
    hostname: 'example.com',
    pathname: '/article/test',
    origin: 'https://example.com'
  },
  document: mockDocument,
  navigator: {
    userAgent: 'Test User Agent'
  }
};

// Setup global mocks
beforeEach(() => {
  vi.stubGlobal('window', mockWindow);
  vi.stubGlobal('document', mockDocument);
  vi.stubGlobal('navigator', mockWindow.navigator);
});

describe('EnhancedContentExtractor', () => {
  let extractor: EnhancedContentExtractor;

  beforeEach(() => {
    extractor = new EnhancedContentExtractor();
    vi.clearAllMocks();
  });

  describe('Content Extraction', () => {
    it('should extract content with basic structure', async () => {
      // Mock DOM structure
      const mockMainElement = {
        textContent: 'This is a sample article about language learning. It contains multiple sentences and paragraphs. The content is suitable for creating educational lessons. Language learning is an important skill in today\'s globalized world. Students can benefit from structured lessons that help them improve their vocabulary and grammar skills.',
        querySelectorAll: vi.fn((selector) => {
          if (selector.includes('h1, h2')) return [
            { tagName: 'H1', textContent: 'Language Learning Guide', id: 'main-title' },
            { tagName: 'H2', textContent: 'Getting Started', id: 'getting-started' }
          ];
          if (selector.includes('p')) return [
            { textContent: 'This is a sample article about language learning.' },
            { textContent: 'It contains multiple sentences and paragraphs.' }
          ];
          if (selector.includes('ul, ol')) return [];
          if (selector.includes('blockquote')) return [];
          if (selector.includes('img')) return [];
          if (selector.includes('a[href]')) return [];
          if (selector.includes('table')) return [];
          if (selector.includes('pre, code')) return [];
          return [];
        })
      };

      mockDocument.querySelector.mockImplementation((selector) => {
        if (selector === 'main' || selector === 'article') return mockMainElement;
        if (selector === 'meta[property="og:title"]') return { getAttribute: () => 'Test Article' };
        if (selector === 'meta[name="description"]') return { getAttribute: () => 'Test description' };
        return null;
      });

      mockDocument.cloneNode.mockReturnValue({
        ...mockDocument,
        querySelectorAll: vi.fn(() => []),
        body: mockMainElement
      });

      const result = await extractor.extractPageContent();

      expect(result).toBeDefined();
      expect(result.text).toContain('language learning');
      expect(result.metadata.title).toBe('Test Article');
      expect(result.structuredContent.headings).toHaveLength(2);
      expect(result.quality.wordCount).toBeGreaterThan(0);
      expect(result.suggestedLessonType).toBeDefined();
      expect(result.suggestedCEFRLevel).toBeDefined();
    });

    it('should handle extraction errors gracefully', async () => {
      mockDocument.querySelector.mockImplementation(() => {
        throw new Error('DOM access error');
      });

      await expect(extractor.extractPageContent()).rejects.toThrow('Content extraction failed');
    });
  });

  describe('Content Validation', () => {
    it('should validate content that meets minimum standards', () => {
      const mockContent: ExtractedContent = {
        text: 'This is a comprehensive article about language learning with sufficient content for lesson generation. It contains multiple paragraphs and detailed explanations that will help students understand the concepts better. The vocabulary is appropriate for intermediate learners and the structure is well-organized.',
        structuredContent: {
          headings: [{ level: 1, text: 'Language Learning' }],
          paragraphs: ['First paragraph', 'Second paragraph'],
          lists: [],
          quotes: [],
          images: [],
          links: [],
          tables: [],
          codeBlocks: []
        },
        metadata: {
          title: 'Language Learning Guide',
          sourceUrl: 'https://example.com/article',
          domain: 'example.com',
          language: 'en',
          contentType: 'article',
          estimatedReadingTime: 2
        },
        quality: {
          wordCount: 150,
          readingTime: 1,
          complexity: 'intermediate',
          suitabilityScore: 0.8,
          issues: [],
          meetsMinimumStandards: true,
          readabilityScore: 65,
          vocabularyComplexity: 0.4,
          sentenceComplexity: 0.3
        },
        sourceInfo: {
          url: 'https://example.com/article',
          domain: 'example.com',
          title: 'Language Learning Guide',
          extractedAt: new Date(),
          userAgent: 'Test Agent',
          attribution: 'Test attribution'
        },
        suggestedLessonType: 'discussion',
        suggestedCEFRLevel: 'B1'
      };

      const result = extractor.validateContent(mockContent);

      expect(result.isValid).toBe(true);
      expect(result.meetsMinimumQuality).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should reject content that is too short', () => {
      const mockContent: ExtractedContent = {
        text: 'Short text.',
        structuredContent: {
          headings: [],
          paragraphs: [],
          lists: [],
          quotes: [],
          images: [],
          links: [],
          tables: [],
          codeBlocks: []
        },
        metadata: {
          title: 'Short Article',
          sourceUrl: 'https://example.com/short',
          domain: 'example.com',
          language: 'en',
          contentType: 'article',
          estimatedReadingTime: 1
        },
        quality: {
          wordCount: 2,
          readingTime: 1,
          complexity: 'beginner',
          suitabilityScore: 0.2,
          issues: ['Content too short'],
          meetsMinimumStandards: false,
          readabilityScore: 80,
          vocabularyComplexity: 0.1,
          sentenceComplexity: 0.1
        },
        sourceInfo: {
          url: 'https://example.com/short',
          domain: 'example.com',
          title: 'Short Article',
          extractedAt: new Date(),
          userAgent: 'Test Agent',
          attribution: 'Test attribution'
        },
        suggestedLessonType: 'discussion',
        suggestedCEFRLevel: 'A1'
      };

      const result = extractor.validateContent(mockContent);

      expect(result.isValid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('insufficient_content');
    });

    it('should reject unsupported languages', () => {
      const mockContent: ExtractedContent = {
        text: 'Content in unsupported language with sufficient length for testing purposes.',
        structuredContent: {
          headings: [],
          paragraphs: [],
          lists: [],
          quotes: [],
          images: [],
          links: [],
          tables: [],
          codeBlocks: []
        },
        metadata: {
          title: 'Article in Unsupported Language',
          sourceUrl: 'https://example.com/unsupported',
          domain: 'example.com',
          language: 'xx', // Unsupported language code
          contentType: 'article',
          estimatedReadingTime: 1
        },
        quality: {
          wordCount: 150,
          readingTime: 1,
          complexity: 'intermediate',
          suitabilityScore: 0.7,
          issues: [],
          meetsMinimumStandards: true,
          readabilityScore: 65,
          vocabularyComplexity: 0.4,
          sentenceComplexity: 0.3
        },
        sourceInfo: {
          url: 'https://example.com/unsupported',
          domain: 'example.com',
          title: 'Article in Unsupported Language',
          extractedAt: new Date(),
          userAgent: 'Test Agent',
          attribution: 'Test attribution'
        },
        suggestedLessonType: 'discussion',
        suggestedCEFRLevel: 'B1'
      };

      const result = extractor.validateContent(mockContent);

      expect(result.isValid).toBe(false);
      expect(result.issues.some(issue => issue.type === 'unsupported_language')).toBe(true);
    });

    it('should reject poor quality content', () => {
      const mockContent: ExtractedContent = {
        text: 'Poor quality content that does not meet the minimum standards for lesson generation purposes.',
        structuredContent: {
          headings: [],
          paragraphs: [],
          lists: [],
          quotes: [],
          images: [],
          links: [],
          tables: [],
          codeBlocks: []
        },
        metadata: {
          title: 'Poor Quality Article',
          sourceUrl: 'https://example.com/poor',
          domain: 'example.com',
          language: 'en',
          contentType: 'article',
          estimatedReadingTime: 1
        },
        quality: {
          wordCount: 150,
          readingTime: 1,
          complexity: 'intermediate',
          suitabilityScore: 0.3, // Below minimum threshold
          issues: ['Poor structure'],
          meetsMinimumStandards: false,
          readabilityScore: 30,
          vocabularyComplexity: 0.8,
          sentenceComplexity: 0.9
        },
        sourceInfo: {
          url: 'https://example.com/poor',
          domain: 'example.com',
          title: 'Poor Quality Article',
          extractedAt: new Date(),
          userAgent: 'Test Agent',
          attribution: 'Test attribution'
        },
        suggestedLessonType: 'discussion',
        suggestedCEFRLevel: 'C1'
      };

      const result = extractor.validateContent(mockContent);

      expect(result.isValid).toBe(false);
      expect(result.issues.some(issue => issue.type === 'poor_quality')).toBe(true);
    });

    it('should provide warnings for borderline content', () => {
      const mockContent: ExtractedContent = {
        text: 'This is borderline content that meets minimum requirements but could be improved for better lesson quality.',
        structuredContent: {
          headings: [],
          paragraphs: [],
          lists: [],
          quotes: [],
          images: [],
          links: [],
          tables: [],
          codeBlocks: []
        },
        metadata: {
          title: 'Borderline Article',
          sourceUrl: 'https://example.com/borderline',
          domain: 'example.com',
          language: 'en',
          contentType: 'article',
          estimatedReadingTime: 1
        },
        quality: {
          wordCount: 150, // Just above minimum but still short
          readingTime: 1,
          complexity: 'advanced',
          suitabilityScore: 0.7,
          issues: [],
          meetsMinimumStandards: true,
          readabilityScore: 45,
          vocabularyComplexity: 0.6,
          sentenceComplexity: 0.7
        },
        sourceInfo: {
          url: 'https://example.com/borderline',
          domain: 'example.com',
          title: 'Borderline Article',
          extractedAt: new Date(),
          userAgent: 'Test Agent',
          attribution: 'Test attribution'
        },
        suggestedLessonType: 'discussion',
        suggestedCEFRLevel: 'A1' // Mismatch with complexity
      };

      const result = extractor.validateContent(mockContent);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(warning => warning.includes('complexity may be too high'))).toBe(true);
    });

    it('should provide recommendations for content improvement', () => {
      const mockContent: ExtractedContent = {
        text: 'Content without structured elements that could benefit from better organization and formatting.',
        structuredContent: {
          headings: [], // No headings
          paragraphs: ['Single paragraph'],
          lists: [], // No lists
          quotes: [], // No quotes
          images: [],
          links: [],
          tables: [],
          codeBlocks: []
        },
        metadata: {
          title: 'Unstructured Article',
          sourceUrl: 'https://example.com/unstructured',
          domain: 'example.com',
          language: 'en',
          contentType: 'article',
          estimatedReadingTime: 1
        },
        quality: {
          wordCount: 150,
          readingTime: 1,
          complexity: 'intermediate',
          suitabilityScore: 0.7,
          issues: [],
          meetsMinimumStandards: true,
          readabilityScore: 65,
          vocabularyComplexity: 0.4,
          sentenceComplexity: 0.3
        },
        sourceInfo: {
          url: 'https://example.com/unstructured',
          domain: 'example.com',
          title: 'Unstructured Article',
          extractedAt: new Date(),
          userAgent: 'Test Agent',
          attribution: 'Test attribution'
        },
        suggestedLessonType: 'discussion',
        suggestedCEFRLevel: 'B1'
      };

      const result = extractor.validateContent(mockContent);

      expect(result.isValid).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(rec => rec.includes('headings'))).toBe(true);
    });
  });

  describe('Lesson Type Suggestion', () => {
    it('should suggest business lesson type for business content', async () => {
      const businessContent = 'This article discusses corporate strategy and business management. Companies need to focus on marketing and sales to increase revenue and profit margins.';
      
      mockDocument.querySelector.mockImplementation((selector) => {
        if (selector === 'main') return {
          textContent: businessContent,
          querySelectorAll: vi.fn(() => [])
        };
        if (selector === 'title') return { textContent: 'Business Strategy Guide' };
        return null;
      });

      mockDocument.cloneNode.mockReturnValue({
        ...mockDocument,
        querySelectorAll: vi.fn(() => []),
        body: { textContent: businessContent, querySelectorAll: vi.fn(() => []) }
      });

      const result = await extractor.extractPageContent();
      expect(result.suggestedLessonType).toBe('business');
    });

    it('should suggest travel lesson type for travel content', async () => {
      const travelContent = 'Planning your next vacation? This travel guide covers the best destinations, hotels, and restaurants. Learn about tourist attractions and cultural experiences.';
      
      mockDocument.querySelector.mockImplementation((selector) => {
        if (selector === 'main') return {
          textContent: travelContent,
          querySelectorAll: vi.fn(() => [])
        };
        if (selector === 'title') return { textContent: 'Travel Guide to Europe' };
        return null;
      });

      mockDocument.cloneNode.mockReturnValue({
        ...mockDocument,
        querySelectorAll: vi.fn(() => []),
        body: { textContent: travelContent, querySelectorAll: vi.fn(() => []) }
      });

      const result = await extractor.extractPageContent();
      expect(result.suggestedLessonType).toBe('travel');
    });

    it('should suggest grammar lesson type for grammar content', async () => {
      const grammarContent = 'Understanding English grammar is essential for language learners. This tutorial covers verb tenses, noun usage, and sentence structure. Learn about past tense, present tense, and future tense conjugations.';
      
      mockDocument.querySelector.mockImplementation((selector) => {
        if (selector === 'main') return {
          textContent: grammarContent,
          querySelectorAll: vi.fn(() => [])
        };
        if (selector === 'title') return { textContent: 'English Grammar Tutorial' };
        if (selector === 'meta[name="description"]') return { getAttribute: () => 'Grammar tutorial' };
        return null;
      });

      mockDocument.cloneNode.mockReturnValue({
        ...mockDocument,
        querySelectorAll: vi.fn(() => []),
        body: { textContent: grammarContent, querySelectorAll: vi.fn(() => []) }
      });

      // Mock content type as tutorial
      vi.spyOn(mockWindow.location, 'pathname', 'get').mockReturnValue('/tutorial/grammar');

      const result = await extractor.extractPageContent();
      expect(result.suggestedLessonType).toBe('grammar');
    });

    it('should default to discussion for general content', async () => {
      const generalContent = 'This is a general article about various topics that do not fit into specific categories. It contains interesting information and insights.';
      
      mockDocument.querySelector.mockImplementation((selector) => {
        if (selector === 'main') return {
          textContent: generalContent,
          querySelectorAll: vi.fn(() => [])
        };
        if (selector === 'title') return { textContent: 'General Article' };
        return null;
      });

      mockDocument.cloneNode.mockReturnValue({
        ...mockDocument,
        querySelectorAll: vi.fn(() => []),
        body: { textContent: generalContent, querySelectorAll: vi.fn(() => []) }
      });

      const result = await extractor.extractPageContent();
      expect(result.suggestedLessonType).toBe('discussion');
    });
  });

  describe('CEFR Level Suggestion', () => {
    it('should suggest A1 for simple content', async () => {
      const simpleContent = 'This is easy text. It has short words. The sentences are simple. Students can read this well.';
      
      mockDocument.querySelector.mockImplementation((selector) => {
        if (selector === 'main') return {
          textContent: simpleContent,
          querySelectorAll: vi.fn(() => [])
        };
        return null;
      });

      mockDocument.cloneNode.mockReturnValue({
        ...mockDocument,
        querySelectorAll: vi.fn(() => []),
        body: { textContent: simpleContent, querySelectorAll: vi.fn(() => []) }
      });

      const result = await extractor.extractPageContent();
      expect(['A1', 'A2']).toContain(result.suggestedCEFRLevel);
    });

    it('should suggest higher levels for complex content', async () => {
      const complexContent = 'The implementation of sophisticated methodologies necessitates comprehensive understanding of multifaceted theoretical frameworks and their practical applications in contemporary educational paradigms.';
      
      mockDocument.querySelector.mockImplementation((selector) => {
        if (selector === 'main') return {
          textContent: complexContent,
          querySelectorAll: vi.fn(() => [])
        };
        return null;
      });

      mockDocument.cloneNode.mockReturnValue({
        ...mockDocument,
        querySelectorAll: vi.fn(() => []),
        body: { textContent: complexContent, querySelectorAll: vi.fn(() => []) }
      });

      const result = await extractor.extractPageContent();
      expect(['B2', 'C1']).toContain(result.suggestedCEFRLevel);
    });
  });

  describe('Structured Content Extraction', () => {
    it('should extract headings with hierarchy', async () => {
      const mockMainElement = {
        textContent: 'Content with headings',
        querySelectorAll: vi.fn((selector) => {
          if (selector.includes('h1, h2, h3, h4, h5, h6')) {
            return [
              { tagName: 'H1', textContent: 'Main Title', id: 'main' },
              { tagName: 'H2', textContent: 'Subtitle', id: 'sub' },
              { tagName: 'H3', textContent: 'Section', id: '' }
            ];
          }
          return [];
        })
      };

      mockDocument.querySelector.mockReturnValue(mockMainElement);
      mockDocument.cloneNode.mockReturnValue({
        ...mockDocument,
        querySelectorAll: vi.fn(() => []),
        body: mockMainElement
      });

      const result = await extractor.extractPageContent();
      
      expect(result.structuredContent.headings).toHaveLength(3);
      expect(result.structuredContent.headings[0]).toEqual({
        level: 1,
        text: 'Main Title',
        id: 'main'
      });
      expect(result.structuredContent.headings[1]).toEqual({
        level: 2,
        text: 'Subtitle',
        id: 'sub'
      });
    });

    it('should extract lists with proper structure', async () => {
      const mockListElement = {
        tagName: 'UL',
        children: [
          { tagName: 'LI', textContent: 'First item', querySelectorAll: vi.fn(() => []) },
          { tagName: 'LI', textContent: 'Second item', querySelectorAll: vi.fn(() => []) }
        ]
      };

      const mockMainElement = {
        textContent: 'Content with lists',
        querySelectorAll: vi.fn((selector) => {
          if (selector.includes('ul, ol')) return [mockListElement];
          return [];
        })
      };

      // Mock Array.from for children
      const originalArrayFrom = Array.from;
      vi.stubGlobal('Array', {
        ...Array,
        from: vi.fn((arrayLike) => {
          if (arrayLike === mockListElement.children) {
            return mockListElement.children;
          }
          return originalArrayFrom(arrayLike);
        })
      });

      mockDocument.querySelector.mockReturnValue(mockMainElement);
      mockDocument.cloneNode.mockReturnValue({
        ...mockDocument,
        querySelectorAll: vi.fn(() => []),
        body: mockMainElement
      });

      const result = await extractor.extractPageContent();
      
      expect(result.structuredContent.lists).toHaveLength(1);
      expect(result.structuredContent.lists[0].type).toBe('unordered');
      expect(result.structuredContent.lists[0].items).toContain('First item');
      expect(result.structuredContent.lists[0].items).toContain('Second item');
    });
  });

  describe('Metadata Extraction', () => {
    it('should extract comprehensive metadata', async () => {
      mockDocument.querySelector.mockImplementation((selector) => {
        const selectors: Record<string, any> = {
          'meta[property="og:title"]': { getAttribute: () => 'Open Graph Title' },
          'meta[name="author"]': { getAttribute: () => 'John Doe' },
          'meta[property="article:published_time"]': { getAttribute: () => '2024-01-15T10:00:00Z' },
          'meta[name="description"]': { getAttribute: () => 'Article description' },
          'meta[name="keywords"]': { getAttribute: () => 'language, learning, education' },
          'main': {
            textContent: 'Sample content for metadata extraction testing',
            querySelectorAll: vi.fn(() => [])
          }
        };
        return selectors[selector] || null;
      });

      mockDocument.cloneNode.mockReturnValue({
        ...mockDocument,
        querySelectorAll: vi.fn(() => []),
        body: { textContent: 'Sample content', querySelectorAll: vi.fn(() => []) }
      });

      const result = await extractor.extractPageContent();
      
      expect(result.metadata.title).toBe('Open Graph Title');
      expect(result.metadata.author).toBe('John Doe');
      expect(result.metadata.description).toBe('Article description');
      expect(result.metadata.keywords).toEqual(['language', 'learning', 'education']);
      expect(result.metadata.sourceUrl).toBe('https://example.com/article/test');
      expect(result.metadata.domain).toBe('example.com');
    });
  });
});