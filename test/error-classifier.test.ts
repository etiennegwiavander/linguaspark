import { describe, it, expect, beforeEach } from 'vitest'
import { ErrorClassifier } from '@/lib/error-classifier'

describe('ErrorClassifier', () => {
  let classifier: ErrorClassifier

  beforeEach(() => {
    classifier = new ErrorClassifier()
  })

  describe('classifyError', () => {
    it('should classify quota exceeded errors', () => {
      const error = new Error('Quota exceeded')
      error.name = 'QuotaExceededError'

      const classified = classifier.classifyError(error, { section: 'vocabulary', attempt: 1 })

      expect(classified.type).toBe('QUOTA_EXCEEDED')
      expect(classified.errorId).toBeDefined()
      expect(classified.errorId.length).toBeGreaterThan(0)
      expect(classified.context.section).toBe('vocabulary')
    })

    it('should classify content-related errors', () => {
      const error = new Error('Content too short')
      error.name = 'ContentValidationError'

      const classified = classifier.classifyError(error, { section: 'reading', attempt: 1 })

      expect(classified.type).toBe('CONTENT_ISSUE')
      expect(classified.originalError).toBe(error)
    })

    it('should classify network errors', () => {
      const error = new Error('Network timeout')
      error.name = 'NetworkError'

      const classified = classifier.classifyError(error, { section: 'dialogue', attempt: 2 })

      expect(classified.type).toBe('NETWORK_ERROR')
      expect(classified.context.attempt).toBe(2)
    })

    it('should classify API key errors as quota issues', () => {
      const error = new Error('Invalid API key')
      error.name = 'AuthenticationError'

      const classified = classifier.classifyError(error, { section: 'warmup', attempt: 1 })

      expect(classified.type).toBe('QUOTA_EXCEEDED')
    })

    it('should classify rate limit errors', () => {
      const error = new Error('Rate limit exceeded')
      error.name = 'RateLimitError'

      const classified = classifier.classifyError(error, { section: 'comprehension', attempt: 3 })

      expect(classified.type).toBe('QUOTA_EXCEEDED')
    })

    it('should classify unknown errors', () => {
      const error = new Error('Unexpected error occurred')
      error.name = 'UnknownError'

      const classified = classifier.classifyError(error, { section: 'vocabulary', attempt: 1 })

      expect(classified.type).toBe('UNKNOWN')
    })

    it('should handle errors with specific AI service messages', () => {
      const error = new Error('The model is currently overloaded')

      const classified = classifier.classifyError(error, { section: 'reading', attempt: 1 })

      expect(classified.type).toBe('QUOTA_EXCEEDED')
    })

    it('should detect content filtering errors', () => {
      const error = new Error('Content violates safety guidelines')

      const classified = classifier.classifyError(error, { section: 'dialogue', attempt: 1 })

      expect(classified.type).toBe('CONTENT_ISSUE')
    })
  })

  describe('generateUserMessage', () => {
    it('should generate appropriate message for quota exceeded', () => {
      const classifiedError = {
        type: 'QUOTA_EXCEEDED' as const,
        originalError: new Error('Quota exceeded'),
        context: { section: 'vocabulary', attempt: 1 },
        errorId: 'ERR_001'
      }

      const message = classifier.generateUserMessage(classifiedError)

      expect(message.message).toContain('API quota exceeded')
      expect(message.actionableSteps).toContain('try again later')
      expect(message.errorId).toBe('ERR_001')
      expect(message.supportContact).toBeDefined()
    })

    it('should generate appropriate message for content issues', () => {
      const classifiedError = {
        type: 'CONTENT_ISSUE' as const,
        originalError: new Error('Content too short'),
        context: { section: 'reading', attempt: 1 },
        errorId: 'ERR_002'
      }

      const message = classifier.generateUserMessage(classifiedError)

      expect(message.message).toContain('Unable to process this content')
      expect(message.actionableSteps).toContain('try different text')
      expect(message.actionableSteps.length).toBeGreaterThan(1)
    })

    it('should generate appropriate message for network errors', () => {
      const classifiedError = {
        type: 'NETWORK_ERROR' as const,
        originalError: new Error('Connection timeout'),
        context: { section: 'dialogue', attempt: 2 },
        errorId: 'ERR_003'
      }

      const message = classifier.generateUserMessage(classifiedError)

      expect(message.message).toContain('Connection error')
      expect(message.actionableSteps).toContain('check your internet')
    })

    it('should generate appropriate message for unknown errors', () => {
      const classifiedError = {
        type: 'UNKNOWN' as const,
        originalError: new Error('Mysterious error'),
        context: { section: 'warmup', attempt: 1 },
        errorId: 'ERR_004'
      }

      const message = classifier.generateUserMessage(classifiedError)

      expect(message.message).toContain('AI service temporarily unavailable')
      expect(message.actionableSteps).toContain('try again later')
      expect(message.supportContact).toBeDefined()
    })
  })

  describe('generateSupportMessage', () => {
    it('should generate detailed support message with context', () => {
      const classifiedError = {
        type: 'QUOTA_EXCEEDED' as const,
        originalError: new Error('Rate limit exceeded'),
        context: { section: 'vocabulary', attempt: 3, userId: 'user123' },
        errorId: 'ERR_005'
      }

      const supportMessage = classifier.generateSupportMessage(classifiedError)

      expect(supportMessage.errorId).toBe('ERR_005')
      expect(supportMessage.timestamp).toBeDefined()
      expect(supportMessage.errorType).toBe('QUOTA_EXCEEDED')
      expect(supportMessage.context.section).toBe('vocabulary')
      expect(supportMessage.context.attempt).toBe(3)
      expect(supportMessage.technicalDetails).toContain('Rate limit exceeded')
    })

    it('should include stack trace when available', () => {
      const error = new Error('Test error with stack')
      error.stack = 'Error: Test error\n    at test.js:1:1'
      
      const classifiedError = {
        type: 'UNKNOWN' as const,
        originalError: error,
        context: { section: 'reading', attempt: 1 },
        errorId: 'ERR_006'
      }

      const supportMessage = classifier.generateSupportMessage(classifiedError)

      expect(supportMessage.stackTrace).toContain('Error: Test error')
    })

    it('should handle missing context gracefully', () => {
      const classifiedError = {
        type: 'NETWORK_ERROR' as const,
        originalError: new Error('Network error'),
        context: { section: 'dialogue', attempt: 1 },
        errorId: 'ERR_007'
      }

      const supportMessage = classifier.generateSupportMessage(classifiedError)

      expect(supportMessage.errorId).toBe('ERR_007')
      expect(supportMessage.context).toBeDefined()
    })
  })

  describe('error classification accuracy', () => {
    it('should correctly identify quota-related error patterns', () => {
      const quotaErrors = [
        'Quota exceeded for requests',
        'API key quota limit reached',
        'Rate limit exceeded',
        'Too many requests',
        'Usage limit exceeded',
        'The model is currently overloaded'
      ]

      quotaErrors.forEach(message => {
        const error = new Error(message)
        const classified = classifier.classifyError(error, { section: 'test', attempt: 1 })
        expect(classified.type).toBe('QUOTA_EXCEEDED')
      })
    })

    it('should correctly identify content-related error patterns', () => {
      const contentErrors = [
        'Content too short',
        'Invalid content format',
        'Content violates guidelines',
        'Unable to process content',
        'Content filtering triggered'
      ]

      contentErrors.forEach(message => {
        const error = new Error(message)
        const classified = classifier.classifyError(error, { section: 'test', attempt: 1 })
        expect(classified.type).toBe('CONTENT_ISSUE')
      })
    })

    it('should correctly identify network-related error patterns', () => {
      const networkErrors = [
        'Network timeout',
        'Connection refused',
        'DNS resolution failed',
        'Socket timeout',
        'Request timeout'
      ]

      networkErrors.forEach(message => {
        const error = new Error(message)
        const classified = classifier.classifyError(error, { section: 'test', attempt: 1 })
        expect(classified.type).toBe('NETWORK_ERROR')
      })
    })

    it('should generate unique error IDs', () => {
      const error = new Error('Test error')
      const context = { section: 'test', attempt: 1 }

      const classified1 = classifier.classifyError(error, context)
      const classified2 = classifier.classifyError(error, context)

      expect(classified1.errorId).not.toBe(classified2.errorId)
      expect(classified1.errorId.length).toBeGreaterThan(5)
      expect(classified2.errorId.length).toBeGreaterThan(5)
    })
  })

  describe('error context handling', () => {
    it('should preserve all context information', () => {
      const error = new Error('Test error')
      const context = {
        section: 'vocabulary',
        attempt: 2,
        userId: 'user123',
        lessonType: 'discussion',
        difficultyLevel: 'B2'
      }

      const classified = classifier.classifyError(error, context)

      expect(classified.context.section).toBe('vocabulary')
      expect(classified.context.attempt).toBe(2)
      expect(classified.context.userId).toBe('user123')
      expect(classified.context.lessonType).toBe('discussion')
      expect(classified.context.difficultyLevel).toBe('B2')
    })

    it('should handle minimal context', () => {
      const error = new Error('Test error')
      const context = { section: 'reading', attempt: 1 }

      const classified = classifier.classifyError(error, context)

      expect(classified.context.section).toBe('reading')
      expect(classified.context.attempt).toBe(1)
    })
  })
})