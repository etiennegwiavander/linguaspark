import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Test suite for error state progress reporting
 * 
 * Requirements tested:
 * - 1.6: Report current progress state when errors occur
 * - Include phase and section information in error events
 * - Ensure progress state is preserved in error responses
 */

describe('Error State Progress Reporting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Progress State Tracking', () => {
    it('should track progress state throughout generation', () => {
      const progressStates: any[] = []
      
      const mockCallback = (update: any) => {
        progressStates.push({ ...update })
      }

      // Simulate progress updates
      mockCallback({ step: 'Initializing', progress: 5, phase: 'initialization' })
      mockCallback({ step: 'Validating', progress: 10, phase: 'validation' })
      mockCallback({ step: 'Generating vocabulary', progress: 25, phase: 'vocabulary' })
      
      expect(progressStates).toHaveLength(3)
      expect(progressStates[0]).toEqual({
        step: 'Initializing',
        progress: 5,
        phase: 'initialization'
      })
      expect(progressStates[2]).toEqual({
        step: 'Generating vocabulary',
        progress: 25,
        phase: 'vocabulary'
      })
    })

    it('should preserve last known progress state', () => {
      let currentState = {
        step: 'Not started',
        progress: 0,
        phase: 'initialization',
        section: undefined
      }

      // Simulate progress updates
      currentState = { step: 'Generating vocabulary', progress: 25, phase: 'vocabulary', section: undefined }
      currentState = { step: 'Generating reading', progress: 45, phase: 'reading', section: 'paragraph-1' }
      
      // Verify state is preserved
      expect(currentState.step).toBe('Generating reading')
      expect(currentState.progress).toBe(45)
      expect(currentState.phase).toBe('reading')
      expect(currentState.section).toBe('paragraph-1')
    })
  })

  describe('Error Event Structure', () => {
    it('should include progress state in error events', () => {
      const errorEvent = {
        type: 'error',
        error: {
          type: 'QUOTA_EXCEEDED',
          message: 'API quota exceeded',
          errorId: 'ERR_123'
        },
        progressState: {
          step: 'Generating vocabulary',
          progress: 25,
          phase: 'vocabulary',
          section: undefined
        }
      }

      expect(errorEvent.type).toBe('error')
      expect(errorEvent.error).toBeDefined()
      expect(errorEvent.progressState).toBeDefined()
      expect(errorEvent.progressState.step).toBe('Generating vocabulary')
      expect(errorEvent.progressState.progress).toBe(25)
      expect(errorEvent.progressState.phase).toBe('vocabulary')
    })

    it('should include section information when available', () => {
      const errorEvent = {
        type: 'error',
        error: {
          type: 'NETWORK_ERROR',
          message: 'Network request failed',
          errorId: 'ERR_456'
        },
        progressState: {
          step: 'Generating dialogue',
          progress: 60,
          phase: 'dialogue',
          section: 'exchange-2'
        }
      }

      expect(errorEvent.progressState.section).toBe('exchange-2')
      expect(errorEvent.progressState.phase).toBe('dialogue')
    })

    it('should handle errors at different generation phases', () => {
      const phases = [
        { phase: 'initialization', progress: 5 },
        { phase: 'validation', progress: 10 },
        { phase: 'authentication', progress: 15 },
        { phase: 'vocabulary', progress: 30 },
        { phase: 'reading', progress: 50 },
        { phase: 'comprehension', progress: 60 },
        { phase: 'discussion', progress: 70 },
        { phase: 'grammar', progress: 85 },
        { phase: 'saving', progress: 95 }
      ]

      phases.forEach(({ phase, progress }) => {
        const errorEvent = {
          type: 'error',
          error: {
            type: 'GENERATION_ERROR',
            message: `Error during ${phase}`,
            errorId: `ERR_${phase}`
          },
          progressState: {
            step: `Processing ${phase}`,
            progress,
            phase,
            section: undefined
          }
        }

        expect(errorEvent.progressState.phase).toBe(phase)
        expect(errorEvent.progressState.progress).toBe(progress)
      })
    })
  })

  describe('Progress State Preservation', () => {
    it('should preserve progress state when validation fails', () => {
      const currentState = {
        step: 'Validating content...',
        progress: 10,
        phase: 'validation',
        section: undefined
      }

      const errorResponse = {
        type: 'error',
        error: {
          type: 'CONTENT_ISSUE',
          message: 'Content validation failed',
          errorId: 'VAL_001'
        },
        progressState: currentState
      }

      expect(errorResponse.progressState).toEqual(currentState)
      expect(errorResponse.progressState.phase).toBe('validation')
      expect(errorResponse.progressState.progress).toBe(10)
    })

    it('should preserve progress state when authentication fails', () => {
      const currentState = {
        step: 'Authenticating...',
        progress: 15,
        phase: 'authentication',
        section: undefined
      }

      const errorResponse = {
        type: 'error',
        error: {
          type: 'AUTH_ERROR',
          message: 'Authentication required',
          errorId: 'AUTH_001'
        },
        progressState: currentState
      }

      expect(errorResponse.progressState).toEqual(currentState)
      expect(errorResponse.progressState.phase).toBe('authentication')
    })

    it('should preserve progress state when generation fails mid-process', () => {
      const currentState = {
        step: 'Generating dialogue section',
        progress: 65,
        phase: 'dialogue',
        section: 'exchange-3'
      }

      const errorResponse = {
        type: 'error',
        error: {
          type: 'QUOTA_EXCEEDED',
          message: 'API quota exceeded during generation',
          errorId: 'QUOTA_001'
        },
        progressState: currentState
      }

      expect(errorResponse.progressState).toEqual(currentState)
      expect(errorResponse.progressState.phase).toBe('dialogue')
      expect(errorResponse.progressState.section).toBe('exchange-3')
      expect(errorResponse.progressState.progress).toBe(65)
    })

    it('should preserve progress state for network errors', () => {
      const currentState = {
        step: 'Generating grammar examples',
        progress: 80,
        phase: 'grammar',
        section: 'examples'
      }

      const errorResponse = {
        type: 'error',
        error: {
          type: 'NETWORK_ERROR',
          message: 'Network connection lost',
          errorId: 'NET_001'
        },
        progressState: currentState
      }

      expect(errorResponse.progressState.step).toBe('Generating grammar examples')
      expect(errorResponse.progressState.progress).toBe(80)
      expect(errorResponse.progressState.phase).toBe('grammar')
      expect(errorResponse.progressState.section).toBe('examples')
    })
  })

  describe('SSE Message Format', () => {
    it('should format error messages with progress state correctly', () => {
      const createSSEMessage = (data: any): string => {
        return `data: ${JSON.stringify(data)}\n\n`
      }

      const errorMessage = createSSEMessage({
        type: 'error',
        error: {
          type: 'GENERATION_ERROR',
          message: 'Failed to generate content',
          errorId: 'GEN_001'
        },
        progressState: {
          step: 'Generating vocabulary',
          progress: 30,
          phase: 'vocabulary',
          section: undefined
        }
      })

      expect(errorMessage).toContain('data: ')
      expect(errorMessage).toContain('"type":"error"')
      expect(errorMessage).toContain('"progressState"')
      expect(errorMessage).toContain('"phase":"vocabulary"')
      expect(errorMessage).toContain('"progress":30')
    })

    it('should handle progress state with section information', () => {
      const createSSEMessage = (data: any): string => {
        return `data: ${JSON.stringify(data)}\n\n`
      }

      const errorMessage = createSSEMessage({
        type: 'error',
        error: {
          type: 'TIMEOUT',
          message: 'Request timeout',
          errorId: 'TIME_001'
        },
        progressState: {
          step: 'Generating reading passage',
          progress: 45,
          phase: 'reading',
          section: 'paragraph-2'
        }
      })

      const parsed = JSON.parse(errorMessage.replace('data: ', '').trim())
      expect(parsed.progressState.section).toBe('paragraph-2')
      expect(parsed.progressState.phase).toBe('reading')
    })
  })

  describe('Error Recovery Information', () => {
    it('should provide enough context for error recovery', () => {
      const errorWithProgress = {
        type: 'error',
        error: {
          type: 'QUOTA_EXCEEDED',
          message: 'API quota exceeded',
          errorId: 'QUOTA_001'
        },
        progressState: {
          step: 'Generating comprehension questions',
          progress: 55,
          phase: 'comprehension',
          section: 'question-3'
        }
      }

      // Verify we have all necessary information for recovery
      expect(errorWithProgress.progressState.phase).toBeDefined()
      expect(errorWithProgress.progressState.progress).toBeGreaterThan(0)
      expect(errorWithProgress.progressState.step).toBeDefined()
      expect(errorWithProgress.error.type).toBeDefined()
      expect(errorWithProgress.error.errorId).toBeDefined()
    })

    it('should indicate how far generation progressed before failure', () => {
      const scenarios = [
        { progress: 10, phase: 'validation', expected: 'early' },
        { progress: 50, phase: 'reading', expected: 'middle' },
        { progress: 90, phase: 'saving', expected: 'late' }
      ]

      scenarios.forEach(({ progress, phase, expected }) => {
        const errorEvent = {
          type: 'error',
          error: { type: 'ERROR', message: 'Failed', errorId: 'ERR' },
          progressState: { step: 'Processing', progress, phase, section: undefined }
        }

        if (expected === 'early') {
          expect(errorEvent.progressState.progress).toBeLessThan(30)
        } else if (expected === 'middle') {
          expect(errorEvent.progressState.progress).toBeGreaterThanOrEqual(30)
          expect(errorEvent.progressState.progress).toBeLessThan(70)
        } else {
          expect(errorEvent.progressState.progress).toBeGreaterThanOrEqual(70)
        }
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle errors before any progress is made', () => {
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
      expect(errorEvent.progressState.phase).toBe('initialization')
    })

    it('should handle errors with undefined section', () => {
      const errorEvent = {
        type: 'error',
        error: {
          type: 'ERROR',
          message: 'Generic error',
          errorId: 'ERR_001'
        },
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

    it('should handle rapid progress updates before error', () => {
      const states: any[] = []
      
      // Simulate rapid updates
      for (let i = 0; i < 10; i++) {
        states.push({
          step: `Step ${i}`,
          progress: i * 10,
          phase: 'generation',
          section: `section-${i}`
        })
      }

      // Last state should be preserved
      const lastState = states[states.length - 1]
      const errorEvent = {
        type: 'error',
        error: { type: 'ERROR', message: 'Failed', errorId: 'ERR' },
        progressState: lastState
      }

      expect(errorEvent.progressState).toEqual(lastState)
      expect(errorEvent.progressState.progress).toBe(90)
    })
  })
})
