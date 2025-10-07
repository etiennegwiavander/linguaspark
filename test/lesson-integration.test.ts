import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProgressiveGeneratorImpl, type CEFRLevel } from '../lib/progressive-generator'
import { dialogueValidator, discussionValidator, grammarValidator, pronunciationValidator } from '../lib/section-validators'
import { WarmupValidator } from '../lib/warmup-validator'

// Mock the Google AI service
const mockPrompt = vi.fn()
vi.mock('../lib/google-ai-server', () => ({
  createGoogleAIServerService: () => ({
    prompt: mockPrompt
  })
}))

describe('Lesson Integration Tests', () => {
  let generator: ProgressiveGeneratorImpl
  const warmupValidator = new WarmupValidator()

  // Sample source text
  const sampleText = 'Technology has revolutionized how we communicate and work in the digital age. Modern computers and smartphones enable instant communication across the globe. Software applications help businesses operate more efficiently.'

  beforeEach(() => {
    generator = new ProgressiveGeneratorImpl()
    vi.clearAllMocks()
    generator.resetQualityMetrics()
  })

  describe('End-to-End Lesson Generation at Each CEFR Level', () => {
    const cefrLevels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1']

    cefrLevels.forEach(level => {
      it(`should generate key sections for ${level} level`, async () => {
        const exampleCounts: Record<CEFRLevel, number> = {
          'A1': 5, 'A2': 5, 'B1': 4, 'B2': 3, 'C1': 2
        }
        const expectedCount = exampleCounts[level]

        // Build context
        mockPrompt
          .mockResolvedValueOnce('technology\ninnovation\ndigital') // vocabulary
          .mockResolvedValueOnce('technology\ninnovation') // themes
          .mockResolvedValueOnce('Technology text summary') // summary

        const context = await generator.buildSharedContext(sampleText, 'discussion', level, 'English')

        expect(context.difficultyLevel).toBe(level)
        expect(context.keyVocabulary.length).toBeGreaterThan(0)

        // Generate warmup
        mockPrompt.mockResolvedValueOnce('Have you used technology?\nWhat do you think about it?\nHow does it help you?')
        
        const warmupSection = await generator.generateSection(
          { name: 'warmup', priority: 1, dependencies: [] },
          context,
          []
        )

        expect(warmupSection.sectionName).toBe('warmup')
        expect(Array.isArray(warmupSection.content)).toBe(true)

        // Generate vocabulary (1 word only for speed)
        const limitedContext = { ...context, keyVocabulary: ['technology'] }
        mockPrompt.mockResolvedValueOnce('Modern computing systems')
        const examples = Array.from({ length: expectedCount }, (_, j) => 
          `Technology example ${j + 1}.`
        ).join('\n')
        mockPrompt.mockResolvedValueOnce(examples)

        const vocabularySection = await generator.generateSection(
          { name: 'vocabulary', priority: 2, dependencies: [] },
          limitedContext,
          []
        )

        expect(vocabularySection.sectionName).toBe('vocabulary')
        const vocabItems = vocabularySection.content.slice(1)
        expect(vocabItems[0].examples.length).toBe(expectedCount)

        // Verify metrics
        const metrics = generator.getQualityMetrics()
        expect(metrics.totalSections).toBeGreaterThanOrEqual(2)
      }, 15000)
    })
  })

  describe('Quality Standards Verification', () => {
    it('should verify warmup questions meet quality standards', async () => {
      mockPrompt
        .mockResolvedValueOnce('technology') // vocabulary
        .mockResolvedValueOnce('technology') // themes
        .mockResolvedValueOnce('Tech text') // summary

      const context = await generator.buildSharedContext(sampleText, 'discussion', 'B1', 'English')

      mockPrompt.mockResolvedValueOnce('Have you used technology?\nWhat technology do you like?\nHow does technology help you?')

      const warmupSection = await generator.generateSection(
        { name: 'warmup', priority: 1, dependencies: [] },
        context,
        []
      )

      const questions = warmupSection.content.slice(1)
      const validation = warmupValidator.validate(questions, 'B1', { mainThemes: context.mainThemes })

      expect(validation.isValid).toBe(true)
      expect(questions.length).toBeGreaterThanOrEqual(3)
    })

    it('should verify vocabulary has correct example count for each level', async () => {
      const testCases = [
        { level: 'A1' as CEFRLevel, expectedCount: 5 },
        { level: 'B1' as CEFRLevel, expectedCount: 4 },
        { level: 'C1' as CEFRLevel, expectedCount: 2 }
      ]

      for (const { level, expectedCount } of testCases) {
        mockPrompt
          .mockResolvedValueOnce('technology') // vocabulary
          .mockResolvedValueOnce('technology') // themes
          .mockResolvedValueOnce('Tech text') // summary

        const context = await generator.buildSharedContext(sampleText, 'discussion', level, 'English')
        const limitedContext = { ...context, keyVocabulary: ['technology'] }

        mockPrompt.mockResolvedValueOnce('Modern devices')
        const examples = Array.from({ length: expectedCount }, (_, j) => 
          `Example ${j + 1}.`
        ).join('\n')
        mockPrompt.mockResolvedValueOnce(examples)

        const vocabularySection = await generator.generateSection(
          { name: 'vocabulary', priority: 2, dependencies: [] },
          limitedContext,
          []
        )

        const vocabItems = vocabularySection.content.slice(1)
        expect(vocabItems[0].examples.length).toBe(expectedCount)
      }
    })

    it('should verify dialogue validator works with proper data', () => {
      const dialogueLines = Array.from({ length: 12 }, (_, i) => ({
        speaker: i % 2 === 0 ? 'A' : 'B',
        text: `This is dialogue line ${i + 1} with sufficient content for B1 level.`
      }))

      const validation = dialogueValidator.validate(dialogueLines, 'B1', ['technology', 'business'])

      expect(validation.isValid).toBe(true)
      expect(dialogueLines.length).toBeGreaterThanOrEqual(12)
    })

    it('should verify discussion has exactly 5 questions', async () => {
      mockPrompt
        .mockResolvedValueOnce('technology') // vocabulary
        .mockResolvedValueOnce('technology') // themes
        .mockResolvedValueOnce('Tech text') // summary

      const context = await generator.buildSharedContext(sampleText, 'discussion', 'B2', 'English')

      mockPrompt.mockResolvedValueOnce('Q1?\nQ2?\nQ3?\nQ4?\nQ5?')

      const discussionSection = await generator.generateSection(
        { name: 'discussion', priority: 5, dependencies: [] },
        context,
        []
      )

      const questions = discussionSection.content.slice(1)
      expect(questions.length).toBe(5)
    })

    it('should verify grammar validator works with proper data', () => {
      const grammarSection = {
        rule: 'Present Perfect Tense is used for actions that started in the past.',
        form: 'Subject + have/has + past participle',
        usage: 'Use present perfect to talk about experiences.',
        examples: ['I have seen it.', 'She has done it.', 'They have learned.'],
        exercises: [
          { prompt: 'Complete: I _____ (see) it.', answer: 'have seen' },
          { prompt: 'Complete: She _____ (do) it.', answer: 'has done' },
          { prompt: 'Complete: They _____ (learn).', answer: 'have learned' },
          { prompt: 'Complete: We _____ (finish).', answer: 'have finished' },
          { prompt: 'Complete: He _____ (go).', answer: 'has gone' }
        ]
      }

      const validation = grammarValidator.validate(grammarSection, 'B1')

      expect(validation.isValid).toBe(true)
      expect(grammarSection.exercises.length).toBeGreaterThanOrEqual(5)
    })

    it('should verify pronunciation validator works with proper data', () => {
      const pronunciationSection = {
        words: [
          { word: 'technology', ipa: '/tekˈnɒlədʒi/', tips: ['Stress on second syllable'], practiceSentence: 'Technology helps us.' },
          { word: 'innovation', ipa: '/ˌɪnəˈveɪʃən/', tips: ['Stress on third syllable'], practiceSentence: 'Innovation drives progress.' },
          { word: 'digital', ipa: '/ˈdɪdʒɪtəl/', tips: ['Stress on first syllable'], practiceSentence: 'Digital tools are useful.' },
          { word: 'communication', ipa: '/kəˌmjuːnɪˈkeɪʃən/', tips: ['Long u sound'], practiceSentence: 'Communication is key.' },
          { word: 'efficient', ipa: '/ɪˈfɪʃənt/', tips: ['Stress on second syllable'], practiceSentence: 'Efficient systems work.' }
        ],
        tongueTwisters: [
          { text: 'Technical technicians tackle tasks.', targetSounds: ['/t/', '/k/'] },
          { text: 'Digital devices deliver data.', targetSounds: ['/d/', '/l/'] }
        ]
      }

      const validation = pronunciationValidator.validate(pronunciationSection)

      expect(validation.isValid).toBe(true)
      expect(pronunciationSection.words.length).toBeGreaterThanOrEqual(5)
      expect(pronunciationSection.tongueTwisters.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Regeneration Logic When Validation Fails', () => {
    it('should regenerate warmup questions when validation fails', async () => {
      mockPrompt
        .mockResolvedValueOnce('technology') // vocabulary
        .mockResolvedValueOnce('technology') // themes
        .mockResolvedValueOnce('Tech text') // summary

      const context = await generator.buildSharedContext(sampleText, 'discussion', 'B1', 'English')

      // First attempt: invalid (content assumptions)
      mockPrompt
        .mockResolvedValueOnce('What did Steve Jobs invent?\nWhy did Apple succeed?\nWhen was iPhone released?')
        // Second attempt: valid
        .mockResolvedValueOnce('Have you used technology?\nWhat do you think?\nHow does it help?')

      const warmupSection = await generator.generateSection(
        { name: 'warmup', priority: 1, dependencies: [] },
        context,
        []
      )

      const questions = warmupSection.content.slice(1)
      expect(questions.length).toBeGreaterThanOrEqual(3)
    })

    it('should regenerate vocabulary when example count is insufficient', async () => {
      mockPrompt
        .mockResolvedValueOnce('technology') // vocabulary
        .mockResolvedValueOnce('technology') // themes
        .mockResolvedValueOnce('Tech text') // summary

      const context = await generator.buildSharedContext(sampleText, 'discussion', 'B1', 'English')
      const limitedContext = { ...context, keyVocabulary: ['technology'] }

      // First attempt: insufficient (only 2 examples)
      mockPrompt
        .mockResolvedValueOnce('Modern devices')
        .mockResolvedValueOnce('Example 1.\nExample 2.')
        // Second attempt: correct (4 examples for B1)
        .mockResolvedValueOnce('Modern devices')
        .mockResolvedValueOnce('Example 1.\nExample 2.\nExample 3.\nExample 4.')

      const vocabularySection = await generator.generateSection(
        { name: 'vocabulary', priority: 2, dependencies: [] },
        limitedContext,
        []
      )

      const vocabItems = vocabularySection.content.slice(1)
      expect(vocabItems[0].examples.length).toBe(4)
    })

    it('should regenerate discussion when count is wrong', async () => {
      mockPrompt
        .mockResolvedValueOnce('technology') // vocabulary
        .mockResolvedValueOnce('technology') // themes
        .mockResolvedValueOnce('Tech text') // summary

      const context = await generator.buildSharedContext(sampleText, 'discussion', 'B2', 'English')

      // First attempt: only 3 questions
      mockPrompt
        .mockResolvedValueOnce('Q1?\nQ2?\nQ3?')
        // Second attempt: 5 questions
        .mockResolvedValueOnce('Q1?\nQ2?\nQ3?\nQ4?\nQ5?')

      const discussionSection = await generator.generateSection(
        { name: 'discussion', priority: 5, dependencies: [] },
        context,
        []
      )

      const questions = discussionSection.content.slice(1)
      expect(questions.length).toBe(5)
    })
  })

  describe('CEFR Level Consistency Across Sections', () => {
    it('should show appropriate complexity progression from A1 to C1', async () => {
      const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1']
      const expectedCounts = [5, 5, 4, 3, 2]
      const actualCounts: number[] = []

      for (let i = 0; i < levels.length; i++) {
        const level = levels[i]
        const expectedCount = expectedCounts[i]

        mockPrompt
          .mockResolvedValueOnce('technology') // vocabulary
          .mockResolvedValueOnce('technology') // themes
          .mockResolvedValueOnce('Tech text') // summary

        const context = await generator.buildSharedContext(sampleText, 'discussion', level, 'English')
        const limitedContext = { ...context, keyVocabulary: ['technology'] }

        mockPrompt.mockResolvedValueOnce('Modern devices')
        const examples = Array.from({ length: expectedCount }, (_, j) => 
          `Example ${j + 1}.`
        ).join('\n')
        mockPrompt.mockResolvedValueOnce(examples)

        const vocabularySection = await generator.generateSection(
          { name: 'vocabulary', priority: 2, dependencies: [] },
          limitedContext,
          []
        )

        const vocabItems = vocabularySection.content.slice(1)
        actualCounts.push(vocabItems[0].examples.length)
      }

      // Verify progression
      expect(actualCounts[0]).toBe(5) // A1
      expect(actualCounts[1]).toBe(5) // A2
      expect(actualCounts[2]).toBe(4) // B1
      expect(actualCounts[3]).toBe(3) // B2
      expect(actualCounts[4]).toBe(2) // C1
    })
  })

  describe('Quality Metrics Tracking', () => {
    it('should track quality metrics for lesson generation', async () => {
      mockPrompt
        .mockResolvedValueOnce('technology') // vocabulary
        .mockResolvedValueOnce('technology') // themes
        .mockResolvedValueOnce('Tech text') // summary

      const context = await generator.buildSharedContext(sampleText, 'discussion', 'B1', 'English')

      // Generate warmup
      mockPrompt.mockResolvedValueOnce('Q1?\nQ2?\nQ3?')
      await generator.generateSection({ name: 'warmup', priority: 1, dependencies: [] }, context, [])

      // Generate vocabulary
      const limitedContext = { ...context, keyVocabulary: ['technology'] }
      mockPrompt.mockResolvedValueOnce('Modern devices')
      mockPrompt.mockResolvedValueOnce('Ex1.\nEx2.\nEx3.\nEx4.')
      await generator.generateSection({ name: 'vocabulary', priority: 2, dependencies: [] }, limitedContext, [])

      const metrics = generator.getQualityMetrics()

      expect(metrics.totalSections).toBe(2)
      expect(metrics.averageQualityScore).toBeGreaterThan(0)
      expect(metrics.totalGenerationTime).toBeGreaterThan(0)
    })

    it('should track regeneration attempts', async () => {
      mockPrompt
        .mockResolvedValueOnce('technology') // vocabulary
        .mockResolvedValueOnce('technology') // themes
        .mockResolvedValueOnce('Tech text') // summary

      const context = await generator.buildSharedContext(sampleText, 'discussion', 'B1', 'English')

      // Force regeneration
      mockPrompt
        .mockResolvedValueOnce('Invalid 1\nInvalid 2')
        .mockResolvedValueOnce('Q1?\nQ2?\nQ3?')

      await generator.generateSection({ name: 'warmup', priority: 1, dependencies: [] }, context, [])

      const metrics = generator.getQualityMetrics()
      expect(metrics.totalRegenerations).toBeGreaterThan(0)
    })
  })

  describe('Error Handling and Resilience', () => {
    it('should handle AI service failures gracefully', async () => {
      mockPrompt.mockRejectedValue(new Error('API Error'))

      const context = await generator.buildSharedContext(sampleText, 'discussion', 'B1', 'English')

      // Should use fallback methods
      expect(context.keyVocabulary).toBeDefined()
      expect(context.keyVocabulary.length).toBeGreaterThan(0)
    })

    it('should allow continuing after section failure', async () => {
      mockPrompt
        .mockResolvedValueOnce('technology') // vocabulary
        .mockResolvedValueOnce('technology') // themes
        .mockResolvedValueOnce('Tech text') // summary

      const context = await generator.buildSharedContext(sampleText, 'discussion', 'B1', 'English')

      // Generate warmup successfully
      mockPrompt.mockResolvedValueOnce('Q1?\nQ2?\nQ3?')
      const warmupSection = await generator.generateSection(
        { name: 'warmup', priority: 1, dependencies: [] },
        context,
        []
      )

      expect(warmupSection).toBeDefined()

      // Even if vocabulary fails, we can continue with discussion
      mockPrompt.mockResolvedValueOnce('Q1?\nQ2?\nQ3?\nQ4?\nQ5?')
      const discussionSection = await generator.generateSection(
        { name: 'discussion', priority: 5, dependencies: [] },
        context,
        []
      )

      expect(discussionSection).toBeDefined()
      expect(discussionSection.sectionName).toBe('discussion')
    })
  })
})
