import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ButtonConfigurationManager } from '@/lib/button-configuration-manager';

// Mock chrome storage API
const mockChromeStorage = {
  sync: {
    get: vi.fn(),
    set: vi.fn(),
  },
};

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

// Setup global mocks
Object.defineProperty(global, 'chrome', {
  value: { storage: mockChromeStorage },
  writable: true,
});

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('ButtonConfigurationManager', () => {
  let configManager: ButtonConfigurationManager;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Get fresh instance and reset to defaults
    configManager = ButtonConfigurationManager.getInstance();
    await configManager.resetToDefaults();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ButtonConfigurationManager.getInstance();
      const instance2 = ButtonConfigurationManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Default Configuration', () => {
    it('should have correct default button configuration', () => {
      const config = configManager.getButtonConfiguration();
      
      expect(config).toEqual({
        position: { x: 20, y: 20, edge: 'right' },
        size: 'medium',
        theme: 'auto',
        opacity: 0.9,
        dragEnabled: true,
        snapToEdges: true,
        showOnHover: false,
        mascotEnabled: true,
        animationSpeed: 'normal',
        sparkEffects: true,
        keyboardShortcut: 'Alt+E',
        respectRobotsTxt: true,
        excludeDomains: [],
        showPrivacyNotice: true,
      });
    });

    it('should have correct default privacy settings', () => {
      const privacy = configManager.getPrivacySettings();
      
      expect(privacy).toEqual({
        dataCollection: false,
        analytics: false,
        errorReporting: true,
      });
    });
  });

  describe('Configuration Updates', () => {
    it('should update button configuration', async () => {
      mockChromeStorage.sync.set.mockResolvedValue(undefined);
      
      await configManager.updateButtonConfiguration({
        size: 'large',
        theme: 'dark',
        opacity: 0.8,
      });
      
      const config = configManager.getButtonConfiguration();
      expect(config.size).toBe('large');
      expect(config.theme).toBe('dark');
      expect(config.opacity).toBe(0.8);
      expect(mockChromeStorage.sync.set).toHaveBeenCalled();
    });

    it('should update privacy settings', async () => {
      mockChromeStorage.sync.set.mockResolvedValue(undefined);
      
      await configManager.updatePrivacySettings({
        dataCollection: true,
        analytics: true,
      });
      
      const privacy = configManager.getPrivacySettings();
      expect(privacy.dataCollection).toBe(true);
      expect(privacy.analytics).toBe(true);
      expect(privacy.errorReporting).toBe(true); // Should remain unchanged
      expect(mockChromeStorage.sync.set).toHaveBeenCalled();
    });
  });

  describe('Domain Management', () => {
    it('should save and retrieve domain position', async () => {
      mockChromeStorage.sync.set.mockResolvedValue(undefined);
      
      const domain = 'example.com';
      const position = { x: 100, y: 200 };
      
      await configManager.saveDomainPosition(domain, position);
      const retrievedPosition = configManager.getDomainPosition(domain);
      
      expect(retrievedPosition).toEqual(position);
      expect(mockChromeStorage.sync.set).toHaveBeenCalled();
    });

    it('should return null for non-existent domain position', () => {
      const position = configManager.getDomainPosition('nonexistent.com');
      expect(position).toBeNull();
    });

    it('should check if domain is enabled', () => {
      expect(configManager.isDomainEnabled('example.com')).toBe(true);
    });

    it('should exclude domain', async () => {
      mockChromeStorage.sync.set.mockResolvedValue(undefined);
      
      await configManager.excludeDomain('spam.com');
      
      expect(configManager.isDomainEnabled('spam.com')).toBe(false);
      expect(mockChromeStorage.sync.set).toHaveBeenCalled();
    });

    it('should include previously excluded domain', async () => {
      mockChromeStorage.sync.set.mockResolvedValue(undefined);
      
      const testDomain = 'test-exclude.com';
      
      // Verify domain is initially enabled
      expect(configManager.isDomainEnabled(testDomain)).toBe(true);
      
      // First exclude
      await configManager.excludeDomain(testDomain);
      expect(configManager.isDomainEnabled(testDomain)).toBe(false);
      
      // Then include
      await configManager.includeDomain(testDomain);
      expect(configManager.isDomainEnabled(testDomain)).toBe(true);
    });
  });

  describe('Smart Positioning', () => {
    it('should calculate smart position within viewport', () => {
      const viewport = { width: 1920, height: 1080 };
      const position = configManager.getSmartPosition(viewport);
      
      expect(position.x).toBeGreaterThanOrEqual(10);
      expect(position.y).toBeGreaterThanOrEqual(10);
      expect(position.x).toBeLessThanOrEqual(viewport.width - 74); // 64px button + 10px margin
      expect(position.y).toBeLessThanOrEqual(viewport.height - 74);
    });

    it('should avoid overlapping elements', () => {
      const viewport = { width: 1920, height: 1080 };
      const existingElements = [
        { x: 15, y: 15, width: 100, height: 100, left: 15, right: 115, top: 15, bottom: 115 } as DOMRect,
      ];
      
      const position = configManager.getSmartPosition(viewport, existingElements);
      
      // Should not overlap with the existing element
      const buttonSize = configManager.getButtonSize();
      const buttonRect = { x: position.x, y: position.y, width: buttonSize, height: buttonSize };
      
      const overlaps = !(
        buttonRect.x + buttonRect.width < existingElements[0].left ||
        existingElements[0].right < buttonRect.x ||
        buttonRect.y + buttonRect.height < existingElements[0].top ||
        existingElements[0].bottom < buttonRect.y
      );
      
      expect(overlaps).toBe(false);
    });

    it('should return correct button size for different configurations', async () => {
      expect(configManager.getButtonSize()).toBe(64); // Default medium
      
      await configManager.updateButtonConfiguration({ size: 'small' });
      expect(configManager.getButtonSize()).toBe(48);
      
      await configManager.updateButtonConfiguration({ size: 'large' });
      expect(configManager.getButtonSize()).toBe(80);
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should validate correct keyboard shortcuts', () => {
      expect(configManager.isValidKeyboardShortcut('Alt+E')).toBe(true);
      expect(configManager.isValidKeyboardShortcut('Ctrl+Shift+L')).toBe(true);
      expect(configManager.isValidKeyboardShortcut('Meta+K')).toBe(true);
    });

    it('should reject invalid keyboard shortcuts', () => {
      expect(configManager.isValidKeyboardShortcut('E')).toBe(false); // No modifier
      expect(configManager.isValidKeyboardShortcut('Alt+')).toBe(false); // No key
      expect(configManager.isValidKeyboardShortcut('Invalid+E')).toBe(false); // Invalid modifier
      expect(configManager.isValidKeyboardShortcut('Alt+Enter')).toBe(false); // Multi-character key
    });
  });

  describe('Storage Fallback', () => {
    it('should fallback to localStorage when chrome storage is unavailable', async () => {
      // Temporarily set chrome to undefined
      const originalChrome = global.chrome;
      (global as any).chrome = undefined;
      
      mockLocalStorage.getItem.mockReturnValue(null);
      mockLocalStorage.setItem.mockImplementation(() => {});
      
      await configManager.loadPreferences();
      await configManager.updateButtonConfiguration({ size: 'large' });
      
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      
      // Restore chrome
      global.chrome = originalChrome;
    });
  });

  describe('Import/Export', () => {
    it('should export preferences as JSON', () => {
      const exported = configManager.exportPreferences();
      const parsed = JSON.parse(exported);
      
      expect(parsed).toHaveProperty('buttonConfig');
      expect(parsed).toHaveProperty('domainSettings');
      expect(parsed).toHaveProperty('privacySettings');
    });

    it('should import valid preferences', async () => {
      mockChromeStorage.sync.set.mockResolvedValue(undefined);
      
      const preferences = {
        buttonConfig: {
          size: 'large',
          theme: 'dark',
        },
        privacySettings: {
          dataCollection: true,
        },
      };
      
      await configManager.importPreferences(JSON.stringify(preferences));
      
      const config = configManager.getButtonConfiguration();
      expect(config.size).toBe('large');
      expect(config.theme).toBe('dark');
      
      const privacy = configManager.getPrivacySettings();
      expect(privacy.dataCollection).toBe(true);
    });

    it('should reject invalid import data', async () => {
      await expect(
        configManager.importPreferences('invalid json')
      ).rejects.toThrow('Invalid preferences format');
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to default preferences', async () => {
      mockChromeStorage.sync.set.mockResolvedValue(undefined);
      
      // First modify some settings
      await configManager.updateButtonConfiguration({ size: 'large', theme: 'dark' });
      await configManager.updatePrivacySettings({ dataCollection: true });
      
      // Then reset
      await configManager.resetToDefaults();
      
      const config = configManager.getButtonConfiguration();
      const privacy = configManager.getPrivacySettings();
      
      expect(config.size).toBe('medium');
      expect(config.theme).toBe('auto');
      expect(privacy.dataCollection).toBe(false);
    });
  });

  describe('Loading Preferences', () => {
    it('should load preferences from chrome storage', async () => {
      const mockPreferences = {
        buttonConfig: { size: 'large', theme: 'dark' },
        privacySettings: { dataCollection: true },
      };
      
      mockChromeStorage.sync.get.mockResolvedValue({
        linguaspark_button_config: mockPreferences,
      });
      
      await configManager.loadPreferences();
      
      const config = configManager.getButtonConfiguration();
      expect(config.size).toBe('large');
      expect(config.theme).toBe('dark');
    });

    it('should handle storage errors gracefully', async () => {
      mockChromeStorage.sync.get.mockRejectedValue(new Error('Storage error'));
      
      // Should not throw
      await expect(configManager.loadPreferences()).resolves.toBeUndefined();
    });
  });
});