import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExtractionConfirmationManager } from '@/lib/extraction-confirmation-manager';
import type { ExtractedContent } from '@/lib/enhanced-content-extractor';

describe('Extraction Confirmation Integration', () => {
  let manager: ExtractionConfirmationManager;
  let mockCallbacks: any;
  let mockContent: ExtractedContent;

  beforeEach(() => {
    manager = new ExtractionConfirmationManager();
    mockCallbacks = {
      onConfirm: vi.fn().mockResolvedValue(undefined),
      onCancel: vi.fn(),
      onContentEdit: vi.fn(),
      onLessonTypeChange: vi.fn(),
      onCEFRLevelChange: vi.fn()
    };
    manager.initialize(mockCallbacks);

    mockContent = {
      text: "Climate change is one of the most pressing issues of our time. The Earth's climate has always varied naturally, but scientific evidence shows that human activities are causing unprecedented changes.",
      structuredContent: {
        headings: [{ level: 1, text: "Climate Change: A Global Challenge" }],
        paragraphs: [
          "Climate change is one of the most pressing issues of our time.",
          "The Earth's climate has always varied naturally, but scientific evidence shows that human activities are causing unprecedented changes."
        ],
        lists: [],
        quotes: [],
        images: [],
        links: [],
        tables: [],
        codeBlocks: []
      },
      metadata: {
        title: "Climate Change: Understanding the Global Challenge",
        author: "Dr. Sarah Johnson",
        sourceUrl: "https://example.com/climate-change-article",
        domain: "example.com",
        language: "en",
        contentType: "article",
        estimatedReadingTime: 2
      },
      quality: {
        wordCount: 245,
        readingTime: 2,
        complexity: 'intermediate',
        suitabilityScore: 0.92,
        issues: [],
        meetsMinimumStandards: true,
        readabilityScore: 0.85,
        vocabularyComplexity: 0.7,
        sentenceComplexity: 0.6
      },
      sourceInfo: {
        url: "https://example.com/climate-change-article",
        domain: "example.com",
        title: "Climate Change: Understanding the Global Challenge",
        extractedAt: new Date(),
        userAgent: "LinguaSpark Extension 1.0",
        attribution: "Source: Climate Change: Understanding the Global Challenge - example.com"
      },
      suggestedLessonType: 'discussion',
      suggestedCEFRLevel: 'B2'
    };
  });

  it('completes full extraction confirmation workflow', async () => {
    // Step 1: Show confirmation dialog
    await manager.showConfirmationDialog(mockContent);
    
    let state = manager.getDialogState();
    expect(state.isOpen).toBe(true);
    expect(state.extractedContent).toBe(mockContent);
    expect(state.selectedLessonType).toBe('discussion');
    expect(state.selectedCEFRLevel).toBe('B2');
    expect(state.editedContent).toBe(mockContent.text);

    // Step 2: User edits content
    const editedText = "Edited: " + mockContent.text;
    manager.handleContentEdit(editedText);
    
    state = manager.getDialogState();
    expect(state.editedContent).toBe(editedText);
    expect(mockCallbacks.onContentEdit).toHaveBeenCalledWith(editedText);

    // Step 3: User changes lesson type
    manager.handleLessonTypeChange('grammar');
    
    state = manager.getDialogState();
    expect(state.selectedLessonType).toBe('grammar');
    expect(mockCallbacks.onLessonTypeChange).toHaveBeenCalledWith('grammar');

    // Step 4: User changes CEFR level
    manager.handleCEFRLevelChange('C1');
    
    state = manager.getDialogState();
    expect(state.selectedCEFRLevel).toBe('C1');
    expect(mockCallbacks.onCEFRLevelChange).toHaveBeenCalledWith('C1');

    // Step 5: User confirms
    await manager.handleConfirmation();
    
    expect(mockCallbacks.onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        text: editedText,
        suggestedLessonType: 'grammar',
        suggestedCEFRLevel: 'C1'
      }),
      'grammar',
      'C1'
    );

    state = manager.getDialogState();
    expect(state.isOpen).toBe(false);
  });

  it('handles cancellation workflow', async () => {
    // Show dialog
    await manager.showConfirmationDialog(mockContent);
    
    let state = manager.getDialogState();
    expect(state.isOpen).toBe(true);

    // User cancels
    manager.handleCancellation();
    
    expect(mockCallbacks.onCancel).toHaveBeenCalled();
    
    state = manager.getDialogState();
    expect(state.isOpen).toBe(false);
  });

  it('preserves session data for recovery', async () => {
    // Show dialog and make changes
    await manager.showConfirmationDialog(mockContent);
    manager.handleContentEdit("Modified content");
    manager.handleLessonTypeChange('travel');
    
    // Simulate page refresh by creating new manager
    const newManager = new ExtractionConfirmationManager();
    newManager.initialize(mockCallbacks);
    
    // Recover session
    const recoveredSession = await newManager.recoverSession();
    
    expect(recoveredSession).toBeTruthy();
    expect(recoveredSession?.extractedContent).toEqual(expect.objectContaining({
      text: mockContent.text,
      metadata: expect.objectContaining({
        title: mockContent.metadata.title,
        domain: mockContent.metadata.domain
      })
    }));
    expect(recoveredSession?.status).toBe('confirming');
  });

  it('validates lesson type and CEFR level options', () => {
    const lessonTypes = ['discussion', 'grammar', 'travel', 'business', 'pronunciation'];
    const cefrLevels = ['A1', 'A2', 'B1', 'B2', 'C1'];

    lessonTypes.forEach(type => {
      manager.handleLessonTypeChange(type as any);
      const state = manager.getDialogState();
      expect(state.selectedLessonType).toBe(type);
    });

    cefrLevels.forEach(level => {
      manager.handleCEFRLevelChange(level as any);
      const state = manager.getDialogState();
      expect(state.selectedCEFRLevel).toBe(level);
    });
  });

  it('handles error scenarios gracefully', async () => {
    // Test confirmation without initialization
    const uninitializedManager = new ExtractionConfirmationManager();
    
    await expect(uninitializedManager.handleConfirmation()).rejects.toThrow();
  });

  it('generates proper session metadata', async () => {
    await manager.showConfirmationDialog(mockContent);
    
    const session = manager.getCurrentSession();
    
    expect(session).toBeTruthy();
    expect(session?.sessionId).toMatch(/^extraction_\d+_[a-z0-9]+$/);
    expect(session?.sourceUrl).toBe(mockContent.sourceInfo.url);
    expect(session?.status).toBe('confirming');
    expect(session?.startTime).toBeInstanceOf(Date);
  });
});