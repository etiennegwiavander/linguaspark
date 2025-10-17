/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExtractionConfirmationDialog } from '@/components/extraction-confirmation-dialog';
import { ExtractionConfirmationManager } from '@/lib/extraction-confirmation-manager';
import type { ExtractedContent } from '@/lib/enhanced-content-extractor';
import type { LessonType, CEFRLevel } from '@/lib/extraction-confirmation-manager';

// Mock the UI components
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children }: any) => <p data-testid="dialog-description">{children}</p>,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }: any) => (
    <select data-testid="select" onChange={(e) => onValueChange(e.target.value)} value={value}>
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => <span>Select value</span>,
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => 