/**
 * Cross-Browser Integration Tests
 * 
 * Tests the complete extract-from-page-button feature across different
 * browsers, devices, and screen sizes.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BrowserCompatibility } from '@/lib/browser-compatibility';
import { ExtractButtonIntegration } from '@/lib/extract-button-integration';

// Mock DOM environment for different browsers and devices
interface MockEnvironment {
  userAgent: string;
  vendor: string;
  maxTouchPoints: number;
  innerWidth: number;
  innerHeight: number;
  devicePixelRatio: number;
  matchMedia: (query: string) => MediaQueryList;
}

const createMockEnvironment = (config: Partial<MockEnvironment>): MockEnvironment => ({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  vendor: 'Google Inc.',
  maxTouchPoints: 0,
  innerWidth: 1024,
  innerHeight: 768,
  devicePixelRatio: 1,
  matchMedia: vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })),
  ...config
});

const setupMockEnvironment = (env: MockEnvironment) => {
  Object.defineProperty(global, 'navigator', {
    value: {
      userAgent: env.userAgent,
      vendor: env.vendor,
      maxTouchPoints: env.maxTouchPoints
    },
    writable: true
  });

  Object.defineProperty(global, 'window', {
    value: {
      innerWidth: env.innerWidth,
      innerHeight: env.innerHeight,
      devicePixelRatio: env.devicePixelRatio,
      matchMedia: env.matchMedia,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      ResizeObserver: vi.fn(),
      localStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      },
      sessionStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      },
      MutationObserver: vi.fn(),
      WebGLRenderingContext: {},
      speechSynthesis: {}
    },
    writable: true
  });

  Object.defineProperty(global, 'document', {
    value: {
      createElement: vi.fn(() => ({
        style: {},
        getBoundingClientRect: () => ({ top: 0, left: 0, right: 0, bottom: 0 }),
        remove: vi.fn(),
        appendChild: vi.fn(),
        removeChild: vi.fn()
      })),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn()
      },
      documentElement: {
        lang: 'en',
        style: {
          transition: ''
        }
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      querySelectorAll: vi.fn(() => []),
      querySelector: vi.fn(() => null)
    },
    writable: true
  });
};

describe('Cross-Browser Integration Tests', () => {
  let compatibility: BrowserCompatibility;
  let integration: ExtractButtonIntegration;

  afterEach(() => {
    if (compatibility) {
      compatibility.destroy();
    }
    if (integration) {
      integration.destroy();
    }
  });

  describe('Chrome Browser (Desktop)', () => {
    beforeEach(() => {
      const env = createMockEnvironment({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        vendor: 'Google Inc.',
        innerWidth: 1920,
        innerHeight: 1080
      });
      setupMockEnvironment(env);
      
      compatibility = new BrowserCompatibility();
      integration = new ExtractButtonIntegration();
    });

    it('should detect Chrome correctly and provide full feature support', () => {
      const browserInfo = compatibility.getBrowserInfo();
      
      expect(browserInfo.name).toBe('Chrome');
      expect(browserInfo.isChrome).toBe(true);
      expect(browserInfo.isChromiumBased).toBe(true);
      expect(browserInfo.supportsFullFeatures).toBe(true);
    });

    it('should provide optimal desktop button configuration', () => {
      const buttonSize = compatibility.getOptimalButtonSize();
      const position = compatibility.getOptimalButtonPosition();
      const touchSettings = compatibility.getTouchSettings();
      
      expect(buttonSize).toBe(64); // Standard desktop size
      expect(position.x).toBeGreaterThan(0);
      expect(position.y).toBeGreaterThan(0);
      expect(touchSettings.enabled).toBe(false);
      expect(touchSettings.dragThreshold).toBe(5);
    });

    it('should support all keyboard navigation features', () => {
      const keyboardSettings = compatibility.getKeyboardSettings();
      
      expect(keyboardSettings.enabled).toBe(true);
      expect(keyboardSettings.shortcuts.activate).toBe('Alt+E');
      expect(keyboardSettings.focusVisible).toBe(true);
      expect(keyboardSettings.tabIndex).toBe(0);
    });

    it('should handle content analysis and button visibility correctly', () => {
      const mockCallback = vi.fn();
      integration.initialize(mockCallback);
      
      // Should perform initial analysis
      expect(mockCallback).toHaveBeenCalled();
      
      const cachedAnalysis = integration.getCachedAnalysis();
      expect(cachedAnalysis).toBeTruthy();
    });
  });

  describe('Edge Browser (Desktop)', () => {
    beforeEach(() => {
      const env = createMockEnvironment({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
        vendor: '',
        innerWidth: 1366,
        innerHeight: 768
      });
      setupMockEnvironment(env);
      
      compatibility = new BrowserCompatibility();
      integration = new ExtractButtonIntegration();
    });

    it('should detect Edge correctly and provide full feature support', () => {
      const browserInfo = compatibility.getBrowserInfo();
      
      expect(browserInfo.name).toBe('Edge');
      expect(browserInfo.isEdge).toBe(true);
      expect(browserInfo.isChromiumBased).toBe(true);
      expect(browserInfo.supportsFullFeatures).toBe(true);
    });

    it('should work identically to Chrome for Chromium-based features', () => {
      const buttonSize = compatibility.getOptimalButtonSize();
      const features = compatibility.getFeatures();
      
      expect(buttonSize).toBe(64);
      expect(features.dragAndDrop).toBe(true);
      expect(features.localStorage).toBe(true);
      expect(features.mutationObserver).toBe(true);
    });
  });

  describe('Brave Browser (Desktop)', () => {
    beforeEach(() => {
      const env = createMockEnvironment({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        vendor: 'Google Inc.'
      });
      setupMockEnvironment(env);
      
      // Mock Brave detection
      Object.defineProperty(global.navigator, 'brave', { value: {}, writable: true });
      
      compatibility = new BrowserCompatibility();
      integration = new ExtractButtonIntegration();
    });

    it('should detect Brave correctly and provide full feature support', () => {
      const browserInfo = compatibility.getBrowserInfo();
      
      expect(browserInfo.name).toBe('Brave');
      expect(browserInfo.isBrave).toBe(true);
      expect(browserInfo.isChromiumBased).toBe(true);
      expect(browserInfo.supportsFullFeatures).toBe(true);
    });
  });

  describe('Opera Browser (Desktop)', () => {
    beforeEach(() => {
      const env = createMockEnvironment({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 OPR/77.0.4054.277',
        vendor: ''
      });
      setupMockEnvironment(env);
      
      compatibility = new BrowserCompatibility();
      integration = new ExtractButtonIntegration();
    });

    it('should detect Opera correctly and provide full feature support', () => {
      const browserInfo = compatibility.getBrowserInfo();
      
      expect(browserInfo.name).toBe('Opera');
      expect(browserInfo.isOpera).toBe(true);
      expect(browserInfo.isChromiumBased).toBe(true);
      expect(browserInfo.supportsFullFeatures).toBe(true);
    });
  });

  describe('Mobile Chrome (Android)', () => {
    beforeEach(() => {
      const env = createMockEnvironment({
        userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
        vendor: 'Google Inc.',
        maxTouchPoints: 5,
        innerWidth: 375,
        innerHeight: 667,
        devicePixelRatio: 3
      });
      setupMockEnvironment(env);
      
      compatibility = new BrowserCompatibility();
      integration = new ExtractButtonIntegration();
    });

    it('should detect mobile device correctly', () => {
      const deviceInfo = compatibility.getDeviceInfo();
      
      expect(deviceInfo.isMobile).toBe(true);
      expect(deviceInfo.isTouchDevice).toBe(true);
      expect(deviceInfo.screenSize).toBe('small');
      expect(deviceInfo.orientation).toBe('portrait');
    });

    it('should provide mobile-optimized button configuration', () => {
      const buttonSize = compatibility.getOptimalButtonSize();
      const position = compatibility.getOptimalButtonPosition();
      const touchSettings = compatibility.getTouchSettings();
      
      expect(buttonSize).toBeGreaterThanOrEqual(44); // Minimum touch target
      expect(buttonSize).toBeLessThanOrEqual(64);
      expect(position.y).toBeLessThan(667 - 80); // Avoid mobile browser UI
      expect(touchSettings.enabled).toBe(true);
      expect(touchSettings.dragThreshold).toBe(10); // Larger for touch
    });

    it('should use shorter animation durations on mobile', () => {
      const animationSettings = compatibility.getAnimationSettings();
      
      expect(animationSettings.duration).toBe(200); // Shorter than desktop
    });
  });

  describe('Mobile Safari (iOS)', () => {
    beforeEach(() => {
      const env = createMockEnvironment({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
        vendor: 'Apple Computer, Inc.',
        maxTouchPoints: 5,
        innerWidth: 375,
        innerHeight: 812, // iPhone X dimensions
        devicePixelRatio: 3
      });
      setupMockEnvironment(env);
      
      compatibility = new BrowserCompatibility();
      integration = new ExtractButtonIntegration();
    });

    it('should detect iPhone correctly', () => {
      const deviceInfo = compatibility.getDeviceInfo();
      
      expect(deviceInfo.isMobile).toBe(true);
      expect(deviceInfo.isTouchDevice).toBe(true);
      expect(deviceInfo.pixelRatio).toBe(3);
    });

    it('should consider safe areas for iPhone X and newer', () => {
      const position = compatibility.getOptimalButtonPosition();
      
      // Should account for safe area insets
      expect(position.x).toBeGreaterThan(0);
      expect(position.y).toBeGreaterThan(0);
    });
  });

  describe('Tablet (iPad)', () => {
    beforeEach(() => {
      const env = createMockEnvironment({
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
        vendor: 'Apple Computer, Inc.',
        maxTouchPoints: 5,
        innerWidth: 768,
        innerHeight: 1024,
        devicePixelRatio: 2
      });
      setupMockEnvironment(env);
      
      compatibility = new BrowserCompatibility();
      integration = new ExtractButtonIntegration();
    });

    it('should detect tablet correctly', () => {
      const deviceInfo = compatibility.getDeviceInfo();
      
      expect(deviceInfo.isTablet).toBe(true);
      expect(deviceInfo.isTouchDevice).toBe(true);
      expect(deviceInfo.screenSize).toBe('medium');
    });

    it('should provide tablet-optimized button size', () => {
      const buttonSize = compatibility.getOptimalButtonSize();
      
      expect(buttonSize).toBeGreaterThan(56); // Larger than mobile
      expect(buttonSize).toBeLessThan(72); // Smaller than desktop
    });
  });

  describe('High-DPI Displays', () => {
    beforeEach(() => {
      const env = createMockEnvironment({
        innerWidth: 2560,
        innerHeight: 1440,
        devicePixelRatio: 2
      });
      setupMockEnvironment(env);
      
      compatibility = new BrowserCompatibility();
    });

    it('should adjust button size for high-DPI displays', () => {
      const buttonSize = compatibility.getOptimalButtonSize();
      
      // Should be slightly smaller on high-DPI to maintain visual size
      expect(buttonSize).toBeLessThanOrEqual(64);
      expect(buttonSize).toBeGreaterThanOrEqual(48);
    });
  });

  describe('Accessibility Preferences', () => {
    beforeEach(() => {
      const env = createMockEnvironment({
        matchMedia: vi.fn((query: string) => ({
          matches: query.includes('prefers-reduced-motion') || query.includes('prefers-contrast'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn()
        }))
      });
      setupMockEnvironment(env);
      
      compatibility = new BrowserCompatibility();
    });

    it('should detect and respect reduced motion preference', () => {
      const animationSettings = compatibility.getAnimationSettings();
      const accessibilitySettings = compatibility.getAccessibilitySettings();
      
      expect(animationSettings.enabled).toBe(false);
      expect(animationSettings.duration).toBe(0);
      expect(accessibilitySettings.reducedMotion).toBe(true);
    });

    it('should detect and respect high contrast preference', () => {
      const accessibilitySettings = compatibility.getAccessibilitySettings();
      
      expect(accessibilitySettings.highContrastMode).toBe(true);
    });
  });

  describe('Responsive Design Breakpoints', () => {
    const testBreakpoints = [
      { width: 320, height: 568, expected: 'small' },   // iPhone SE
      { width: 375, height: 667, expected: 'small' },   // iPhone 8
      { width: 768, height: 1024, expected: 'medium' }, // iPad
      { width: 1024, height: 768, expected: 'large' },  // Desktop
      { width: 1920, height: 1080, expected: 'large' }  // Large desktop
    ];

    testBreakpoints.forEach(({ width, height, expected }) => {
      it(`should correctly categorize ${width}x${height} as ${expected}`, () => {
        const env = createMockEnvironment({ innerWidth: width, innerHeight: height });
        setupMockEnvironment(env);
        
        const testCompatibility = new BrowserCompatibility();
        const deviceInfo = testCompatibility.getDeviceInfo();
        
        expect(deviceInfo.screenSize).toBe(expected);
        
        testCompatibility.destroy();
      });
    });
  });

  describe('Orientation Changes', () => {
    it('should handle orientation changes correctly', () => {
      const env = createMockEnvironment({
        innerWidth: 375,
        innerHeight: 667
      });
      setupMockEnvironment(env);
      
      compatibility = new BrowserCompatibility();
      
      let deviceInfo = compatibility.getDeviceInfo();
      expect(deviceInfo.orientation).toBe('portrait');
      
      // Simulate orientation change
      Object.defineProperty(window, 'innerWidth', { value: 667, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 375, writable: true });
      
      // Create new instance to simulate orientation change detection
      const newCompatibility = new BrowserCompatibility();
      deviceInfo = newCompatibility.getDeviceInfo();
      expect(deviceInfo.orientation).toBe('landscape');
      
      newCompatibility.destroy();
    });
  });

  describe('Performance Considerations', () => {
    it('should throttle analysis on rapid DOM changes', () => {
      const env = createMockEnvironment({});
      setupMockEnvironment(env);
      
      integration = new ExtractButtonIntegration({
        analysisThrottleMs: 100,
        enablePerformanceOptimizations: true
      });
      
      const mockCallback = vi.fn();
      integration.initialize(mockCallback);
      
      // Multiple rapid calls should be throttled
      integration.forceAnalysis();
      integration.forceAnalysis();
      integration.forceAnalysis();
      
      // Should not call callback excessively
      expect(mockCallback).toHaveBeenCalledTimes(2); // Initial + one forced
    });

    it('should cache analysis results for performance', () => {
      const env = createMockEnvironment({});
      setupMockEnvironment(env);
      
      integration = new ExtractButtonIntegration({
        cacheExpiryMs: 5000,
        enablePerformanceOptimizations: true
      });
      
      const mockCallback = vi.fn();
      integration.initialize(mockCallback);
      
      const firstAnalysis = integration.getCachedAnalysis();
      const secondAnalysis = integration.getCachedAnalysis();
      
      expect(firstAnalysis).toBe(secondAnalysis); // Should return same cached result
    });
  });

  describe('Error Handling', () => {
    it('should handle missing browser features gracefully', () => {
      const env = createMockEnvironment({});
      setupMockEnvironment(env);
      
      // Remove some features
      delete (window as any).ResizeObserver;
      delete (window as any).MutationObserver;
      
      expect(() => {
        compatibility = new BrowserCompatibility();
      }).not.toThrow();
      
      const features = compatibility.getFeatures();
      expect(features.mutationObserver).toBe(false);
    });

    it('should provide fallback values for unsupported features', () => {
      const env = createMockEnvironment({
        matchMedia: vi.fn(() => {
          throw new Error('matchMedia not supported');
        })
      });
      setupMockEnvironment(env);
      
      expect(() => {
        compatibility = new BrowserCompatibility();
      }).not.toThrow();
      
      const accessibilitySettings = compatibility.getAccessibilitySettings();
      expect(accessibilitySettings).toBeDefined();
    });
  });
});