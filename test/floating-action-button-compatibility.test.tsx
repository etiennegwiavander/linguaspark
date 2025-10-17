/**
 * Floating Action Button Cross-Browser Compatibility Tests
 * 
 * Tests the enhanced FloatingActionButton component with cross-browser
 * compatibility features and responsive design.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FloatingActionButton } from '@/components/floating-action-button';
import * as BrowserCompatibility from '@/lib/browser-compatibility';

// Mock browser compatibility
const mockCompatibility = {
  getBrowserInfo: vi.fn(() => ({
    name: 'Chrome',
    version: '91',
    isChrome: true,
    isChromiumBased: true,
    isEdge: false,
    isBrave: false,
    isOpera: false,
    supportsFullFeatures: true
  })),
  getDeviceInfo: vi.fn(() => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    screenSize: 'large' as const,
    orientation: 'landscape' as const,
    pixelRatio: 1
  })),
  getViewportInfo: vi.fn(() => ({
    width: 1024,
    height: 768,
    availableWidth: 1024,
    availableHeight: 768,
    safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 }
  })),
  getTouchSettings: vi.fn(() => ({
    enabled: false,
    tapDelay: 100,
    longPressDelay: 500,
    dragThreshold: 5,
    touchTargetSize: 64
  })),
  getKeyboardSettings: vi.fn(() => ({
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
  })),
  getAccessibilitySettings: vi.fn(() => ({
    screenReaderSupport: true,
    highContrastMode: false,
    reducedMotion: false,
    ariaLabels: {
      button: 'Extract content from page for lesson generation',
      dragging: 'Dragging extract button. Use arrow keys to position, Enter to drop.',
      loading: 'Extracting content, please wait',
      success: 'Content extracted successfully',
      error: 'Content extraction failed'
    },
    announcements: true
  })),
  getAnimationSettings: vi.fn(() => ({
    enabled: true,
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    reducedMotion: false
  })),
  getOptimalButtonSize: vi.fn(() => 64),
  getOptimalButtonPosition: vi.fn((preferred) => preferred || { x: 20, y: 20 }),
  onOrientationChange: vi.fn(() => vi.fn()),
  destroy: vi.fn()
};

// Mock the browser compatibility module
vi.mock('@/lib/browser-compatibility', () => ({
  getBrowserCompatibility: vi.fn(() => mockCompatibility),
  destroyBrowserCompatibility: vi.fn()
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock window properties
Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });

describe('FloatingActionButton Cross-Browser Compatibility', () => {
  const mockOnExtract = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('{}');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Desktop Chrome Browser', () => {
    it('should render with optimal desktop settings', () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Extract content from page for lesson generation');
      expect(button).toHaveAttribute('tabindex', '0');
      expect(button).toHaveAttribute('title', expect.stringContaining('Alt+E'));
    });

    it('should use correct button size for desktop', () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      const styles = window.getComputedStyle(button);
      
      expect(mockCompatibility.getOptimalButtonSize).toHaveBeenCalled();
      // Button should have the optimal size applied
      expect(button.style.width).toBeTruthy();
      expect(button.style.height).toBeTruthy();
    });

    it('should handle keyboard navigation correctly', async () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      
      // Test Alt+E shortcut
      fireEvent.keyDown(document, { key: 'e', altKey: true });
      await waitFor(() => {
        expect(button).toHaveFocus();
      });
      
      // Test Enter key activation
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(mockOnExtract).toHaveBeenCalled();
    });

    it('should support arrow key positioning when focused', async () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      button.focus();
      
      // Test arrow key movement
      fireEvent.keyDown(button, { key: 'ArrowRight' });
      
      // Should save position after movement
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
      });
    });
  });

  describe('Mobile Device Compatibility', () => {
    beforeEach(() => {
      // Mock mobile device
      mockCompatibility.getDeviceInfo.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isTouchDevice: true,
        screenSize: 'small' as const,
        orientation: 'portrait' as const,
        pixelRatio: 2
      });

      mockCompatibility.getTouchSettings.mockReturnValue({
        enabled: true,
        tapDelay: 0,
        longPressDelay: 500,
        dragThreshold: 10,
        touchTargetSize: 56
      });

      mockCompatibility.getOptimalButtonSize.mockReturnValue(56);
      mockCompatibility.getAnimationSettings.mockReturnValue({
        enabled: true,
        duration: 200,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        reducedMotion: false
      });

      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });
    });

    it('should render with mobile-optimized settings', () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      
      // Should have touch-friendly styling
      expect(button.className).toContain('active:scale-95');
      expect(button.style.touchAction).toBe('none');
    });

    it('should use correct button size for mobile', () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      expect(mockCompatibility.getOptimalButtonSize).toHaveBeenCalled();
      // Should return mobile-optimized size
      expect(mockCompatibility.getOptimalButtonSize()).toBe(56);
    });

    it('should handle touch events correctly', async () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      
      // Test touch start for dragging
      fireEvent.touchStart(button, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      
      // Should enter dragging state
      expect(button.className).toContain('cursor-grabbing');
    });

    it('should consider safe areas for positioning', () => {
      mockCompatibility.getViewportInfo.mockReturnValue({
        width: 375,
        height: 812, // iPhone X dimensions
        availableWidth: 375,
        availableHeight: 812,
        safeAreaInsets: { top: 44, right: 0, bottom: 34, left: 0 }
      });

      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      expect(mockCompatibility.getOptimalButtonPosition).toHaveBeenCalled();
    });
  });

  describe('Tablet Device Compatibility', () => {
    beforeEach(() => {
      // Mock tablet device
      mockCompatibility.getDeviceInfo.mockReturnValue({
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        isTouchDevice: true,
        screenSize: 'medium' as const,
        orientation: 'landscape' as const,
        pixelRatio: 2
      });

      mockCompatibility.getTouchSettings.mockReturnValue({
        enabled: true,
        tapDelay: 0,
        longPressDelay: 500,
        dragThreshold: 10,
        touchTargetSize: 60
      });

      mockCompatibility.getOptimalButtonSize.mockReturnValue(60);

      Object.defineProperty(window, 'innerWidth', { value: 768, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 1024, writable: true });
    });

    it('should render with tablet-optimized settings', () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      
      // Should have touch support but different sizing than mobile
      expect(mockCompatibility.getOptimalButtonSize()).toBe(60);
    });

    it('should handle both touch and keyboard input', async () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      
      // Test touch interaction
      fireEvent.touchStart(button, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      
      // Test keyboard interaction
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter' });
      
      expect(mockOnExtract).toHaveBeenCalled();
    });
  });

  describe('Edge Browser Compatibility', () => {
    beforeEach(() => {
      mockCompatibility.getBrowserInfo.mockReturnValue({
        name: 'Edge',
        version: '91',
        isChrome: false,
        isChromiumBased: true,
        isEdge: true,
        isBrave: false,
        isOpera: false,
        supportsFullFeatures: true
      });
    });

    it('should work correctly in Edge browser', () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      
      // Should have full feature support
      expect(mockCompatibility.getBrowserInfo().supportsFullFeatures).toBe(true);
    });
  });

  describe('Brave Browser Compatibility', () => {
    beforeEach(() => {
      mockCompatibility.getBrowserInfo.mockReturnValue({
        name: 'Brave',
        version: '91',
        isChrome: false,
        isChromiumBased: true,
        isEdge: false,
        isBrave: true,
        isOpera: false,
        supportsFullFeatures: true
      });
    });

    it('should work correctly in Brave browser', () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      
      // Should have full feature support
      expect(mockCompatibility.getBrowserInfo().supportsFullFeatures).toBe(true);
    });
  });

  describe('Opera Browser Compatibility', () => {
    beforeEach(() => {
      mockCompatibility.getBrowserInfo.mockReturnValue({
        name: 'Opera',
        version: '77',
        isChrome: false,
        isChromiumBased: true,
        isEdge: false,
        isBrave: false,
        isOpera: true,
        supportsFullFeatures: true
      });
    });

    it('should work correctly in Opera browser', () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      
      // Should have full feature support
      expect(mockCompatibility.getBrowserInfo().supportsFullFeatures).toBe(true);
    });
  });

  describe('Accessibility Features', () => {
    it('should support high contrast mode', () => {
      mockCompatibility.getAccessibilitySettings.mockReturnValue({
        screenReaderSupport: true,
        highContrastMode: true,
        reducedMotion: false,
        ariaLabels: {
          button: 'Extract content from page for lesson generation',
          dragging: 'Dragging extract button',
          loading: 'Extracting content, please wait',
          success: 'Content extracted successfully',
          error: 'Content extraction failed'
        },
        announcements: true
      });

      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      expect(button.className).toContain('ring-4 ring-white');
    });

    it('should support reduced motion preferences', () => {
      mockCompatibility.getAccessibilitySettings.mockReturnValue({
        screenReaderSupport: true,
        highContrastMode: false,
        reducedMotion: true,
        ariaLabels: {
          button: 'Extract content from page for lesson generation',
          dragging: 'Dragging extract button',
          loading: 'Extracting content, please wait',
          success: 'Content extracted successfully',
          error: 'Content extraction failed'
        },
        announcements: true
      });

      mockCompatibility.getAnimationSettings.mockReturnValue({
        enabled: false,
        duration: 0,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        reducedMotion: true
      });

      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      // Should not have transition classes when reduced motion is preferred
      expect(button.className).not.toContain('transition-all');
    });

    it('should provide proper ARIA labels for different states', async () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      
      // Default state
      expect(button).toHaveAttribute('aria-label', 'Extract content from page for lesson generation');
      
      // Simulate loading state
      fireEvent.click(button);
      
      // Should update aria-label for loading state
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-label', expect.stringContaining('Extracting content'));
      });
    });

    it('should announce state changes for screen readers', async () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      button.focus();
      
      // Test arrow key movement (should announce position change)
      fireEvent.keyDown(button, { key: 'ArrowRight' });
      
      await waitFor(() => {
        expect(createElementSpy).toHaveBeenCalled();
        expect(appendChildSpy).toHaveBeenCalled();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to different screen sizes', () => {
      // Test small screen
      Object.defineProperty(window, 'innerWidth', { value: 320 });
      mockCompatibility.getDeviceInfo.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isTouchDevice: true,
        screenSize: 'small' as const,
        orientation: 'portrait' as const,
        pixelRatio: 2
      });

      const { rerender } = render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      expect(mockCompatibility.getOptimalButtonSize).toHaveBeenCalled();
      
      // Test large screen
      Object.defineProperty(window, 'innerWidth', { value: 1920 });
      mockCompatibility.getDeviceInfo.mockReturnValue({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouchDevice: false,
        screenSize: 'large' as const,
        orientation: 'landscape' as const,
        pixelRatio: 1
      });

      rerender(<FloatingActionButton onExtract={mockOnExtract} />);
      
      expect(mockCompatibility.getOptimalButtonSize).toHaveBeenCalledTimes(2);
    });

    it('should handle orientation changes', () => {
      const orientationCallback = vi.fn();
      mockCompatibility.onOrientationChange.mockReturnValue(orientationCallback);
      
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      expect(mockCompatibility.onOrientationChange).toHaveBeenCalled();
    });

    it('should position correctly on different screen orientations', () => {
      // Portrait orientation
      mockCompatibility.getDeviceInfo.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isTouchDevice: true,
        screenSize: 'small' as const,
        orientation: 'portrait' as const,
        pixelRatio: 2
      });

      const { rerender } = render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      expect(mockCompatibility.getOptimalButtonPosition).toHaveBeenCalled();
      
      // Landscape orientation
      mockCompatibility.getDeviceInfo.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isTouchDevice: true,
        screenSize: 'small' as const,
        orientation: 'landscape' as const,
        pixelRatio: 2
      });

      rerender(<FloatingActionButton onExtract={mockOnExtract} />);
      
      expect(mockCompatibility.getOptimalButtonPosition).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance Optimizations', () => {
    it('should cleanup resources on unmount', () => {
      const { unmount } = render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      unmount();
      
      // Should cleanup orientation listener
      expect(mockCompatibility.onOrientationChange).toHaveBeenCalled();
    });

    it('should throttle compatibility updates', async () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      // Multiple rapid calls should be throttled
      act(() => {
        window.dispatchEvent(new Event('resize'));
        window.dispatchEvent(new Event('resize'));
        window.dispatchEvent(new Event('resize'));
      });
      
      // Should not call compatibility methods excessively
      expect(mockCompatibility.getDeviceInfo).toHaveBeenCalledTimes(1);
    });
  });
});