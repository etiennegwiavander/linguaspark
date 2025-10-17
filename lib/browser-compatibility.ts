/**
 * Browser Compatibility Utilities
 * 
 * Provides cross-browser compatibility detection and adaptation utilities
 * for the extract-from-page-button feature.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

export interface BrowserInfo {
  name: string;
  version: string;
  isChrome: boolean;
  isChromiumBased: boolean;
  isEdge: boolean;
  isBrave: boolean;
  isOpera: boolean;
  supportsFullFeatures: boolean;
}

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  screenSize: 'small' | 'medium' | 'large';
  orientation: 'portrait' | 'landscape';
  pixelRatio: number;
}

export interface ViewportInfo {
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

export interface CompatibilityFeatures {
  dragAndDrop: boolean;
  touchEvents: boolean;
  keyboardNavigation: boolean;
  screenReader: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  webGL: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  mutationObserver: boolean;
}

export class BrowserCompatibility {
  private browserInfo: BrowserInfo;
  private deviceInfo: DeviceInfo;
  private viewportInfo: ViewportInfo;
  private features: CompatibilityFeatures;
  private resizeObserver: ResizeObserver | null = null;
  private orientationChangeListeners: (() => void)[] = [];

  constructor() {
    this.browserInfo = this.detectBrowser();
    this.deviceInfo = this.detectDevice();
    this.viewportInfo = this.getViewportInfo();
    this.features = this.detectFeatures();
    
    this.setupViewportMonitoring();
    this.setupOrientationMonitoring();
  }

  /**
   * Detect browser type and version
   * Requirements: 7.1, 7.2 - Chrome and Chromium-based browser support
   */
  private detectBrowser(): BrowserInfo {
    if (typeof navigator === 'undefined') {
      return {
        name: 'unknown',
        version: '0',
        isChrome: false,
        isChromiumBased: false,
        isEdge: false,
        isBrave: false,
        isOpera: false,
        supportsFullFeatures: false
      };
    }

    const userAgent = navigator.userAgent || '';
    const vendor = navigator.vendor || '';
    
    let name = 'unknown';
    let version = '0';
    let isChrome = false;
    let isChromiumBased = false;
    let isEdge = false;
    let isBrave = false;
    let isOpera = false;

    // Detect Edge (Chromium-based) first
    if (/Edg/.test(userAgent)) {
      name = 'Edge';
      isEdge = true;
      isChromiumBased = true;
      const match = userAgent.match(/Edg\/(\d+)/);
      version = match ? match[1] : '0';
    }
    // Detect Opera (Chromium-based)
    else if (/OPR/.test(userAgent) || /Opera/.test(userAgent)) {
      name = 'Opera';
      isOpera = true;
      isChromiumBased = true;
      const match = userAgent.match(/(?:OPR|Opera)\/(\d+)/);
      version = match ? match[1] : '0';
    }
    // Detect Brave (appears as Chrome but has different characteristics)
    else if (/Chrome/.test(userAgent) && (navigator as any).brave) {
      name = 'Brave';
      isBrave = true;
      isChromiumBased = true;
      const match = userAgent.match(/Chrome\/(\d+)/);
      version = match ? match[1] : '0';
    }
    // Detect Chrome
    else if (/Chrome/.test(userAgent) && /Google Inc/.test(vendor)) {
      name = 'Chrome';
      isChrome = true;
      isChromiumBased = true;
      const match = userAgent.match(/Chrome\/(\d+)/);
      version = match ? match[1] : '0';
    }

    // Full feature support for Chrome and modern Chromium browsers
    const supportsFullFeatures = isChromiumBased && parseInt(version) >= 88;

    return {
      name,
      version,
      isChrome,
      isChromiumBased,
      isEdge,
      isBrave,
      isOpera,
      supportsFullFeatures
    };
  }

  /**
   * Detect device type and capabilities
   * Requirements: 7.3, 7.4 - Responsive design and touch-friendly interactions
   */
  private detectDevice(): DeviceInfo {
    const userAgent = navigator.userAgent;
    const maxTouchPoints = navigator.maxTouchPoints || 0;
    
    // Detect mobile devices
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) ||
                    (window.innerWidth <= 768 && maxTouchPoints > 0);
    
    // Detect tablets (larger touch devices)
    const isTablet = /iPad|Android/i.test(userAgent) && 
                    window.innerWidth > 768 && window.innerWidth <= 1024 &&
                    maxTouchPoints > 0;
    
    const isDesktop = !isMobile && !isTablet;
    const isTouchDevice = maxTouchPoints > 0 || 'ontouchstart' in window;
    
    // Determine screen size category
    let screenSize: 'small' | 'medium' | 'large' = 'medium';
    if (window.innerWidth < 768) {
      screenSize = 'small';
    } else if (window.innerWidth >= 1200) {
      screenSize = 'large';
    }
    
    // Detect orientation
    const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    
    // Get pixel ratio for high-DPI displays
    const pixelRatio = window.devicePixelRatio || 1;

    return {
      isMobile,
      isTablet,
      isDesktop,
      isTouchDevice,
      screenSize,
      orientation,
      pixelRatio
    };
  }

  /**
   * Get current viewport information with safe areas
   * Requirements: 7.3 - Responsive design adaptations
   */
  private getViewportInfo(): ViewportInfo {
    if (typeof window === 'undefined') {
      return {
        width: 1024,
        height: 768,
        availableWidth: 1024,
        availableHeight: 768,
        safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 }
      };
    }

    const width = window.innerWidth || 1024;
    const height = window.innerHeight || 768;
    const availableWidth = window.screen?.availWidth || width;
    const availableHeight = window.screen?.availHeight || height;
    
    // Calculate safe area insets (for mobile devices with notches, etc.)
    const safeAreaInsets = {
      top: this.getSafeAreaInset('top'),
      right: this.getSafeAreaInset('right'),
      bottom: this.getSafeAreaInset('bottom'),
      left: this.getSafeAreaInset('left')
    };

    return {
      width,
      height,
      availableWidth,
      availableHeight,
      safeAreaInsets
    };
  }

  /**
   * Get safe area inset for a specific side
   */
  private getSafeAreaInset(side: 'top' | 'right' | 'bottom' | 'left'): number {
    if (typeof document === 'undefined' || typeof window === 'undefined') return 0;
    
    try {
      // Try to get CSS environment variables for safe areas
      const testElement = document.createElement('div');
      testElement.style.position = 'fixed';
      testElement.style.top = '0';
      testElement.style.left = '0';
      testElement.style.width = '1px';
      testElement.style.height = '1px';
      testElement.style.visibility = 'hidden';
      testElement.style.paddingTop = `env(safe-area-inset-${side}, 0px)`;
      
      document.body.appendChild(testElement);
      const computedStyle = window.getComputedStyle(testElement);
      const paddingValue = computedStyle.paddingTop;
      document.body.removeChild(testElement);
      
      // Parse the padding value to get pixels
      const match = paddingValue.match(/(\d+(?:\.\d+)?)px/);
      return match ? parseFloat(match[1]) : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Detect browser feature support
   * Requirements: 7.1, 7.2 - Cross-browser compatibility
   */
  private detectFeatures(): CompatibilityFeatures {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return {
        dragAndDrop: false,
        touchEvents: false,
        keyboardNavigation: true,
        screenReader: false,
        highContrast: false,
        reducedMotion: false,
        webGL: false,
        localStorage: false,
        sessionStorage: false,
        mutationObserver: false
      };
    }

    try {
      return {
        dragAndDrop: 'draggable' in document.createElement('div'),
        touchEvents: 'ontouchstart' in window,
        keyboardNavigation: true, // Always supported
        screenReader: 'speechSynthesis' in window,
        highContrast: window.matchMedia ? window.matchMedia('(prefers-contrast: high)').matches : false,
        reducedMotion: window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false,
        webGL: !!window.WebGLRenderingContext,
        localStorage: !!window.localStorage,
        sessionStorage: !!window.sessionStorage,
        mutationObserver: !!window.MutationObserver
      };
    } catch (error) {
      return {
        dragAndDrop: false,
        touchEvents: false,
        keyboardNavigation: true,
        screenReader: false,
        highContrast: false,
        reducedMotion: false,
        webGL: false,
        localStorage: false,
        sessionStorage: false,
        mutationObserver: false
      };
    }
  }

  /**
   * Setup viewport monitoring for responsive updates
   */
  private setupViewportMonitoring(): void {
    const updateViewport = () => {
      this.viewportInfo = this.getViewportInfo();
      this.deviceInfo = this.detectDevice();
    };

    // Use ResizeObserver if available, fallback to resize event
    if (typeof window !== 'undefined' && window.ResizeObserver) {
      try {
        this.resizeObserver = new ResizeObserver(updateViewport);
        this.resizeObserver.observe(document.documentElement);
      } catch (error) {
        // Fallback to resize event if ResizeObserver fails
        window.addEventListener('resize', updateViewport);
      }
    } else if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateViewport);
    }
  }

  /**
   * Setup orientation change monitoring
   */
  private setupOrientationMonitoring(): void {
    if (typeof window === 'undefined') return;
    
    const handleOrientationChange = () => {
      // Small delay to ensure viewport has updated
      setTimeout(() => {
        this.deviceInfo = this.detectDevice();
        this.viewportInfo = this.getViewportInfo();
        this.orientationChangeListeners.forEach(listener => listener());
      }, 100);
    };

    // Listen for orientation changes
    if ('orientation' in window) {
      window.addEventListener('orientationchange', handleOrientationChange);
    }
    
    // Also listen for resize as a fallback
    window.addEventListener('resize', handleOrientationChange);
  }

  /**
   * Get optimal button size based on device and browser
   * Requirements: 7.3, 7.4 - Responsive sizing and touch-friendly interactions
   */
  public getOptimalButtonSize(): number {
    const { isMobile, isTablet, isTouchDevice } = this.deviceInfo;
    const { pixelRatio } = this.deviceInfo;
    
    // Base sizes (in CSS pixels)
    let baseSize = 64; // Desktop default
    
    if (isMobile) {
      baseSize = isTouchDevice ? 56 : 48; // Touch-friendly on mobile
    } else if (isTablet) {
      baseSize = 60; // Slightly smaller than desktop
    }
    
    // Adjust for high-DPI displays
    if (pixelRatio > 2) {
      baseSize = Math.max(48, baseSize - 4);
    }
    
    // Ensure minimum touch target size (44px minimum for accessibility)
    if (isTouchDevice) {
      baseSize = Math.max(44, baseSize);
    }
    
    return baseSize;
  }

  /**
   * Get optimal button position considering safe areas and device constraints
   * Requirements: 7.3, 7.4 - Responsive positioning
   */
  public getOptimalButtonPosition(preferredPosition?: { x: number; y: number }): { x: number; y: number } {
    const { width, height, safeAreaInsets } = this.viewportInfo;
    const { isMobile } = this.deviceInfo;
    const buttonSize = this.getOptimalButtonSize();
    
    // Default position (bottom-right with safe area consideration)
    let x = width - buttonSize - 20 - safeAreaInsets.right;
    let y = height - buttonSize - 20 - safeAreaInsets.bottom;
    
    // On mobile, avoid bottom area where browser UI might appear
    if (isMobile) {
      y = Math.min(y, height - buttonSize - 80); // Extra space for mobile browser UI
    }
    
    // Use preferred position if provided and valid
    if (preferredPosition) {
      const minX = 10 + safeAreaInsets.left;
      const maxX = width - buttonSize - 10 - safeAreaInsets.right;
      const minY = 10 + safeAreaInsets.top;
      const maxY = height - buttonSize - 10 - safeAreaInsets.bottom;
      
      x = Math.max(minX, Math.min(maxX, preferredPosition.x));
      y = Math.max(minY, Math.min(maxY, preferredPosition.y));
    }
    
    return { x, y };
  }

  /**
   * Get touch-friendly interaction settings
   * Requirements: 7.4 - Touch-friendly interactions
   */
  public getTouchSettings(): {
    enabled: boolean;
    tapDelay: number;
    longPressDelay: number;
    dragThreshold: number;
    touchTargetSize: number;
  } {
    const { isTouchDevice } = this.deviceInfo;
    
    return {
      enabled: isTouchDevice,
      tapDelay: isTouchDevice ? 0 : 100, // No delay for touch, slight delay for mouse
      longPressDelay: 500,
      dragThreshold: isTouchDevice ? 10 : 5, // Larger threshold for touch
      touchTargetSize: Math.max(44, this.getOptimalButtonSize()) // Minimum 44px for accessibility
    };
  }

  /**
   * Get keyboard navigation settings
   * Requirements: 7.5 - Keyboard navigation support
   */
  public getKeyboardSettings(): {
    enabled: boolean;
    shortcuts: Record<string, string>;
    focusVisible: boolean;
    tabIndex: number;
  } {
    return {
      enabled: true,
      shortcuts: {
        activate: 'Alt+E',
        moveUp: 'ArrowUp',
        moveDown: 'ArrowDown',
        moveLeft: 'ArrowLeft',
        moveRight: 'ArrowRight',
        escape: 'Escape'
      },
      focusVisible: true,
      tabIndex: 0
    };
  }

  /**
   * Get accessibility settings
   * Requirements: 7.5, 7.6 - Accessibility features
   */
  public getAccessibilitySettings(): {
    screenReaderSupport: boolean;
    highContrastMode: boolean;
    reducedMotion: boolean;
    ariaLabels: Record<string, string>;
    announcements: boolean;
  } {
    const { highContrast, reducedMotion, screenReader } = this.features;
    
    return {
      screenReaderSupport: screenReader,
      highContrastMode: highContrast,
      reducedMotion: reducedMotion,
      ariaLabels: {
        button: 'Extract content from page for lesson generation',
        dragging: 'Dragging extract button. Use arrow keys to position, Enter to drop.',
        loading: 'Extracting content, please wait',
        success: 'Content extracted successfully',
        error: 'Content extraction failed'
      },
      announcements: screenReader
    };
  }

  /**
   * Get animation settings based on user preferences and device capabilities
   */
  public getAnimationSettings(): {
    enabled: boolean;
    duration: number;
    easing: string;
    reducedMotion: boolean;
  } {
    const { reducedMotion } = this.features;
    const { isMobile } = this.deviceInfo;
    
    return {
      enabled: !reducedMotion,
      duration: reducedMotion ? 0 : (isMobile ? 200 : 300),
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      reducedMotion
    };
  }

  /**
   * Add orientation change listener
   */
  public onOrientationChange(callback: () => void): () => void {
    this.orientationChangeListeners.push(callback);
    
    // Return cleanup function
    return () => {
      const index = this.orientationChangeListeners.indexOf(callback);
      if (index > -1) {
        this.orientationChangeListeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current browser info
   */
  public getBrowserInfo(): BrowserInfo {
    return { ...this.browserInfo };
  }

  /**
   * Get current device info
   */
  public getDeviceInfo(): DeviceInfo {
    return { ...this.deviceInfo };
  }

  /**
   * Get current viewport info (public accessor)
   */
  public getCurrentViewportInfo(): ViewportInfo {
    return { ...this.viewportInfo };
  }

  /**
   * Get feature support info
   */
  public getFeatures(): CompatibilityFeatures {
    return { ...this.features };
  }

  /**
   * Check if a specific feature is supported
   */
  public isFeatureSupported(feature: keyof CompatibilityFeatures): boolean {
    return this.features[feature];
  }

  /**
   * Get CSS media queries for responsive design
   */
  public getMediaQueries(): Record<string, string> {
    return {
      mobile: '(max-width: 767px)',
      tablet: '(min-width: 768px) and (max-width: 1023px)',
      desktop: '(min-width: 1024px)',
      touch: '(pointer: coarse)',
      hover: '(hover: hover)',
      highContrast: '(prefers-contrast: high)',
      reducedMotion: '(prefers-reduced-motion: reduce)',
      darkMode: '(prefers-color-scheme: dark)'
    };
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    
    this.orientationChangeListeners = [];
  }
}

// Singleton instance for global use
let compatibilityInstance: BrowserCompatibility | null = null;

export function getBrowserCompatibility(): BrowserCompatibility {
  if (!compatibilityInstance) {
    compatibilityInstance = new BrowserCompatibility();
  }
  return compatibilityInstance;
}

export function destroyBrowserCompatibility(): void {
  if (compatibilityInstance) {
    compatibilityInstance.destroy();
    compatibilityInstance = null;
  }
}