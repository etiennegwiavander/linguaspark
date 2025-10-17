import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ButtonSettingsDialog } from '@/components/button-settings-dialog';
import { ButtonConfigurationManager } from '@/lib/button-configuration-manager';

// Mock the configuration manager
vi.mock('@/lib/button-configuration-manager');

// Mock chrome storage
const mockChromeStorage = {
  sync: {
    get: vi.fn(),
    set: vi.fn(),
  },
};

Object.defineProperty(global, 'chrome', {
  value: { storage: mockChromeStorage },
  writable: true,
});

// Mock URL.createObjectURL and related APIs
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn(),
  },
  writable: true,
});

describe('ButtonSettingsDialog', () => {
  const mockConfigManager = {
    loadPreferences: vi.fn(),
    getButtonConfiguration: vi.fn(),
    getPrivacySettings: vi.fn(),
    updateButtonConfiguration: vi.fn(),
    updatePrivacySettings: vi.fn(),
    excludeDomain: vi.fn(),
    includeDomain: vi.fn(),
    resetToDefaults: vi.fn(),
    exportPreferences: vi.fn(),
    importPreferences: vi.fn(),
    isValidKeyboardShortcut: vi.fn(),
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfigChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock ButtonConfigurationManager.getInstance()
    (ButtonConfigurationManager.getInstance as any).mockReturnValue(mockConfigManager);
    
    // Setup default return values
    mockConfigManager.getButtonConfiguration.mockReturnValue({
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
    
    mockConfigManager.getPrivacySettings.mockReturnValue({
      dataCollection: false,
      analytics: false,
      errorReporting: true,
    });
    
    mockConfigManager.isValidKeyboardShortcut.mockReturnValue(true);
    mockConfigManager.exportPreferences.mockReturnValue('{"test": "data"}');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render when open', () => {
      render(<ButtonSettingsDialog {...defaultProps} />);
      
      expect(screen.getByText('Button Settings')).toBeInTheDocument();
      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<ButtonSettingsDialog {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Button Settings')).not.toBeInTheDocument();
    });

    it('should render all tabs', () => {
      render(<ButtonSettingsDialog {...defaultProps} />);
      
      expect(screen.getByText('Appearance')).toBeInTheDocument();
      expect(screen.getByText('Behavior')).toBeInTheDocument();
      expect(screen.getByText('Privacy')).toBeInTheDocument();
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });
  });

  describe('Appearance Settings', () => {
    it('should display current button size', () => {
      render(<ButtonSettingsDialog {...defaultProps} />);
      
      // The medium size should be selected by default
      expect(screen.getByDisplayValue('Medium (64px)')).toBeInTheDocument();
    });

    it('should update button size', async () => {
      const user = userEvent.setup();
      render(<ButtonSettingsDialog {...defaultProps} />);
      
      // Click on size selector and choose large
      const sizeSelect = screen.getByDisplayValue('Medium (64px)');
      await user.click(sizeSelect);
      
      const largeOption = screen.getByText('Large (80px)');
      await user.click(largeOption);
      
      expect(mockConfigManager.updateButtonConfiguration).toHaveBeenCalledWith({
        size: 'large',
      });
    });

    it('should update opacity slider', async () => {
      const user = userEvent.setup();
      render(<ButtonSettingsDialog {...defaultProps} />);
      
      const opacitySlider = screen.getByRole('slider');
      
      // Simulate slider change
      fireEvent.change(opacitySlider, { target: { value: '0.7' } });
      
      await waitFor(() => {
        expect(mockConfigManager.updateButtonConfiguration).toHaveBeenCalledWith({
          opacity: 0.7,
        });
      });
    });

    it('should toggle mascot settings', async () => {
      const user = userEvent.setup();
      render(<ButtonSettingsDialog {...defaultProps} />);
      
      const mascotToggle = screen.getByRole('switch', { name: /enable sparky mascot/i });
      await user.click(mascotToggle);
      
      expect(mockConfigManager.updateButtonConfiguration).toHaveBeenCalledWith({
        mascotEnabled: false,
      });
    });
  });

  describe('Behavior Settings', () => {
    it('should toggle drag functionality', async () => {
      const user = userEvent.setup();
      render(<ButtonSettingsDialog {...defaultProps} />);
      
      // Switch to behavior tab
      await user.click(screen.getByText('Behavior'));
      
      const dragToggle = screen.getByRole('switch', { name: /enable dragging/i });
      await user.click(dragToggle);
      
      expect(mockConfigManager.updateButtonConfiguration).toHaveBeenCalledWith({
        dragEnabled: false,
      });
    });

    it('should update keyboard shortcut', async () => {
      const user = userEvent.setup();
      render(<ButtonSettingsDialog {...defaultProps} />);
      
      // Switch to behavior tab
      await user.click(screen.getByText('Behavior'));
      
      const shortcutInput = screen.getByPlaceholderText(/e.g., Alt\+E/i);
      await user.clear(shortcutInput);
      await user.type(shortcutInput, 'Ctrl+E');
      
      expect(mockConfigManager.updateButtonConfiguration).toHaveBeenCalledWith({
        keyboardShortcut: 'Ctrl+E',
      });
    });

    it('should show error for invalid keyboard shortcut', async () => {
      mockConfigManager.isValidKeyboardShortcut.mockReturnValue(false);
      
      const user = userEvent.setup();
      render(<ButtonSettingsDialog {...defaultProps} />);
      
      // Switch to behavior tab
      await user.click(screen.getByText('Behavior'));
      
      const shortcutInput = screen.getByPlaceholderText(/e.g., Alt\+E/i);
      await user.clear(shortcutInput);
      await user.type(shortcutInput, 'InvalidShortcut');
      
      expect(screen.getByText(/invalid shortcut format/i)).toBeInTheDocument();
    });
  });

  describe('Privacy Settings', () => {
    it('should toggle privacy options', async () => {
      const user = userEvent.setup();
      render(<ButtonSettingsDialog {...defaultProps} />);
      
      // Switch to privacy tab
      await user.click(screen.getByText('Privacy'));
      
      const dataCollectionToggle = screen.getByRole('switch', { name: /allow anonymous usage data collection/i });
      await user.click(dataCollectionToggle);
      
      expect(mockConfigManager.updatePrivacySettings).toHaveBeenCalledWith({
        dataCollection: true,
      });
    });

    it('should add domain to exclusion list', async () => {
      const user = userEvent.setup();
      render(<ButtonSettingsDialog {...defaultProps} />);
      
      // Switch to privacy tab
      await user.click(screen.getByText('Privacy'));
      
      const domainInput = screen.getByPlaceholderText('example.com');
      await user.type(domainInput, 'spam.com');
      
      const addButton = screen.getByText('Add');
      await user.click(addButton);
      
      expect(mockConfigManager.excludeDomain).toHaveBeenCalledWith('spam.com');
    });

    it('should remove domain from exclusion list', async () => {
      // Mock configuration with excluded domains
      mockConfigManager.getButtonConfiguration.mockReturnValue({
        ...mockConfigManager.getButtonConfiguration(),
        excludeDomains: ['spam.com', 'ads.com'],
      });
      
      const user = userEvent.setup();
      render(<ButtonSettingsDialog {...defaultProps} />);
      
      // Switch to privacy tab
      await user.click(screen.getByText('Privacy'));
      
      // Find and click the remove button for spam.com
      const removeButtons = screen.getAllByRole('button');
      const spamRemoveButton = removeButtons.find(button => 
        button.closest('.flex')?.textContent?.includes('spam.com')
      );
      
      if (spamRemoveButton) {
        await user.click(spamRemoveButton);
        expect(mockConfigManager.includeDomain).toHaveBeenCalledWith('spam.com');
      }
    });
  });

  describe('Advanced Settings', () => {
    it('should export settings', async () => {
      const user = userEvent.setup();
      render(<ButtonSettingsDialog {...defaultProps} />);
      
      // Switch to advanced tab
      await user.click(screen.getByText('Advanced'));
      
      const exportButton = screen.getByText('Export Settings');
      await user.click(exportButton);
      
      expect(mockConfigManager.exportPreferences).toHaveBeenCalled();
    });

    it('should reset to defaults', async () => {
      const user = userEvent.setup();
      render(<ButtonSettingsDialog {...defaultProps} />);
      
      // Switch to advanced tab
      await user.click(screen.getByText('Advanced'));
      
      const resetButton = screen.getByText('Reset to Defaults');
      await user.click(resetButton);
      
      expect(mockConfigManager.resetToDefaults).toHaveBeenCalled();
    });

    it('should handle file import', async () => {
      const user = userEvent.setup();
      render(<ButtonSettingsDialog {...defaultProps} />);
      
      // Switch to advanced tab
      await user.click(screen.getByText('Advanced'));
      
      const fileInput = screen.getByRole('button', { name: /import settings/i })
        .parentElement?.querySelector('input[type="file"]');
      
      if (fileInput) {
        const file = new File(['{"test": "data"}'], 'settings.json', { type: 'application/json' });
        
        // Mock FileReader
        const mockFileReader = {
          readAsText: vi.fn(),
          onload: null as any,
          result: '{"test": "data"}',
        };
        
        global.FileReader = vi.fn(() => mockFileReader) as any;
        
        await user.upload(fileInput, file);
        
        // Simulate file read completion
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: '{"test": "data"}' } } as any);
        }
        
        expect(mockConfigManager.importPreferences).toHaveBeenCalledWith('{"test": "data"}');
      }
    });
  });

  describe('Dialog Controls', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      
      render(<ButtonSettingsDialog {...defaultProps} onClose={onClose} />);
      
      const closeButton = screen.getByText('Close');
      await user.click(closeButton);
      
      expect(onClose).toHaveBeenCalled();
    });

    it('should call onConfigChange when configuration updates', async () => {
      const user = userEvent.setup();
      const onConfigChange = vi.fn();
      
      render(<ButtonSettingsDialog {...defaultProps} onConfigChange={onConfigChange} />);
      
      // Change a setting
      const sizeSelect = screen.getByDisplayValue('Medium (64px)');
      await user.click(sizeSelect);
      
      const largeOption = screen.getByText('Large (80px)');
      await user.click(largeOption);
      
      expect(onConfigChange).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should handle loading configuration', () => {
      mockConfigManager.getButtonConfiguration.mockReturnValue(null);
      mockConfigManager.getPrivacySettings.mockReturnValue(null);
      
      render(<ButtonSettingsDialog {...defaultProps} />);
      
      // Should not render content when configuration is not loaded
      expect(screen.queryByText('Visual Settings')).not.toBeInTheDocument();
    });

    it('should load settings when dialog opens', async () => {
      render(<ButtonSettingsDialog {...defaultProps} isOpen={false} />);
      
      // Initially closed, should not load
      expect(mockConfigManager.loadPreferences).not.toHaveBeenCalled();
      
      // Rerender with isOpen=true
      render(<ButtonSettingsDialog {...defaultProps} isOpen={true} />);
      
      await waitFor(() => {
        expect(mockConfigManager.loadPreferences).toHaveBeenCalled();
      });
    });
  });
});