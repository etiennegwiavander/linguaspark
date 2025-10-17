/**
 * Demo component for extraction session management
 * 
 * Shows how to use the extraction session manager in a React component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ExtractionSessionManager, 
  ExtractionSession, 
  ExtractedContent,
  ExtractionHistory,
  UserInteractionEvent
} from '@/lib/extraction-session-manager';

export function ExtractionSessionDemo() {
  const [currentSession, setCurrentSession] = useState<ExtractionSession | null>(null);
  const [activeSessions, setActiveSessions] = useState<ExtractionSession[]>([]);
  const [history, setHistory] = useState<ExtractionHistory[]>([]);
  const [events, setEvents] = useState<UserInteractionEvent[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [activeSessionsData, historyData, eventsData, analyticsData] = await Promise.all([
        ExtractionSessionManager.getActiveSessions(),
        ExtractionSessionManager.getExtractionHistory(),
        ExtractionSessionManager.getInteractionEvents(),
        ExtractionSessionManager.getAnalyticsSummary()
      ]);

      setActiveSessions(activeSessionsData);
      setHistory(historyData);
      setEvents(eventsData);
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const createTestSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const testUrls = [
        'https://example.com/news-article',
        'https://blog.example.com/tutorial',
        'https://wiki.example.com/encyclopedia-entry',
        'https://education.example.com/lesson'
      ];

      const randomUrl = testUrls[Math.floor(Math.random() * testUrls.length)];
      const session = await ExtractionSessionManager.createSession(randomUrl, 'full_page');
      
      setCurrentSession(session);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      setIsLoading(false);
    }
  };

  const simulateExtraction = async () => {
    if (!currentSession) return;

    try {
      setIsLoading(true);
      setError(null);

      // Simulate extraction process
      await ExtractionSessionManager.updateSession(currentSession.sessionId, {
        status: 'extracting'
      });

      // Simulate some delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      await ExtractionSessionManager.updateSession(currentSession.sessionId, {
        status: 'validating'
      });

      // Simulate another delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Complete with mock extracted content
      const extractedContent: ExtractedContent = {
        text: `This is a simulated extraction from ${currentSession.sourceUrl}. The content has been successfully extracted and validated for lesson generation. It contains sufficient text for creating engaging language learning materials.`,
        title: `Extracted Article from ${new URL(currentSession.sourceUrl).hostname}`,
        metadata: {
          sourceUrl: currentSession.sourceUrl,
          domain: new URL(currentSession.sourceUrl).hostname,
          author: 'Demo Author',
          publicationDate: new Date()
        },
        quality: {
          wordCount: Math.floor(Math.random() * 500) + 200,
          readingTime: Math.floor(Math.random() * 5) + 1,
          suitabilityScore: Math.random() * 0.3 + 0.7 // 0.7 to 1.0
        }
      };

      await ExtractionSessionManager.completeSession(currentSession.sessionId, extractedContent);
      
      const updatedSession = await ExtractionSessionManager.getSession(currentSession.sessionId);
      setCurrentSession(updatedSession);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to simulate extraction');
    } finally {
      setIsLoading(false);
    }
  };

  const simulateFailure = async () => {
    if (!currentSession) return;

    try {
      setIsLoading(true);
      setError(null);

      const errors = [
        'Network timeout during extraction',
        'Content too short for lesson generation',
        'Unsupported content type detected',
        'Page blocked by robots.txt'
      ];

      const randomError = errors[Math.floor(Math.random() * errors.length)];
      await ExtractionSessionManager.failSession(currentSession.sessionId, randomError);
      
      const updatedSession = await ExtractionSessionManager.getSession(currentSession.sessionId);
      setCurrentSession(updatedSession);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to simulate failure');
    } finally {
      setIsLoading(false);
    }
  };

  const retryExtraction = async () => {
    if (!currentSession) return;

    try {
      setIsLoading(true);
      setError(null);

      const canRetry = await ExtractionSessionManager.retryExtraction(currentSession.sessionId);
      
      if (canRetry) {
        const updatedSession = await ExtractionSessionManager.getSession(currentSession.sessionId);
        setCurrentSession(updatedSession);
        await loadData();
      } else {
        setError('Maximum retry attempts exceeded');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry extraction');
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupSessions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await ExtractionSessionManager.cleanupExpiredSessions();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cleanup sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: ExtractionSession['status']) => {
    switch (status) {
      case 'started': return 'bg-blue-100 text-blue-800';
      case 'extracting': return 'bg-yellow-100 text-yellow-800';
      case 'validating': return 'bg-orange-100 text-orange-800';
      case 'complete': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Extraction Session Management Demo</h1>
        <p className="text-gray-600">
          Demonstrates session lifecycle, retry mechanisms, analytics, and cleanup functionality
        </p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Session Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Session Controls</CardTitle>
          <CardDescription>Create and manage extraction sessions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={createTestSession} 
              disabled={isLoading}
              variant="default"
            >
              Create Test Session
            </Button>
            
            {currentSession && currentSession.status === 'started' && (
              <>
                <Button 
                  onClick={simulateExtraction} 
                  disabled={isLoading}
                  variant="secondary"
                >
                  Simulate Extraction
                </Button>
                <Button 
                  onClick={simulateFailure} 
                  disabled={isLoading}
                  variant="destructive"
                >
                  Simulate Failure
                </Button>
              </>
            )}
            
            {currentSession && currentSession.status === 'failed' && (
              <Button 
                onClick={retryExtraction} 
                disabled={isLoading}
                variant="outline"
              >
                Retry Extraction
              </Button>
            )}
            
            <Button 
              onClick={cleanupSessions} 
              disabled={isLoading}
              variant="outline"
            >
              Cleanup Expired
            </Button>
            
            <Button 
              onClick={loadData} 
              disabled={isLoading}
              variant="ghost"
            >
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Session */}
      {currentSession && (
        <Card>
          <CardHeader>
            <CardTitle>Current Session</CardTitle>
            <CardDescription>Active extraction session details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Session ID</p>
                <p className="font-mono text-sm">{currentSession.sessionId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <Badge className={getStatusColor(currentSession.status)}>
                  {currentSession.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Source URL</p>
                <p className="text-sm truncate">{currentSession.sourceUrl}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Retry Count</p>
                <p className="text-sm">{currentSession.retryCount}/3</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Started</p>
                <p className="text-sm">{new Date(currentSession.startTime).toLocaleString()}</p>
              </div>
              {currentSession.endTime && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Ended</p>
                  <p className="text-sm">{new Date(currentSession.endTime).toLocaleString()}</p>
                </div>
              )}
            </div>
            
            {currentSession.error && (
              <div>
                <p className="text-sm font-medium text-gray-500">Error</p>
                <p className="text-sm text-red-600">{currentSession.error}</p>
              </div>
            )}
            
            {currentSession.extractedContent && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Extracted Content</p>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">{currentSession.extractedContent.title}</p>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {currentSession.extractedContent.text}
                  </p>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>Words: {currentSession.extractedContent.quality.wordCount}</span>
                    <span>Reading Time: {currentSession.extractedContent.quality.readingTime}min</span>
                    <span>Quality: {(currentSession.extractedContent.quality.suitabilityScore * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Active Sessions ({activeSessions.length})</CardTitle>
            <CardDescription>Currently running extraction sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {activeSessions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No active sessions</p>
            ) : (
              <div className="space-y-3">
                {activeSessions.map((session) => (
                  <div key={session.sessionId} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-mono text-xs text-gray-500">{session.sessionId}</p>
                      <Badge className={getStatusColor(session.status)}>
                        {session.status}
                      </Badge>
                    </div>
                    <p className="text-sm truncate">{session.sourceUrl}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Started: {new Date(session.startTime).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Analytics Summary</CardTitle>
            <CardDescription>Extraction performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{analytics.successfulExtractions}</p>
                    <p className="text-sm text-gray-500">Successful</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{analytics.failedExtractions}</p>
                    <p className="text-sm text-gray-500">Failed</p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm font-medium mb-2">Success Rate</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ 
                        width: `${analytics.totalExtractions > 0 ? (analytics.successfulExtractions / analytics.totalExtractions) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {analytics.totalExtractions > 0 ? 
                      `${((analytics.successfulExtractions / analytics.totalExtractions) * 100).toFixed(1)}%` : 
                      '0%'
                    }
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Average Retries</p>
                  <p className="text-lg">{analytics.averageRetries.toFixed(2)}</p>
                </div>
                
                {analytics.mostCommonErrors.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Common Errors</p>
                    <div className="space-y-1">
                      {analytics.mostCommonErrors.slice(0, 3).map((error: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="truncate">{error.error}</span>
                          <span className="text-gray-500">{error.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No analytics data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent History ({history.length})</CardTitle>
          <CardDescription>Latest extraction attempts</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No extraction history</p>
          ) : (
            <div className="space-y-2">
              {history.slice(0, 10).map((entry, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div className="flex-1">
                    <p className="text-sm truncate">{entry.url}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(entry.status)}>
                      {entry.status}
                    </Badge>
                    {entry.error && (
                      <p className="text-xs text-red-600 max-w-32 truncate" title={entry.error}>
                        {entry.error}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Events ({events.length})</CardTitle>
          <CardDescription>User interaction and system events</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No events logged</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {events.slice(0, 20).map((event, index) => (
                <div key={index} className="flex justify-between items-start py-2 border-b last:border-b-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{event.eventType.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-500 truncate">{event.url}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 font-mono">
                    {event.sessionId.split('_').pop()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}