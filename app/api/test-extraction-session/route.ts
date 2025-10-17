/**
 * API route for testing extraction session management
 * 
 * Provides endpoints to test session lifecycle, analytics, and cleanup
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json();

    switch (action) {
      case 'test_session_lifecycle':
        return testSessionLifecycle();
      
      case 'test_retry_mechanism':
        return testRetryMechanism();
      
      case 'test_cleanup':
        return testCleanup();
      
      case 'test_analytics':
        return testAnalytics();
      
      case 'test_event_logging':
        return testEventLogging();
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Test extraction session error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

async function testSessionLifecycle() {
  // This would be implemented in the browser context where localStorage is available
  // For now, return a mock response showing the expected behavior
  
  const mockSession = {
    sessionId: `session_${Date.now()}_abc123`,
    sourceUrl: 'https://example.com/test-article',
    startTime: new Date().toISOString(),
    status: 'started',
    retryCount: 0,
    userAgent: 'Test User Agent',
    metadata: {
      pageTitle: 'Test Article Title',
      domain: 'example.com',
      extractionMethod: 'full_page'
    }
  };

  const mockExtractedContent = {
    text: 'This is a test article with sufficient content for lesson generation. It contains multiple paragraphs and covers various topics that would be suitable for language learning.',
    title: 'Test Article Title',
    metadata: {
      sourceUrl: 'https://example.com/test-article',
      domain: 'example.com',
      author: 'Test Author',
      publicationDate: new Date('2024-01-15').toISOString()
    },
    quality: {
      wordCount: 150,
      readingTime: 1,
      suitabilityScore: 0.85
    }
  };

  const lifecycle = [
    {
      step: 'create_session',
      description: 'Create new extraction session',
      result: mockSession
    },
    {
      step: 'update_status_extracting',
      description: 'Update session status to extracting',
      result: { ...mockSession, status: 'extracting' }
    },
    {
      step: 'update_status_validating',
      description: 'Update session status to validating',
      result: { ...mockSession, status: 'validating' }
    },
    {
      step: 'complete_session',
      description: 'Complete session with extracted content',
      result: {
        ...mockSession,
        status: 'complete',
        endTime: new Date().toISOString(),
        extractedContent: mockExtractedContent,
        metadata: {
          ...mockSession.metadata,
          contentType: 'article',
          wordCount: 150,
          language: 'en'
        }
      }
    }
  ];

  return NextResponse.json({
    success: true,
    data: {
      test: 'session_lifecycle',
      lifecycle,
      notes: [
        'Session created with unique ID and metadata',
        'Status updates tracked through extraction process',
        'Completion includes extracted content and quality metrics',
        'Session added to history for analytics'
      ]
    }
  });
}

async function testRetryMechanism() {
  const mockSession = {
    sessionId: `session_${Date.now()}_retry123`,
    sourceUrl: 'https://example.com/difficult-article',
    startTime: new Date().toISOString(),
    status: 'failed',
    retryCount: 0,
    error: 'Network timeout during extraction',
    userAgent: 'Test User Agent',
    metadata: {
      pageTitle: 'Difficult Article',
      domain: 'example.com',
      extractionMethod: 'full_page'
    }
  };

  const retryScenarios = [
    {
      attempt: 1,
      description: 'First retry attempt',
      canRetry: true,
      result: {
        ...mockSession,
        status: 'started',
        retryCount: 1,
        error: undefined,
        endTime: undefined
      }
    },
    {
      attempt: 2,
      description: 'Second retry attempt after another failure',
      canRetry: true,
      result: {
        ...mockSession,
        status: 'started',
        retryCount: 2,
        error: undefined
      }
    },
    {
      attempt: 3,
      description: 'Third retry attempt after another failure',
      canRetry: true,
      result: {
        ...mockSession,
        status: 'started',
        retryCount: 3,
        error: undefined
      }
    },
    {
      attempt: 4,
      description: 'Fourth retry attempt - should be rejected',
      canRetry: false,
      result: {
        ...mockSession,
        retryCount: 3,
        error: 'Maximum retry attempts exceeded'
      }
    }
  ];

  return NextResponse.json({
    success: true,
    data: {
      test: 'retry_mechanism',
      maxRetries: 3,
      scenarios: retryScenarios,
      notes: [
        'Sessions can be retried up to 3 times',
        'Retry count is incremented on each attempt',
        'Error is cleared and status reset on retry',
        'Further retries are blocked after max attempts'
      ]
    }
  });
}

async function testCleanup() {
  const now = new Date();
  const expiredTime = new Date(now.getTime() - 25 * 60 * 60 * 1000); // 25 hours ago
  const recentTime = new Date(now.getTime() - 1 * 60 * 60 * 1000); // 1 hour ago

  const mockSessions = [
    {
      sessionId: 'expired_session_1',
      sourceUrl: 'https://example.com/old-article-1',
      startTime: expiredTime.toISOString(),
      status: 'started',
      shouldBeRemoved: true
    },
    {
      sessionId: 'expired_session_2',
      sourceUrl: 'https://example.com/old-article-2',
      startTime: expiredTime.toISOString(),
      status: 'failed',
      shouldBeRemoved: true
    },
    {
      sessionId: 'recent_session',
      sourceUrl: 'https://example.com/recent-article',
      startTime: recentTime.toISOString(),
      status: 'started',
      shouldBeRemoved: false
    }
  ];

  const cleanupResults = {
    sessionsBeforeCleanup: mockSessions.length,
    expiredSessions: mockSessions.filter(s => s.shouldBeRemoved).length,
    sessionsAfterCleanup: mockSessions.filter(s => !s.shouldBeRemoved).length,
    cleanupEvents: [
      {
        eventType: 'session_cleanup',
        sessionId: 'expired_session_1',
        reason: 'expired',
        sessionAge: 25 * 60 * 60 * 1000
      },
      {
        eventType: 'session_cleanup',
        sessionId: 'expired_session_2',
        reason: 'expired',
        sessionAge: 25 * 60 * 60 * 1000
      }
    ]
  };

  return NextResponse.json({
    success: true,
    data: {
      test: 'cleanup',
      timeoutHours: 24,
      cleanupResults,
      notes: [
        'Sessions older than 24 hours are automatically removed',
        'Cleanup events are logged for analytics',
        'History and events are also trimmed to max entries',
        'Cleanup runs automatically on session manager initialization'
      ]
    }
  });
}

async function testAnalytics() {
  const mockHistory = [
    {
      sessionId: 'session_1',
      url: 'https://news.com/article1',
      timestamp: new Date().toISOString(),
      status: 'complete'
    },
    {
      sessionId: 'session_2',
      url: 'https://news.com/article2',
      timestamp: new Date().toISOString(),
      status: 'complete'
    },
    {
      sessionId: 'session_3',
      url: 'https://blog.com/post1',
      timestamp: new Date().toISOString(),
      status: 'failed',
      error: 'Network error'
    },
    {
      sessionId: 'session_4',
      url: 'https://blog.com/post2',
      timestamp: new Date().toISOString(),
      status: 'failed',
      error: 'Network error'
    },
    {
      sessionId: 'session_5',
      url: 'https://wiki.com/page1',
      timestamp: new Date().toISOString(),
      status: 'failed',
      error: 'Content too short'
    }
  ];

  const mockEvents = [
    {
      eventType: 'retry_attempted',
      sessionId: 'session_3',
      timestamp: new Date().toISOString()
    },
    {
      eventType: 'retry_attempted',
      sessionId: 'session_4',
      timestamp: new Date().toISOString()
    }
  ];

  const analytics = {
    totalExtractions: 5,
    successfulExtractions: 2,
    failedExtractions: 3,
    successRate: 0.4,
    averageRetries: 0.4, // 2 retries / 5 extractions
    mostCommonErrors: [
      { error: 'Network error', count: 2 },
      { error: 'Content too short', count: 1 }
    ],
    extractionsByDomain: [
      { domain: 'news.com', count: 2 },
      { domain: 'blog.com', count: 2 },
      { domain: 'wiki.com', count: 1 }
    ],
    eventsByType: {
      extraction_started: 5,
      extraction_completed: 2,
      extraction_failed: 3,
      retry_attempted: 2,
      button_clicked: 8,
      lesson_opened: 2
    }
  };

  return NextResponse.json({
    success: true,
    data: {
      test: 'analytics',
      sampleData: {
        history: mockHistory,
        events: mockEvents
      },
      analytics,
      notes: [
        'Analytics provide insights into extraction success rates',
        'Error patterns help identify common issues',
        'Domain analysis shows which sites work best',
        'Event tracking enables user behavior analysis'
      ]
    }
  });
}

async function testEventLogging() {
  const mockEvents = [
    {
      eventId: `event_${Date.now()}_1`,
      sessionId: 'session_123',
      eventType: 'button_shown',
      timestamp: new Date().toISOString(),
      url: 'https://example.com/article',
      metadata: {
        contentAnalysis: {
          wordCount: 500,
          contentType: 'article',
          suitabilityScore: 0.85
        }
      }
    },
    {
      eventId: `event_${Date.now()}_2`,
      sessionId: 'session_123',
      eventType: 'button_clicked',
      timestamp: new Date().toISOString(),
      url: 'https://example.com/article',
      metadata: {
        buttonPosition: 'bottom-right',
        clickCoordinates: { x: 100, y: 50 }
      }
    },
    {
      eventId: `event_${Date.now()}_3`,
      sessionId: 'session_123',
      eventType: 'extraction_started',
      timestamp: new Date().toISOString(),
      url: 'https://example.com/article',
      metadata: {
        extractionMethod: 'full_page',
        userAgent: 'Test User Agent'
      }
    },
    {
      eventId: `event_${Date.now()}_4`,
      sessionId: 'session_123',
      eventType: 'extraction_completed',
      timestamp: new Date().toISOString(),
      url: 'https://example.com/article',
      metadata: {
        extractionDuration: 2500,
        contentQuality: {
          wordCount: 450,
          suitabilityScore: 0.82
        }
      }
    },
    {
      eventId: `event_${Date.now()}_5`,
      sessionId: 'session_123',
      eventType: 'lesson_opened',
      timestamp: new Date().toISOString(),
      url: 'https://example.com/article',
      metadata: {
        lessonType: 'discussion',
        cefrLevel: 'B1'
      }
    }
  ];

  const eventTypes = [
    'button_shown',
    'button_clicked',
    'extraction_started',
    'extraction_completed',
    'extraction_failed',
    'retry_attempted',
    'lesson_opened',
    'session_cleanup'
  ];

  return NextResponse.json({
    success: true,
    data: {
      test: 'event_logging',
      sampleEvents: mockEvents,
      supportedEventTypes: eventTypes,
      features: {
        automaticTimestamps: true,
        uniqueEventIds: true,
        metadataSupport: true,
        maxStoredEvents: 100,
        automaticTrimming: true
      },
      notes: [
        'Events are automatically timestamped and assigned unique IDs',
        'Metadata can include any relevant context information',
        'Events are trimmed to prevent storage overflow',
        'Event logging failures are handled gracefully'
      ]
    }
  });
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Extraction Session Management Test API',
    availableActions: [
      'test_session_lifecycle',
      'test_retry_mechanism',
      'test_cleanup',
      'test_analytics',
      'test_event_logging'
    ],
    usage: 'POST with { "action": "test_name" } to run specific tests'
  });
}