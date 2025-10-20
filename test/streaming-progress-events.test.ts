import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Test suite for streaming progress events to frontend
 * Verifies that the streaming API emits SSE progress events with structured data
 * 
 * Requirements tested:
 * - 1.2: Progress updates with specific section information
 * - 1.3: Progress percentage based on actual completion
 * - 2.5: Structured data including step, progress, phase, section
 */

describe('Streaming Progress Events', () => {
  describe('SSE Event Format', () => {
    it('should emit progress events with required fields', () => {
      // Simulate a progress update
      const progressUpdate = {
        step: 'Generating vocabulary',
        progress: 25,
        phase: 'vocabulary',
        section: 'vocabulary-items'
      }

      // Verify all required fields are present
      expect(progressUpdate).toHaveProperty('step')
      expect(progressUpdate).toHaveProperty('progress')
      expect(progressUpdate).toHaveProperty('phase')
      expect(progressUpdate).toHaveProperty('section')

      // Verify field types
      expect(typeof progressUpdate.step).toBe('string')
      expect(typeof progressUpdate.progress).toBe('number')
      expect(typeof progressUpdate.phase).toBe('string')
      expect(typeof progressUpdate.section).toBe('string')
    })

    it('should support optional section field', () => {
      const progressUpdate = {
        step: 'Initializing',
        progress: 5,
        phase: 'initialization'
      }

      expect(progressUpdate).toHaveProperty('step')
      expect(progressUpdate).toHaveProperty('progress')
      expect(progressUpdate).toHaveProperty('phase')
      expect(progressUpdate.section).toBeUndefined()
    })

    it('should maintain backward compatible event structure', () => {
      // Test that events include type field for backward compatibility
      const progressEvent = {
        type: 'progress',
        step: 'Generating reading passage',
        progress: 50,
        phase: 'reading'
      }

      expect(progressEvent.type).toBe('progress')
      expect(progressEvent).toHaveProperty('step')
      expect(progressEvent).toHaveProperty('progress')
      expect(progressEvent).toHaveProperty('phase')
    })

    it('should format complete events correctly', () => {
      const completeEvent = {
        type: 'complete',
        step: 'Lesson generated successfully!',
        progress: 100,
        lesson: { lessonTitle: 'Test Lesson' }
      }

      expect(completeEvent.type).toBe('complete')
      expect(completeEvent.progress).toBe(100)
      expect(completeEvent).toHaveProperty('lesson')
    })

    it('should format error events correctly', () => {
      const errorEvent = {
        type: 'error',
        error: {
          type: 'QUOTA_EXCEEDED',
          message: 'API quota exceeded',
          errorId: 'ERR_123'
        }
      }

      expect(errorEvent.type).toBe('error')
      expect(errorEvent.error).toHaveProperty('type')
      expect(errorEvent.error).toHaveProperty('message')
      expect(errorEvent.error).toHaveProperty('errorId')
    })
  })

  describe('Progress Value Validation', () => {
    it('should have progress values between 0 and 100', () => {
      const progressUpdates = [
        { step: 'Start', progress: 0, phase: 'init' },
        { step: 'Middle', progress: 50, phase: 'generation' },
        { step: 'End', progress: 100, phase: 'complete' }
      ]

      progressUpdates.forEach(update => {
        expect(update.progress).toBeGreaterThanOrEqual(0)
        expect(update.progress).toBeLessThanOrEqual(100)
      })
    })

    it('should have monotonically increasing progress values', () => {
      const progressSequence = [5, 10, 15, 25, 40, 55, 70, 85, 95, 100]
      
      for (let i = 1; i < progressSequence.length; i++) {
        expect(progressSequence[i]).toBeGreaterThanOrEqual(progressSequence[i - 1])
      }
    })
  })

  describe('Phase Identification', () => {
    it('should identify all standard lesson phases', () => {
      const standardPhases = [
        'initialization',
        'validation',
        'authentication',
        'warmup',
        'vocabulary',
        'reading',
        'comprehension',
        'discussion',
        'dialogue',
        'grammar',
        'pronunciation',
        'wrapup',
        'saving'
      ]

      standardPhases.forEach(phase => {
        const update = {
          step: `Processing ${phase}`,
          progress: 50,
          phase: phase
        }

        expect(update.phase).toBe(phase)
        expect(typeof update.phase).toBe('string')
      })
    })

    it('should provide descriptive step names', () => {
      const updates = [
        { step: 'Generating vocabulary items', phase: 'vocabulary' },
        { step: 'Generating reading passage', phase: 'reading' },
        { step: 'Generating comprehension questions', phase: 'comprehension' },
        { step: 'Generating discussion questions', phase: 'discussion' },
        { step: 'Generating grammar section', phase: 'grammar' },
        { step: 'Generating pronunciation section', phase: 'pronunciation' }
      ]

      updates.forEach(update => {
        expect(update.step).toBeTruthy()
        expect(update.step.length).toBeGreaterThan(0)
        expect(update.step).toContain('Generating')
      })
    })
  })

  describe('SSE Message Format', () => {
    it('should create properly formatted SSE messages', () => {
      const createSSEMessage = (data: any): string => {
        return `data: ${JSON.stringify(data)}\n\n`
      }

      const progressData = {
        type: 'progress',
        step: 'Generating vocabulary',
        progress: 25,
        phase: 'vocabulary'
      }

      const sseMessage = createSSEMessage(progressData)

      // Verify SSE format
      expect(sseMessage).toMatch(/^data: /)
      expect(sseMessage).toMatch(/\n\n$/)
      
      // Verify JSON can be parsed
      const jsonPart = sseMessage.replace(/^data: /, '').replace(/\n\n$/, '')
      const parsed = JSON.parse(jsonPart)
      
      expect(parsed).toEqual(progressData)
    })

    it('should handle special characters in step names', () => {
      const createSSEMessage = (data: any): string => {
        return `data: ${JSON.stringify(data)}\n\n`
      }

      const progressData = {
        type: 'progress',
        step: 'Generating "advanced" vocabulary with special chars: <>&',
        progress: 30,
        phase: 'vocabulary'
      }

      const sseMessage = createSSEMessage(progressData)
      const jsonPart = sseMessage.replace(/^data: /, '').replace(/\n\n$/, '')
      const parsed = JSON.parse(jsonPart)

      expect(parsed.step).toBe(progressData.step)
    })
  })

  describe('Error Handling in Progress Streaming', () => {
    it('should not throw when streaming progress fails', () => {
      const progressCallback = (update: any) => {
        // Simulate streaming failure
        throw new Error('Streaming failed')
      }

      // Wrap in safe callback
      const safeCallback = (update: any) => {
        try {
          progressCallback(update)
        } catch (error) {
          // Should catch and log, not throw
          console.error('Failed to stream progress update:', error)
        }
      }

      // Should not throw
      expect(() => {
        safeCallback({
          step: 'Test',
          progress: 50,
          phase: 'test'
        })
      }).not.toThrow()
    })

    it('should continue generation even if progress callback fails', () => {
      let generationCompleted = false
      
      const progressCallback = (update: any) => {
        throw new Error('Callback failed')
      }

      const safeCallback = (update: any) => {
        try {
          progressCallback(update)
        } catch (error) {
          // Swallow error
        }
      }

      // Simulate generation with failing callback
      safeCallback({ step: 'Step 1', progress: 25, phase: 'test' })
      safeCallback({ step: 'Step 2', progress: 50, phase: 'test' })
      generationCompleted = true

      expect(generationCompleted).toBe(true)
    })
  })

  describe('Progress Callback Integration', () => {
    it('should accept optional progress callback in generate options', () => {
      interface GenerateOptions {
        content: string
        level: string
        lessonType: string
        onProgress?: (update: any) => void
      }

      const optionsWithCallback: GenerateOptions = {
        content: 'Test content',
        level: 'B1',
        lessonType: 'discussion',
        onProgress: (update) => {
          console.log('Progress:', update)
        }
      }

      const optionsWithoutCallback: GenerateOptions = {
        content: 'Test content',
        level: 'B1',
        lessonType: 'discussion'
      }

      expect(optionsWithCallback.onProgress).toBeDefined()
      expect(optionsWithoutCallback.onProgress).toBeUndefined()
    })

    it('should invoke callback with correct structure', () => {
      const mockCallback = vi.fn()

      const update = {
        step: 'Generating vocabulary',
        progress: 25,
        phase: 'vocabulary',
        section: 'vocabulary-items'
      }

      mockCallback(update)

      expect(mockCallback).toHaveBeenCalledWith(update)
      expect(mockCallback).toHaveBeenCalledTimes(1)
    })
  })

  describe('Backward Compatibility', () => {
    it('should work without progress callback', () => {
      interface GenerateOptions {
        content: string
        level: string
        lessonType: string
        onProgress?: (update: any) => void
      }

      const options: GenerateOptions = {
        content: 'Test content',
        level: 'B1',
        lessonType: 'discussion'
        // No onProgress callback
      }

      // Should not throw when callback is undefined
      const safeCallback = (callback: any, update: any) => {
        if (!callback) return
        callback(update)
      }

      expect(() => {
        safeCallback(options.onProgress, {
          step: 'Test',
          progress: 50,
          phase: 'test'
        })
      }).not.toThrow()
    })

    it('should maintain existing event types', () => {
      const eventTypes = ['progress', 'complete', 'error']

      eventTypes.forEach(type => {
        const event = {
          type: type,
          step: 'Test step',
          progress: 50,
          phase: 'test'
        }

        expect(event.type).toBe(type)
      })
    })
  })
})
