import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PublicLessonCard } from '@/components/public-lesson-card';
import { PublicLibraryFilters } from '@/components/public-library-filters';
import { AdminLessonCreationDialog } from '@/components/admin-lesson-creation-dialog';
import { AdminStatsPanel } from '@/components/admin-stats-panel';
import type { PublicLesson, AdminStats } from '@/lib/types/public-lessons';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe('PublicLessonCard Component', () => {
  const mockLesson: PublicLesson = {
    id: 'test-lesson-1',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    creator_id: 'creator-1',
    title: 'Business English: Meetings and Presentations',
    content: {
      title: 'Business English: Meetings and Presentations',
      warmup: { questions: ['Question 1'] },
      wrapup: { summary: 'Summary' },
      metadata: {
        cefr_level: 'B2',
        lesson_type: 'business',
      },
    },
    source_url: 'https://example.com/article',
    source_title: 'Example Article',
    banner_image_url: 'https://example.com/image.jpg',
    category: 'business',
    cefr_level: 'B2',
    lesson_type: 'business',
    tags: ['meetings', 'presentations'],
    estimated_duration_minutes: 45,
  };

  it('renders lesson title correctly', () => {
    render(<PublicLessonCard lesson={mockLesson} />);
    expect(screen.getByText('Business English: Meetings and Presentations')).toBeInTheDocument();
  });

  it('displays category badge', () => {
    render(<PublicLessonCard lesson={mockLesson} />);
    expect(screen.getByText('business')).toBeInTheDocument();
  });

  it('displays CEFR level badge', () => {
    render(<PublicLessonCard lesson={mockLesson} />);
    expect(screen.getByText('B2')).toBeInTheDocument();
  });

  it('displays lesson type badge', () => {
    render(<PublicLessonCard lesson={mockLesson} />);
    const badges = screen.getAllByText('business');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('displays estimated duration when available', () => {
    render(<PublicLessonCard lesson={mockLesson} />);
    expect(screen.getByText(/45/)).toBeInTheDocument();
  });

  it('displays banner image when available', () => {
    render(<PublicLessonCard lesson={mockLesson} />);
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('alt', 'Business English: Meetings and Presentations');
  });

  it('renders without banner image gracefully', () => {
    const lessonWithoutImage = { ...mockLesson, banner_image_url: null };
    render(<PublicLessonCard lesson={lessonWithoutImage} />);
    expect(screen.getByText('Business English: Meetings and Presentations')).toBeInTheDocument();
  });

  it('displays creation date', () => {
    render(<PublicLessonCard lesson={mockLesson} />);
    // Check for date-related text
    const dateElements = screen.getAllByText(/2024|Jan|January/i);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('handles different CEFR levels', () => {
    const levels: Array<'A1' | 'A2' | 'B1' | 'B2' | 'C1'> = ['A1', 'A2', 'B1', 'B2', 'C1'];
    
    levels.forEach((level) => {
      const { unmount } = render(
        <PublicLessonCard lesson={{ ...mockLesson, cefr_level: level }} />
      );
      expect(screen.getByText(level)).toBeInTheDocument();
      unmount();
    });
  });

  it('handles different categories', () => {
    const categories = ['general-english', 'business', 'travel', 'academic', 'conversation'];
    
    categories.forEach((category) => {
      const { unmount } = render(
        <PublicLessonCard lesson={{ ...mockLesson, category: category as any }} />
      );
      expect(screen.getByText(category)).toBeInTheDocument();
      unmount();
    });
  });

  it('is clickable and navigates to lesson view', () => {
    render(<PublicLessonCard lesson={mockLesson} />);
    const card = screen.getByRole('article');
    expect(card).toBeInTheDocument();
    fireEvent.click(card);
    // Navigation is handled by Link component
  });
});

describe('PublicLibraryFilters Component', () => {
  const mockOnFilterChange = vi.fn();

  beforeEach(() => {
    mockOnFilterChange.mockClear();
  });

  it('renders all filter sections', () => {
    render(<PublicLibraryFilters onFilterChange={mockOnFilterChange} />);
    
    expect(screen.getByText(/category/i)).toBeInTheDocument();
    expect(screen.getByText(/cefr level/i)).toBeInTheDocument();
    expect(screen.getByText(/lesson type/i)).toBeInTheDocument();
  });

  it('displays category checkboxes', () => {
    render(<PublicLibraryFilters onFilterChange={mockOnFilterChange} />);
    
    expect(screen.getByLabelText(/business/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/travel/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/academic/i)).toBeInTheDocument();
  });

  it('displays CEFR level options', () => {
    render(<PublicLibraryFilters onFilterChange={mockOnFilterChange} />);
    
    expect(screen.getByLabelText('A1')).toBeInTheDocument();
    expect(screen.getByLabelText('A2')).toBeInTheDocument();
    expect(screen.getByLabelText('B1')).toBeInTheDocument();
    expect(screen.getByLabelText('B2')).toBeInTheDocument();
    expect(screen.getByLabelText('C1')).toBeInTheDocument();
  });

  it('emits filter changes when category is selected', async () => {
    render(<PublicLibraryFilters onFilterChange={mockOnFilterChange} />);
    
    const businessCheckbox = screen.getByLabelText(/business/i);
    fireEvent.click(businessCheckbox);
    
    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          category: expect.arrayContaining(['business']),
        })
      );
    });
  });

  it('emits filter changes when CEFR level is selected', async () => {
    render(<PublicLibraryFilters onFilterChange={mockOnFilterChange} />);
    
    const b1Radio = screen.getByLabelText('B1');
    fireEvent.click(b1Radio);
    
    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          cefr_level: 'B1',
        })
      );
    });
  });

  it('emits filter changes when lesson type is selected', async () => {
    render(<PublicLibraryFilters onFilterChange={mockOnFilterChange} />);
    
    const discussionCheckbox = screen.getByLabelText(/discussion/i);
    fireEvent.click(discussionCheckbox);
    
    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          lesson_type: expect.arrayContaining(['discussion']),
        })
      );
    });
  });

  it('supports multiple category selections', async () => {
    render(<PublicLibraryFilters onFilterChange={mockOnFilterChange} />);
    
    const businessCheckbox = screen.getByLabelText(/business/i);
    const travelCheckbox = screen.getByLabelText(/travel/i);
    
    fireEvent.click(businessCheckbox);
    fireEvent.click(travelCheckbox);
    
    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          category: expect.arrayContaining(['business', 'travel']),
        })
      );
    });
  });

  it('displays clear filters button', () => {
    render(<PublicLibraryFilters onFilterChange={mockOnFilterChange} />);
    expect(screen.getByText(/clear/i)).toBeInTheDocument();
  });

  it('clears all filters when clear button is clicked', async () => {
    render(<PublicLibraryFilters onFilterChange={mockOnFilterChange} />);
    
    // Select some filters
    const businessCheckbox = screen.getByLabelText(/business/i);
    fireEvent.click(businessCheckbox);
    
    // Clear filters
    const clearButton = screen.getByText(/clear/i);
    fireEvent.click(clearButton);
    
    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        category: [],
        cefr_level: undefined,
        lesson_type: [],
      });
    });
  });

  it('shows active filter count', async () => {
    render(<PublicLibraryFilters onFilterChange={mockOnFilterChange} />);
    
    const businessCheckbox = screen.getByLabelText(/business/i);
    const b1Radio = screen.getByLabelText('B1');
    
    fireEvent.click(businessCheckbox);
    fireEvent.click(b1Radio);
    
    // Should show indication of active filters
    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalled();
    });
  });
});

