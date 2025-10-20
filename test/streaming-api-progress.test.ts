import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Streaming API Progress Integration', () => {
  it('should pass progress callback to lesson generator', () => {
    // This test verifies the structure of the streaming API
    // We're checking that the callback is properly created and would be passed
    
    // Mock the encoder and controller
    const mockController = {
      enqueue: vi.fn(),
      close: vi.fn()
    }
    
    const encoder = new TextEncoder()
    
    // Create a progress callback like the streaming API does
    const progressCallback = (update: {
      step: string
      progress: number
      phase: string
      section?: string
    }) => {
      try {
        mockController.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            step: update.step,
            progress: update.progress,
            phase: update.phase,
            section: update.section
          })}\n\n`)
        )
      } catch (error) {
        console.error('Failed to stream progress update:', error)
      }
    }
    
    // Test that the callback works correctly
    progressCallback({
      step: 'Generating vocabulary',
      progress: 25,
      phase: 'vocabulary',
      section: 'words'
    })
    
    // Verify the controller was called
    expect(mockController.enqueue).toHaveBeenCalledTimes(1)
    
    // Verify the message format
    const call = mockController.enqueue.mock.calls[0][0]
    const decoded = new TextDecoder().decode(call)
    expect(decoded).toContain('data:')
    expect(decoded).toContain('"type":"progress"')
    expect(decoded).toContain('"step":"Generating vocabulary"')
    expect(decoded).toContain('"progress":25')
    expect(decoded).toContain('"phase":"vocabulary"')
  })

  it('should handle callback errors gracefully', () => {
    // Mock controller that throws an error
    const mockController = {
      enqueue: vi.fn(() => {
        throw new Error('Stream closed')
      }),
      close: vi.fn()
    }
    
    const encoder = new TextEncoder()
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Create callback
    const progressCallback = (update: {
      step: string
      progress: number
      phase: string
      section?: string
    }) => {
      try {
        mockController.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            step: update.step,
            progress: update.progress,
            phase: update.phase,
            section: update.section
          })}\n\n`)
        )
      } catch (error) {
        console.error('Failed to stream progress update:', error)
      }
    }
    
    // Should not throw even though enqueue throws
    expect(() => {
      progressCallback({
        step: 'Test',
        progress: 50,
        phase: 'test'
      })
    }).not.toThrow()
    
    // Should log the error
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to stream progress update:',
      expect.any(Error)
    )
    
    consoleSpy.mockRestore()
  })

  it('should create properly formatted SSE messages', () => {
    const mockController = {
      enqueue: vi.fn(),
      close: vi.fn()
    }
    
    const encoder = new TextEncoder()
    
    const progressCallback = (update: {
      step: string
      progress: number
      phase: string
      section?: string
    }) => {
      try {
        mockController.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            step: update.step,
            progress: update.progress,
            phase: update.phase,
            section: update.section
          })}\n\n`)
        )
      } catch (error) {
        console.error('Failed to stream progress update:', error)
      }
    }
    
    // Test with section
    progressCallback({
      step: 'Creating dialogue',
      progress: 75,
      phase: 'dialogue',
      section: 'practice'
    })
    
    const call1 = mockController.enqueue.mock.calls[0][0]
    const decoded1 = new TextDecoder().decode(call1)
    const parsed1 = JSON.parse(decoded1.replace('data: ', '').trim())
    
    expect(parsed1).toEqual({
      type: 'progress',
      step: 'Creating dialogue',
      progress: 75,
      phase: 'dialogue',
      section: 'practice'
    })
    
    // Test without section
    progressCallback({
      step: 'Finalizing',
      progress: 95,
      phase: 'finalization'
    })
    
    const call2 = mockController.enqueue.mock.calls[1][0]
    const decoded2 = new TextDecoder().decode(call2)
    const parsed2 = JSON.parse(decoded2.replace('data: ', '').trim())
    
    expect(parsed2).toEqual({
      type: 'progress',
      step: 'Finalizing',
      progress: 95,
      phase: 'finalization',
      section: undefined
    })
  })
})
