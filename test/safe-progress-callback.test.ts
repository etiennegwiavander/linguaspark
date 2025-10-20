import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { safeProgressCallback, type ProgressCallback, type ProgressUpdate } from '../lib/progressive-generator'

describe('safeProgressCallback', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Spy on console.error to verify error logging
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    // Restore console.error after each test
    consoleErrorSpy.mockRestore()
  })

  describe('Normal Operation', () => {
    it('should invoke callback with progress update when callback is provided', () => {
      const mockCallback = vi.fn()
      const update: ProgressUpdate = {
        step: 'Generating vocabulary',
        progress: 25,
        phase: 'vocabulary'
      }

      safeProgressCallback(mockCallback, update)

      expect(mockCallback).toHaveBeenCalledTimes(1)
      expect(mockCallback).toHaveBeenCalledWith(update)
    })

    it('should handle callback with section information', () => {
      const mockCallback = vi.fn()
      const update: ProgressUpdate = {
        step: 'Generating reading passage',
        progress: 50,
        phase: 'reading',
        section: 'main-content'
      }

      safeProgressCallback(mockCallback, update)

      expect(mockCallback).toHaveBeenCalledWith(update)
    })

    it('should do nothing when callback is undefined', () => {
      const update: ProgressUpdate = {
        step: 'Generating warmup',
        progress: 10,
        phase: 'warmup'
      }

      // Should not throw
      expect(() => {
        safeProgressCallback(undefined, update)
      }).not.toThrow()

      // Should not log any errors
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it('should handle multiple sequential callback invocations', () => {
      const mockCallback = vi.fn()
      const updates: ProgressUpdate[] = [
        { step: 'Starting', progress: 0, phase: 'init' },
        { step: 'Warmup', progress: 10, phase: 'warmup' },
        { step: 'Vocabulary', progress: 25, phase: 'vocabulary' },
        { step: 'Complete', progress: 100, phase: 'wrapup' }
      ]

      updates.forEach(update => {
        safeProgressCallback(mockCallback, update)
      })

      expect(mockCallback).toHaveBeenCalledTimes(4)
      updates.forEach((update, index) => {
        expect(mockCallback).toHaveBeenNthCalledWith(index + 1, update)
      })
    })
  })

  describe('Error Isolation', () => {
    it('should catch and log callback errors without throwing', () => {
      const errorMessage = 'Callback failed'
      const failingCallback: ProgressCallback = () => {
        throw new Error(errorMessage)
      }

      const update: ProgressUpdate = {
        step: 'Generating vocabulary',
        progress: 25,
        phase: 'vocabulary'
      }

      // Should not throw despite callback error
      expect(() => {
        safeProgressCallback(failingCallback, update)
      }).not.toThrow()

      // Should log the error
      expect(consoleErrorSpy).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Progress callback error:',
        expect.any(Error)
      )
    })

    it('should log progress update that caused the error', () => {
      const failingCallback: ProgressCallback = () => {
        throw new Error('Test error')
      }

      const update: ProgressUpdate = {
        step: 'Generating reading',
        progress: 50,
        phase: 'reading',
        section: 'paragraph-1'
      }

      safeProgressCallback(failingCallback, update)

      // Should log both error and the update that caused it
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Progress callback error:',
        expect.any(Error)
      )
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Progress update that caused error:',
        update
      )
    })

    it('should log stack trace when error has one', () => {
      const error = new Error('Test error with stack')
      const failingCallback: ProgressCallback = () => {
        throw error
      }

      const update: ProgressUpdate = {
        step: 'Test',
        progress: 0,
        phase: 'test'
      }

      safeProgressCallback(failingCallback, update)

      // Should log stack trace
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Stack trace:',
        expect.any(String)
      )
    })

    it('should handle non-Error exceptions', () => {
      const failingCallback: ProgressCallback = () => {
        throw 'String error'
      }

      const update: ProgressUpdate = {
        step: 'Test',
        progress: 0,
        phase: 'test'
      }

      // Should not throw
      expect(() => {
        safeProgressCallback(failingCallback, update)
      }).not.toThrow()

      // Should still log the error
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('should continue working after a callback error', () => {
      let callCount = 0
      const sometimesFailingCallback: ProgressCallback = () => {
        callCount++
        if (callCount === 2) {
          throw new Error('Second call fails')
        }
      }

      const updates: ProgressUpdate[] = [
        { step: 'First', progress: 25, phase: 'first' },
        { step: 'Second', progress: 50, phase: 'second' },
        { step: 'Third', progress: 75, phase: 'third' }
      ]

      // All calls should complete without throwing
      updates.forEach(update => {
        expect(() => {
          safeProgressCallback(sometimesFailingCallback, update)
        }).not.toThrow()
      })

      // Callback should have been attempted 3 times
      expect(callCount).toBe(3)

      // Error should have been logged once (for second call)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Progress callback error:',
        expect.any(Error)
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle callback that modifies update object', () => {
      const modifyingCallback: ProgressCallback = (update) => {
        // Attempt to modify the update (bad practice but should be handled)
        (update as any).modified = true
      }

      const update: ProgressUpdate = {
        step: 'Test',
        progress: 50,
        phase: 'test'
      }

      expect(() => {
        safeProgressCallback(modifyingCallback, update)
      }).not.toThrow()
    })

    it('should handle callback with async operations (fire and forget)', () => {
      const asyncCallback: ProgressCallback = () => {
        // Simulate async operation (not awaited)
        Promise.resolve().then(() => {
          // Do something async
        })
      }

      const update: ProgressUpdate = {
        step: 'Test',
        progress: 50,
        phase: 'test'
      }

      expect(() => {
        safeProgressCallback(asyncCallback, update)
      }).not.toThrow()
    })

    it('should not catch async errors (expected behavior)', () => {
      // Note: safeProgressCallback only protects against synchronous errors
      // Async errors that occur after the callback returns are not caught
      // This is expected and correct behavior
      
      const asyncCallback: ProgressCallback = () => {
        // This callback completes synchronously without error
        // Any async operations are fire-and-forget
        Promise.resolve().then(() => {
          // Async work here is not protected
        })
      }

      const update: ProgressUpdate = {
        step: 'Test',
        progress: 50,
        phase: 'test'
      }

      // Should not throw synchronously
      expect(() => {
        safeProgressCallback(asyncCallback, update)
      }).not.toThrow()
    })

    it('should handle progress values at boundaries', () => {
      const mockCallback = vi.fn()

      const boundaryUpdates: ProgressUpdate[] = [
        { step: 'Start', progress: 0, phase: 'start' },
        { step: 'Complete', progress: 100, phase: 'complete' },
        { step: 'Negative', progress: -1, phase: 'invalid' },
        { step: 'Over', progress: 150, phase: 'invalid' }
      ]

      boundaryUpdates.forEach(update => {
        safeProgressCallback(mockCallback, update)
      })

      expect(mockCallback).toHaveBeenCalledTimes(4)
    })

    it('should handle empty or unusual step names', () => {
      const mockCallback = vi.fn()

      const unusualUpdates: ProgressUpdate[] = [
        { step: '', progress: 50, phase: 'test' },
        { step: '   ', progress: 50, phase: 'test' },
        { step: 'Very long step name that goes on and on and on', progress: 50, phase: 'test' }
      ]

      unusualUpdates.forEach(update => {
        expect(() => {
          safeProgressCallback(mockCallback, update)
        }).not.toThrow()
      })

      expect(mockCallback).toHaveBeenCalledTimes(3)
    })
  })

  describe('Type Safety', () => {
    it('should accept valid ProgressUpdate with all fields', () => {
      const mockCallback = vi.fn()
      const completeUpdate: ProgressUpdate = {
        step: 'Generating vocabulary',
        progress: 25,
        phase: 'vocabulary',
        section: 'word-1'
      }

      safeProgressCallback(mockCallback, completeUpdate)
      expect(mockCallback).toHaveBeenCalledWith(completeUpdate)
    })

    it('should accept valid ProgressUpdate without optional section', () => {
      const mockCallback = vi.fn()
      const minimalUpdate: ProgressUpdate = {
        step: 'Generating warmup',
        progress: 10,
        phase: 'warmup'
      }

      safeProgressCallback(mockCallback, minimalUpdate)
      expect(mockCallback).toHaveBeenCalledWith(minimalUpdate)
    })
  })

  describe('Integration Scenarios', () => {
    it('should work in a typical generation flow', () => {
      const progressHistory: ProgressUpdate[] = []
      const trackingCallback: ProgressCallback = (update) => {
        progressHistory.push({ ...update })
      }

      // Simulate a lesson generation flow
      const generationSteps: ProgressUpdate[] = [
        { step: 'Building context', progress: 5, phase: 'init' },
        { step: 'Generating warmup', progress: 10, phase: 'warmup' },
        { step: 'Generating vocabulary', progress: 25, phase: 'vocabulary' },
        { step: 'Generating reading', progress: 45, phase: 'reading' },
        { step: 'Generating comprehension', progress: 55, phase: 'comprehension' },
        { step: 'Generating discussion', progress: 65, phase: 'discussion' },
        { step: 'Generating wrapup', progress: 95, phase: 'wrapup' },
        { step: 'Complete', progress: 100, phase: 'complete' }
      ]

      generationSteps.forEach(step => {
        safeProgressCallback(trackingCallback, step)
      })

      expect(progressHistory).toHaveLength(8)
      expect(progressHistory[0].progress).toBe(5)
      expect(progressHistory[7].progress).toBe(100)
    })

    it('should handle UI update callback that might fail', () => {
      let uiState = { progress: 0, step: '' }
      let updateCount = 0

      const uiCallback: ProgressCallback = (update) => {
        updateCount++
        if (updateCount === 3) {
          // Simulate UI error (e.g., DOM not available)
          throw new Error('UI update failed')
        }
        uiState = { progress: update.progress, step: update.step }
      }

      const updates: ProgressUpdate[] = [
        { step: 'Step 1', progress: 25, phase: 'phase1' },
        { step: 'Step 2', progress: 50, phase: 'phase2' },
        { step: 'Step 3', progress: 75, phase: 'phase3' },
        { step: 'Step 4', progress: 100, phase: 'phase4' }
      ]

      updates.forEach(update => {
        safeProgressCallback(uiCallback, update)
      })

      // UI should have been updated for steps 1, 2, and 4 (3 failed)
      expect(uiState.progress).toBe(100)
      expect(uiState.step).toBe('Step 4')
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })
})
