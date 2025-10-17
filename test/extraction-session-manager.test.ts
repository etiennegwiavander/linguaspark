/**
 * Unit tests for ExtractionSessionManager
 * 
 * Tests session lifecycle, storage, cleanup, retry mechanisms, and analytics
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  ExtractionSessionManager, 
  ExtractionSession, 
  ExtractedContent,
  UserInteractionEvent,
  ExtractionHistory
} from '@/lib/extraction-session-manager';

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

describe('ExtractionSessionManager', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('Session Creation', () => {
    it('should create a new extraction session', async () => {
      const sourceUrl = 'https://example.com/article';
      const session = await ExtractionSessionManager.createSession(sourceUrl);

      expect(session).toBeDefined();
      expect(session.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(session.sourceUrl).toBe(sourceUrl);
      expect(session.status).toBe('started');
      expect(session.retryCount).toBe(0);
      expect(session.startTime).toBeInstanceOf(Date);
      expect(session.userAgent).toBe('Test User Agent');
      expect(session.metadata.pageTitle).toBe('Test Page Title');
      expect(session.metadata.domain).toBe('example.com');
      expect(session.metadata.extractionMethod).toBe('full_page');
    });

    it('should create session with selection method', async () => {
      const sourceUrl = 'https://example.com/article';
      const session = await ExtractionSessionManager.createSession(sourceUrl, 'selection');

      expect(session.metadata.extractionMethod).toBe('selection');
    });

    it('should store session in localStorage', async () => {
      const sourceUrl = 'https://example.com/article';
      const session = await ExtractionSessionManager.createSession(sourceUrl);

      const storedSession = await ExtractionSessionManager.getSession(session.sessionId);
      expect(storedSession).toEqual(session);
    });

    it('should log session creation event', async () => {
      const sourceUrl = 'https://example.com/article';
      const session = await ExtractionSessionManager.createSession(sourceUrl);

      const events = await ExtractionSessionManager.getInteractionEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('extraction_started');
      expect(events[0].sessionId).toBe(session.sessionId);
      expect(events[0].url).toBe(sourceUrl);
    });
  });

  describe('Session Updates', () => {
    let session: ExtractionSession;

    beforeEach(async () => {
      session = await ExtractionSessionManager.createSession('https://example.com/article');
    });

    it('should update session status', async () => {
      await ExtractionSessionManager.updateSession(session.sessionId, {
        status: 'extracting'
      });

      const updatedSession = await ExtractionSessionManager.getSession(session.sessionId);
      expect(updatedSession?.status).toBe('extracting');
    });

    it('should update session with extracted content metadata', async () => {
      const updates = {
        status: 'validating' as const,
        metadata: {
          ...session.metadata,
          contentType: 'article',
          wordCount: 500,
          language: 'en'
        }
      };

      await ExtractionSessionManager.updateSession(session.sessionId, updates);

      const updatedSession = await ExtractionSessionManager.getSession(session.sessionId);
      expect(updatedSession?.status).toBe('validating');
      expect(updatedSession?.metadata.contentType).toBe('article');
      expect(updatedSession?.metadata.wordCount).toBe(500);
      expect(updatedSession?.metadata.language).toBe('en');
    });

    it('should throw error for non-existent session', async () => {
      await expect(
        ExtractionSessionManager.updateSession('non-existent', { status: 'extracting' })
      ).rejects.toThrow('Session non-existent not found');
    });
  });

  describe('Session Completion', () => {
    let session: ExtractionSession;
    let extractedContent: ExtractedContent;

    beforeEach(async () => {
      session = await ExtractionSessionManager.createSession('https://example.com/article');
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

    it('should complete session with extracted content', async () => {
      await ExtractionSessionManager.completeSession(session.sessionId, extractedContent);

      const completedSession = await ExtractionSessionManager.getSession(session.sessionId);
      expect(completedSession?.status).toBe('complete');
      expect(completedSession?.extractedContent?.text).toBe(extractedContent.text);
      expect(completedSession?.extractedContent?.title).toBe(extractedContent.title);
      expect(completedSession?.extractedContent?.metadata.sourceUrl).toBe(extractedContent.metadata.sourceUrl);
      expect(completedSession?.extractedContent?.quality.wordCount).toBe(extractedContent.quality.wordCount);
      expect(completedSession?.endTime).toBeInstanceOf(Date);
      expect(completedSession?.metadata.wordCount).toBe(150);
    });

    it('should add completed session to history', async () => {
      await ExtractionSessionManager.completeSession(session.sessionId, extractedContent);

      const history = await ExtractionSessionManager.getExtractionHistory();
      expect(history).toHaveLength(1);
      expect(history[0].sessionId).toBe(session.sessionId);
      expect(history[0].status).toBe('complete');
      expect(history[0].url).toBe(session.sourceUrl);
    });

    it('should log completion event', async () => {
      await ExtractionSessionManager.completeSession(session.sessionId, extractedContent);

      const events = await ExtractionSessionManager.getInteractionEvents();
      const completionEvent = events.find(e => e.eventType === 'extraction_completed');
      expect(completionEvent).toBeDefined();
      expect(completionEvent?.sessionId).toBe(session.sessionId);
    });
  });

  describe('Session Failure', () => {
    let session: ExtractionSession;

    beforeEach(async () => {
      session = await ExtractionSessionManager.createSession('https://example.com/article');
    });

    it('should mark session as failed', async () => {
      const errorMessage = 'Content extraction failed';
      await ExtractionSessionManager.failSession(session.sessionId, errorMessage);

      const failedSession = await ExtractionSessionManager.getSession(session.sessionId);
      expect(failedSession?.status).toBe('failed');
      expect(failedSession?.error).toBe(errorMessage);
      expect(failedSession?.endTime).toBeInstanceOf(Date);
    });

    it('should add failed session to history', async () => {
      const errorMessage = 'Content extraction failed';
      await ExtractionSessionManager.failSession(session.sessionId, errorMessage);

      const history = await ExtractionSessionManager.getExtractionHistory();
      expect(history).toHaveLength(1);
      expect(history[0].status).toBe('failed');
      expect(history[0].error).toBe(errorMessage);
    });

    it('should log failure event', async () => {
      const errorMessage = 'Content extraction failed';
      await ExtractionSessionManager.failSession(session.sessionId, errorMessage);

      const events = await ExtractionSessionManager.getInteractionEvents();
      const failureEvent = events.find(e => e.eventType === 'extraction_failed');
      expect(failureEvent).toBeDefined();
      expect(failureEvent?.sessionId).toBe(session.sessionId);
    });
  });

  describe('Retry Mechanism', () => {
    let session: ExtractionSession;

    beforeEach(async () => {
      session = await ExtractionSessionManager.createSession('https://example.com/article');
      await ExtractionSessionManager.failSession(session.sessionId, 'Initial failure');
    });

    it('should allow retry for failed session', async () => {
      const canRetry = await ExtractionSessionManager.retryExtraction(session.sessionId);
      expect(canRetry).toBe(true);

      const retriedSession = await ExtractionSessionManager.getSession(session.sessionId);
      expect(retriedSession?.status).toBe('started');
      expect(retriedSession?.retryCount).toBe(1);
      expect(retriedSession?.error).toBeUndefined();
      expect(retriedSession?.endTime).toBeUndefined();
    });

    it('should prevent retry after max attempts', async () => {
      // Exhaust retry attempts
      await ExtractionSessionManager.retryExtraction(session.sessionId);
      await ExtractionSessionManager.failSession(session.sessionId, 'Second failure');
      await ExtractionSessionManager.retryExtraction(session.sessionId);
      await ExtractionSessionManager.failSession(session.sessionId, 'Third failure');
      await ExtractionSessionManager.retryExtraction(session.sessionId);
      await ExtractionSessionManager.failSession(session.sessionId, 'Fourth failure');

      const canRetry = await ExtractionSessionManager.retryExtraction(session.sessionId);
      expect(canRetry).toBe(false);

      const finalSession = await ExtractionSessionManager.getSession(session.sessionId);
      expect(finalSession?.retryCount).toBe(3);
    });

    it('should log retry attempts', async () => {
      await ExtractionSessionManager.retryExtraction(session.sessionId);

      const events = await ExtractionSessionManager.getInteractionEvents();
      const retryEvent = events.find(e => e.eventType === 'retry_attempted');
      expect(retryEvent).toBeDefined();
      expect(retryEvent?.sessionId).toBe(session.sessionId);
      expect(retryEvent?.metadata?.retryCount).toBe(1);
    });

    it('should log max retries exceeded', async () => {
      // Exhaust retry attempts
      for (let i = 0; i < 3; i++) {
        await ExtractionSessionManager.retryExtraction(session.sessionId);
        await ExtractionSessionManager.failSession(session.sessionId, `Failure ${i + 2}`);
      }

      await ExtractionSessionManager.retryExtraction(session.sessionId);

      const events = await ExtractionSessionManager.getInteractionEvents();
      const maxRetriesEvent = events.find(e => 
        e.eventType === 'retry_attempted' && e.metadata?.maxRetriesExceeded
      );
      expect(maxRetriesEvent).toBeDefined();
    });
  });

  describe('Active Sessions', () => {
    it('should return active sessions only', async () => {
      const session1 = await ExtractionSessionManager.createSession('https://example.com/article1');
      const session2 = await ExtractionSessionManager.createSession('https://example.com/article2');
      const session3 = await ExtractionSessionManager.createSession('https://example.com/article3');

      // Complete one session
      const extractedContent: ExtractedContent = {
        text: 'Content',
        title: 'Title',
        metadata: { sourceUrl: 'https://example.com/article2', domain: 'example.com' },
        quality: { wordCount: 100, readingTime: 1, suitabilityScore: 0.8 }
      };
      await ExtractionSessionManager.completeSession(session2.sessionId, extractedContent);

      // Fail one session
      await ExtractionSessionManager.failSession(session3.sessionId, 'Failed');

      const activeSessions = await ExtractionSessionManager.getActiveSessions();
      expect(activeSessions).toHaveLength(1);
      expect(activeSessions[0].sessionId).toBe(session1.sessionId);
    });

    it('should include extracting and validating sessions as active', async () => {
      const session1 = await ExtractionSessionManager.createSession('https://example.com/article1');
      const session2 = await ExtractionSessionManager.createSession('https://example.com/article2');

      await ExtractionSessionManager.updateSession(session1.sessionId, { status: 'extracting' });
      await ExtractionSessionManager.updateSession(session2.sessionId, { status: 'validating' });

      const activeSessions = await ExtractionSessionManager.getActiveSessions();
      expect(activeSessions).toHaveLength(2);
    });
  });

  describe('Cleanup', () => {
    it('should remove expired sessions', async () => {
      const session = await ExtractionSessionManager.createSession('https://example.com/article');
      
      // Mock an old session by directly manipulating localStorage
      const oldSession = {
        ...session,
        sessionId: 'old_session',
        startTime: new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours ago
      };
      localStorage.setItem('linguaspark_extraction_old_session', JSON.stringify(oldSession));

      await ExtractionSessionManager.cleanupExpiredSessions();

      const retrievedOldSession = await ExtractionSessionManager.getSession('old_session');
      expect(retrievedOldSession).toBeNull();

      const retrievedCurrentSession = await ExtractionSessionManager.getSession(session.sessionId);
      expect(retrievedCurrentSession).toBeDefined();
    });

    it('should log cleanup events', async () => {
      // Create an old session
      const oldSession = {
        sessionId: 'old_session',
        sourceUrl: 'https://example.com/old',
        startTime: new Date(Date.now() - 25 * 60 * 60 * 1000),
        status: 'started' as const,
        retryCount: 0,
        userAgent: 'Test',
        metadata: {
          pageTitle: 'Old Page',
          domain: 'example.com',
          extractionMethod: 'full_page' as const
        }
      };
      localStorage.setItem('linguaspark_extraction_old_session', JSON.stringify(oldSession));

      await ExtractionSessionManager.cleanupExpiredSessions();

      const events = await ExtractionSessionManager.getInteractionEvents();
      const cleanupEvent = events.find(e => e.eventType === 'session_cleanup');
      expect(cleanupEvent).toBeDefined();
      expect(cleanupEvent?.sessionId).toBe('old_session');
      expect(cleanupEvent?.metadata?.reason).toBe('expired');
    });

    it('should trim history to max entries', async () => {
      // Create many history entries
      const history: ExtractionHistory[] = [];
      for (let i = 0; i < 60; i++) {
        history.push({
          sessionId: `session_${i}`,
          url: `https://example.com/article${i}`,
          timestamp: new Date(Date.now() - i * 1000),
          status: 'complete'
        });
      }
      localStorage.setItem('linguaspark_extraction_history', JSON.stringify(history));

      await ExtractionSessionManager.cleanupExpiredSessions();

      const trimmedHistory = await ExtractionSessionManager.getExtractionHistory();
      expect(trimmedHistory.length).toBeLessThanOrEqual(50);
    });

    it('should trim events to max entries', async () => {
      // Create many events
      const events: UserInteractionEvent[] = [];
      for (let i = 0; i < 120; i++) {
        events.push({
          eventId: `event_${i}`,
          sessionId: `session_${i}`,
          eventType: 'button_clicked',
          timestamp: new Date(Date.now() - i * 1000),
          url: `https://example.com/article${i}`
        });
      }
      localStorage.setItem('linguaspark_interaction_events', JSON.stringify(events));

      await ExtractionSessionManager.cleanupExpiredSessions();

      const trimmedEvents = await ExtractionSessionManager.getInteractionEvents();
      expect(trimmedEvents.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Analytics', () => {
    beforeEach(async () => {
      // Create test data
      const history: ExtractionHistory[] = [
        {
          sessionId: 'session1',
          url: 'https://news.com/article1',
          timestamp: new Date(),
          status: 'complete'
        },
        {
          sessionId: 'session2',
          url: 'https://news.com/article2',
          timestamp: new Date(),
          status: 'complete'
        },
        {
          sessionId: 'session3',
          url: 'https://blog.com/post1',
          timestamp: new Date(),
          status: 'failed',
          error: 'Network error'
        },
        {
          sessionId: 'session4',
          url: 'https://blog.com/post2',
          timestamp: new Date(),
          status: 'failed',
          error: 'Network error'
        },
        {
          sessionId: 'session5',
          url: 'https://wiki.com/page1',
          timestamp: new Date(),
          status: 'failed',
          error: 'Content too short'
        }
      ];
      localStorage.setItem('linguaspark_extraction_history', JSON.stringify(history));

      const events: UserInteractionEvent[] = [
        {
          eventId: 'event1',
          sessionId: 'session3',
          eventType: 'retry_attempted',
          timestamp: new Date(),
          url: 'https://blog.com/post1'
        },
        {
          eventId: 'event2',
          sessionId: 'session4',
          eventType: 'retry_attempted',
          timestamp: new Date(),
          url: 'https://blog.com/post2'
        }
      ];
      localStorage.setItem('linguaspark_interaction_events', JSON.stringify(events));
    });

    it('should calculate analytics summary', async () => {
      const analytics = await ExtractionSessionManager.getAnalyticsSummary();

      expect(analytics.totalExtractions).toBe(5);
      expect(analytics.successfulExtractions).toBe(2);
      expect(analytics.failedExtractions).toBe(3);
      expect(analytics.averageRetries).toBe(0.4); // 2 retries / 5 extractions

      expect(analytics.mostCommonErrors).toHaveLength(2);
      expect(analytics.mostCommonErrors[0]).toEqual({ error: 'Network error', count: 2 });
      expect(analytics.mostCommonErrors[1]).toEqual({ error: 'Content too short', count: 1 });

      expect(analytics.extractionsByDomain).toHaveLength(3);
      expect(analytics.extractionsByDomain[0]).toEqual({ domain: 'news.com', count: 2 });
      expect(analytics.extractionsByDomain[1]).toEqual({ domain: 'blog.com', count: 2 });
      expect(analytics.extractionsByDomain[2]).toEqual({ domain: 'wiki.com', count: 1 });
    });
  });

  describe('Event Logging', () => {
    it('should log interaction events', async () => {
      const sessionId = 'test_session';
      const eventType = 'button_clicked';
      const url = 'https://example.com/article';
      const metadata = { buttonPosition: 'bottom-right' };

      await ExtractionSessionManager.logInteractionEvent(sessionId, eventType, url, metadata);

      const events = await ExtractionSessionManager.getInteractionEvents();
      expect(events).toHaveLength(1);
      expect(events[0].sessionId).toBe(sessionId);
      expect(events[0].eventType).toBe(eventType);
      expect(events[0].url).toBe(url);
      expect(events[0].metadata).toEqual(metadata);
      expect(events[0].eventId).toMatch(/^event_\d+_[a-z0-9]+$/);
    });

    it('should handle logging errors gracefully', async () => {
      // Mock localStorage to throw an error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw
      await expect(
        ExtractionSessionManager.logInteractionEvent('session', 'button_clicked', 'https://example.com')
      ).resolves.not.toThrow();

      // Restore original method
      localStorage.setItem = originalSetItem;
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      // Mock localStorage to throw an error
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('Storage access denied');
      });

      const session = await ExtractionSessionManager.getSession('non-existent');
      expect(session).toBeNull();

      // Restore original method
      localStorage.getItem = originalGetItem;
    });

    it('should handle invalid JSON in localStorage', async () => {
      localStorage.setItem('linguaspark_extraction_test', 'invalid json');

      const session = await ExtractionSessionManager.getSession('test');
      expect(session).toBeNull();
    });

    it('should handle storage quota exceeded', async () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });

      await expect(
        ExtractionSessionManager.createSession('https://example.com')
      ).rejects.toThrow('Failed to store extraction session');

      localStorage.setItem = originalSetItem;
    });
  });
});