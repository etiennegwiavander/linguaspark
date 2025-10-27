/**
 * Tests for Workspace Sidebar with Public Lessons Support
 * 
 * Verifies that the workspace sidebar correctly handles:
 * - Personal vs public lesson sources
 * - Admin vs non-admin users
 * - Delete button visibility logic
 * - Export functionality for both lesson types
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WorkspaceSidebar from '@/components/workspace-sidebar';

describe('WorkspaceSidebar - Public Lessons Support', () => {
  const mockSections = [
    { id: 'warmup', title: 'Warm-up', icon: () => null, enabled: true },
    { id: 'vocabulary', title: 'Vocabulary', icon: () => null, enabled: true },
  ];

  const defaultProps = {
    sections: mockSections,
    onToggleSection: vi.fn(),
    onExportPDF: vi.fn(),
    onExportWord: vi.fn(),
    onExportHTML: vi.fn(),
    onNewLesson: vi.fn(),
    isExportingPDF: false,
    isExportingWord: false,
    isExportingHTML: false,
    isCollapsed: false,
  };

  describe('Personal Lessons', () => {
    it('should show delete button for personal lessons by default', () => {
      const onDeleteLesson = vi.fn();
      render(
        <WorkspaceSidebar
          {...defaultProps}
          lessonSource="personal"
          onDeleteLesson={onDeleteLesson}
        />
      );

      // Expand export section
      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);

      // Delete button should be visible
      expect(screen.getByText('Delete Lesson')).toBeInTheDocument();
    });

    it('should hide delete button when showDeleteButton is false', () => {
      const onDeleteLesson = vi.fn();
      render(
        <WorkspaceSidebar
          {...defaultProps}
          lessonSource="personal"
          onDeleteLesson={onDeleteLesson}
          showDeleteButton={false}
        />
      );

      // Expand export section
      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);

      // Delete button should not be visible
      expect(screen.queryByText('Delete Lesson')).not.toBeInTheDocument();
    });

    it('should call onDeleteLesson when delete button is clicked', () => {
      const onDeleteLesson = vi.fn();
      render(
        <WorkspaceSidebar
          {...defaultProps}
          lessonSource="personal"
          onDeleteLesson={onDeleteLesson}
        />
      );

      // Expand export section
      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);

      // Click delete button
      const deleteButton = screen.getByText('Delete Lesson');
      fireEvent.click(deleteButton);

      expect(onDeleteLesson).toHaveBeenCalledTimes(1);
    });
  });

  describe('Public Lessons - Non-Admin User', () => {
    it('should hide delete button for non-admin users viewing public lessons', () => {
      const onDeleteLesson = vi.fn();
      render(
        <WorkspaceSidebar
          {...defaultProps}
          lessonSource="public"
          isAdmin={false}
          onDeleteLesson={onDeleteLesson}
        />
      );

      // Expand export section
      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);

      // Delete button should not be visible
      expect(screen.queryByText('Delete Lesson')).not.toBeInTheDocument();
    });

    it('should show export buttons for non-admin users', () => {
      render(
        <WorkspaceSidebar
          {...defaultProps}
          lessonSource="public"
          isAdmin={false}
        />
      );

      // Expand export section
      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);

      // Export buttons should be visible
      expect(screen.getByText('Export as HTML')).toBeInTheDocument();
      expect(screen.getByText('Export as PDF')).toBeInTheDocument();
      expect(screen.getByText('Export as Word')).toBeInTheDocument();
    });
  });

  describe('Public Lessons - Admin User', () => {
    it('should show delete button for admin users viewing public lessons', () => {
      const onDeleteLesson = vi.fn();
      render(
        <WorkspaceSidebar
          {...defaultProps}
          lessonSource="public"
          isAdmin={true}
          onDeleteLesson={onDeleteLesson}
        />
      );

      // Expand export section
      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);

      // Delete button should be visible
      expect(screen.getByText('Delete Lesson')).toBeInTheDocument();
    });

    it('should call onDeleteLesson when admin clicks delete on public lesson', () => {
      const onDeleteLesson = vi.fn();
      render(
        <WorkspaceSidebar
          {...defaultProps}
          lessonSource="public"
          isAdmin={true}
          onDeleteLesson={onDeleteLesson}
        />
      );

      // Expand export section
      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);

      // Click delete button
      const deleteButton = screen.getByText('Delete Lesson');
      fireEvent.click(deleteButton);

      expect(onDeleteLesson).toHaveBeenCalledTimes(1);
    });

    it('should show export buttons for admin users', () => {
      render(
        <WorkspaceSidebar
          {...defaultProps}
          lessonSource="public"
          isAdmin={true}
        />
      );

      // Expand export section
      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);

      // Export buttons should be visible
      expect(screen.getByText('Export as HTML')).toBeInTheDocument();
      expect(screen.getByText('Export as PDF')).toBeInTheDocument();
      expect(screen.getByText('Export as Word')).toBeInTheDocument();
    });
  });

  describe('Delete Button States', () => {
    it('should show loading state when deleting', () => {
      const onDeleteLesson = vi.fn();
      render(
        <WorkspaceSidebar
          {...defaultProps}
          lessonSource="personal"
          onDeleteLesson={onDeleteLesson}
          isDeletingLesson={true}
        />
      );

      // Expand export section
      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);

      // Should show deleting state
      expect(screen.getByText('Deleting...')).toBeInTheDocument();
    });

    it('should disable delete button when deleting', () => {
      const onDeleteLesson = vi.fn();
      render(
        <WorkspaceSidebar
          {...defaultProps}
          lessonSource="personal"
          onDeleteLesson={onDeleteLesson}
          isDeletingLesson={true}
        />
      );

      // Expand export section
      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);

      // Button should be disabled
      const deleteButton = screen.getByRole('button', { name: /deleting/i });
      expect(deleteButton).toBeDisabled();
    });
  });

  describe('Export Functionality', () => {
    it('should maintain export functionality for all lesson types', () => {
      const onExportPDF = vi.fn();
      const onExportWord = vi.fn();
      const onExportHTML = vi.fn();

      render(
        <WorkspaceSidebar
          {...defaultProps}
          lessonSource="public"
          isAdmin={false}
          onExportPDF={onExportPDF}
          onExportWord={onExportWord}
          onExportHTML={onExportHTML}
        />
      );

      // Expand export section
      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);

      // Test HTML export
      fireEvent.click(screen.getByText('Export as HTML'));
      expect(onExportHTML).toHaveBeenCalledTimes(1);

      // Test PDF export
      fireEvent.click(screen.getByText('Export as PDF'));
      expect(onExportPDF).toHaveBeenCalledTimes(1);

      // Test Word export
      fireEvent.click(screen.getByText('Export as Word'));
      expect(onExportWord).toHaveBeenCalledTimes(1);
    });
  });

  describe('Default Props', () => {
    it('should default to personal lesson source', () => {
      const onDeleteLesson = vi.fn();
      render(
        <WorkspaceSidebar
          {...defaultProps}
          onDeleteLesson={onDeleteLesson}
        />
      );

      // Expand export section
      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);

      // Delete button should be visible (personal default)
      expect(screen.getByText('Delete Lesson')).toBeInTheDocument();
    });

    it('should default isAdmin to false', () => {
      const onDeleteLesson = vi.fn();
      render(
        <WorkspaceSidebar
          {...defaultProps}
          lessonSource="public"
          onDeleteLesson={onDeleteLesson}
        />
      );

      // Expand export section
      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);

      // Delete button should not be visible (non-admin default)
      expect(screen.queryByText('Delete Lesson')).not.toBeInTheDocument();
    });

    it('should default showDeleteButton to true', () => {
      const onDeleteLesson = vi.fn();
      render(
        <WorkspaceSidebar
          {...defaultProps}
          lessonSource="personal"
          onDeleteLesson={onDeleteLesson}
        />
      );

      // Expand export section
      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);

      // Delete button should be visible
      expect(screen.getByText('Delete Lesson')).toBeInTheDocument();
    });
  });
});
