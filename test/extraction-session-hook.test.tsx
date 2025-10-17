/**
 * Integration tests for useExtractionSession hook
 * 
 * Tests React integration, state management, and error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useExtractionSession } from '@/hooks/use-extraction-session';
import { ExtractedContent } from '@/lib/extraction-session-manager';

// Setup DOM environment
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
});

global.window = dom.window as any;
global.document = dom.window.document;
global.navigator = { userAgent: 'Test User Agent' } as any;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock document and navigator
Object.defineProperty(window, 'document', {
  value: {
    title: 'Test Page Title'
  }
});

Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Test User Agent'
  }
});

describe('useExtractionSession', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('Session Creation', () => {
    it('should create a new session', async () => {
      const { result } = renderHook(() => useExtractionSession());

      let sessionId: string;
      await act(async () => {
        sessionId = await result.current.createSession('https://example.com/article');
      });

      expect(sessionId!).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(result.current.currentSession).toBeDefined();
      expect(result.current.currentSession?.sessionId).toBe(sessionId!);
      expect(result.current.currentSession?.sourceUrl).toBe('https://example.com/article');
      expect(result.current.currentSession?.status).toBe('started');
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle creation errors', async () => {
      // Mock localStorage to throw an error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      const { result } = renderHook(() => useExtractionSession());

      await act(async () => {
        try {
          await result.current.createSession('https://example.com/article');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Failed to store extraction session');
      expect(result.current.currentSession).toBeNull();
      expect(result.current.isLoading).toBe(false);

      // Restore original method
      localStorage.setItem = originalSetItem;
    });

    it('should set loading state during creation', async () => {
      const { result } = renderHook(() => useExtractionSession());

      let createPromise: Promise<string>;
      act(() => {
        createPromise = result.current.createSession('https://example.com/article');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        await createPromise!;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Session Updates', () => {
    let sessionId: string;

    beforeEach(async () => {
      const { result } = renderHook(() => useExtractionSession());
      await act(async () => {
        sessionId = await result.current.createSession('https://example.com/article');
      });
    });

    it('should update session status', async () => {
      const { result } = renderHook(() => useExtractionSession());

      await act(async () => {
        await result.current.updateSession(sessionId, { status: 'extracting' });
      });

      expect(result.current.currentSession?.status).toBe('extracting');
      expect(result.current.error).toBeNull();
    });

    it('should update current session when it matches', async () => {
      const { result } = renderHook(() => useExtractionSession());

      // Set current session
      await act(async () => {
        await result.current.createSession('https://example.com/article');
      });

      const currentSessionId = result.current.currentSession!.sessionId;

      await act(async () => {
        await result.current.updateSession(currentSessionId, { 
          status: 'validating',
          metadata: {
            ...result.current.currentSession!.metadata,
            wordCount: 500
          }
        });
      });

      expect(result.current.currentSession?.status).toBe('validating');
      expect(result.current.currentSession?.metadata.wordCount).toBe(500);
    });

    it('should handle update errors', async () => {
      const { result } = renderHook(() => useExtractionSession());

      await act(async () => {
        try {
          await result.current.updateSession('non-existent', { status: 'extracting' });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Session non-existent not found');
    });
  });

  describe('Session Completion', () => {
    let sessionId: string;
    let extractedContent: ExtractedContent;

    beforeEach(async () => {
      const { result } = renderHook(() => useExtractionSession());
      await act(async () => {
        sessionId = await result.current.createSession('https://example.com/article');
      });

      extractedContent = {
        text: 'This is the extracted content from the webpage.',
        title: 'Test Article',
        metadata: {
          sourceUrl: 'https://example.com/article',
          domain: 'example.com',
          author: 'Test Author',
          publicationDate: new Date('2024-01-01')
        },
        quality: {
          wordCount: 150,
          readingTime: 1,
          suitabilityScore: 0.8
        }
      };
    });

    it('should complete session successfully', async () => {
      const { result } = renderHook(() => useExtractionSession());

      await act(async () => {
        await result.current.completeSession(sessionId, extractedContent);
      });

      expect(result.current.currentSession?.status).toBe('complete');
      expect(result.current.currentSession?.extractedContent).toEqual(extractedContent);
      expect(result.current.error).toBeNull();
    });

    it('should update current session on completion', async () => {
      const { result } = renderHook(() => useExtractionSession());

      // Set current session
      await act(async () => {
        await result.current.createSession('https://example.com/article');
      });

      const currentSessionId = result.current.currentSession!.sessionId;

      await act(async () => {
        await result.current.completeSession(currentSessionId, extractedContent);
      });

      expect(result.current.currentSession?.status).toBe('complete');
      expect(result.current.currentSession?.extractedContent).toEqual(extractedContent);
      expect(result.current.currentSession?.endTime).toBeInstanceOf(Date);
    });
  });

  describe('Session Failure', () => {
    let sessionId: string;

    beforeEach(async () => {
      const { result } = renderHook(() => useExtractionSession());
      await act(async () => {
        sessionId = await result.current.createSession('https://example.com/article');
      });
    });

    it('should fail session with error message', async () => {
      const { result } = renderHook(() => useExtractionSession());
      const errorMessage = 'Content extraction failed';

      await act(async () => {
        await result.current.failSession(sessionId, errorMessage);
      });

      expect(result.current.currentSession?.status).toBe('failed');
      expect(result.current.currentSession?.error).toBe(errorMessage);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Retry Mechanism', () => {
    let sessionId: string;

    beforeEach(async () => {
      const { result } = renderHook(() => useExtractionSession());
      await act(async () => {
        sessionId = await result.current.createSession('https://example.com/article');
        await result.current.failSession(sessionId, 'Initial failure');
      });
    });

    it('should allow retry for failed session', async () => {
      const { result } = renderHook(() => useExtractionSession());

      let canRetry: boolean;
      await act(async () => {
        canRetry = await result.current.retryExtraction(sessionId);
      });

      expect(canRetry!).toBe(true);
      expect(result.current.currentSession?.status).toBe('started');
      expect(result.current.currentSession?.retryCount).toBe(1);
      expect(result.current.currentSession?.error).toBeUndefined();
    });

    it('should prevent retry after max attempts', async () => {
      const { result } = renderHook(() => useExtractionSession());

      // Exhaust retry attempts
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          await result.current.retryExtraction(sessionId);
          await result.current.failSession(sessionId, `Failure ${i + 2}`);
        });
      }

      let canRetry: boolean;
      await act(async () => {
        canRetry = await result.current.retryExtraction(sessionId);
      });

      expect(canRetry!).toBe(false);
      expect(result.current.currentSession?.retryCount).toBe(3);
    });
  });

  describe('Data Retrieval', () => {
    beforeEach(async () => {
      // Create some test sessions
      const { result } = renderHook(() => useExtractionSession());
      
      await act(async () => {
        const session1Id = await result.current.createSession('https://example.com/article1');
        const session2Id = await result.current.createSession('https://example.com/article2');
        
        const extractedContent: ExtractedContent = {
          text: 'Content',
          title: 'Title',
          metadata: { sourceUrl: 'https://example.com/article1', domain: 'example.com' },
          quality: { wordCount: 100, readingTime: 1, suitabilityScore: 0.8 }
        };
        
        await result.current.completeSession(session1Id, extractedContent);
        await result.current.failSession(session2Id, 'Test error');
      });
    });

    it('should get active sessions', async () => {
      const { result } = renderHook(() => useExtractionSession());

      let activeSessions: any[];
      await act(async () => {
        activeSessions = await result.current.getActiveSessions();
      });

      expect(activeSessions!).toHaveLength(0); // Both sessions are completed/failed
      expect(result.current.error).toBeNull();
    });

    it('should get extraction history', async () => {
      const { result } = renderHook(() => useExtractionSession());

      let history: any[];
      await act(async () => {
        history = await result.current.getHistory();
      });

      expect(history!).toHaveLength(2);
      expect(history![0].status).toBe('complete');
      expect(history![1].status).toBe('failed');
      expect(result.current.error).toBeNull();
    });

    it('should get interaction events', async () => {
      const { result } = renderHook(() => useExtractionSession());

      let events: any[];
      await act(async () => {
        events = await result.current.getEvents();
      });

      expect(events!.length).toBeGreaterThan(0);
      expect(events!.some((e: any) => e.eventType === 'extraction_started')).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should get analytics summary', async () => {
      const { result } = renderHook(() => useExtractionSession());

      let analytics: any;
      await act(async () => {
        analytics = await result.current.getAnalytics();
      });

      expect(analytics!).toBeDefined();
      expect(analytics!.totalExtractions).toBe(2);
      expect(analytics!.successfulExtractions).toBe(1);
      expect(analytics!.failedExtractions).toBe(1);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Cleanup', () => {
    it('should perform cleanup on mount', async () => {
      // Create an old session
      const oldSession = {
        sessionId: 'old_session',
        sourceUrl: 'https://example.com/old',
        startTime: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
        status: 'started',
        retryCount: 0,
        userAgent: 'Test',
        metadata: {
          pageTitle: 'Old Page',
          domain: 'example.com',
          extractionMethod: 'full_page'
        }
      };
      localStorage.setItem('linguaspark_extraction_old_session', JSON.stringify(oldSession));

      // Mount the hook
      renderHook(() => useExtractionSession());

      // Wait for cleanup to complete
      await waitFor(() => {
        const retrievedSession = localStorage.getItem('linguaspark_extraction_old_session');
        expect(retrievedSession).toBeNull();
      });
    });

    it('should manually trigger cleanup', async () => {
      const { result } = renderHook(() => useExtractionSession());

      await act(async () => {
        await result.current.cleanup();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Event Logging', () => {
    it('should log interaction events', async () => {
      const { result } = renderHook(() => useExtractionSession());

      await act(async () => {
        await result.current.logEvent('test_session', 'button_clicked', 'https://example.com', {
          buttonPosition: 'bottom-right'
        });
      });

      // Should not throw or set error (logging failures are silent)
      expect(result.current.error).toBeNull();
    });

    it('should handle logging errors gracefully', async () => {
      const { result } = renderHook(() => useExtractionSession());

      // Mock localStorage to throw an error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      await act(async () => {
        await result.current.logEvent('test_session', 'button_clicked', 'https://example.com');
      });

      // Should not set error (logging failures are silent)
      expect(result.current.error).toBeNull();

      // Restore original method
      localStorage.setItem = originalSetItem;
    });
  });

  describe('Error Handling', () => {
    it('should handle retrieval errors gracefully', async () => {
      const { result } = renderHook(() => useExtractionSession());

      // Mock localStorage to throw an error
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('Storage access denied');
      });

      let session: any;
      await act(async () => {
        session = await result.current.getSession('test');
      });

      expect(session!).toBeNull();
      expect(result.current.error).toBe('Failed to get session');

      // Restore original method
      localStorage.getItem = originalGetItem;
    });

    it('should clear error on successful operations', async () => {
      const { result } = renderHook(() => useExtractionSession());

      // First, cause an error
      await act(async () => {
        try {
          await result.current.updateSession('non-existent', { status: 'extracting' });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Session non-existent not found');

      // Then, perform a successful operation
      await act(async () => {
        await result.current.createSession('https://example.com/article');
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Loading States', () => {
    it('should manage loading state correctly', async () => {
      const { result } = renderHook(() => useExtractionSession());

      expect(result.current.isLoading).toBe(false);

      let createPromise: Promise<string>;
      act(() => {
        createPromise = result.current.createSession('https://example.com/article');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        await createPromise!;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should reset loading state on errors', async () => {
      const { result } = renderHook(() => useExtractionSession());

      // Mock localStorage to throw an error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      await act(async () => {
        try {
          await result.current.createSession('https://example.com/article');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.isLoading).toBe(false);

      // Restore original method
      localStorage.setItem = originalSetItem;
    });
  });
});