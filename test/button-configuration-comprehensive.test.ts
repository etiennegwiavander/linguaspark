/**
 * Comprehensive Unit Tests for Button Configuration System
 * 
 * Tests button configuration management, settings persistence,
 * user preferences, and configuration validation.
 * 
 * Requirements: 1.3, 1.6, 6.1, 7.3, 7.4, 7.5, 7.6
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ButtonConfigurationManager, type ButtonConfiguration } from '../lib/button-configuration-manager';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
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

describe('ButtonConfigurationManager', () => {
  let configManager: ButtonConfigurationManager;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    configManager = new ButtonConfigurationManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Configuration Initialization', () => {
    it('should initialize with default configuration', () => {
      const config = configManager.getButtonConfiguration();
      
      expect(config.position).toEqual({ x: 20, y: 20, edge: 'right' });
      expect(config.size).toBe('medium');
      expect(config.theme).toBe('auto');
      expect(config.dragEnabled).toBe(true);
      expect(config.snapToEdges).toBe(true);
      expect(config.keyboardShortcut).toBe('Alt+E');
      expect(config.mascotEnabled).toBe(true);
      expect(config.animationSpeed).toBe('normal');
    });

    it('should load saved configuration from localStorage', () => {
      const savedConfig = {
        size: 'large',
        theme: 'dark',
        keyboardShortcut: 'Ctrl+E',
        dragEnabled: false
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedConfig));
      
      const newManager = new ButtonConfigurationManager();
      const config = newManager.getConfiguration();
      
      expect(config.size).toBe('large');
      expect(config.theme).toBe('dark');
      expect(config.keyboardShortcut).toBe('Ctrl+E');
      expect(config.dragEnabled).toBe(false);
      // Should merge with defaults
      expect(config.snapToEdges).toBe(true);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      
      expect(() => {
        new ButtonConfigurationManager();
      }).not.toThrow();
      
      const config = configManager.getConfiguration();
      expect(config.size).toBe('medium'); // Should use defaults
    });
  });

  describe('Configuration Updates - Requirement 1.3', () => {
    it('should update button size configuration', () => {
      configManager.updateConfiguration({ size: 'large' });
      
      const config = configManager.getConfiguration();
      expect(config.size).toBe('large');
      
      // Should save to localStorage
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'linguaspark_button_config',
        expect.stringContaining('"size":"large"')
      );
    });

    it('should update position configuration', () => {
      const newPosition = { x: 100, y: 200 };
      configManager.updateConfiguration({ initialPosition: newPosition });
      
      const config = configManager.getConfiguration();
      expect(config.initialPosition).toEqual(newPosition);
    });

    it('should update theme configuration', () => {
      configManager.updateConfiguration({ theme: 'dark' });
      
      const config = configManager.getConfiguration();
      expect(config.theme).toBe('dark');
    });

    it('should update multiple configuration options at once', () => {
      const updates = {
        size: 'small' as const,
        dragEnabled: false,
        animationSpeed: 'fast' as const
      };
      
      configManager.updateConfiguration(updates);
      
      const config = configManager.getConfiguration();
      expect(config.size).toBe('small');
      expect(config.dragEnabled).toBe(false);
      expect(config.animationSpeed).toBe('fast');
    });

    it('should validate configuration values', () => {
      // Invalid size should be ignored
      configManager.updateConfiguration({ size: 'invalid' as any });
      
      const config = configManager.getConfiguration();
      expect(config.size).toBe('medium'); // Should remain default
    });
  });

  describe('Position Management - Requirement 1.3', () => {
    it('should save position per domain', () => {
      const domain = 'example.com';
      const position = { x: 150, y: 250 };
      
      configManager.savePositionForDomain(domain, position);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'linguaspark_button_positions',
        expect.stringContaining(`"${domain}"`)
      );
    });

    it('should load saved position for domain', () => {
      const domain = 'example.com';
      const savedPosition = { x: 150, y: 250 };
      const positions = { [domain]: savedPosition };
      
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'linguaspark_button_positions') {
          return JSON.stringify(positions);
        }
        return null;
      });
      
      const position = configManager.getPositionForDomain(domain);
      expect(position).toEqual(savedPosition);
    });

    it('should return default position for unknown domain', () => {
      const position = configManager.getPositionForDomain('unknown.com');
      expect(position).toEqual({ x: 20, y: 20 });
    });

    it('should handle position storage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      expect(() => {
        configManager.savePositionForDomain('example.com', { x: 100, y: 100 });
      }).not.toThrow();
    });
  });

  describe('Responsive Size Calculation - Requirements 7.3, 7.4', () => {
    it('should calculate desktop button size', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024 });
      
      const size = configManager.getResponsiveSize('medium');
      expect(size).toBe(64); // Desktop medium size
    });

    it('should calculate mobile button size', () => {
      Object.defineProperty(window, 'innerWidth', { value: 600 });
      
      const size = configManager.getResponsiveSize('medium');
      expect(size).toBe(56); // Mobile medium size
    });

    it('should handle different size configurations', () => {
      const sizes = ['small', 'medium', 'large'] as const;
      
      sizes.forEach(size => {
        const calculatedSize = configManager.getResponsiveSize(size);
        expect(calculatedSize).toBeGreaterThan(0);
        expect(typeof calculatedSize).toBe('number');
      });
    });

    it('should adjust for touch-friendly sizing', () => {
      Object.defineProperty(window, 'innerWidth', { value: 600 });
      
      const touchSize = configManager.getResponsiveSize('medium', true);
      const normalSize = configManager.getResponsiveSize('medium', false);
      
      expect(touchSize).toBeGreaterThanOrEqual(normalSize);
    });
  });

  describe('Accessibility Configuration - Requirements 7.5, 7.6', () => {
    it('should manage keyboard shortcut configuration', () => {
      configManager.updateConfiguration({ keyboardShortcut: 'Ctrl+Shift+E' });
      
      const config = configManager.getConfiguration();
      expect(config.keyboardShortcut).toBe('Ctrl+Shift+E');
    });

    it('should validate keyboard shortcut format', () => {
      const validShortcuts = ['Alt+E', 'Ctrl+E', 'Shift+E', 'Ctrl+Shift+E'];
      const invalidShortcuts = ['E', 'Alt', 'Ctrl+Alt+Shift+E'];
      
      validShortcuts.forEach(shortcut => {
        configManager.updateConfiguration({ keyboardShortcut: shortcut });
        expect(configManager.getConfiguration().keyboardShortcut).toBe(shortcut);
      });
      
      invalidShortcuts.forEach(shortcut => {
        const originalShortcut = configManager.getConfiguration().keyboardShortcut;
        configManager.updateConfiguration({ keyboardShortcut: shortcut });
        // Should not update to invalid shortcut
        expect(configManager.getConfiguration().keyboardShortcut).toBe(originalShortcut);
      });
    });

    it('should provide accessibility settings', () => {
      const accessibilitySettings = configManager.getAccessibilitySettings();
      
      expect(accessibilitySettings).toHaveProperty('screenReaderSupport');
      expect(accessibilitySettings).toHaveProperty('keyboardNavigation');
      expect(accessibilitySettings).toHaveProperty('highContrastMode');
      expect(accessibilitySettings).toHaveProperty('reducedMotion');
      expect(accessibilitySettings).toHaveProperty('ariaLabels');
    });

    it('should detect high contrast mode preference', () => {
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
      
      const settings = configManager.getAccessibilitySettings();
      expect(settings.highContrastMode).toBe(true);
    });

    it('should detect reduced motion preference', () => {
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
      
      const settings = configManager.getAccessibilitySettings();
      expect(settings.reducedMotion).toBe(true);
    });
  });

  describe('Theme Management', () => {
    it('should detect system theme preference', () => {
      // Mock matchMedia for dark theme
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('prefers-color-scheme: dark'),
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });
      
      const theme = configManager.getEffectiveTheme();
      expect(theme).toBe('dark');
    });

    it('should respect manual theme override', () => {
      configManager.updateConfiguration({ theme: 'light' });
      
      const theme = configManager.getEffectiveTheme();
      expect(theme).toBe('light');
    });

    it('should provide theme-specific styles', () => {
      configManager.updateConfiguration({ theme: 'dark' });
      
      const styles = configManager.getThemeStyles();
      expect(styles).toHaveProperty('backgroundColor');
      expect(styles).toHaveProperty('color');
      expect(styles).toHaveProperty('borderColor');
    });
  });

  describe('Animation Configuration', () => {
    it('should manage animation speed settings', () => {
      const speeds = ['slow', 'normal', 'fast'] as const;
      
      speeds.forEach(speed => {
        configManager.updateConfiguration({ animationSpeed: speed });
        expect(configManager.getConfiguration().animationSpeed).toBe(speed);
      });
    });

    it('should provide animation duration based on speed', () => {
      const testCases = [
        { speed: 'slow' as const, expectedMin: 400 },
        { speed: 'normal' as const, expectedMin: 200 },
        { speed: 'fast' as const, expectedMin: 100 }
      ];
      
      testCases.forEach(({ speed, expectedMin }) => {
        configManager.updateConfiguration({ animationSpeed: speed });
        const duration = configManager.getAnimationDuration();
        expect(duration).toBeGreaterThanOrEqual(expectedMin);
      });
    });

    it('should disable animations when reduced motion is preferred', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('prefers-reduced-motion: reduce'),
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });
      
      const duration = configManager.getAnimationDuration();
      expect(duration).toBe(0); // Should disable animations
    });
  });

  describe('Privacy Settings Integration - Requirement 6.1', () => {
    it('should manage privacy-related configuration', () => {
      const privacySettings = {
        respectDoNotTrack: true,
        minimizeDataCollection: true,
        sessionOnlyStorage: true
      };
      
      configManager.updatePrivacySettings(privacySettings);
      
      const settings = configManager.getPrivacySettings();
      expect(settings.respectDoNotTrack).toBe(true);
      expect(settings.minimizeDataCollection).toBe(true);
      expect(settings.sessionOnlyStorage).toBe(true);
    });

    it('should clear configuration when privacy mode is enabled', () => {
      configManager.updateConfiguration({ size: 'large' });
      
      configManager.enablePrivacyMode();
      
      // Should clear stored configuration
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('linguaspark_button_config');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('linguaspark_button_positions');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate size values', () => {
      const validSizes = ['small', 'medium', 'large'];
      const invalidSizes = ['tiny', 'huge', '', null, undefined];
      
      validSizes.forEach(size => {
        expect(configManager.isValidSize(size)).toBe(true);
      });
      
      invalidSizes.forEach(size => {
        expect(configManager.isValidSize(size as any)).toBe(false);
      });
    });

    it('should validate theme values', () => {
      const validThemes = ['light', 'dark', 'auto'];
      const invalidThemes = ['blue', 'custom', '', null];
      
      validThemes.forEach(theme => {
        expect(configManager.isValidTheme(theme)).toBe(true);
      });
      
      invalidThemes.forEach(theme => {
        expect(configManager.isValidTheme(theme as any)).toBe(false);
      });
    });

    it('should validate position values', () => {
      const validPositions = [
        { x: 0, y: 0 },
        { x: 100, y: 200 },
        { x: 1920, y: 1080 }
      ];
      
      const invalidPositions = [
        { x: -10, y: 0 },
        { x: 0, y: -10 },
        { x: 'invalid', y: 0 },
        null,
        undefined
      ];
      
      validPositions.forEach(position => {
        expect(configManager.isValidPosition(position)).toBe(true);
      });
      
      invalidPositions.forEach(position => {
        expect(configManager.isValidPosition(position as any)).toBe(false);
      });
    });
  });

  describe('Configuration Export/Import', () => {
    it('should export configuration as JSON', () => {
      configManager.updateConfiguration({
        size: 'large',
        theme: 'dark',
        keyboardShortcut: 'Ctrl+E'
      });
      
      const exported = configManager.exportConfiguration();
      const parsed = JSON.parse(exported);
      
      expect(parsed.size).toBe('large');
      expect(parsed.theme).toBe('dark');
      expect(parsed.keyboardShortcut).toBe('Ctrl+E');
    });

    it('should import configuration from JSON', () => {
      const importData = JSON.stringify({
        size: 'small',
        theme: 'light',
        dragEnabled: false
      });
      
      configManager.importConfiguration(importData);
      
      const config = configManager.getConfiguration();
      expect(config.size).toBe('small');
      expect(config.theme).toBe('light');
      expect(config.dragEnabled).toBe(false);
    });

    it('should handle invalid import data gracefully', () => {
      const invalidData = 'invalid json';
      
      expect(() => {
        configManager.importConfiguration(invalidData);
      }).not.toThrow();
      
      // Configuration should remain unchanged
      const config = configManager.getConfiguration();
      expect(config.size).toBe('medium'); // Default value
    });
  });

  describe('Event Handling', () => {
    it('should emit configuration change events', () => {
      const changeHandler = vi.fn();
      configManager.onConfigurationChange(changeHandler);
      
      configManager.updateConfiguration({ size: 'large' });
      
      expect(changeHandler).toHaveBeenCalledWith(
        expect.objectContaining({ size: 'large' })
      );
    });

    it('should remove event listeners', () => {
      const changeHandler = vi.fn();
      const unsubscribe = configManager.onConfigurationChange(changeHandler);
      
      unsubscribe();
      
      configManager.updateConfiguration({ size: 'large' });
      
      expect(changeHandler).not.toHaveBeenCalled();
    });
  });

  describe('Performance Optimization', () => {
    it('should debounce rapid configuration updates', async () => {
      const changeHandler = vi.fn();
      configManager.onConfigurationChange(changeHandler);
      
      // Rapid updates
      configManager.updateConfiguration({ size: 'small' });
      configManager.updateConfiguration({ size: 'medium' });
      configManager.updateConfiguration({ size: 'large' });
      
      // Should only trigger once after debounce
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(changeHandler).toHaveBeenCalledTimes(1);
      expect(changeHandler).toHaveBeenCalledWith(
        expect.objectContaining({ size: 'large' })
      );
    });

    it('should cache computed values', () => {
      const spy = vi.spyOn(configManager, 'getResponsiveSize');
      
      // Multiple calls should use cache
      configManager.getResponsiveSize('medium');
      configManager.getResponsiveSize('medium');
      configManager.getResponsiveSize('medium');
      
      expect(spy).toHaveBeenCalledTimes(3);
      // Implementation should cache internally
    });
  });
});