/**
 * Extraction Confirmation Manager
 * 
 * Manages the extraction confirmation dialog workflow and state management.
 * Handles the bridge between content extraction and lesson generation.
 * 
 * Requirements: 4.4, 4.5, 5.6
 */

import type { ExtractedContent } from './enhanced-content-extractor';

export interface ExtractionSession {
  sessionId: string;
  sourceUrl: string;
  startTime: Date;
  endTime?: Date;
  status: 'started' | 'extracting' | 'validating' | 'confirming' | 'complete' | 'cancelled' | 'failed';
  extractedContent?: ExtractedContent;
  selectedLessonType?: LessonType;
  selectedCEFRLevel?: CEFRLevel;
  error?: string;
}

export type LessonType = 'discussion' | 'grammar' | 'travel' | 'business' | 'pronunciation';
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export interface ConfirmationDialogState {
  isOpen: boolean;
  extractedContent: ExtractedContent | null;
  selectedLessonType: LessonType;
  selectedCEFRLevel: CEFRLevel;
  editedContent: string;
  isEditing: boolean;
}

export interface ExtractionConfirmationCallbacks {
  onConfirm: (content: ExtractedContent, lessonType: LessonType, cefrLevel: CEFRLevel) => Promise<void>;
  onCancel: () => void;
  onContentEdit: (editedContent: string) => void;
  onLessonTypeChange: (lessonType: LessonType) => void;
  onCEFRLevelChange: (cefrLevel: CEFRLevel) => void;
}

export class ExtractionConfirmationManager {
  private currentSession: ExtractionSession | null = null;
  private dialogState: ConfirmationDialogState = {
    isOpen: false,
    extractedContent: null,
    selectedLessonType: 'discussion',
    selectedCEFRLevel: 'B1',
    editedContent: '',
    isEditing: false
  };
  private callbacks: ExtractionConfirmationCallbacks | null = null;

