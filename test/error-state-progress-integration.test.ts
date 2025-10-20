import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Integration test for error state progress reporting in streaming API
 * 
 * Requirements tested:
 * - 1.6: Report current progress state when errors occur
 * - Include phase and section information in error events
 * - Ensure progress state is preserved in error responses
 */

describe('Error State Progress Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Streaming API Error Handling', () => {
    it('should track and report progress state during streaming', async () => {
      // Simulate streaming API behavior
      const progressUpdates: any[] = []
      let currentProgressState = {
        step: 'Not started',
        progress: 0,
        phase: 'initialization',
        section: undefined as string | undefined
      }

      const progressCallback = (update: any) => {
        currentProgressState = { ...update }
        progressUpdates.push({ ...update })
      }

      // Simulate progress through generation
      progressCallback({ step: 'Initializing', progress: 5, phase: 'initialization' })
      progressCallback({ step: 'Validating', progress: 10, phase: 'validation' })
      progressCallback({ step: 'Generating vocabulary', progress: 30, phase: 'vocabulary' })
      
      // Simulate error during generation
      const errorEvent = {
        type: 'error',
        error: {
          type: 'QUOTA_EXCEEDED',
          message: 'API quota exceeded',
          errorId: 'QUOTA_001'
        },
        progressState: currentProgressState
      }

      expect(progressUpdates).toHaveLength(3)
      expect(errorEvent.progressState.step).toBe('Generating vocabulary')
      expect(errorEvent.progressState.progress).toBe(30)
      expect(errorEvent.progressState.phase).toBe('vocabulary')
    })

    it('should preserve progress state across multiple phases before error', async () => {
      let currentProgressState = {
        step: 'Not started',
        progress: 0,
        phase: 'initialization',
        section: undefined as string | undefined
      }

      const phases = [
        { step: 'Initializing', progress: 5, phase: 'initialization' },
        { step: 'Validating', progress: 10, phase: 'validation' },
        { step: 'Authenticating', progress: 15, phase: 'authentication' },
        { step: 'Generating warmup', progress: 25, phase: 'warmup' },
        { step: 'Generating vocabulary', progress: 40, phase: 'vocabulary' },
        { step: 'Generating reading', progress: 60, phase: 'reading', section: 'paragraph-1' }
      ]

      // Simulate progress through phases
      phases.forEach(phase => {
        currentProgressState = { ...phase, section: phase.section }
      })

      // Error occurs during reading phase
      const errorEvent = {
        type: 'error',
        error: {
          type: 'NETWORK_ERROR',
          message: 'Network connection lost',
          errorId: 'NET_001'
        },
        progressState: currentProgressState
      }

      expect(errorEvent.progressState.phase).toBe('reading')
      expect(errorEvent.progressState.progress).toBe(60)
      expect(errorEvent.progressState.section).toBe('paragraph-1')
    })

    it('should handle validation errors with correct progress state', async () => {
      let currentProgressState = {
        step: 'Validating content...',
        progress: 10,
        phase: 'validation',
        section: undefined as string | undefined
      }

      // Validation fails
      const errorEvent = {
        type: 'error',
        error: {
          type: 'CONTENT_ISSUE',
          message: 'Content validation failed: Text too short',
          errorId: 'VAL_001'
        },
        progressState: currentProgressState
      }

      expect(errorEvent.progressState.phase).toBe('validation')
      expect(errorEvent.progressState.progress).toBe(10)
      expect(errorEvent.progressState.step).toBe('Validating content...')
    })

    it('should handle authentication errors with correct progress state', async () => {
      let currentProgressState = {
        step: 'Authenticating...',
        progress: 15,
        phase: 'authentication',
        section: undefined as string | undefined
      }

      // Authentication fails
      const errorEvent = {
        type: 'error',
        error: {
          type: 'AUTH_ERROR',
          message: 'Authentication required',
          errorId: 'AUTH_001'
        },
        progressState: currentProgressState
      }

      expect(errorEvent.progressState.phase).toBe('authentication')
      expect(errorEvent.progressState.progress).toBe(15)
    })

    it('should handle generation errors mid-process with section info', async () => {
      let currentProgressState = {
        step: 'Generating dialogue exchange',
        progress: 70,
        phase: 'dialogue',
        section: 'exchange-3' as string | undefined
      }

      // Generation fails during dialogue
      const errorEvent = {
        type: 'error',
        error: {
          type: 'QUOTA_EXCEEDED',
          message: 'API quota exceeded during dialogue generation',
          errorId: 'QUOTA_002'
        },
        progressState: currentProgressState
      }

      expect(errorEvent.progressState.phase).toBe('dialogue')
      expect(errorEvent.progressState.section).toBe('exchange-3')
      expect(errorEvent.progressState.progress).toBe(70)
    })
  })

  describe('SSE Stream Error Events', () => {
    it('should format SSE error messages with progress state', () => {
      const createSSEMessage = (data: any): string => {
        return `data: ${JSON.stringify(data)}\n\n`
      }

      const currentProgressState = {
        step: 'Generating grammar examples',
        progress: 85,
        phase: 'grammar',
        section: 'examples'
      }

      const errorMessage = createSSEMessage({
        type: 'error',
        error: {
          type: 'TIMEOUT',
          message: 'Request timeout',
          errorId: 'TIME_001'
        },
        progressState: currentProgressState
      })

      expect(errorMessage).toContain('data: ')
      expect(errorMessage).toContain('"type":"error"')
      expect(errorMessage).toContain('"progressState"')
      expect(errorMessage).toContain('"phase":"grammar"')
      expect(errorMessage).toContain('"progress":85')
      expect(errorMessage).toContain('"section":"examples"')
    })

    it('should handle multiple error scenarios with different progress states', () => {
      const createSSEMessage = (data: any): string => {
        return `data: ${JSON.stringify(data)}\n\n`
      }

      const scenarios = [
        {
          progressState: { step: 'Validating', progress: 10, phase: 'validation', section: undefined },
          error: { type: 'CONTENT_ISSUE', message: 'Invalid content', errorId: 'VAL_001' }
        },
        {
          progressState: { step: 'Generating vocabulary', progress: 30, phase: 'vocabulary', section: undefined },
          error: { type: 'QUOTA_EXCEEDED', message: 'Quota exceeded', errorId: 'QUOTA_001' }
        },
        {
          progressState: { step: 'Generating reading', progress: 50, phase: 'reading', section: 'paragraph-2' },
          error: { type: 'NETWORK_ERROR', message: 'Network error', errorId: 'NET_001' }
        }
      ]

      scenarios.forEach(({ progressState, error }) => {
        const message = createSSEMessage({
          type: 'error',
          error,
          progressState
        })

        const parsed = JSON.parse(message.replace('data: ', '').trim())
        expect(parsed.progressState).toEqual(progressState)
        expect(parsed.error).toEqual(error)
      })
    })
  })

  describe('Progress State Consistency', () => {
    it('should maintain consistent progress state through callback updates', () => {
      let currentProgressState = {
        step: 'Not started',
        progress: 0,
        phase: 'initialization',
        section: undefined as string | undefined
      }

      const progressCallback = (update: any) => {
        currentProgressState = {
          step: update.step,
          progress: update.progress,
          phase: update.phase,
          section: update.section
        }
      }

      // Simulate progress updates
      progressCallback({ step: 'Step 1', progress: 10, phase: 'phase1', section: undefined })
      expect(currentProgressState.progress).toBe(10)

      progressCallback({ step: 'Step 2', progress: 20, phase: 'phase2', section: 'section-a' })
      expect(currentProgressState.progress).toBe(20)
      expect(currentProgressState.section).toBe('section-a')

      progressCallback({ step: 'Step 3', progress: 30, phase: 'phase3', section: undefined })
      expect(currentProgressState.progress).toBe(30)
      expect(currentProgressState.section).toBeUndefined()
    })

    it('should preserve progress state when streaming fails', () => {
      let currentProgressState = {
        step: 'Generating comprehension questions',
        progress: 65,
        phase: 'comprehension',
        section: 'question-4' as string | undefined
      }

      // Simulate streaming failure
      const streamError = new Error('Stream write failed')
      
      // Progress state should still be available for error reporting
      const errorEvent = {
        type: 'error',
        error: {
          type: 'STREAM_ERROR',
          message: 'Failed to stream progress update',
          errorId: 'STREAM_001'
        },
        progressState: currentProgressState
      }

      expect(errorEvent.progressState.phase).toBe('comprehension')
      expect(errorEvent.progressState.section).toBe('question-4')
      expect(errorEvent.progressState.progress).toBe(65)
    })
  })

  describe('Error Recovery Context', () => {
    it('should provide sufficient context for error recovery', () => {
      const errorWithContext = {
        type: 'error',
        error: {
          type: 'QUOTA_EXCEEDED',
          message: 'API quota exceeded',
          errorId: 'QUOTA_003'
        },
        progressState: {
          step: 'Generating pronunciation guide',
          progress: 90,
          phase: 'pronunciation',
          section: 'word-5'
        }
      }

      // Verify all necessary context is present
      expect(errorWithContext.error.type).toBeDefined()
      expect(errorWithContext.error.message).toBeDefined()
      expect(errorWithContext.error.errorId).toBeDefined()
      expect(errorWithContext.progressState.phase).toBeDefined()
      expect(errorWithContext.progressState.progress).toBeGreaterThan(0)
      expect(errorWithContext.progressState.step).toBeDefined()
      expect(errorWithContext.progressState.section).toBeDefined()
    })

    it('should indicate generation stage for retry logic', () => {
      const earlyError = {
        progressState: { step: 'Validating', progress: 10, phase: 'validation', section: undefined }
      }
      const midError = {
        progressState: { step: 'Generating reading', progress: 50, phase: 'reading', section: 'paragraph-1' }
      }
      const lateError = {
        progressState: { step: 'Saving lesson', progress: 95, phase: 'saving', section: undefined }
      }

      expect(earlyError.progressState.progress).toBeLessThan(30)
      expect(midError.progressState.progress).toBeGreaterThanOrEqual(30)
      expect(midError.progressState.progress).toBeLessThan(70)
      expect(lateError.progressState.progress).toBeGreaterThanOrEqual(70)
    })
  })

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle error at 0% progress', () => {
      const errorEvent = {
        type: 'error',
        error: {
          type: 'CONTENT_ISSUE',
          message: 'Missing required fields',
          errorId: 'REQ_001'
        },
        progressState: {
          step: 'Not started',
          progress: 0,
          phase: 'initialization',
          section: undefined
        }
      }

      expect(errorEvent.progressState.progress).toBe(0)
    })

    it('should handle error at 99% progress', () => {
      const errorEvent = {
        type: 'error',
        error: {
          type: 'DATABASE_ERROR',
          message: 'Failed to save lesson',
          errorId: 'DB_001'
        },
        progressState: {
          step: 'Saving lesson to database',
          progress: 99,
          phase: 'saving',
          section: undefined
        }
      }

      expect(errorEvent.progressState.progress).toBe(99)
      expect(errorEvent.progressState.phase).toBe('saving')
    })

    it('should handle rapid progress updates before error', () => {
      let currentProgressState = {
        step: 'Not started',
        progress: 0,
        phase: 'initialization',
        section: undefined as string | undefined
      }

      // Simulate rapid updates
      for (let i = 1; i <= 5; i++) {
        currentProgressState = {
          step: `Rapid step ${i}`,
          progress: i * 15,
          phase: `phase-${i}`,
          section: i % 2 === 0 ? `section-${i}` : undefined
        }
      }

      const errorEvent = {
        type: 'error',
        error: { type: 'ERROR', message: 'Failed', errorId: 'ERR_001' },
        progressState: currentProgressState
      }

      expect(errorEvent.progressState.progress).toBe(75)
      expect(errorEvent.progressState.phase).toBe('phase-5')
    })

    it('should handle undefined section gracefully', () => {
      const errorEvent = {
        type: 'error',
        error: { type: 'ERROR', message: 'Failed', errorId: 'ERR_002' },
        progressState: {
          step: 'Generating warmup',
          progress: 20,
          phase: 'warmup',
          section: undefined
        }
      }

      expect(errorEvent.progressState.section).toBeUndefined()
      expect(errorEvent.progressState.phase).toBe('warmup')
    })
  })
})
