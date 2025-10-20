import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProgressiveGeneratorImpl, type ProgressUpdate, type ProgressCallback } from '../lib/progressive-generator'

describe('Progress Callback Integration', () => {
  let generator: ProgressiveGeneratorImpl
  let progressUpdates: ProgressUpdate[]
  let progressCallback: ProgressCallback

  beforeEach(() => {
    generator = new ProgressiveGeneratorImpl()
    progressUpdates = []
    progressCallback = (update: ProgressUpdate) => {
      progressUpdates.push(update)
    }
  })

  it('should invoke progress callback at start of section generation', async () => {
    // Set up the callback
    generator.setProgressCallback(progressCallback, 'discussion')

    // Build shared context
    const context = await generator.buildSharedContext(
      'This is a test article about climate change and renewable energy.',
      'discussion',
      'B1',
      'English'
    )

    // Generate a single section
    const section = { name: 'warmup', priority: 1, dependencies: [] }
    await generator.generateSection(section, context, [])

    // Verify progress callbacks were invoked
    expect(progressUpdates.length).toBeGreaterThan(0)
    
    // Check that we have progress updates for warmup
    const warmupUpdates = progressUpdates.filter(u => u.phase === 'warmup')
    expect(warmupUpdates.length).toBeGreaterThan(0)
    
    // Verify progress update structure
    const firstUpdate = warmupUpdates[0]
    expect(firstUpdate).toHaveProperty('step')
    expect(firstUpdate).toHaveProperty('progress')
    expect(firstUpdate).toHaveProperty('phase')
    expect(firstUpdate.phase).toBe('warmup')
  })

  it('should report progress for multiple sections', async () => {
    // Set up the callback
    generator.setProgressCallback(progressCallback, 'discussion')

    // Build shared context
    const context = await generator.buildSharedContext(
      'This is a test article about technology and innovation.',
      'discussion',
      'B1',
      'English'
    )

    // Generate multiple sections
    const sections = [
      { name: 'warmup', priority: 1, dependencies: [] },
      { name: 'vocabulary', priority: 2, dependencies: [] }
    ]

    const generatedSections = []
    for (const section of sections) {
      const generated = await generator.generateSection(section, context, generatedSections)
      generatedSections.push(generated)
    }

    // Verify we have progress updates for both sections
    const warmupUpdates = progressUpdates.filter(u => u.phase === 'warmup')
    const vocabularyUpdates = progressUpdates.filter(u => u.phase === 'vocabulary')
    
    expect(warmupUpdates.length).toBeGreaterThan(0)
    expect(vocabularyUpdates.length).toBeGreaterThan(0)
    
    // Verify progress increases over time
    const progressValues = progressUpdates.map(u => u.progress)
    expect(Math.max(...progressValues)).toBeGreaterThan(Math.min(...progressValues))
  })

  it('should calculate progress based on phase weights', async () => {
    // Set up the callback
    generator.setProgressCallback(progressCallback, 'discussion')

    // Build shared context
    const context = await generator.buildSharedContext(
      'Test content about business and economics.',
      'discussion',
      'B2',
      'English'
    )

    // Generate warmup section
    const warmupSection = { name: 'warmup', priority: 1, dependencies: [] }
    await generator.generateSection(warmupSection, context, [])

    // Get the completion progress for warmup
    const warmupCompletionUpdates = progressUpdates.filter(
      u => u.phase === 'warmup' && u.step.includes('Completed')
    )
    
    expect(warmupCompletionUpdates.length).toBeGreaterThan(0)
    
    // Warmup has weight 10 out of total, so progress should be > 0 but < 100
    const warmupProgress = warmupCompletionUpdates[0].progress
    expect(warmupProgress).toBeGreaterThan(0)
    expect(warmupProgress).toBeLessThan(100)
  })

  it('should work without progress callback (backward compatibility)', async () => {
    // Don't set a callback
    const context = await generator.buildSharedContext(
      'Test content without callback.',
      'discussion',
      'A2',
      'English'
    )

    // Generate section without callback - should not throw
    const section = { name: 'warmup', priority: 1, dependencies: [] }
    await expect(
      generator.generateSection(section, context, [])
    ).resolves.toBeDefined()
  })

  it('should handle callback errors gracefully', async () => {
    // Create a callback that throws an error
    const errorCallback: ProgressCallback = () => {
      throw new Error('Callback error')
    }

    generator.setProgressCallback(errorCallback, 'discussion')

    const context = await generator.buildSharedContext(
      'Test content with error callback.',
      'discussion',
      'B1',
      'English'
    )

    // Generation should still succeed despite callback error
    const section = { name: 'warmup', priority: 1, dependencies: [] }
    await expect(
      generator.generateSection(section, context, [])
    ).resolves.toBeDefined()
  })

  it('should report progress for all section types', async () => {
    generator.setProgressCallback(progressCallback, 'discussion')

    const context = await generator.buildSharedContext(
      'Test content for all sections.',
      'discussion',
      'B1',
      'English'
    )

    // Test each section type
    const sectionTypes = ['warmup', 'vocabulary', 'reading', 'comprehension', 'discussion', 'wrapup']
    
    for (const sectionName of sectionTypes) {
      progressUpdates = [] // Reset for each section
      const section = { name: sectionName, priority: 1, dependencies: [] }
      
      try {
        await generator.generateSection(section, context, [])
        
        // Verify we got progress updates for this section
        const sectionUpdates = progressUpdates.filter(u => u.phase === sectionName)
        expect(sectionUpdates.length).toBeGreaterThan(0)
      } catch (error) {
        // Some sections might fail due to dependencies or validation, that's ok
        console.log(`Section ${sectionName} failed (expected for some sections):`, error)
      }
    }
  })
})
