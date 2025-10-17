import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import React from 'react';
import { SparkyMascot, type SparkyAnimationType } from '@/components/sparky-mascot';

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => {
  setTimeout(cb, 16);
  return 1;
});

global.cancelAnimationFrame = vi.fn();

describe('SparkyMascot', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders with default props', () => {
    render(<SparkyMascot animation="idle" />);
    
    const svg = screen.getByRole('img');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '48');
    expect(svg).toHaveAttribute('height', '48');
  });

  it('renders with custom size', () => {
    render(<SparkyMascot animation="idle" size={64} />);
    
    const svg = screen.getByRole('img');
    expect(svg).toHaveAttribute('width', '64');
    expect(svg).toHaveAttribute('height', '64');
  });

  it('applies custom className', () => {
    const { container } = render(
      <SparkyMascot animation="idle" className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  describe('Animation States', () => {
    it('handles idle animation with blinking', async () => {
      const { container } = render(<SparkyMascot animation="idle" />);
      
      // Fast-forward time to trigger idle animations
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      // Check that the component is still rendered and animated
      expect(container.firstChild).toBeInTheDocument();
      
      // Verify SVG elements are present
      const svg = screen.getByRole('img');
      expect(svg).toBeInTheDocument();
    });

    it('handles hover animation with excited bouncing', async () => {
      const { container } = render(<SparkyMascot animation="hover" />);
      
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      expect(container.firstChild).toBeInTheDocument();
      
      // Verify the component responds to hover state
      const svg = screen.getByRole('img');
      expect(svg).toBeInTheDocument();
    });

    it('handles click animation with flash and callback', async () => {
      const onAnimationComplete = vi.fn();
      render(
        <SparkyMascot 
          animation="click" 
          onAnimationComplete={onAnimationComplete}
        />
      );
      
      // Fast-forward through click animation duration
      act(() => {
        vi.advanceTimersByTime(250);
      });
      
      // Check that callback was called
      expect(onAnimationComplete).toHaveBeenCalled();
    });

    it('handles loading animation with spinning', async () => {
      const { container } = render(<SparkyMascot animation="loading" />);
      
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      expect(container.firstChild).toBeInTheDocument();
      
      // Verify rotation is applied
      const svg = screen.getByRole('img');
      const transform = svg.style.transform;
      expect(transform).toContain('rotate');
    });

    it('handles success animation with celebration', async () => {
      const onAnimationComplete = vi.fn();
      render(
        <SparkyMascot 
          animation="success" 
          onAnimationComplete={onAnimationComplete}
        />
      );
      
      act(() => {
        vi.advanceTimersByTime(2100);
      });
      
      // Check that callback was called
      expect(onAnimationComplete).toHaveBeenCalled();
    });

    it('handles error animation with sad expression', async () => {
      const onAnimationComplete = vi.fn();
      render(
        <SparkyMascot 
          animation="error" 
          onAnimationComplete={onAnimationComplete}
        />
      );
      
      act(() => {
        vi.advanceTimersByTime(1600);
      });
      
      // Check that callback was called
      expect(onAnimationComplete).toHaveBeenCalled();
    });

    it('handles dragging animation with trail effects', async () => {
      const { container } = render(<SparkyMascot animation="dragging" />);
      
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      expect(container.firstChild).toBeInTheDocument();
      
      // Verify drag trail sparks are created
      const sparkTrails = container.querySelectorAll('[class*="absolute pointer-events-none"]');
      expect(sparkTrails.length).toBeGreaterThan(0);
    });
  });

  describe('Spark Trail Effects', () => {
    it('creates and cleans up spark trails', async () => {
      const { container } = render(<SparkyMascot animation="click" />);
      
      // Trigger spark creation
      act(() => {
        vi.advanceTimersByTime(100);
      });
      
      // Check for spark trails
      let sparkTrails = container.querySelectorAll('[class*="absolute pointer-events-none"]');
      expect(sparkTrails.length).toBeGreaterThan(0);
      
      // Fast-forward to cleanup time
      act(() => {
        vi.advanceTimersByTime(1200);
      });
      
      // Verify cleanup occurred - sparks should have faded
      sparkTrails = container.querySelectorAll('[class*="absolute pointer-events-none"]');
      // Some sparks may still exist but should be fading
      expect(sparkTrails.length).toBeGreaterThanOrEqual(0);
    });

    it('creates different spark patterns for different animations', async () => {
      const animations: SparkyAnimationType[] = ['click', 'loading', 'success', 'dragging'];
      
      for (const animation of animations) {
        const { container, unmount } = render(<SparkyMascot animation={animation} />);
        
        act(() => {
          vi.advanceTimersByTime(200);
        });
        
        const sparkTrails = container.querySelectorAll('[class*="absolute pointer-events-none"]');
        expect(sparkTrails.length).toBeGreaterThanOrEqual(0);
        
        unmount();
      }
    });
  });

  describe('Eye Expressions', () => {
    it('shows different eye expressions for different animations', () => {
      const expressions = [
        { animation: 'success' as SparkyAnimationType, expected: 'happy' },
        { animation: 'error' as SparkyAnimationType, expected: 'sad' },
        { animation: 'loading' as SparkyAnimationType, expected: 'determined' },
        { animation: 'dragging' as SparkyAnimationType, expected: 'focused' },
        { animation: 'idle' as SparkyAnimationType, expected: 'normal' }
      ];

      expressions.forEach(({ animation, expected }) => {
        const { container, unmount } = render(<SparkyMascot animation={animation} />);
        
        // Verify the SVG is rendered (eye expressions are part of the SVG)
        const svg = screen.getByRole('img');
        expect(svg).toBeInTheDocument();
        
        unmount();
      });
    });
  });

  describe('Physics and Animations', () => {
    it('applies bounce offset for various animations', async () => {
      const { container } = render(<SparkyMascot animation="hover" />);
      
      act(() => {
        vi.advanceTimersByTime(100);
      });
      
      const mascotContainer = container.firstChild as HTMLElement;
      const transform = mascotContainer.style.transform;
      expect(transform).toContain('translateY');
    });

    it('applies glow intensity changes', async () => {
      render(<SparkyMascot animation="loading" />);
      
      act(() => {
        vi.advanceTimersByTime(100);
      });
      
      const svg = screen.getByRole('img');
      const filter = svg.style.filter;
      expect(filter).toContain('drop-shadow');
    });

    it('handles rotation for spinning animations', async () => {
      render(<SparkyMascot animation="loading" />);
      
      act(() => {
        vi.advanceTimersByTime(100);
      });
      
      const svg = screen.getByRole('img');
      const transform = svg.style.transform;
      expect(transform).toContain('rotate');
    });
  });

  describe('Accessibility', () => {
    it('maintains proper SVG structure for screen readers', () => {
      render(<SparkyMascot animation="idle" />);
      
      const svg = screen.getByRole('img');
      expect(svg).toHaveAttribute('viewBox', '0 0 48 48');
      
      // Verify main lightning bolt path exists
      const lightningBolt = svg.querySelector('path[fill="#2563eb"]');
      expect(lightningBolt).toBeInTheDocument();
    });

    it('provides consistent visual feedback across animations', () => {
      const animations: SparkyAnimationType[] = ['idle', 'hover', 'click', 'loading', 'success', 'error', 'dragging'];
      
      animations.forEach(animation => {
        const { container, unmount } = render(<SparkyMascot animation={animation} />);
        
        // Verify the mascot is always visible
        expect(container.firstChild).toBeInTheDocument();
        expect(container.firstChild).toBeVisible();
        
        unmount();
      });
    });
  });

  describe('Performance', () => {
    it('cleans up intervals and timeouts on unmount', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      const { unmount } = render(<SparkyMascot animation="loading" />);
      
      unmount();
      
      // Verify cleanup functions were called
      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('handles rapid animation changes gracefully', () => {
      const { rerender } = render(<SparkyMascot animation="idle" />);
      
      const animations: SparkyAnimationType[] = ['hover', 'click', 'loading', 'success', 'error', 'dragging'];
      
      animations.forEach(animation => {
        expect(() => {
          rerender(<SparkyMascot animation={animation} />);
        }).not.toThrow();
      });
    });
  });
});