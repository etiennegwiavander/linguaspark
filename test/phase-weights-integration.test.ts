import { describe, it, expect } from 'vitest'
import { ProgressiveGeneratorImpl, DEFAULT_PHASE_WEIGHTS } from '../lib/progressive-generator'

describe('Phase Weights Integration', () => {
  it('should demonstrate progress calculation during lesson generation', () => {
    const generator = new ProgressiveGeneratorImpl()
    const lessonType = 'discussion'
    const completedSections: string[] = []
    
    // Simulate lesson generation progress
    console.log('\n📊 Simulating Discussion Lesson Generation Progress:\n')
    
    // Start: 0%
    let progress = generator.calculateProgress(completedSections, 'warmup', lessonType)
    console.log(`Starting generation: ${progress}%`)
    expect(progress).toBe(0)
    
    // After warmup
    completedSections.push('warmup')
    progress = generator.calculateProgress(completedSections, 'vocabulary', lessonType)
    console.log(`After warmup: ${progress}%`)
    expect(progress).toBeGreaterThan(0)
    expect(progress).toBeLessThan(100)
    
    // After vocabulary
    completedSections.push('vocabulary')
    progress = generator.calculateProgress(completedSections, 'reading', lessonType)
    console.log(`After vocabulary: ${progress}%`)
    expect(progress).toBeGreaterThan(14)
    
    // After reading (heaviest section)
    completedSections.push('reading')
    progress = generator.calculateProgress(completedSections, 'comprehension', lessonType)
    console.log(`After reading: ${progress}%`)
    expect(progress).toBeGreaterThan(50)
    
    // After comprehension
    completedSections.push('comprehension')
    progress = generator.calculateProgress(completedSections, 'discussion', lessonType)
    console.log(`After comprehension: ${progress}%`)
    expect(progress).toBeGreaterThan(60)
    
    // After discussion
    completedSections.push('discussion')
    progress = generator.calculateProgress(completedSections, 'wrapup', lessonType)
    console.log(`After discussion: ${progress}%`)
    expect(progress).toBeGreaterThan(85)
    
    // Complete
    completedSections.push('wrapup')
    progress = generator.calculateProgress(completedSections, 'complete', lessonType)
    console.log(`Complete: ${progress}%\n`)
    expect(progress).toBe(100)
  })

  it('should show different progress curves for different lesson types', () => {
    const generator = new ProgressiveGeneratorImpl()
    
    // Compare progress after same sections for different lesson types
    const completedSections = ['warmup', 'vocabulary', 'reading']
    
    const discussionProgress = generator.calculateProgress(completedSections, 'comprehension', 'discussion')
    const grammarProgress = generator.calculateProgress(completedSections, 'comprehension', 'grammar')
    const pronunciationProgress = generator.calculateProgress(completedSections, 'comprehension', 'pronunciation')
    
    console.log('\n📊 Progress Comparison After Same Sections:\n')
    console.log(`Discussion lesson: ${discussionProgress}%`)
    console.log(`Grammar lesson: ${grammarProgress}%`)
    console.log(`Pronunciation lesson: ${pronunciationProgress}%\n`)
    
    // All should be similar since they have similar total weights
    expect(discussionProgress).toBeGreaterThan(50)
    expect(grammarProgress).toBeGreaterThan(50)
    expect(pronunciationProgress).toBeGreaterThan(50)
  })

  it('should demonstrate proportional progress with custom weights', () => {
    const generator = new ProgressiveGeneratorImpl()
    
    // Scenario: Reading is very complex and takes longer
    const customWeights = {
      warmup: 5,
      vocabulary: 10,
      reading: 40,  // Much heavier weight
      comprehension: 10,
      discussion: 10,
      wrapup: 5
    }
    
    console.log('\n📊 Custom Weights (Heavy Reading Section):\n')
    
    let progress = generator.calculateProgress(['warmup', 'vocabulary'], 'reading', 'discussion', customWeights)
    console.log(`Before reading: ${progress}%`)
    expect(progress).toBeLessThan(25) // Should be low since reading is heavy
    
    progress = generator.calculateProgress(['warmup', 'vocabulary', 'reading'], 'comprehension', 'discussion', customWeights)
    console.log(`After reading: ${progress}%`)
    expect(progress).toBeGreaterThan(60) // Big jump after completing heavy section
    
    console.log('')
  })

  it('should handle real-world scenario with multiple AI calls per section', () => {
    const generator = new ProgressiveGeneratorImpl()
    const lessonType = 'grammar'
    
    console.log('\n📊 Real-World Scenario: Multiple AI Calls\n')
    
    // Vocabulary section might make multiple AI calls (one per word)
    // But we only count the section once when complete
    const afterVocabStart = generator.calculateProgress(['warmup'], 'vocabulary', lessonType)
    const afterVocabComplete = generator.calculateProgress(['warmup', 'vocabulary'], 'reading', lessonType)
    
    console.log(`Vocabulary started: ${afterVocabStart}%`)
    console.log(`Vocabulary completed: ${afterVocabComplete}%`)
    
    const progressGain = afterVocabComplete - afterVocabStart
    console.log(`Progress gain from vocabulary: ${progressGain}%\n`)
    
    // Should show meaningful progress gain
    expect(progressGain).toBeGreaterThan(10)
    expect(progressGain).toBeLessThan(30)
  })

  it('should verify phase weights match design document', () => {
    // Verify weights match the design document specifications
    expect(DEFAULT_PHASE_WEIGHTS.warmup).toBe(10)
    expect(DEFAULT_PHASE_WEIGHTS.vocabulary).toBe(15)
    expect(DEFAULT_PHASE_WEIGHTS.reading).toBe(20)
    expect(DEFAULT_PHASE_WEIGHTS.comprehension).toBe(10)
    expect(DEFAULT_PHASE_WEIGHTS.discussion).toBe(10)
    expect(DEFAULT_PHASE_WEIGHTS.dialogue).toBe(15)
    expect(DEFAULT_PHASE_WEIGHTS.grammar).toBe(15)
    expect(DEFAULT_PHASE_WEIGHTS.pronunciation).toBe(15)
    expect(DEFAULT_PHASE_WEIGHTS.wrapup).toBe(5)
    
    console.log('\n✅ Phase weights match design document specifications\n')
  })
})
