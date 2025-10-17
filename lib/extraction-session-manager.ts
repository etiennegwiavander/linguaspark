/**
 * Extraction Session Manager
 * 
 * Manages extraction sessions, storage, cleanup, and user interaction logging
 * for the extract-from-page-button feature.
 * 
 * Requirements: 6.4 (session-only storage), 5.4 (retry mechanisms)
 */

export interface ExtractionSession {
  sessionId: string;
  sourceUrl: string;
  startTime: Date;
  endTime?: Date;
  status: 'started' | 'extracting' | 'validating' | 'complete' | 'failed';
  extractedContent?: ExtractedContent;
  error?: string;
  retryCount: number;
  userAgent: string;
  metadata: SessionMetadata;
}

export interface SessionMetadata {
  pageTitle: string;
  domain: string;
  contentType?: string;
  wordCount?: number;
  language?: string;
  extractionMethod: 'full_page' | 'selection';
}

export interface ExtractedContent {
  text: string;
  title: string;
  metadata: {
    author?: string;
    publicationDate?: Date;
    sourceUrl: string;
    domain: string;
    description?: string;
  };
  quality: {
    wordCount: number;
    readingTime: number;
    suitabilityScore: number;
  };
}

export interface UserInteractionEvent {
  eventId: string;
  sessionId: string;
  eventType: 'button_shown' | 'button_clicked' | 'extraction_started' | 'extraction_completed' | 'extraction_failed' | 'retry_attempted' | 'lesson_opened' | 'session_cleanup';
  timestamp: Date;
  url: string;
  metadata?: Record<string, any>;
}

export interface ExtractionHistory {
  sessionId: string;
  url: string;
  timestamp: Date;
  status: ExtractionSession['status'];
  error?: string;
}

export class ExtractionSessionManager {
  private static readonly STORAGE_KEY_PREFIX = 'linguaspark_extraction_';
  private static readonly HISTORY_KEY = 'linguaspark_extraction_history';
  private static readonly EVENTS_KEY = 'linguaspark_interaction_events';
  private static readonly MAX_HISTORY_ENTRIES = 50;
  private static readonly MAX_EVENT_ENTRIES = 100;
  private static readonly SESSION_TIMEOUT_HOURS = 24;
  private static readonly MAX_RETRY_ATTEMPTS = 3;

  /**
   * Creates a new extraction session
   */
  static async createSession(sourceUrl: string, extractionMethod: 'full_page' | 'selection' = 'full_page'): Promise<ExtractionSession> {
    const sessionId = this.generateSessionId();
    const session: ExtractionSession = {
      sessionId,
      sourceUrl,
      startTime: new Date(),
      status: 'started',
      retryCount: 0,
      userAgent: navigator.userAgent,
      metadata: {
        pageTitle: document.title,
        domain: new URL(sourceUrl).hostname,
        extractionMethod
      }
    };

    await this.storeSession(session);
    await this.logInteractionEvent(sessionId, 'extraction_started', sourceUrl);
    
    return session;
  }

  /**
   * Updates an existing session
   */
  static async updateSession(sessionId: string, updates: Partial<ExtractionSession>): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const updatedSession = { ...session, ...updates };
    await this.storeSession(updatedSession);

