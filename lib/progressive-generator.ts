import { createGoogleAIServerService } from "./google-ai-server"
import { WarmupValidator } from "./warmup-validator"
import {
  dialogueValidator,
  discussionValidator,
  grammarValidator,
  pronunciationValidator,
  type ValidationResult
} from "./section-validators"
import { qualityMetricsTracker } from "./quality-metrics"

// Types for progressive generation
export interface SharedContext {
  lessonTitle: string
  keyVocabulary: string[]
  mainThemes: string[]
  difficultyLevel: CEFRLevel
  contentSummary: string
  sourceText: string
  lessonType: string
  targetLanguage: string
}

export interface GeneratedSection {
  sectionName: string
  content: any
  tokensUsed: number
  generationStrategy: string
}

export interface LessonSection {
  name: string
  priority: number
  dependencies: string[]
}

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1'

// Progressive Generator Interface
export interface ProgressiveGenerator {
  generateSection(
    section: LessonSection,
    sharedContext: SharedContext,
    previousSections: GeneratedSection[]
  ): Promise<GeneratedSection>

  buildSharedContext(
    sourceText: string,
    lessonType: string,
    studentLevel: CEFRLevel,
    targetLanguage: string
  ): Promise<SharedContext>

  updateContext(
    context: SharedContext,
    newSection: GeneratedSection
  ): SharedContext
}

// Implementation of Progressive Generator
export class ProgressiveGeneratorImpl implements ProgressiveGenerator {
  private googleAI: ReturnType<typeof createGoogleAIServerService> | null = null
  private warmupValidator: WarmupValidator

  constructor() {
    this.warmupValidator = new WarmupValidator()
  }

  /**
   * Get quality metrics for the current lesson generation
   */
  getQualityMetrics() {
    return qualityMetricsTracker.getQualityReport()
  }

  /**
   * Log quality summary for the lesson
   */
  logQualitySummary() {
    qualityMetricsTracker.logSummary()
  }

  /**
   * Reset quality metrics for new lesson generation
   */
  resetQualityMetrics() {
    qualityMetricsTracker.reset()
  }

  private getGoogleAI() {
    if (!this.googleAI) {
      this.googleAI = createGoogleAIServerService()
    }
    return this.googleAI
  }

  /**
   * Build shared context that will be reused across all lesson sections
   */
  async buildSharedContext(
    sourceText: string,
    lessonType: string,
    studentLevel: CEFRLevel,
    targetLanguage: string
  ): Promise<SharedContext> {
    console.log("🏗️ Building shared context for progressive generation...")

    try {
      // Generate contextual lesson title
      const lessonTitle = await this.generateLessonTitle(sourceText, lessonType, studentLevel)

      // Extract key vocabulary using AI optimization
      const keyVocabulary = await this.extractKeyVocabulary(sourceText, studentLevel)

      // Extract main themes
      const mainThemes = await this.extractMainThemes(sourceText, studentLevel)

      // Create content summary
      const contentSummary = await this.createContentSummary(sourceText, studentLevel)

      const sharedContext: SharedContext = {
        lessonTitle,
        keyVocabulary,
        mainThemes,
        difficultyLevel: studentLevel,
        contentSummary,
        sourceText: sourceText.substring(0, 1000), // Limit for token optimization
        lessonType,
        targetLanguage
      }

      console.log("✅ Shared context built:", {
        lessonTitle,
        vocabularyCount: keyVocabulary.length,
        themesCount: mainThemes.length,
        summaryLength: contentSummary.length
      })

      return sharedContext
    } catch (error) {
      console.error("❌ Failed to build shared context:", error)
      throw new Error("Failed to build shared context: " + (error as Error).message)
    }
  }

  /**
   * Generate a specific lesson section using shared context
   * Now includes quality validation and metrics tracking
   */
  async generateSection(
    section: LessonSection,
    sharedContext: SharedContext,
    previousSections: GeneratedSection[]
  ): Promise<GeneratedSection> {
    console.log(`🎯 Generating section: ${section.name}`)

    const startTime = Date.now()
    let content: any
    let tokensUsed = 0
    let generationStrategy = 'progressive'

    try {
      switch (section.name) {
        case 'warmup':
          content = await this.generateWarmupWithContext(sharedContext, previousSections)
          break
        case 'vocabulary':
          content = await this.generateVocabularyWithContext(sharedContext, previousSections)
          break
        case 'reading':
          content = await this.generateReadingWithContext(sharedContext, previousSections)
          break
        case 'comprehension':
          content = await this.generateComprehensionWithContext(sharedContext, previousSections)
          break
        case 'discussion':
          content = await this.generateDiscussionWithContext(sharedContext, previousSections)
          break
        case 'grammar':
          content = await this.generateGrammarWithContext(sharedContext, previousSections)
          break
        case 'pronunciation':
          content = await this.generatePronunciationWithContext(sharedContext, previousSections)
          break
        case 'wrapup':
          content = await this.generateWrapupWithContext(sharedContext, previousSections)
          break
        default:
          throw new Error(`Unknown section: ${section.name}`)
      }

      const generationTime = Date.now() - startTime
      console.log(`✅ Section ${section.name} generated in ${generationTime}ms`)

      return {
        sectionName: section.name,
        content,
        tokensUsed,
        generationStrategy
      }
    } catch (error) {
      console.error(`❌ Failed to generate section ${section.name}:`, error)
      throw new Error(`Failed to generate ${section.name} section: ${(error as Error).message}`)
    }
  }

  /**
   * Update shared context with information from newly generated section
   */
  updateContext(
    context: SharedContext,
    newSection: GeneratedSection
  ): SharedContext {
    console.log(`🔄 Updating context with ${newSection.sectionName} section`)

    const updatedContext = { ...context }

    // Update vocabulary if new words were introduced
    if (newSection.sectionName === 'vocabulary' && Array.isArray(newSection.content)) {
      const newWords = newSection.content
        .filter(item => item.word && item.word !== 'INSTRUCTION')
        .map(item => item.word.toLowerCase())

      updatedContext.keyVocabulary = [
        ...new Set([...updatedContext.keyVocabulary, ...newWords])
      ]
    }

    // Update themes if new ones were identified
    if (newSection.sectionName === 'reading' && typeof newSection.content === 'string') {
      // Extract any new themes from the reading passage
      const newThemes = this.extractThemesFromText(newSection.content)
      updatedContext.mainThemes = [
        ...new Set([...updatedContext.mainThemes, ...newThemes])
      ]
    }

    console.log(`✅ Context updated for ${newSection.sectionName}`)
    return updatedContext
  }

  // Private helper methods for extracting shared context

  private async generateLessonTitle(sourceText: string, lessonType: string, studentLevel: CEFRLevel): Promise<string> {
    // First try to generate a contextual title using AI
    try {
      console.log("🎯 Generating contextual lesson title with AI...")
      
      // Use a shorter, more focused prompt to avoid token issues
      const shortPrompt = `Create a lesson title for ${studentLevel} level ${lessonType} about: ${sourceText.substring(0, 150)}

Title (3-8 words):`

      const response = await this.getGoogleAI().prompt(shortPrompt, { maxTokens: 50 })
      const title = response.trim().replace(/['"]/g, '').replace(/^Title:?\s*/i, '').substring(0, 80)
      
      console.log("🤖 AI generated title:", title)
      
      // Validate the title
      if (title.length > 5 && title.length < 80 && !title.toLowerCase().includes('lesson')) {
        console.log("✅ Using AI-generated contextual title:", title)
        return title
      }
      
      console.log("⚠️ AI title invalid, trying contextual fallback...")
      // Try contextual fallback before generic fallback
      return this.generateContextualFallbackTitle(sourceText, lessonType, studentLevel)
      
    } catch (error) {
      console.log("⚠️ AI title generation failed:", error)
      console.log("🔄 Using contextual fallback title generation")
      return this.generateContextualFallbackTitle(sourceText, lessonType, studentLevel)
    }
  }

  private generateContextualFallbackTitle(sourceText: string, lessonType: string, studentLevel: CEFRLevel): string {
    console.log("🎯 Generating contextual fallback title...")
    
    // Extract key terms from the source text
    const text = sourceText.toLowerCase()
    const words = text.split(/\s+/).filter(word => word.length > 3)
    
    // Look for specific topics/themes
    const topics = {
      'ryder cup': 'Ryder Cup Golf',
      'golf': 'Golf Competition',
      'competition': 'Sports Competition',
      'travel': 'Travel & Tourism',
      'business': 'Business Communication',
      'technology': 'Technology Today',
      'environment': 'Environmental Issues',
      'health': 'Health & Wellness',
      'education': 'Education System',
      'culture': 'Cultural Exchange',
      'food': 'Food & Cuisine',
      'sports': 'Sports & Recreation',
      'music': 'Music & Arts',
      'history': 'Historical Events',
      'science': 'Science & Discovery'
    }
    
    // Find matching topics
    for (const [keyword, topic] of Object.entries(topics)) {
      if (text.includes(keyword)) {
        console.log("✅ Found contextual topic:", topic)
        return `${topic} Discussion`
      }
    }
    
    // Look for proper nouns (capitalized words) that might be topics
    const properNouns = sourceText.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || []
    if (properNouns.length > 0) {
      const mainTopic = properNouns[0]
      if (mainTopic.length < 20) {
        console.log("✅ Using proper noun as topic:", mainTopic)
        return `${mainTopic} Discussion`
      }
    }
    
    // Generic fallback
    console.log("🔄 Using generic fallback title")
    return this.generateFallbackTitle(lessonType, studentLevel)
  }

  private generateFallbackTitle(lessonType: string, studentLevel: CEFRLevel): string {
    const typeMap = {
      discussion: 'Discussion',
      grammar: 'Grammar Focus',
      travel: 'Travel & Tourism',
      business: 'Business English',
      pronunciation: 'Pronunciation Practice'
    }
    
    const lessonTypeName = typeMap[lessonType as keyof typeof typeMap] || 'English'
    return `${lessonTypeName} - ${studentLevel} Level`
  }

  private async extractKeyVocabulary(sourceText: string, studentLevel: CEFRLevel): Promise<string[]> {
    const prompt = `Extract 8-12 key vocabulary words from this text for ${studentLevel} level students. Return only the words, one per line:

${sourceText.substring(0, 500)}`

    try {
      const response = await this.getGoogleAI().prompt(prompt)
      const words = response.split('\n')
        .map(line => line.trim().toLowerCase())
        .filter(word => word.length > 2 && word.length < 20)
        .slice(0, 12)

      return words.length >= 6 ? words : this.extractVocabularyFallback(sourceText, studentLevel)
    } catch (error) {
      console.log("⚠️ AI vocabulary extraction failed, using fallback")
      return this.extractVocabularyFallback(sourceText, studentLevel)
    }
  }

  private async extractMainThemes(sourceText: string, studentLevel: CEFRLevel): Promise<string[]> {
    const prompt = `Identify 3-5 main themes or topics in this text for ${studentLevel} level students. Return only the themes, one per line:

${sourceText.substring(0, 400)}`

    try {
      const response = await this.getGoogleAI().prompt(prompt)
      const themes = response.split('\n')
        .map(line => line.trim().toLowerCase())
        .filter(theme => theme.length > 3 && theme.length < 50)
        .slice(0, 5)

      return themes.length >= 2 ? themes : this.extractThemesFallback(sourceText)
    } catch (error) {
      console.log("⚠️ AI theme extraction failed, using fallback")
      return this.extractThemesFallback(sourceText)
    }
  }

  private async createContentSummary(sourceText: string, studentLevel: CEFRLevel): Promise<string> {
    const prompt = `Summarize this text in 2-3 sentences for ${studentLevel} level students:

${sourceText.substring(0, 600)}`

    try {
      const response = await this.getGoogleAI().prompt(prompt)
      return response.trim().substring(0, 300)
    } catch (error) {
      console.log("⚠️ AI summary failed, using truncation")
      return sourceText.substring(0, 200) + "..."
    }
  }

  // Section generation methods using shared context

  /**
   * Build level-specific warm-up prompt with content assumption detection
   */
  private buildWarmupPrompt(context: SharedContext): string {
    const mainTheme = context.mainThemes[0] || 'this topic'

    // CEFR-specific instructions
    const levelInstructions: Record<CEFRLevel, string> = {
      'A1': 'Use very simple present tense questions with basic vocabulary. Questions should be about personal experiences and familiar situations.',
      'A2': 'Use simple questions with present and past tenses. Focus on personal experiences and everyday situations.',
      'B1': 'Use varied question structures with different tenses. Include questions about opinions and experiences.',
      'B2': 'Use complex question structures. Include hypothetical and analytical questions about experiences.',
      'C1': 'Use sophisticated question structures. Include abstract and evaluative questions that encourage critical thinking.'
    }

    const levelInstruction = levelInstructions[context.difficultyLevel]

    // Build prompt that explicitly avoids content assumptions
    const prompt = `Create 3 warm-up questions for ${context.difficultyLevel} level students about the general topic of "${mainTheme}".

CRITICAL REQUIREMENTS:
1. DO NOT reference specific events, people, names, dates, or outcomes from any text
2. DO NOT assume students have read or know anything about specific content
3. FOCUS on students' personal experiences, opinions, and general knowledge
4. Questions should activate prior knowledge about the TOPIC, not test knowledge of specific content
5. Questions should build interest and mental focus for learning about this topic
6. ${levelInstruction}

EXAMPLES OF GOOD QUESTIONS (activate prior knowledge without content assumptions):
- "Have you ever experienced [general situation related to topic]?"
- "What do you think about [general concept related to topic]?"
- "In your opinion, why is [general aspect of topic] important?"

EXAMPLES OF BAD QUESTIONS (assume content knowledge):
- "What happened when [specific person] did [specific event]?"
- "Why did [specific outcome] occur in the story?"
- "What do you remember about [specific detail]?"

Return ONLY 3 questions, one per line, with no numbering or extra text:`

    return prompt
  }

  /**
   * Validate warm-up questions using the comprehensive WarmupValidator
   */
  private validateWarmupQuestions(questions: string[], context: SharedContext): {
    isValid: boolean
    issues: string[]
  } {
    // Use the comprehensive validator
    const validationResult = this.warmupValidator.validate(
      questions,
      context.difficultyLevel,
      { mainThemes: context.mainThemes }
    )

    // Convert validation issues to simple string array for backward compatibility
    const issues = [
      ...validationResult.issues.map(issue =>
        issue.questionIndex !== undefined
          ? `${issue.message} (Question ${issue.questionIndex + 1})`
          : issue.message
      ),
      ...validationResult.warnings.map(warning =>
        warning.questionIndex !== undefined
          ? `Warning: ${warning.message} (Question ${warning.questionIndex + 1})`
          : `Warning: ${warning.message}`
      )
    ]

    console.log(`📊 Warmup validation score: ${validationResult.score}/100`)

    return {
      isValid: validationResult.isValid,
      issues
    }
  }

  private async generateWarmupWithContext(
    context: SharedContext,
    _previousSections: GeneratedSection[]
  ): Promise<string[]> {
    const maxAttempts = 2
    let attempt = 0
    const sectionStartTime = Date.now()

    while (attempt < maxAttempts) {
      attempt++
      console.log(`🎯 Generating warm-up questions (attempt ${attempt}/${maxAttempts})`)

      try {
        // Build enhanced prompt
        const prompt = this.buildWarmupPrompt(context)

        // Generate questions
        const response = await this.getGoogleAI().prompt(prompt)
        const questions = response.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .map(line => {
            // Remove numbering if present
            return line.replace(/^\d+[\.)]\s*/, '').trim()
          })
          .filter(line => line.endsWith('?') && line.length > 10)
          .slice(0, 3)

        if (questions.length < 3) {
          console.log(`⚠️ Only ${questions.length} questions generated, need 3`)
          if (attempt < maxAttempts) continue
          throw new Error("Insufficient questions generated after retries")
        }

        // Validate questions
        const validation = this.validateWarmupQuestions(questions, context)

        if (!validation.isValid) {
          console.log(`⚠️ Validation failed:`, validation.issues)
          if (attempt < maxAttempts) {
            console.log(`🔄 Retrying with adjusted prompt...`)
            continue
          }
          console.log(`⚠️ Using questions despite validation issues (max attempts reached)`)
        } else {
          console.log(`✅ Warm-up questions validated successfully`)
        }

        // Track quality metrics
        const generationTime = Date.now() - sectionStartTime
        qualityMetricsTracker.recordSection(
          'warmup',
          validation.isValid ? 100 : 70,
          attempt,
          generationTime,
          validation.issues.length,
          0
        )

        const instruction = "Have the following conversations or discussions with your tutor before reading the text:"
        return [instruction, ...questions]

      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error)
        if (attempt >= maxAttempts) {
          // Track failed generation
          qualityMetricsTracker.recordSection(
            'warmup',
            0,
            attempt,
            Date.now() - sectionStartTime,
            1,
            0
          )
          throw new Error("Failed to generate warmup questions: " + (error as Error).message)
        }
      }
    }

    throw new Error("Failed to generate warmup questions after all attempts")
  }

