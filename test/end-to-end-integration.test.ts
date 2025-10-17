/**
 * End-to-End Integration Tests for Extract from Page Feature
 * 
 * Tests complete user workflows from page load to lesson generation,
 * simulating real-world usage scenarios and user interactions.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContentAnalysisEngine } from '@/lib/content-analysis-engine';
import { EnhancedContentExtractor } from '@/lib/enhanced-content-extractor';
import { FloatingActionButton } from '@/components/floating-action-button';
import { LessonInterfaceBridge } from '@/lib/lesson-interface-bridge';
import { ExtractionSessionManager } from '@/lib/extraction-session-manager';
import { PrivacyManager } from '@/lib/privacy-manager';
import { ExtractButtonIntegration } from '@/lib/extract-button-integration';

// Real-world content samples for testing
const realWorldContent = {
  bbcNews: {
    url: 'https://www.bbc.com/news/technology-12345678',
    title: 'Artificial Intelligence Transforms Language Learning',
    content: `
      <article class="story-body">
        <h1 class="story-body__h1">Artificial Intelligence Transforms Language Learning</h1>
        <div class="story-body__mini-info-list-and-share">
          <div class="mini-info-list">
            <div class="mini-info-list__item">
              <div class="mini-info-list__item__label">By</div>
              <div class="mini-info-list__item__value">Technology Reporter</div>
            </div>
          </div>
        </div>
        <div class="story-body__inner">
          <p class="story-body__introduction">Revolutionary advances in artificial intelligence are transforming how people learn languages, making education more personalized and effective than ever before.</p>
          <p>Machine learning algorithms can now adapt to individual learning styles, providing customized lessons that adjust in real-time based on student performance and preferences.</p>
          <p>Natural language processing technology enables instant feedback on pronunciation, grammar, and vocabulary usage, helping learners improve more quickly.</p>
          <p>"We're seeing unprecedented improvements in language acquisition rates," says Dr. Sarah Chen, a linguistics professor at Cambridge University. "AI-powered tools are making language learning accessible to millions of people worldwide."</p>
          <p>The technology uses speech recognition to analyze pronunciation patterns and provides targeted exercises to address specific weaknesses in a learner's speaking ability.</p>
          <p>Virtual reality environments are also being integrated into language learning platforms, allowing students to practice conversations in simulated real-world scenarios.</p>
          <p>Industry experts predict that AI-driven language learning will become the dominant educational approach within the next five years, potentially replacing traditional classroom methods for many learners.</p>
        </div>
      </article>
    `,
    expectedWordCount: 180,
    expectedType: 'news',
    expectedLessonType: 'discussion',
  },

  wikipediaArticle: {
    url: 'https://en.wikipedia.org/wiki/Second_language_acquisition',
    title: 'Second Language Acquisition',
    content: `
      <div class="mw-content-text">
        <h1 class="firstHeading">Second Language Acquisition</h1>
        <p><strong>Second-language acquisition</strong> (<strong>SLA</strong>), <strong>second-language learning</strong>, or <strong>L2 acquisition</strong>, is the process by which people learn a second language.</p>
        <h2>Overview</h2>
        <p>Second-language acquisition refers to what learners do; it does not refer to practices in language teaching, although teaching can affect acquisition. The learning of native languages is called first-language acquisition.</p>
        <p>SLA research began as an interdisciplinary field, and because of this it is difficult to identify a precise starting date. However, it does appear to have developed a great deal since the mid-1960s.</p>
        <h2>Theories</h2>
        <p>There are many theories about how second languages are learned. These theories have been influenced by developments in linguistics, psychology, and education.</p>
        <h3>Behaviorist Theory</h3>
        <p>The behaviorist theory suggests that language learning is a process of habit formation. According to this theory, learners acquire language through imitation, practice, and reinforcement.</p>
        <h3>Cognitive Theory</h3>
        <p>Cognitive theories emphasize the mental processes involved in language learning. These theories suggest that learners actively construct their understanding of the target language.</p>
        <h2>Factors Affecting SLA</h2>
        <p>Several factors can influence the success of second language acquisition, including age, motivation, aptitude, and the learning environment.</p>
        <p>The critical period hypothesis suggests that there is an optimal age range for language acquisition, typically before puberty.</p>
      </div>
    `,
    expectedWordCount: 220,
    expectedType: 'encyclopedia',
    expectedLessonType: 'grammar',
  },

  mediumBlog: {
    url: 'https://medium.com/@educator/effective-language-learning-strategies',
    title: '5 Effective Language Learning Strategies That Actually Work',
    content: `
      <article>
        <h1>5 Effective Language Learning Strategies That Actually Work</h1>
        <div class="postMetaInline">
          <span class="author">Maria Rodriguez</span>
          <span class="readingTime">8 min read</span>
        </div>
        <div class="postArticle-content">
          <p class="graf graf--p">Learning a new language can feel overwhelming, but with the right strategies, it becomes an enjoyable and rewarding journey. After teaching languages for over 15 years, I've discovered which methods truly make a difference.</p>
          <h2 class="graf graf--h3">1. Immerse Yourself in the Language Daily</h2>
          <p class="graf graf--p">The most effective language learners create an immersive environment around themselves. This doesn't mean you need to travel abroad – you can create immersion at home.</p>
          <p class="graf graf--p">Change your phone's language settings, watch movies with subtitles in your target language, and listen to podcasts during your commute. The key is consistent, daily exposure.</p>
          <h2 class="graf graf--h3">2. Focus on High-Frequency Words First</h2>
          <p class="graf graf--p">Research shows that the 1,000 most common words in any language make up about 80% of everyday conversation. Start with these words before diving into specialized vocabulary.</p>
          <h2 class="graf graf--h3">3. Practice Speaking from Day One</h2>
          <p class="graf graf--p">Many learners spend months studying grammar and vocabulary before attempting to speak. This is a mistake. Start speaking immediately, even if you only know a few words.</p>
          <p class="graf graf--p">Use language exchange apps, talk to yourself in the mirror, or record voice messages. The goal is to build confidence and muscle memory for pronunciation.</p>
          <h2 class="graf graf--h3">4. Use Spaced Repetition for Vocabulary</h2>
          <p class="graf graf--p">Spaced repetition is scientifically proven to improve long-term retention. Instead of cramming vocabulary, review words at increasing intervals: after 1 day, 3 days, 1 week, 2 weeks, and so on.</p>
          <h2 class="graf graf--h3">5. Learn Grammar in Context</h2>
          <p class="graf graf--p">Rather than memorizing grammar rules in isolation, learn them through examples and real conversations. This approach helps you understand when and how to use different structures naturally.</p>
          <p class="graf graf--p">Remember, language learning is a marathon, not a sprint. Be patient with yourself and celebrate small victories along the way.</p>
        </div>
      </article>
    `,
    expectedWordCount: 320,
    expectedType: 'blog',
    expectedLessonType: 'discussion',
  },
};

// User interaction simulation utilities
class UserInteractionSimulator {
  static async simulatePageLoad(content: any) {
    // Simulate page loading with content
    global.document = {
      querySelector: vi.fn(() => ({
        innerHTML: content.content,
        textContent: content.content.replace(/<[^>]*>/g, ''),
        querySelectorAll: vi.fn(() => []),
      })),
      querySelectorAll: vi.fn(() => []),
      createElement: vi.fn(() => ({
        style: {},
        classList: { add: vi.fn(), remove: vi.fn() },
        addEventListener: vi.fn(),
      })),
      body: { 
        appendChild: vi.fn(), 
        removeChild: vi.fn(),
        style: {},
      },
    } as any;

    global.window = {
      innerWidth: 1024,
      innerHeight: 768,
      location: { href: content.url },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as any;

    // Simulate DOM ready event
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  static async simulateButtonClick() {
    // Simulate user clicking the extract button
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      clientX: 100,
      clientY: 100,
    });
    
    return clickEvent;
  }

  static async simulateButtonDrag(startX: number, startY: number, endX: number, endY: number) {
    const events = [
      new MouseEvent('mousedown', { clientX: startX, clientY: startY }),
      new MouseEvent('mousemove', { clientX: (startX + endX) / 2, clientY: (startY + endY) / 2 }),
      new MouseEvent('mousemove', { clientX: endX, clientY: endY }),
      new MouseEvent('mouseup', { clientX: endX, clientY: endY }),
    ];
    
    return events;
  }

  static async simulateConfirmationDialog(confirm: boolean) {
    return confirm;
  }
}

describe('End-to-End Integration Tests', () => {
  let analysisEngine: ContentAnalysisEngine;
  let extractor: EnhancedContentExtractor;
  let button: FloatingActionButton;
  let bridge: LessonInterfaceBridge;
  let sessionManager: ExtractionSessionManager;
  let privacyManager: PrivacyManager;
  let integration: ExtractButtonIntegration;

  beforeEach(() => {
    // Initialize all components
    analysisEngine = new ContentAnalysisEngine();
    extractor = new EnhancedContentExtractor();
    button = new FloatingActionButton();
    bridge = new LessonInterfaceBridge();
    sessionManager = new ExtractionSessionManager();
    privacyManager = new PrivacyManager();
    integration = new ExtractButtonIntegration();

    // Setup Chrome extension APIs
    global.chrome = {
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
    } as any;

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete User Workflows', () => {
    it('should complete full extraction workflow on BBC News article', async () => {
      const content = realWorldContent.bbcNews;
      
      // Step 1: User navigates to page
      await UserInteractionSimulator.simulatePageLoad(content);
      
      // Step 2: Extension analyzes page content
      const analysisResult = await analysisEngine.analyzePageContent();
      expect(analysisResult.contentType).toBe(content.expectedType);
      expect(analysisResult.wordCount).toBeGreaterThan(content.expectedWordCount * 0.8);
      expect(analysisResult.isEducational).toBe(true);
      
      // Step 3: Button should be displayed
      const shouldShow = analysisEngine.isContentSuitable(analysisResult);
      expect(shouldShow).toBe(true);
      
      button.show();
      expect(button.isVisible()).toBe(true);
      
      // Step 4: User clicks extract button
      const clickEvent = await UserInteractionSimulator.simulateButtonClick();
      
      // Step 5: Content extraction begins
      button.setLoadingState(true);
      expect(button.getState().loading).toBe(true);
      
      const extractedContent = await extractor.extractPageContent();
      expect(extractedContent.text).toContain('Artificial Intelligence');
      expect(extractedContent.metadata.title).toContain('Language Learning');
      expect(extractedContent.suggestedLessonType).toBe(content.expectedLessonType);
      
      // Step 6: Content validation passes
      const validation = extractor.validateContent(extractedContent);
      expect(validation.isValid).toBe(true);
      expect(validation.meetsMinimumQuality).toBe(true);
      
      // Step 7: Confirmation dialog appears
      const userConfirms = await UserInteractionSimulator.simulateConfirmationDialog(true);
      expect(userConfirms).toBe(true);
      
      // Step 8: Lesson interface opens with pre-populated content
      await bridge.openLessonInterface(extractedContent);
      
      expect(global.chrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          extractedContent: expect.objectContaining({
            text: expect.stringContaining('Artificial Intelligence'),
            suggestedLessonType: content.expectedLessonType,
          }),
          extractionSource: 'webpage',
        })
      );
      
      // Step 9: Session is completed successfully
      const session = sessionManager.getCurrentSession();
      expect(session?.status).toBe('complete');
      
      button.showSuccess();
      expect(button.getState().success).toBe(true);
    });

    it('should complete full extraction workflow on Wikipedia article', async () => {
      const content = realWorldContent.wikipediaArticle;
      
      await UserInteractionSimulator.simulatePageLoad(content);
      
      const analysisResult = await analysisEngine.analyzePageContent();
      expect(analysisResult.contentType).toBe(content.expectedType);
      expect(analysisResult.isEducational).toBe(true);
      
      button.show();
      const extractedContent = await extractor.extractPageContent();
      
      expect(extractedContent.text).toContain('Second-language acquisition');
      expect(extractedContent.structuredContent.headings).toContain('Overview');
      expect(extractedContent.structuredContent.headings).toContain('Theories');
      expect(extractedContent.suggestedLessonType).toBe(content.expectedLessonType);
      
      const validation = extractor.validateContent(extractedContent);
      expect(validation.isValid).toBe(true);
      
      await bridge.openLessonInterface(extractedContent);
      expect(global.chrome.storage.local.set).toHaveBeenCalled();
    });

    it('should complete full extraction workflow on Medium blog post', async () => {
      const content = realWorldContent.mediumBlog;
      
      await UserInteractionSimulator.simulatePageLoad(content);
      
      const analysisResult = await analysisEngine.analyzePageContent();
      expect(analysisResult.contentType).toBe(content.expectedType);
      expect(analysisResult.isEducational).toBe(true);
      
      button.show();
      const extractedContent = await extractor.extractPageContent();
      
      expect(extractedContent.text).toContain('language learning strategies');
      expect(extractedContent.metadata.author).toContain('Maria Rodriguez');
      expect(extractedContent.suggestedLessonType).toBe(content.expectedLessonType);
      
      const validation = extractor.validateContent(extractedContent);
      expect(validation.isValid).toBe(true);
      
      await bridge.openLessonInterface(extractedContent);
      expect(global.chrome.storage.local.set).toHaveBeenCalled();
    });
  });

  describe('User Interaction Scenarios', () => {
    it('should handle user dragging button to new position', async () => {
      const content = realWorldContent.bbcNews;
      await UserInteractionSimulator.simulatePageLoad(content);
      
      button.show();
      const initialPosition = button.getPosition();
      
      // Simulate drag from bottom-right to top-left
      const dragEvents = await UserInteractionSimulator.simulateButtonDrag(
        900, 600, 100, 100
      );
      
      button.startDrag(dragEvents[0] as MouseEvent);
      dragEvents.slice(1, -1).forEach(event => {
        button.handleDrag(event as MouseEvent);
      });
      button.endDrag();
      
      const finalPosition = button.getPosition();
      expect(finalPosition.x).not.toBe(initialPosition.x);
      expect(finalPosition.y).not.toBe(initialPosition.y);
      
      // Position should be saved for future visits
      expect(button.getState().position).toEqual(finalPosition);
    });

    it('should handle user canceling extraction confirmation', async () => {
      const content = realWorldContent.wikipediaArticle;
      await UserInteractionSimulator.simulatePageLoad(content);
      
      button.show();
      const extractedContent = await extractor.extractPageContent();
      
      // User cancels confirmation
      const userConfirms = await UserInteractionSimulator.simulateConfirmationDialog(false);
      
      vi.spyOn(bridge, 'showExtractionConfirmation')
        .mockResolvedValue(userConfirms);
      
      const result = await bridge.openLessonInterface(extractedContent);
      expect(result).toBe(false);
      
      // Storage should not be called
      expect(global.chrome.storage.local.set).not.toHaveBeenCalled();
      
      // Button should return to normal state
      expect(button.getState().loading).toBe(false);
    });

    it('should handle user retrying after extraction failure', async () => {
      const content = realWorldContent.mediumBlog;
      await UserInteractionSimulator.simulatePageLoad(content);
      
      button.show();
      
      // First attempt fails
      let attemptCount = 0;
      vi.spyOn(extractor, 'extractPageContent')
        .mockImplementation(async () => {
          attemptCount++;
          if (attemptCount === 1) {
            throw new Error('Network error');
          }
          return {
            text: content.content.replace(/<[^>]*>/g, ''),
            metadata: { sourceUrl: content.url },
            quality: { wordCount: content.expectedWordCount, meetsMinimumStandards: true },
          } as any;
        });
      
      // First click fails
      try {
        await integration.handleExtractClick();
        expect.fail('Should have thrown an error');
      } catch (error) {
        button.showError('Extraction failed. Try again?');
        expect(button.getState().error).toBeTruthy();
      }
      
      // User clicks retry
      button.clearError();
      const retryResult = await integration.handleExtractClick();
      
      expect(retryResult).toBeTruthy();
      expect(attemptCount).toBe(2);
      expect(button.getState().success).toBe(true);
    });
  });

  describe('Cross-Browser Compatibility Scenarios', () => {
    it('should work with Chrome extension Manifest V3', async () => {
      // Setup Manifest V3 environment
      global.chrome.action = {
        openPopup: vi.fn().mockResolvedValue(undefined),
      };
      delete (global.chrome as any).browserAction;
      
      const content = realWorldContent.bbcNews;
      await UserInteractionSimulator.simulatePageLoad(content);
      
      button.show();
      const extractedContent = await extractor.extractPageContent();
      await bridge.openLessonInterface(extractedContent);
      
      // Should use action API instead of browserAction
      expect(global.chrome.action.openPopup).toHaveBeenCalled();
    });

    it('should adapt to different viewport sizes', async () => {
      const viewports = [
        { width: 320, height: 568, name: 'mobile' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 1920, height: 1080, name: 'desktop' },
      ];

      for (const viewport of viewports) {
        global.window.innerWidth = viewport.width;
        global.window.innerHeight = viewport.height;
        
        const content = realWorldContent.wikipediaArticle;
        await UserInteractionSimulator.simulatePageLoad(content);
        
        button.show();
        const position = button.calculateOptimalPosition();
        
        // Button should be positioned within viewport
        expect(position.x).toBeGreaterThan(0);
        expect(position.y).toBeGreaterThan(0);
        expect(position.x).toBeLessThan(viewport.width);
        expect(position.y).toBeLessThan(viewport.height);
        
        // Size should adapt to viewport
        const size = button.getAdaptiveSize();
        if (viewport.width < 768) {
          expect(size).toBe(56); // Mobile size
        } else {
          expect(size).toBe(64); // Desktop size
        }
      }
    });

    it('should handle touch interactions on mobile devices', async () => {
      // Setup mobile environment
      global.window.innerWidth = 375;
      global.window.innerHeight = 667;
      global.navigator = { userAgent: 'Mobile Safari' } as any;
      
      const content = realWorldContent.mediumBlog;
      await UserInteractionSimulator.simulatePageLoad(content);
      
      button.show();
      
      // Simulate touch events
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 } as Touch],
      });
      
      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientX: 150, clientY: 150 } as Touch],
      });
      
      const touchEnd = new TouchEvent('touchend', {
        touches: [],
      });
      
      button.handleTouchStart(touchStart);
      button.handleTouchMove(touchMove);
      button.handleTouchEnd(touchEnd);
      
      // Should handle touch interactions appropriately
      expect(button.isTouchFriendly()).toBe(true);
    });
  });

  describe('Performance Under Load', () => {
    it('should handle multiple rapid page navigations', async () => {
      const contents = [
        realWorldContent.bbcNews,
        realWorldContent.wikipediaArticle,
        realWorldContent.mediumBlog,
      ];

      const startTime = performance.now();
      
      for (const content of contents) {
        await UserInteractionSimulator.simulatePageLoad(content);
        
        const analysisResult = await analysisEngine.analyzePageContent();
        expect(analysisResult.isEducational).toBe(true);
        
        if (analysisEngine.isContentSuitable(analysisResult)) {
          button.show();
          expect(button.isVisible()).toBe(true);
        }
        
        // Simulate quick navigation away
        button.hide();
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should handle rapid navigations efficiently
      expect(totalTime).toBeLessThan(1000); // Less than 1 second for 3 pages
    });

    it('should maintain performance with concurrent extractions', async () => {
      const content = realWorldContent.bbcNews;
      await UserInteractionSimulator.simulatePageLoad(content);
      
      // Simulate multiple users trying to extract simultaneously
      const extractionPromises = Array.from({ length: 3 }, async () => {
        const session = sessionManager.startSession(content.url);
        const extracted = await extractor.extractPageContent();
        sessionManager.completeSession(session.sessionId);
        return extracted;
      });
      
      const startTime = performance.now();
      const results = await Promise.all(extractionPromises);
      const endTime = performance.now();
      
      // All extractions should succeed
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.text).toBeTruthy();
      });
      
      // Should complete efficiently
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });

  describe('Accessibility Integration', () => {
    it('should support keyboard navigation throughout workflow', async () => {
      const content = realWorldContent.wikipediaArticle;
      await UserInteractionSimulator.simulatePageLoad(content);
      
      button.show();
      
      // Test keyboard activation
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      
      // Should respond to Enter key
      button.handleKeyboardActivation(enterEvent);
      expect(button.isKeyboardAccessible()).toBe(true);
      
      // Should respond to Space key
      button.handleKeyboardActivation(spaceEvent);
      expect(button.isKeyboardAccessible()).toBe(true);
      
      // Should have proper ARIA attributes
      expect(button.getAriaLabel()).toBeTruthy();
      expect(button.getAriaDescription()).toBeTruthy();
    });

    it('should provide screen reader announcements during extraction', async () => {
      const content = realWorldContent.mediumBlog;
      await UserInteractionSimulator.simulatePageLoad(content);
      
      const announcements: string[] = [];
      button.setScreenReaderAnnouncer((message: string) => {
        announcements.push(message);
      });
      
      button.show();
      button.setLoadingState(true);
      button.setProgressState(50);
      button.showSuccess();
      
      expect(announcements).toContain('Extract button available');
      expect(announcements).toContain('Content extraction started');
      expect(announcements).toContain('Extraction 50% complete');
      expect(announcements).toContain('Content extracted successfully');
    });

    it('should support high contrast mode', async () => {
      // Simulate high contrast mode
      global.window.matchMedia = vi.fn().mockReturnValue({
        matches: true,
        media: '(prefers-contrast: high)',
      });
      
      const content = realWorldContent.bbcNews;
      await UserInteractionSimulator.simulatePageLoad(content);
      
      button.show();
      
      // Should adapt styling for high contrast
      const styles = button.getHighContrastStyles();
      expect(styles.borderWidth).toBeGreaterThan(1);
      expect(styles.backgroundColor).toBeTruthy();
      expect(styles.color).toBeTruthy();
    });
  });

  describe('Privacy and Security Integration', () => {
    it('should respect robots.txt restrictions', async () => {
      vi.spyOn(privacyManager, 'respectRobotsTxt')
        .mockResolvedValue(false); // Robots.txt disallows
      
      const content = realWorldContent.bbcNews;
      await UserInteractionSimulator.simulatePageLoad(content);
      
      const canExtract = await privacyManager.canExtractFromDomain('bbc.com');
      expect(canExtract).toBe(false);
      
      // Button should not be shown
      const analysisResult = await analysisEngine.analyzePageContent();
      const shouldShow = analysisEngine.isContentSuitable(analysisResult) && canExtract;
      expect(shouldShow).toBe(false);
    });

    it('should handle content sanitization during extraction', async () => {
      const maliciousContent = {
        ...realWorldContent.mediumBlog,
        content: realWorldContent.mediumBlog.content + '<script>alert("xss")</script>',
      };
      
      await UserInteractionSimulator.simulatePageLoad(maliciousContent);
      
      const extractedContent = await extractor.extractPageContent();
      const sanitized = privacyManager.sanitizeContent(extractedContent.text);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('language learning strategies');
    });

    it('should include proper attribution in extracted content', async () => {
      const content = realWorldContent.wikipediaArticle;
      await UserInteractionSimulator.simulatePageLoad(content);
      
      const extractedContent = await extractor.extractPageContent();
      
      expect(extractedContent.metadata.sourceUrl).toBe(content.url);
      expect(extractedContent.sourceInfo.attribution).toBeTruthy();
      
      await bridge.openLessonInterface(extractedContent);
      
      const storedData = (global.chrome.storage.local.set as any).mock.calls[0][0];
      expect(storedData.attribution).toBeTruthy();
    });
  });

  describe('Real-World Edge Cases', () => {
    it('should handle dynamic content loading', async () => {
      const content = realWorldContent.bbcNews;
      
      // Initially load with minimal content
      global.document = {
        querySelector: vi.fn(() => ({
          innerHTML: '<div>Loading...</div>',
          textContent: 'Loading...',
        })),
        querySelectorAll: vi.fn(() => []),
      } as any;
      
      // Initial analysis should not show button
      let analysisResult = await analysisEngine.analyzePageContent();
      expect(analysisResult.wordCount).toBeLessThan(200);
      
      // Simulate content loading after delay
      setTimeout(() => {
        global.document.querySelector = vi.fn(() => ({
          innerHTML: content.content,
          textContent: content.content.replace(/<[^>]*>/g, ''),
        }));
      }, 100);
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Re-analyze after content loads
      analysisResult = await analysisEngine.analyzePageContent();
      expect(analysisResult.wordCount).toBeGreaterThan(200);
      expect(analysisEngine.isContentSuitable(analysisResult)).toBe(true);
    });

    it('should handle single-page application navigation', async () => {
      // Simulate SPA navigation without full page reload
      const contents = [
        realWorldContent.bbcNews,
        realWorldContent.wikipediaArticle,
      ];

      for (const content of contents) {
        // Update URL and content without page reload
        global.window.location.href = content.url;
        global.document.querySelector = vi.fn(() => ({
          innerHTML: content.content,
          textContent: content.content.replace(/<[^>]*>/g, ''),
        }));
        
        // Simulate history.pushState navigation
        const popstateEvent = new PopStateEvent('popstate');
        global.window.dispatchEvent?.(popstateEvent);
        
        // Should re-analyze content for new page
        const analysisResult = await analysisEngine.analyzePageContent();
        expect(analysisResult.isEducational).toBe(true);
        
        if (analysisEngine.isContentSuitable(analysisResult)) {
          button.show();
          expect(button.isVisible()).toBe(true);
        }
      }
    });

    it('should handle network connectivity issues gracefully', async () => {
      const content = realWorldContent.mediumBlog;
      await UserInteractionSimulator.simulatePageLoad(content);
      
      button.show();
      
      // Simulate network going offline during extraction
      vi.spyOn(extractor, 'extractPageContent')
        .mockRejectedValue(new Error('Network unavailable'));
      
      try {
        await integration.handleExtractClick();
        expect.fail('Should have thrown an error');
      } catch (error) {
        button.showError('Network error. Check connection and try again.');
        expect(button.getState().error).toContain('Network error');
        
        // Should offer offline alternatives
        const offlineOptions = integration.getOfflineAlternatives();
        expect(offlineOptions).toContain('manual-selection');
      }
    });
  });
});