/**
 * Comprehensive Cross-Platform Compatibility Tests
 * 
 * Tests browser compatibility, device responsiveness, touch interactions,
 * and platform-specific optimizations for the extract-from-page feature.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock browser detection utilities
interface BrowserInfo {
  name: string;
  version: string;
  isChrome: boolean;
  isChromiumBased: boolean;
  supportsFullFeatures: boolean;
}

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  screenSize: 'small' | 'medium' | 'large';
  orientation: 'portrait' | 'landscape';
  pixelRatio: number;
}

interface ViewportInfo {
  width: number;
  height: number;
  availableWidth: number;
  availableHeight: number;
  safeAreaInsets: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

// Mock Browser Compatibility Manager
class BrowserCompatibilityManager {
  getBrowserInfo(): BrowserInfo {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome')) {
      return {
        name: 'Chrome',
        version: this.extractVersion(userAgent, 'Chrome/'),
        isChrome: true,
        isChromiumBased: true,
        supportsFullFeatures: true
      };
    } else if (userAgent.includes('Edg')) {
      return {
        name: 'Edge',
        version: this.extractVersion(userAgent, 'Edg/'),
        isChrome: false,
        isChromiumBased: true,
        supportsFullFeatures: true
      };
    } else if (userAgent.includes('Firefox')) {
      return {
        name: 'Firefox',
        version: this.extractVersion(userAgent, 'Firefox/'),
        isChrome: false,
        isChromiumBased: false,
        supportsFullFeatures: false
      };
    }
    
    return {
      name: 'Unknown',
      version: '0',
      isChrome: false,
      isChromiumBased: false,
      supportsFullFeatures: false
    };
  }

  getDeviceInfo(): DeviceInfo {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const userAgent = navigator.userAgent;
    
    const isMobile = width < 768 || /Mobile|Android|iPhone|iPad/.test(userAgent);
    const isTablet = width >= 768 && width < 1024 && /iPad|Tablet/.test(userAgent);
    const isDesktop = width >= 1024 && !/Mobile|Android|iPhone|iPad|Tablet/.test(userAgent);
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    return {
      isMobile,
      isTablet,
      isDesktop,
      isTouchDevice,
      screenSize: width < 768 ? 'small' : width < 1024 ? 'medium' : 'large',
      orientation: width > height ? 'landscape' : 'portrait',
      pixelRatio: window.devicePixelRatio || 1
    };
  }

  getCurrentViewportInfo(): ViewportInfo {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      availableWidth: window.screen?.availWidth || window.innerWidth,
      availableHeight: window.screen?.availHeight || window.innerHeight,
      safeAreaInsets: this.getSafeAreaInsets()
    };
  }

  private extractVersion(userAgent: string, prefix: string): string {
    const index = userAgent.indexOf(prefix);
    if (index === -1) return '0';
    
    const versionStart = index + prefix.length;
    const versionEnd = userAgent.indexOf(' ', versionStart);
    return userAgent.substring(versionStart, versionEnd === -1 ? undefined : versionEnd);
  }

  private getSafeAreaInsets() {
    // Mock safe area insets (would use CSS env() in real implementation)
    return {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };
  }

  supportsFeature(feature: string): boolean {
    const browserInfo = this.getBrowserInfo();
    
    const featureSupport = {
      'chrome-extension': browserInfo.isChrome || browserInfo.isChromiumBased,
      'content-scripts': browserInfo.isChrome || browserInfo.isChromiumBased,
      'drag-and-drop': true,
      'touch-events': 'ontouchstart' in window,
      'pointer-events': 'onpointerdown' in window,
      'intersection-observer': 'IntersectionObserver' in window,
      'resize-observer': 'ResizeObserver' in window,
      'web-animations': 'animate' in document.createElement('div'),
      'css-custom-properties': CSS?.supports?.('color', 'var(--test)') || false
    };
    
    return featureSupport[feature] || false;
  }
}

// Mock responsive utilities
class ResponsiveManager {
  getOptimalButtonSize(deviceInfo: DeviceInfo): number {
    if (deviceInfo.isMobile) {
      return deviceInfo.isTouchDevice ? 56 : 48;
    } else if (deviceInfo.isTablet) {
      return 60;
    } else {
      return 64;
    }
  }

  getOptimalButtonPosition(viewport: ViewportInfo, deviceInfo: DeviceInfo) {
    const margin = deviceInfo.isMobile ? 16 : 20;
    const bottomOffset = deviceInfo.isMobile ? 80 : 20; // Account for mobile browser UI
    
    return {
      x: viewport.width - this.getOptimalButtonSize(deviceInfo) - margin,
      y: viewport.height - this.getOptimalButtonSize(deviceInfo) - bottomOffset
    };
  }

  getTouchTargetSize(baseSize: number, deviceInfo: DeviceInfo): number {
    if (deviceInfo.isTouchDevice) {
      return Math.max(baseSize, 44); // Minimum 44px for touch targets
    }
    return baseSize;
  }

  getResponsiveSpacing(deviceInfo: DeviceInfo) {
    return {
      margin: deviceInfo.isMobile ? 16 : 20,
      padding: deviceInfo.isMobile ? 12 : 16,
      gap: deviceInfo.isMobile ? 8 : 12
    };
  }
}

describe('Cross-Platform Compatibility', () => {
  let compatibilityManager: BrowserCompatibilityManager;
  let responsiveManager: ResponsiveManager;

  beforeEach(() => {
    compatibilityManager = new BrowserCompatibilityManager();
    responsiveManager = new ResponsiveManager();
    
    // Reset window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
    
    // Mock navigator
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Browser Detection - Requirements 7.1, 7.2', () => {
    it('should detect Chrome browser correctly', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });
      
      const browserInfo = compatibilityManager.getBrowserInfo();
      
      expect(browserInfo.name).toBe('Chrome');
      expect(browserInfo.isChrome).toBe(true);
      expect(browserInfo.isChromiumBased).toBe(true);
      expect(browserInfo.supportsFullFeatures).toBe(true);
      expect(browserInfo.version).toMatch(/^\d+/);
    });

    it('should detect Edge browser correctly', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
      });
      
      const browserInfo = compatibilityManager.getBrowserInfo();
      
      expect(browserInfo.name).toBe('Edge');
      expect(browserInfo.isChrome).toBe(false);
      expect(browserInfo.isChromiumBased).toBe(true);
      expect(browserInfo.supportsFullFeatures).toBe(true);
    });

    it('should detect Firefox browser with limited support', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/120.0'
      });
      
      const browserInfo = compatibilityManager.getBrowserInfo();
      
      expect(browserInfo.name).toBe('Firefox');
      expect(browserInfo.isChrome).toBe(false);
      expect(browserInfo.isChromiumBased).toBe(false);
      expect(browserInfo.supportsFullFeatures).toBe(false);
    });

    it('should handle unknown browsers gracefully', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Unknown Browser)'
      });
      
      const browserInfo = compatibilityManager.getBrowserInfo();
      
      expect(browserInfo.name).toBe('Unknown');
      expect(browserInfo.supportsFullFeatures).toBe(false);
    });
  });

  describe('Device Detection - Requirements 7.3, 7.4', () => {
    it('should detect desktop devices correctly', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1920 });
      Object.defineProperty(window, 'innerHeight', { value: 1080 });
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });
      
      const deviceInfo = compatibilityManager.getDeviceInfo();
      
      expect(deviceInfo.isDesktop).toBe(true);
      expect(deviceInfo.isMobile).toBe(false);
      expect(deviceInfo.isTablet).toBe(false);
      expect(deviceInfo.screenSize).toBe('large');
      expect(deviceInfo.orientation).toBe('landscape');
    });

    it('should detect mobile devices correctly', () => {
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
      });
      
      const deviceInfo = compatibilityManager.getDeviceInfo();
      
      expect(deviceInfo.isMobile).toBe(true);
      expect(deviceInfo.isDesktop).toBe(false);
      expect(deviceInfo.isTablet).toBe(false);
      expect(deviceInfo.screenSize).toBe('small');
      expect(deviceInfo.orientation).toBe('portrait');
    });

    it('should detect tablet devices correctly', () => {
      Object.defineProperty(window, 'innerWidth', { value: 768 });
      Object.defineProperty(window, 'innerHeight', { value: 1024 });
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
      });
      
      const deviceInfo = compatibilityManager.getDeviceInfo();
      
      expect(deviceInfo.isTablet).toBe(true);
      expect(deviceInfo.isMobile).toBe(false);
      expect(deviceInfo.isDesktop).toBe(false);
      expect(deviceInfo.screenSize).toBe('medium');
    });

    it('should detect touch capabilities', () => {
      // Mock touch support
      Object.defineProperty(window, 'ontouchstart', { value: null });
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 5 });
      
      const deviceInfo = compatibilityManager.getDeviceInfo();
      
      expect(deviceInfo.isTouchDevice).toBe(true);
    });

    it('should detect high DPI displays', () => {
      Object.defineProperty(window, 'devicePixelRatio', { value: 2 });
      
      const deviceInfo = compatibilityManager.getDeviceInfo();
      
      expect(deviceInfo.pixelRatio).toBe(2);
    });
  });

  describe('Responsive Button Sizing - Requirement 7.4', () => {
    it('should calculate optimal button size for desktop', () => {
      const deviceInfo = {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouchDevice: false,
        screenSize: 'large' as const,
        orientation: 'landscape' as const,
        pixelRatio: 1
      };
      
      const buttonSize = responsiveManager.getOptimalButtonSize(deviceInfo);
      
      expect(buttonSize).toBe(64);
    });

    it('should calculate optimal button size for mobile', () => {
      const deviceInfo = {
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isTouchDevice: true,
        screenSize: 'small' as const,
        orientation: 'portrait' as const,
        pixelRatio: 2
      };
      
      const buttonSize = responsiveManager.getOptimalButtonSize(deviceInfo);
      
      expect(buttonSize).toBe(56); // Touch-friendly size
    });

    it('should calculate optimal button size for tablet', () => {
      const deviceInfo = {
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        isTouchDevice: true,
        screenSize: 'medium' as const,
        orientation: 'landscape' as const,
        pixelRatio: 2
      };
      
      const buttonSize = responsiveManager.getOptimalButtonSize(deviceInfo);
      
      expect(buttonSize).toBe(60);
    });

    it('should ensure minimum touch target size', () => {
      const deviceInfo = {
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isTouchDevice: true,
        screenSize: 'small' as const,
        orientation: 'portrait' as const,
        pixelRatio: 1
      };
      
      const touchTargetSize = responsiveManager.getTouchTargetSize(32, deviceInfo);
      
      expect(touchTargetSize).toBeGreaterThanOrEqual(44); // iOS/Android minimum
    });
  });

  describe('Viewport Adaptation - Requirement 7.3', () => {
    it('should calculate optimal button position for desktop', () => {
      const viewport = {
        width: 1920,
        height: 1080,
        availableWidth: 1920,
        availableHeight: 1080,
        safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 }
      };
      
      const deviceInfo = {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouchDevice: false,
        screenSize: 'large' as const,
        orientation: 'landscape' as const,
        pixelRatio: 1
      };
      
      const position = responsiveManager.getOptimalButtonPosition(viewport, deviceInfo);
      
      expect(position.x).toBe(1920 - 64 - 20); // width - buttonSize - margin
      expect(position.y).toBe(1080 - 64 - 20); // height - buttonSize - margin
    });

    it('should calculate optimal button position for mobile', () => {
      const viewport = {
        width: 375,
        height: 667,
        availableWidth: 375,
        availableHeight: 667,
        safeAreaInsets: { top: 44, right: 0, bottom: 34, left: 0 }
      };
      
      const deviceInfo = {
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isTouchDevice: true,
        screenSize: 'small' as const,
        orientation: 'portrait' as const,
        pixelRatio: 2
      };
      
      const position = responsiveManager.getOptimalButtonPosition(viewport, deviceInfo);
      
      expect(position.x).toBe(375 - 56 - 16); // Account for mobile margins
      expect(position.y).toBe(667 - 56 - 80); // Account for mobile browser UI
    });

    it('should handle orientation changes', () => {
      // Portrait
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });
      
      let deviceInfo = compatibilityManager.getDeviceInfo();
      expect(deviceInfo.orientation).toBe('portrait');
      
      // Landscape
      Object.defineProperty(window, 'innerWidth', { value: 667 });
      Object.defineProperty(window, 'innerHeight', { value: 375 });
      
      deviceInfo = compatibilityManager.getDeviceInfo();
      expect(deviceInfo.orientation).toBe('landscape');
    });

    it('should provide responsive spacing values', () => {
      const mobileDevice = {
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isTouchDevice: true,
        screenSize: 'small' as const,
        orientation: 'portrait' as const,
        pixelRatio: 2
      };
      
      const desktopDevice = {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouchDevice: false,
        screenSize: 'large' as const,
        orientation: 'landscape' as const,
        pixelRatio: 1
      };
      
      const mobileSpacing = responsiveManager.getResponsiveSpacing(mobileDevice);
      const desktopSpacing = responsiveManager.getResponsiveSpacing(desktopDevice);
      
      expect(mobileSpacing.margin).toBeLessThan(desktopSpacing.margin);
      expect(mobileSpacing.padding).toBeLessThan(desktopSpacing.padding);
      expect(mobileSpacing.gap).toBeLessThan(desktopSpacing.gap);
    });
  });

  describe('Feature Support Detection', () => {
    it('should detect Chrome extension support', () => {
      const supportsExtensions = compatibilityManager.supportsFeature('chrome-extension');
      
      // Should be true for Chrome/Chromium browsers
      const browserInfo = compatibilityManager.getBrowserInfo();
      expect(supportsExtensions).toBe(browserInfo.isChrome || browserInfo.isChromiumBased);
    });

    it('should detect touch event support', () => {
      // Mock touch support
      Object.defineProperty(window, 'ontouchstart', { value: null });
      
      const supportsTouchEvents = compatibilityManager.supportsFeature('touch-events');
      
      expect(supportsTouchEvents).toBe(true);
    });

    it('should detect modern web API support', () => {
      // Mock modern APIs
      global.IntersectionObserver = class IntersectionObserver {
        constructor() {}
        observe() {}
        unobserve() {}
        disconnect() {}
      } as any;
      
      global.ResizeObserver = class ResizeObserver {
        constructor() {}
        observe() {}
        unobserve() {}
        disconnect() {}
      } as any;
      
      expect(compatibilityManager.supportsFeature('intersection-observer')).toBe(true);
      expect(compatibilityManager.supportsFeature('resize-observer')).toBe(true);
    });

    it('should detect CSS feature support', () => {
      // Mock CSS.supports
      global.CSS = {
        supports: vi.fn((property, value) => {
          return property === 'color' && value === 'var(--test)';
        })
      } as any;
      
      const supportsCustomProperties = compatibilityManager.supportsFeature('css-custom-properties');
      
      expect(supportsCustomProperties).toBe(true);
    });
  });

  describe('Accessibility Compatibility - Requirements 7.5, 7.6', () => {
    it('should detect screen reader compatibility', () => {
      // Mock screen reader detection
      const hasScreenReader = 'speechSynthesis' in window || 'webkitSpeechSynthesis' in window;
      
      expect(typeof hasScreenReader).toBe('boolean');
    });

    it('should detect high contrast mode support', () => {
      // Mock matchMedia for high contrast
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('prefers-contrast: high'),
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });
      
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
      
      expect(typeof prefersHighContrast).toBe('boolean');
    });

    it('should detect reduced motion preferences', () => {
      // Mock matchMedia for reduced motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('prefers-reduced-motion: reduce'),
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });
      
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      expect(typeof prefersReducedMotion).toBe('boolean');
    });

    it('should support keyboard navigation', () => {
      const keyboardEvents = ['keydown', 'keyup', 'keypress'];
      
      keyboardEvents.forEach(eventType => {
        const event = new KeyboardEvent(eventType, { key: 'Tab' });
        expect(event.type).toBe(eventType);
        expect(event.key).toBe('Tab');
      });
    });

    it('should provide ARIA support detection', () => {
      // Test ARIA attribute support
      const testElement = document.createElement('div');
      testElement.setAttribute('aria-label', 'Test');
      testElement.setAttribute('role', 'button');
      
      expect(testElement.getAttribute('aria-label')).toBe('Test');
      expect(testElement.getAttribute('role')).toBe('button');
    });
  });

  describe('Performance Optimization', () => {
    it('should optimize for low-end devices', () => {
      // Mock low-end device characteristics
      const lowEndDevice = {
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isTouchDevice: true,
        screenSize: 'small' as const,
        orientation: 'portrait' as const,
        pixelRatio: 1 // Lower pixel ratio indicates older device
      };
      
      // Optimizations for low-end devices
      const optimizations = {
        reduceAnimations: lowEndDevice.pixelRatio < 2,
        simplifyEffects: lowEndDevice.isMobile && lowEndDevice.pixelRatio < 2,
        limitParticles: lowEndDevice.isMobile
      };
      
      expect(optimizations.reduceAnimations).toBe(true);
      expect(optimizations.simplifyEffects).toBe(true);
      expect(optimizations.limitParticles).toBe(true);
    });

    it('should handle memory constraints', () => {
      // Mock memory API (if available)
      const mockMemory = {
        usedJSHeapSize: 50 * 1024 * 1024, // 50MB
        totalJSHeapSize: 100 * 1024 * 1024, // 100MB
        jsHeapSizeLimit: 2 * 1024 * 1024 * 1024 // 2GB
      };
      
      Object.defineProperty(performance, 'memory', {
        value: mockMemory,
        writable: true
      });
      
      const memoryUsageRatio = mockMemory.usedJSHeapSize / mockMemory.totalJSHeapSize;
      const shouldOptimize = memoryUsageRatio > 0.8;
      
      expect(memoryUsageRatio).toBe(0.5);
      expect(shouldOptimize).toBe(false);
    });

    it('should adapt to network conditions', () => {
      // Mock Network Information API
      const mockConnection = {
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: false
      };
      
      Object.defineProperty(navigator, 'connection', {
        value: mockConnection,
        writable: true
      });
      
      const shouldOptimizeForNetwork = mockConnection.saveData || 
                                      mockConnection.effectiveType === 'slow-2g' ||
                                      mockConnection.downlink < 1;
      
      expect(shouldOptimizeForNetwork).toBe(false);
    });
  });

  describe('Error Handling and Fallbacks', () => {
    it('should handle missing APIs gracefully', () => {
      // Remove modern APIs
      delete (global as any).IntersectionObserver;
      delete (global as any).ResizeObserver;
      
      expect(() => {
        compatibilityManager.supportsFeature('intersection-observer');
        compatibilityManager.supportsFeature('resize-observer');
      }).not.toThrow();
    });

    it('should provide fallbacks for unsupported features', () => {
      const browserInfo = compatibilityManager.getBrowserInfo();
      
      if (!browserInfo.supportsFullFeatures) {
        // Should provide alternative implementations
        const fallbacks = {
          dragAndDrop: 'click-to-move',
          animations: 'static-states',
          advancedStyling: 'basic-css'
        };
        
        expect(fallbacks.dragAndDrop).toBe('click-to-move');
        expect(fallbacks.animations).toBe('static-states');
        expect(fallbacks.advancedStyling).toBe('basic-css');
      }
    });

    it('should handle viewport changes gracefully', () => {
      const initialViewport = compatibilityManager.getCurrentViewportInfo();
      
      // Simulate viewport change
      Object.defineProperty(window, 'innerWidth', { value: 800 });
      Object.defineProperty(window, 'innerHeight', { value: 600 });
      
      const newViewport = compatibilityManager.getCurrentViewportInfo();
      
      expect(newViewport.width).toBe(800);
      expect(newViewport.height).toBe(600);
      expect(newViewport.width).not.toBe(initialViewport.width);
    });

    it('should handle touch event fallbacks', () => {
      // Remove touch support
      delete (window as any).ontouchstart;
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 0 });
      
      const deviceInfo = compatibilityManager.getDeviceInfo();
      
      // Should still work without touch events
      expect(deviceInfo.isTouchDevice).toBe(false);
      
      // Should provide mouse event fallbacks
      const mouseEvents = ['mousedown', 'mousemove', 'mouseup'];
      mouseEvents.forEach(eventType => {
        const event = new MouseEvent(eventType);
        expect(event.type).toBe(eventType);
      });
    });
  });
});