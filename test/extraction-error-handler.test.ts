import { describe, it, expect, beforeEach } from 'vitest';
import { ExtractionErrorHandler, ExtractionError, RecoveryOption } from '../lib/extraction-error-handler';
import { ValidationResult, ValidationIssue } from '../lib/content-validation-engine';

describe('ExtractionErrorHandler', () => {
  let errorHandler: ExtractionErrorHandler;

  beforeEach(() => {
    errorHandler = new ExtractionErrorHandler();
  });

  describe('Validation Error Handling', () => {
    it('should handle insufficient content validation errors', () => {
      const validationResult: ValidationResult = {
        isValid: false,
        meetsMinimumQuality: false,
        issues: [{
          type: 'insufficient_content',
          message: 'Content is too short (50 words). Minimum 200 words required.',
          severity: 'error',
          suggestedAction: 'Try selecting a longer article',
          recoverable: true
        }],
        warnings: [],
        recommendations: ['Look for longer articles'],
        score: 25
      };

      const error = errorHandler.handleValidationError(validationResult);

      expect(error.type).toBe('validation_failed');
      expect(error.userMessage).toContain('doesn\'t have enough content');
      expect(error.canRetry).toBe(false);
      expect(error.recoveryOptions.length).toBeGreaterThan(0);
      
      const manualOption = error.recoveryOptions.find(opt => opt.action === 'manual_selection');
      expect(manualOption).toBeDefined();
      expect(manualOption?.primary).toBe(true);
    });

    it('should handle unsupported language validation errors', () => {
      const validationResult: ValidationResult = {
        isValid: false,
        meetsMinimumQuality: false,
        issues: [{
          type: 'unsupported_language',
          message: 'Language "xyz" is not currently supported',
          severity: 'error',
          suggestedAction: 'Try content in supported languages',
          recoverable: true
        }],
        warnings: [],
        recommendations: [],
        score: 0
      };

      const error = errorHandler.handleValidationError(validationResult);

      expect(error.userMessage).toContain('language is not supported');
      
      const languageOption = error.recoveryOptions.find(opt => 
        opt.description.includes('supported languages')
      );
      expect(languageOption).toBeDefined();
    });

    it('should handle social media content validation errors', () => {
      const validationResult: ValidationResult = {
        isValid: false,
        meetsMinimumQuality: false,
        issues: [{
          type: 'social_media_content',
          message: 'Content appears to be from social media feeds',
          severity: 'error',
          suggestedAction: 'Try extracting from articles instead',
          recoverable: true
        }],
        warnings: [],
        recommendations: [],
        score: 20
      };

      const error = errorHandler.handleValidationError(validationResult);

      expect(error.userMessage).toContain('Social media content');
      
      const differentPageOption = error.recoveryOptions.find(opt => 
        opt.action === 'try_different_page'
      );
      expect(differentPageOption).toBeDefined();
    });
  });

  describe('Extraction Error Handling', () => {
    it('should handle network errors', () => {
      const networkError = new Error('Network request failed');
      
      const error = errorHandler.handleExtractionError(networkError);

      expect(error.type).toBe('network_error');
      expect(error.userMessage).toContain('connection');
      expect(error.canRetry).toBe(true);
      
      const retryOption = error.recoveryOptions.find(opt => opt.action === 'retry_extraction');
      expect(retryOption).toBeDefined();
      expect(retryOption?.primary).toBe(true);
    });

    it('should handle permission denied errors', () => {
      const permissionError = new Error('CORS policy blocked the request');
      
      const error = errorHandler.handleExtractionError(permissionError);

      expect(error.type).toBe('permission_denied');
      expect(error.userMessage).toContain('doesn\'t allow content extraction');
      expect(error.canRetry).toBe(false);
      
      const retryOption = error.recoveryOptions.find(opt => opt.action === 'retry_extraction');
      expect(retryOption).toBeUndefined();
      
      const manualOption = error.recoveryOptions.find(opt => opt.action === 'manual_selection');
      expect(manualOption).toBeDefined();
    });

    it('should handle timeout errors', () => {
      const timeoutError = new Error('Request timeout exceeded');
      
      const error = errorHandler.handleExtractionError(timeoutError);

      expect(error.type).toBe('timeout_error');
      expect(error.userMessage).toContain('took too long');
      expect(error.canRetry).toBe(true);
    });

    it('should handle parsing errors', () => {
      const parseError = new Error('Failed to parse HTML content');
      
      const error = errorHandler.handleExtractionError(parseError);

      expect(error.type).toBe('parsing_error');
      expect(error.userMessage).toContain('page structure');
      
      const manualOption = error.recoveryOptions.find(opt => opt.action === 'manual_selection');
      expect(manualOption).toBeDefined();
    });

    it('should handle content blocked errors', () => {
      const blockedError = new Error('Content extraction blocked by website');
      
      const error = errorHandler.handleExtractionError(blockedError);

      expect(error.type).toBe('content_blocked');
      expect(error.userMessage).toContain('blocked automatic content extraction');
      expect(error.canRetry).toBe(false);
    });
  });

  describe('Recovery Options', () => {
    it('should always provide copy-paste fallback option', () => {
      const networkError = new Error('Network failed');
      const error = errorHandler.handleExtractionError(networkError);

      const copyPasteOption = error.recoveryOptions.find(opt => 
        opt.action === 'copy_paste_fallback'
      );
      expect(copyPasteOption).toBeDefined();
      expect(copyPasteOption?.label).toContain('Copy');
    });

    it('should provide manual selection for appropriate errors', () => {
      const parseError = new Error('Parse error occurred');
      const error = errorHandler.handleExtractionError(parseError);

      const manualOption = error.recoveryOptions.find(opt => 
        opt.action === 'manual_selection'
      );
      expect(manualOption).toBeDefined();
      expect(manualOption?.description).toContain('Highlight');
    });

    it('should suggest different pages for blocking issues', () => {
      const blockedError = new Error('Content blocked by policy');
      const error = errorHandler.handleExtractionError(blockedError);

      const differentPageOption = error.recoveryOptions.find(opt => 
        opt.action === 'try_different_page'
      );
      expect(differentPageOption).toBeDefined();
    });
  });

  describe('Retry Logic', () => {
    it('should allow retries for recoverable errors', () => {
      const networkError = new Error('Network timeout');
      const url = 'https://example.com/article';
      
      const error = errorHandler.handleExtractionError(networkError, url);
      
      expect(error.canRetry).toBe(true);
    });

    it('should not allow retries for permission errors', () => {
      const permissionError = new Error('Permission denied');
      const url = 'https://example.com/article';
      
      const error = errorHandler.handleExtractionError(permissionError, url);
      
      expect(error.canRetry).toBe(false);
    });

    it('should track retry attempts', () => {
      const sessionId = 'example.com';
      
      expect(errorHandler.getRetryDelay(sessionId)).toBe(1000); // First attempt
      
      errorHandler.recordRetryAttempt(sessionId);
      expect(errorHandler.getRetryDelay(sessionId)).toBe(2000); // Second attempt
      
      errorHandler.recordRetryAttempt(sessionId);
      expect(errorHandler.getRetryDelay(sessionId)).toBe(4000); // Third attempt
    });

    it('should clear retry attempts', () => {
      const sessionId = 'example.com';
      
      errorHandler.recordRetryAttempt(sessionId);
      errorHandler.recordRetryAttempt(sessionId);
      
      errorHandler.clearRetryAttempts(sessionId);
      expect(errorHandler.getRetryDelay(sessionId)).toBe(1000); // Reset to first attempt
    });

    it('should limit maximum retry attempts', () => {
      const limitedHandler = new ExtractionErrorHandler({ maxRetryAttempts: 2 });
      const sessionId = 'example.com';
      
      // First retry should be allowed
      limitedHandler.recordRetryAttempt(sessionId);
      let error = limitedHandler.handleExtractionError(new Error('Network error'), 'https://example.com');
      expect(error.canRetry).toBe(true);
      
      // Second retry should be allowed
      limitedHandler.recordRetryAttempt(sessionId);
      error = limitedHandler.handleExtractionError(new Error('Network error'), 'https://example.com');
      expect(error.canRetry).toBe(true);
      
      // Third retry should not be allowed
      limitedHandler.recordRetryAttempt(sessionId);
      error = limitedHandler.handleExtractionError(new Error('Network error'), 'https://example.com');
      expect(error.canRetry).toBe(false);
    });
  });

  describe('Error Formatting', () => {
    it('should format errors for UI display', () => {
      const networkError = new Error('Network failed');
      const extractionError = errorHandler.handleExtractionError(networkError);
      
      const formatted = errorHandler.formatErrorForDisplay(extractionError);
      
      expect(formatted.title).toBe('Connection Problem');
      expect(formatted.message).toContain('connection');
      expect(formatted.actions).toEqual(extractionError.recoveryOptions);
      expect(formatted.canRetry).toBe(extractionError.canRetry);
    });

    it('should provide appropriate titles for different error types', () => {
      const errors = [
        { error: new Error('Network failed'), expectedTitle: 'Connection Problem' },
        { error: new Error('Permission denied'), expectedTitle: 'Access Denied' },
        { error: new Error('Content blocked'), expectedTitle: 'Content Blocked' },
        { error: new Error('Timeout occurred'), expectedTitle: 'Request Timed Out' },
        { error: new Error('Parse error'), expectedTitle: 'Content Format Issue' }
      ];

      errors.forEach(({ error, expectedTitle }) => {
        const extractionError = errorHandler.handleExtractionError(error);
        const formatted = errorHandler.formatErrorForDisplay(extractionError);
        expect(formatted.title).toBe(expectedTitle);
      });
    });
  });

  describe('Configuration Options', () => {
    it('should respect retry configuration', () => {
      const noRetryHandler = new ExtractionErrorHandler({ enableRetry: false });
      
      const networkError = new Error('Network failed');
      const error = noRetryHandler.handleExtractionError(networkError);
      
      expect(error.canRetry).toBe(false);
      const retryOption = error.recoveryOptions.find(opt => opt.action === 'retry_extraction');
      expect(retryOption).toBeUndefined();
    });

    it('should show technical details when configured', () => {
      const detailedHandler = new ExtractionErrorHandler({ showTechnicalDetails: true });
      
      const error = new Error('Detailed error message');
      error.stack = 'Error stack trace';
      
      const extractionError = detailedHandler.handleExtractionError(error);
      
      expect(extractionError.technicalDetails).toBeDefined();
      expect(extractionError.technicalDetails).toContain('Error stack trace');
    });

    it('should hide technical details by default', () => {
      const networkError = new Error('Network failed');
      const error = errorHandler.handleExtractionError(networkError);
      
      expect(error.technicalDetails).toBeUndefined();
    });
  });
});