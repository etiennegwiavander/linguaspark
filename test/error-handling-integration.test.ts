/**
 * Error Handling and Recovery Integration Tests
 * 
 * Tests comprehensive error scenarios, recovery mechanisms,
 * and graceful degradation of the extract-from-page feature.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContentAnalysisEngine } from '@/lib/content-analysis-engine';
import { EnhancedContentExtractor } from '@/lib/enhanced-content-extractor';
import { FloatingActionButton } from '@/components/floating-action-button';
import { LessonInterfaceBridge } from '@/lib/lesson-interface-bridge';
import { ExtractionSessionManager } from '@/lib/extraction-session-manager';
import { PrivacyManager } from '@/lib/privacy-manager';
import { ExtractButtonIntegration } from '@/lib/extract-button-integration';
import { ExtractionErrorHandler } from '@/lib/extraction-error-handler';

// Error simulation utilities
class ErrorSimulator {
  static networkError() {
    return new Error('Network request failed');
  }

  static timeoutError() {
    const error = new Error('Request timeout');
    error.name = 'TimeoutError';
    return error;
  }

  static quotaError() {
    const error = new Error('API quota exceeded');
    error.name = 'QuotaExceededError';
    return error;
  }

  static permissionError() {
    const error = new Error('Permission denied');
    error.name = 'PermissionError';
    return error;
  }

  static validationError() {
    const error = new Error('Content validation failed');
    error.name = 'ValidationError';
    return error;
  }

  static domError() {
    const error = new Error('DOM access denied');
    error.name = 'SecurityError';
    return error;
  }
}

// Mock problematic content scenarios
const problematicContent = {
  empty: '',
  tooShort: 'Short text.',
  nonText: '<img src="image.jpg" alt="Only image content">',
  malformed: '<div><p>Unclosed tags<div><span>Nested improperly',
  scripts: '<script>alert("malicious")</script><p>Some content</p>',
  iframes: '<iframe src="external.com"></iframe><p>Content with iframe</p>',
  largeFile: 'word '.repeat(100000), // Very large content
  specialChars: '🚀 Special chars: ñáéíóú çüß αβγ 中文 العربية',
  mixedLanguages: 'English text. Texto en español. Texte français. Deutscher Text.',
};

describe('Error Handling and Recovery Integration Tests', () => {
  let analysisEngine: ContentAnalysisEngine;
  let extractor: EnhancedContentExtractor;
  let button: FloatingActionButton;
  let bridge: LessonInterfaceBridge;
  let sessionManager: ExtractionSessionManager;
  let privacyManager: PrivacyManager;
  let integration: ExtractButtonIntegration;
  let errorHandler: ExtractionErrorHandler;

  beforeEach(() => {
    // Initialize components
    analysisEngine = new ContentAnalysisEngine();
    extractor = new EnhancedContentExtractor();
    button = new FloatingActionButton();
    bridge = new LessonInterfaceBridge();
    sessionManager = new ExtractionSessionManager();
    privacyManager = new PrivacyManager();
    integration = new ExtractButtonIntegration();
    errorHandler = new ExtractionErrorHandler();

    // Setup test environment
    global.document = {
      querySelector: vi.fn(),
      querySelectorAll: vi.fn(() => []),
      createElement: vi.fn(),
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
    } as any;

    global.window = {
      innerWidth: 1024,
      innerHeight: 768,
      location: { href: 'https://test.com/article' },
    } as any;

    global.chrome = {
      storage: { local: { set: vi.fn(), get: vi.fn() } },
      runtime: { getURL: vi.fn() },
      tabs: { create: vi.fn() },
    } as any;

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Content Analysis Error Handling', () => {
    it('should handle empty page content gracefully', async () => {
      global.document.querySelector.mockReturnValue({
        textContent: problematicContent.empty,
        innerHTML: problematicContent.empty,
      });

      const result = await analysisEngine.analyzePageContent();
      
      expect(result.wordCount).toBe(0);
      expect(result.hasMainContent).toBe(false);
      
      const shouldShow = analysisEngine.isContentSuitable(result);
      expect(shouldShow).toBe(false);
      
      // Button should not be displayed
      expect(button.isVisible()).toBe(false);
    });

    it('should handle insufficient content with helpful messaging', async () => {
      global.document.querySelector.mockReturnValue({
        textContent: problematicContent.tooShort,
        innerHTML: `<p>${problematicContent.tooShort}</p>`,
      });

      const result = await analysisEngine.analyzePageContent();
      
      expect(result.wordCount).toBeLessThan(200);
      
      const shouldShow = analysisEngine.isContentSuitable(result);
      expect(shouldShow).toBe(false);
      
      // Should provide helpful error message
      const errorMessage = errorHandler.getInsufficientContentMessage(result.wordCount);
      expect(errorMessage).toContain('minimum 200 words');
      expect(errorMessage).toContain('manual selection');
    });

    it('should handle DOM access errors', async () => {
      global.document.querySelector.mockImplementation(() => {
        throw ErrorSimulator.domError();
      });

      try {
        await analysisEngine.analyzePageContent();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.name).toBe('SecurityError');
        
        const errorMessage = errorHandler.handleAnalysisError(error);
        expect(errorMessage).toContain('access denied');
        expect(errorMessage).toContain('security restrictions');
      }
    });

    it('should handle malformed HTML gracefully', async () => {
      global.document.querySelector.mockReturnValue({
        textContent: 'Some content from malformed HTML',
        innerHTML: problematicContent.malformed,
      });

      // Should not throw error despite malformed HTML
      const result = await analysisEngine.analyzePageContent();
      expect(result.wordCount).toBeGreaterThan(0);
      expect(result.hasMainContent).toBe(true);
    });

    it('should handle mixed language content appropriately', async () => {
      global.document.querySelector.mockReturnValue({
        textContent: problematicContent.mixedLanguages,
        innerHTML: `<p>${problematicContent.mixedLanguages}</p>`,
      });

      const result = await analysisEngine.analyzePageContent();
      
      // Should detect primary language
      expect(result.language).toBeTruthy();
      expect(result.languageConfidence).toBeLessThan(1.0); // Lower confidence for mixed content
      
      // Should handle mixed content appropriately
      if (result.languageConfidence < 0.7) {
        const shouldShow = analysisEngine.isContentSuitable(result);
        expect(shouldShow).toBe(false);
        
        const errorMessage = errorHandler.getLanguageDetectionMessage(result);
        expect(errorMessage).toContain('language detection');
      }
    });
  });

  describe('Content Extraction Error Handling', () => {
    it('should handle extraction failures with retry mechanism', async () => {
      let attemptCount = 0;
      const mockExtract = vi.spyOn(extractor, 'extractPageContent')
        .mockImplementation(async () => {
          attemptCount++;
          if (attemptCount < 3) {
            throw ErrorSimulator.networkError();
          }
          return {
            text: 'Successfully extracted after retry',
            metadata: { sourceUrl: 'https://test.com' },
            quality: { wordCount: 50, meetsMinimumStandards: true },
          } as any;
        });

      const result = await integration.handleExtractClickWithRetry();
      
      expect(attemptCount).toBe(3);
      expect(result.text).toContain('Successfully extracted');
      
      // Should show retry progress to user
      expect(button.getState().error).toBeFalsy();
    });

    it('should handle permanent extraction failures gracefully', async () => {
      vi.spyOn(extractor, 'extractPageContent')
        .mockRejectedValue(ErrorSimulator.permissionError());

      try {
        await integration.handleExtractClick();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.name).toBe('PermissionError');
        
        // Should show appropriate error state
        button.showError(errorHandler.handleExtractionError(error));
        expect(button.getState().error).toContain('Permission denied');
        
        // Should offer alternative options
        const alternatives = errorHandler.getAlternativeOptions(error);
        expect(alternatives).toContain('manual copy-paste');
      }
    });

    it('should handle content validation failures', async () => {
      global.document.querySelector.mockReturnValue({
        textContent: problematicContent.nonText,
        innerHTML: problematicContent.nonText,
      });

      const extractedContent = await extractor.extractPageContent();
      const validation = extractor.validateContent(extractedContent);
      
      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContainEqual(
        expect.objectContaining({
          type: 'insufficient_content',
          severity: 'error',
        })
      );
      
      // Should provide specific validation error messages
      const errorMessage = errorHandler.getValidationErrorMessage(validation);
      expect(errorMessage).toContain('insufficient content');
      expect(errorMessage).toContain('manual selection');
    });

    it('should handle timeout errors during extraction', async () => {
      vi.spyOn(extractor, 'extractPageContent')
        .mockRejectedValue(ErrorSimulator.timeoutError());

      try {
        await integration.handleExtractClick();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.name).toBe('TimeoutError');
        
        const errorMessage = errorHandler.handleExtractionError(error);
        expect(errorMessage).toContain('timeout');
        expect(errorMessage).toContain('try again');
        
        // Should offer retry option
        const canRetry = errorHandler.canRetry(error);
        expect(canRetry).toBe(true);
      }
    });

    it('should sanitize malicious content during extraction', async () => {
      global.document.querySelector.mockReturnValue({
        textContent: 'Some content with scripts',
        innerHTML: problematicContent.scripts,
      });

      const extractedContent = await extractor.extractPageContent();
      
      // Should remove scripts and malicious content
      expect(extractedContent.text).not.toContain('<script>');
      expect(extractedContent.text).not.toContain('alert');
      expect(extractedContent.text).toContain('Some content');
    });
  });

  describe('UI Error States and Recovery', () => {
    it('should display appropriate error states in button', async () => {
      button.show();
      
      // Test different error states
      const errorStates = [
        { error: ErrorSimulator.networkError(), expectedText: 'network' },
        { error: ErrorSimulator.quotaError(), expectedText: 'quota' },
        { error: ErrorSimulator.permissionError(), expectedText: 'permission' },
        { error: ErrorSimulator.validationError(), expectedText: 'validation' },
      ];

      for (const { error, expectedText } of errorStates) {
        const errorMessage = errorHandler.handleExtractionError(error);
        button.showError(errorMessage);
        
        expect(button.getState().error).toContain(expectedText);
        expect(button.getState().success).toBe(false);
        
        // Should be able to clear error state
        button.clearError();
        expect(button.getState().error).toBeFalsy();
      }
    });

    it('should handle button interaction errors gracefully', async () => {
      button.show();
      
      // Simulate button click during error state
      button.showError('Test error');
      
      // Click should not trigger extraction while in error state
      const clickResult = await integration.handleExtractClick();
      expect(clickResult).toBeFalsy();
      
      // Should require error clearance before retry
      button.clearError();
      expect(button.getState().error).toBeFalsy();
    });

    it('should provide user-friendly error recovery options', async () => {
      const errors = [
        ErrorSimulator.networkError(),
        ErrorSimulator.timeoutError(),
        ErrorSimulator.quotaError(),
      ];

      for (const error of errors) {
        const recoveryOptions = errorHandler.getRecoveryOptions(error);
        
        expect(recoveryOptions).toBeTruthy();
        expect(recoveryOptions.canRetry).toBeDefined();
        expect(recoveryOptions.alternatives).toBeDefined();
        expect(recoveryOptions.userMessage).toBeTruthy();
        
        if (recoveryOptions.canRetry) {
          expect(recoveryOptions.retryDelay).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Session Management Error Handling', () => {
    it('should handle session creation failures', async () => {
      // Mock storage failure
      global.chrome.storage.local.set.mockRejectedValue(ErrorSimulator.quotaError());

      try {
        const session = sessionManager.startSession('https://test.com');
        await sessionManager.saveSession(session);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.name).toBe('QuotaExceededError');
        
        // Should handle gracefully without breaking functionality
        const errorMessage = errorHandler.handleSessionError(error);
        expect(errorMessage).toContain('storage');
      }
    });

    it('should recover from corrupted session data', async () => {
      // Mock corrupted session data
      global.chrome.storage.local.get.mockResolvedValue({
        extractionSession: 'corrupted-data',
      });

      const session = await sessionManager.getCurrentSession();
      
      // Should handle corrupted data gracefully
      expect(session).toBeFalsy();
      
      // Should be able to start new session
      const newSession = sessionManager.startSession('https://test.com');
      expect(newSession.sessionId).toBeTruthy();
    });

    it('should handle concurrent session conflicts', async () => {
      // Start multiple sessions simultaneously
      const sessions = await Promise.all([
        sessionManager.startSession('https://test1.com'),
        sessionManager.startSession('https://test2.com'),
        sessionManager.startSession('https://test3.com'),
      ]);

      // Should handle all sessions without conflicts
      expect(sessions).toHaveLength(3);
      sessions.forEach(session => {
        expect(session.sessionId).toBeTruthy();
      });
      
      // Should be able to complete all sessions
      for (const session of sessions) {
        sessionManager.completeSession(session.sessionId);
      }
      
      expect(sessionManager.getActiveSessions()).toHaveLength(0);
    });
  });

  describe('Privacy and Security Error Handling', () => {
    it('should handle robots.txt access failures', async () => {
      vi.spyOn(privacyManager, 'respectRobotsTxt')
        .mockRejectedValue(ErrorSimulator.networkError());

      // Should default to allowing extraction if robots.txt check fails
      const canExtract = await privacyManager.canExtractFromDomain('test.com');
      expect(canExtract).toBe(true);
      
      // Should log the failure for monitoring
      const errorMessage = errorHandler.handlePrivacyError(ErrorSimulator.networkError());
      expect(errorMessage).toContain('robots.txt check failed');
    });

    it('should handle domain restriction errors', async () => {
      vi.spyOn(privacyManager, 'canExtractFromDomain')
        .mockReturnValue(false);

      const canExtract = privacyManager.canExtractFromDomain('restricted-site.com');
      expect(canExtract).toBe(false);
      
      // Should show appropriate error message
      const errorMessage = errorHandler.getDomainRestrictionMessage('restricted-site.com');
      expect(errorMessage).toContain('not allowed');
      expect(errorMessage).toContain('restricted-site.com');
    });

    it('should handle content sanitization errors', async () => {
      const maliciousContent = {
        text: problematicContent.scripts,
        metadata: { sourceUrl: 'https://test.com' },
      };

      try {
        const sanitized = privacyManager.sanitizeContent(maliciousContent.text);
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('alert');
      } catch (error) {
        // Should handle sanitization errors gracefully
        const errorMessage = errorHandler.handleSanitizationError(error);
        expect(errorMessage).toContain('content processing');
      }
    });
  });

  describe('Lesson Interface Integration Error Handling', () => {
    it('should handle lesson interface opening failures', async () => {
      const extractedContent = {
        text: 'Test content',
        metadata: { sourceUrl: 'https://test.com' },
        quality: { wordCount: 100, meetsMinimumStandards: true },
      } as any;

      // Mock interface opening failure
      global.chrome.tabs.create.mockRejectedValue(ErrorSimulator.permissionError());

      try {
        await bridge.openLessonInterface(extractedContent);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.name).toBe('PermissionError');
        
        const errorMessage = errorHandler.handleInterfaceError(error);
        expect(errorMessage).toContain('lesson interface');
        expect(errorMessage).toContain('permission');
      }
    });

    it('should handle content pre-population failures', async () => {
      const extractedContent = {
        text: 'Test content',
        metadata: { sourceUrl: 'https://test.com' },
      } as any;

      // Mock storage failure during pre-population
      global.chrome.storage.local.set.mockRejectedValue(ErrorSimulator.quotaError());

      try {
        await bridge.populateInterface(extractedContent);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.name).toBe('QuotaExceededError');
        
        // Should offer alternative (manual copy-paste)
        const alternatives = errorHandler.getAlternativeOptions(error);
        expect(alternatives).toContain('manual copy-paste');
      }
    });

    it('should handle confirmation dialog errors', async () => {
      const extractedContent = {
        text: 'Test content',
        metadata: { sourceUrl: 'https://test.com' },
      } as any;

      // Mock dialog creation failure
      vi.spyOn(bridge, 'showExtractionConfirmation')
        .mockRejectedValue(ErrorSimulator.domError());

      try {
        await bridge.openLessonInterface(extractedContent);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.name).toBe('SecurityError');
        
        // Should fallback to direct interface opening
        const fallbackResult = await bridge.openLessonInterfaceDirectly(extractedContent);
        expect(fallbackResult).toBe(true);
      }
    });
  });

  describe('Recovery Mechanisms', () => {
    it('should implement exponential backoff for retries', async () => {
      let attemptCount = 0;
      const attemptTimes: number[] = [];
      
      const mockOperation = vi.fn().mockImplementation(async () => {
        attemptTimes.push(Date.now());
        attemptCount++;
        if (attemptCount < 4) {
          throw ErrorSimulator.networkError();
        }
        return 'success';
      });

      const result = await errorHandler.retryWithBackoff(mockOperation, {
        maxAttempts: 4,
        baseDelay: 100,
        maxDelay: 1000,
      });

      expect(result).toBe('success');
      expect(attemptCount).toBe(4);
      
      // Check exponential backoff timing
      for (let i = 1; i < attemptTimes.length; i++) {
        const delay = attemptTimes[i] - attemptTimes[i - 1];
        const expectedMinDelay = 100 * Math.pow(2, i - 1);
        expect(delay).toBeGreaterThanOrEqual(expectedMinDelay * 0.8); // Allow some variance
      }
    });

    it('should provide graceful degradation options', async () => {
      // Simulate complete extraction failure
      vi.spyOn(extractor, 'extractPageContent')
        .mockRejectedValue(ErrorSimulator.permissionError());

      const degradationOptions = errorHandler.getGracefulDegradationOptions();
      
      expect(degradationOptions).toContain('manual-selection');
      expect(degradationOptions).toContain('copy-paste');
      expect(degradationOptions).toContain('try-different-page');
      
      // Should provide instructions for each option
      for (const option of degradationOptions) {
        const instructions = errorHandler.getDegradationInstructions(option);
        expect(instructions).toBeTruthy();
        expect(instructions.length).toBeGreaterThan(10);
      }
    });

    it('should maintain user context during error recovery', async () => {
      const originalUrl = 'https://test.com/article';
      global.window.location.href = originalUrl;
      
      // Start extraction process
      const session = sessionManager.startSession(originalUrl);
      
      // Simulate error during extraction
      try {
        await integration.handleExtractClick();
      } catch (error) {
        // Context should be preserved for recovery
        const currentSession = sessionManager.getCurrentSession();
        expect(currentSession?.sourceUrl).toBe(originalUrl);
        expect(currentSession?.status).toBe('failed');
        
        // Should be able to retry with preserved context
        const retryResult = await integration.retryExtraction(session.sessionId);
        expect(retryResult).toBeTruthy();
      }
    });
  });

  describe('Error Reporting and Analytics', () => {
    it('should classify errors correctly for reporting', async () => {
      const errors = [
        { error: ErrorSimulator.networkError(), expectedCategory: 'network' },
        { error: ErrorSimulator.quotaError(), expectedCategory: 'quota' },
        { error: ErrorSimulator.permissionError(), expectedCategory: 'permission' },
        { error: ErrorSimulator.validationError(), expectedCategory: 'validation' },
        { error: ErrorSimulator.domError(), expectedCategory: 'security' },
      ];

      for (const { error, expectedCategory } of errors) {
        const classification = errorHandler.classifyError(error);
        expect(classification.category).toBe(expectedCategory);
        expect(classification.severity).toBeDefined();
        expect(classification.recoverable).toBeDefined();
      }
    });

    it('should collect error metrics for monitoring', async () => {
      const errors = [
        ErrorSimulator.networkError(),
        ErrorSimulator.timeoutError(),
        ErrorSimulator.quotaError(),
      ];

      for (const error of errors) {
        errorHandler.reportError(error, {
          url: 'https://test.com',
          userAgent: 'test-agent',
          timestamp: Date.now(),
        });
      }

      const metrics = errorHandler.getErrorMetrics();
      expect(metrics.totalErrors).toBe(3);
      expect(metrics.errorsByCategory.network).toBe(1);
      expect(metrics.errorsByCategory.quota).toBe(1);
      expect(metrics.errorsByCategory.timeout).toBe(1);
    });
  });
});