import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FloatingActionButton } from '@/components/floating-action-button';

// Mock the SparkyMascot component
vi.mock('@/components/sparky-mascot', () => ({
    SparkyMascot: ({ animation, extractionProgress }: { animation: string; extractionProgress: number }) => (
        <div data-testid="sparky-mascot" data-animation={animation} data-progress={extractionProgress}>
            Sparky ({animation}) - {extractionProgress}%
        </div>
    )
}));

describe('Progress Feedback Integration', () => {
    beforeEach(() => {
        // Mock localStorage
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: vi.fn(() => '{}'),
                setItem: vi.fn(),
            },
            writable: true,
        });
    });

    it('should show progress feedback during extraction', async () => {
        let resolveExtraction: () => void;
        const mockOnExtract = vi.fn(() => new Promise<void>(resolve => {
            resolveExtraction = resolve;
        }));

        render(<FloatingActionButton onExtract={mockOnExtract} />);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        // Should show click animation first
        await waitFor(() => {
            const sparky = screen.getByTestId('sparky-mascot');
            expect(sparky).toHaveAttribute('data-animation', 'click');
        });

        // Should transition to analyzing phase
        await waitFor(() => {
            const sparky = screen.getByTestId('sparky-mascot');
            expect(sparky).toHaveAttribute('data-animation', 'analyzing');
        });

        // Should show progress message
        await waitFor(() => {
            expect(screen.getByText('Sparky is starting extraction...')).toBeInTheDocument();
        });

        // Complete the extraction
        resolveExtraction!();

        // Should show success animation
        await waitFor(() => {
            const sparky = screen.getByTestId('sparky-mascot');
            expect(sparky).toHaveAttribute('data-animation', 'success');
        });

        expect(mockOnExtract).toHaveBeenCalledTimes(1);
    });

    it('should show error feedback when extraction fails', async () => {
        const errorMessage = 'Failed to extract content';
        const mockOnExtract = vi.fn().mockRejectedValue(new Error(errorMessage));

        render(<FloatingActionButton onExtract={mockOnExtract} />);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        // Should show error animation
        await waitFor(() => {
            const sparky = screen.getByTestId('sparky-mascot');
            expect(sparky).toHaveAttribute('data-animation', 'error');
        });

        // Should show error message
        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });
    });

    it('should handle drag feedback correctly', () => {
        render(<FloatingActionButton onExtract={vi.fn()} />);

        const button = screen.getByRole('button');

        // Start dragging
        fireEvent.mouseDown(button, { clientX: 100, clientY: 100 });

        // Should show dragging animation
        const sparky = screen.getByTestId('sparky-mascot');
        expect(sparky).toHaveAttribute('data-animation', 'dragging');

        // End dragging
        fireEvent.mouseUp(document);

        // Should return to idle
        expect(sparky).toHaveAttribute('data-animation', 'idle');
    });

    it('should show hover animations', () => {
        render(<FloatingActionButton onExtract={vi.fn()} />);

        const button = screen.getByRole('button');
        const sparky = screen.getByTestId('sparky-mascot');

        // Should start with idle
        expect(sparky).toHaveAttribute('data-animation', 'idle');

        // Hover should change animation
        fireEvent.mouseEnter(button);
        expect(sparky).toHaveAttribute('data-animation', 'hover');

        // Leave should return to idle
        fireEvent.mouseLeave(button);
        expect(sparky).toHaveAttribute('data-animation', 'idle');
    });

    it('should be accessible', () => {
        render(<FloatingActionButton onExtract={vi.fn()} />);

        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-label', 'Extract content from page for lesson generation');
        expect(button).toHaveAttribute('tabindex', '0');
    });
});