  /**
   * Initialize the confirmation manager with callbacks
   * Requirement 5.6: Create cancel/proceed workflow with proper state management
   */
  public initialize(callbacks: ExtractionConfirmationCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Start a new extraction session and show confirmation dialog
   * Requirements: 4.4, 4.5 - Content preview and editing capability
   */
  public async showConfirmationDialog(extractedContent: ExtractedContent): Promise<void> {
    // Create new session
    this.currentSession = {
      sessionId: this.generateSessionId(),
      sourceUrl: extractedContent.sourceInfo.url,
      startTime: new Date(),
      status: 'confirming',
      extractedContent
    };

    // Initialize dialog state
    this.dialogState = {
      isOpen: true,
      extractedContent,
      selectedLessonType: extractedContent.suggestedLessonType,
      selectedCEFRLevel: extractedContent.suggestedCEFRLevel,
      editedContent: extractedContent.text,
      isEditing: false
    };

    // Store session for recovery
    this.storeSession();
  }

  /**
   * Handle user confirmation of extraction
   * Requirement 4.4: User can modify lesson type, CEFR level, and other settings
   */
  public async handleConfirmation(): Promise<void> {
    if (!this.currentSession || !this.callbacks) {
      throw new Error('No active session or callbacks not initialized');
    }

    try {
      // Update session status
      this.currentSession.status = 'complete';
      this.currentSession.endTime = new Date();
      this.currentSession.selectedLessonType = this.dialogState.selectedLessonType;
      this.currentSession.selectedCEFRLevel = this.dialogState.selectedCEFRLevel;

      // Create updated content with user edits
      const updatedContent: ExtractedContent = {
        ...this.dialogState.extractedContent!,
        text: this.dialogState.editedContent,
        suggestedLessonType: this.dialogState.selectedLessonType,
        suggestedCEFRLevel: this.dialogState.selectedCEFRLevel
      };

      // Store final session state
      this.storeSession();

      // Close dialog
      this.closeDialog();

      // Proceed to lesson generation
      await this.callbacks.onConfirm(
        updatedContent,
        this.dialogState.selectedLessonType,
        this.dialogState.selectedCEFRLevel
      );

    } catch (error) {
      console.error('[ExtractionConfirmationManager] Confirmation failed:', error);
      
      if (this.currentSession) {
        this.currentSession.status = 'failed';
        this.currentSession.error = error instanceof Error ? error.message : 'Unknown error';
        this.storeSession();
      }
      
      throw error;
    }
  }

  /**
   * Handle user cancellation of extraction
   * Requirement 5.6: Cancel workflow with proper state management
   */
  public handleCancellation(): void {
    if (this.currentSession) {
      this.currentSession.status = 'cancelled';
      this.currentSession.endTime = new Date();
      this.storeSession();
    }

    this.closeDialog();

    if (this.callbacks) {
      this.callbacks.onCancel();
    }
  }

  /**
   * Handle content editing
   * Requirement 4.5: Content editing capability before proceeding to lesson generation
   */
  public handleContentEdit(editedContent: string): void {
    this.dialogState.editedContent = editedContent;
    
    if (this.callbacks) {
      this.callbacks.onContentEdit(editedContent);
    }
  }

  /**
   * Handle lesson type change
   * Requirement 4.4: User can modify lesson type
   */
  public handleLessonTypeChange(lessonType: LessonType): void {
    this.dialogState.selectedLessonType = lessonType;
    
    if (this.callbacks) {
      this.callbacks.onLessonTypeChange(lessonType);
    }
  }

  /**
   * Handle CEFR level change
   * Requirement 4.4: User can modify CEFR level
   */
  public handleCEFRLevelChange(cefrLevel: CEFRLevel): void {
    this.dialogState.selectedCEFRLevel = cefrLevel;
    
    if (this.callbacks) {
      this.callbacks.onCEFRLevelChange(cefrLevel);
    }
  }

  /**
   * Toggle content editing mode
   */
  public toggleEditingMode(): void {
    this.dialogState.isEditing = !this.dialogState.isEditing;
  }

  /**
   * Get current dialog state
   */
  public getDialogState(): ConfirmationDialogState {
    return { ...this.dialogState };
  }

  /**
   * Get current session
   */
  public getCurrentSession(): ExtractionSession | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  /**
   * Close the confirmation dialog
   */
  public closeDialog(): void {
    this.dialogState.isOpen = false;
    this.dialogState.extractedContent = null;
    this.dialogState.editedContent = '';
    this.dialogState.isEditing = false;
  }

  /**
   * Recover session from storage (for page refresh scenarios)
   */
  public async recoverSession(): Promise<ExtractionSession | null> {
    try {
      const stored = sessionStorage.getItem('linguaspark_extraction_session');
      if (stored) {
        const session: ExtractionSession = JSON.parse(stored);
        
        // Only recover sessions that are in progress
        if (['started', 'extracting', 'validating', 'confirming'].includes(session.status)) {
          this.currentSession = {
            ...session,
            startTime: new Date(session.startTime),
            endTime: session.endTime ? new Date(session.endTime) : undefined
          };
          
          return this.currentSession;
        }
      }
    } catch (error) {
      console.error('[ExtractionConfirmationManager] Session recovery failed:', error);
    }
    
    return null;
  }

  /**
   * Clear stored session data
   */
  public clearSession(): void {
    this.currentSession = null;
    sessionStorage.removeItem('linguaspark_extraction_session');
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `extraction_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Store current session in session storage
   */
  private storeSession(): void {
    if (this.currentSession) {
      try {
        sessionStorage.setItem('linguaspark_extraction_session', JSON.stringify(this.currentSession));
      } catch (error) {
        console.error('[ExtractionConfirmationManager] Failed to store session:', error);
      }
    }
  }
}

/**
 * Utility functions for lesson type and CEFR level handling
 */
export const LessonTypeUtils = {
  getDisplayName(type: LessonType): string {
    const names: Record<LessonType, string> = {
      discussion: 'Discussion',
      grammar: 'Grammar',
      travel: 'Travel',
      business: 'Business',
      pronunciation: 'Pronunciation'
    };
    return names[type];
  },

  getDescription(type: LessonType): string {
    const descriptions: Record<LessonType, string> = {
      discussion: 'Interactive conversation topics and questions',
      grammar: 'Grammar rules, examples, and exercises',
      travel: 'Travel-related vocabulary and scenarios',
      business: 'Professional communication and business English',
      pronunciation: 'Pronunciation guides and phonetic exercises'
    };
    return descriptions[type];
  },

  getAllTypes(): { value: LessonType; label: string; description: string }[] {
    const types: LessonType[] = ['discussion', 'grammar', 'travel', 'business', 'pronunciation'];
    return types.map(type => ({
      value: type,
      label: this.getDisplayName(type),
      description: this.getDescription(type)
    }));
  }
};

export const CEFRLevelUtils = {
  getDisplayName(level: CEFRLevel): string {
    const names: Record<CEFRLevel, string> = {
      A1: 'A1 - Beginner',
      A2: 'A2 - Elementary',
      B1: 'B1 - Intermediate',
      B2: 'B2 - Upper Intermediate',
      C1: 'C1 - Advanced'
    };
    return names[level];
  },

  getDescription(level: CEFRLevel): string {
    const descriptions: Record<CEFRLevel, string> = {
      A1: 'Basic everyday expressions and simple phrases',
      A2: 'Routine tasks and familiar topics',
      B1: 'Main points of clear standard input on familiar matters',
      B2: 'Complex text and abstract topics',
      C1: 'Wide range of demanding, longer texts'
    };
    return descriptions[level];
  },

  getAllLevels(): { value: CEFRLevel; label: string; description: string }[] {
    const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];
    return levels.map(level => ({
      value: level,
      label: this.getDisplayName(level),
      description: this.getDescription(level)
    }));
  }
};