/**
 * Integration tests for extraction session management
 * 
 * Tests the complete session lifecycle without React dependencies
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    ExtractionSessionManager,
    ExtractionSession,
    ExtractedContent
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
        title: 'Integration Test Page'
    }
});

Object.defineProperty(window, 'navigator', {
    value: {
        userAgent: 'Integration Test User Agent'
    }
});

describe('Extraction Session Integration', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        localStorageMock.clear();
    });

    describe('Complete Session Lifecycle', () => {
        it('should handle complete extraction workflow', async () => {
            // 1. Create session
            const session = await ExtractionSessionManager.createSession(
                'https://example.com/test-article',
                'full_page'
            );

            expect(session.sessionId).toBeDefined();
            expect(session.status).toBe('started');
            expect(session.sourceUrl).toBe('https://example.com/test-article');

            // 2. Update to extracting
            await ExtractionSessionManager.updateSession(session.sessionId, {
                status: 'extracting'
            });

            let updatedSession = await ExtractionSessionManager.getSession(session.sessionId);
            expect(updatedSession?.status).toBe('extracting');

            // 3. Update to validating
            await ExtractionSessionManager.updateSession(session.sessionId, {
                status: 'validating'
            });

            updatedSession = await ExtractionSessionManager.getSession(session.sessionId);
            expect(updatedSession?.status).toBe('validating');

            // 4. Complete with extracted content
            const extractedContent: ExtractedContent = {
                text: 'This is a comprehensive test article with substantial content for language learning.',
                title: 'Integration Test Article',
                metadata: {
                    sourceUrl: 'https://example.com/test-article',
                    domain: 'example.com',
                    author: 'Test Author',
                    publicationDate: new Date('2024-01-15')
                },
                quality: {
                    wordCount: 200,
                    readingTime: 2,
                    suitabilityScore: 0.9
                }
            };

            await ExtractionSessionManager.completeSession(session.sessionId, extractedContent);

            const completedSession = await ExtractionSessionManager.getSession(session.sessionId);
            expect(completedSession?.status).toBe('complete');
            expect(completedSession?.extractedContent?.text).toBe(extractedContent.text);
            expect(completedSession?.endTime).toBeInstanceOf(Date);

            // 5. Verify history entry
            const history = await ExtractionSessionManager.getExtractionHistory();
            expect(history).toHaveLength(1);
            expect(history[0].status).toBe('complete');

            // 6. Verify events logged
            const events = await ExtractionSessionManager.getInteractionEvents();
            expect(events.length).toBeGreaterThan(0);
            expect(events.some(e => e.eventType === 'extraction_started')).toBe(true);
            expect(events.some(e => e.eventType === 'extraction_completed')).toBe(true);
        });

        it('should handle failure and retry workflow', async () => {
            // 1. Create session
            const session = await ExtractionSessionManager.createSession(
                'https://example.com/difficult-article'
            );

            // 2. Fail the session
            await ExtractionSessionManager.failSession(session.sessionId, 'Network timeout');

            let failedSession = await ExtractionSessionManager.getSession(session.sessionId);
            expect(failedSession?.status).toBe('failed');
            expect(failedSession?.error).toBe('Network timeout');

            // 3. Retry extraction
            const canRetry = await ExtractionSessionManager.retryExtraction(session.sessionId);
            expect(canRetry).toBe(true);

            const retriedSession = await ExtractionSessionManager.getSession(session.sessionId);
            expect(retriedSession?.status).toBe('started');
            expect(retriedSession?.retryCount).toBe(1);
            expect(retriedSession?.error).toBeUndefined();

            // 4. Fail again and retry until max attempts
            for (let i = 1; i < 3; i++) {
                await ExtractionSessionManager.failSession(session.sessionId, `Failure attempt ${i + 1}`);
                const canRetryAgain = await ExtractionSessionManager.retryExtraction(session.sessionId);
                expect(canRetryAgain).toBe(true);
            }

            // 5. Fail one more time and try to retry (should be blocked)
            await ExtractionSessionManager.failSession(session.sessionId, 'Final failure');
            const canRetryFinal = await ExtractionSessionManager.retryExtraction(session.sessionId);
            expect(canRetryFinal).toBe(false);

            const finalSession = await ExtractionSessionManager.getSession(session.sessionId);
            expect(finalSession?.retryCount).toBe(3);

            // 6. Verify retry events logged
            const events = await ExtractionSessionManager.getInteractionEvents();
            const retryEvents = events.filter(e => e.eventType === 'retry_attempted');
            expect(retryEvents.length).toBe(4); // 3 successful retries + 1 blocked retry
        });
    });

    describe('Multiple Sessions Management', () => {
        it('should manage multiple concurrent sessions', async () => {
            // Create multiple sessions
            const session1 = await ExtractionSessionManager.createSession('https://news.com/article1');
            const session2 = await ExtractionSessionManager.createSession('https://blog.com/post1');
            const session3 = await ExtractionSessionManager.createSession('https://wiki.com/page1');

            // Update sessions to different states
            await ExtractionSessionManager.updateSession(session1.sessionId, { status: 'extracting' });
            await ExtractionSessionManager.updateSession(session2.sessionId, { status: 'validating' });

            // Complete one session
            const extractedContent: ExtractedContent = {
                text: 'News article content',
                title: 'News Article',
                metadata: { sourceUrl: 'https://news.com/article1', domain: 'news.com' },
                quality: { wordCount: 300, readingTime: 2, suitabilityScore: 0.85 }
            };
            await ExtractionSessionManager.completeSession(session1.sessionId, extractedContent);

            // Fail one session
            await ExtractionSessionManager.failSession(session3.sessionId, 'Content too short');

            // Check active sessions (should only include session2)
            const activeSessions = await ExtractionSessionManager.getActiveSessions();
            expect(activeSessions).toHaveLength(1);
            expect(activeSessions[0].sessionId).toBe(session2.sessionId);

            // Check history
            const history = await ExtractionSessionManager.getExtractionHistory();
            expect(history).toHaveLength(2); // completed and failed sessions
            expect(history.some(h => h.status === 'complete')).toBe(true);
            expect(history.some(h => h.status === 'failed')).toBe(true);
        });
    });

    describe('Analytics and Reporting', () => {
        beforeEach(async () => {
            // Create test data
            const sessions = [
                { url: 'https://news.com/article1', status: 'complete' as const },
                { url: 'https://news.com/article2', status: 'complete' as const },
                { url: 'https://blog.com/post1', status: 'failed' as const, error: 'Network error' },
                { url: 'https://blog.com/post2', status: 'failed' as const, error: 'Network error' },
                { url: 'https://wiki.com/page1', status: 'failed' as const, error: 'Content too short' }
            ];

            for (const sessionData of sessions) {
                const session = await ExtractionSessionManager.createSession(sessionData.url);

                if (sessionData.status === 'complete') {
                    const content: ExtractedContent = {
                        text: 'Test content',
                        title: 'Test Title',
                        metadata: { sourceUrl: sessionData.url, domain: new URL(sessionData.url).hostname },
                        quality: { wordCount: 200, readingTime: 1, suitabilityScore: 0.8 }
                    };
                    await ExtractionSessionManager.completeSession(session.sessionId, content);
                } else {
                    await ExtractionSessionManager.failSession(session.sessionId, sessionData.error!);
                    // Add a retry for some failed sessions
                    if (sessionData.error === 'Network error') {
                        await ExtractionSessionManager.retryExtraction(session.sessionId);
                    }
                }
            }
        });

        it('should generate comprehensive analytics', async () => {
            const analytics = await ExtractionSessionManager.getAnalyticsSummary();

            expect(analytics.totalExtractions).toBe(5);
            expect(analytics.successfulExtractions).toBe(2);
            expect(analytics.failedExtractions).toBe(3);
            expect(analytics.averageRetries).toBe(0.4); // 2 retries / 5 extractions

            // Check most common errors
            expect(analytics.mostCommonErrors).toHaveLength(2);
            expect(analytics.mostCommonErrors[0]).toEqual({ error: 'Network error', count: 2 });
            expect(analytics.mostCommonErrors[1]).toEqual({ error: 'Content too short', count: 1 });

            // Check extractions by domain
            expect(analytics.extractionsByDomain).toHaveLength(3);
            expect(analytics.extractionsByDomain.find(d => d.domain === 'news.com')?.count).toBe(2);
            expect(analytics.extractionsByDomain.find(d => d.domain === 'blog.com')?.count).toBe(2);
            expect(analytics.extractionsByDomain.find(d => d.domain === 'wiki.com')?.count).toBe(1);
        });
    });

    describe('Cleanup and Maintenance', () => {
        it('should clean up expired sessions', async () => {
            // Create current session
            const currentSession = await ExtractionSessionManager.createSession('https://example.com/current');

            // Create expired session by manipulating localStorage directly
            const expiredSession = {
                sessionId: 'expired_session',
                sourceUrl: 'https://example.com/expired',
                startTime: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
                status: 'started',
                retryCount: 0,
                userAgent: 'Test',
                metadata: {
                    pageTitle: 'Expired Page',
                    domain: 'example.com',
                    extractionMethod: 'full_page'
                }
            };
            localStorage.setItem('linguaspark_extraction_expired_session', JSON.stringify(expiredSession));

            // Verify both sessions exist
            expect(await ExtractionSessionManager.getSession(currentSession.sessionId)).toBeDefined();
            expect(await ExtractionSessionManager.getSession('expired_session')).toBeDefined();

            // Run cleanup
            await ExtractionSessionManager.cleanupExpiredSessions();

            // Verify expired session is removed, current session remains
            expect(await ExtractionSessionManager.getSession(currentSession.sessionId)).toBeDefined();
            expect(await ExtractionSessionManager.getSession('expired_session')).toBeNull();

            // Verify cleanup event was logged
            const events = await ExtractionSessionManager.getInteractionEvents();
            const cleanupEvent = events.find(e => e.eventType === 'session_cleanup');
            expect(cleanupEvent).toBeDefined();
            expect(cleanupEvent?.sessionId).toBe('expired_session');
        });

        it('should handle storage errors gracefully', async () => {
            // Mock localStorage to throw an error
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = vi.fn(() => {
                throw new Error('Storage quota exceeded');
            });

            // Should throw error for session creation
            await expect(
                ExtractionSessionManager.createSession('https://example.com/test')
            ).rejects.toThrow('Failed to store extraction session');

            // Restore original method
            localStorage.setItem = originalSetItem;

            // Should work normally after restoration
            const session = await ExtractionSessionManager.createSession('https://example.com/test');
            expect(session).toBeDefined();
        });
    });

    describe('Event Logging System', () => {
        it('should log all interaction events correctly', async () => {
            const session = await ExtractionSessionManager.createSession('https://example.com/test');

            // Log various events
            await ExtractionSessionManager.logInteractionEvent(
                session.sessionId,
                'button_shown',
                'https://example.com/test',
                { contentAnalysis: { wordCount: 500, suitabilityScore: 0.8 } }
            );

            await ExtractionSessionManager.logInteractionEvent(
                session.sessionId,
                'button_clicked',
                'https://example.com/test',
                { buttonPosition: 'bottom-right' }
            );

            // Complete the session
            const content: ExtractedContent = {
                text: 'Test content',
                title: 'Test Title',
                metadata: { sourceUrl: 'https://example.com/test', domain: 'example.com' },
                quality: { wordCount: 100, readingTime: 1, suitabilityScore: 0.8 }
            };
            await ExtractionSessionManager.completeSession(session.sessionId, content);

            // Verify all events were logged
            const events = await ExtractionSessionManager.getInteractionEvents();

            expect(events.some(e => e.eventType === 'extraction_started')).toBe(true);
            expect(events.some(e => e.eventType === 'button_shown')).toBe(true);
            expect(events.some(e => e.eventType === 'button_clicked')).toBe(true);
            expect(events.some(e => e.eventType === 'extraction_completed')).toBe(true);

            // Check event metadata
            const buttonClickEvent = events.find(e => e.eventType === 'button_clicked');
            expect(buttonClickEvent?.metadata?.buttonPosition).toBe('bottom-right');

            const buttonShownEvent = events.find(e => e.eventType === 'button_shown');
            expect(buttonShownEvent?.metadata?.contentAnalysis?.wordCount).toBe(500);
        });

        it('should handle event logging errors gracefully', async () => {
            // Mock localStorage to throw an error for events
            const originalGetItem = localStorage.getItem;
            localStorage.getItem = vi.fn((key) => {
                if (key === 'linguaspark_interaction_events') {
                    throw new Error('Storage access denied');
                }
                return originalGetItem.call(localStorage, key);
            });

            // Should not throw error when logging fails
            await expect(
                ExtractionSessionManager.logInteractionEvent('test', 'button_clicked', 'https://example.com')
            ).resolves.not.toThrow();

            // Restore original method
            localStorage.getItem = originalGetItem;
        });
    });
});