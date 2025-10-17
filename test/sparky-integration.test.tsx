import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { FloatingActionButton } from '@/components/floating-action-button';

// Mock the content analysis engine
vi.mock('@/lib/content-analysis-engine', () => ({
  ContentAnalysisEngine: vi.fn().mockImplementation(() => ({
    analyzePageContent: vi.fn().mockReturnValue({
      wordCount: 500,
      contentType: 'article',
      language: 'en',
      qualityScore: 0.8,
      hasMainContent: true,
      isEducational: true
    }),
    isContentSuitable: vi.fn().mockReturnValue(true)
  }))
}));

describe('Sparky Integration with Floating Action Button', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('shows Sparky in idle state when button is visible', () => {
    render(<FloatingActionButton />);
    
    // Verify Sparky is rendered in idle state
    const sparky = screen.getByRole('img');
    expect(sparky).toBeInTheDocument();
    expect(sparky).toHaveAttribute('aria-describedby', expect.stringContaining('idle'));
  });

  it('changes Sparky animation on hover', () => {
    render(<FloatingActionButton />);
    
    const button = screen.getByRole('button');
    const sparky = screen.getByRole('img');
    
    // Hover over button
    fireEvent.mouseEnter(button);
    
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    // Verify Sparky changes to hover state
    expect(sparky).toHaveAttribute('aria-describedby', expect.stringContaining('hover'));
  });

  it('shows click animation when button is clicked', async () => {
    const mockExtract = vi.fn();
    
    render(<FloatingActionButton onExtract={mockExtract} />);
    
    const button = screen.getByRole('button');
    const sparky = screen.getByRole('img');
    
    // Click to start extraction
    fireEvent.click(button);
    
    // Verify Sparky shows click state initially
    expect(sparky).toHaveAttribute('aria-describedby', expect.stringContaining('click'));
    
    // Wait for click animation to complete
    act(() => {
      vi.advanceTimersByTime(250);
    });
    
    // Verify the extract function was called
    expect(mockExtract).toHaveBeenCalled();
  });

  it('handles button states correctly', async () => {
    render(<FloatingActionButton />);
    
    const button = screen.getByRole('button');
    const sparky = screen.getByRole('img');
    
    // Initially should be in idle state
    expect(sparky).toHaveAttribute('aria-describedby', expect.stringContaining('idle'));
    
    // Should be enabled and clickable
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows dragging animation when button is being dragged', () => {
    render(<FloatingActionButton />);
    
    const button = screen.getByRole('button');
    const sparky = screen.getByRole('img');
    
    // Start dragging
    fireEvent.mouseDown(button, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(document, { clientX: 150, clientY: 150 });
    
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    // Verify Sparky shows dragging state
    expect(sparky).toHaveAttribute('aria-describedby', expect.stringContaining('dragging'));
    
    // End dragging
    fireEvent.mouseUp(document);
    
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    // Verify Sparky returns to idle state
    expect(sparky).toHaveAttribute('aria-describedby', expect.stringContaining('idle'));
  });

  it('maintains accessibility during all animation states', () => {
    render(<FloatingActionButton />);
    
    const sparky = screen.getByRole('img');
    
    // Verify accessibility attributes are always present
    expect(sparky).toHaveAttribute('aria-label', 'Sparky the lightning bolt mascot');
    expect(sparky).toHaveAttribute('aria-describedby');
    expect(sparky).toHaveAttribute('role', 'img');
    
    // Verify description element exists
    const descriptionId = sparky.getAttribute('aria-describedby');
    const description = document.getElementById(descriptionId!);
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass('sr-only');
  });
});