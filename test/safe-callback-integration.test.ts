import { describe, it, expect, vi } from 'vitest'
import { safeProgressCallback, type ProgressCallback, type ProgressUpdate } from '../lib/progressive-generator'

describe('Safe Callback Integration', () => {
  describe('Generator Integration Scenarios', () => {
    it('should allow generation to continue when callback fails', () => {
      let generationCompleted = false
      let callbackInvocations = 0

      // Simulate a callback that fails on second invocation
      const unreliableCallback: ProgressCallback = (update) => {
        callbackInvocations++
        if (callbackInvocations === 2) {
          throw new Error('UI component not mounted')
        }
      }

      // Simulate a generation process with multiple progress updates
      const simulateGeneration = () => {
        const updates: ProgressUpdate[] = [
          { step: 'Generating warmup', progress: 10, phase: 'warmup' },
          { step: 'Generating vocabulary', progress: 25, phase: 'vocabulary' },
          { step: 'Generating reading', progress: 45, phase: 'reading' },
          { step: 'Complete', progress: 100, phase: 'complete' }
        ]

        try {
          updates.forEach(update => {
            safeProgressCallback(unreliableCallback, update)
          })
          generationCompleted = true
          return { success: true, lesson: { title: 'Test Lesson' } }
        } catch (error) {
          return { success: false, error }
        }
      }

      const result = simulateGeneration()

      // Generation should complete successfully despite callback failure
      expect(result.success).toBe(true)
      expect(generationCompleted).toBe(true)
      expect(callbackInvocations).toBe(4)
    })

    it('should handle callback that throws on every invocation', () => {
      const alwaysFailingCallback: ProgressCallback = () => {
        throw new Error('Callback always fails')
      }

      let sectionGenerated = false

      // Simulate generating a section with progress updates
      const generateSection = () => {
        safeProgressCallback(alwaysFailingCallback, {
          step: 'Starting section',
          progress: 0,
          phase: 'vocabulary'
        })

        // Simulate actual work
        sectionGenerated = true

        safeProgressCallback(alwaysFailingCallback, {
          step: 'Section complete',
          progress: 100,
          phase: 'vocabulary'
        })

        return { content: 'Generated content' }
      }

      const result = generateSection()

      // Section should generate successfully
      expect(sectionGenerated).toBe(true)
      expect(result.content).toBe('Generated content')
    })

    it('should work with no callback provided (backward compatibility)', () => {
      let generationCompleted = false

      const generateWithoutCallback = () => {
        // Call with undefined callback (backward compatibility)
        safeProgressCallback(undefined, {
          step: 'Generating',
          progress: 50,
          phase: 'test'
        })

        generationCompleted = true
        return { success: true }
      }

      const result = generateWithoutCallback()

      expect(result.success).toBe(true)
      expect(generationCompleted).toBe(true)
    })

    it('should handle mixed success and failure callbacks in sequence', () => {
      const results: string[] = []
      let callCount = 0

      const mixedCallback: ProgressCallback = (update) => {
        callCount++
        if (callCount % 2 === 0) {
          throw new Error('Even calls fail')
        }
        results.push(update.step)
      }

      const phases = [
        { step: 'Phase 1', progress: 20, phase: 'warmup' },
        { step: 'Phase 2', progress: 40, phase: 'vocabulary' },
        { step: 'Phase 3', progress: 60, phase: 'reading' },
        { step: 'Phase 4', progress: 80, phase: 'comprehension' },
        { step: 'Phase 5', progress: 100, phase: 'wrapup' }
      ]

      phases.forEach(phase => {
        safeProgressCallback(mixedCallback, phase)
      })

      // Odd-numbered calls should succeed
      expect(results).toEqual(['Phase 1', 'Phase 3', 'Phase 5'])
      expect(callCount).toBe(5)
    })
  })

  describe('Error Recovery', () => {
    it('should isolate callback errors from generation logic', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      let generationSteps = 0
      const failingCallback: ProgressCallback = () => {
        throw new Error('Network error')
      }

      // Simulate multi-step generation
      const steps = ['warmup', 'vocabulary', 'reading', 'comprehension', 'wrapup']
      
      steps.forEach((step, index) => {
        safeProgressCallback(failingCallback, {
          step: `Generating ${step}`,
          progress: (index + 1) * 20,
          phase: step
        })
        generationSteps++
      })

      // All steps should complete
      expect(generationSteps).toBe(5)
      
      // Errors should be logged
      expect(consoleErrorSpy).toHaveBeenCalled()
      
      consoleErrorSpy.mockRestore()
    })

    it('should preserve generation state when callback fails', () => {
      const generationState = {
        currentPhase: '',
        progress: 0,
        sectionsCompleted: [] as string[]
      }

      const stateTrackingCallback: ProgressCallback = (update) => {
        if (update.phase === 'vocabulary') {
          throw new Error('Vocabulary callback fails')
        }
        generationState.currentPhase = update.phase
        generationState.progress = update.progress
      }

      const phases = [
        { step: 'Warmup', progress: 10, phase: 'warmup' },
        { step: 'Vocabulary', progress: 25, phase: 'vocabulary' },
        { step: 'Reading', progress: 45, phase: 'reading' }
      ]

      phases.forEach(phase => {
        safeProgressCallback(stateTrackingCallback, phase)
        // Simulate section completion regardless of callback
        generationState.sectionsCompleted.push(phase.phase)
      })

      // All sections should be marked complete
      expect(generationState.sectionsCompleted).toEqual(['warmup', 'vocabulary', 'reading'])
      
      // State should reflect last successful callback (reading)
      expect(generationState.currentPhase).toBe('reading')
      expect(generationState.progress).toBe(45)
    })
  })

  describe('Requirements Verification', () => {
    it('should meet Requirement 2.4: function normally without callback', () => {
      // Requirement 2.4: IF no callback is provided THEN the generator 
      // SHALL function normally without progress reporting

      let workCompleted = false

      const doWork = () => {
        safeProgressCallback(undefined, {
          step: 'Working',
          progress: 50,
          phase: 'work'
        })
        
        workCompleted = true
        return 'result'
      }

      const result = doWork()

      expect(workCompleted).toBe(true)
      expect(result).toBe('result')
    })

    it('should meet Requirement 5.4: generation continues on callback failure', () => {
      // Requirement 5.4: IF progress tracking fails THEN lesson generation 
      // SHALL complete successfully without progress updates

      const failingCallback: ProgressCallback = () => {
        throw new Error('Progress tracking failed')
      }

      let lessonGenerated = false
      let lessonData = null

      const generateLesson = () => {
        safeProgressCallback(failingCallback, {
          step: 'Starting',
          progress: 0,
          phase: 'init'
        })

        // Simulate lesson generation
        lessonData = {
          title: 'Test Lesson',
          sections: ['warmup', 'vocabulary', 'reading']
        }
        lessonGenerated = true

        safeProgressCallback(failingCallback, {
          step: 'Complete',
          progress: 100,
          phase: 'complete'
        })

        return lessonData
      }

      const result = generateLesson()

      // Lesson should generate successfully despite callback failures
      expect(lessonGenerated).toBe(true)
      expect(result).toEqual({
        title: 'Test Lesson',
        sections: ['warmup', 'vocabulary', 'reading']
      })
    })
  })
})