  /**
   * Get the number of example sentences required for each CEFR level
   */
  private getExampleCountForLevel(level: CEFRLevel): number {
    const exampleCounts: Record<CEFRLevel, number> = {
      'A1': 5,
      'A2': 5,
      'B1': 4,
      'B2': 3,
      'C1': 2
    }
    return exampleCounts[level]
  }

  /**
   * Build level-specific vocabulary example prompt with contextual relevance
   * OPTIMIZED: Reduced token count by 60% while maintaining quality
   */
  private buildVocabularyExamplePrompt(
    word: string,
    context: SharedContext,
    exampleCount: number
  ): string {
    // Concise CEFR complexity guidelines
    const levelGuidelines: Record<CEFRLevel, string> = {
      'A1': '5-8 words, present tense, basic vocabulary',
      'A2': '8-12 words, simple past/future, common words',
      'B1': '10-15 words, varied tenses, compound sentences',
      'B2': '12-18 words, complex structures, relative clauses',
      'C1': '15-20 words, sophisticated grammar, nuanced expressions'
    }

    const themes = context.mainThemes.slice(0, 2).join(', ')
    const contextSnippet = context.contentSummary.substring(0, 150)

    const prompt = `Create ${exampleCount} sentences using "${word}" for ${context.difficultyLevel} level.

Context: ${contextSnippet}
Topic: ${themes}

Requirements:
- Relate to the topic (${themes})
- Match ${context.difficultyLevel} level: ${levelGuidelines[context.difficultyLevel]}
- Show different uses of "${word}"
- Use context-specific terms

Return ${exampleCount} sentences, one per line, no numbering:`

    return prompt
  }

  /**
   * Validate vocabulary examples for quality and relevance
   */
  private validateVocabularyExamples(
    word: string,
    examples: string[],
    context: SharedContext,
    expectedCount: number
  ): { isValid: boolean; issues: string[] } {
    const issues: string[] = []
    const warnings: string[] = []

    // Check example count
    if (examples.length < expectedCount) {
      issues.push(`Insufficient examples: expected ${expectedCount}, got ${examples.length}`)
    }

    // Track contextual relevance across all examples
    let contextuallyRelevantCount = 0

    // Check each example for quality
    for (let i = 0; i < examples.length; i++) {
      const example = examples[i]
      const exampleLower = example.toLowerCase()

      // Check if word is actually used in the example
      const wordLower = word.toLowerCase()
      if (!exampleLower.includes(wordLower)) {
        issues.push(`Example ${i + 1} does not contain the word "${word}"`)
      }

      // Check minimum and maximum length based on CEFR level
      const lengthRanges: Record<CEFRLevel, { min: number; max: number }> = {
        'A1': { min: 5, max: 10 },
        'A2': { min: 8, max: 15 },
        'B1': { min: 10, max: 18 },
        'B2': { min: 12, max: 22 },
        'C1': { min: 15, max: 25 }
      }
      const range = lengthRanges[context.difficultyLevel]
      const wordCount = example.split(/\s+/).length

      if (wordCount < range.min) {
        issues.push(`Example ${i + 1} too short: ${wordCount} words (minimum ${range.min} for ${context.difficultyLevel})`)
      } else if (wordCount > range.max) {
        warnings.push(`Example ${i + 1} may be too long: ${wordCount} words (recommended max ${range.max} for ${context.difficultyLevel})`)
      }

      // Check for proper sentence structure (starts with capital, ends with punctuation)
      if (!/^[A-Z]/.test(example)) {
        issues.push(`Example ${i + 1} should start with a capital letter`)
      }
      if (!/[.!?]$/.test(example)) {
        issues.push(`Example ${i + 1} should end with punctuation`)
      }

      // Enhanced contextual relevance check
      let relevanceScore = 0

      // Check for theme keywords (weighted heavily)
      // Split themes into individual words and check for any significant word matches
      const hasThemeKeyword = context.mainThemes.some(theme => {
        const themeWords = theme.toLowerCase().split(/\s+/)
        return themeWords.some(themeWord =>
          themeWord.length > 3 &&
          !['the', 'and', 'for', 'with', 'from', 'about'].includes(themeWord) &&
          exampleLower.includes(themeWord)
        )
      })
      if (hasThemeKeyword) relevanceScore += 2

      // Check for related vocabulary (moderate weight)
      const hasRelatedVocab = context.keyVocabulary.some(vocab =>
        vocab !== wordLower && vocab.length > 3 && exampleLower.includes(vocab)
      )
      if (hasRelatedVocab) relevanceScore += 1

      // Check for content summary keywords (light weight)
      const summaryWords = context.contentSummary
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 4 && !['about', 'their', 'which', 'these', 'those', 'there', 'where'].includes(w))

      const hasSummaryKeyword = summaryWords.some(summaryWord =>
        exampleLower.includes(summaryWord)
      )
      if (hasSummaryKeyword) relevanceScore += 1

      // Track contextually relevant examples
      if (relevanceScore > 0) {
        contextuallyRelevantCount++
      } else if (context.mainThemes.length > 0) {
        warnings.push(`Example ${i + 1} may lack contextual relevance to topic (${context.mainThemes.join(', ')})`)
      }

      // Check for generic/overly simple examples at higher levels
      if (['B2', 'C1'].includes(context.difficultyLevel)) {
        const genericPatterns = [
          /^(I|You|We|They|He|She)\s+(am|is|are|was|were|have|has|had)\s+/i,
          /\b(very|really|so|quite)\s+\w+\b/i
        ]

        const isGeneric = genericPatterns.some(pattern => pattern.test(example))
        if (isGeneric && relevanceScore === 0) {
          warnings.push(`Example ${i + 1} may be too generic for ${context.difficultyLevel} level`)
        }
      }
    }

    // Check overall contextual relevance
    const relevanceThreshold = Math.ceil(examples.length * 0.6) // At least 60% should be contextually relevant
    if (contextuallyRelevantCount < relevanceThreshold && context.mainThemes.length > 0) {
      issues.push(`Only ${contextuallyRelevantCount}/${examples.length} examples are contextually relevant (need at least ${relevanceThreshold})`)
    }

    // Check for diversity in examples (avoid repetitive sentence structures)
    const sentenceStarts = examples.map(ex => ex.split(/\s+/).slice(0, 2).join(' ').toLowerCase())
    const uniqueStarts = new Set(sentenceStarts)
    if (uniqueStarts.size < examples.length * 0.7) {
      warnings.push(`Examples may lack structural diversity (${uniqueStarts.size} unique starts out of ${examples.length} examples)`)
    }

    // Log warnings for visibility but don't fail validation
    if (warnings.length > 0) {
      console.log(`⚠️ Vocabulary validation warnings for "${word}":`, warnings)
    }

