import * as React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminLessonCreationDialog } from '@/components/admin-lesson-creation-dialog';
import type { PublicLessonMetadata } from '@/lib/types/public-lessons';

describe('AdminLessonCreationDialog', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnOpenChange = vi.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders dialog when open is true', () => {
      render(<AdminLessonCreationDialog {...defaultProps} />);

      expect(screen.getByText('Save to Public Library')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Add metadata to make this lesson discoverable in the public library.'
        )
      ).toBeInTheDocument();
    });

    it('does not render dialog when open is false', () => {
      render(<AdminLessonCreationDialog {...defaultProps} open={false} />);

      expect(screen.queryByText('Save to Public Library')).not.toBeInTheDocument();
    });

    it('renders all form fields', () => {
      render(<AdminLessonCreationDialog {...defaultProps} />);

      expect(screen.getByLabelText(/Category/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Tags/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Estimated Duration/)).toBeInTheDocument();
    });

    it('marks category field as required', () => {
      render(<AdminLessonCreationDialog {...defaultProps} />);

      const categoryLabel = screen.getByText(/Category/);
      expect(categoryLabel.querySelector('.text-destructive')).toBeInTheDocument();
    });

    it('renders action buttons', () => {
      render(<AdminLessonCreationDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Cancel/ })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Save to Public Library/ })
      ).toBeInTheDocument();
    });
  });

  describe('Category Selection', () => {
    it('displays all category options', async () => {
      const user = userEvent.setup();
      render(<AdminLessonCreationDialog {...defaultProps} />);

      const categoryTrigger = screen.getByRole('combobox', { name: /Category/ });
      await user.click(categoryTrigger);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'General English' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Business' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Travel' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Academic' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Conversation' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Grammar' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Vocabulary' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Pronunciation' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Culture' })).toBeInTheDocument();
      });
    });

    it('allows selecting a category', async () => {
      const user = userEvent.setup();
      render(<AdminLessonCreationDialog {...defaultProps} />);

      const categoryTrigger = screen.getByRole('combobox', { name: /Category/ });
      await user.click(categoryTrigger);

      const businessOption = await screen.findByRole('option', { name: 'Business' });
      await user.click(businessOption);

      await waitFor(() => {
        expect(categoryTrigger).toHaveTextContent('Business');
      });
    });

    it('enables confirm button when category is selected', async () => {
      const user = userEvent.setup();
      render(<AdminLessonCreationDialog {...defaultProps} />);

      const confirmButton = screen.getByRole('button', {
        name: /Save to Public Library/,
      });
      expect(confirmButton).toBeDisabled();

      const categoryTrigger = screen.getByRole('combobox', { name: /Category/ });
      await user.click(categoryTrigger);

      const grammarOption = await screen.findByRole('option', { name: 'Grammar' });
      await user.click(grammarOption);

      await waitFor(() => {
        expect(confirmButton).not.toBeDisabled();
      });
    });
  });

  describe('Tags Management', () => {
    it('allows adding tags via button', async () => {
      const user = userEvent.setup();
      render(<AdminLessonCreationDialog {...defaultProps} />);

      const tagInput = screen.getByPlaceholderText('Add a tag and press Enter');
      const addButton = screen.getByRole('button', { name: /Add/ });

      await user.type(tagInput, 'beginner-friendly');
      await user.click(addButton);

      expect(screen.getByText('beginner-friendly')).toBeInTheDocument();
      expect(tagInput).toHaveValue('');
    });

    it('allows adding tags via Enter key', async () => {
      const user = userEvent.setup();
      render(<AdminLessonCreationDialog {...defaultProps} />);

      const tagInput = screen.getByPlaceholderText('Add a tag and press Enter');

      await user.type(tagInput, 'intermediate{Enter}');

      expect(screen.getByText('intermediate')).toBeInTheDocument();
      expect(tagInput).toHaveValue('');
    });

    it('prevents adding duplicate tags', async () => {
      const user = userEvent.setup();
      render(<AdminLessonCreationDialog {...defaultProps} />);

      const tagInput = screen.getByPlaceholderText('Add a tag and press Enter');

      await user.type(tagInput, 'vocabulary{Enter}');
      await user.type(tagInput, 'vocabulary{Enter}');

      const tags = screen.getAllByText('vocabulary');
      expect(tags).toHaveLength(1);
    });

    it('trims whitespace from tags', async () => {
      const user = userEvent.setup();
      render(<AdminLessonCreationDialog {...defaultProps} />);

      const tagInput = screen.getByPlaceholderText('Add a tag and press Enter');

      await user.type(tagInput, '  spaced-tag  {Enter}');

      expect(screen.getByText('spaced-tag')).toBeInTheDocument();
    });

    it('allows removing tags', async () => {
      const user = userEvent.setup();
      render(<AdminLessonCreationDialog {...defaultProps} />);

      const tagInput = screen.getByPlaceholderText('Add a tag and press Enter');

      await user.type(tagInput, 'removable{Enter}');
      expect(screen.getByText('removable')).toBeInTheDocument();

      const removeButton = screen.getByLabelText('Remove removable tag');
      await user.click(removeButton);

      expect(screen.queryByText('removable')).not.toBeInTheDocument();
    });

    it('disables add button when input is empty', () => {
      render(<AdminLessonCreationDialog {...defaultProps} />);

      const addButton = screen.getByRole('button', { name: /Add/ });
      expect(addButton).toBeDisabled();
    });

    it('displays multiple tags', async () => {
      const user = userEvent.setup();
      render(<AdminLessonCreationDialog {...defaultProps} />);

      const tagInput = screen.getByPlaceholderText('Add a tag and press Enter');

      await user.type(tagInput, 'tag1{Enter}');
      await user.type(tagInput, 'tag2{Enter}');
      await user.type(tagInput, 'tag3{Enter}');

      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
      expect(screen.getByText('tag3')).toBeInTheDocument();
    });
  });

  describe('Estimated Duration', () => {
    it('allows entering duration in minutes', async () => {
      const user = userEvent.setup();
      render(<AdminLessonCreationDialog {...defaultProps} />);

      const durationInput = screen.getByLabelText(/Estimated Duration/);

      await user.type(durationInput, '45');

      expect(durationInput).toHaveValue(45);
    });

    it('accepts numeric input only', () => {
      render(<AdminLessonCreationDialog {...defaultProps} />);

      const durationInput = screen.getByLabelText(/Estimated Duration/);

      expect(durationInput).toHaveAttribute('type', 'number');
      expect(durationInput).toHaveAttribute('min', '1');
      expect(durationInput).toHaveAttribute('max', '300');
    });
  });

  describe('Form Submission', () => {
    it('calls onConfirm with metadata when form is valid', async () => {
      const user = userEvent.setup();
      render(<AdminLessonCreationDialog {...defaultProps} />);

      // Select category
      const categoryTrigger = screen.getByRole('combobox', { name: /Category/ });
      await user.click(categoryTrigger);
      const businessOption = await screen.findByRole('option', { name: 'Business' });
      await user.click(businessOption);

      // Add tags
      const tagInput = screen.getByPlaceholderText('Add a tag and press Enter');
      await user.type(tagInput, 'professional{Enter}');
      await user.type(tagInput, 'workplace{Enter}');

      // Set duration
      const durationInput = screen.getByLabelText(/Estimated Duration/);
      await user.type(durationInput, '60');

      // Submit
      const confirmButton = screen.getByRole('button', {
        name: /Save to Public Library/,
      });
      await user.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledWith({
        category: 'business',
        tags: ['professional', 'workplace'],
        estimated_duration_minutes: 60,
      });
    });

    it('calls onConfirm with minimal metadata when optional fields are empty', async () => {
      const user = userEvent.setup();
      render(<AdminLessonCreationDialog {...defaultProps} />);

      // Select category only
      const categoryTrigger = screen.getByRole('combobox', { name: /Category/ });
      await user.click(categoryTrigger);
      const grammarOption = await screen.findByRole('option', { name: 'Grammar' });
      await user.click(grammarOption);

      // Submit
      const confirmButton = screen.getByRole('button', {
        name: /Save to Public Library/,
      });
      await user.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledWith({
        category: 'grammar',
        tags: undefined,
        estimated_duration_minutes: undefined,
      });
    });

    it('does not call onConfirm when category is not selected', async () => {
      const user = userEvent.setup();
      render(<AdminLessonCreationDialog {...defaultProps} />);

      const confirmButton = screen.getByRole('button', {
        name: /Save to Public Library/,
      });

      // Button should be disabled
      expect(confirmButton).toBeDisabled();

      // Try to click anyway
      await user.click(confirmButton);

      expect(mockOnConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Form Cancellation', () => {
    it('calls onCancel and onOpenChange when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<AdminLessonCreationDialog {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /Cancel/ });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Form Reset', () => {
    it('resets form when dialog is reopened', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<AdminLessonCreationDialog {...defaultProps} />);

      // Fill form
      const categoryTrigger = screen.getByRole('combobox', { name: /Category/ });
      await user.click(categoryTrigger);
      const travelOption = await screen.findByRole('option', { name: 'Travel' });
      await user.click(travelOption);

      const tagInput = screen.getByPlaceholderText('Add a tag and press Enter');
      await user.type(tagInput, 'vacation{Enter}');

      const durationInput = screen.getByLabelText(/Estimated Duration/);
      await user.type(durationInput, '30');

      // Close dialog
      rerender(<AdminLessonCreationDialog {...defaultProps} open={false} />);

      // Reopen dialog
      rerender(<AdminLessonCreationDialog {...defaultProps} open={true} />);

      // Check form is reset
      await waitFor(() => {
        const newCategoryTrigger = screen.getByRole('combobox', { name: /Category/ });
        expect(newCategoryTrigger).toHaveTextContent('Select a category');
      });

      expect(screen.queryByText('vacation')).not.toBeInTheDocument();

      const newDurationInput = screen.getByLabelText(/Estimated Duration/);
      expect(newDurationInput).toHaveValue(null);
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for all inputs', () => {
      render(<AdminLessonCreationDialog {...defaultProps} />);

      expect(screen.getByLabelText(/Category/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Tags/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Estimated Duration/)).toBeInTheDocument();
    });

    it('has accessible remove buttons for tags', async () => {
      const user = userEvent.setup();
      render(<AdminLessonCreationDialog {...defaultProps} />);

      const tagInput = screen.getByPlaceholderText('Add a tag and press Enter');
      await user.type(tagInput, 'test-tag{Enter}');

      const removeButton = screen.getByLabelText('Remove test-tag tag');
      expect(removeButton).toBeInTheDocument();
    });

    it('provides helpful placeholder text', () => {
      render(<AdminLessonCreationDialog {...defaultProps} />);

      expect(
        screen.getByPlaceholderText('Add a tag and press Enter')
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g., 45')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('requires category to be selected before submission', () => {
      render(<AdminLessonCreationDialog {...defaultProps} />);

      const confirmButton = screen.getByRole('button', {
        name: /Save to Public Library/,
      });

      expect(confirmButton).toBeDisabled();
    });

    it('allows submission with only category selected', async () => {
      const user = userEvent.setup();
      render(<AdminLessonCreationDialog {...defaultProps} />);

      const categoryTrigger = screen.getByRole('combobox', { name: /Category/ });
      await user.click(categoryTrigger);
      const cultureOption = await screen.findByRole('option', { name: 'Culture' });
      await user.click(cultureOption);

      const confirmButton = screen.getByRole('button', {
        name: /Save to Public Library/,
      });

      await waitFor(() => {
        expect(confirmButton).not.toBeDisabled();
      });
    });
  });
});
