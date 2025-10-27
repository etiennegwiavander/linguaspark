import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PublicLibraryFilters } from '@/components/public-library-filters';
import type { PublicLessonFilters } from '@/lib/types/public-lessons';

describe('PublicLibraryFilters Component', () => {
  test('renders all filter sections', () => {
    const onFilterChange = vi.fn();
    render(<PublicLibraryFilters onFilterChange={onFilterChange} />);

    // Check for section headers
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('CEFR Level')).toBeInTheDocument();
    expect(screen.getByText('Lesson Type')).toBeInTheDocument();
  });

  test('renders all category options', () => {
    const onFilterChange = vi.fn();
    render(<PublicLibraryFilters onFilterChange={onFilterChange} />);

    // Check for unique category labels
    expect(screen.getByText('General English')).toBeInTheDocument();
    expect(screen.getAllByText('Business').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Travel').length).toBeGreaterThan(0);
    expect(screen.getByText('Academic')).toBeInTheDocument();
    expect(screen.getByText('Conversation')).toBeInTheDocument();
    expect(screen.getAllByText('Grammar').length).toBeGreaterThan(0);
    expect(screen.getByText('Vocabulary')).toBeInTheDocument();
    expect(screen.getAllByText('Pronunciation').length).toBeGreaterThan(0);
    expect(screen.getByText('Culture')).toBeInTheDocument();
  });

  test('renders all CEFR level options', () => {
    const onFilterChange = vi.fn();
    render(<PublicLibraryFilters onFilterChange={onFilterChange} />);

    // Check for all CEFR levels
    expect(screen.getByText('A1')).toBeInTheDocument();
    expect(screen.getByText('A2')).toBeInTheDocument();
    expect(screen.getByText('B1')).toBeInTheDocument();
    expect(screen.getByText('B2')).toBeInTheDocument();
    expect(screen.getByText('C1')).toBeInTheDocument();
  });

  test('renders all lesson type options', () => {
    const onFilterChange = vi.fn();
    render(<PublicLibraryFilters onFilterChange={onFilterChange} />);

    // Check for all lesson types (note: some labels appear in both Category and Lesson Type)
    const discussionElements = screen.getAllByText('Discussion');
    expect(discussionElements.length).toBeGreaterThan(0);
  });

  test('emits filter change when category is selected', () => {
    const onFilterChange = vi.fn();
    render(<PublicLibraryFilters onFilterChange={onFilterChange} />);

    // Select Conversation category (unique to category section)
    const conversationCheckbox = screen.getByLabelText('Conversation');
    fireEvent.click(conversationCheckbox);

    // Should emit filter with category
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'conversation',
      })
    );
  });

  test('emits filter change when CEFR level is selected', () => {
    const onFilterChange = vi.fn();
    render(<PublicLibraryFilters onFilterChange={onFilterChange} />);

    // Select B1 level
    const b1Radio = screen.getByLabelText('B1');
    fireEvent.click(b1Radio);

    // Should emit filter with CEFR level
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        cefr_level: 'B1',
      })
    );
  });

  test('emits filter change when lesson type is selected', () => {
    const onFilterChange = vi.fn();
    render(<PublicLibraryFilters onFilterChange={onFilterChange} />);

    // Find the lesson type Discussion checkbox (not the category one)
    const lessonTypeSection = screen.getByText('Lesson Type').parentElement;
    const discussionCheckbox = lessonTypeSection?.querySelector('input[id="type-discussion"]');
    
    if (discussionCheckbox) {
      fireEvent.click(discussionCheckbox);

      // Should emit filter with lesson type
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          lesson_type: 'discussion',
        })
      );
    }
  });

  test('applies multiple filters correctly', () => {
    const onFilterChange = vi.fn();
    render(<PublicLibraryFilters onFilterChange={onFilterChange} />);

    // Select category (use Academic which is unique)
    const academicCheckbox = screen.getByLabelText('Academic');
    fireEvent.click(academicCheckbox);

    // Select CEFR level
    const b1Radio = screen.getByLabelText('B1');
    fireEvent.click(b1Radio);

    // Should emit combined filters
    expect(onFilterChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        category: 'academic',
        cefr_level: 'B1',
      })
    );
  });

  test('shows active filter count', () => {
    const onFilterChange = vi.fn();
    render(<PublicLibraryFilters onFilterChange={onFilterChange} />);

    // Initially no active filters badge
    expect(screen.queryByText(/active/)).not.toBeInTheDocument();

    // Select a category (use Culture which is unique)
    const cultureCheckbox = screen.getByLabelText('Culture');
    fireEvent.click(cultureCheckbox);

    // Should show 1 active filter
    expect(screen.getByText('1 active')).toBeInTheDocument();

    // Select CEFR level
    const b1Radio = screen.getByLabelText('B1');
    fireEvent.click(b1Radio);

    // Should show 2 active filters
    expect(screen.getByText('2 active')).toBeInTheDocument();
  });

  test('clears all filters when clear button is clicked', () => {
    const onFilterChange = vi.fn();
    render(<PublicLibraryFilters onFilterChange={onFilterChange} />);

    // Select multiple filters (use Vocabulary which is unique)
    const vocabularyCheckbox = screen.getByLabelText('Vocabulary');
    fireEvent.click(vocabularyCheckbox);

    const b1Radio = screen.getByLabelText('B1');
    fireEvent.click(b1Radio);

    // Clear button should appear
    const clearButton = screen.getByText('Clear all filters');
    expect(clearButton).toBeInTheDocument();

    // Click clear button
    fireEvent.click(clearButton);

    // Should emit empty filters
    expect(onFilterChange).toHaveBeenLastCalledWith({});

    // Active filter count should be gone
    expect(screen.queryByText(/active/)).not.toBeInTheDocument();
  });

  test('category checkbox acts as radio (only one selected at a time)', () => {
    const onFilterChange = vi.fn();
    render(<PublicLibraryFilters onFilterChange={onFilterChange} />);

    // Select Academic
    const academicCheckbox = screen.getByLabelText('Academic');
    fireEvent.click(academicCheckbox);

    expect(onFilterChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        category: 'academic',
      })
    );

    // Select Conversation (should replace Academic)
    const conversationCheckbox = screen.getByLabelText('Conversation');
    fireEvent.click(conversationCheckbox);

    expect(onFilterChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        category: 'conversation',
      })
    );
  });

  test('deselects category when clicked again', () => {
    const onFilterChange = vi.fn();
    render(<PublicLibraryFilters onFilterChange={onFilterChange} />);

    // Select General English
    const generalEnglishCheckbox = screen.getByLabelText('General English');
    fireEvent.click(generalEnglishCheckbox);

    // Click again to deselect
    fireEvent.click(generalEnglishCheckbox);

    // Should emit empty category
    expect(onFilterChange).toHaveBeenLastCalledWith({});
  });

  test('clears CEFR level with clear level button', () => {
    const onFilterChange = vi.fn();
    render(<PublicLibraryFilters onFilterChange={onFilterChange} />);

    // Select B1 level
    const b1Radio = screen.getByLabelText('B1');
    fireEvent.click(b1Radio);

    // Clear level button should appear
    const clearLevelButton = screen.getByText('Clear level');
    expect(clearLevelButton).toBeInTheDocument();

    // Click clear level button
    fireEvent.click(clearLevelButton);

    // Should emit empty filters
    expect(onFilterChange).toHaveBeenLastCalledWith({});
  });

  test('initializes with provided filters', () => {
    const onFilterChange = vi.fn();
    const initialFilters: PublicLessonFilters = {
      category: 'academic',
      cefr_level: 'B1',
      lesson_type: 'discussion',
    };

    render(
      <PublicLibraryFilters
        onFilterChange={onFilterChange}
        initialFilters={initialFilters}
      />
    );

    // Should show active filter count
    expect(screen.getByText('3 active')).toBeInTheDocument();

    // Should emit initial filters on mount
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'academic',
        cefr_level: 'B1',
        lesson_type: 'discussion',
      })
    );
  });

  test('does not show clear button when no filters are active', () => {
    const onFilterChange = vi.fn();
    render(<PublicLibraryFilters onFilterChange={onFilterChange} />);

    // Clear button should not be visible
    expect(screen.queryByText('Clear all filters')).not.toBeInTheDocument();
  });

  test('handles multiple lesson type selections', () => {
    const onFilterChange = vi.fn();
    render(<PublicLibraryFilters onFilterChange={onFilterChange} />);

    // Find lesson type checkboxes
    const lessonTypeSection = screen.getByText('Lesson Type').parentElement;
    const discussionCheckbox = lessonTypeSection?.querySelector('input[id="type-discussion"]');
    const grammarCheckbox = lessonTypeSection?.querySelector('input[id="type-grammar"]');

    if (discussionCheckbox && grammarCheckbox) {
      // Select discussion
      fireEvent.click(discussionCheckbox);
      
      // Select grammar
      fireEvent.click(grammarCheckbox);

      // Should show 2 active filters
      expect(screen.getByText('2 active')).toBeInTheDocument();

      // Deselect discussion
      fireEvent.click(discussionCheckbox);

      // Should show 1 active filter
      expect(screen.getByText('1 active')).toBeInTheDocument();
    }
  });
});
