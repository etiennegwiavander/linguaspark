import { describe, it, expect, beforeEach } from 'vitest'
import { AIOptimizer } from '@/lib/ai-optimizer'

describe('AIOptimizer', () => {
  let optimizer: AIOptimizer

  beforeEach(() => {
    optimizer = new AIOptimizer()
  })

  describe('optimizePrompt', () => {
    it('should optimize vocabulary section prompt', () => {
      const section = 'vocabulary'
      const context = {
        keyVocabulary: ['climate', 'environment', 'sustainability'],
        mainThemes: ['environmental science'],
        difficultyLevel: 'B1' as const,
        contentSummary: 'Article about climate change and environmental protection'
      }

      const result = optimizer.optimizePrompt(section, context)

      expect(result.prompt).toContain('vocabulary')
      expect(result.estimatedTokens).toBeLessThan(500)
      expect(result.optimizationStrategy).toBe('focused_vocabulary_extraction')
      expect(result.prompt).toContain('B1')
    })

    it('should optimize reading passage prompt', () => {
      const section = 'reading'
      const context = {
        keyVocabulary: ['technology', 'innovation', 'digital'],
        mainThemes: ['technology advancement'],
        difficultyLevel: 'B2' as const,
        contentSummary: 'Technology trends and digital transformation'
      }

      const result = optimizer.optimizePrompt(section, context)

      expect(result.prompt).toContain('reading')
      expect(result.estimatedTokens).toBeLessThan(800)
      expect(result.optimizationStrategy).toBe('content_summarization')
    })

    it('should optimize comprehension questions prompt', () => {
      const section = 'comprehension'
      const context = {
        keyVocabulary: ['history', 'culture', 'tradition'],
        mainThemes: ['cultural heritage'],
        difficultyLevel: 'A2' as const,
        contentSummary: 'Cultural traditions and historical significance'
      }

      const result = optimizer.optimizePrompt(section, context)

      expect(result.prompt).toContain('comprehension')
      expect(result.estimatedTokens).toBeLessThan(400)
      expect(result.optimizationStrategy).toBe('batch_question_generation')
    })

    it('should optimize dialogue prompt with context reuse', () => {
      const section = 'dialogue'
      const context = {
        keyVocabulary: ['travel', 'hotel', 'reservation'],
        mainThemes: ['travel and tourism'],
        difficultyLevel: 'A2' as const,
        contentSummary: 'Hotel booking and travel arrangements'
      }

      const result = optimizer.optimizePrompt(section, context)

      expect(result.prompt).toContain('dialogue')
      expect(result.estimatedTokens).toBeLessThan(600)
      expect(result.optimizationStrategy).toBe('vocabulary_reuse')
      expect(result.prompt).toContain('travel')
    })
  })

  describe('extractKeyTerms', () => {
    it('should extract key terms from educational content', () => {
      const content = 'Artificial intelligence and machine learning are transforming modern technology. Deep learning algorithms process vast amounts of data to identify patterns and make predictions.'

      const terms = optimizer.extractKeyTerms(content)

      expect(terms).toContain('artificial intelligence')
      expect(terms).toContain('machine learning')
      expect(terms).toContain('deep learning')
      expect(terms).toContain('algorithms')
      expect(terms.length).toBeLessThanOrEqual(10)
    })

    it('should prioritize domain-specific vocabulary', () => {
      const content = 'The cardiovascular system includes the heart, blood vessels, and blood. The heart pumps blood through arteries and veins to deliver oxygen and nutrients to body tissues.'

      const terms = optimizer.extractKeyTerms(content)

      expect(terms).toContain('cardiovascular system')
      expect(terms).toContain('blood vessels')
      expect(terms).toContain('arteries')
      expect(terms).toContain('nutrients')
    })

    it('should handle content with mixed complexity levels', () => {
      const content = 'Climate change affects weather patterns globally. Scientists use sophisticated models to predict future environmental conditions and assess potential impacts on ecosystems.'

      const terms = optimizer.extractKeyTerms(content)

      expect(terms.length).toBeGreaterThan(3)
      expect(terms.length).toBeLessThanOrEqual(10)
      expect(terms.some(term => term.includes('climate'))).toBe(true)
    })

    it('should filter out common words and focus on content-specific terms', () => {
      const content = 'The economic impact of globalization has been significant. International trade agreements facilitate commerce between nations and promote economic growth.'

      const terms = optimizer.extractKeyTerms(content)

      expect(terms).not.toContain('the')
      expect(terms).not.toContain('has')
      expect(terms).not.toContain('been')
      expect(terms).toContain('globalization')
      expect(terms).toContain('international trade')
    })
  })

  describe('summarizeContent', () => {
    it('should create concise summary within token limit', () => {
      const content = 'Renewable energy sources such as solar, wind, and hydroelectric power are becoming increasingly important in the fight against climate change. These technologies offer sustainable alternatives to fossil fuels and can significantly reduce greenhouse gas emissions. Solar panels convert sunlight into electricity, wind turbines harness wind power, and hydroelectric dams use flowing water to generate clean energy.'
      const maxLength = 100

      const summary = optimizer.summarizeContent(content, maxLength)

      expect(summary.length).toBeLessThanOrEqual(maxLength)
      expect(summary).toContain('renewable energy')
      expect(summary).toContain('climate change')
    })

    it('should preserve key information in summary', () => {
      const content = 'The human brain contains approximately 86 billion neurons that communicate through electrical and chemical signals. Neurotransmitters play a crucial role in this communication process, affecting mood, behavior, and cognitive functions.'
      const maxLength = 80

      const summary = optimizer.summarizeContent(content, maxLength)

      expect(summary.length).toBeLessThanOrEqual(maxLength)
      expect(summary.toLowerCase()).toMatch(/brain|neuron|neurotransmitter/)
    })

    it('should handle short content appropriately', () => {
      const content = 'Short content example.'
      const maxLength = 100

      const summary = optimizer.summarizeContent(content, maxLength)

      expect(summary).toBe(content)
    })
  })

  describe('batchPrompts', () => {
    it('should batch compatible prompts together', () => {
      const prompts = [
        { section: 'vocabulary', content: 'vocab prompt 1', estimatedTokens: 200 },
        { section: 'vocabulary', content: 'vocab prompt 2', estimatedTokens: 150 },
        { section: 'comprehension', content: 'comp prompt 1', estimatedTokens: 300 },
        { section: 'comprehension', content: 'comp prompt 2', estimatedTokens: 250 }
      ]

      const batched = optimizer.batchPrompts(prompts)

      expect(batched.length).toBeLessThan(prompts.length)
      expect(batched.some(batch => batch.sections.includes('vocabulary'))).toBe(true)
      expect(batched.some(batch => batch.sections.includes('comprehension'))).toBe(true)
    })

    it('should respect token limits when batching', () => {
      const prompts = [
        { section: 'vocabulary', content: 'prompt 1', estimatedTokens: 800 },
        { section: 'vocabulary', content: 'prompt 2', estimatedTokens: 800 },
        { section: 'reading', content: 'prompt 3', estimatedTokens: 400 }
      ]

      const batched = optimizer.batchPrompts(prompts)

      batched.forEach(batch => {
        expect(batch.totalTokens).toBeLessThanOrEqual(1000)
      })
    })

    it('should maintain prompt order within batches', () => {
      const prompts = [
        { section: 'warmup', content: 'warmup prompt', estimatedTokens: 100 },
        { section: 'vocabulary', content: 'vocab prompt', estimatedTokens: 200 },
        { section: 'reading', content: 'reading prompt', estimatedTokens: 300 }
      ]

      const batched = optimizer.batchPrompts(prompts)

      expect(batched[0].sections[0]).toBe('warmup')
    })
  })

  describe('token optimization effectiveness', () => {
    it('should achieve significant token reduction', () => {
      const originalContent = 'This is a very long piece of content that would normally consume many tokens when processed by AI. '.repeat(20)
      const section = 'vocabulary'
      const context = {
        keyVocabulary: ['content', 'tokens', 'processing'],
        mainThemes: ['AI optimization'],
        difficultyLevel: 'B1' as const,
        contentSummary: 'Content about AI token optimization'
      }

      const optimized = optimizer.optimizePrompt(section, context)
      const originalEstimate = originalContent.length / 4 // rough token estimate

      expect(optimized.estimatedTokens).toBeLessThan(originalEstimate * 0.7)
    })

    it('should maintain quality while reducing tokens', () => {
      const section = 'comprehension'
      const context = {
        keyVocabulary: ['science', 'research', 'discovery'],
        mainThemes: ['scientific method'],
        difficultyLevel: 'B2' as const,
        contentSummary: 'Scientific research methodology and discoveries'
      }

      const optimized = optimizer.optimizePrompt(section, context)

      expect(optimized.prompt).toContain('comprehension')
      expect(optimized.prompt).toContain('B2')
      expect(optimized.prompt).toContain('science')
      expect(optimized.estimatedTokens).toBeLessThan(500)
    })
  })

  describe('optimization strategies', () => {
    it('should use appropriate strategy for each section type', () => {
      const sections = ['vocabulary', 'reading', 'comprehension', 'dialogue', 'warmup']
      const context = {
        keyVocabulary: ['test'],
        mainThemes: ['testing'],
        difficultyLevel: 'B1' as const,
        contentSummary: 'Test content'
      }

      sections.forEach(section => {
        const result = optimizer.optimizePrompt(section, context)
        expect(result.optimizationStrategy).toBeDefined()
        expect(result.optimizationStrategy.length).toBeGreaterThan(0)
      })
    })

    it('should adapt optimization based on difficulty level', () => {
      const section = 'vocabulary'
      const baseContext = {
        keyVocabulary: ['advanced', 'terminology'],
        mainThemes: ['academic writing'],
        contentSummary: 'Academic text with complex vocabulary'
      }

      const a1Result = optimizer.optimizePrompt(section, { ...baseContext, difficultyLevel: 'A1' })
      const c1Result = optimizer.optimizePrompt(section, { ...baseContext, difficultyLevel: 'C1' })

      expect(a1Result.prompt).not.toBe(c1Result.prompt)
      expect(a1Result.estimatedTokens).toBeLessThanOrEqual(c1Result.estimatedTokens)
    })
  })
})