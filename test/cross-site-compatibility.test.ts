/**
 * Cross-Site Compatibility Integration Tests
 * 
 * Tests the extract-from-page feature across different website types,
 * content management systems, and site structures.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContentAnalysisEngine } from '@/lib/content-analysis-engine';
import { EnhancedContentExtractor } from '@/lib/enhanced-content-extractor';

// Real-world site structure mocks
const siteStructures = {
  wordpress: {
    selectors: {
      article: '.post-content, .entry-content, article',
      title: '.post-title, .entry-title, h1',
      meta: '.post-meta, .entry-meta',
    },
    content: `
      <article class="post">
        <h1 class="post-title">How to Master English Grammar</h1>
        <div class="post-meta">
          <span class="author">By John Smith</span>
          <span class="date">March 15, 2024</span>
        </div>
        <div class="post-content">
          <p>Learning English grammar can be challenging, but with the right approach, it becomes manageable and even enjoyable.</p>
          <h2>Understanding Basic Grammar Rules</h2>
          <p>The foundation of English grammar lies in understanding parts of speech, sentence structure, and verb tenses.</p>
          <p>Start with simple present tense and gradually work your way up to more complex grammatical structures.</p>
          <h2>Practice Makes Perfect</h2>
          <p>Regular practice is essential for mastering grammar. Try to write sentences using new grammar rules you learn.</p>
          <p>Reading extensively also helps you internalize correct grammar patterns naturally.</p>
        </div>
      </article>
    `,
  },
  
  medium: {
    selectors: {
      article: 'article, .postArticle-content',
      title: 'h1, .graf--title',
      meta: '.postMetaInline',
    },
    content: `
      <article>
        <div class="postMetaInline">
          <span class="author">Jane Doe</span>
          <span class="date">5 min read</span>
        </div>
        <h1 class="graf--title">The Future of Language Learning Technology</h1>
        <div class="postArticle-content">
          <p class="graf">Technology is revolutionizing how we learn languages, making it more accessible and effective than ever before.</p>
          <p class="graf">Artificial intelligence and machine learning are creating personalized learning experiences that adapt to individual needs.</p>
          <p class="graf">Virtual reality and augmented reality are providing immersive environments for language practice.</p>
          <p class="graf">Mobile applications have made language learning possible anywhere, anytime, breaking down traditional barriers.</p>
          <p class="graf">The integration of speech recognition technology helps learners improve their pronunciation in real-time.</p>
        </div>
      </article>
    `,
  },

  wikipedia: {
    selectors: {
      article: '.mw-content-text, #mw-content-text',
      title: '.firstHeading, h1',
      meta: '.infobox',
    },
    content: `
      <div class="mw-content-text">
        <h1 class="firstHeading">Language Acquisition</h1>
        <div class="infobox">
          <tr><td>Field</td><td>Linguistics, Psychology</td></tr>
        </div>
        <p>Language acquisition is the process by which humans acquire the capacity to perceive and comprehend language.</p>
        <h2>Overview</h2>
        <p>Language acquisition involves acquiring the ability to understand and use words and sentences to communicate effectively.</p>
        <p>Children typically begin to understand language before they can produce it, showing comprehension skills earlier than production skills.</p>
        <h2>Theories of Language Acquisition</h2>
        <p>Several theories attempt to explain how language acquisition occurs, including behaviorist, nativist, and social interactionist approaches.</p>
        <p>The critical period hypothesis suggests there is an optimal time window for language acquisition during childhood.</p>
        <h2>Second Language Acquisition</h2>
        <p>Second language acquisition differs from first language acquisition in several important ways, including age effects and transfer from the native language.</p>
      </div>
    `,
  },

  news: {
    selectors: {
      article: 'article, .story-content, .article-body',
      title: '.headline, .story-title, h1',
      meta: '.byline, .article-meta',
    },
    content: `
      <article class="story">
        <h1 class="headline">New Study Reveals Benefits of Multilingual Education</h1>
        <div class="byline">
          <span class="author">Sarah Johnson, Education Reporter</span>
          <span class="date">March 20, 2024</span>
          <span class="location">London</span>
        </div>
        <div class="story-content">
          <p class="lead">A comprehensive study conducted across 15 countries shows significant cognitive benefits for students in multilingual education programs.</p>
          <p>The research, published in the Journal of Educational Psychology, followed 10,000 students over five years to assess the impact of multilingual education.</p>
          <p>Students who participated in programs teaching multiple languages showed improved problem-solving skills, enhanced creativity, and better academic performance overall.</p>
          <p>"The results are remarkable," said Dr. Maria Rodriguez, lead researcher on the project. "Multilingual education doesn't just teach languages; it fundamentally changes how students think and learn."</p>
          <p>The study found that students in multilingual programs scored 23% higher on standardized tests and showed increased cultural awareness and empathy.</p>
          <p>These findings support growing advocacy for multilingual education policies in schools worldwide.</p>
        </div>
      </article>
    `,
  },

  documentation: {
    selectors: {
      article: '.content, .documentation, main',
      title: 'h1, .page-title',
      meta: '.page-meta, .last-updated',
    },
    content: `
      <main class="documentation">
        <h1 class="page-title">Getting Started with Language Learning APIs</h1>
        <div class="page-meta">
          <span class="last-updated">Last updated: March 18, 2024</span>
          <span class="version">Version 2.1</span>
        </div>
        <div class="content">
          <p>This guide will help you integrate language learning capabilities into your applications using our comprehensive API.</p>
          <h2>Authentication</h2>
          <p>All API requests require authentication using an API key. Include your key in the Authorization header of each request.</p>
          <h2>Available Endpoints</h2>
          <p>The API provides several endpoints for different language learning functionalities including translation, grammar checking, and vocabulary building.</p>
          <h2>Rate Limits</h2>
          <p>API requests are limited to 1000 calls per hour for free accounts and 10,000 calls per hour for premium accounts.</p>
          <h2>Error Handling</h2>
          <p>The API returns standard HTTP status codes and detailed error messages to help you troubleshoot integration issues.</p>
        </div>
      </main>
    `,
  },
};

// Mock different site environments
const mockSiteEnvironment = (siteType: keyof typeof siteStructures) => {
  const site = siteStructures[siteType];
  
  return {
    document: {
      querySelector: vi.fn((selector: string) => {
        if (selector.includes('article') || selector.includes('.content')) {
          return {
            innerHTML: site.content,
            textContent: site.content.replace(/<[^>]*>/g, ''),
            querySelectorAll: vi.fn(() => []),
          };
        }
        return null;
      }),
      querySelectorAll: vi.fn(() => []),
    },
    location: {
      href: `https://example-${siteType}.com/article`,
      hostname: `example-${siteType}.com`,
    },
  };
};

describe('Cross-Site Compatibility Integration Tests', () => {
  let analysisEngine: ContentAnalysisEngine;
  let extractor: EnhancedContentExtractor;

  beforeEach(() => {
    analysisEngine = new ContentAnalysisEngine();
    extractor = new EnhancedContentExtractor();
  });

  describe('WordPress Sites', () => {
    it('should extract content from WordPress blogs correctly', async () => {
      const mockEnv = mockSiteEnvironment('wordpress');
      global.document = mockEnv.document as any;
      global.location = mockEnv.location as any;

      const analysisResult = await analysisEngine.analyzePageContent();
      expect(analysisResult.contentType).toBe('blog');
      expect(analysisResult.wordCount).toBeGreaterThan(50);
      expect(analysisResult.isEducational).toBe(true);

      const extractedContent = await extractor.extractPageContent();
      expect(extractedContent.text).toContain('Learning English grammar');
      expect(extractedContent.metadata.title).toContain('Master English Grammar');
      expect(extractedContent.suggestedLessonType).toBe('grammar');
    });

    it('should handle WordPress-specific selectors', async () => {
      const mockEnv = mockSiteEnvironment('wordpress');
      global.document = mockEnv.document as any;

      const content = await extractor.extractPageContent();
      
      // Should extract main content without navigation/sidebar
      expect(content.text).not.toContain('sidebar');
      expect(content.text).not.toContain('navigation');
      
      // Should preserve headings structure
      expect(content.structuredContent.headings).toContain('Understanding Basic Grammar Rules');
      expect(content.structuredContent.headings).toContain('Practice Makes Perfect');
    });
  });

  describe('Medium Articles', () => {
    it('should extract content from Medium articles correctly', async () => {
      const mockEnv = mockSiteEnvironment('medium');
      global.document = mockEnv.document as any;
      global.location = mockEnv.location as any;

      const analysisResult = await analysisEngine.analyzePageContent();
      expect(analysisResult.contentType).toBe('blog');
      expect(analysisResult.wordCount).toBeGreaterThan(40);
      expect(analysisResult.isEducational).toBe(true);

      const extractedContent = await extractor.extractPageContent();
      expect(extractedContent.text).toContain('language learning technology');
      expect(extractedContent.metadata.title).toContain('Future of Language Learning');
      expect(extractedContent.suggestedLessonType).toBe('discussion');
    });

    it('should handle Medium-specific content structure', async () => {
      const mockEnv = mockSiteEnvironment('medium');
      global.document = mockEnv.document as any;

      const content = await extractor.extractPageContent();
      
      // Should extract paragraphs with graf class
      expect(content.text).toContain('Technology is revolutionizing');
      expect(content.text).toContain('Artificial intelligence');
      
      // Should extract reading time metadata
      expect(content.metadata.description).toBeTruthy();
    });
  });

  describe('Wikipedia Articles', () => {
    it('should extract content from Wikipedia articles correctly', async () => {
      const mockEnv = mockSiteEnvironment('wikipedia');
      global.document = mockEnv.document as any;
      global.location = mockEnv.location as any;

      const analysisResult = await analysisEngine.analyzePageContent();
      expect(analysisResult.contentType).toBe('encyclopedia');
      expect(analysisResult.wordCount).toBeGreaterThan(60);
      expect(analysisResult.isEducational).toBe(true);

      const extractedContent = await extractor.extractPageContent();
      expect(extractedContent.text).toContain('Language acquisition');
      expect(extractedContent.metadata.title).toContain('Language Acquisition');
      expect(['discussion', 'grammar']).toContain(extractedContent.suggestedLessonType);
    });

    it('should handle Wikipedia-specific elements', async () => {
      const mockEnv = mockSiteEnvironment('wikipedia');
      global.document = mockEnv.document as any;

      const content = await extractor.extractPageContent();
      
      // Should extract main content from mw-content-text
      expect(content.text).toContain('process by which humans acquire');
      
      // Should preserve section structure
      expect(content.structuredContent.headings).toContain('Overview');
      expect(content.structuredContent.headings).toContain('Theories of Language Acquisition');
      
      // Should handle infobox data appropriately
      expect(content.metadata.keywords).toContain('Linguistics');
    });
  });

  describe('News Sites', () => {
    it('should extract content from news articles correctly', async () => {
      const mockEnv = mockSiteEnvironment('news');
      global.document = mockEnv.document as any;
      global.location = mockEnv.location as any;

      const analysisResult = await analysisEngine.analyzePageContent();
      expect(analysisResult.contentType).toBe('news');
      expect(analysisResult.wordCount).toBeGreaterThan(70);
      expect(analysisResult.isEducational).toBe(true);

      const extractedContent = await extractor.extractPageContent();
      expect(extractedContent.text).toContain('multilingual education');
      expect(extractedContent.metadata.title).toContain('Benefits of Multilingual Education');
      expect(extractedContent.metadata.author).toContain('Sarah Johnson');
      expect(extractedContent.suggestedLessonType).toBe('discussion');
    });

    it('should handle news-specific metadata', async () => {
      const mockEnv = mockSiteEnvironment('news');
      global.document = mockEnv.document as any;

      const content = await extractor.extractPageContent();
      
      // Should extract byline information
      expect(content.metadata.author).toBe('Sarah Johnson');
      expect(content.metadata.publicationDate).toBeTruthy();
      
      // Should identify lead paragraph
      expect(content.text).toContain('comprehensive study conducted');
      
      // Should handle quotes properly
      expect(content.text).toContain('The results are remarkable');
    });
  });

  describe('Documentation Sites', () => {
    it('should extract content from technical documentation correctly', async () => {
      const mockEnv = mockSiteEnvironment('documentation');
      global.document = mockEnv.document as any;
      global.location = mockEnv.location as any;

      const analysisResult = await analysisEngine.analyzePageContent();
      expect(analysisResult.contentType).toBe('tutorial');
      expect(analysisResult.wordCount).toBeGreaterThan(40);
      expect(analysisResult.isEducational).toBe(true);

      const extractedContent = await extractor.extractPageContent();
      expect(extractedContent.text).toContain('Language Learning APIs');
      expect(extractedContent.metadata.title).toContain('Getting Started');
      expect(extractedContent.suggestedLessonType).toBe('business');
    });

    it('should handle documentation-specific structure', async () => {
      const mockEnv = mockSiteEnvironment('documentation');
      global.document = mockEnv.document as any;

      const content = await extractor.extractPageContent();
      
      // Should preserve technical sections
      expect(content.structuredContent.headings).toContain('Authentication');
      expect(content.structuredContent.headings).toContain('Available Endpoints');
      expect(content.structuredContent.headings).toContain('Rate Limits');
      
      // Should extract technical content appropriately
      expect(content.text).toContain('API requests require authentication');
      expect(content.text).toContain('HTTP status codes');
    });
  });

  describe('Content Management System Compatibility', () => {
    it('should work with different CMS article selectors', async () => {
      const cmsSelectors = [
        'article',
        '.post-content',
        '.entry-content',
        '.content',
        '.article-body',
        '.story-content',
        'main',
        '.mw-content-text',
      ];

      for (const selector of cmsSelectors) {
        const mockDoc = {
          querySelector: vi.fn((sel: string) => {
            if (sel.includes(selector.replace('.', ''))) {
              return {
                innerHTML: siteStructures.wordpress.content,
                textContent: 'Test content for selector ' + selector,
              };
            }
            return null;
          }),
          querySelectorAll: vi.fn(() => []),
        };

        global.document = mockDoc as any;
        
        const content = await extractor.extractPageContent();
        expect(content.text).toContain('Test content for selector');
      }
    });

    it('should handle sites with multiple content containers', async () => {
      const mockDoc = {
        querySelector: vi.fn(() => null),
        querySelectorAll: vi.fn((selector: string) => {
          if (selector.includes('article') || selector.includes('.content')) {
            return [
              { textContent: 'First content section', innerHTML: '<p>First content section</p>' },
              { textContent: 'Second content section', innerHTML: '<p>Second content section</p>' },
            ];
          }
          return [];
        }),
      };

      global.document = mockDoc as any;
      
      const content = await extractor.extractPageContent();
      expect(content.text).toContain('First content section');
      expect(content.text).toContain('Second content section');
    });
  });

  describe('Site-Specific Exclusions', () => {
    it('should exclude social media content appropriately', async () => {
      const socialMediaContent = `
        <div class="social-feed">
          <div class="post">Like and share!</div>
          <div class="comments">
            <div class="comment">Great post!</div>
            <div class="comment">Thanks for sharing</div>
          </div>
        </div>
      `;

      const mockDoc = {
        querySelector: vi.fn(() => ({
          innerHTML: socialMediaContent,
          textContent: socialMediaContent.replace(/<[^>]*>/g, ''),
        })),
        querySelectorAll: vi.fn(() => []),
      };

      global.document = mockDoc as any;
      
      const analysisResult = await analysisEngine.analyzePageContent();
      expect(analysisResult.hasSocialMediaFeeds).toBe(true);
      expect(analysisResult.isEducational).toBe(false);
    });

    it('should exclude e-commerce product pages', async () => {
      const ecommerceContent = `
        <div class="product-page">
          <h1>Product Name</h1>
          <div class="price">$99.99</div>
          <button class="add-to-cart">Add to Cart</button>
          <div class="product-description">Short product description</div>
        </div>
      `;

      const mockDoc = {
        querySelector: vi.fn(() => ({
          innerHTML: ecommerceContent,
          textContent: ecommerceContent.replace(/<[^>]*>/g, ''),
        })),
        querySelectorAll: vi.fn(() => []),
      };

      global.document = mockDoc as any;
      
      const analysisResult = await analysisEngine.analyzePageContent();
      expect(analysisResult.contentType).toBe('ecommerce');
      expect(analysisResult.isEducational).toBe(false);
    });
  });

  describe('Performance Across Different Sites', () => {
    it('should maintain consistent performance across site types', async () => {
      const performanceResults: { [key: string]: number } = {};

      for (const [siteType, _] of Object.entries(siteStructures)) {
        const mockEnv = mockSiteEnvironment(siteType as keyof typeof siteStructures);
        global.document = mockEnv.document as any;
        global.location = mockEnv.location as any;

        const startTime = performance.now();
        await analysisEngine.analyzePageContent();
        await extractor.extractPageContent();
        const endTime = performance.now();

        performanceResults[siteType] = endTime - startTime;
      }

      // All site types should complete within reasonable time
      Object.entries(performanceResults).forEach(([siteType, time]) => {
        expect(time).toBeLessThan(1000); // 1 second max
      });

      // Performance should be consistent across site types (within 2x variance)
      const times = Object.values(performanceResults);
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      expect(maxTime / minTime).toBeLessThan(2);
    });
  });
});