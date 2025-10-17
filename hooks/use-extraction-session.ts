/**
 * React hook for managing extraction sessions
 * 
 * Provides a React-friendly interface to the ExtractionSessionManager
 * with automatic cleanup and state management.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  ExtractionSessionManager, 
  ExtractionSession, 
  ExtractedContent, 
  ExtractionHistory,
  UserInteractionEvent
} from '@/lib/extraction-session-manager';

export interface UseExtractionSessionReturn {
  // Current session state
  currentSession: ExtractionSession | null;
  isLoading: boolean;
  error: string | null;
  
  // Session management
  createSession: (sourceUrl: string, extractionMethod?: 'full_page' | 'selection') => Promise<string>;
  updateSession: (sessionId: string, updates: Partial<ExtractionSession>) => Promise<void>;
  completeSession: (sessionId: string, extractedContent: ExtractedContent) => Promise<void>;
  failSession: (sessionId: string, error: string) => Promise<void>;
  retryExtraction: (sessionId: string) => Promise<boolean>;
  
  // Data retrieval
  getSession: (sessionId: string) => Promise<ExtractionSession | null>;
  getActiveSessions: () => Promise<ExtractionSession[]>;
  getHistory: () => Promise<ExtractionHistory[]>;
  getEvents: () => Promise<UserInteractionEvent[]>;
  
  // Analytics
  getAnalytics: () => Promise<any>;
  
  // Cleanup
  cleanup: () => Promise<void>;
  
  // Event logging
  logEvent: (sessionId: string, eventType: UserInteractionEvent['eventType'], url: string, metadata?: Record<string, any>) => Promise<void>;
}

export function useExtractionSession(): UseExtractionSessionReturn {
  const [currentSession, setCurrentSession] = useState<ExtractionSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-cleanup on mount
  useEffect(() => {
    const performCleanup = async () => {
      try {
        await ExtractionSessionManager.cleanupExpiredSessions();
      } catch (err) {
        console.error('Failed to cleanup expired sessions:', err);
      }
    };

    performCleanup();
  }, []);

  const createSession = useCallback(async (sourceUrl: string, extractionMethod: 'full_page' | 'selection' = 'full_page'): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const session = await ExtractionSessionManager.createSession(sourceUrl, extractionMethod);
      setCurrentSession(session);
      return session.sessionId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create session';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSession = useCallback(async (sessionId: string, updates: Partial<ExtractionSession>): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await ExtractionSessionManager.updateSession(sessionId, updates);
      
      // Update current session if it's the one being updated
      if (currentSession?.sessionId === sessionId) {
        const updatedSession = await ExtractionSessionManager.getSession(sessionId);
        setCurrentSession(updatedSession);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update session';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentSession]);

  const completeSession = useCallback(async (sessionId: string, extractedContent: ExtractedContent): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await ExtractionSessionManager.completeSession(sessionId, extractedContent);
      
      // Update current session if it's the one being completed
      if (currentSession?.sessionId === sessionId) {
        const updatedSession = await ExtractionSessionManager.getSession(sessionId);
        setCurrentSession(updatedSession);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete session';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentSession]);

  const failSession = useCallback(async (sessionId: string, error: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await ExtractionSessionManager.failSession(sessionId, error);
      
      // Update current session if it's the one being failed
      if (currentSession?.sessionId === sessionId) {
        const updatedSession = await ExtractionSessionManager.getSession(sessionId);
        setCurrentSession(updatedSession);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark session as failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentSession]);

  const retryExtraction = useCallback(async (sessionId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const canRetry = await ExtractionSessionManager.retryExtraction(sessionId);
      
      // Update current session if it's the one being retried
      if (currentSession?.sessionId === sessionId) {
        const updatedSession = await ExtractionSessionManager.getSession(sessionId);
        setCurrentSession(updatedSession);
      }
      
      return canRetry;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to retry extraction';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentSession]);

  const getSession = useCallback(async (sessionId: string): Promise<ExtractionSession | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const session = await ExtractionSessionManager.getSession(sessionId);
      return session;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get session';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getActiveSessions = useCallback(async (): Promise<ExtractionSession[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const sessions = await ExtractionSessionManager.getActiveSessions();
      return sessions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get active sessions';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getHistory = useCallback(async (): Promise<ExtractionHistory[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const history = await ExtractionSessionManager.getExtractionHistory();
      return history;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get extraction history';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getEvents = useCallback(async (): Promise<UserInteractionEvent[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const events = await ExtractionSessionManager.getInteractionEvents();
      return events;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get interaction events';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const analytics = await ExtractionSessionManager.getAnalyticsSummary();
      return analytics;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get analytics';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cleanup = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await ExtractionSessionManager.cleanupExpiredSessions();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cleanup sessions';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logEvent = useCallback(async (
    sessionId: string, 
    eventType: UserInteractionEvent['eventType'], 
    url: string, 
    metadata?: Record<string, any>
  ): Promise<void> => {
    try {
      await ExtractionSessionManager.logInteractionEvent(sessionId, eventType, url, metadata);
    } catch (err) {
      console.error('Failed to log interaction event:', err);
      // Don't throw here as logging failures shouldn't break the main flow
    }
  }, []);

  return {
    currentSession,
    isLoading,
    error,
    createSession,
    updateSession,
    completeSession,
    failSession,
    retryExtraction,
    getSession,
    getActiveSessions,
    getHistory,
    getEvents,
    getAnalytics,
    cleanup,
    logEvent
  };
}