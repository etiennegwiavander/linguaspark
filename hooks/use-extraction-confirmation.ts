/**
 * useExtractionConfirmation Hook
 * 
 * React hook for managing extraction confirmation dialog state and workflow.
 * Provides a clean interface for components to handle extraction confirmation.
 * 
 * Requirements: 4.4, 4.5, 5.6
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  ExtractionConfirmationManager, 
  type ExtractionSession,
  type ConfirmationDialogState,
  type LessonType,
  type CEFRLevel,
  type ExtractionConfirmationCallbacks
} from '@/lib/extraction-confirmation-manager';
import type { ExtractedContent } from '@/lib/enhanced-content-extractor';

export interface UseExtractionConfirmationOptions {
  onConfirm?: (content: ExtractedContent, lessonType: LessonType, cefrLevel: CEFRLevel) => Promise<void>;
  onCancel?: () => void;
  onContentEdit?: (editedContent: string) => void;
  onLessonTypeChange?: (lessonType: LessonType) => void;
  onCEFRLevelChange?: (cefrLevel: CEFRLevel) => void;
  autoRecoverSession?: boolean;
}

export interface UseExtractionConfirmationReturn {
  // Dialog state
  isOpen: boolean;
  extractedContent: ExtractedContent | null;
  selectedLessonType: LessonType;
  selectedCEFRLevel: CEFRLevel;
  editedContent: string;
  isEditing: boolean;
  
  // Session management
  currentSession: ExtractionSession | null;
  
  // Actions
  showConfirmationDialog: (content: ExtractedContent) => Promise<void>;
  handleConfirm: () => Promise<void>;
  handleCancel: () => void;
  handleContentEdit: (content: string) => void;
  handleLessonTypeChange: (type: LessonType) => void;
  handleCEFRLevelChange: (level: CEFRLevel) => void;
  toggleEditingMode: () => void;
  closeDialog: () => void;
  clearSession: () => void;
  
  // State
  isProcessing: boolean;
  error: string | null;
}

export function useExtractionConfirmation(
  options: UseExtractionConfirmationOptions = {}
): UseExtractionConfirmationReturn {
  const managerRef = useRef<ExtractionConfirmationManager | null>(null);
  const [dialogState, setDialogState] = useState<ConfirmationDialogState>({
    isOpen: false,
    extractedContent: null,
    selectedLessonType: 'discussion',
    selectedCEFRLevel: 'B1',
    editedContent: '',
    isEditing: false
  });
  const [currentSession, setCurrentSession] = useState<ExtractionSession | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize manager
  useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = new ExtractionConfirmationManager();
      
      const callbacks: ExtractionConfirmationCallbacks = {
        onConfirm: async (content, lessonType, cefrLevel) => {
          try {
            setIsProcessing(true);
            setError(null);
            
            if (options.onConfirm) {
              await options.onConfirm(content, lessonType, cefrLevel);
            }
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Confirmation failed';
            setError(errorMessage);
            throw err;
          } finally {
            setIsProcessing(false);
          }
        },
        
        onCancel: () => {
          setError(null);
          if (options.onCancel) {
            options.onCancel();
          }
        },
        
        onContentEdit: (editedContent) => {
          if (options.onContentEdit) {
            options.onContentEdit(editedContent);
          }
        },
        
        onLessonTypeChange: (lessonType) => {
          if (options.onLessonTypeChange) {
            options.onLessonTypeChange(lessonType);
          }
        },
        
        onCEFRLevelChange: (cefrLevel) => {
          if (options.onCEFRLevelChange) {
            options.onCEFRLevelChange(cefrLevel);
          }
        }
      };
      
      managerRef.current.initialize(callbacks);
    }
  }, [options]);

  // Auto-recover session on mount
  useEffect(() => {
    if (options.autoRecoverSession && managerRef.current) {
      managerRef.current.recoverSession().then(session => {
        if (session) {
          setCurrentSession(session);
          // If session was in confirming state, restore dialog
          if (session.status === 'confirming' && session.extractedContent) {
            setDialogState(managerRef.current!.getDialogState());
          }
        }
      }).catch(err => {
        console.error('Failed to recover session:', err);
      });
    }
  }, [options.autoRecoverSession]);

  // Sync dialog state with manager
  const syncDialogState = useCallback(() => {
    if (managerRef.current) {
      const state = managerRef.current.getDialogState();
      setDialogState(state);
      
      const session = managerRef.current.getCurrentSession();
      setCurrentSession(session);
    }
  }, []);

  const showConfirmationDialog = useCallback(async (content: ExtractedContent) => {
    if (!managerRef.current) return;
    
    try {
      setError(null);
      await managerRef.current.showConfirmationDialog(content);
      syncDialogState();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to show confirmation dialog';
      setError(errorMessage);
      throw err;
    }
  }, [syncDialogState]);

  const handleConfirm = useCallback(async () => {
    if (!managerRef.current) return;
    
    try {
      setIsProcessing(true);
      setError(null);
      await managerRef.current.handleConfirmation();
      syncDialogState();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Confirmation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [syncDialogState]);

  const handleCancel = useCallback(() => {
    if (!managerRef.current) return;
    
    setError(null);
    managerRef.current.handleCancellation();
    syncDialogState();
  }, [syncDialogState]);

  const handleContentEdit = useCallback((content: string) => {
    if (!managerRef.current) return;
    
    managerRef.current.handleContentEdit(content);
    
    // Immediately update local state to ensure re-render
    const newState = managerRef.current.getDialogState();
    setDialogState(newState);
  }, []);

  const handleLessonTypeChange = useCallback((type: LessonType) => {
    if (!managerRef.current) return;
    
    managerRef.current.handleLessonTypeChange(type);
    
    // Immediately update local state to ensure re-render
    const newState = managerRef.current.getDialogState();
    setDialogState(newState);
  }, []);

  const handleCEFRLevelChange = useCallback((level: CEFRLevel) => {
    if (!managerRef.current) return;
    
    managerRef.current.handleCEFRLevelChange(level);
    
    // Immediately update local state to ensure re-render
    const newState = managerRef.current.getDialogState();
    setDialogState(newState);
  }, []);

  const toggleEditingMode = useCallback(() => {
    if (!managerRef.current) return;
    
    managerRef.current.toggleEditingMode();
    
    // Immediately update local state to ensure re-render
    const newState = managerRef.current.getDialogState();
    setDialogState(newState);
  }, []);

  const closeDialog = useCallback(() => {
    if (!managerRef.current) return;
    
    setError(null);
    managerRef.current.closeDialog();
    syncDialogState();
  }, [syncDialogState]);

  const clearSession = useCallback(() => {
    if (!managerRef.current) return;
    
    setError(null);
    managerRef.current.clearSession();
    setCurrentSession(null);
    setDialogState({
      isOpen: false,
      extractedContent: null,
      selectedLessonType: 'discussion',
      selectedCEFRLevel: 'B1',
      editedContent: '',
      isEditing: false
    });
  }, []);

  return {
    // Dialog state
    isOpen: dialogState.isOpen,
    extractedContent: dialogState.extractedContent,
    selectedLessonType: dialogState.selectedLessonType,
    selectedCEFRLevel: dialogState.selectedCEFRLevel,
    editedContent: dialogState.editedContent,
    isEditing: dialogState.isEditing,
    
    // Session management
    currentSession,
    
    // Actions
    showConfirmationDialog,
    handleConfirm,
    handleCancel,
    handleContentEdit,
    handleLessonTypeChange,
    handleCEFRLevelChange,
    toggleEditingMode,
    closeDialog,
    clearSession,
    
    // State
    isProcessing,
    error
  };
}