    // Log status changes
    if (updates.status) {
      const eventType = this.getEventTypeFromStatus(updates.status);
      if (eventType) {
        await this.logInteractionEvent(sessionId, eventType, session.sourceUrl, {
          status: updates.status,
          error: updates.error
        });
      }
    }
  }

  /**
   * Completes a session with extracted content
   */
  static async completeSession(sessionId: string, extractedContent: ExtractedContent): Promise<void> {
    await this.updateSession(sessionId, {
      status: 'complete',
      endTime: new Date(),
      extractedContent,
      metadata: {
        ...await this.getSessionMetadata(sessionId),
        contentType: 'article', // Could be enhanced with actual detection
        wordCount: extractedContent.quality.wordCount,
        language: 'en' // Could be enhanced with actual detection
      }
    });

    await this.addToHistory(sessionId, 'complete');
  }

  /**
   * Marks a session as failed
   */
  static async failSession(sessionId: string, error: string): Promise<void> {
    await this.updateSession(sessionId, {
      status: 'failed',
      endTime: new Date(),
      error
    });

    await this.addToHistory(sessionId, 'failed', error);
  }

  /**
   * Retries a failed extraction
   */
  static async retryExtraction(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (session.retryCount >= this.MAX_RETRY_ATTEMPTS) {
      await this.logInteractionEvent(sessionId, 'retry_attempted', session.sourceUrl, {
        retryCount: session.retryCount,
        maxRetriesExceeded: true
      });
      return false;
    }

    await this.updateSession(sessionId, {
      status: 'started',
      retryCount: session.retryCount + 1,
      error: undefined,
      endTime: undefined
    });

    await this.logInteractionEvent(sessionId, 'retry_attempted', session.sourceUrl, {
      retryCount: session.retryCount + 1
    });

    return true;
  }

  /**
   * Gets a session by ID
   */
  static async getSession(sessionId: string): Promise<ExtractionSession | null> {
    try {
      const stored = localStorage.getItem(this.getSessionKey(sessionId));
      if (!stored) return null;

      const session = JSON.parse(stored) as ExtractionSession;
      // Convert date strings back to Date objects
      session.startTime = new Date(session.startTime);
      if (session.endTime) {
        session.endTime = new Date(session.endTime);
      }

      return session;
    } catch (error) {
      console.error('Error retrieving session:', error);
      return null;
    }
  }

  /**
   * Gets all active sessions (not completed or failed)
   */
  static async getActiveSessions(): Promise<ExtractionSession[]> {
    const sessions: ExtractionSession[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.STORAGE_KEY_PREFIX)) {
        const session = await this.getSession(key.replace(this.STORAGE_KEY_PREFIX, ''));
        if (session && (session.status === 'started' || session.status === 'extracting' || session.status === 'validating')) {
          sessions.push(session);
        }
      }
    }

    return sessions;
  }

  /**
   * Gets extraction history
   */
  static async getExtractionHistory(): Promise<ExtractionHistory[]> {
    try {
      const stored = localStorage.getItem(this.HISTORY_KEY);
      if (!stored) return [];

      const history = JSON.parse(stored) as ExtractionHistory[];
      return history.map(entry => ({
        ...entry,
        timestamp: new Date(entry.timestamp)
      }));
    } catch (error) {
      console.error('Error retrieving extraction history:', error);
      return [];
    }
  }

  /**
   * Gets user interaction events for analytics
   */
  static async getInteractionEvents(): Promise<UserInteractionEvent[]> {
    try {
      const stored = localStorage.getItem(this.EVENTS_KEY);
      if (!stored) return [];

      const events = JSON.parse(stored) as UserInteractionEvent[];
      return events.map(event => ({
        ...event,
        timestamp: new Date(event.timestamp)
      }));
    } catch (error) {
      console.error('Error retrieving interaction events:', error);
      return [];
    }
  }

  /**
   * Cleans up expired sessions and old data
   */
  static async cleanupExpiredSessions(): Promise<void> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - this.SESSION_TIMEOUT_HOURS);

    // Clean up expired sessions
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.STORAGE_KEY_PREFIX)) {
        const sessionId = key.replace(this.STORAGE_KEY_PREFIX, '');
        const session = await this.getSession(sessionId);
        
        if (session && session.startTime < cutoffTime) {
          keysToRemove.push(key);
          await this.logInteractionEvent(session.sessionId, 'session_cleanup', session.sourceUrl, {
            reason: 'expired',
            sessionAge: Date.now() - session.startTime.getTime()
          });
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Clean up old history entries
    await this.trimHistory();
    await this.trimEvents();
  }

  /**
   * Logs user interaction events
   */
  static async logInteractionEvent(
    sessionId: string, 
    eventType: UserInteractionEvent['eventType'], 
    url: string, 
    metadata?: Record<string, any>
  ): Promise<void> {
    const event: UserInteractionEvent = {
      eventId: this.generateEventId(),
      sessionId,
      eventType,
      timestamp: new Date(),
      url,
      metadata
    };

    try {
      const events = await this.getInteractionEvents();
      events.push(event);
      
      // Keep only recent events
      const trimmedEvents = events
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, this.MAX_EVENT_ENTRIES);

      localStorage.setItem(this.EVENTS_KEY, JSON.stringify(trimmedEvents));
    } catch (error) {
      console.error('Error logging interaction event:', error);
    }
  }

  /**
   * Gets analytics summary
   */
  static async getAnalyticsSummary(): Promise<{
    totalExtractions: number;
    successfulExtractions: number;
    failedExtractions: number;
    averageRetries: number;
    mostCommonErrors: Array<{ error: string; count: number }>;
    extractionsByDomain: Array<{ domain: string; count: number }>;
  }> {
    const history = await this.getExtractionHistory();
    const events = await this.getInteractionEvents();

    const totalExtractions = history.length;
    const successfulExtractions = history.filter(h => h.status === 'complete').length;
    const failedExtractions = history.filter(h => h.status === 'failed').length;

    // Calculate average retries
    const retryEvents = events.filter(e => e.eventType === 'retry_attempted');
    const averageRetries = retryEvents.length / Math.max(totalExtractions, 1);

    // Most common errors
    const errorCounts = new Map<string, number>();
    history.forEach(h => {
      if (h.error) {
        errorCounts.set(h.error, (errorCounts.get(h.error) || 0) + 1);
      }
    });
    const mostCommonErrors = Array.from(errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Extractions by domain
    const domainCounts = new Map<string, number>();
    history.forEach(h => {
      try {
        const domain = new URL(h.url).hostname;
        domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
      } catch (error) {
        // Invalid URL, skip
      }
    });
    const extractionsByDomain = Array.from(domainCounts.entries())
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalExtractions,
      successfulExtractions,
      failedExtractions,
      averageRetries,
      mostCommonErrors,
      extractionsByDomain
    };
  }

  // Private helper methods

  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static getSessionKey(sessionId: string): string {
    return `${this.STORAGE_KEY_PREFIX}${sessionId}`;
  }

  private static async storeSession(session: ExtractionSession): Promise<void> {
    try {
      localStorage.setItem(this.getSessionKey(session.sessionId), JSON.stringify(session));
    } catch (error) {
      console.error('Error storing session:', error);
      throw new Error('Failed to store extraction session');
    }
  }

  private static async getSessionMetadata(sessionId: string): Promise<SessionMetadata> {
    const session = await this.getSession(sessionId);
    return session?.metadata || {
      pageTitle: '',
      domain: '',
      extractionMethod: 'full_page'
    };
  }

  private static getEventTypeFromStatus(status: ExtractionSession['status']): UserInteractionEvent['eventType'] | null {
    switch (status) {
      case 'complete':
        return 'extraction_completed';
      case 'failed':
        return 'extraction_failed';
      default:
        return null;
    }
  }

  private static async addToHistory(sessionId: string, status: ExtractionSession['status'], error?: string): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) return;

      const history = await this.getExtractionHistory();
      const entry: ExtractionHistory = {
        sessionId,
        url: session.sourceUrl,
        timestamp: new Date(),
        status,
        error
      };

      history.push(entry);
      
      // Keep only recent entries
      const trimmedHistory = history
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, this.MAX_HISTORY_ENTRIES);

      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Error adding to history:', error);
    }
  }

  private static async trimHistory(): Promise<void> {
    try {
      const history = await this.getExtractionHistory();
      const trimmedHistory = history
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, this.MAX_HISTORY_ENTRIES);

      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Error trimming history:', error);
    }
  }

  private static async trimEvents(): Promise<void> {
    try {
      const events = await this.getInteractionEvents();
      const trimmedEvents = events
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, this.MAX_EVENT_ENTRIES);

      localStorage.setItem(this.EVENTS_KEY, JSON.stringify(trimmedEvents));
    } catch (error) {
      console.error('Error trimming events:', error);
    }
  }
}