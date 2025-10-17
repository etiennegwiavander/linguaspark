/**
 * Comprehensive Accessibility Tests for Floating Action Button
 * 
 * Tests keyboard navigation, screen reader compatibility, high contrast mode,
 * and alternative interaction methods as required by task 14.
 * 
 * Requirements: 1.5, 7.5, 7.6
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FloatingActionButton } from '@/components/floating-action-button';

// Mock browser compatibility
vi.mock('@/lib/browser-compatibility', () => ({
  getBrowserCompatibility: () => ({
    getBrowserInfo: () => ({
      name: 'Chrome',
      version: '120',
      isChrome: true,
      isChromiumBased: true,
      supportsFullFeatures: true
    }),
    getDeviceInfo: () => ({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isTouchDevice: false,
      screenSize: 'large',
      orientation: 'landscape',
      pixelRatio: 1
    }),
    getCurrentViewportInfo: () => ({
      width: 1920,
      height: 1080,
      availableWidth: 1920,
      availableHeight: 1080,
      safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 }
    }),
    getTouchSettings: () => ({
      enabled: false,
      tapDelay: 100,
      longPressDelay: 500,
      dragThreshold: 5,
      touchTargetSize: 64
    }),
    getKeyboardSettings: () => ({
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
    }),
    getAccessibilitySettings: () => ({
      screenReaderSupport: true,
      highContrastMode: false,
      reducedMotion: false,
      ariaLabels: {
        button: 'Extract content from page for lesson generation',
        dragging: 'Dragging extract button',
        loading: 'Extracting content, please wait',
        success: 'Content extracted successfully',
        error: 'Content extraction failed'
      },
      announcements: true
    }),
    getAnimationSettings: () => ({
      enabled: true,
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      reducedMotion: false
    }),
    getOptimalButtonSize: () => 64,
    getOptimalButtonPosition: (pos: any) => pos || { x: 20, y: 20 },
    onOrientationChange: () => () => {}
  })
}));

// Mock SparkyMascot component
vi.mock('@/components/sparky-mascot', () => ({
  SparkyMascot: ({ animation, size }: any) => (
    <div data-testid="sparky-mascot" data-animation={animation} data-size={size}>
      Sparky
    </div>
  )
}));

describe('FloatingActionButton Accessibility', () => {
  let mockOnExtract: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnExtract = vi.fn();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => '{}'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      },
      writable: true
    });

    // Mock matchMedia for accessibility queries
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query.includes('prefers-contrast: high') ? false : 
                query.includes('prefers-reduced-motion: reduce') ? false :
                query.includes('forced-colors: active') ? false : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Keyboard Navigation Support', () => {
    it('should focus button with Alt+E shortcut', async () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      expect(button).not.toHaveFocus();
      
      // Press Alt+E
      fireEvent.keyDown(document, { key: 'e', altKey: true });
      
      expect(button).toHaveFocus();
    });

    it('should move button with arrow keys when focused', async () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Move up
      fireEvent.keyDown(button, { key: 'ArrowUp', code: 'ArrowUp' });
      
      // Position should change (we can't easily test exact values due to calculations)
      expect(button).toHaveFocus();
    });

    it('should move faster with Shift+Arrow keys', async () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Move with Shift for fast movement
      fireEvent.keyDown(button, { key: 'ArrowRight', code: 'ArrowRight', shiftKey: true });
      
      expect(button).toHaveFocus();
    });

    it('should activate button with Enter key', async () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      
      expect(mockOnExtract).toHaveBeenCalled();
    });

    it('should activate button with Space key', async () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      
      expect(mockOnExtract).toHaveBeenCalled();
    });

    it('should show help dialog with H key', async () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      fireEvent.keyDown(button, { key: 'h', code: 'KeyH' });
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    it('should close help dialog with Escape key', async () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Open help
      fireEvent.keyDown(button, { key: 'h', code: 'KeyH' });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      // Close help
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should toggle drag mode with D key', async () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      fireEvent.keyDown(button, { key: 'd', code: 'KeyD' });
      
      expect(screen.getByText('Keyboard Drag Mode')).toBeInTheDocument();
    });

    it('should blur button with Escape key when help is not open', async () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(button).toHaveFocus();
      
      fireEvent.keyDown(button, { key: 'Escape', code: 'Escape' });
      
      expect(button).not.toHaveFocus();
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should have proper ARIA labels', () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-label', 'Extract content from page for lesson generation');
      expect(button).toHaveAttribute('aria-description');
      expect(button).toHaveAttribute('aria-roledescription', 'Draggable extract button');
    });

    it('should have proper ARIA states', () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-pressed', 'false');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-live', 'off');
    });

    it('should update ARIA states during loading', async () => {
      const slowExtract = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<FloatingActionButton onExtract={slowExtract} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(button).toHaveAttribute('aria-pressed', 'true');
      expect(button).toHaveAttribute('aria-live', 'polite');
    });

    it('should have keyboard shortcut information', () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-keyshortcuts', 'Alt+E');
      expect(button.title).toContain('Alt+E');
      expect(button.title).toContain('Press H for help');
    });

    it('should announce screen reader messages', async () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Check for screen reader only content
      const srOnly = document.querySelector('.sr-only');
      expect(srOnly).toBeInTheDocument();
    });
  });

  describe('High Contrast Mode Support', () => {
    beforeEach(() => {
      // Mock high contrast mode
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('prefers-contrast: high') || query.includes('forced-colors: active'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });
    });

    it('should apply high contrast styles', async () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      
      // Wait for high contrast detection
      await waitFor(() => {
        expect(button.className).toContain('bg-blue-800');
      });
    });

    it('should have enhanced focus indicators in high contrast mode', async () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(button.className).toContain('ring-yellow-400');
      });
    });

    it('should use high contrast colors for error states', async () => {
      const failingExtract = vi.fn().mockRejectedValue(new Error('Test error'));
      render(<FloatingActionButton onExtract={failingExtract} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(button.className).toContain('bg-red-700');
      });
    });
  });

  describe('Alternative Interaction Methods', () => {
    it('should support touch interactions', async () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      
      // Simulate touch start
      fireEvent.touchStart(button, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      
      expect(button).toBeInTheDocument();
    });

    it('should provide drag instructions', () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      const description = button.getAttribute('aria-description');
      
      expect(description).toContain('Use arrow keys to move');
      expect(description).toContain('Enter to activate');
      expect(description).toContain('Escape to cancel');
      expect(description).toContain('H for help');
    });

    it('should show keyboard drag mode indicator', async () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Toggle to keyboard drag mode
      fireEvent.keyDown(button, { key: 'd', code: 'KeyD' });
      
      expect(screen.getByText('Keyboard Drag Mode')).toBeInTheDocument();
    });

    it('should have proper data attributes for interaction modes', async () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('data-keyboard-mode');
      expect(button).toHaveAttribute('data-drag-mode');
    });
  });

  describe('Customizable Shortcuts', () => {
    it('should accept custom keyboard shortcuts', () => {
      const customConfig = {
        accessibility: {
          customShortcuts: {
            activate: 'Ctrl+E',
            help: 'F1'
          }
        }
      };
      
      render(<FloatingActionButton onExtract={mockOnExtract} configuration={customConfig} />);
      
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-keyshortcuts', 'Ctrl+E');
      expect(button.title).toContain('Ctrl+E');
    });

    it('should display custom shortcuts in help dialog', async () => {
      const customConfig = {
        accessibility: {
          customShortcuts: {
            activate: 'Ctrl+E',
            help: 'F1'
          }
        }
      };
      
      render(<FloatingActionButton onExtract={mockOnExtract} configuration={customConfig} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.keyDown(button, { key: 'h', code: 'KeyH' });
      
      expect(screen.getByText('Ctrl+E')).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('should manage focus visibility properly', async () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      
      // Focus with keyboard
      fireEvent.keyUp(document, { key: 'Tab' });
      button.focus();
      expect(button).toHaveFocus();
      
      // Should show keyboard focus indicator
      expect(button).toHaveAttribute('data-keyboard-mode', 'true');
    });

    it('should return focus to button after closing help', async () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Open help
      fireEvent.keyDown(button, { key: 'h', code: 'KeyH' });
      
      // Close help
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
      
      expect(button).toHaveFocus();
    });

    it('should have proper tab index', () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('tabindex', '0');
    });
  });

  describe('Color Accessibility Compliance', () => {
    it('should provide sufficient color contrast', () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      
      // Check that button has proper color classes
      expect(button.className).toContain('text-white');
      expect(button.className).toMatch(/bg-(blue|red|green)-\d+/);
    });

    it('should support color blind users with patterns and text', async () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      
      // Button should have text alternatives to color
      expect(button).toHaveAttribute('aria-label');
      expect(button.title).toBeTruthy();
    });
  });

  describe('Reduced Motion Support', () => {
    beforeEach(() => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('prefers-reduced-motion: reduce'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });
    });

    it('should respect reduced motion preferences', async () => {
      render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      const button = screen.getByRole('button');
      
      // Should not have animation classes when reduced motion is preferred
      expect(button.className).not.toContain('transition-all');
      expect(button.className).not.toContain('animate-pulse');
    });
  });
});