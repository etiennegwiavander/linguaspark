/**
 * Tests for Extract Button Integration
 * 
 * Tests the integration between ContentAnalysisEngine and FloatingActionButton
 * for intelligent button visibility and real-time page analysis.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ExtractButtonIntegration, type ButtonVisibilityDecision } from '../lib/extract-button-integration';

// Mock DOM environment
const mockDocument = {
  body: {
    textContent: 'This is a test article with enough content to meet the minimum word count requirements for lesson generation. It contains educational content about language learning and has proper structure with headings and paragraphs.',
    querySelectorAll: vi.fn(),
    querySelector: vi.fn()
  },
  title: 'Test Article - Educational Content',
  documentElement: { lang: 'en' },
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(),
  cloneNode: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

// Mock window environment
const mockWindow = {
  location: {
    href: 'https://example.com/article/test',
    hostname: 'example.com',
    pathname: '/article/test'
  },
  innerWidth: 1024,
  innerHeight: 768,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

describe('ExtractButtonIntegration', () => {
  let integration: ExtractButtonIntegration;
  let visibilityCallback: vi.MockedFunction<(decision: ButtonVisibilityDecision) => void>;

  beforeEach(() => {
    // Setup DOM mocks
    global.document = mockDocument as any;
    global.window = mockWindow as any;
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup default mock responses
    mockDocument.querySelectorAll.mockReturnValue([]);
    mockDocument.querySelector.mockReturnValue(null);
    mockDocument.cloneNode.mockReturnValue(mockDocument);
    
    // Create integration instance
    integration = new ExtractButtonIntegration({
      debugMode: true,
      enablePerformanceOptimizations: false // Disable for testing
    });
    
    visibilityCallback = vi.fn();
  });

  afterEach(() => {
    integration.destroy();
  });

  describe('initialization', () => {
    it('should initialize successfully', () => {
      expect(() => {
        integration.initialize(visibilityCallback);
      }).not.toThrow();
    });

    it('should call visibility callback on initialization', () => {
      integration.initialize(visibilityCallback);
      expect(visibilityCallback).toHaveBeenCalled();
    });
  });

  describe('content analysis integration', () => {
    it('should show button for suitable educational content', () => {
      // Mock suitable content
      mockDocument.body.textContent = 'This is a comprehensive educational article about language learning techniques. '.repeat(50);
      mockDocument.querySelectorAll.mockImplementation((selector) => {
        if (selector.includes('h1, h2')) return [{ textContent: 'Title' }, { textContent: 'Subtitle' }];
        if (selector.includes('p')) return [{ textContent: 'Para 1' }, { textContent: 'Para 2' }, { textContent: 'Para 3' }];
        return [];
      });
      
      integration.initialize(visibilityCallback);
      
      const decision = visibilityCallback.mock.calls[0][0];
      expect(decision.shouldShow).toBe(true);
      expect(decision.contentAnalysis.wordCount).toBeGreaterThan(200);
    });

    it('should hide button for insufficient content', () => {
      // Mock insufficient content
      mockDocument.body.textContent = 'Short text';
      
      integration.initialize(visibilityCallback);
      
      const decision = visibilityCallback.mock.calls[0][0];
      expect(decision.shouldShow).toBe(false);
      expect(decision.reason).toContain('Insufficient content');
    });
  });

  describe('performance optimizations', () => {
    it('should throttle analysis calls', async () => {
      integration = new ExtractButtonIntegration({
        analysisThrottleMs: 100,
        enablePerformanceOptimizations: true
      });
      
      integration.initialize(visibilityCallback);
      
      // Clear initial call
      visibilityCallback.mockClear();
      
      // Make multiple rapid calls
      integration.forceAnalysis();
      integration.forceAnalysis();
      integration.forceAnalysis();
      
      // Should only process the forced calls (bypasses throttling)
      expect(visibilityCallback).toHaveBeenCalledTimes(3);
    });

    it('should cache analysis results', () => {
      integration.initialize(visibilityCallback);
      
      const firstDecision = integration.getCachedAnalysis();
      const secondDecision = integration.getCachedAnalysis();
      
      expect(firstDecision).toEqual(secondDecision);
    });

    it('should clear cache when requested', () => {
      integration.initialize(visibilityCallback);
      
      const cachedBefore = integration.getCachedAnalysis();
      integration.clearCache();
      const cachedAfter = integration.getCachedAnalysis();
      
      expect(cachedBefore).toBeTruthy();
      expect(cachedAfter).toBeNull();
    });
  });

  describe('DOM change monitoring', () => {
    it('should setup DOM observer when performance optimizations enabled', () => {
      integration = new ExtractButtonIntegration({
        enablePerformanceOptimizations: true
      });
      
      const mockObserver = {
        observe: vi.fn(),
        disconnect: vi.fn()
      };
      
      global.MutationObserver = vi.fn(() => mockObserver) as any;
      
      integration.initialize(visibilityCallback);
      
      expect(global.MutationObserver).toHaveBeenCalled();
      expect(mockObserver.observe).toHaveBeenCalledWith(mockDocument.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'id', 'style']
      });
    });
  });

  describe('error handling', () => {
    it('should handle analysis errors gracefully', () => {
      // Mock error in analysis
      mockDocument.body.textContent = null as any;
      
      integration.initialize(visibilityCallback);
      
      const decision = visibilityCallback.mock.calls[0][0];
      expect(decision.shouldShow).toBe(false);
      expect(decision.reason).toContain('Analysis failed');
    });

    it('should provide fallback decision on errors', () => {
      // Force an error by making querySelector throw
      mockDocument.querySelector.mockImplementation(() => {
        throw new Error('DOM error');
      });
      
      integration.initialize(visibilityCallback);
      
      const decision = visibilityCallback.mock.calls[0][0];
      expect(decision).toBeDefined();
      expect(decision.shouldShow).toBe(false);
      expect(decision.contentAnalysis).toBeDefined();
    });
  });

  describe('cleanup', () => {
    it('should clean up resources on destroy', () => {
      const mockObserver = {
        observe: vi.fn(),
        disconnect: vi.fn()
      };
      
      global.MutationObserver = vi.fn(() => mockObserver) as any;
      
      integration = new ExtractButtonIntegration({
        enablePerformanceOptimizations: true
      });
      
      integration.initialize(visibilityCallback);
      integration.destroy();
      
      expect(mockObserver.disconnect).toHaveBeenCalled();
    });
  });
});