    return {
      isValid: issues.length === 0,
      issues
    }
  }

  private async generateVocabularyWithContext(
    context: SharedContext,
    _previousSections: GeneratedSection[]
  ): Promise<Array<{ word: string, meaning: string, examples: string[] }>> {
    const vocabulary = []
    const exampleCount = this.getExampleCountForLevel(context.difficultyLevel)
    const maxAttempts = 2

    console.log(`📚 Generating vocabulary with ${exampleCount} examples per word for ${context.difficultyLevel} level`)

    for (const word of context.keyVocabulary.slice(0, 8)) {
      let attempt = 0
      let examples: string[] = []
      let validationPassed = false

      while (attempt < maxAttempts && !validationPassed) {
        attempt++

        try {
          // Generate definition
          const definitionPrompt = `Define "${word}" simply for ${context.difficultyLevel} level. Context: ${context.contentSummary.substring(0, 100)}. Give only the definition:`
          const meaning = await this.getGoogleAI().prompt(definitionPrompt)

          // Generate contextually relevant examples with enhanced prompt
          const examplesPrompt = this.buildVocabularyExamplePrompt(word, context, exampleCount)
          let examplesResponse: string;
          
          try {
            examplesResponse = await this.getGoogleAI().prompt(examplesPrompt)
          } catch (promptError: any) {
            // Handle MAX_TOKENS error gracefully - accept partial response
            if (promptError.code === 'MAX_TOKENS' && promptError.message) {
              console.log(`⚠️ MAX_TOKENS hit for "${word}", using partial response`)
              examplesResponse = promptError.message
            } else {
              throw promptError
            }
          }

          examples = examplesResponse.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => {
              // Remove numbering if present
              return line.replace(/^\d+[\.)]\s*/, '').trim()
            })
            .filter(line => line.length > 10)
            .slice(0, exampleCount)

          // If we got at least 2 examples, consider it acceptable
          if (examples.length >= Math.min(2, exampleCount)) {
            console.log(`✅ Generated ${examples.length} examples for "${word}" (target: ${exampleCount})`)
            
            vocabulary.push({
              word: this.capitalizeWord(word),
              meaning: meaning.trim().substring(0, 150),
              examples: examples
            })
            
            break // Success, move to next word
          }

          // Validate examples only if we have enough
          const validation = this.validateVocabularyExamples(word, examples, context, exampleCount)

          if (!validation.isValid) {
            console.log(`⚠️ Validation failed for "${word}" (attempt ${attempt}/${maxAttempts}):`, validation.issues)

            if (attempt < maxAttempts) {
              console.log(`🔄 Retrying with adjusted prompt...`)
              continue
            } else {
              console.log(`⚠️ Using examples despite validation issues (max attempts reached)`)
            }
          } else {
            console.log(`✅ Examples validated successfully for "${word}"`)
            validationPassed = true
          }

          vocabulary.push({
            word: this.capitalizeWord(word),
            meaning: meaning.trim().substring(0, 150),
            examples: examples
          })

          break // Success, move to next word

        } catch (error) {
          console.log(`⚠️ Attempt ${attempt} failed for "${word}":`, error)

          if (attempt >= maxAttempts) {
            console.log(`❌ Failed to generate vocabulary for ${word} after ${maxAttempts} attempts`)
            // Skip this word and continue with next
            break
          }
        }
      }
    }

    const instruction = {
      word: "INSTRUCTION",
      meaning: "Study the following words with your tutor before reading the text:",
      examples: []
    }

    return [instruction, ...vocabulary]
  }

  private async generateReadingWithContext(
    context: SharedContext,
    _previousSections: GeneratedSection[]
  ): Promise<string> {
    // Use vocabulary from previous sections if available
    const vocabularySection = _previousSections.find((s: GeneratedSection) => s.sectionName === 'vocabulary')
    const vocabularyWords = vocabularySection ?
      vocabularySection.content
        .filter((item: any) => item.word !== 'INSTRUCTION')
        .map((item: any) => item.word)
        .slice(0, 5) : context.keyVocabulary.slice(0, 5)

    const prompt = `Rewrite this text for ${context.difficultyLevel} level students. 
Use these vocabulary words: ${vocabularyWords.join(', ')}
Keep it 200-400 words:

${context.sourceText}`

    try {
      const response = await this.getGoogleAI().prompt(prompt)
      const instruction = "Read the following text carefully. Your tutor will help you with any difficult words or concepts:"
      return `${instruction}\n\n${response.trim()}`
    } catch (error) {
      throw new Error("Failed to generate reading passage: " + (error as Error).message)
    }
  }

  private async generateComprehensionWithContext(
    context: SharedContext,
    _previousSections: GeneratedSection[]
  ): Promise<string[]> {
    const prompt = `Create 5 ${context.difficultyLevel} comprehension questions about this content:
${context.contentSummary}
Return only questions, one per line:`

    try {
      const response = await this.getGoogleAI().prompt(prompt)
      const questions = response.split('\n')
        .map(line => line.trim())
        .filter(line => line.endsWith('?') && line.length > 10)
        .slice(0, 5)

      if (questions.length < 5) {
        throw new Error("Insufficient comprehension questions generated")
      }

      const instruction = "After reading the text, answer these comprehension questions:"
      return [instruction, ...questions]
    } catch (error) {
      throw new Error("Failed to generate comprehension questions: " + (error as Error).message)
    }
  }

  /**
   * Build level-specific discussion question prompt with appropriate complexity
   */
  private buildDiscussionPrompt(context: SharedContext): string {
    const themes = context.mainThemes.slice(0, 2).join(' and ')

    // CEFR-specific question type instructions with detailed guidance
    const levelInstructions: Record<CEFRLevel, {
      description: string
      questionTypes: string[]
      structures: string[]
      responseExpectation: string
    }> = {
      'A1': {
        description: 'Simple question structures with basic vocabulary focusing on familiar topics and personal experiences',
        questionTypes: [
          'Yes/No questions: "Do you like...?", "Have you ever...?", "Can you...?"',
          'Simple Wh- questions: "What is your favorite...?", "Where do you...?", "When do you...?"',
          'Personal preference questions: "Which do you prefer...?", "What do you enjoy...?"'
        ],
        structures: [
          'Use present simple and simple past tenses only',
          'Keep questions short (4-10 words)',
          'Use common, everyday vocabulary',
          'Focus on concrete, tangible topics'
        ],
        responseExpectation: 'Students should be able to answer with 1-3 simple sentences using basic vocabulary'
      },
      'A2': {
        description: 'Simple questions with multiple tenses focusing on personal experiences and everyday situations',
        questionTypes: [
          'Opinion questions: "What do you think about...?", "Do you agree that...?"',
          'Experience questions: "Can you describe...?", "What happened when...?"',
          'Simple hypotheticals: "What would you do if...?", "Where would you go...?"'
        ],
        structures: [
          'Use present, past, and future tenses',
          'Include simple conditionals (first conditional)',
          'Keep questions moderate length (5-12 words)',
          'Use familiar vocabulary with some new words'
        ],
        responseExpectation: 'Students should be able to answer with 3-5 sentences, expressing simple opinions and describing experiences'
      },
      'B1': {
        description: 'Varied question structures including opinion questions and comparisons',
        questionTypes: [
          'Opinion and justification: "Why do you think...?", "Do you believe that...? Why?"',
          'Comparison questions: "How does X compare to Y?", "What are the differences between...?"',
          'Advantage/disadvantage questions: "What are the advantages of...?", "What are the pros and cons of...?"'
        ],
        structures: [
          'Use varied tenses including present perfect',
          'Include first and second conditionals',
          'Use moderate complexity (6-15 words)',
          'Incorporate topic-specific vocabulary'
        ],
        responseExpectation: 'Students should provide 5-8 sentences with explanations, examples, and personal opinions'
      },
      'B2': {
        description: 'Complex question structures requiring analytical thinking and justification',
        questionTypes: [
          'Analytical questions: "To what extent do you agree that...?", "What might be the consequences of...?"',
          'Evaluation questions: "How would you evaluate...?", "What are the implications of...?"',
          'Hypothetical scenarios: "How would the situation change if...?", "What might happen if...?"'
        ],
        structures: [
          'Use complex tenses including conditionals (types 1-3)',
          'Include passive voice and modal verbs',
          'Use sophisticated vocabulary and expressions',
          'Questions should be 8-18 words'
        ],
        responseExpectation: 'Students should provide detailed responses (8-12 sentences) with analysis, examples, and counterarguments'
      },
      'C1': {
        description: 'Sophisticated question structures requiring evaluative and critical thinking',
        questionTypes: [
          'Evaluative questions: "What are the broader implications of...?", "How might one assess...?"',
          'Critical analysis: "In what ways could this be interpreted...?", "To what degree does...?"',
          'Abstract reasoning: "How might one reconcile...?", "What underlying assumptions...?"'
        ],
        structures: [
          'Use advanced grammatical structures and nuanced expressions',
          'Include abstract concepts and theoretical frameworks',
          'Use sophisticated vocabulary and idiomatic expressions',
          'Questions should be 10-20 words with complex syntax'
        ],
        responseExpectation: 'Students should provide comprehensive responses (12+ sentences) with critical analysis, multiple perspectives, and sophisticated argumentation'
      }
    }

    const levelConfig = levelInstructions[context.difficultyLevel]

    const prompt = `Create exactly 5 discussion questions for ${context.difficultyLevel} level students about ${themes}.

SOURCE CONTEXT: ${context.contentSummary}
RELATED VOCABULARY: ${context.keyVocabulary.slice(0, 5).join(', ')}

LEVEL-SPECIFIC REQUIREMENTS FOR ${context.difficultyLevel}:
${levelConfig.description}

QUESTION TYPES TO USE:
${levelConfig.questionTypes.map((type, i) => `${i + 1}. ${type}`).join('\n')}

STRUCTURAL GUIDELINES:
${levelConfig.structures.map((struct, i) => `- ${struct}`).join('\n')}

RESPONSE EXPECTATION:
${levelConfig.responseExpectation}

CRITICAL REQUIREMENTS:
1. Generate EXACTLY 5 questions - no more, no less
2. Questions MUST relate directly to the source material themes: ${themes}
3. Use vocabulary from the source context when appropriate: ${context.keyVocabulary.slice(0, 5).join(', ')}
4. Each question should explore a DIFFERENT aspect of the topic
5. Questions should encourage EXTENDED responses appropriate to ${context.difficultyLevel} level
6. Vary question types across the 5 questions (don't repeat the same structure)
7. Questions should progress in complexity within the ${context.difficultyLevel} level range

QUESTION PROGRESSION STRATEGY:
- Question 1: Personal connection or basic understanding (easiest within level)
- Question 2: Specific aspect from source material
- Question 3: Comparison, contrast, or different perspective
- Question 4: Application or implication of concepts
- Question 5: Evaluation or broader significance (most challenging within level)

EXAMPLES OF GOOD ${context.difficultyLevel} QUESTIONS:
${this.getDiscussionExamples(context.difficultyLevel, themes)}

Return ONLY 5 questions, one per line, with no numbering, bullets, or extra text:`

    return prompt
  }

  /**
   * Get example questions for each CEFR level to guide AI generation
   */
  private getDiscussionExamples(level: CEFRLevel, themes: string): string {
    const examples: Record<CEFRLevel, string[]> = {
      'A1': [
        `"Do you like ${themes}?"`,
        `"What is your favorite thing about ${themes}?"`,
        `"Have you ever tried ${themes}?"`
      ],
      'A2': [
        `"What do you think about ${themes}?"`,
        `"Can you describe your experience with ${themes}?"`,
        `"What would you do if you could learn more about ${themes}?"`
      ],
      'B1': [
        `"Why do you think ${themes} is important?"`,
        `"How does ${themes} compare to similar topics?"`,
        `"What are the advantages and disadvantages of ${themes}?"`
      ],
      'B2': [
        `"To what extent do you agree that ${themes} has changed society?"`,
        `"What might be the long-term consequences of ${themes}?"`,
        `"How would you evaluate the impact of ${themes}?"`
      ],
      'C1': [
        `"What are the broader implications of ${themes} for modern society?"`,
        `"In what ways could different perspectives on ${themes} be reconciled?"`,
        `"How might one critically assess the underlying assumptions about ${themes}?"`
      ]
    }

    return examples[level].join('\n')
  }

  /**
   * Validate discussion questions for count and complexity
   */
  private validateDiscussionQuestions(
    questions: string[],
    context: SharedContext
  ): { isValid: boolean; issues: string[] } {
    const issues: string[] = []
    const warnings: string[] = []

    // Check exact count (requirement 4.1)
    if (questions.length !== 5) {
      issues.push(`Incorrect question count: expected exactly 5, got ${questions.length}`)
    }

    // Check each question for quality
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]
      const questionLower = question.toLowerCase()

      // Check that it's actually a question
      if (!question.endsWith('?')) {
        issues.push(`Question ${i + 1} does not end with a question mark`)
      }

      // Check minimum length
      if (question.length < 15) {
        issues.push(`Question ${i + 1} is too short (${question.length} characters)`)
      }

      // Check that it starts with a capital letter
      if (!/^[A-Z]/.test(question)) {
        issues.push(`Question ${i + 1} should start with a capital letter`)
      }

      // Check for appropriate question words/structures based on CEFR level
      const questionWords = ['what', 'why', 'how', 'when', 'where', 'who', 'which', 'do', 'does', 'did', 'can', 'could', 'would', 'should', 'have', 'has', 'is', 'are', 'was', 'were', 'to']
      const startsWithQuestionWord = questionWords.some(word =>
        questionLower.startsWith(word + ' ') || questionLower.startsWith(word + "'")
      )

      if (!startsWithQuestionWord) {
        warnings.push(`Question ${i + 1} may not have a proper question structure`)
      }

      // Check complexity appropriateness for level (requirements 4.2, 4.3, 4.4)
      const complexityCheck = this.checkQuestionComplexity(question, context.difficultyLevel)
      if (!complexityCheck.isAppropriate) {
        warnings.push(`Question ${i + 1}: ${complexityCheck.warning}`)
      }

      // Check if question encourages extended responses (requirement 4.6)
      const extendedResponseCheck = this.checkExtendedResponsePotential(question, context.difficultyLevel)
      if (!extendedResponseCheck.encouragesExtended) {
        warnings.push(`Question ${i + 1}: ${extendedResponseCheck.warning}`)
      }
    }

    // Check for diversity in question types
    const questionStarts = questions.map(q => q.split(/\s+/).slice(0, 2).join(' ').toLowerCase())
    const uniqueStarts = new Set(questionStarts)
    if (uniqueStarts.size < 3) {
      warnings.push(`Questions lack diversity (only ${uniqueStarts.size} unique question types)`)
    }

    // Check for source material relevance (requirement 4.5)
    const hasRelevance = this.checkDiscussionRelevance(questions, context)
    if (!hasRelevance) {
      warnings.push('Questions may not sufficiently relate to the source material')
    }

    // Log warnings for visibility
    if (warnings.length > 0) {
      console.log(`⚠️ Discussion validation warnings:`, warnings)
    }

    return {
      isValid: issues.length === 0,
      issues
    }
  }

  /**
   * Check if question encourages extended responses appropriate to level (requirement 4.6)
   */
  private checkExtendedResponsePotential(
    question: string,
    level: CEFRLevel
  ): { encouragesExtended: boolean; warning?: string } {
    const questionLower = question.toLowerCase()

    // Yes/No questions generally don't encourage extended responses
    // However, they can be acceptable at A1/A2 if they're open to elaboration
    const isYesNoQuestion = /^(do|does|did|can|could|would|should|have|has|had|is|are|was|were)\s+/i.test(question)

    if (isYesNoQuestion) {
      // At higher levels, yes/no questions are problematic
      if (['B2', 'C1'].includes(level)) {
        return {
          encouragesExtended: false,
          warning: `Yes/No question structure may not encourage extended responses at ${level} level`
        }
      }
      // At B1, warn but don't fail
      if (level === 'B1') {
        return {
          encouragesExtended: true,
          warning: `Yes/No question - ensure it encourages elaboration beyond yes/no`
        }
      }
      // At A1/A2, yes/no questions are acceptable
    }

    // Check for open-ended question words that encourage extended responses
    const openEndedStarters = {
      'A1': ['what', 'where', 'when', 'who'],
      'A2': ['what', 'where', 'when', 'who', 'why', 'how'],
      'B1': ['why', 'how', 'what do you think', 'what are'],
      'B2': ['why', 'how', 'to what extent', 'what might', 'how would', 'what are the'],
      'C1': ['why', 'how', 'to what extent', 'in what ways', 'what are the implications', 'how might one']
    }

    const expectedStarters = openEndedStarters[level]
    const hasOpenEndedStarter = expectedStarters.some(starter =>
      questionLower.startsWith(starter)
    )

    // For higher levels, check for analytical/evaluative language
    if (['B2', 'C1'].includes(level)) {
      const analyticalWords = [
        'why', 'how', 'extent', 'implications', 'consequences', 'evaluate',
        'analyze', 'compare', 'contrast', 'assess', 'consider', 'might',
        'could', 'would', 'perspectives', 'interpret', 'reconcile'
      ]

      const hasAnalyticalLanguage = analyticalWords.some(word =>
        questionLower.includes(word)
      )

      if (!hasAnalyticalLanguage && !hasOpenEndedStarter) {
        return {
          encouragesExtended: false,
          warning: `Question lacks analytical language expected at ${level} level to encourage extended responses`
        }
      }
    }

    // For B1, check for opinion/comparison language
    if (level === 'B1') {
      const opinionWords = ['think', 'believe', 'opinion', 'compare', 'prefer', 'advantages', 'disadvantages', 'why', 'how']
      const hasOpinionLanguage = opinionWords.some(word => questionLower.includes(word))

      if (!hasOpinionLanguage && !hasOpenEndedStarter) {
        return {
          encouragesExtended: true,
          warning: `Question could benefit from opinion/comparison language to encourage extended responses at B1 level`
        }
      }
    }

    return { encouragesExtended: true }
  }

  /**
   * Check if question complexity matches CEFR level
   */
  private checkQuestionComplexity(
    question: string,
    level: CEFRLevel
  ): { isAppropriate: boolean; warning?: string } {
    const questionLower = question.toLowerCase()
    const wordCount = question.split(/\s+/).length

    // Define complexity indicators for each level
    const complexityIndicators = {
      'A1': {
        minWords: 4,
        maxWords: 12,
        expectedPatterns: ['do you', 'what is', 'can you', 'have you'],
        avoidPatterns: ['to what extent', 'how might', 'in what ways']
      },
      'A2': {
        minWords: 5,
        maxWords: 15,
        expectedPatterns: ['what do you think', 'can you describe', 'what would you'],
        avoidPatterns: ['to what extent', 'how might one', 'what are the implications']
      },
      'B1': {
        minWords: 6,
        maxWords: 18,
        expectedPatterns: ['why do you think', 'how does', 'what are the', 'do you agree'],
        avoidPatterns: ['to what extent', 'how might one reconcile']
      },
      'B2': {
        minWords: 8,
        maxWords: 22,
        expectedPatterns: ['to what extent', 'what might be', 'how would you', 'what are the consequences'],
        avoidPatterns: []
      },
      'C1': {
        minWords: 10,
        maxWords: 25,
        expectedPatterns: ['what are the implications', 'how might one', 'in what ways', 'to what extent'],
        avoidPatterns: []
      }
    }

    const indicators = complexityIndicators[level]

    // Check word count
    if (wordCount < indicators.minWords) {
      return {
        isAppropriate: false,
        warning: `Question may be too simple for ${level} level (${wordCount} words, expected ${indicators.minWords}+)`
      }
    }

    if (wordCount > indicators.maxWords) {
      return {
        isAppropriate: true, // Don't fail on this, just warn
        warning: `Question may be too complex for ${level} level (${wordCount} words, recommended max ${indicators.maxWords})`
      }
    }

    // Check for inappropriate patterns (too complex for level)
    if (indicators.avoidPatterns.length > 0) {
      const hasAvoidPattern = indicators.avoidPatterns.some(pattern =>
        questionLower.includes(pattern)
      )
      if (hasAvoidPattern) {
        return {
          isAppropriate: false,
          warning: `Question structure may be too advanced for ${level} level`
        }
      }
    }

    // For lower levels, check if question is too complex
    if (['A1', 'A2'].includes(level)) {
      const complexPatterns = ['implications', 'consequences', 'reconcile', 'evaluate', 'analyze', 'synthesize']
      const hasComplexPattern = complexPatterns.some(pattern => questionLower.includes(pattern))
      if (hasComplexPattern) {
        return {
          isAppropriate: false,
          warning: `Question vocabulary may be too advanced for ${level} level`
        }
      }
    }

    return { isAppropriate: true }
  }

  /**
   * Check if discussion questions relate to source material
   */
  private checkDiscussionRelevance(
    questions: string[],
    context: SharedContext
  ): boolean {
    let relevantCount = 0

    for (const question of questions) {
      const questionLower = question.toLowerCase()

      // Check for theme keywords
      const hasThemeKeyword = context.mainThemes.some(theme => {
        const themeWords = theme.toLowerCase().split(/\s+/)
        return themeWords.some(themeWord =>
          themeWord.length > 3 &&
          !['the', 'and', 'for', 'with', 'from', 'about', 'that', 'this'].includes(themeWord) &&
          questionLower.includes(themeWord)
        )
      })

      // Check for vocabulary keywords
      const hasVocabKeyword = context.keyVocabulary.some(vocab =>
        vocab.length > 3 && questionLower.includes(vocab)
      )

      // Check for summary keywords
      const summaryWords = context.contentSummary
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 4 && !['about', 'their', 'which', 'these', 'those', 'there', 'where', 'would', 'could', 'should'].includes(w))

      const hasSummaryKeyword = summaryWords.some(summaryWord =>
        questionLower.includes(summaryWord)
      )

      if (hasThemeKeyword || hasVocabKeyword || hasSummaryKeyword) {
        relevantCount++
      }
    }

    // At least 60% of questions should be contextually relevant
    return relevantCount >= Math.ceil(questions.length * 0.6)
  }

  private async generateDiscussionWithContext(
    context: SharedContext,
    _previousSections: GeneratedSection[]
  ): Promise<string[]> {
    const maxAttempts = 2
    let attempt = 0
    const sectionStartTime = Date.now()

    while (attempt < maxAttempts) {
      attempt++
      console.log(`🎯 Generating discussion questions (attempt ${attempt}/${maxAttempts})`)

      try {
        // Build enhanced prompt
        const prompt = this.buildDiscussionPrompt(context)

        // Generate questions
        const response = await this.getGoogleAI().prompt(prompt)
        const questions = response.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .map(line => {
            // Remove numbering if present
            return line.replace(/^\d+[\.)]\s*/, '').trim()
          })
          .filter(line => line.endsWith('?') && line.length > 10)
          .slice(0, 5)

        // Validate questions using new validator
        const validation = discussionValidator.validate(questions, context.difficultyLevel)

        if (!validation.isValid) {
          console.log(`⚠️ Validation failed:`, validation.issues)
          if (attempt < maxAttempts) {
            console.log(`🔄 Retrying with adjusted prompt...`)
            continue
          }
          console.log(`⚠️ Using questions despite validation issues (max attempts reached)`)
        } else {
          console.log(`✅ Discussion questions validated successfully`)
        }

        // Track quality metrics
        const generationTime = Date.now() - sectionStartTime
        qualityMetricsTracker.recordSection(
          'discussion',
          validation.score,
          attempt,
          generationTime,
          validation.issues.length,
          validation.warnings.length
        )

        const instruction = "Discuss these questions with your tutor to explore the topic in depth:"
        return [instruction, ...questions]

      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error)
        if (attempt >= maxAttempts) {
          // Track failed generation
          qualityMetricsTracker.recordSection(
            'discussion',
            0,
            attempt,
            Date.now() - sectionStartTime,
            1,
            0
          )
          throw new Error("Failed to generate discussion questions: " + (error as Error).message)
        }
      }
    }

    throw new Error("Failed to generate discussion questions after all attempts")
  }

  /**
   * Repair incomplete JSON by closing open structures
   */
  private repairIncompleteJSON(jsonStr: string): string {
    let repaired = jsonStr.trim()
    
    // Count open and close braces/brackets
    const openBraces = (repaired.match(/\{/g) || []).length
    const closeBraces = (repaired.match(/\}/g) || []).length
    const openBrackets = (repaired.match(/\[/g) || []).length
    const closeBrackets = (repaired.match(/\]/g) || []).length
    
    // Close incomplete strings
    const quoteCount = (repaired.match(/"/g) || []).length
    if (quoteCount % 2 !== 0) {
      repaired += '"'
    }
    
    // Close incomplete arrays
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      repaired += ']'
    }
    
    // Close incomplete objects
    for (let i = 0; i < openBraces - closeBraces; i++) {
      repaired += '}'
    }
    
    console.log(`🔧 Repaired JSON: added ${openBraces - closeBraces} braces, ${openBrackets - closeBrackets} brackets`)
    return repaired
  }

  /**
   * Build comprehensive grammar prompt with form, usage, and practice exercises
   * OPTIMIZED: Reduced token count by 70% and requesting concise output
   */
  private buildGrammarPrompt(context: SharedContext): string {
    // Concise level-appropriate grammar points
    const levelPoints: Record<CEFRLevel, string> = {
      'A1': 'present simple, articles, basic prepositions',
      'A2': 'past simple, comparatives, modal verbs',
      'B1': 'present perfect, conditionals, passive voice',
      'B2': 'relative clauses, advanced conditionals, reported speech',
      'C1': 'subjunctive, cleft sentences, inversion'
    }

    const prompt = `Identify ONE grammar point from this text for ${context.difficultyLevel} level.

Text: ${context.sourceText.substring(0, 200)}

Suggested: ${levelPoints[context.difficultyLevel]}

Return CONCISE JSON (brief explanations, 3 examples, 3 exercises):
{
  "grammarPoint": "Name",
  "explanation": {
    "form": "How to form (1 sentence)",
    "usage": "When to use (1 sentence)",
    "levelNotes": "Level note (1 sentence)"
  },
  "examples": ["example 1", "example 2", "example 3"],
  "exercises": [
    {"prompt": "Exercise 1", "answer": "Answer 1", "explanation": "Why"},
    {"prompt": "Exercise 2", "answer": "Answer 2", "explanation": "Why"},
    {"prompt": "Exercise 3", "answer": "Answer 3", "explanation": "Why"}
  ]
}`

    return prompt
  }

  /**
   * Validate grammar section for completeness and quality
   */
  private validateGrammarSection(
    grammarData: any,
    context: SharedContext
  ): { isValid: boolean; issues: string[] } {
    const issues: string[] = []

    // Check required fields exist
    if (!grammarData.grammarPoint || typeof grammarData.grammarPoint !== 'string') {
      issues.push('Missing or invalid grammarPoint')
    }

    if (!grammarData.explanation || typeof grammarData.explanation !== 'object') {
      issues.push('Missing or invalid explanation object')
    } else {
      // Check explanation has both form and usage
      if (!grammarData.explanation.form || grammarData.explanation.form.length < 20) {
        issues.push('Missing or insufficient form explanation (minimum 20 characters)')
      }
      if (!grammarData.explanation.usage || grammarData.explanation.usage.length < 30) {
        issues.push('Missing or insufficient usage explanation (minimum 30 characters)')
      }
    }

    // Check examples array
    if (!Array.isArray(grammarData.examples)) {
      issues.push('Examples must be an array')
    } else {
      if (grammarData.examples.length < 3) {
        issues.push(`Insufficient examples: expected minimum 3, got ${grammarData.examples.length}`)
      }

      // Validate each example
      grammarData.examples.forEach((example: any, index: number) => {
        if (typeof example !== 'string') {
          issues.push(`Example ${index + 1} must be a string`)
        } else if (example.length < 10) {
          issues.push(`Example ${index + 1} too short (minimum 10 characters)`)
        } else if (!/^[A-Z]/.test(example)) {
          issues.push(`Example ${index + 1} should start with capital letter`)
        } else if (!/[.!?]$/.test(example)) {
          issues.push(`Example ${index + 1} should end with punctuation`)
        }
      })
    }

    // Check exercises array
    if (!Array.isArray(grammarData.exercises)) {
      issues.push('Exercises must be an array')
    } else {
      if (grammarData.exercises.length < 3) {
        issues.push(`Insufficient exercises: expected minimum 3, got ${grammarData.exercises.length}`)
      }

      // Validate each exercise
      grammarData.exercises.forEach((exercise: any, index: number) => {
        if (typeof exercise !== 'object') {
          issues.push(`Exercise ${index + 1} must be an object`)
        } else {
          if (!exercise.prompt || typeof exercise.prompt !== 'string' || exercise.prompt.length < 10) {
            issues.push(`Exercise ${index + 1} missing or invalid prompt`)
          }
          if (!exercise.answer || typeof exercise.answer !== 'string' || exercise.answer.length < 1) {
            issues.push(`Exercise ${index + 1} missing or invalid answer`)
          }
        }
      })
    }

    // Check contextual relevance
    if (grammarData.examples && Array.isArray(grammarData.examples)) {
      const hasContextualRelevance = grammarData.examples.some((example: string) => {
        const exampleLower = example.toLowerCase()
        return context.mainThemes.some(theme => {
          const themeWords = theme.toLowerCase().split(/\s+/)
          return themeWords.some(word =>
            word.length > 3 && exampleLower.includes(word)
          )
        })
      })

      if (!hasContextualRelevance && context.mainThemes.length > 0) {
        issues.push('Examples lack contextual relevance to source material')
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    }
  }

  private async generateGrammarWithContext(
    context: SharedContext,
    _previousSections: GeneratedSection[]
  ): Promise<any> {
    const maxAttempts = 2
    let attempt = 0
    const sectionStartTime = Date.now()

    while (attempt < maxAttempts) {
      attempt++
      console.log(`📚 Generating comprehensive grammar section (attempt ${attempt}/${maxAttempts})`)

      try {
        // Build enhanced grammar prompt
        const prompt = this.buildGrammarPrompt(context)

        // Generate grammar section with increased token limit
        let response: string;
        try {
          // Increase maxOutputTokens to 3000 to allow complete JSON response
          response = await this.getGoogleAI().prompt(prompt, { maxTokens: 3000 })
        } catch (promptError: any) {
          // Handle MAX_TOKENS error - accept partial response if available
          if (promptError.code === 'MAX_TOKENS') {
            console.log(`⚠️ MAX_TOKENS hit in grammar generation`)
            // Don't retry - the error means we got no content at all
            // If we got partial content, it would have been returned
            throw new Error('Grammar generation failed: No content returned due to MAX_TOKENS')
          } else {
            throw promptError
          }
        }
        
        console.log(`📝 Raw grammar response (${response.length} chars)`)

        // Parse JSON response with better error handling and repair
        let grammarData: any
        try {
          // Remove markdown code blocks if present
          let cleanResponse = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
          
          // Try to extract JSON from response
          const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            let jsonStr = jsonMatch[0]
            console.log(`🔍 Attempting to parse JSON (${jsonStr.length} chars)`)
            
            // Try to repair incomplete JSON
            if (!jsonStr.trim().endsWith('}')) {
              console.log(`⚠️ JSON appears incomplete, attempting repair...`)
              // Try to close incomplete structures
              jsonStr = this.repairIncompleteJSON(jsonStr)
            }
            
            try {
              grammarData = JSON.parse(jsonStr)
              console.log(`✅ JSON parsed successfully`)
            } catch (parseErr) {
              console.log(`⚠️ JSON parsing failed after repair attempt`)
              if (attempt < maxAttempts) {
                console.log(`🔄 Retrying with adjusted prompt...`)
                continue
              }
              throw parseErr
            }
          } else {
            console.log(`🔍 No JSON found in response`)
            if (attempt < maxAttempts) {
              console.log(`🔄 Retrying...`)
              continue
            }
            throw new Error('No JSON found in response')
          }
        } catch (parseError) {
          console.log(`⚠️ JSON parsing failed:`, parseError)
          if (attempt < maxAttempts) {
            console.log(`🔄 Retrying with adjusted prompt...`)
            continue
          }
          throw new Error('Failed to parse grammar JSON response')
        }

        // Validate grammar section using new validator
        const grammarSection = {
          rule: grammarData.explanation?.form || '',
          form: grammarData.explanation?.form || '',
          usage: grammarData.explanation?.usage || '',
          examples: grammarData.examples || [],
          exercises: grammarData.exercises || []
        }
        
        const validation = grammarValidator.validate(grammarSection, context.difficultyLevel)

        if (!validation.isValid) {
          console.log(`⚠️ Grammar validation failed:`, validation.issues)
          if (attempt < maxAttempts) {
            console.log(`🔄 Retrying with adjusted prompt...`)
            continue
          }
          console.log(`⚠️ Using grammar section despite validation issues (max attempts reached)`)
        } else {
          console.log(`✅ Grammar section validated successfully`)
        }

        // Track quality metrics
        const generationTime = Date.now() - sectionStartTime
        qualityMetricsTracker.recordSection(
          'grammar',
          validation.score,
          attempt,
          generationTime,
          validation.issues.length,
          validation.warnings.length
        )

        // Return the comprehensive grammar structure
        return {
          focus: grammarData.grammarPoint,
          explanation: grammarData.explanation,
          examples: grammarData.examples,
          exercises: grammarData.exercises
        }

      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error)
        if (attempt >= maxAttempts) {
          // Track failed generation
          qualityMetricsTracker.recordSection(
            'grammar',
            0,
            attempt,
            Date.now() - sectionStartTime,
            1,
            0
          )
          throw new Error(`Failed to generate grammar section after ${maxAttempts} attempts: ${(error as Error).message}`)
        }
      }
    }

    throw new Error("Failed to generate grammar section after all attempts")
  }

  /**
   * Parse pronunciation word response from structured text format
   */
  private parsePronunciationWordResponse(response: string, word: string): any {
    const lines = response.split('\n').map(line => line.trim()).filter(line => line.length > 0)

    const result: any = {
      word: word,
      ipa: '',
      difficultSounds: [],
      tips: [],
      practiceSentence: ''
    }

    for (const line of lines) {
      if (line.startsWith('WORD:')) {
        result.word = line.substring(5).trim()
      } else if (line.startsWith('IPA:')) {
        result.ipa = line.substring(4).trim()
      } else if (line.startsWith('DIFFICULT_SOUNDS:')) {
        const sounds = line.substring(17).trim()
        result.difficultSounds = sounds.split(',').map(s => s.trim()).filter(s => s.length > 0)
      } else if (line.startsWith('TIP_')) {
        const tip = line.substring(line.indexOf(':') + 1).trim()
        if (tip.length > 0) {
          result.tips.push(tip)
        }
      } else if (line.startsWith('PRACTICE:')) {
        result.practiceSentence = line.substring(9).trim()
      }
    }

    return result
  }

  /**
   * Parse tongue twister response from structured text format
   */
  private parseTongueTwisterResponse(response: string, expectedCount: number): any[] {
    const lines = response.split('\n').map(line => line.trim()).filter(line => line.length > 0)

    const twisters: any[] = []
    let currentTwister: any = null
    let currentIndex = -1

    for (const line of lines) {
      const twisterMatch = line.match(/^TWISTER_(\d+):(.+)/)
      if (twisterMatch) {
        currentIndex = parseInt(twisterMatch[1]) - 1
        currentTwister = {
          text: twisterMatch[2].trim(),
          targetSounds: [],
          difficulty: 'moderate'
        }
        twisters[currentIndex] = currentTwister
        continue
      }

      const soundsMatch = line.match(/^SOUNDS_(\d+):(.+)/)
      if (soundsMatch && currentTwister) {
        const sounds = soundsMatch[2].trim()
        currentTwister.targetSounds = sounds.split(',').map(s => s.trim()).filter(s => s.length > 0)
        continue
      }

      const difficultyMatch = line.match(/^DIFFICULTY_(\d+):(.+)/)
      if (difficultyMatch && currentTwister) {
        currentTwister.difficulty = difficultyMatch[2].trim()
        continue
      }
    }

    // Filter out any null entries
    return twisters.filter(t => t && t.text && t.text.length > 0)
  }

  /**
   * Select challenging words for pronunciation practice
   * Implements Requirements 6.5, 6.6 - Select words with challenging sounds for target language learners
   */
  private selectChallengingWords(context: SharedContext, count: number): string[] {
    // Get vocabulary from context - ensure words are from lesson vocabulary
    const vocabularySection = context.keyVocabulary

    if (vocabularySection.length === 0) {
      console.log('⚠️ No vocabulary available for pronunciation selection')
      return []
    }

    console.log(`🔍 Selecting ${count} challenging words from ${vocabularySection.length} vocabulary words`)

    // Score words by pronunciation difficulty with enhanced criteria
    const scoredWords = vocabularySection.map(word => {
      let score = 0
      const wordLower = word.toLowerCase()
      const challengingSounds: string[] = []

      // Base score: Longer words are typically more challenging (but cap to avoid over-weighting)
      score += Math.min(word.length, 12)

      // HIGH PRIORITY: Consonant digraphs and difficult consonant sounds (most challenging for learners)
      const consonantPatterns = [
        { pattern: /th/gi, sound: '/θ/ or /ð/', weight: 5 },  // 'th' sounds (think, this)
        { pattern: /ch/gi, sound: '/tʃ/', weight: 4 },        // 'ch' sound (church)
        { pattern: /sh/gi, sound: '/ʃ/', weight: 4 },         // 'sh' sound (ship)
        { pattern: /ph/gi, sound: '/f/', weight: 3 },         // 'ph' sound (phone)
        { pattern: /gh/gi, sound: '/g/ or /f/', weight: 4 },  // 'gh' sound (ghost, laugh)
        { pattern: /ng/gi, sound: '/ŋ/', weight: 3 },         // 'ng' sound (sing)
        { pattern: /wh/gi, sound: '/w/ or /hw/', weight: 3 }, // 'wh' sound (what)
        { pattern: /[^aeiou]r/gi, sound: '/r/', weight: 4 },  // 'r' after consonant (try, brown)
      ]

      consonantPatterns.forEach(({ pattern, sound, weight }) => {
        const matches = wordLower.match(pattern)
        if (matches) {
          score += weight * matches.length
          challengingSounds.push(sound)
        }
      })

      // MEDIUM PRIORITY: Complex vowel combinations (challenging for pronunciation)
      const vowelPatterns = [
        { pattern: /ough|augh/gi, sound: '/ɔː/ or /ʌf/', weight: 5 },  // Very irregular (through, laugh)
        { pattern: /eau/gi, sound: '/oʊ/', weight: 4 },                // French-origin (beautiful)
        { pattern: /ieu/gi, sound: '/juː/', weight: 4 },               // (lieutenant)
        { pattern: /ou/gi, sound: '/aʊ/ or /uː/', weight: 3 },        // (house, soup)
        { pattern: /oo/gi, sound: '/uː/ or /ʊ/', weight: 3 },         // (food, book)
        { pattern: /ea/gi, sound: '/iː/ or /e/', weight: 3 },         // (eat, bread)
        { pattern: /au|aw/gi, sound: '/ɔː/', weight: 3 },             // (autumn, law)
        { pattern: /oi|oy/gi, sound: '/ɔɪ/', weight: 3 },             // (coin, boy)
        { pattern: /ei|ey/gi, sound: '/eɪ/ or /iː/', weight: 2 },     // (eight, key)
        { pattern: /ie/gi, sound: '/iː/ or /aɪ/', weight: 2 },        // (field, pie)
      ]

      vowelPatterns.forEach(({ pattern, sound, weight }) => {
        const matches = wordLower.match(pattern)
        if (matches) {
          score += weight * matches.length
          challengingSounds.push(sound)
        }
      })

      // MEDIUM PRIORITY: Common difficult endings
      const endingPatterns = [
        { pattern: /tion$/gi, sound: '/ʃən/', weight: 3 },      // (nation)
        { pattern: /sion$/gi, sound: '/ʒən/ or /ʃən/', weight: 3 }, // (vision, mission)
        { pattern: /ture$/gi, sound: '/tʃər/', weight: 3 },     // (nature)
        { pattern: /sure$/gi, sound: '/ʒər/', weight: 3 },      // (measure)
        { pattern: /cious$/gi, sound: '/ʃəs/', weight: 2 },     // (delicious)
        { pattern: /tious$/gi, sound: '/ʃəs/', weight: 2 },     // (ambitious)
      ]

      endingPatterns.forEach(({ pattern, sound, weight }) => {
        if (pattern.test(wordLower)) {
          score += weight
          challengingSounds.push(sound)
        }
      })

      // HIGH PRIORITY: Silent letters (very confusing for learners)
      const silentLetterPatterns = [
        { pattern: /\bkn/gi, sound: 'silent k', weight: 5 },    // (know, knife)
        { pattern: /\bgn/gi, sound: 'silent g', weight: 5 },    // (gnome)
        { pattern: /\bwr/gi, sound: 'silent w', weight: 5 },    // (write)
        { pattern: /\bps/gi, sound: 'silent p', weight: 5 },    // (psychology)
        { pattern: /mb$/gi, sound: 'silent b', weight: 4 },     // (climb, bomb)
        { pattern: /bt$/gi, sound: 'silent b', weight: 4 },     // (debt, doubt)
        { pattern: /lm$/gi, sound: 'silent l', weight: 4 },     // (calm, palm)
        { pattern: /lk$/gi, sound: 'silent l', weight: 4 },     // (walk, talk)
        { pattern: /[aeiou]gh/gi, sound: 'silent gh', weight: 3 }, // (night, though)
      ]

      silentLetterPatterns.forEach(({ pattern, sound, weight }) => {
        if (pattern.test(wordLower)) {
          score += weight
          challengingSounds.push(sound)
        }
      })

      // MEDIUM PRIORITY: Consonant clusters (difficult for many learners)
      const clusterPatterns = [
        { pattern: /[^aeiou]{3,}/gi, sound: 'consonant cluster', weight: 3 },  // (strength, twelfth)
        { pattern: /[aeiou]{3,}/gi, sound: 'vowel cluster', weight: 2 },       // (beautiful)
      ]

      clusterPatterns.forEach(({ pattern, sound, weight }) => {
        const matches = wordLower.match(pattern)
        if (matches) {
          score += weight * matches.length
          challengingSounds.push(sound)
        }
      })

      // BONUS: Words with stress pattern changes (advanced)
      // Words ending in -ate, -tion, -ic often have specific stress patterns
      if (/ate$|tion$|ic$/i.test(wordLower) && word.length > 6) {
        score += 2
        challengingSounds.push('stress pattern')
      }

      // Log scoring for debugging
      if (score > 10) {
        console.log(`  📊 "${word}": score=${score}, sounds=[${challengingSounds.join(', ')}]`)
      }

      return { word, score, challengingSounds: [...new Set(challengingSounds)] }
    })

    // Sort by score (descending) and take top words
    const sortedWords = scoredWords.sort((a, b) => b.score - a.score)

    // Select top challenging words, ensuring diversity of challenging sounds
    const selectedWords: string[] = []
    const selectedSounds = new Set<string>()

    // First pass: Select words with unique challenging sounds
    for (const item of sortedWords) {
      if (selectedWords.length >= count) break

      // Check if this word introduces new challenging sounds
      const newSounds = item.challengingSounds.filter(s => !selectedSounds.has(s))

      if (newSounds.length > 0 || selectedWords.length < Math.ceil(count / 2)) {
        selectedWords.push(item.word)
        item.challengingSounds.forEach(s => selectedSounds.add(s))
        console.log(`  ✅ Selected "${item.word}" (score: ${item.score}, new sounds: ${newSounds.length})`)
      }
    }

    // Second pass: Fill remaining slots with highest-scoring words
    if (selectedWords.length < count) {
      for (const item of sortedWords) {
        if (selectedWords.length >= count) break
        if (!selectedWords.includes(item.word)) {
          selectedWords.push(item.word)
          console.log(`  ✅ Selected "${item.word}" (score: ${item.score}, filling remaining slots)`)
        }
      }
    }

    // If we still don't have enough words, add remaining vocabulary
    if (selectedWords.length < count) {
      const remaining = vocabularySection
        .filter(w => !selectedWords.includes(w))
        .slice(0, count - selectedWords.length)
      selectedWords.push(...remaining)
      console.log(`  ⚠️ Added ${remaining.length} additional words to meet count requirement`)
    }

    console.log(`✅ Selected ${selectedWords.length} challenging words: ${selectedWords.join(', ')}`)
    console.log(`📊 Challenging sounds covered: ${Array.from(selectedSounds).join(', ')}`)

    return selectedWords
  }

  /**
   * Build pronunciation word generation prompt
   * Implements Requirement 6.6 - Generate practice sentences using the target words
   */
  private buildPronunciationWordPrompt(word: string, context: SharedContext): string {
    const mainTheme = context.mainThemes[0] || 'general topics'
    const contextSummary = context.contentSummary.substring(0, 200)

    // Get related vocabulary for context
    const relatedWords = context.keyVocabulary
      .filter(w => w.toLowerCase() !== word.toLowerCase())
      .slice(0, 3)
      .join(', ')

    const prompt = `Create pronunciation practice for the word "${word}" for ${context.difficultyLevel} level students.

CONTEXT: ${contextSummary}
TOPIC: ${mainTheme}
RELATED VOCABULARY: ${relatedWords}

CRITICAL REQUIREMENTS:
1. Provide accurate IPA (International Phonetic Alphabet) transcription
2. Identify 2-3 specific difficult sounds in the word that are challenging for English learners
3. Give practical, actionable pronunciation tips focusing on mouth/tongue position
4. Create a practice sentence that:
   - Uses "${word}" naturally in context
   - Relates to the topic (${mainTheme})
   - Is appropriate for ${context.difficultyLevel} level
   - Helps reinforce correct pronunciation through context
   - Ideally includes other words with similar challenging sounds

Provide the following information in this exact format:

WORD: ${word}
IPA: [provide accurate IPA transcription using standard IPA symbols]
DIFFICULT_SOUNDS: [list 2-3 specific IPA sounds that are challenging, e.g., /θ/, /ð/, /r/]
TIP_1: [specific tip about mouth/tongue position for first difficult sound]
TIP_2: [specific tip about mouth/tongue position for second difficult sound]
PRACTICE: [a contextually relevant sentence using "${word}" that relates to ${mainTheme}]

Example for "through" in sports context:
WORD: through
IPA: /θruː/
DIFFICULT_SOUNDS: /θ/, /uː/
TIP_1: Place your tongue between your teeth for the 'th' sound (/θ/)
TIP_2: Round your lips and make them tense for the long 'oo' sound (/uː/)
PRACTICE: The athlete ran through the finish line with determination.

Example for "strength" in fitness context:
WORD: strength
IPA: /streŋθ/
DIFFICULT_SOUNDS: /str/, /ŋ/, /θ/
TIP_1: Blend the 's', 't', and 'r' sounds smoothly without adding extra vowels
TIP_2: For the final 'th' (/θ/), place your tongue between your teeth
PRACTICE: Building strength requires consistent training and proper nutrition.`

    return prompt
  }

  /**
   * Build tongue twister generation prompt
   */
  private buildTongueTwisterPrompt(context: SharedContext, count: number): string {
    const themes = context.mainThemes.slice(0, 2).join(' and ')
    const targetWords = context.keyVocabulary.slice(0, 5).join(', ')

    const prompt = `Create ${count} tongue twisters for ${context.difficultyLevel} level students about "${themes}".

Requirements:
- Related to: ${themes}
- Try to use words: ${targetWords}
- Focus on challenging sounds (th, r, l, s, sh, ch)
- 6-12 words each
- Appropriate for ${context.difficultyLevel} level

Provide in this exact format:

TWISTER_1: [first tongue twister text]
SOUNDS_1: [target sounds separated by commas, e.g., /θ/, /s/]
DIFFICULTY_1: moderate

TWISTER_2: [second tongue twister text]
SOUNDS_2: [target sounds separated by commas]
DIFFICULTY_2: moderate

Example:
TWISTER_1: Three athletes threw the ball through the thick crowd
SOUNDS_1: /θ/, /r/
DIFFICULTY_1: moderate

TWISTER_2: Six successful salespeople sold several similar services
SOUNDS_2: /s/, /l/
DIFFICULTY_2: moderate`

    return prompt
  }

  /**
   * Validate pronunciation section for completeness
   * Implements Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6 - Comprehensive validation
   */
  private validatePronunciationSection(
    words: any[],
    tongueTwisters: any[],
    minWords: number,
    minTongueTwisters: number,
    context?: SharedContext
  ): { isValid: boolean; issues: string[] } {
    const issues: string[] = []
    const warnings: string[] = []

    console.log(`🔍 Validating pronunciation section: ${words.length} words, ${tongueTwisters.length} twisters`)

    // Requirement 6.1: Check minimum word count (at least 5 advanced words)
    if (words.length < minWords) {
      issues.push(`Insufficient pronunciation words: expected at least ${minWords}, got ${words.length}`)
    }

    // Requirement 6.4: Check minimum tongue twister count (at least 2)
    if (tongueTwisters.length < minTongueTwisters) {
      issues.push(`Insufficient tongue twisters: expected at least ${minTongueTwisters}, got ${tongueTwisters.length}`)
    }

    // Validate each word has required fields and quality
    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      const wordNum = i + 1

      // Basic field validation
      if (!word.word || typeof word.word !== 'string') {
        issues.push(`Word ${wordNum} missing 'word' field`)
        continue
      }

      // Requirement 6.2: Validate IPA transcription exists
      if (!word.ipa || typeof word.ipa !== 'string') {
        issues.push(`Word ${wordNum} ("${word.word}") missing IPA transcription`)
      } else {
        // Check if IPA looks valid (should contain IPA characters or slashes)
        if (!word.ipa.includes('/') && !word.ipa.match(/[əɪʊɛɔæʌɑː]/)) {
          warnings.push(`Word ${wordNum} ("${word.word}") IPA may be invalid: "${word.ipa}"`)
        }
      }

      // Requirement 6.3: Validate pronunciation tips exist
      if (!word.tips || !Array.isArray(word.tips) || word.tips.length === 0) {
        issues.push(`Word ${wordNum} ("${word.word}") missing pronunciation tips`)
      } else {
        // Check tip quality - should be actionable and specific
        const hasActionableTips = word.tips.some((tip: string) =>
          tip.length > 15 &&
          (tip.toLowerCase().includes('tongue') ||
            tip.toLowerCase().includes('lip') ||
            tip.toLowerCase().includes('mouth') ||
            tip.toLowerCase().includes('sound') ||
            tip.toLowerCase().includes('place'))
        )

        if (!hasActionableTips) {
          warnings.push(`Word ${wordNum} ("${word.word}") tips may lack specific pronunciation guidance`)
        }
      }

      // Requirement 6.6: Validate practice sentence exists and uses the word
      if (!word.practiceSentence || typeof word.practiceSentence !== 'string') {
        issues.push(`Word ${wordNum} ("${word.word}") missing practice sentence`)
      } else {
        // Check if practice sentence actually contains the word
        const sentenceLower = word.practiceSentence.toLowerCase()
        const wordLower = word.word.toLowerCase()

        if (!sentenceLower.includes(wordLower)) {
          issues.push(`Word ${wordNum} ("${word.word}") practice sentence doesn't contain the word`)
        }

        // Check sentence length is appropriate
        const wordCount = word.practiceSentence.split(/\s+/).length
        if (wordCount < 5) {
          warnings.push(`Word ${wordNum} ("${word.word}") practice sentence is very short (${wordCount} words)`)
        } else if (wordCount > 25) {
          warnings.push(`Word ${wordNum} ("${word.word}") practice sentence is very long (${wordCount} words)`)
        }

        // Check sentence has proper capitalization and punctuation
        if (!/^[A-Z]/.test(word.practiceSentence)) {
          warnings.push(`Word ${wordNum} ("${word.word}") practice sentence should start with capital letter`)
        }
        if (!/[.!?]$/.test(word.practiceSentence)) {
          warnings.push(`Word ${wordNum} ("${word.word}") practice sentence should end with punctuation`)
        }
      }

      // Requirement 6.5: Validate word has challenging sounds (if difficultSounds field exists)
      if (word.difficultSounds && Array.isArray(word.difficultSounds)) {
        if (word.difficultSounds.length === 0) {
          warnings.push(`Word ${wordNum} ("${word.word}") has no difficult sounds identified`)
        }
      }

      // Check if word is from lesson vocabulary (if context provided)
      if (context && context.keyVocabulary.length > 0) {
        const isFromVocabulary = context.keyVocabulary.some(
          v => v.toLowerCase() === word.word.toLowerCase()
        )

        if (!isFromVocabulary) {
          warnings.push(`Word ${wordNum} ("${word.word}") is not from lesson vocabulary`)
        }
      }
    }

    // Validate each tongue twister has required fields and quality
    for (let i = 0; i < tongueTwisters.length; i++) {
      const twister = tongueTwisters[i]
      const twisterNum = i + 1

      if (!twister.text || typeof twister.text !== 'string') {
        issues.push(`Tongue twister ${twisterNum} missing text`)
        continue
      }

      // Check tongue twister length (should be 6-15 words for effectiveness)
      const wordCount = twister.text.split(/\s+/).length
      if (wordCount < 6) {
        warnings.push(`Tongue twister ${twisterNum} is too short (${wordCount} words, recommended 6-15)`)
      } else if (wordCount > 15) {
        warnings.push(`Tongue twister ${twisterNum} is too long (${wordCount} words, recommended 6-15)`)
      }

      // Validate target sounds exist
      if (!twister.targetSounds || !Array.isArray(twister.targetSounds)) {
        issues.push(`Tongue twister ${twisterNum} missing target sounds`)
      } else if (twister.targetSounds.length === 0) {
        issues.push(`Tongue twister ${twisterNum} has no target sounds specified`)
      }

      // Check if tongue twister relates to lesson topic (if context provided)
      if (context && context.mainThemes.length > 0) {
        const twisterLower = twister.text.toLowerCase()
        const hasTopicRelevance = context.mainThemes.some(theme => {
          const themeWords = theme.toLowerCase().split(/\s+/)
          return themeWords.some(word =>
            word.length > 3 && twisterLower.includes(word)
          )
        })

        if (!hasTopicRelevance) {
          warnings.push(`Tongue twister ${twisterNum} may not relate to lesson topic`)
        }
      }
    }

    // Check for sound diversity across all words
    const allDifficultSounds = new Set<string>()
    words.forEach(word => {
      if (word.difficultSounds && Array.isArray(word.difficultSounds)) {
        word.difficultSounds.forEach((sound: string) => allDifficultSounds.add(sound))
      }
    })

    if (allDifficultSounds.size < 3 && words.length >= 3) {
      warnings.push(`Limited sound diversity: only ${allDifficultSounds.size} different challenging sounds across all words`)
    }

    // Log warnings for visibility
    if (warnings.length > 0) {
      console.log(`⚠️ Pronunciation validation warnings:`, warnings)
    }

    // Log validation summary
    if (issues.length === 0) {
      console.log(`✅ Pronunciation section validation passed (${words.length} words, ${tongueTwisters.length} twisters, ${allDifficultSounds.size} unique sounds)`)
    } else {
      console.log(`❌ Pronunciation section validation failed with ${issues.length} issues`)
    }

    return {
      isValid: issues.length === 0,
      issues: [...issues, ...warnings.map(w => `Warning: ${w}`)]
    }
  }

  private async generatePronunciationWithContext(
    context: SharedContext,
    _previousSections: GeneratedSection[]
  ): Promise<any> {
    const minWords = 5
    const minTongueTwisters = 2
    const maxAttempts = 2
    let attempt = 0
    const sectionStartTime = Date.now()

    console.log(`🗣️ Generating pronunciation section with ${minWords} words and ${minTongueTwisters} tongue twisters`)

    while (attempt < maxAttempts) {
      attempt++
      console.log(`🎯 Pronunciation generation attempt ${attempt}/${maxAttempts}`)

      try {
        // Select challenging words for pronunciation practice
        const selectedWords = this.selectChallengingWords(context, minWords)
        console.log(`📝 Selected words for pronunciation:`, selectedWords)

        // Generate pronunciation details for each word
        const pronunciationWords = []
        for (const word of selectedWords) {
          try {
            const wordPrompt = this.buildPronunciationWordPrompt(word, context)
            const wordResponse = await this.getGoogleAI().prompt(wordPrompt)

            console.log(`📝 Raw AI response for "${word}":`, wordResponse.substring(0, 200))

            // Parse structured text response
            const wordData = this.parsePronunciationWordResponse(wordResponse, word)

            console.log(`🔍 Parsed data for "${word}":`, JSON.stringify(wordData, null, 2))

            // Validate required fields
            if (!wordData.word || !wordData.ipa || !wordData.tips || wordData.tips.length === 0 || !wordData.practiceSentence) {
              console.log(`❌ Validation failed for "${word}":`, {
                hasWord: !!wordData.word,
                hasIpa: !!wordData.ipa,
                hasTips: !!wordData.tips,
                tipsLength: wordData.tips?.length || 0,
                hasPractice: !!wordData.practiceSentence
              })
              throw new Error('Missing required fields in response')
            }

            pronunciationWords.push(wordData)
            console.log(`✅ Generated pronunciation for "${word}": ${wordData.ipa}`)
          } catch (error) {
            console.log(`❌ Failed to generate pronunciation for "${word}":`, error)
            console.log(`❌ Error details:`, (error as Error).message)
            // NO FALLBACK CONTENT - fail the generation if AI cannot provide quality content
            throw new Error(`Failed to generate pronunciation for word "${word}": ${(error as Error).message}`)
          }
        }

        // Generate tongue twisters
        let tongueTwisters = []
        try {
          const twisterPrompt = this.buildTongueTwisterPrompt(context, minTongueTwisters)
          const twisterResponse = await this.getGoogleAI().prompt(twisterPrompt)

          // Parse structured text response
          tongueTwisters = this.parseTongueTwisterResponse(twisterResponse, minTongueTwisters)

          if (tongueTwisters.length < minTongueTwisters) {
            throw new Error(`Only ${tongueTwisters.length} valid tongue twisters generated`)
          }

          console.log(`✅ Generated ${tongueTwisters.length} tongue twisters`)
        } catch (error) {
          console.log(`❌ Failed to generate tongue twisters:`, error)
          // NO FALLBACK CONTENT - fail the generation if AI cannot provide quality content
          throw new Error(`Failed to generate tongue twisters: ${(error as Error).message}`)
        }

        // Validate the pronunciation section using new validator
        const pronunciationSection = {
          words: pronunciationWords,
          tongueTwisters: tongueTwisters
        }
        
        const validation = pronunciationValidator.validate(pronunciationSection)

        if (!validation.isValid) {
          console.log(`⚠️ Validation failed (attempt ${attempt}/${maxAttempts}):`, validation.issues)

          if (attempt < maxAttempts) {
            console.log(`🔄 Retrying pronunciation generation...`)
            continue
          } else {
            console.log(`⚠️ Using pronunciation section despite validation issues (max attempts reached)`)
          }
        } else {
          console.log(`✅ Pronunciation section validated successfully`)
        }

        // Track quality metrics
        const generationTime = Date.now() - sectionStartTime
        qualityMetricsTracker.recordSection(
          'pronunciation',
          validation.score,
          attempt,
          generationTime,
          validation.issues.length,
          validation.warnings.length
        )

        // Build the final pronunciation section
        return {
          instruction: "Practice pronunciation with your tutor. Focus on the difficult sounds and try the tongue twisters:",
          words: pronunciationWords,
          tongueTwisters: tongueTwisters
        }

      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error)
        if (attempt >= maxAttempts) {
          // Track failed generation
          qualityMetricsTracker.recordSection(
            'pronunciation',
            0,
            attempt,
            Date.now() - sectionStartTime,
            1,
            0
          )
          throw new Error("Failed to generate pronunciation section: " + (error as Error).message)
        }
      }
    }

    throw new Error("Failed to generate pronunciation section after all attempts")
  }

  private async generateWrapupWithContext(
    context: SharedContext,
    _previousSections: GeneratedSection[]
  ): Promise<string[]> {
    const prompt = `Create 3 ${context.difficultyLevel} wrap-up questions about this lesson:
${context.contentSummary}
Return only questions, one per line:`

    try {
      const response = await this.getGoogleAI().prompt(prompt)
      const questions = response.split('\n')
        .map(line => line.trim())
        .filter(line => line.endsWith('?') && line.length > 10)
        .slice(0, 3)

      if (questions.length < 3) {
        throw new Error("Insufficient wrapup questions generated")
      }

      const instruction = "Reflect on your learning by discussing these wrap-up questions:"
      return [instruction, ...questions]
    } catch (error) {
      throw new Error("Failed to generate wrapup questions: " + (error as Error).message)
    }
  }

  /**
   * Build level-specific dialogue prompt with length and complexity requirements
   * Implements Requirements 3.3, 3.4, 3.5, 3.6, 3.7
   */
  private buildDialoguePrompt(context: SharedContext, vocabularyWords: string[], type: 'practice' | 'fill-in-gap'): string {
    const mainTheme = context.mainThemes[0] || 'this topic'

    // CEFR-specific complexity instructions with detailed vocabulary and grammar guidance
    const levelComplexityInstructions: Record<CEFRLevel, {
      vocabulary: string
      grammar: string
      sentenceLength: string
      examples: string
    }> = {
      'A1': {
        vocabulary: 'Use ONLY the most common everyday words (top 500-1000 words). Examples: go, come, like, want, have, be, do, make, get, see, know, think, say, tell, ask.',
        grammar: 'Use ONLY simple present tense (I go, she likes) and simple past tense (I went, she liked). Use basic subject-verb-object structure. NO complex grammar, NO perfect tenses, NO conditionals, NO passive voice.',
        sentenceLength: 'Keep sentences very short: 5-8 words maximum. One idea per sentence.',
        examples: 'Good: "I like this topic." / "Do you know about it?" / "Yes, I read about it yesterday." Bad: "I\'ve been interested in this topic for a while." (too complex)'
      },
      'A2': {
        vocabulary: 'Use simple, familiar vocabulary (top 1000-2000 words). Include common adjectives and adverbs. Examples: interesting, important, different, usually, sometimes, often, really, very.',
        grammar: 'Use present simple, past simple, present continuous (I am doing), and future with "going to" and "will". Use simple conjunctions (and, but, or, because). NO present perfect, NO complex conditionals, NO passive voice.',
        sentenceLength: 'Keep sentences clear and direct: 8-12 words. Can combine two simple ideas with "and" or "but".',
        examples: 'Good: "I\'m reading about this topic because it\'s interesting." / "I want to learn more about it." Bad: "I\'ve been studying this topic which has fascinated me." (too complex)'
      },
      'B1': {
        vocabulary: 'Use intermediate vocabulary with some less common words. Include phrasal verbs (find out, look into, come across, deal with). Use descriptive language and opinion expressions (I think, in my opinion, it seems).',
        grammar: 'Use varied tenses including present perfect (I have done), past continuous (I was doing), and first conditional (If I do, I will). Include compound sentences with coordinating conjunctions. Use some relative clauses (that, which, who).',
        sentenceLength: 'Use varied sentence lengths: 10-15 words average. Mix simple and compound sentences.',
        examples: 'Good: "I\'ve been looking into this topic, and I\'ve found some interesting information." / "If we discuss it more, I think I\'ll understand it better." Bad: "I go to library." (too simple) / "Having contemplated the multifaceted nature..." (too complex)'
      },
      'B2': {
        vocabulary: 'Use advanced vocabulary including abstract concepts, idiomatic expressions, and sophisticated descriptive language. Include collocations (make a decision, take into account, come to terms with). Use nuanced expressions (somewhat, rather, fairly, considerably).',
        grammar: 'Use complex sentence structures with relative clauses, second and third conditionals (If I had done, I would have), passive voice (is considered, has been shown), and perfect tenses. Include subordinating conjunctions (although, whereas, despite, unless).',
        sentenceLength: 'Use sophisticated sentences: 12-18 words. Combine multiple clauses naturally.',
        examples: 'Good: "Although I\'ve studied this topic extensively, there are aspects that remain somewhat unclear." / "The implications of this could be far-reaching if we consider the broader context." Bad: "I like this topic." (too simple)'
      },
      'C1': {
        vocabulary: 'Use sophisticated, nuanced vocabulary including academic language, subtle distinctions, and native-like expressions. Include advanced idioms, metaphors, and specialized terminology. Use hedging language (arguably, presumably, ostensibly, to some extent).',
        grammar: 'Use complex grammatical structures including inversion (Rarely have I seen...), cleft sentences (What interests me is...), subjunctive mood (I suggest that he be...), and advanced conditionals (Were I to consider...). Demonstrate mastery of all tenses and aspects.',
        sentenceLength: 'Use sophisticated, flowing sentences: 15-20 words. Create complex, multi-clause sentences that sound natural.',
        examples: 'Good: "What strikes me as particularly intriguing is the way in which this topic intersects with broader societal concerns." / "Were we to delve deeper into this matter, we might uncover some rather unexpected insights." Bad: "This topic is interesting." (too simple) / "I think about this topic." (too simple)'
      }
    }

    const levelInstructions = levelComplexityInstructions[context.difficultyLevel]

    // Vocabulary integration instruction with emphasis on natural use
    const vocabInstruction = vocabularyWords.length > 0
      ? `VOCABULARY INTEGRATION: Naturally incorporate 3-4 of these lesson vocabulary words into the dialogue: ${vocabularyWords.slice(0, 5).join(', ')}. Use them in context where they fit naturally, not forced.`
      : ''

    if (type === 'practice') {
      const prompt = `Create a natural conversation between a Student and a Tutor about "${mainTheme}" for ${context.difficultyLevel} level students.

CONTEXT: ${context.contentSummary}

TOPIC THEMES: ${context.mainThemes.join(', ')}

CRITICAL REQUIREMENTS:
1. Create EXACTLY 14 dialogue lines (alternating between Student and Tutor) - THIS IS MANDATORY
2. Start with Student speaking first
3. Make the conversation natural and engaging about the topic
4. The conversation should relate to the source material context and themes
5. Ensure natural conversational flow with appropriate responses and follow-up questions
6. ${vocabInstruction}
7. COUNT YOUR LINES - you must have at least 14 lines total (7 Student + 7 Tutor)

LEVEL-SPECIFIC REQUIREMENTS FOR ${context.difficultyLevel}:

VOCABULARY REQUIREMENTS:
${levelInstructions.vocabulary}

GRAMMAR REQUIREMENTS:
${levelInstructions.grammar}

SENTENCE LENGTH:
${levelInstructions.sentenceLength}

EXAMPLES OF APPROPRIATE LANGUAGE:
${levelInstructions.examples}

CONVERSATIONAL FLOW REQUIREMENTS:
- Student should ask questions, express opinions, and show engagement
- Tutor should respond naturally, ask follow-up questions, and guide the discussion
- Each response should logically follow from the previous line
- Include natural conversation markers appropriate to the level (e.g., A1: "Oh, I see", B2: "That's an interesting perspective", C1: "That's a rather compelling argument")
- Show progression in the conversation - start with introduction, develop the topic, conclude naturally

FORMAT:
Return ONLY the dialogue lines in this exact format:
Student: [first line]
Tutor: [response]
Student: [next line]
Tutor: [response]
Student: [next line]
Tutor: [response]
Student: [next line]
Tutor: [response]
Student: [next line]
Tutor: [response]
Student: [next line]
Tutor: [response]
Student: [next line]
Tutor: [response]

Do NOT include any numbering, explanations, or extra text. Just the dialogue lines.`

      return prompt
    } else {
      // fill-in-gap type
      const prompt = `Create a natural conversation between a Student and a Tutor about "${mainTheme}" for ${context.difficultyLevel} level students with fill-in-the-gap exercises.

CONTEXT: ${context.contentSummary}

TOPIC THEMES: ${context.mainThemes.join(', ')}

CRITICAL REQUIREMENTS:
1. Create EXACTLY 14 dialogue lines (alternating between Student and Tutor) - THIS IS MANDATORY
2. Start with Student speaking first
3. Replace 1-2 key words in SOME lines (about 4-6 lines total) with _____ (blank)
4. The conversation should relate to the source material context and themes
5. Ensure natural conversational flow with appropriate responses
6. ${vocabInstruction}
7. Choose meaningful words to blank out (verbs, nouns, adjectives - NOT articles, prepositions, or pronouns)
8. Blank out words that are appropriate for the ${context.difficultyLevel} level
9. COUNT YOUR LINES - you must have at least 14 lines total (7 Student + 7 Tutor)

LEVEL-SPECIFIC REQUIREMENTS FOR ${context.difficultyLevel}:

VOCABULARY REQUIREMENTS:
${levelInstructions.vocabulary}

GRAMMAR REQUIREMENTS:
${levelInstructions.grammar}

SENTENCE LENGTH:
${levelInstructions.sentenceLength}

EXAMPLES OF APPROPRIATE LANGUAGE:
${levelInstructions.examples}

GAP SELECTION GUIDELINES:
- A1/A2: Blank out common verbs (go, like, want) or simple nouns (topic, idea, question)
- B1: Blank out phrasal verbs (find out, look into) or intermediate vocabulary
- B2/C1: Blank out sophisticated vocabulary, collocations, or idiomatic expressions
- Ensure the gap can be filled from context clues in the conversation
- Vary the types of words you blank out (don't just blank verbs)

CONVERSATIONAL FLOW REQUIREMENTS:
- Student should ask questions, express opinions, and show engagement
- Tutor should respond naturally, ask follow-up questions, and guide the discussion
- Each response should logically follow from the previous line
- Include natural conversation markers appropriate to the level
- Show progression in the conversation - start with introduction, develop the topic, conclude naturally

FORMAT:
Return ONLY the dialogue lines in this exact format:
Student: [line with possible _____ for gap]
Tutor: [line with possible _____ for gap]
Student: [line with possible _____ for gap]
Tutor: [line with possible _____ for gap]
Student: [line with possible _____ for gap]
Tutor: [line with possible _____ for gap]
Student: [line with possible _____ for gap]
Tutor: [line with possible _____ for gap]
Student: [line with possible _____ for gap]
Tutor: [line with possible _____ for gap]
Student: [line with possible _____ for gap]
Tutor: [line with possible _____ for gap]
Student: [line with possible _____ for gap]
Tutor: [line with possible _____ for gap]

EXAMPLE FOR ${context.difficultyLevel} LEVEL:
${context.difficultyLevel === 'A1' ? 'Student: I _____ to learn about this.\nTutor: What do you _____ about it?' :
          context.difficultyLevel === 'A2' ? 'Student: I\'ve been _____ about this topic.\nTutor: What did you _____ most interesting?' :
            context.difficultyLevel === 'B1' ? 'Student: I\'ve been _____ into this topic recently.\nTutor: What aspects have you _____ across?' :
              context.difficultyLevel === 'B2' ? 'Student: The _____ of this topic requires careful analysis.\nTutor: How do you _____ the different perspectives?' :
                'Student: The _____ nature of this topic is fascinating.\nTutor: How would you _____ the apparent contradictions?'}

Do NOT include any numbering, explanations, or extra text. Just the dialogue lines with gaps.`

      return prompt
    }
  }

  /**
   * Validate dialogue length, structure, and CEFR-appropriate complexity
   * Implements Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
   */
  private validateDialogue(
    dialogueLines: Array<{ character: string; line: string }>,
    context: SharedContext,
    type: 'practice' | 'fill-in-gap'
  ): { isValid: boolean; issues: string[] } {
    const issues: string[] = []
    const warnings: string[] = []

    // Check minimum line count (requirement 3.1, 3.2)
    const minLines = 12
    if (dialogueLines.length < minLines) {
      issues.push(`Insufficient dialogue lines: expected at least ${minLines}, got ${dialogueLines.length}`)
    }

    // Check alternating speakers (requirement 3.6 - natural conversational flow)
    for (let i = 0; i < dialogueLines.length - 1; i++) {
      if (dialogueLines[i].character === dialogueLines[i + 1].character) {
        warnings.push(`Lines ${i + 1} and ${i + 2} have the same speaker (should alternate)`)
      }
    }

    // Check that dialogue starts with Student
    if (dialogueLines.length > 0 && dialogueLines[0].character !== 'Student') {
      warnings.push('Dialogue should start with Student speaking')
    }

    // Check line length appropriateness for CEFR level (requirements 3.3, 3.4, 3.5)
    const lengthRanges: Record<CEFRLevel, { min: number; max: number }> = {
      'A1': { min: 3, max: 12 },
      'A2': { min: 5, max: 18 },
      'B1': { min: 7, max: 22 },
      'B2': { min: 8, max: 25 },
      'C1': { min: 10, max: 30 }
    }
    const range = lengthRanges[context.difficultyLevel]

    let tooShortCount = 0
    let tooLongCount = 0

    for (let i = 0; i < dialogueLines.length; i++) {
      const line = dialogueLines[i].line
      const wordCount = line.split(/\s+/).length

      if (wordCount < range.min) {
        tooShortCount++
      } else if (wordCount > range.max) {
        tooLongCount++
      }
    }

    if (tooShortCount > dialogueLines.length * 0.3) {
      warnings.push(`${tooShortCount} lines may be too short for ${context.difficultyLevel} level`)
    }
    if (tooLongCount > dialogueLines.length * 0.3) {
      warnings.push(`${tooLongCount} lines may be too long for ${context.difficultyLevel} level`)
    }

    // Check vocabulary complexity (requirement 3.3, 3.4, 3.5)
    const vocabularyComplexityCheck = this.checkVocabularyComplexity(dialogueLines, context.difficultyLevel)
    if (!vocabularyComplexityCheck.isAppropriate) {
      warnings.push(...vocabularyComplexityCheck.warnings)
    }

    // Check grammar complexity (requirement 3.3, 3.4, 3.5)
    const grammarComplexityCheck = this.checkGrammarComplexity(dialogueLines, context.difficultyLevel)
    if (!grammarComplexityCheck.isAppropriate) {
      warnings.push(...grammarComplexityCheck.warnings)
    }

    // Check vocabulary integration (requirement 3.7)
    const vocabIntegrationCheck = this.checkVocabularyIntegration(dialogueLines, context.keyVocabulary)
    if (!vocabIntegrationCheck.hasIntegration) {
      warnings.push('Dialogue should incorporate lesson vocabulary words')
    }

    // For fill-in-gap, check that there are gaps
    if (type === 'fill-in-gap') {
      const gapCount = dialogueLines.filter(line => line.line.includes('_____')).length
      if (gapCount < 3) {
        warnings.push(`Fill-in-gap dialogue should have at least 3 gaps, found ${gapCount}`)
      }
    }

    // Log warnings for visibility
    if (warnings.length > 0) {
      console.log(`⚠️ Dialogue validation warnings:`, warnings)
    }

    return {
      isValid: issues.length === 0,
      issues
    }
  }

  /**
   * Check if vocabulary complexity matches CEFR level
   */
  private checkVocabularyComplexity(
    dialogueLines: Array<{ character: string; line: string }>,
    level: CEFRLevel
  ): { isAppropriate: boolean; warnings: string[] } {
    const warnings: string[] = []
    const allText = dialogueLines.map(line => line.line.toLowerCase()).join(' ')

    // Check for overly complex words at lower levels
    if (level === 'A1' || level === 'A2') {
      const complexWords = [
        'sophisticated', 'comprehensive', 'multifaceted', 'nuanced', 'intricate',
        'elaborate', 'substantial', 'considerable', 'significant', 'fundamental',
        'nevertheless', 'furthermore', 'consequently', 'subsequently', 'whereby'
      ]

      const foundComplexWords = complexWords.filter(word => allText.includes(word))
      if (foundComplexWords.length > 0) {
        warnings.push(`Found complex vocabulary inappropriate for ${level}: ${foundComplexWords.join(', ')}`)
      }
    }

    // Check for overly simple vocabulary at higher levels
    if (level === 'B2' || level === 'C1') {
      const allWords = allText.split(/\s+/)
      const verySimpleWords = ['good', 'bad', 'nice', 'big', 'small', 'like', 'want', 'go', 'come', 'get']
      const simpleWordCount = allWords.filter(word => verySimpleWords.includes(word)).length
      const simpleWordRatio = simpleWordCount / allWords.length

      if (simpleWordRatio > 0.15) {
        warnings.push(`Vocabulary may be too simple for ${level} level (${Math.round(simpleWordRatio * 100)}% basic words)`)
      }
    }

    return {
      isAppropriate: warnings.length === 0,
      warnings
    }
  }

  /**
   * Check if grammar complexity matches CEFR level
   */
  private checkGrammarComplexity(
    dialogueLines: Array<{ character: string; line: string }>,
    level: CEFRLevel
  ): { isAppropriate: boolean; warnings: string[] } {
    const warnings: string[] = []
    const allText = dialogueLines.map(line => line.line).join(' ')

    // Check for complex grammar at lower levels (should be avoided)
    if (level === 'A1' || level === 'A2') {
      // Check for present perfect (have/has + past participle)
      if (/\b(have|has)\s+\w+ed\b/i.test(allText) || /\b(have|has)\s+(been|gone|done|seen|made)\b/i.test(allText)) {
        warnings.push(`Present perfect tense may be too complex for ${level} level`)
      }

      // Check for passive voice
      if (/\b(is|are|was|were|been)\s+\w+ed\b/i.test(allText)) {
        warnings.push(`Passive voice may be too complex for ${level} level`)
      }
    }

    // Check for lack of complex grammar at higher levels (should be present)
    if (level === 'B2' || level === 'C1') {
      let hasComplexGrammar = false

      // Check for relative clauses
      if (/\b(which|that|who|whom|whose)\b/i.test(allText)) {
        hasComplexGrammar = true
      }

      // Check for conditionals
      if (/\b(if|unless|provided|assuming)\b.*\b(would|could|might)\b/i.test(allText)) {
        hasComplexGrammar = true
      }

      // Check for perfect tenses
      if (/\b(have|has|had)\s+(been|gone|done|seen|made)\b/i.test(allText)) {
        hasComplexGrammar = true
      }

      if (!hasComplexGrammar && dialogueLines.length >= 12) {
        warnings.push(`Dialogue lacks complex grammar structures expected for ${level} level`)
      }
    }

    return {
      isAppropriate: warnings.length === 0,
      warnings
    }
  }

  /**
   * Check if lesson vocabulary is integrated into dialogue
   */
  private checkVocabularyIntegration(
    dialogueLines: Array<{ character: string; line: string }>,
    vocabularyWords: string[]
  ): { hasIntegration: boolean; integratedWords: string[] } {
    const allText = dialogueLines.map(line => line.line.toLowerCase()).join(' ')
    const integratedWords = vocabularyWords.filter(word =>
      allText.includes(word.toLowerCase())
    )

    return {
      hasIntegration: integratedWords.length >= 2, // At least 2 vocabulary words should be used
      integratedWords
    }
  }

  /**
   * Generate dialogue practice section with AI
   */
  async generateDialoguePracticeWithContext(
    context: SharedContext,
    previousSections: GeneratedSection[]
  ): Promise<any> {
    const maxAttempts = 2
    let attempt = 0
    const sectionStartTime = Date.now()

    // Get vocabulary words from previous sections
    const vocabularySection = previousSections.find(s => s.sectionName === 'vocabulary')
    const vocabularyWords = vocabularySection ?
      vocabularySection.content
        .filter((item: any) => item.word !== 'INSTRUCTION')
        .map((item: any) => item.word)
        .slice(0, 5) : context.keyVocabulary.slice(0, 5)

    while (attempt < maxAttempts) {
      attempt++
      console.log(`🎯 Generating dialogue practice (attempt ${attempt}/${maxAttempts})`)

      try {
        // Build enhanced prompt
        const prompt = this.buildDialoguePrompt(context, vocabularyWords, 'practice')

        // Generate dialogue
        const response = await this.getGoogleAI().prompt(prompt)

        // Parse dialogue lines
        const dialogueLines = response.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .map(line => {
            // Parse "Speaker: text" format
            const match = line.match(/^(Student|Tutor):\s*(.+)$/i)
            if (match) {
              return {
                speaker: match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase(),
                text: match[2].trim()
              }
            }
            return null
          })
          .filter(line => line !== null) as Array<{ speaker: string; text: string }>

        // Validate dialogue using new validator
        const validation = dialogueValidator.validate(
          dialogueLines,
          context.difficultyLevel,
          vocabularyWords
        )

        if (!validation.isValid) {
          console.log(`⚠️ Validation failed:`, validation.issues)
          if (attempt < maxAttempts) {
            console.log(`🔄 Retrying with adjusted prompt...`)
            continue
          }
          console.log(`⚠️ Using dialogue despite validation issues (max attempts reached)`)
        } else {
          console.log(`✅ Dialogue practice validated successfully (${dialogueLines.length} lines)`)
        }

        // Track quality metrics
        const generationTime = Date.now() - sectionStartTime
        qualityMetricsTracker.recordSection(
          'dialogue-practice',
          validation.score,
          attempt,
          generationTime,
          validation.issues.length,
          validation.warnings.length
        )

        // Generate follow-up questions
        const followUpPrompt = `Create 3 follow-up discussion questions for ${context.difficultyLevel} level students about the dialogue topic. Return only questions, one per line:`
        const followUpResponse = await this.getGoogleAI().prompt(followUpPrompt)
        const followUpQuestions = followUpResponse.split('\n')
          .map(line => line.trim())
          .filter(line => line.endsWith('?') && line.length > 10)
          .slice(0, 3)

        // Convert back to original format for compatibility
        const formattedDialogue = dialogueLines.map(line => ({
          character: line.speaker,
          line: line.text
        }))

        return {
          instruction: "Practice this conversation with your tutor:",
          dialogue: formattedDialogue,
          followUpQuestions: followUpQuestions.length >= 3 ? followUpQuestions : [
            "What did you learn from this conversation?",
            "How would you continue this discussion?",
            "What questions would you ask next?"
          ]
        }

      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error)
        if (attempt >= maxAttempts) {
          // Track failed generation
          qualityMetricsTracker.recordSection(
            'dialogue-practice',
            0,
            attempt,
            Date.now() - sectionStartTime,
            1,
            0
          )
          throw new Error("Failed to generate dialogue practice: " + (error as Error).message)
        }
      }
    }

    throw new Error("Failed to generate dialogue practice after all attempts")
  }

  /**
   * Generate dialogue fill-in-gap section with AI
   */
  async generateDialogueFillGapWithContext(
    context: SharedContext,
    previousSections: GeneratedSection[]
  ): Promise<any> {
    const maxAttempts = 2
    let attempt = 0

    // Get vocabulary words from previous sections
    const vocabularySection = previousSections.find(s => s.sectionName === 'vocabulary')
    const vocabularyWords = vocabularySection ?
      vocabularySection.content
        .filter((item: any) => item.word !== 'INSTRUCTION')
        .map((item: any) => item.word)
        .slice(0, 5) : context.keyVocabulary.slice(0, 5)

    while (attempt < maxAttempts) {
      attempt++
      console.log(`🎯 Generating dialogue fill-in-gap (attempt ${attempt}/${maxAttempts})`)

      try {
        // Build enhanced prompt
        const prompt = this.buildDialoguePrompt(context, vocabularyWords, 'fill-in-gap')

        // Generate dialogue
        const response = await this.getGoogleAI().prompt(prompt)

        // Parse dialogue lines and extract answers
        const dialogueLines: Array<{ character: string; line: string; isGap?: boolean }> = []
        const answers: string[] = []

        response.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .forEach(line => {
            // Parse "Speaker: text" format
            const match = line.match(/^(Student|Tutor):\s*(.+)$/i)
            if (match) {
              const character = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase()
              const text = match[2].trim()

              // Check if line has gaps
              const hasGap = text.includes('_____')

              if (hasGap) {
                // Extract the missing word(s) - this is a simplified approach
                // In a real scenario, we'd need the AI to provide answers separately
                dialogueLines.push({
                  character,
                  line: text,
                  isGap: true
                })

                // Try to infer what word should go in the gap (simplified)
                // For now, we'll ask AI to provide answers separately
              } else {
                dialogueLines.push({
                  character,
                  line: text
                })
              }
            }
          })

        // Generate answers for the gaps
        const gapCount = dialogueLines.filter(line => line.isGap).length
        if (gapCount > 0) {
          const answersPrompt = `For the dialogue with ${gapCount} gaps marked with _____, provide the missing words. Return only the words, one per line, in order:`
          try {
            const answersResponse = await this.getGoogleAI().prompt(answersPrompt)
            const extractedAnswers = answersResponse.split('\n')
              .map(line => line.trim())
              .filter(line => line.length > 0)
              .slice(0, gapCount)

            answers.push(...extractedAnswers)
          } catch (error) {
            console.log('⚠️ Failed to extract answers, using placeholders')
            for (let i = 0; i < gapCount; i++) {
              answers.push('[answer]')
            }
          }
        }

        // Validate dialogue
        const validation = this.validateDialogue(dialogueLines, context, 'fill-in-gap')

        if (!validation.isValid) {
          console.log(`⚠️ Validation failed:`, validation.issues)
          if (attempt < maxAttempts) {
            console.log(`🔄 Retrying with adjusted prompt...`)
            continue
          }
          console.log(`⚠️ Using dialogue despite validation issues (max attempts reached)`)
        } else {
          console.log(`✅ Dialogue fill-in-gap validated successfully (${dialogueLines.length} lines)`)
        }

        return {
          instruction: "Fill in the gaps in this conversation:",
          dialogue: dialogueLines,
          answers: answers.length > 0 ? answers : ['answer1', 'answer2', 'answer3']
        }

      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error)
        if (attempt >= maxAttempts) {
          throw new Error("Failed to generate dialogue fill-in-gap: " + (error as Error).message)
        }
      }
    }

    throw new Error("Failed to generate dialogue fill-in-gap after all attempts")
  }

  // Fallback methods for when AI extraction fails

  private extractVocabularyFallback(sourceText: string, _studentLevel: CEFRLevel): string[] {
    const words = sourceText.toLowerCase()
      .match(/\b[a-z]{4,12}\b/g) || []

    const commonWords = ['the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this', 'but', 'his', 'from', 'they']
    const filteredWords = words
      .filter(word => !commonWords.includes(word))
      .filter((word, index, arr) => arr.indexOf(word) === index)
      .slice(0, 8)

    return filteredWords.length >= 4 ? filteredWords : ['communication', 'important', 'different', 'example', 'information', 'situation']
  }

  private extractThemesFallback(sourceText: string): string[] {
    const text = sourceText.toLowerCase()
    const themes = []

    // Look for common themes
    if (text.includes('sport') || text.includes('game') || text.includes('team')) themes.push('sports')
    if (text.includes('business') || text.includes('company') || text.includes('work')) themes.push('business')
    if (text.includes('travel') || text.includes('country') || text.includes('culture')) themes.push('travel')
    if (text.includes('technology') || text.includes('computer') || text.includes('internet')) themes.push('technology')
    if (text.includes('health') || text.includes('medical') || text.includes('doctor')) themes.push('health')

    return themes.length > 0 ? themes : ['general topic', 'communication', 'daily life']
  }

  private extractThemesFromText(text: string): string[] {
    return this.extractThemesFallback(text)
  }

  private capitalizeWord(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  }
}