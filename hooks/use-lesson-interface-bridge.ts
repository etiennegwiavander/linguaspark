/**
 * useLessonInterfaceBridge Hook
 * 
 * React hook for managing lesson interface bridge functionality.
 * Provides easy integration with the lesson generation workflow.
 * 
 * Requirements: 4.1, 4.2, 4.6, 6.6
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  LessonInterfaceBridge, 
  type LessonPreConfiguration,
  type InterfaceState,
  type LessonInterfaceBridgeCallbacks
} from '@/lib/lesson-interface-bridge';
import type { ExtractedContent } from '@/lib/enhanced-content-extractor';
import type { LessonType, CEFRLevel } from '@/lib/extraction-confirmation-manager';

export interface UseLessonInterfaceBridgeOptions {
  onLessonInterfaceOpened?: (config: LessonPreConfiguration) => void;
  onContentPrePopulated?: (content: string) => void;
  onSettingsApplied?: (lessonType: LessonType, cefrLevel: CEFRLevel) => void;
  onError?: (error: string) => void;
  autoLoadConfiguration?: boolean;
}

export interface UseLessonInterfaceBridgeReturn {
  // State
  interfaceState: InterfaceState;
  currentConfiguration: LessonPreConfiguration | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  openLessonInterface: (content: ExtractedContent) => Promise<void>;
  populateInterface: (content: ExtractedContent) => Promise<void>;
  enableContentEditing: () => void;
  preserveUserCustomizations: () => void;
  integrateWithExistingWorkflow: () => void;
  clearConfiguration: () => Promise<void>;
  
  // Utilities
  isExtractionSource: () => Promise<boolean>;
  loadConfiguration: () => Promise<LessonPreConfiguration | null>;
}

export function useLessonInterfaceBridge(
  options: UseLessonInterfaceBridgeOptions = {}
): UseLessonInterfaceBridgeReturn {
  const bridgeRef = useRef<LessonInterfaceBridge | null>(null);
  const [interfaceState, setInterfaceState] = useState<InterfaceState>({
    contentPrePopulated: false,
    settingsCustomizable: true,
    extractionConfirmed: false,
    readyForGeneration: false,
    lessonInterfaceOpen: false
  });
  const [currentConfiguration, setCurrentConfiguration] = useState<LessonPreConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize bridge
  useEffect(() => {
    if (!bridgeRef.current) {
      bridgeRef.current = new LessonInterfaceBridge();
      
      const callbacks: LessonInterfaceBridgeCallbacks = {
        onLessonInterfaceOpened: (config) => {
          setCurrentConfiguration(config);
          if (options.onLessonInterfaceOpened) {
            options.onLessonInterfaceOpened(config);
          }
        },
        
        onContentPrePopulated: (content) => {
          if (options.onContentPrePopulated) {
            options.onContentPrePopulated(content);
          }
        },
        
        onSettingsApplied: (lessonType, cefrLevel) => {
          if (options.onSettingsApplied) {
            options.onSettingsApplied(lessonType, cefrLevel);
          }
        },
        
        onError: (errorMessage) => {
          setError(errorMessage);
          if (options.onError) {
            options.onError(errorMessage);
          }
        }
      };
      
      bridgeRef.current.initialize(callbacks);
    }
  }, [options]);

  // Auto-load configuration on mount
  useEffect(() => {
    if (options.autoLoadConfiguration) {
      loadConfiguration();
    }
  }, [options.autoLoadConfiguration]);

  // Sync state with bridge
  const syncState = useCallback(() => {
    if (bridgeRef.current) {
      const state = bridgeRef.current.getState();
      setInterfaceState(state);
      
      const config = bridgeRef.current.getCurrentConfiguration();
      setCurrentConfiguration(config);
    }
  }, []);

  const openLessonInterface = useCallback(async (content: ExtractedContent) => {
    if (!bridgeRef.current) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      await bridgeRef.current.openLessonInterface(content);
      syncState();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to open lesson interface';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [syncState]);

  const populateInterface = useCallback(async (content: ExtractedContent) => {
    if (!bridgeRef.current) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      await bridgeRef.current.populateInterface(content);
      syncState();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to populate interface';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [syncState]);

  const enableContentEditing = useCallback(() => {
    if (!bridgeRef.current) return;
    
    bridgeRef.current.enableContentEditing();
    syncState();
  }, [syncState]);

  const preserveUserCustomizations = useCallback(() => {
    if (!bridgeRef.current) return;
    
    bridgeRef.current.preserveUserCustomizations();
    syncState();
  }, [syncState]);

  const integrateWithExistingWorkflow = useCallback(() => {
    if (!bridgeRef.current) return;
    
    bridgeRef.current.integrateWithExistingWorkflow();
    syncState();
  }, [syncState]);

  const clearConfiguration = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await LessonInterfaceBridge.clearExtractionConfiguration();
      setCurrentConfiguration(null);
      setInterfaceState({
        contentPrePopulated: false,
        settingsCustomizable: true,
        extractionConfirmed: false,
        readyForGeneration: false,
        lessonInterfaceOpen: false
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear configuration';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const isExtractionSource = useCallback(async (): Promise<boolean> => {
    try {
      return await LessonInterfaceBridge.isExtractionSource();
    } catch (err) {
      console.error('Failed to check extraction source:', err);
      return false;
    }
  }, []);

  const loadConfiguration = useCallback(async (): Promise<LessonPreConfiguration | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const config = await LessonInterfaceBridge.loadExtractionConfiguration();
      setCurrentConfiguration(config);
      
      if (config) {
        setInterfaceState(prev => ({
          ...prev,
          contentPrePopulated: true,
          extractionConfirmed: true,
          readyForGeneration: true
        }));
      }
      
      return config;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load configuration';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // State
    interfaceState,
    currentConfiguration,
    isLoading,
    error,
    
    // Actions
    openLessonInterface,
    populateInterface,
    enableContentEditing,
    preserveUserCustomizations,
    integrateWithExistingWorkflow,
    clearConfiguration,
    
    // Utilities
    isExtractionSource,
    loadConfiguration
  };
}