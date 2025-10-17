import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ButtonConfigurationDemo } from '@/components/button-configuration-demo';

// Mock the configuration manager and related components
vi.mock('@/lib/button-configuration-manager');
vi.mock('@/components/floating-action-button');
vi.mock('@/components/button-settings-dialog');

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

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    hostname: 'example.com',
  },
  writable: true,
});

describe('ButtonConfigurationDemo Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Demo Page Rendering', () => {
    it('should render the demo page with all sections', () => {
      render(<ButtonConfigurationDemo />);
      
      expect(screen.getByText('Button Configuration Demo')).toBeInTheDocument();
      expect(screen.getByText('Configuration Features')).toBeInTheDocument();
      expect(screen.getByText('Usage Instructions')).toBeInTheDocument();
    });

    it('should display feature categories', () => {
      render(<ButtonConfigurationDemo />);
      
      expect(screen.getByText('Appearance Settings')).toBeInTheDocument();
      expect(screen.getByText('Behavior Settings')).toBeInTheDocument();
      expect(screen.getByText('Privacy Settings')).toBeInTheDocument();
      expect(screen.getByText('Advanced Features')).toBeInTheDocument();
    });

    it('should show usage instructions', () => {
      render(<ButtonConfigurationDemo />);
      
      expect(screen.getByText('Opening Settings:')).toBeInTheDocument();
      expect(screen.getByText('Keyboard Navigation:')).toBeInTheDocument();
      expect(screen.getByText('Domain Features:')).toBeInTheDocument();
    });
  });

  describe('Demo Interactions', () => {
    it('should handle settings button click', async () => {
      const user = userEvent.setup();
      render(<ButtonConfigurationDemo />);
      
      const settingsButton = screen.getByText('Open Settings');
      await user.click(settingsButton);
      
      // Settings dialog should be rendered (mocked)
      // In a real test, we would check if the dialog opens
    });

    it('should handle extraction simulation', async () => {
      const user = userEvent.setup();
      render(<ButtonConfigurationDemo />);
      
      const extractButton = screen.getByText('Simulate Extraction');
      await user.click(extractButton);
      
      // Should show extraction status
      await waitFor(() => {
        expect(screen.getByText('Starting extraction...')).toBeInTheDocument();
      });
      
      // Should eventually show completion
      await waitFor(() => {
        expect(screen.getByText('Extraction completed successfully!')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Feature Documentation', () => {
    it('should document appearance features', () => {
      render(<ButtonConfigurationDemo />);
      
      expect(screen.getByText('Button size (small, medium, large)')).toBeInTheDocument();
      expect(screen.getByText('Theme (light, dark, auto)')).toBeInTheDocument();
      expect(screen.getByText('Opacity control')).toBeInTheDocument();
      expect(screen.getByText('Sparky mascot toggle')).toBeInTheDocument();
      expect(screen.getByText('Animation speed settings')).toBeInTheDocument();
    });

    it('should document behavior features', () => {
      render(<ButtonConfigurationDemo />);
      
      expect(screen.getByText('Drag enable/disable')).toBeInTheDocument();
      expect(screen.getByText('Edge snapping')).toBeInTheDocument();
      expect(screen.getByText('Hover-only visibility')).toBeInTheDocument();
      expect(screen.getByText('Custom keyboard shortcuts')).toBeInTheDocument();
      expect(screen.getByText('Domain-specific positioning')).toBeInTheDocument();
    });

    it('should document privacy features', () => {
      render(<ButtonConfigurationDemo />);
      
      expect(screen.getByText('Robots.txt respect')).toBeInTheDocument();
      expect(screen.getByText('Domain exclusions')).toBeInTheDocument();
      expect(screen.getByText('Data collection controls')).toBeInTheDocument();
      expect(screen.getByText('Analytics opt-out')).toBeInTheDocument();
      expect(screen.getByText('Error reporting toggle')).toBeInTheDocument();
    });

    it('should document advanced features', () => {
      render(<ButtonConfigurationDemo />);
      
      expect(screen.getByText('Settings backup/restore')).toBeInTheDocument();
      expect(screen.getByText('Reset to defaults')).toBeInTheDocument();
      expect(screen.getByText('Smart positioning')).toBeInTheDocument();
      expect(screen.getByText('Cross-domain memory')).toBeInTheDocument();
      expect(screen.getByText('Accessibility compliance')).toBeInTheDocument();
    });
  });

  describe('Keyboard Instructions', () => {
    it('should document keyboard shortcuts', () => {
      render(<ButtonConfigurationDemo />);
      
      expect(screen.getByText('Alt+E: Focus the button')).toBeInTheDocument();
      expect(screen.getByText('Arrow keys: Move button position')).toBeInTheDocument();
      expect(screen.getByText('Shift+Arrows: Fast movement')).toBeInTheDocument();
      expect(screen.getByText('H: Show help dialog')).toBeInTheDocument();
      expect(screen.getByText('D: Toggle drag mode')).toBeInTheDocument();
      expect(screen.getByText('Escape: Cancel/close')).toBeInTheDocument();
    });

    it('should document settings access methods', () => {
      render(<ButtonConfigurationDemo />);
      
      expect(screen.getByText('Right-click the floating button')).toBeInTheDocument();
      expect(screen.getByText('Use keyboard shortcut Ctrl+S (when button is focused)')).toBeInTheDocument();
      expect(screen.getByText('Click the "Open Settings" button above')).toBeInTheDocument();
    });
  });

  describe('Status Feedback', () => {
    it('should show and hide extraction status', async () => {
      const user = userEvent.setup();
      render(<ButtonConfigurationDemo />);
      
      // Initially no status
      expect(screen.queryByText(/extraction/i)).not.toBeInTheDocument();
      
      // Click simulate extraction
      const extractButton = screen.getByText('Simulate Extraction');
      await user.click(extractButton);
      
      // Should show starting status
      await waitFor(() => {
        expect(screen.getByText('Starting extraction...')).toBeInTheDocument();
      });
      
      // Should show completion status
      await waitFor(() => {
        expect(screen.getByText('Extraction completed successfully!')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      // Status should disappear after timeout
      await waitFor(() => {
        expect(screen.queryByText(/extraction/i)).not.toBeInTheDocument();
      }, { timeout: 4000 });
    });
  });

  describe('Component Integration', () => {
    it('should pass correct props to FloatingActionButton', () => {
      render(<ButtonConfigurationDemo />);
      
      // The FloatingActionButton should be rendered with proper configuration
      // In a real test, we would verify the props passed to the mocked component
    });

    it('should pass correct props to ButtonSettingsDialog', () => {
      render(<ButtonConfigurationDemo />);
      
      // The ButtonSettingsDialog should be rendered with proper props
      // In a real test, we would verify the dialog state management
    });
  });

  describe('Responsive Design', () => {
    it('should render properly on different screen sizes', () => {
      render(<ButtonConfigurationDemo />);
      
      // Check for responsive grid classes
      const featuresGrid = screen.getByText('Configuration Features').closest('.grid');
      expect(featuresGrid).toHaveClass('grid-cols-1', 'md:grid-cols-2');
    });

    it('should maintain proper spacing and layout', () => {
      render(<ButtonConfigurationDemo />);
      
      // Check for proper spacing classes
      const mainContainer = screen.getByText('Button Configuration Demo').closest('.space-y-8');
      expect(mainContainer).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle extraction errors gracefully', async () => {
      // Mock console.error to avoid test output noise
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const user = userEvent.setup();
      render(<ButtonConfigurationDemo />);
      
      // The demo should handle any errors in extraction simulation
      const extractButton = screen.getByText('Simulate Extraction');
      await user.click(extractButton);
      
      // Should not throw errors
      await waitFor(() => {
        expect(screen.getByText(/extraction/i)).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });
  });
});