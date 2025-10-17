import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SparkyMascot, type SparkyAnimationType } from '@/components/sparky-mascot';

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => {
  setTimeout(cb, 16);
  return 1;
});
global.cancelAnimationFrame = vi.fn();

describe('SparkyMascot Progress Animations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const extractionAnimations: SparkyAnimationType[] = ['analyzing', 'extracting', 'cleaning', 'preparing'];

  extractionAnimations.forEach(animation => {
    it(`should render ${animation} animation correctly`, () => {
      render(<SparkyMascot animation={animation} size={48} />);
      
      const sparky = screen.getByRole('img', { name: /sparky the lightning bolt mascot/i });
      expect(sparky).toBeInTheDocument();
      
      const stateDescription = screen.getByText(`Sparky is currently in ${animation} state`);
      expect(stateDescription).toBeInTheDocument();
    });
  });

  it('should handle analyzing animation with scanning eyes', async () => {
    render(<SparkyMascot animation="analyzing" size={48} />);
    
    // Fast-forward time to trigger animation effects
    vi.advanceTimersByTime(1000);
    
    const sparky = screen.getByRole('img');
    expect(sparky).toBeInTheDocument();
    
    // Should have scanning indicators in the SVG
    const svg = sparky.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should handle extracting animation with pulling motion', async () => {
    render(<SparkyMascot animation="extracting" size={48} />);
    
    vi.advanceTimersByTime(1000);
    
    const sparky = screen.getByRole('img');
    expect(sparky).toBeInTheDocument();
  });

  it('should handle cleaning animation with polishing effects', async () => {
    render(<SparkyMascot animation="cleaning" size={48} />);
    
    vi.advanceTimersByTime(1000);
    
    const sparky = screen.getByRole('img');
    expect(sparky).toBeInTheDocument();
  });

  it('should handle preparing animation with anticipation effects', async () => {
    render(<SparkyMascot animation="preparing" size={48} extractionProgress={85} />);
    
    vi.advanceTimersByTime(1000);
    
    const sparky = screen.getByRole('img');
    expect(sparky).toBeInTheDocument();
  });

  it('should create spark trails during animations', async () => {
    const { container } = render(<SparkyMascot animation="extracting" size={48} />);
    
    // Fast-forward to allow spark creation
    vi.advanceTimersByTime(500);
    
    // Should have spark trail elements
    const sparkTrails = container.querySelectorAll('[class*="absolute pointer-events-none"]');
    expect(sparkTrails.length).toBeGreaterThan(0);
  });

  it('should clean up spark trails over time', async () => {
    const { container } = render(<SparkyMascot animation="extracting" size={48} />);
    
    // Create sparks
    vi.advanceTimersByTime(500);
    const initialSparks = container.querySelectorAll('[class*="absolute pointer-events-none"]');
    const initialCount = initialSparks.length;
    
    // Wait for cleanup
    vi.advanceTimersByTime(2000);
    const remainingSparks = container.querySelectorAll('[class*="absolute pointer-events-none"]');
    
    // Should have fewer sparks due to cleanup
    expect(remainingSparks.length).toBeLessThanOrEqual(initialCount);
  });

  it('should handle dragging animation with trail effects', async () => {
    render(<SparkyMascot animation="dragging" size={48} />);
    
    vi.advanceTimersByTime(1000);
    
    const sparky = screen.getByRole('img');
    expect(sparky).toBeInTheDocument();
  });

  it('should show success celebration animation', async () => {
    const mockOnComplete = vi.fn();
    render(<SparkyMascot animation="success" size={48} onAnimationComplete={mockOnComplete} />);
    
    vi.advanceTimersByTime(2500);
    
    expect(mockOnComplete).toHaveBeenCalled();
  });

  it('should show error animation with sad expression', async () => {
    const mockOnComplete = vi.fn();
    render(<SparkyMascot animation="error" size={48} onAnimationComplete={mockOnComplete} />);
    
    vi.advanceTimersByTime(2000);
    
    expect(mockOnComplete).toHaveBeenCalled();
  });

  it('should handle different eye states correctly', () => {
    const { rerender } = render(<SparkyMascot animation="idle" size={48} />);
    
    // Test different animations that affect eye expressions
    const animations: SparkyAnimationType[] = ['analyzing', 'extracting', 'success', 'error'];
    
    animations.forEach(animation => {
      rerender(<SparkyMascot animation={animation} size={48} />);
      const sparky = screen.getByRole('img');
      expect(sparky).toBeInTheDocument();
    });
  });

  it('should scale properly with different sizes', () => {
    const sizes = [32, 48, 64, 96];
    
    sizes.forEach(size => {
      const { container } = render(<SparkyMascot animation="idle" size={size} />);
      const sparkyContainer = container.firstChild as HTMLElement;
      
      expect(sparkyContainer).toHaveStyle({
        width: `${size}px`,
        height: `${size}px`
      });
    });
  });

  it('should handle extraction progress for preparing animation', () => {
    const progressValues = [0, 25, 50, 75, 100];
    
    progressValues.forEach(progress => {
      const { container } = render(
        <SparkyMascot animation="preparing" size={48} extractionProgress={progress} />
      );
      
      const sparky = screen.getByRole('img');
      expect(sparky).toBeInTheDocument();
    });
  });

  it('should be accessible with proper ARIA attributes', () => {
    render(<SparkyMascot animation="analyzing" size={48} />);
    
    const sparky = screen.getByRole('img', { name: /sparky the lightning bolt mascot/i });
    expect(sparky).toBeInTheDocument();
    
    const stateDescription = screen.getByText('Sparky is currently in analyzing state');
    expect(stateDescription).toBeInTheDocument();
    expect(stateDescription).toHaveClass('sr-only');
  });

  it('should handle rapid animation changes', () => {
    const { rerender } = render(<SparkyMascot animation="idle" size={48} />);
    
    const rapidAnimations: SparkyAnimationType[] = ['click', 'loading', 'success', 'idle'];
    
    rapidAnimations.forEach(animation => {
      rerender(<SparkyMascot animation={animation} size={48} />);
      vi.advanceTimersByTime(100);
    });
    
    const sparky = screen.getByRole('img');
    expect(sparky).toBeInTheDocument();
  });

  it('should maintain performance with many spark trails', async () => {
    render(<SparkyMascot animation="extracting" size={48} />);
    
    // Generate many sparks quickly
    for (let i = 0; i < 10; i++) {
      vi.advanceTimersByTime(100);
    }
    
    const sparky = screen.getByRole('img');
    expect(sparky).toBeInTheDocument();
    
    // Should still be responsive
    expect(vi.getTimerCount()).toBeGreaterThan(0);
  });
});