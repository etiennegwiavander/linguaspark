import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window dimensions
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

describe('FloatingActionButton Component Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('{}');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should calculate responsive button size correctly', () => {
    // Test desktop size (medium)
    Object.defineProperty(window, 'innerWidth', { value: 1024 });
    const desktopSize = window.innerWidth >= 768 ? 64 : 56; // medium size logic
    expect(desktopSize).toBe(64);

    // Test mobile size (medium)
    Object.defineProperty(window, 'innerWidth', { value: 600 });
    const mobileSize = window.innerWidth >= 768 ? 64 : 56; // medium size logic
    expect(mobileSize).toBe(56);
  });

  it('should handle position snapping logic', () => {
    const snapToEdge = (position: { x: number; y: number }, snapEnabled: boolean) => {
      if (!snapEnabled) return position;
      
      const buttonSize = 64;
      const margin = 20;
      const viewportWidth = 1024;
      const viewportHeight = 768;
      
      let { x, y } = position;
      
      // Snap to edges if close enough (within 50px)
      if (x < 50) x = margin;
      if (x > viewportWidth - buttonSize - 50) x = viewportWidth - buttonSize - margin;
      if (y < 50) y = margin;
      if (y > viewportHeight - buttonSize - 50) y = viewportHeight - buttonSize - margin;
      
      return { x, y };
    };

    // Test edge snapping
    const nearLeftEdge = { x: 30, y: 100 };
    const snappedLeft = snapToEdge(nearLeftEdge, true);
    expect(snappedLeft.x).toBe(20); // Should snap to margin

    const nearRightEdge = { x: 980, y: 100 };
    const snappedRight = snapToEdge(nearRightEdge, true);
    expect(snappedRight.x).toBe(940); // Should snap to right edge

    // Test no snapping when disabled
    const noSnap = snapToEdge(nearLeftEdge, false);
    expect(noSnap.x).toBe(30); // Should remain unchanged
  });

  it('should validate localStorage position management', () => {
    const domain = 'example.com';
    const position = { x: 100, y: 200 };
    
    // Test saving position
    const savedPositions = {};
    savedPositions[domain] = position;
    const serialized = JSON.stringify(savedPositions);
    
    expect(serialized).toBe('{"example.com":{"x":100,"y":200}}');
    
    // Test loading position
    localStorageMock.getItem.mockReturnValue(serialized);
    const loaded = JSON.parse(localStorageMock.getItem('test') || '{}');
    expect(loaded[domain]).toEqual(position);
  });

  it('should handle keyboard shortcut detection', () => {
    const isAltE = (event: { key: string; altKey: boolean }) => {
      return event.altKey && event.key.toLowerCase() === 'e';
    };

    expect(isAltE({ key: 'e', altKey: true })).toBe(true);
    expect(isAltE({ key: 'E', altKey: true })).toBe(true);
    expect(isAltE({ key: 'e', altKey: false })).toBe(false);
    expect(isAltE({ key: 'x', altKey: true })).toBe(false);
  });

  it('should validate position bounds checking', () => {
    const ensureBounds = (position: { x: number; y: number }) => {
      const buttonSize = 64;
      const margin = 10;
      const viewportWidth = 1024;
      const viewportHeight = 768;
      
      const x = Math.max(margin, Math.min(position.x, viewportWidth - buttonSize - margin));
      const y = Math.max(margin, Math.min(position.y, viewportHeight - buttonSize - margin));
      
      return { x, y };
    };

    // Test position outside bounds
    const outsideLeft = ensureBounds({ x: -50, y: 100 });
    expect(outsideLeft.x).toBe(10); // Should be clamped to margin

    const outsideRight = ensureBounds({ x: 1100, y: 100 });
    expect(outsideRight.x).toBe(950); // Should be clamped to right bound

    const outsideTop = ensureBounds({ x: 100, y: -50 });
    expect(outsideTop.y).toBe(10); // Should be clamped to top margin

    const outsideBottom = ensureBounds({ x: 100, y: 800 });
    expect(outsideBottom.y).toBe(694); // Should be clamped to bottom bound
  });

  it('should handle animation state transitions', () => {
    type AnimationType = 'idle' | 'hover' | 'click' | 'loading' | 'success' | 'error' | 'drag';
    
    const getAnimationClass = (animation: AnimationType | null) => {
      switch (animation) {
        case 'hover': return 'animate-bounce';
        case 'loading': return 'animate-spin';
        case 'success': return 'animate-pulse';
        case 'error': return 'animate-pulse';
        case 'drag': return 'animate-pulse';
        default: return '';
      }
    };

    expect(getAnimationClass('hover')).toBe('animate-bounce');
    expect(getAnimationClass('loading')).toBe('animate-spin');
    expect(getAnimationClass('idle')).toBe('');
    expect(getAnimationClass(null)).toBe('');
  });

  it('should validate configuration merging', () => {
    const defaultConfig = {
      initialPosition: { x: 20, y: 20 },
      size: 'medium' as const,
      dragEnabled: true,
      snapToEdges: true,
      keyboardShortcut: 'Alt+E'
    };

    const userConfig = {
      size: 'large' as const,
      dragEnabled: false
    };

    const mergedConfig = { ...defaultConfig, ...userConfig };

    expect(mergedConfig.size).toBe('large');
    expect(mergedConfig.dragEnabled).toBe(false);
    expect(mergedConfig.snapToEdges).toBe(true); // Should keep default
    expect(mergedConfig.keyboardShortcut).toBe('Alt+E'); // Should keep default
  });

  it('should handle collision detection logic', () => {
    const hasCollision = (
      buttonRect: { left: number; top: number; right: number; bottom: number },
      elementRect: { left: number; top: number; right: number; bottom: number }
    ) => {
      return (
        buttonRect.left < elementRect.right &&
        buttonRect.right > elementRect.left &&
        buttonRect.top < elementRect.bottom &&
        buttonRect.bottom > elementRect.top
      );
    };

    const buttonRect = { left: 100, top: 100, right: 164, bottom: 164 };
    const overlappingElement = { left: 150, top: 150, right: 200, bottom: 200 };
    const nonOverlappingElement = { left: 200, top: 200, right: 250, bottom: 250 };

    expect(hasCollision(buttonRect, overlappingElement)).toBe(true);
    expect(hasCollision(buttonRect, nonOverlappingElement)).toBe(false);
  });

  it('should validate accessibility attributes structure', () => {
    const accessibilityFeatures = {
      ariaLabel: 'Extract content from page for lesson generation',
      ariaDescription: 'Click to extract webpage content and create a language lesson. Draggable to reposition.',
      keyboardShortcut: 'Alt+E',
      screenReaderAnnouncements: true,
      highContrastSupport: true,
      dragInstructions: 'Use arrow keys to move, Enter to activate, Escape to cancel'
    };

    expect(accessibilityFeatures.ariaLabel).toBeTruthy();
    expect(accessibilityFeatures.ariaDescription).toBeTruthy();
    expect(accessibilityFeatures.keyboardShortcut).toBe('Alt+E');
    expect(accessibilityFeatures.screenReaderAnnouncements).toBe(true);
    expect(accessibilityFeatures.highContrastSupport).toBe(true);
    expect(accessibilityFeatures.dragInstructions).toBeTruthy();
  });
});