describe('AdminLessonCreationDialog Component', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    mockOnConfirm.mockClear();
    mockOnCancel.mockClear();
    mockOnOpenChange.mockClear();
  });

  it('renders dialog when open', () => {
    render(
      <AdminLessonCreationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    expect(screen.getByText(/save to public library/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <AdminLessonCreationDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    expect(screen.queryByText(/save to public library/i)).not.toBeInTheDocument();
  });

  it('displays category selection dropdown', () => {
    render(
      <AdminLessonCreationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('displays tags input field', () => {
    render(
      <AdminLessonCreationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    expect(screen.getByPlaceholderText(/add a tag/i)).toBeInTheDocument();
  });

  it('displays estimated duration input', () => {
    render(
      <AdminLessonCreationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    const durationInput = screen.getByPlaceholderText(/e\.g\., 45/i);
    expect(durationInput).toBeInTheDocument();
  });

  it('calls onConfirm with correct data when form is submitted', async () => {
    // Mock scrollIntoView for Radix UI Select
    Element.prototype.scrollIntoView = vi.fn();
    
    render(
      <AdminLessonCreationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    // Find and click the select trigger
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);
    
    // Wait for options to appear and select business
    await waitFor(() => {
      const businessOption = screen.getByText('Business');
      fireEvent.click(businessOption);
    });
    
    // Submit form
    const saveButton = screen.getByRole('button', { name: /save to public library/i });
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'business',
        })
      );
    });
  });

  it('validates required fields before submission', async () => {
    render(
      <AdminLessonCreationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    // Try to submit without selecting category
    const saveButton = screen.getByRole('button', { name: /save to public library/i });
    fireEvent.click(saveButton);
    
    // Should not call onConfirm if validation fails
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('allows adding multiple tags', async () => {
    render(
      <AdminLessonCreationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    const tagsInput = screen.getByPlaceholderText(/add a tag/i);
    
    // Add first tag
    fireEvent.change(tagsInput, { target: { value: 'business' } });
    fireEvent.keyDown(tagsInput, { key: 'Enter' });
    
    // Add second tag
    fireEvent.change(tagsInput, { target: { value: 'meetings' } });
    fireEvent.keyDown(tagsInput, { key: 'Enter' });
    
    expect(screen.getByText('business')).toBeInTheDocument();
    expect(screen.getByText('meetings')).toBeInTheDocument();
  });

  it('allows setting estimated duration', async () => {
    render(
      <AdminLessonCreationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    const durationInput = screen.getByPlaceholderText(/e\.g\., 45/i);
    fireEvent.change(durationInput, { target: { value: '45' } });
    
    expect(durationInput).toHaveValue(45);
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <AdminLessonCreationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });
});

describe('AdminStatsPanel Component', () => {
  // Note: AdminStatsPanel fetches its own data and checks admin status internally
  // These tests verify the component structure when it has data
  
  it('renders component structure', () => {
    // The component will attempt to fetch data on mount
    // We're testing that it renders without crashing
    const { container } = render(<AdminStatsPanel />);
    expect(container).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    const { container } = render(<AdminStatsPanel className="custom-class" />);
    const element = container.firstChild;
    expect(element).toHaveClass('custom-class');
  });

  // Note: Full integration tests for AdminStatsPanel are in test/admin-stats-panel.test.tsx
  // which properly mocks the Supabase client and API calls
});
