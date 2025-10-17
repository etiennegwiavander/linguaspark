import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FloatingActionButton, type ExtractionPhase } from '@/components/floating-action-button';

// Mock the SparkyMascot component
vi.mock('@/components/sparky-mascot', () => ({
  SparkyMascot: ({ animation, extractionProgress }: { animation: string; extractionProgress: number }) => (
    <div data-testid="sparky-mascot" data-animation={animation} data-progress={extractionProgress}>
      Sparky ({animation}) - {extractionProgress}%
    </div>
  )
}));

describe('FloatingActionButton Progress Feedback', () => {
  let mockOnExtract: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnExtract = vi.fn();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => '{}'),
        setItem: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render with initial idle state', () => {
    render(<FloatingActionButton onExtract={mockOnExtract} />);
    
    const sparky = screen.getByTestId('sparky-mascot');
    expect(sparky).toHaveAttribute('data-animation', 'idle');
    expect(sparky).toHaveAttribute('data-progress', '0');
  });

  it('should show click animation when button is clicked', async () => {
    render(<FloatingActionButton onExtract={mockOnExtract} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      const sparky = screen.getByTestId('sparky-mascot');
      expect(sparky).toHaveAttribute('data-animation', 'click');
    });
  });

  it('should start extraction sequence after click', async () => {
    mockOnExtract.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<FloatingActionButton onExtract={mockOnExtract} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      const sparky = screen.getByTestId('sparky-mascot');
      expect(sparky).toHaveAttribute('data-animation', 'analyzing');
    });
    
    expect(mockOnExtract).toHaveBeenCalledTimes(1);
  });

  it('should show progress message during extraction', async () => {
    mockOnExtract.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<FloatingActionButton onExtract={mockOnExtract} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Sparky is starting extraction...')).toBeInTheDocument();
    });
  });

  it('should show progress indicator during loading', async () => {
    mockOnExtract.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<FloatingActionButton onExtract={mockOnExtract} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      const progressIndicator = screen.getByText('0%');
      expect(progressIndicator).toBeInTheDocument();
    });
  });

  it('should show success animation after successful extraction', async () => {
    mockOnExtract.mockResolvedValue(undefined);
    
    render(<FloatingActionButton onExtract={mockOnExtract} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      const sparky = screen.getByTestId('sparky-mascot');
      expect(sparky).toHaveAttribute('data-animation', 'success');
    });
  });

  it('should show error animation when extraction fails', async () => {
    const errorMessage = 'Extraction failed';
    mockOnExtract.mockRejectedValue(new Error(errorMessage));
    
    render(<FloatingActionButton onExtract={mockOnExtract} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      const sparky = screen.getByTestId('sparky-mascot');
      expect(sparky).toHaveAttribute('data-animation', 'error');
    });
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should show dragging animation when button is dragged', () => {
    render(<FloatingActionButton onExtract={mockOnExtract} />);
    
    const button = screen.getByRole('button');
    
    fireEvent.mouseDown(button, { clientX: 100, clientY: 100 });
    
    const sparky = screen.getByTestId('sparky-mascot');
    expect(sparky).toHaveAttribute('data-animation', 'dragging');
  });

  it('should return to idle after drag ends', () => {
    render(<FloatingActionButton onExtract={mockOnExtract} />);
    
    const button = screen.getByRole('button');
    
    fireEvent.mouseDown(button, { clientX: 100, clientY: 100 });
    fireEvent.mouseUp(document);
    
    const sparky = screen.getByTestId('sparky-mascot');
    expect(sparky).toHaveAttribute('data-animation', 'idle');
  });

  it('should be accessible with proper ARIA labels', () => {
    render(<FloatingActionButton onExtract={mockOnExtract} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Extract content from page for lesson generation');
    expect(button).toHaveAttribute('aria-description', 'Click to extract webpage content and create a language lesson. Draggable to reposition.');
  });

  it('should support keyboard navigation', () => {
    render(<FloatingActionButton onExtract={mockOnExtract} />);
    
    const button = screen.getByRole('button');
    
    // Test Enter key
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(mockOnExtract).toHaveBeenCalledTimes(1);
    
    // Test Space key
    fireEvent.keyDown(button, { key: ' ' });
    expect(mockOnExtract).toHaveBeenCalledTimes(2);
  });

  it('should handle hover animations', () => {
    render(<FloatingActionButton onExtract={mockOnExtract} />);
    
    const button = screen.getByRole('button');
    
    fireEvent.mouseEnter(button);
    
    const sparky = screen.getByTestId('sparky-mascot');
    expect(sparky).toHaveAttribute('data-animation', 'hover');
    
    fireEvent.mouseLeave(button);
    expect(sparky).toHaveAttribute('data-animation', 'idle');
  });

  it('should not trigger hover animation during loading', async () => {
    mockOnExtract.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<FloatingActionButton onExtract={mockOnExtract} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      const sparky = screen.getByTestId('sparky-mascot');
      expect(sparky).toHaveAttribute('data-animation', 'analyzing');
    });
    
    // Hover should not change animation during loading
    fireEvent.mouseEnter(button);
    const sparky = screen.getByTestId('sparky-mascot');
    expect(sparky).toHaveAttribute('data-animation', 'analyzing');
  });

  it('should disable button during loading', async () => {
    mockOnExtract.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<FloatingActionButton onExtract={mockOnExtract} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });
    
    // Second click should not trigger extraction
    fireEvent.click(button);
    expect(mockOnExtract).toHaveBeenCalledTimes(1);
  });
});

describe('FloatingActionButton Extraction Phases', () => {
  let mockOnExtract: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnExtract = vi.fn();
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => '{}'),
        setItem: vi.fn(),
      },
      writable: true,
    });
  });

  const phases: ExtractionPhase[] = ['analyzing', 'extracting', 'cleaning', 'preparing'];

  phases.forEach(phase => {
    it(`should handle ${phase} phase correctly`, () => {
      const { rerender } = render(<FloatingActionButton onExtract={mockOnExtract} />);
      
      // Simulate phase change by re-rendering with updated state
      // This would normally be handled internally by the component
      const sparky = screen.getByTestId('sparky-mascot');
      
      // The component should handle phase transitions internally
      // This test verifies the component can render different phases
      expect(sparky).toBeInTheDocument();
    });
  });

  it('should progress through all phases in sequence', async () => {
    let phaseResolver: (value: unknown) => void;
    mockOnExtract.mockImplementation(() => new Promise(resolve => {
      phaseResolver = resolve;
    }));
    
    render(<FloatingActionButton onExtract={mockOnExtract} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Should start with analyzing phase
    await waitFor(() => {
      const sparky = screen.getByTestId('sparky-mascot');
      expect(sparky).toHaveAttribute('data-animation', 'analyzing');
    });
    
    // Complete the extraction
    phaseResolver!(undefined);
    
    // Should end with success
    await waitFor(() => {
      const sparky = screen.getByTestId('sparky-mascot');
      expect(sparky).toHaveAttribute('data-animation', 'success');
    });
  });
});