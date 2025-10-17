/**
 * Browser Compatibility Tests
 * 
 * Tests cross-browser compatibility utilities and responsive design features
 * for the extract-from-page-button feature.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BrowserCompatibility, getBrowserCompatibility, destroyBrowserCompatibility } from '@/lib/browser-compatibility';

// Mock window and navigator objects
const mockWindow = {
  innerWidth: 1024,
  innerHeight: 768,
  devicePixelRatio: 1,
  screen: {
    availWidth: 1024,
    availHeight: 768
  },
  matchMedia: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  ResizeObserver: vi.fn(),
  WebGLRenderingContext: {},
  localStorage: {},
  sessionStorage: {},
  MutationObserver: vi.fn()
};

const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  vendor: 'Google Inc.',
  maxTouchPoints: 0,
  brave: undefined
};

const mockDocument = {
  createElement: vi.fn(() => ({
    style: {},
    getBoundingClientRect: () => ({ top: 0, left: 0, right: 0, bottom: 0 }),
    remove: vi.fn()
  })),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  },
  documentElement: {
    lang: 'en'
  },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

describe('BrowserCompatibility', () => {
  let compatibility: BrowserCompatibility;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock matchMedia
    mockWindow.matchMedia.mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? false : 
               query.includes('prefers-contrast') ? false : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }));

    // Setup global mocks
    Object.defineProperty(global, 'window', { value: mockWindow, writable: true });
    Object.defineProperty(global, 'navigator', { value: mockNavigator, writable: true });
    Object.defineProperty(global, 'document', { value: mockDocument, writable: true });

    try {
      compatibility = new BrowserCompatibility();
    } catch (error) {
      // Handle initialization errors gracefully in tests
      console.warn('BrowserCompatibility initialization failed in test:', error);
    }
  });

  afterEach(() => {
    if (compatibility && typeof compatibility.destroy === 'function') {
      compatibility.destroy();
    }
    destroyBrowserCompatibility();
  });

  describe('Browser Detection', () => {
    it('should detect Chrome browser correctly', () => {
      const browserInfo = compatibility.getBrowserInfo();
      
      expect(browserInfo.name).toBe('Chrome');
      expect(browserInfo.isChrome).toBe(true);
      expect(browserInfo.isChromiumBased).toBe(true);
      expect(browserInfo.supportsFullFeatures).toBe(true);
    });

    it('should detect Edge browser correctly', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59';
      
      const newCompatibility = new BrowserCompatibility();
      const browserInfo = newCompatibility.getBrowserInfo();
      
      expect(browserInfo.name).toBe('Edge');
      expect(browserInfo.isEdge).toBe(true);
      expect(browserInfo.isChromiumBased).toBe(true);
      expect(browserInfo.supportsFullFeatures).toBe(true);
      
      newCompatibility.destroy();
    });

    it('should detect Brave browser correctly', () => {
      mockNavigator.brave = {};
      
      const newCompatibility = new BrowserCompatibility();
      const browserInfo = newCompatibility.getBrowserInfo();
      
      expect(browserInfo.name).toBe('Brave');
      expect(browserInfo.isBrave).toBe(true);
      expect(browserInfo.isChromiumBased).toBe(true);
      
      newCompatibility.destroy();
      delete mockNavigator.brave;
    });

    it('should detect Opera browser correctly', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 OPR/77.0.4054.277';
      
      const newCompatibility = new BrowserCompatibility();
      const browserInfo = newCompatibility.getBrowserInfo();
      
      expect(browserInfo.name).toBe('Opera');
      expect(browserInfo.isOpera).toBe(true);
      expect(browserInfo.isChromiumBased).toBe(true);
      
      newCompatibility.destroy();
    });
  });

  describe('Device Detection', () => {
    it('should detect desktop device correctly', () => {
      const deviceInfo = compatibility.getDeviceInfo();
      
      expect(deviceInfo.isDesktop).toBe(true);
      expect(deviceInfo.isMobile).toBe(false);
      expect(deviceInfo.isTablet).toBe(false);
      expect(deviceInfo.screenSize).toBe('medium');
      expect(deviceInfo.orientation).toBe('landscape');
    });

    it('should detect mobile device correctly', () => {
      mockWindow.innerWidth = 375;
      mockWindow.innerHeight = 667;
      mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1';
      mockNavigator.maxTouchPoints = 5;
      
      const newCompatibility = new BrowserCompatibility();
      const deviceInfo = newCompatibility.getDeviceInfo();
      
      expect(deviceInfo.isMobile).toBe(true);
      expect(deviceInfo.isDesktop).toBe(false);
      expect(deviceInfo.isTouchDevice).toBe(true);
      expect(deviceInfo.screenSize).toBe('small');
      expect(deviceInfo.orientation).toBe('portrait');
      
      newCompatibility.destroy();
    });

    it('should detect tablet device correctly', () => {
      mockWindow.innerWidth = 768;
      mockWindow.innerHeight = 1024;
      mockNavigator.userAgent = 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1';
      mockNavigator.maxTouchPoints = 5;
      
      const newCompatibility = new BrowserCompatibility();
      const deviceInfo = newCompatibility.getDeviceInfo();
      
      expect(deviceInfo.isTablet).toBe(true);
      expect(deviceInfo.isMobile).toBe(false);
      expect(deviceInfo.isDesktop).toBe(false);
      expect(deviceInfo.isTouchDevice).toBe(true);
      
      newCompatibility.destroy();
    });
  });

  describe('Viewport Information', () => {
    it('should get correct viewport dimensions', () => {
      const viewportInfo = compatibility.getViewportInfo();
      
      expect(viewportInfo.width).toBe(1024);
      expect(viewportInfo.height).toBe(768);
      expect(viewportInfo.availableWidth).toBe(1024);
      expect(viewportInfo.availableHeight).toBe(768);
    });

    it('should calculate safe area insets', () => {
      const viewportInfo = compatibility.getViewportInfo();
      
      expect(viewportInfo.safeAreaInsets).toEqual({
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      });
    });
  });

  describe('Feature Detection', () => {
    it('should detect browser features correctly', () => {
      const features = compatibility.getFeatures();
      
      expect(features.dragAndDrop).toBe(true);
      expect(features.keyboardNavigation).toBe(true);
      expect(features.localStorage).toBe(true);
      expect(features.sessionStorage).toBe(true);
      expect(features.mutationObserver).toBe(true);
    });

    it('should detect touch support correctly', () => {
      mockNavigator.maxTouchPoints = 5;
      Object.defineProperty(mockWindow, 'ontouchstart', { value: true });
      
      const newCompatibility = new BrowserCompatibility();
      const features = newCompatibility.getFeatures();
      
      expect(features.touchEvents).toBe(true);
      
      newCompatibility.destroy();
    });
  });

  describe('Optimal Button Sizing', () => {
    it('should return correct desktop button size', () => {
      const buttonSize = compatibility.getOptimalButtonSize();
      
      expect(buttonSize).toBe(64); // Default desktop size
    });

    it('should return correct mobile button size', () => {
      mockWindow.innerWidth = 375;
      mockNavigator.maxTouchPoints = 5;
      
      const newCompatibility = new BrowserCompatibility();
      const buttonSize = newCompatibility.getOptimalButtonSize();
      
      expect(buttonSize).toBeGreaterThanOrEqual(44); // Minimum touch target
      expect(buttonSize).toBeLessThanOrEqual(64);
      
      newCompatibility.destroy();
    });

    it('should ensure minimum touch target size', () => {
      mockNavigator.maxTouchPoints = 5;
      
      const newCompatibility = new BrowserCompatibility();
      const buttonSize = newCompatibility.getOptimalButtonSize();
      
      expect(buttonSize).toBeGreaterThanOrEqual(44); // WCAG minimum
      
      newCompatibility.destroy();
    });
  });

  describe('Optimal Button Positioning', () => {
    it('should return safe default position', () => {
      const position = compatibility.getOptimalButtonPosition();
      
      expect(position.x).toBeGreaterThan(0);
      expect(position.y).toBeGreaterThan(0);
      expect(position.x).toBeLessThan(mockWindow.innerWidth);
      expect(position.y).toBeLessThan(mockWindow.innerHeight);
    });

    it('should respect preferred position when valid', () => {
      const preferredPosition = { x: 100, y: 100 };
      const position = compatibility.getOptimalButtonPosition(preferredPosition);
      
      expect(position.x).toBe(100);
      expect(position.y).toBe(100);
    });

    it('should adjust invalid preferred position', () => {
      const preferredPosition = { x: -50, y: -50 }; // Invalid position
      const position = compatibility.getOptimalButtonPosition(preferredPosition);
      
      expect(position.x).toBeGreaterThanOrEqual(10);
      expect(position.y).toBeGreaterThanOrEqual(10);
    });

    it('should consider safe areas on mobile', () => {
      mockWindow.innerWidth = 375;
      mockWindow.innerHeight = 812; // iPhone X dimensions
      
      const newCompatibility = new BrowserCompatibility();
      const position = newCompatibility.getOptimalButtonPosition();
      
      // Should avoid bottom area where mobile browser UI appears
      expect(position.y).toBeLessThan(mockWindow.innerHeight - 80);
      
      newCompatibility.destroy();
    });
  });

  describe('Touch Settings', () => {
    it('should return correct touch settings for desktop', () => {
      const touchSettings = compatibility.getTouchSettings();
      
      expect(touchSettings.enabled).toBe(false);
      expect(touchSettings.tapDelay).toBe(100);
      expect(touchSettings.dragThreshold).toBe(5);
    });

    it('should return correct touch settings for mobile', () => {
      mockNavigator.maxTouchPoints = 5;
      
      const newCompatibility = new BrowserCompatibility();
      const touchSettings = newCompatibility.getTouchSettings();
      
      expect(touchSettings.enabled).toBe(true);
      expect(touchSettings.tapDelay).toBe(0);
      expect(touchSettings.dragThreshold).toBe(10);
      expect(touchSettings.touchTargetSize).toBeGreaterThanOrEqual(44);
      
      newCompatibility.destroy();
    });
  });

  describe('Keyboard Settings', () => {
    it('should return keyboard navigation settings', () => {
      const keyboardSettings = compatibility.getKeyboardSettings();
      
      expect(keyboardSettings.enabled).toBe(true);
      expect(keyboardSettings.shortcuts.activate).toBe('Alt+E');
      expect(keyboardSettings.focusVisible).toBe(true);
      expect(keyboardSettings.tabIndex).toBe(0);
    });
  });

  describe('Accessibility Settings', () => {
    it('should return accessibility settings', () => {
      const accessibilitySettings = compatibility.getAccessibilitySettings();
      
      expect(accessibilitySettings.screenReaderSupport).toBe(true);
      expect(accessibilitySettings.ariaLabels.button).toBeDefined();
      expect(accessibilitySettings.ariaLabels.loading).toBeDefined();
      expect(accessibilitySettings.ariaLabels.success).toBeDefined();
      expect(accessibilitySettings.ariaLabels.error).toBeDefined();
    });

    it('should detect high contrast mode', () => {
      mockWindow.matchMedia.mockImplementation((query: string) => ({
        matches: query.includes('prefers-contrast: high'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }));
      
      const newCompatibility = new BrowserCompatibility();
      const accessibilitySettings = newCompatibility.getAccessibilitySettings();
      
      expect(accessibilitySettings.highContrastMode).toBe(true);
      
      newCompatibility.destroy();
    });

    it('should detect reduced motion preference', () => {
      mockWindow.matchMedia.mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion: reduce'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }));
      
      const newCompatibility = new BrowserCompatibility();
      const accessibilitySettings = newCompatibility.getAccessibilitySettings();
      
      expect(accessibilitySettings.reducedMotion).toBe(true);
      
      newCompatibility.destroy();
    });
  });

  describe('Animation Settings', () => {
    it('should return animation settings for normal motion', () => {
      const animationSettings = compatibility.getAnimationSettings();
      
      expect(animationSettings.enabled).toBe(true);
      expect(animationSettings.duration).toBe(300); // Desktop duration
      expect(animationSettings.reducedMotion).toBe(false);
    });

    it('should return reduced animation settings when preferred', () => {
      mockWindow.matchMedia.mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion: reduce'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }));
      
      const newCompatibility = new BrowserCompatibility();
      const animationSettings = newCompatibility.getAnimationSettings();
      
      expect(animationSettings.enabled).toBe(false);
      expect(animationSettings.duration).toBe(0);
      expect(animationSettings.reducedMotion).toBe(true);
      
      newCompatibility.destroy();
    });

    it('should use shorter duration on mobile', () => {
      mockWindow.innerWidth = 375;
      mockNavigator.maxTouchPoints = 5;
      
      const newCompatibility = new BrowserCompatibility();
      const animationSettings = newCompatibility.getAnimationSettings();
      
      expect(animationSettings.duration).toBe(200); // Mobile duration
      
      newCompatibility.destroy();
    });
  });

  describe('Media Queries', () => {
    it('should provide correct media queries', () => {
      const mediaQueries = compatibility.getMediaQueries();
      
      expect(mediaQueries.mobile).toBe('(max-width: 767px)');
      expect(mediaQueries.tablet).toBe('(min-width: 768px) and (max-width: 1023px)');
      expect(mediaQueries.desktop).toBe('(min-width: 1024px)');
      expect(mediaQueries.touch).toBe('(pointer: coarse)');
      expect(mediaQueries.hover).toBe('(hover: hover)');
      expect(mediaQueries.highContrast).toBe('(prefers-contrast: high)');
      expect(mediaQueries.reducedMotion).toBe('(prefers-reduced-motion: reduce)');
      expect(mediaQueries.darkMode).toBe('(prefers-color-scheme: dark)');
    });
  });

  describe('Orientation Change Handling', () => {
    it('should register orientation change listeners', () => {
      const callback = vi.fn();
      const cleanup = compatibility.onOrientationChange(callback);
      
      expect(typeof cleanup).toBe('function');
      
      // Test cleanup
      cleanup();
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance from getBrowserCompatibility', () => {
      const instance1 = getBrowserCompatibility();
      const instance2 = getBrowserCompatibility();
      
      expect(instance1).toBe(instance2);
    });

    it('should create new instance after destroy', () => {
      const instance1 = getBrowserCompatibility();
      destroyBrowserCompatibility();
      const instance2 = getBrowserCompatibility();
      
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Feature Support Checking', () => {
    it('should check individual feature support', () => {
      expect(compatibility.isFeatureSupported('localStorage')).toBe(true);
      expect(compatibility.isFeatureSupported('dragAndDrop')).toBe(true);
      expect(compatibility.isFeatureSupported('keyboardNavigation')).toBe(true);
    });
  });
});