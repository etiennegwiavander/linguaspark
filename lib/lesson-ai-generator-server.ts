import { metadata } from "@/app/layout"
import { createOpenRouterAIService } from "./openrouter-ai-server"
import { ProgressiveGeneratorImpl, type CEFRLevel, type LessonSection, type ProgressCallback } from "./progressive-generator"
import { usageMonitor, type GenerationContext } from "./usage-monitor"

interface LessonGenerationParams {
  sourceText: string
  lessonType: string
  studentLevel: string
  targetLanguage: string
  sourceUrl?: string
  contentMetadata?: {
    title?: string
    description?: string
    author?: string
    publishDate?: string
    contentType?: string
    domain?: string
    language?: string
    keywords?: string[]
    bannerImages?: Array<{
      src: string
      alt: string
      type: 'meta' | 'content'
      priority: number
      width?: number | null
      height?: number | null
    }>
  }
  structuredContent?: {
    headings?: Array<{ level: number; text: string }>
    paragraphs?: string[]
    lists?: Array<{ type: string; items: string[] }>
    quotes?: string[]
    images?: Array<{ alt: string; src: string }>
    links?: Array<{ text: string; url: string }>
  }
  wordCount?: number
  readingTime?: number
  onProgress?: (update: { step: string; progress: number; phase: string; section?: string }) => void
}

interface GeneratedLesson {
  lessonTitle: string
  lessonType: string
  studentLevel: string
  targetLanguage: string
  sections: {
    warmup: string[]
    vocabulary: Array<{ word: string; meaning: string; example: string }>
    reading: string
    comprehension: string[]
    discussion: string[]
    dialoguePractice: {
      instruction: string
      dialogue: Array<{ character: string; line: string }>
      followUpQuestions: string[]
    }
    dialogueFillGap: {
      instruction: string
      dialogue: Array<{ character: string; line: string; isGap?: boolean }>
      answers: string[]
    }
    grammar: {
      focus: string
      examples: string[]
      exercise: string[]
    }
    pronunciation: {
      word: string
      ipa: string
      practice: string
    }
    wrapup: string[]
  }
  metadata?: any // Include metadata for banner images, source info, etc.
}

export class LessonAIServerGenerator {
  private openRouterAI: ReturnType<typeof createOpenRouterAIService> | null = null
  private progressiveGenerator: ProgressiveGeneratorImpl | null = null

  private getOpenRouterAI() {
    if (!this.openRouterAI) {
      this.openRouterAI = createOpenRouterAIService()
    }
    return this.openRouterAI
  }

  private getProgressiveGenerator() {
    if (!this.progressiveGenerator) {
      this.progressiveGenerator = new ProgressiveGeneratorImpl()
    }
    return this.progressiveGenerator
  }

  // Summarize and adapt content to student level
  private async summarizeAndAdaptContent(sourceText: string, studentLevel: string, targetLanguage: string): Promise<string> {
    try {
      const levelGuidance = {
        'A1': 'Use very simple vocabulary, present tense, short sentences (5-8 words). Explain basic concepts clearly.',
        'A2': 'Use simple vocabulary, basic past/present tense, medium sentences (8-12 words). Include familiar topics.',
        'B1': 'Use intermediate vocabulary, various tenses, longer sentences (12-15 words). Include opinions and explanations.',
        'B2': 'Use advanced vocabulary, complex sentences, abstract concepts. Include detailed explanations and analysis.',
        'C1': 'Use sophisticated vocabulary, complex structures, nuanced ideas. Include cultural and contextual depth.'
      }

      const guidance = levelGuidance[studentLevel] || levelGuidance['B1']

      const prompt = `Summarize and rewrite this content for ${studentLevel} level ${targetLanguage} students:

${sourceText.substring(0, 1000)}

REQUIREMENTS:
- ${guidance}
- Keep all important information and key concepts
- Make it 200-400 words (appropriate length for reading)
- Use vocabulary appropriate for ${studentLevel} level
- Maintain the main ideas but simplify complex language
- Include specific details and examples
- Make it engaging and educational

Rewrite the content clearly and completely:`

      console.log("📝 Content adaptation prompt:", prompt.length, "chars")
      const response = await this.getOpenRouterAI().prompt(prompt)

      return response.trim() || sourceText.substring(0, 400)
    } catch (error) {
      console.log("⚠️ Content adaptation failed, using original text")
      return sourceText.substring(0, 400)
    }
  }

  async generateLesson(params: LessonGenerationParams): Promise<GeneratedLesson> {
    const {
      sourceText,
      lessonType,
      studentLevel,
      targetLanguage,
      sourceUrl,
      contentMetadata,
      structuredContent,
      wordCount,
      readingTime,
      onProgress
    } = params

    // Create usage monitoring context
    const generationContext: GenerationContext = {
      lessonId: `lesson_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lessonType,
      difficultyLevel: studentLevel,
      contentLength: sourceText.length,
      timestamp: new Date()
    };

    // Validate sourceText
    if (!sourceText || typeof sourceText !== 'string') {
      throw new Error("Invalid sourceText: must be a non-empty string")
    }

    console.log("🚀 Starting lesson generation with params:", {
      textLength: sourceText.length,
      lessonType,
      studentLevel,
      targetLanguage,
      hasMetadata: !!contentMetadata,
      hasStructuredContent: !!structuredContent
    })



    try {
      // Step 1: Summarize and adapt content to student level
      console.log("📝 Step 1: Summarizing and adapting content to student level...")
      const adaptationStartTime = Date.now();
      const adaptedContent = await this.summarizeAndAdaptContent(sourceText, studentLevel, targetLanguage)
      const adaptationEndTime = Date.now();

      // Log content adaptation usage
      usageMonitor.logTokenUsage(
        'content-adaptation',
        Math.ceil(sourceText.length / 4), // Rough token estimate
        'content-summarization',
        generationContext
      );

      console.log("✅ Content adapted:", adaptedContent.length, "chars")

      // Step 2: Generate lesson with adapted content
      console.log("🤖 Step 2: Generating lesson with adapted content...")
      const lessonGenerationStartTime = Date.now();
      const lessonStructure = await this.generateMinimalAILesson(
        adaptedContent,
        lessonType,
        studentLevel,
        targetLanguage,
        contentMetadata,
        onProgress
      )
      const lessonGenerationEndTime = Date.now();

      // Log lesson generation usage
      usageMonitor.logTokenUsage(
        'lesson-structure-generation',
        Math.ceil(adaptedContent.length / 3), // Rough token estimate for lesson generation
        'structured-generation',
        generationContext
      );

      console.log("✅ Minimal AI lesson generated:", Object.keys(lessonStructure))

      // Return properly structured GeneratedLesson object with metadata
      const finalLesson: GeneratedLesson = {
        lessonTitle: lessonStructure.lessonTitle,
        lessonType,
        studentLevel,
        targetLanguage,
        sections: lessonStructure,
        metadata: metadata || undefined // Include metadata for banner images, etc.
      }

      console.log("🎯 Returning AI-generated lesson:", {
        lessonType: finalLesson.lessonType,
        studentLevel: finalLesson.studentLevel,
        targetLanguage: finalLesson.targetLanguage,
        sectionsCount: Object.keys(finalLesson.sections).length,
        warmupCount: finalLesson.sections.warmup?.length || 0,
        vocabularyCount: finalLesson.sections.vocabulary?.length || 0,
        hasMetadata: !!metadata,
        hasBannerImages: !!metadata?.bannerImages,
        metadataKeys: metadata ? Object.keys(metadata) : [],
        bannerImagesCount: metadata?.bannerImages?.length || 0
      })

      console.log("📦 Full metadata received:", JSON.stringify(metadata, null, 2))

      console.log("🎉 Optimized AI lesson generation complete!")
      return finalLesson
    } catch (error) {
      // Log error to usage monitor
      usageMonitor.logError(error as Error, 'LESSON_GENERATION_FAILED', generationContext);

      console.error("❌ Error in AI lesson generation:", error)
      throw error
    }
  }

  // Progressive AI lesson generation with shared context
  private async generateMinimalAILesson(
    sourceText: string,
    lessonType: string,
    studentLevel: string,
    targetLanguage: string,
    metadata?: any,
    onProgress?: ProgressCallback
  ) {
    console.log("🎯 Using progressive generation with shared context...")

    const progressiveGen = this.getProgressiveGenerator()

    // Set progress callback if provided
    if (onProgress) {
      progressiveGen.setProgressCallback(onProgress, lessonType)
    }

    // Step 1: Build shared context for all sections
    console.log("🏗️ Building shared context...")
    const sharedContext = await progressiveGen.buildSharedContext(
      sourceText,
      lessonType,
      studentLevel as CEFRLevel,
      targetLanguage,
      metadata // Pass metadata for title fallback
    )

    // Step 2: Define lesson sections with dependencies
    const lessonSections: LessonSection[] = [
      { name: 'warmup', priority: 1, dependencies: [] },
      { name: 'vocabulary', priority: 2, dependencies: [] },
      { name: 'reading', priority: 3, dependencies: ['vocabulary'] },
      { name: 'comprehension', priority: 4, dependencies: ['reading'] },
      { name: 'discussion', priority: 5, dependencies: ['reading', 'comprehension'] },
      { name: 'grammar', priority: 6, dependencies: ['reading'] },
      { name: 'pronunciation', priority: 7, dependencies: ['vocabulary'] },
      { name: 'wrapup', priority: 8, dependencies: ['discussion'] }
    ]

    // Step 3: Generate sections progressively
    const generatedSections = []
    let currentContext = sharedContext

    for (const section of lessonSections) {
      console.log(`🔄 Generating section: ${section.name}`)

      const generatedSection = await progressiveGen.generateSection(
        section,
        currentContext,
        generatedSections
      )

      generatedSections.push(generatedSection)

      // Update context with new section information
      currentContext = progressiveGen.updateContext(currentContext, generatedSection)
    }

    // Step 4: Generate dialogue sections using AI-based progressive generation
    console.log("🎭 Generating dialogue sections with AI...")
    const dialoguePractice = await progressiveGen.generateDialoguePracticeWithContext(
      sharedContext,
      generatedSections
    )
    const dialogueFillGap = await progressiveGen.generateDialogueFillGapWithContext(
      sharedContext,
      generatedSections
    )

    // Step 5: Assemble final lesson structure
    const lessonStructure: any = {}

    for (const section of generatedSections) {
      lessonStructure[section.sectionName] = section.content
    }

    lessonStructure.dialoguePractice = dialoguePractice
    lessonStructure.dialogueFillGap = dialogueFillGap

    // Include lesson title from shared context
    lessonStructure.lessonTitle = sharedContext.lessonTitle

    console.log("✅ Progressive lesson generation complete!")
    return lessonStructure
  }

  // Ultra-minimal warmup generation
  private async generateMinimalWarmup(sourceText: string, studentLevel: string): Promise<string[]> {
    // Extract better context for topic identification
    const topics = this.extractBetterTopics(sourceText)
    const mainTopic = topics[0] || 'this topic'

    // Create a more specific prompt that avoids content assumptions
    const prompt = `Write 3 ${studentLevel} warm-up questions about ${mainTopic}. Ask about students' prior knowledge and experience. Do not mention any specific events or results. Format: just the questions, one per line:`

    try {
      console.log("🔥 Minimal warmup prompt:", prompt.length, "chars")
      console.log("🎯 Topic identified:", mainTopic)
      const response = await this.getOpenRouterAI().prompt(prompt)

      // Extract only actual questions (must end with ?)
      const questions = response.split('\n')
        .map(line => line.trim())
        .filter(line => {
          // Must be a question (ends with ?) and not an instruction
          return line.endsWith('?') &&
            line.length > 10 &&
            !line.toLowerCase().includes('here are') &&
            !line.toLowerCase().includes('based on') &&
            !line.toLowerCase().includes('headline mentions') &&
            !line.toLowerCase().includes('the text') &&
            !line.toLowerCase().includes('the article') &&
            !line.toLowerCase().includes('according to') &&
            !line.toLowerCase().includes('the passage')
        })
        .map(line => line.replace(/^\d+\.?\s*/, '').replace(/^-\s*/, '').trim())
        .slice(0, 3)

      console.log("🎯 Extracted warmup questions:", questions)

      if (questions.length < 3) {
        throw new Error("Failed to generate sufficient warmup questions")
      }
      return questions
    } catch (error) {
      console.log("⚠️ Minimal warmup failed")
      throw new Error("Failed to generate warmup questions: " + error.message)
    }
  }

  // Add instructional text to sections
  private addWarmupInstructions(questions: string[], studentLevel: string): string[] {
    const instruction = "Have the following conversations or discussions with your tutor before reading the text:"
    return [instruction, ...questions]
  }

  private addComprehensionInstructions(questions: string[], studentLevel: string): string[] {
    const instruction = "After reading the text, answer these comprehension questions:"
    return [instruction, ...questions]
  }

  private addDiscussionInstructions(questions: string[], studentLevel: string): string[] {
    const instruction = "Discuss these questions with your tutor to explore the topic in depth:"
    return [instruction, ...questions]
  }

  private addWrapupInstructions(questions: string[], studentLevel: string): string[] {
    const instruction = "Reflect on your learning by discussing these wrap-up questions:"
    return [instruction, ...questions]
  }

  private addVocabularyInstructions(vocabulary: Array<{ word: string, meaning: string, example: string }>, studentLevel: string): Array<{ word: string, meaning: string, example: string }> {
    const instruction = {
      word: "INSTRUCTION",
      meaning: "Study the following words with your tutor before reading the text:",
      example: ""
    }
    return [instruction, ...vocabulary]
  }

  private addReadingInstructions(readingText: string, studentLevel: string): string {
    const instruction = "Read the following text carefully. Your tutor will help you with any difficult words or concepts:"
    return `${instruction}\n\n${readingText}`
  }

  // Better topic extraction that recognizes compound terms
  private extractBetterTopics(text: string): string[] {
    const topics = []

    // Look for compound terms first (like "Ryder Cup", "World Cup", etc.)
    const compoundPatterns = [
      /\b(Ryder Cup|World Cup|Champions League|Premier League|Super Bowl|Olympics|World Series)\b/gi,
      /\b(artificial intelligence|machine learning|climate change|social media)\b/gi,
      /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g // General compound proper nouns
    ]

    for (const pattern of compoundPatterns) {
      const matches = text.match(pattern)
      if (matches) {
        topics.push(...matches.map(m => m.toLowerCase()))
      }
    }

    // If no compound terms found, fall back to single words
    if (topics.length === 0) {
      const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
      const commonWords = ['europe', 'team', 'golf', 'tournament', 'sports', 'competition']
      const foundWords = words.filter(word => commonWords.includes(word))
      topics.push(...foundWords.slice(0, 3))
    }

    return topics.length > 0 ? topics : ['sports']
  }

  // Enhanced vocabulary generation with AI-generated contextual examples
  private async generateMinimalVocabulary(sourceText: string, studentLevel: string): Promise<Array<{ word: string, meaning: string, example: string }>> {
    // Use smart vocabulary extraction instead of basic word matching
    const meaningfulWords = this.extractMeaningfulVocabulary(sourceText, studentLevel)
    console.log("📚 Meaningful vocabulary extracted:", meaningfulWords)

    const vocabulary = []

    for (const word of meaningfulWords) {
      try {
        const capitalizedWord = this.capitalizeWord(word)

        // Generate AI definition
        const definitionPrompt = `Define "${word}" simply for ${studentLevel} level. Context: ${sourceText.substring(0, 80)}. Give only the definition, no extra text:`
        console.log("📚 Vocab definition prompt:", definitionPrompt.length, "chars")
        const rawMeaning = await this.getOpenRouterAI().prompt(definitionPrompt)
        const meaning = this.cleanDefinition(rawMeaning, studentLevel)

        // Generate AI contextual examples
        const examples = await this.generateAIExampleSentences(word, studentLevel, sourceText)

        vocabulary.push({
          word: capitalizedWord,
          meaning: meaning.trim().substring(0, 200),
          example: examples
        })
      } catch (error) {
        console.log(`⚠️ Vocab failed for ${word}, using enhanced template`)
        const capitalizedWord = this.capitalizeWord(word)
        vocabulary.push({
          word: capitalizedWord,
          meaning: this.generateContextualWordMeaning(word, studentLevel, sourceText),
          example: await this.generateAIExampleSentences(word, studentLevel, sourceText)
        })
      }
    }

    // Ensure we have 6-10 words
    return vocabulary.slice(0, 10).length >= 6 ? vocabulary.slice(0, 10) : vocabulary.slice(0, 6)
  }

  // Ultra-minimal comprehension generation
  private async generateMinimalComprehension(sourceText: string, studentLevel: string): Promise<string[]> {
    const shortText = sourceText.substring(0, 200) // Increase context for more questions
    const prompt = `Write 5 ${studentLevel} reading comprehension questions about this text. Only return questions, no instructions: ${shortText}`

    try {
      console.log("❓ Minimal comprehension prompt:", prompt.length, "chars")
      const response = await this.getOpenRouterAI().prompt(prompt)

      const questions = response.split('\n')
        .map(line => line.trim())
        .filter(line => {
          // Must be a question and not an instruction
          return line.endsWith('?') &&
            line.length > 10 &&
            !line.toLowerCase().includes('here are') &&
            !line.toLowerCase().includes('based on')
        })
        .map(line => line.replace(/^\d+\.?\s*/, '').replace(/^\*\*/, '').replace(/\*\*$/, '').trim())
        .slice(0, 5)

      if (questions.length < 5) {
        throw new Error("Failed to generate sufficient comprehension questions")
      }
      return questions
    } catch (error) {
      console.log("⚠️ Minimal comprehension failed")
      throw new Error("Failed to generate comprehension questions: " + error.message)
    }
  }

  // Minimal AI-only reading passage generation
  private async generateMinimalReading(sourceText: string, studentLevel: string): Promise<string> {
    const prompt = `Rewrite this text for ${studentLevel} level students. Keep it 200-400 words: ${sourceText.substring(0, 500)}`

    try {
      const response = await this.getOpenRouterAI().prompt(prompt)
      return response.trim()
    } catch (error) {
      throw new Error("Failed to generate reading passage: " + error.message)
    }
  }

  // Minimal AI-only discussion questions generation
  private async generateMinimalDiscussion(sourceText: string, studentLevel: string): Promise<string[]> {
    const prompt = `Write 3 ${studentLevel} discussion questions about this text. Only return questions: ${sourceText.substring(0, 200)}`

    try {
      const response = await this.getOpenRouterAI().prompt(prompt)
      const questions = response.split('\n')
        .map(line => line.trim())
        .filter(line => line.endsWith('?') && line.length > 10)
        .map(line => line.replace(/^\d+\.?\s*/, '').trim())
        .slice(0, 3)

      if (questions.length < 3) {
        throw new Error("Failed to generate sufficient discussion questions")
      }
      return questions
    } catch (error) {
      throw new Error("Failed to generate discussion questions: " + error.message)
    }
  }

  // Minimal AI-only grammar section generation
  private async generateMinimalGrammar(sourceText: string, studentLevel: string): Promise<any> {
    const prompt = `Create a grammar lesson for ${studentLevel} level based on this text. Return JSON with focus, examples, exercise: ${sourceText.substring(0, 200)}`

    try {
      const response = await this.getOpenRouterAI().prompt(prompt)
      return JSON.parse(response)
    } catch (error) {
      throw new Error("Failed to generate grammar section: " + error.message)
    }
  }

  // Minimal AI-only pronunciation section generation
  private async generateMinimalPronunciation(vocabularyWords: string[], studentLevel: string): Promise<any> {
    const word = vocabularyWords[0] || 'communication'
    const prompt = `Create pronunciation practice for "${word}". Return JSON with word, ipa, practice:`

    try {
      const response = await this.getOpenRouterAI().prompt(prompt)
      return JSON.parse(response)
    } catch (error) {
      throw new Error("Failed to generate pronunciation section: " + error.message)
    }
  }

  // Minimal AI-only wrapup questions generation
  private async generateMinimalWrapup(sourceText: string, studentLevel: string): Promise<string[]> {
    const prompt = `Write 3 ${studentLevel} wrap-up questions about this lesson. Only return questions: ${sourceText.substring(0, 200)}`

    try {
      const response = await this.getOpenRouterAI().prompt(prompt)
      const questions = response.split('\n')
        .map(line => line.trim())
        .filter(line => line.endsWith('?') && line.length > 10)
        .map(line => line.replace(/^\d+\.?\s*/, '').trim())
        .slice(0, 3)

      if (questions.length < 3) {
        throw new Error("Failed to generate sufficient wrapup questions")
      }
      return questions
    } catch (error) {
      throw new Error("Failed to generate wrapup questions: " + error.message)
    }
  }



  // Content analysis without AI calls
  private analyzeContentContextNoAI(
    sourceText: string,
    metadata?: any,
    structuredContent?: any,
    studentLevel?: string
  ) {
    console.log("🔍 Analyzing content context without AI...")

    const analysis = {
      contentType: metadata?.contentType || 'general',
      domain: metadata?.domain || '',
      complexity: 'medium',
      topics: [],
      keyVocabulary: [],
      culturalContext: '',
      learningObjectives: [],
      difficulty: studentLevel || 'B1',
      title: metadata?.title || '',
      sourceCountry: this.determineSourceCountry(metadata?.domain || ''),
    }

    // Analyze content complexity
    const sentences = sourceText.split(/[.!?]+/).filter(s => s.trim().length > 10)
    const avgSentenceLength = sentences.length > 0 ? sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length : 0
    const complexWords = sourceText.match(/\b\w{8,}\b/g)?.length || 0
    const totalWords = sourceText.split(/\s+/).length

    if (avgSentenceLength > 20 || complexWords / totalWords > 0.15) {
      analysis.complexity = 'high'
    } else if (avgSentenceLength < 12 && complexWords / totalWords < 0.08) {
      analysis.complexity = 'low'
    }

    // Extract topics using text analysis
    analysis.topics = this.extractTopicsFromText(sourceText, structuredContent?.headings || [])

    // Extract vocabulary using text analysis
    analysis.keyVocabulary = this.extractVocabularyFromText(sourceText, studentLevel)

    // Determine cultural context
    if (metadata?.domain) {
      analysis.culturalContext = this.determineCulturalContext(metadata.domain, sourceText)
    }

    // Generate learning objectives
    analysis.learningObjectives = this.generateLearningObjectives(
      analysis.contentType,
      analysis.topics,
      studentLevel
    )

    return analysis
  }

  // New method: Analyze content context and complexity
  private async analyzeContentContext(
    sourceText: string,
    metadata?: any,
    structuredContent?: any,
    studentLevel?: string
  ) {
    console.log("🔍 Analyzing content context...")

    const analysis = {
      contentType: metadata?.contentType || 'general',
      domain: metadata?.domain || '',
      complexity: 'medium',
      topics: [],
      keyVocabulary: [],
      culturalContext: '',
      learningObjectives: [],
      difficulty: studentLevel || 'B1',
      title: metadata?.title || '',
      sourceCountry: this.determineSourceCountry(metadata?.domain || ''),
    }

    // Analyze content complexity based on text characteristics
    const sentences = sourceText.split(/[.!?]+/).filter(s => s.trim().length > 10)
    const avgSentenceLength = sentences.length > 0 ? sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length : 0
    const complexWords = sourceText.match(/\b\w{8,}\b/g)?.length || 0
    const totalWords = sourceText.split(/\s+/).length

    if (avgSentenceLength > 20 || complexWords / totalWords > 0.15) {
      analysis.complexity = 'high'
    } else if (avgSentenceLength < 12 && complexWords / totalWords < 0.08) {
      analysis.complexity = 'low'
    }

    console.log("📈 Text complexity analysis:", {
      avgSentenceLength,
      complexWords,
      totalWords,
      complexity: analysis.complexity
    })

    // Extract key topics using simple text analysis (skip AI to avoid token limits)
    console.log("🎯 Extracting topics using text analysis...")
    analysis.topics = this.extractTopicsFromText(sourceText, structuredContent?.headings || [])
    console.log("✅ Extracted topics:", analysis.topics)

    // Extract key vocabulary using text analysis (skip AI to avoid token limits)
    console.log("📚 Extracting vocabulary using text analysis...")
    analysis.keyVocabulary = this.extractVocabularyFromText(sourceText, studentLevel)
    console.log("✅ Extracted vocabulary:", analysis.keyVocabulary)

    // Determine cultural context
    if (metadata?.domain) {
      analysis.culturalContext = this.determineCulturalContext(metadata.domain, sourceText)
      console.log("🌍 Cultural context:", analysis.culturalContext)
    }

    // Generate learning objectives based on content type and lesson type
    analysis.learningObjectives = this.generateLearningObjectives(
      analysis.contentType,
      analysis.topics,
      studentLevel
    )
    console.log("🎯 Learning objectives:", analysis.learningObjectives)

    return analysis
  }

  // Enhanced contextual summary creation
  private async createContextualSummary(
    sourceText: string,
    contentAnalysis: any,
    lessonType: string,
    studentLevel: string
  ) {
    console.log("📝 Creating contextual summary...")

    // Use simple prompt to avoid token limits
    const summaryPrompt = `Summarize this text in 4-5 sentences for ${studentLevel} level students:

${sourceText.substring(0, 800)}

Summary:`

    try {
      console.log("🤖 Calling AI for contextual summary...")
      const summary = await this.getOpenRouterAI().prompt(summaryPrompt, {
        temperature: 0.4,
        maxTokens: 300, // Reduced from 500
      })
      console.log("✅ AI contextual summary created:", summary.substring(0, 100) + "...")
      return summary
    } catch (error) {
      console.warn("⚠️ AI contextual summary failed, using text truncation:", error.message)
      // Skip complex fallbacks, just use truncation
      const truncated = sourceText.substring(0, 600) + "..."
      console.log("🔄 Using truncated text as summary")
      return truncated
    }
  }

  // Generate CEFR-adapted warm-up questions
  private async generateContextualWarmupQuestions(
    content: string,
    contentAnalysis: any,
    studentLevel: string,
    metadata?: any
  ) {
    console.log("🔥 Generating CEFR-adapted warm-up questions...")

    const levelInstructions = {
      'A1': `
Create 3 warm-up questions for A1 (beginner) level:
- Use simple present tense and basic vocabulary
- Ask yes/no questions or simple choice questions
- Focus on familiar, concrete concepts
- Keep questions short and direct
- Use vocabulary the student likely knows
Example: "Do you use [topic] in your daily life? Yes or No?"`,

      'A2': `
Create 3 warm-up questions for A2 (elementary) level:
- Use simple past tense and personal experiences
- Ask for short, simple answers
- Include basic comparisons with "different" or "same"
- Focus on personal experiences and familiar situations
- Use simple connecting words like "and", "but"
Example: "Have you ever [experienced topic]? How was it?"`,

      'B1': `
Create 3 warm-up questions for B1 (intermediate) level:
- Ask for opinions with "What do you think...?"
- Include comparisons between countries/cultures
- Ask students to explain reasons with "because" or "why"
- Discuss advantages and disadvantages
- Use more varied vocabulary but keep structure clear
Example: "What do you think about [topic]? How is it different in your country?"`,

      'B2': `
Create 3 warm-up questions for B2 (upper intermediate) level:
- Ask students to analyze situations and predict outcomes
- Include complex opinions and explanations
- Discuss implications and consequences
- Use conditional language ("What would happen if...?")
- Encourage detailed responses with examples
Example: "What challenges do you think [specific group] face with [topic]?"`,

      'C1': `
Create 3 warm-up questions for C1 (advanced) level:
- Ask students to evaluate arguments and consider multiple perspectives
- Include abstract concepts and societal implications
- Use sophisticated vocabulary and complex structures
- Encourage critical thinking and nuanced discussion
- Ask about broader cultural and social contexts
Example: "How do cultural attitudes toward [concept] influence [topic] in different societies?"`
    }

    // Ultra-simple prompt to avoid token limits
    const topic = contentAnalysis.topics[0] || 'this topic'
    const warmupPrompt = `Create 3 ${studentLevel} level warm-up questions about ${topic}. Return only the questions:`

    try {
      console.log("🤖 Calling AI for contextual warm-up questions...")
      console.log("📝 Warm-up prompt:", warmupPrompt.substring(0, 200) + "...")

      const response = await this.getOpenRouterAI().prompt(warmupPrompt, {
        temperature: 0.6,
        maxTokens: 150, // Reduced from 300
      })

      console.log("✅ AI warm-up questions generated")
      console.log("🤖 Raw AI response:", response)

      const questions = this.parseListFromText(response).slice(0, 3)
      console.log("🔥 Parsed warm-up questions:", questions)
      console.log("🔍 Questions array length:", questions.length)

      // Ensure we have 3 questions, add fallbacks if needed
      while (questions.length < 3) {
        const fallbackQuestion = this.getFallbackWarmupQuestion(studentLevel, contentAnalysis, questions.length)
        console.log(`🔄 Adding fallback question ${questions.length + 1}:`, fallbackQuestion)
        questions.push(fallbackQuestion)
      }

      console.log("✅ Final warm-up questions:", questions)

      // Final safety check - if still empty, use basic fallback
      if (questions.length === 0) {
        console.warn("⚠️ No questions generated, using emergency fallback")
        return [
          "What do you know about this topic?",
          "Have you experienced something similar?",
          "What would you like to learn?"
        ]
      }

      return questions
    } catch (error) {
      console.warn("⚠️ AI warm-up generation failed, using contextual fallbacks:", error.message)
      const fallbackQuestions = this.getContextualWarmupFallback(studentLevel, contentAnalysis, metadata)
      console.log("🔄 Fallback warm-up questions:", fallbackQuestions)

      // Final safety check for fallback
      if (!fallbackQuestions || fallbackQuestions.length === 0) {
        console.warn("⚠️ Fallback also empty, using emergency questions")
        return [
          "What do you know about this topic?",
          "Have you experienced something similar?",
          "What would you like to learn?"
        ]
      }

      return fallbackQuestions
    }
  }

  // Enhanced contextual lesson structure generation
  private async generateContextualLessonStructure(
    content: string,
    contentAnalysis: any,
    lessonType: string,
    studentLevel: string,
    targetLanguage: string,
    metadata?: any
  ) {
    console.log("🏗️ Generating contextual lesson structure...")

    // Generate contextual warm-up questions first
    const contextualWarmup = await this.generateContextualWarmupQuestions(
      content,
      contentAnalysis,
      studentLevel,
      metadata
    )

    console.log("🔥 Generated contextual warm-up questions:", contextualWarmup)

    // Ultra-simplified prompt to avoid token limits
    const topics = contentAnalysis.topics.slice(0, 2).join(', ') || 'technology'
    const vocab = contentAnalysis.keyVocabulary.slice(0, 4).join(', ')

    const prompt = `Create a ${lessonType} lesson for ${studentLevel} students about: ${topics}

Content: "${content.substring(0, 400)}"
Key words: ${vocab}

Return JSON with: warmup (use provided), vocabulary (4 words from content), reading (simplified content), comprehension (3 questions), discussion (3 questions), grammar (focus + examples), pronunciation (1 word), wrapup (3 questions).

{
  "warmup": ${JSON.stringify(contextualWarmup)},
  "vocabulary": [{"word": "word", "meaning": "definition", "example": "sentence"}],
  "reading": "text",
  "comprehension": ["question"],
  "discussion": ["question"], 
  "grammar": {"focus": "topic", "examples": ["example"], "exercise": ["exercise"]},
  "pronunciation": {"word": "word", "ipa": "/ipa/", "practice": "sentence"},
  "wrapup": ["question"]
}`

    try {
      console.log("🤖 Calling AI for lesson structure...")
      const response = await this.getOpenRouterAI().prompt(prompt, {
        temperature: 0.7,
        maxTokens: 1500, // Reduced from 3000 to avoid token limits
      })

      console.log("🤖 AI lesson structure response:", response.substring(0, 200) + "...")

      try {
        const parsed = JSON.parse(response)
        console.log("✅ Successfully parsed lesson structure JSON")

        // Ensure our contextual warm-up questions are preserved
        parsed.warmup = contextualWarmup
        console.log("🔥 Preserved contextual warm-up questions in final structure")

        return parsed
      } catch (parseError) {
        console.warn("⚠️ Failed to parse JSON, attempting to clean response...")
        // Try to extract JSON from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            const cleaned = JSON.parse(jsonMatch[0])
            console.log("✅ Successfully parsed cleaned JSON")

            // Ensure our contextual warm-up questions are preserved
            cleaned.warmup = contextualWarmup
            console.log("🔥 Preserved contextual warm-up questions in cleaned structure")

            return cleaned
          } catch (cleanError) {
            console.warn("⚠️ Failed to parse cleaned JSON, using fallback")
          }
        }
        // If JSON parsing fails, return a structured fallback with contextual warm-up
        const fallback = this.createStructuredFallback(content, lessonType, studentLevel)
        fallback.warmup = contextualWarmup
        console.log("🔥 Using fallback with contextual warm-up questions")
        return fallback
      }
    } catch (error) {
      console.warn("⚠️ AI lesson structure generation failed, using fallback:", error.message)
      const fallback = this.createStructuredFallback(content, lessonType, studentLevel)
      fallback.warmup = contextualWarmup
      console.log("🔥 Using error fallback with contextual warm-up questions")
      return fallback
    }
  }

  // Enhanced detailed content generation with context
  private async generateDetailedContextualContent(
    structure: any,
    content: string,
    contentAnalysis: any,
    lessonType: string,
    studentLevel: string,
    targetLanguage: string,
    structuredContent?: any
  ) {
    // Use Writer API to expand each section with contextual, detailed content
    const sections = { ...structure }

    // Enhance vocabulary section with contextual examples
    if (sections.vocabulary) {
      for (let i = 0; i < sections.vocabulary.length; i++) {
        const vocab = sections.vocabulary[i]
        try {
          const contextualExamplePrompt = `
Create a natural example sentence using the word "${vocab.word}" that relates to this content context:
Topics: ${contentAnalysis.topics.join(', ')}
Content type: ${contentAnalysis.contentType}
Level: ${studentLevel}

Make the example relevant to the source material and appropriate for ${studentLevel} level students.
`
          const enhancedExample = await this.getOpenRouterAI().write(contextualExamplePrompt, {
            tone: "casual",
            length: "short"
          })
          sections.vocabulary[i].example = enhancedExample

          // Add contextual meaning based on source content
          const contextualMeaningPrompt = `
Explain the meaning of "${vocab.word}" in the context of: ${contentAnalysis.topics[0] || contentAnalysis.contentType}
Keep it simple for ${studentLevel} level students.
`
          const contextualMeaning = await this.getOpenRouterAI().write(contextualMeaningPrompt, {
            tone: "casual",
            length: "short"
          })
          sections.vocabulary[i].contextualMeaning = contextualMeaning
        } catch (error) {
          // Keep original if enhancement fails
          console.warn(`Failed to enhance vocabulary for ${vocab.word}:`, error)
        }
      }
    }

    // Enhance discussion questions with specific content references
    if (sections.discussion) {
      try {
        const enhancedDiscussionPrompt = `
Enhance these discussion questions for a ${lessonType} lesson about ${contentAnalysis.topics.join(' and ')}:
${sections.discussion.join('\n')}

Make them more specific to the content, engaging for ${studentLevel} level students, and encourage deeper thinking about:
- ${contentAnalysis.topics.slice(0, 3).join('\n- ')}

Return 3-4 enhanced questions that reference specific aspects of the content.
`
        const enhancedDiscussion = await this.getOpenRouterAI().write(enhancedDiscussionPrompt, {
          tone: "casual",
          length: "medium",
          format: "bullet-points"
        })
        sections.discussion = this.parseListFromText(enhancedDiscussion).slice(0, 4)
      } catch (error) {
        console.warn("Failed to enhance discussion questions:", error)
      }
    }

    // Enhance reading section with better structure
    if (sections.reading && structuredContent?.headings?.length > 0) {
      try {
        const structuredReadingPrompt = `
Improve this reading text by organizing it with clear structure based on these headings from the original:
${structuredContent.headings.slice(0, 3).map(h => `- ${h.text}`).join('\n')}

Original text: "${sections.reading}"

Create a well-structured, ${studentLevel}-appropriate reading passage that maintains the key information but improves readability.
`
        const enhancedReading = await this.getOpenRouterAI().rewrite(sections.reading, {
          tone: "casual",
          length: "same",
          audience: this.getAudienceLevel(studentLevel)
        })
        sections.reading = enhancedReading
      } catch (error) {
        console.warn("Failed to enhance reading section:", error)
      }
    }

    // Enhance grammar section with content-specific examples
    if (sections.grammar && sections.grammar.focus) {
      try {
        const grammarExamplesPrompt = `
Create 3 grammar examples for "${sections.grammar.focus}" using vocabulary and concepts from this content:
Topics: ${contentAnalysis.topics.join(', ')}
Key vocabulary: ${contentAnalysis.keyVocabulary.slice(0, 5).join(', ')}

Make examples relevant to the content and appropriate for ${studentLevel} level.
`
        const contextualGrammarExamples = await this.getOpenRouterAI().write(grammarExamplesPrompt, {
          tone: "casual",
          length: "short",
          format: "bullet-points"
        })
        sections.grammar.contextualExamples = this.parseListFromText(contextualGrammarExamples)
      } catch (error) {
        console.warn("Failed to enhance grammar examples:", error)
      }
    }

    return sections
  }

  private async proofreadLesson(lesson: any) {
    // Proofread key text sections
    const sectionsToProofread = ["reading", "grammar.examples", "pronunciation.practice"]

    for (const sectionPath of sectionsToProofread) {
      const value = this.getNestedValue(lesson, sectionPath)
      if (typeof value === "string") {
        const proofread = await this.getOpenRouterAI().proofread(value, {
          checkGrammar: true,
          checkSpelling: true,
          checkStyle: true,
        })
        this.setNestedValue(lesson, sectionPath, proofread.corrected_text)
      }
    }

    return lesson
  }

  private generateFallbackLesson(params: LessonGenerationParams): GeneratedLesson {
    // Template-based fallback when AI APIs fail
    const { sourceText, lessonType, studentLevel, targetLanguage } = params

    return {
      lessonType,
      studentLevel,
      targetLanguage,
      sections: {
        warmup: this.getTemplateWarmup(lessonType, studentLevel),
        vocabulary: this.extractVocabulary(sourceText, studentLevel),
        reading: this.simplifyText(sourceText, studentLevel),
        comprehension: this.getTemplateComprehension(lessonType, studentLevel),
        dialoguePractice: this.generateTemplateDialoguePractice('this topic', studentLevel, []),
        dialogueFillGap: this.generateTemplateDialogueFillGap('this topic', studentLevel, []),
        discussion: this.getTemplateDiscussion(lessonType, studentLevel),
        grammar: this.getTemplateGrammar(studentLevel),
        pronunciation: this.getTemplatePronunciation(sourceText),
        wrapup: this.getTemplateWrapup(lessonType),
      },
    }
  }

  // Helper methods
  private getSummaryLength(level: string): "short" | "medium" | "long" {
    const lengthMap = {
      A1: "short" as const,
      A2: "short" as const,
      B1: "medium" as const,
      B2: "medium" as const,
      C1: "long" as const,
    }
    return lengthMap[level] || "medium"
  }

  private getLanguageCode(language: string): string {
    const languageMap = {
      spanish: "es",
      french: "fr",
      german: "de",
      italian: "it",
      portuguese: "pt",
      japanese: "ja",
      korean: "ko",
      chinese: "zh",
    }
    return languageMap[language] || "en"
  }

  private parseListFromText(text: string): string[] {
    return text
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => line.replace(/^[-•*]\s*/, "").trim())
      .filter((line) => line.length > 0)
      .slice(0, 4) // Limit to 4 items
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj)
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split(".")
    const lastKey = keys.pop()!
    const target = keys.reduce((current, key) => current[key], obj)
    target[lastKey] = value
  }

  private createStructuredFallback(content: string, lessonType: string, studentLevel: string) {
    console.log("🔄 Creating structured fallback lesson...")

    // Extract some basic information from content for better fallback
    const words = content.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
    const uniqueWords = Array.from(new Set(words)).slice(0, 6)

    const fallback = {
      warmup: [], // Will be set by caller with contextual warm-up questions
      vocabulary: uniqueWords.map(word => ({
        word: word,
        meaning: `Definition of ${word}`,
        example: `Example sentence with ${word}.`
      })),
      reading: this.simplifyText(content, studentLevel),
      comprehension: this.getTemplateComprehension(lessonType, studentLevel),
      discussion: this.getTemplateDiscussion(lessonType, studentLevel),
      grammar: this.getTemplateGrammar(studentLevel),
      pronunciation: this.getTemplatePronunciation(content),
      wrapup: this.getTemplateWrapup(lessonType),
    }

    console.log("✅ Structured fallback created (warmup will be set by caller)")
    return fallback
  }

  private getTemplateWarmup(lessonType: string, studentLevel: string): string[] {
    const templates = {
      discussion: [
        "What do you already know about this topic?",
        "Have you had similar experiences?",
        "What would you like to learn more about?",
      ],
      grammar: [
        "What grammar patterns do you notice?",
        "Which sentences seem most complex?",
        "What grammar rules do you remember?",
      ],
      travel: [
        "Where would you like to travel next?",
        "What travel experiences have you had?",
        "What travel vocabulary do you know?",
      ],
      business: [
        "What business situations are you familiar with?",
        "How do you communicate professionally?",
        "What business terms are challenging?",
      ],
      pronunciation: [
        "Which sounds are difficult to pronounce?",
        "How do you practice pronunciation?",
        "What pronunciation goals do you have?",
      ],
    }
    return templates[lessonType] || templates.discussion
  }

  private extractVocabulary(text: string, studentLevel: string) {
    // Simple vocabulary extraction based on word frequency and complexity
    const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
    const uniqueWords = Array.from(new Set(words))
    const selectedWords = uniqueWords.slice(0, 6)

    return selectedWords.map((word) => ({
      word: word,
      meaning: `Definition of ${word}`,
      example: `Example sentence with ${word}.`,
    }))
  }

  private simplifyText(text: string, studentLevel: string): string {
    // Basic text simplification based on level
    const maxLength = {
      A1: 200,
      A2: 300,
      B1: 400,
      B2: 500,
      C1: 600,
    }

    const limit = maxLength[studentLevel] || 400
    return text.substring(0, limit) + (text.length > limit ? "..." : "")
  }

  private getTemplateComprehension(lessonType: string, studentLevel: string): string[] {
    return [
      "What is the main idea of this text?",
      "What supporting details can you identify?",
      "How does this relate to your experience?",
      "What conclusions can you draw?",
    ]
  }

  private getTemplateDiscussion(lessonType: string, studentLevel: string): string[] {
    const templates = {
      discussion: [
        "What is your opinion on this topic?",
        "How would you handle this situation?",
        "What alternative approaches exist?",
      ],
      business: [
        "How would you apply this professionally?",
        "What business challenges does this address?",
        "How would you present this to colleagues?",
      ],
      travel: [
        "How would this help while traveling?",
        "What preparations would you make?",
        "How would you share this experience?",
      ],
    }
    return templates[lessonType] || templates.discussion
  }

  private getTemplateGrammar(studentLevel: string) {
    const grammarFoci = {
      A1: "Present Simple Tense",
      A2: "Past Simple Tense",
      B1: "Present Perfect Tense",
      B2: "Conditional Sentences",
      C1: "Advanced Grammar Structures",
    }

    return {
      focus: grammarFoci[studentLevel] || "Present Perfect Tense",
      examples: ["I have learned many new things.", "She has improved her skills.", "We have discussed this topic."],
      exercise: [
        "I _____ (learn) a lot today.",
        "They _____ (complete) the project.",
        "She _____ (improve) significantly.",
      ],
    }
  }

  private getTemplatePronunciation(text: string) {
    // Extract a challenging word from the text
    const words = text.match(/\b[a-z]{6,}\b/gi) || ["communication"]
    const selectedWord = words[0] || "communication"

    return {
      word: selectedWord.toLowerCase(),
      ipa: "/kəˌmjuːnɪˈkeɪʃən/",
      practice: `Practice saying: "${selectedWord}" in a sentence.`,
    }
  }

  private getTemplateWrapup(lessonType: string): string[] {
    return [
      "What new vocabulary did you learn?",
      "Which concepts need more practice?",
      "How will you use this knowledge?",
      "What questions do you still have?",
    ]
  }

  // New helper methods for enhanced contextual analysis

  private extractTopicsFromHeadings(headings: Array<{ level: number; text: string }>): string[] {
    return headings
      .filter(h => h.level <= 3) // Focus on main headings
      .map(h => h.text)
      .slice(0, 5)
  }

  private extractTopicsFromText(text: string, headings: Array<{ level: number; text: string }>): string[] {
    // First try to get topics from headings
    const headingTopics = this.extractTopicsFromHeadings(headings)
    if (headingTopics.length > 0) {
      return headingTopics
    }

    // Fallback: extract key phrases from text
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20)
    const topics = []

    // Look for common topic indicators
    const topicPatterns = [
      /about (.+?)(?:\s|,|\.)/gi,
      /discuss (.+?)(?:\s|,|\.)/gi,
      /focus on (.+?)(?:\s|,|\.)/gi,
      /regarding (.+?)(?:\s|,|\.)/gi,
    ]

    for (const sentence of sentences.slice(0, 5)) {
      for (const pattern of topicPatterns) {
        const matches = sentence.match(pattern)
        if (matches) {
          topics.push(...matches.map(m => m.replace(pattern, '$1').trim()).slice(0, 2))
        }
      }
    }

    // If no patterns found, extract key nouns
    if (topics.length === 0) {
      const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
      const commonWords = ['this', 'that', 'with', 'from', 'they', 'have', 'been', 'will', 'more', 'some', 'what', 'when', 'where', 'which', 'their', 'would', 'could', 'should']
      const keyWords = words
        .filter(word => !commonWords.includes(word))
        .filter((word, index, arr) => arr.indexOf(word) === index) // unique
        .slice(0, 3)

      return keyWords.length > 0 ? keyWords : ['AI technology', 'mobile devices', 'privacy']
    }

    return topics.slice(0, 3)
  }

  // Extract meaningful vocabulary for lesson content (improved algorithm)
  private extractMeaningfulVocabulary(text: string, level: string): string[] {
    const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
    const uniqueWords = Array.from(new Set(words))

    // Enhanced exclusion list focusing on truly basic words and proper names
    const excludeWords = new Set([
      // Basic function words
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'she', 'use', 'way', 'what', 'when', 'where', 'will', 'with', 'have', 'this', 'that', 'they', 'been', 'said', 'each', 'which', 'their', 'time', 'would', 'there', 'could', 'other', 'after', 'first', 'well', 'water', 'very', 'what', 'know', 'just', 'people', 'into', 'over', 'think', 'also', 'back', 'work', 'life', 'only', 'year', 'years', 'come', 'came', 'right', 'good', 'each', 'those', 'feel', 'seem', 'these', 'give', 'most', 'hand', 'high', 'keep', 'last', 'left', 'life', 'live', 'look', 'made', 'make', 'many', 'much', 'must', 'name', 'need', 'next', 'open', 'part', 'play', 'said', 'same', 'seem', 'show', 'side', 'take', 'tell', 'turn', 'want', 'ways', 'well', 'went', 'were', 'here', 'home', 'long', 'look', 'move', 'place', 'right', 'small', 'sound', 'still', 'such', 'thing', 'think', 'three', 'under', 'water', 'where', 'while', 'world', 'write', 'young',
      // Very basic words that B1+ students should know
      'student', 'english', 'september', 'october', 'november', 'december', 'january', 'february', 'march', 'april', 'june', 'july', 'august', 'south', 'africa', 'images', 'image', 'photo', 'picture', 'black', 'white', 'coloured', 'colored',
      // Problematic or sensitive terms to avoid in vocabulary
      'slur', 'slurs', 'racial', 'racist', 'racism', 'mckenzie', 'apartheid',
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
      'today', 'yesterday', 'tomorrow', 'morning', 'afternoon', 'evening', 'night',
      // Common proper names to avoid (people's names and specific places)
      'john', 'mary', 'david', 'sarah', 'michael', 'jennifer', 'robert', 'lisa', 'william', 'karen', 'james', 'susan', 'christopher', 'jessica', 'daniel', 'nancy', 'matthew', 'betty', 'anthony', 'helen', 'mark', 'sandra', 'donald', 'donna', 'steven', 'carol', 'paul', 'ruth', 'andrew', 'sharon', 'joshua', 'michelle', 'kenneth', 'laura', 'kevin', 'sarah', 'brian', 'kimberly', 'george', 'deborah', 'edward', 'dorothy', 'ronald', 'lisa', 'timothy', 'nancy', 'jason', 'karen', 'jeffrey', 'betty', 'ryan', 'helen', 'jacob', 'sandra', 'gary', 'donna', 'nicholas', 'carol', 'eric', 'ruth', 'jonathan', 'sharon', 'stephen', 'michelle', 'larry', 'laura', 'justin', 'sarah', 'scott', 'kimberly', 'brandon', 'deborah', 'benjamin', 'dorothy', 'samuel', 'lisa', 'gregory', 'nancy', 'alexander', 'karen', 'patrick', 'betty', 'frank', 'helen', 'raymond', 'sandra', 'jack', 'donna', 'dennis', 'carol', 'jerry', 'ruth', 'tyler', 'sharon', 'aaron', 'michelle', 'jose', 'laura', 'henry', 'sarah', 'adam', 'kimberly', 'douglas', 'deborah', 'nathan', 'dorothy', 'peter', 'lisa', 'zachary', 'nancy', 'kyle', 'karen', 'julius', 'malema'
    ])

    // Filter and score words for educational value
    const meaningfulWords = uniqueWords.filter(word => {
      if (excludeWords.has(word)) return false
      if (/^\d+$/.test(word)) return false // Skip pure numbers
      if (word.length < 4) return false // Skip very short words
      if (word.length > 15) return false // Skip very long words
      if (this.isProperName(word)) return false // Skip proper names
      return true
    })

    // Score words based on educational and contextual value
    const scoredWords = meaningfulWords.map(word => {
      let score = 0

      // High-value content-specific vocabulary (political, business, academic terms)
      if (/^(announcement|opposition|recognition|leadership|management|government|political|parliament|democracy|election|policy|legislation|constitution|rights|freedom|justice|equality|development|economic|social|cultural|environmental|international|national|regional|community|organization|institution|administration|authority|responsibility|accountability|transparency|governance|regulation|compliance|strategy|implementation|evaluation|assessment|analysis|research|investigation|examination|consideration|discussion|negotiation|agreement|cooperation|collaboration|partnership|relationship|communication|information|education|training|knowledge|understanding|awareness|consciousness|perspective|opinion|belief|attitude|approach|method|technique|process|system|structure|framework|principle|concept|theory|practice|experience|skill|expertise|professional|academic|scientific|technical|technological|digital|innovation|creativity|development|improvement|enhancement|transformation|change|progress|advancement|achievement|success|performance|quality|efficiency|effectiveness|productivity|sustainability|responsibility|commitment|dedication|motivation|inspiration|leadership|management|coordination|supervision|direction|guidance|support|assistance|service|provision|delivery|implementation|execution|operation|function|activity|action|behavior|conduct|practice|procedure|protocol|standard|guideline|requirement|condition|situation|circumstance|context|environment|setting|background|history|tradition|culture|society|community|population|group|team|organization|institution|establishment|authority|government|administration|policy|regulation|law|rule|standard|guideline|procedure|protocol|framework|model|pattern|template|example|instance|case|scenario)/.test(word)) {
        score += 6 // Highest priority for meaningful content vocabulary
      }

      // Business and professional terms
      if (/^(manage|leader|team|company|business|strategy|develop|create|innovat|technolog|digital|global|professional|experience|skill|expert|analysis|research|project|solution|challenge|opportunity|growth|success|achievement|performance|quality|efficiency|productivity|collaboration|communication|decision|responsibility|objective|goal|target|result|outcome|impact|benefit|advantage|value|profit|revenue|investment|market|customer|client|service|product|brand|reputation|competitive|industry|sector|economy|economic|financial|budget|cost|price|sales|marketing|advertising|promotion|campaign|strategy|planning|implementation|execution|evaluation|assessment|improvement|optimization|transformation|change|adaptation|flexibility|agility|resilience|sustainability|environmental|social|ethical|governance|compliance|regulation|policy|procedure|standard|guideline|framework|methodology|approach|technique|method|process|system|structure|organization|hierarchy|department|division|function|role|position|title|career|development|training|education|learning|knowledge|information|data|insight|intelligence)/.test(word)) {
        score += 4
      }

      // Academic and formal vocabulary
      if (/^(research|study|analysis|theory|concept|principle|method|approach|technique|process|system|structure|function|relationship|connection|interaction|influence|effect|impact|cause|result|consequence|factor|element|component|aspect|feature|characteristic|property|quality|attribute|dimension|level|degree|extent|scope|range|scale|measure|measurement|evaluation|assessment|comparison|contrast|similarity|difference|variation|change|development|evolution|progress|advancement|improvement|enhancement|modification|adjustment|adaptation|transformation|revolution|innovation|discovery|invention|creation|production|construction|design|planning|organization|management|administration|operation|implementation|execution|performance|achievement|accomplishment)/.test(word)) {
        score += 3
      }

      // Action words and processes (often good for learning)
      if (/^(announce|reorganize|manage|develop|implement|achieve|improve|transform|communicate|collaborate|investigate|explore|examine|evaluate|assess|consider|discuss|negotiate|present|demonstrate|explain|describe|illustrate|interpret|translate|adapt|modify|optimize|organize|coordinate|administer|supervise|operate|execute|perform|accomplish|establish|maintain|preserve|conserve|protect|prevent|promote|advance|enhance|enrich|empower|engage|involve|participate|contribute|dedicate|commit|invest|allocate|distribute|circulate|transmit|transport|deliver|provide|supply|support|assist|guide|direct|instruct|educate|train|prepare|plan|schedule|arrange|coordinate|synchronize|integrate|combine|connect|associate|relate|partner|collaborate|cooperate|compete|compare|contrast|differentiate|distinguish|identify|recognize|acknowledge|appreciate|understand|comprehend|realize|aware|conscious|perceive|observe|monitor|track|measure|calculate|estimate|predict|forecast|project|anticipate|expect|assume|hypothesize|speculate|investigate|explore|research|analyze|synthesize|evaluate|assess|judge|decide|choose|select|prefer|recommend|suggest|propose|offer|request|demand|require|specify|instruct|direct|guide|advise|consult|discuss|negotiate|agree|contract|deal|transaction|exchange|trade|purchase|sale|investment|funding|financing|sponsorship|support|assistance|service|provision|delivery|distribution|allocation|assignment|delegation|authorization|approval|permission|consent|acceptance|rejection|refusal|denial|prohibition|restriction|limitation|constraint|regulation|control|management|administration|governance|leadership|supervision|oversight|monitoring|evaluation|assessment|review|audit|inspection|examination|investigation|inquiry)/.test(word)) {
        score += 3
      }

      // Frequency bonus (words that appear multiple times are likely important)
      const frequency = (text.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g')) || []).length
      if (frequency > 1) score += frequency * 2

      // Length bonus for substantial words
      if (word.length >= 6 && word.length <= 12) score += 1

      return { word, score }
    })

    // Sort by score and return top words
    const topWords = scoredWords
      .sort((a, b) => b.score - a.score)
      .slice(0, 8) // Take top 8 words
      .map(item => item.word)

    console.log("📚 Meaningful vocabulary extraction results:", topWords.map(w => `${w} (score: ${scoredWords.find(s => s.word === w)?.score})`))
    return topWords
  }

  private extractVocabularyFromText(text: string, level: string): string[] {
    // Smart vocabulary extraction focusing on meaningful, educational words
    const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || []
    const uniqueWords = Array.from(new Set(words))

    // Words to exclude (common, non-educational words)
    const excludeWords = new Set([
      // Common words
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'she', 'use', 'way', 'what', 'when', 'where', 'will', 'with', 'have', 'this', 'that', 'they', 'been', 'said', 'each', 'which', 'their', 'time', 'would', 'there', 'could', 'other', 'after', 'first', 'well', 'water', 'very', 'what', 'know', 'just', 'people', 'into', 'over', 'think', 'also', 'back', 'work', 'life', 'only', 'year', 'years', 'come', 'came', 'right', 'good', 'each', 'those', 'feel', 'seem', 'these', 'give', 'most', 'hand', 'high', 'keep', 'last', 'left', 'life', 'live', 'look', 'made', 'make', 'many', 'much', 'must', 'name', 'need', 'next', 'open', 'part', 'play', 'said', 'same', 'seem', 'show', 'side', 'take', 'tell', 'turn', 'want', 'ways', 'well', 'went', 'were', 'here', 'home', 'long', 'look', 'move', 'place', 'right', 'small', 'sound', 'still', 'such', 'thing', 'think', 'three', 'under', 'water', 'where', 'while', 'world', 'write', 'young',
      // Dates, numbers, names (often not useful for vocabulary)
      'january', 'february', 'march', 'april', 'june', 'july', 'august', 'september', 'october', 'november', 'december',
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
      'today', 'yesterday', 'tomorrow', 'morning', 'afternoon', 'evening', 'night',
      // Common proper nouns that are often not educational
      'francisco', 'california', 'america', 'american', 'united', 'states', 'york', 'london', 'paris', 'tokyo'
    ])

    // Prioritize meaningful vocabulary categories
    const meaningfulWords = uniqueWords.filter(word => {
      // Skip excluded words
      if (excludeWords.has(word)) return false

      // Skip pure numbers or dates
      if (/^\d+$/.test(word) || /^\d{4}$/.test(word)) return false

      // Skip very short words (less than 4 letters) unless they're important
      if (word.length < 4) return false

      // Skip very long words that might be too complex
      if (word.length > 15) return false

      return true
    })

    // Score words based on educational value
    const scoredWords = meaningfulWords.map(word => {
      let score = 0

      // Business/professional vocabulary
      if (/^(manage|leader|team|company|business|strategy|develop|create|innovat|technolog|digital|global|international|professional|experience|skill|expert|analysis|research|project|solution|challenge|opportunity|growth|success|achievement|performance|quality|efficiency|productivity|collaboration|communication|decision|responsibility|objective|goal|target|result|outcome|impact|benefit|advantage|value|profit|revenue|investment|market|customer|client|service|product|brand|reputation|competitive|industry|sector|economy|economic|financial|budget|cost|price|sales|marketing|advertising|promotion|campaign|strategy|planning|implementation|execution|evaluation|assessment|improvement|optimization|transformation|change|adaptation|flexibility|agility|resilience|sustainability|environmental|social|ethical|governance|compliance|regulation|policy|procedure|standard|guideline|framework|methodology|approach|technique|method|process|system|structure|organization|hierarchy|department|division|function|role|position|title|career|development|training|education|learning|knowledge|information|data|insight|intelligence|wisdom|understanding|comprehension|awareness|consciousness|perception|perspective|viewpoint|opinion|belief|attitude|mindset|culture|values|principles|ethics|integrity|honesty|transparency|accountability|responsibility|commitment|dedication|passion|motivation|inspiration|creativity|innovation|imagination|vision|mission|purpose|meaning|significance|importance|relevance|priority|urgency|critical|essential|fundamental|basic|advanced|complex|sophisticated|comprehensive|detailed|specific|particular|general|overall|total|complete|full|entire|whole|partial|limited|restricted|exclusive|inclusive|diverse|varied|different|similar|comparable|equivalent|equal|fair|just|reasonable|logical|rational|practical|realistic|achievable|feasible|possible|probable|likely|unlikely|impossible|certain|uncertain|confident|doubtful|optimistic|pessimistic|positive|negative|neutral|objective|subjective|personal|individual|collective|social|public|private|internal|external|local|regional|national|international|global|worldwide|universal)/.test(word)) {
        score += 3
      }

      // Academic/educational vocabulary
      if (/^(research|study|analysis|theory|concept|principle|method|approach|technique|process|system|structure|function|relationship|connection|interaction|influence|effect|impact|cause|result|consequence|factor|element|component|aspect|feature|characteristic|property|quality|attribute|dimension|level|degree|extent|scope|range|scale|measure|measurement|evaluation|assessment|comparison|contrast|similarity|difference|variation|change|development|evolution|progress|advancement|improvement|enhancement|modification|adjustment|adaptation|transformation|revolution|innovation|discovery|invention|creation|production|construction|design|planning|organization|management|administration|operation|implementation|execution|performance|achievement|accomplishment|success|failure|challenge|problem|issue|difficulty|obstacle|barrier|limitation|constraint|restriction|requirement|condition|situation|circumstance|context|environment|setting|background|history|tradition|culture|society|community|population|group|team|organization|institution|establishment|authority|government|administration|policy|regulation|law|rule|standard|guideline|procedure|protocol|framework|model|pattern|template|example|instance|case|scenario|situation|condition|state|status|position|location|place|area|region|zone|territory|domain|field|sector|industry|market|economy|business|commerce|trade|exchange|transaction|deal|agreement|contract|partnership|collaboration|cooperation|coordination|communication|interaction|relationship|connection|network|system|structure|organization|hierarchy|level|rank|grade|class|category|type|kind|sort|variety|diversity|range|spectrum)/.test(word)) {
        score += 2
      }

      // Technical/specialized vocabulary
      if (/^(technolog|digital|computer|software|hardware|internet|online|website|platform|application|program|code|data|information|network|system|security|privacy|encryption|algorithm|artificial|intelligence|machine|learning|automation|robot|innovation|development|engineering|science|scientific|medical|health|treatment|diagnosis|research|experiment|laboratory|equipment|instrument|device|tool|machine|mechanism|process|procedure|technique|method|approach|strategy|solution|problem|challenge|opportunity|advantage|benefit|risk|threat|danger|safety|protection|prevention|control|management|monitoring|supervision|oversight|governance|regulation|compliance|standard|quality|performance|efficiency|effectiveness|productivity|optimization|improvement|enhancement|upgrade|update|modification|customization|personalization|adaptation|flexibility|scalability|sustainability|reliability|durability|stability|consistency|accuracy|precision|validity|credibility|authenticity|transparency|accountability|responsibility|integrity|ethics|morality|values|principles|beliefs|attitudes|perspectives|opinions|views|thoughts|ideas|concepts|theories|models|frameworks|paradigms|approaches|methodologies|strategies|tactics|techniques|procedures|protocols)/.test(word)) {
        score += 2
      }

      // Action/process words (verbs in noun form or gerunds)
      if (/^(announcement|leadership|management|development|implementation|achievement|improvement|transformation|communication|collaboration|investigation|exploration|examination|evaluation|assessment|consideration|discussion|negotiation|presentation|demonstration|explanation|description|illustration|interpretation|translation|adaptation|modification|optimization|organization|coordination|administration|supervision|operation|execution|performance|accomplishment|establishment|maintenance|preservation|conservation|protection|prevention|promotion|advancement|enhancement|enrichment|empowerment|engagement|involvement|participation|contribution|dedication|commitment|investment|allocation|distribution|circulation|transmission|transportation|delivery|provision|supply|support|assistance|guidance|direction|instruction|education|training|preparation|planning|scheduling|arrangement|coordination|synchronization|integration|combination|connection|association|relationship|partnership|collaboration|cooperation|competition|comparison|contrast|differentiation|distinction|identification|recognition|acknowledgment|appreciation|understanding|comprehension|realization|awareness|consciousness|perception|observation|monitoring|tracking|measurement|calculation|estimation|prediction|forecasting|projection|anticipation|expectation|assumption|hypothesis|speculation|investigation|exploration|research|analysis|synthesis|evaluation|assessment|judgment|decision|choice|selection|preference|recommendation|suggestion|proposal|offer|request|demand|requirement|specification|instruction|direction|guidance|advice|consultation|discussion|negotiation|agreement|contract|deal|transaction|exchange|trade|purchase|sale|investment|funding|financing|sponsorship|support|assistance|service|provision|delivery|distribution|allocation|assignment|delegation|authorization|approval|permission|consent|acceptance|rejection|refusal|denial|prohibition|restriction|limitation|constraint|regulation|control|management|administration|governance|leadership|supervision|oversight|monitoring|evaluation|assessment|review|audit|inspection|examination|investigation|inquiry|research|study|analysis|interpretation|explanation|clarification|specification|definition|description|illustration|demonstration|presentation|exhibition|display|show|performance|execution|implementation|application|utilization|employment|usage|operation|function|activity|action|behavior|conduct|practice|procedure|process|method|technique|approach|strategy|plan|scheme|program|project|initiative|campaign|movement|effort|attempt|trial|experiment|test|examination|evaluation|assessment|measurement|calculation|estimation|determination|identification|recognition|discovery|invention|creation|production|construction|building|development|growth|expansion|extension|enlargement|increase|improvement|enhancement|upgrade|advancement|progress|evolution|transformation|change|modification|adjustment|adaptation|customization|personalization|optimization|refinement|perfection|completion|achievement|accomplishment|success|victory|triumph|conquest|defeat|failure|loss|mistake|error|problem|issue|difficulty|challenge|obstacle|barrier|limitation|constraint|restriction|requirement|condition|situation|circumstance|context|environment|setting|atmosphere|climate|culture|tradition|custom|habit|routine|pattern|trend|tendency|inclination|preference|choice|option|alternative|possibility|opportunity|chance|probability|likelihood|certainty|uncertainty|doubt|confidence|trust|faith|belief|conviction|opinion|view|perspective|standpoint|position|stance|attitude|approach|mindset|mentality|psychology|philosophy|ideology|theory|concept|idea|notion|thought|consideration|reflection|contemplation|meditation|concentration|focus|attention|interest|curiosity|wonder|amazement|surprise|shock|astonishment|bewilderment|confusion|uncertainty|clarity|understanding|comprehension|knowledge|information|data|facts|details|specifics|particulars|characteristics|features|attributes|properties|qualities|aspects|elements|components|parts|sections|segments|divisions|categories|types|kinds|varieties|forms|shapes|sizes|dimensions|measurements|quantities|amounts|numbers|figures|statistics|percentages|proportions|ratios|rates|speeds|frequencies|intervals|periods|durations|times|moments|instances|occasions|events|incidents|occurrences|happenings|developments|changes|modifications|alterations|adjustments|improvements|enhancements|upgrades|updates|revisions|corrections|fixes|repairs|maintenance|preservation|conservation|protection|security|safety|defense|prevention|precaution|preparation|readiness|availability|accessibility|convenience|comfort|ease|simplicity|complexity|difficulty|challenge|complication|sophistication|advancement|progress|development|growth|expansion|extension|increase|rise|improvement|enhancement|betterment|amelioration|optimization|perfection|excellence|quality|standard|level|grade|rank|status|position|location|place|site|spot|point|area|region|zone|territory|domain|field|sector|industry|market|economy|business|enterprise|organization|institution|establishment|company|corporation|firm|agency|department|division|section|unit|team|group|committee|board|council|assembly|association|society|community|population|public|audience|customers|clients|users|consumers|buyers|purchasers|investors|stakeholders|shareholders|partners|collaborators|colleagues|associates|members|participants|contributors|supporters|advocates|representatives|delegates|ambassadors|spokespersons|leaders|managers|directors|executives|administrators|supervisors|coordinators|organizers|planners|designers|developers|creators|producers|manufacturers|suppliers|providers|distributors|retailers|sellers|vendors|contractors|consultants|advisors|experts|specialists|professionals|practitioners|technicians|operators|workers|employees|staff|personnel|workforce|labor|human|resources|capital|assets|investments|funds|finances|budget|costs|expenses|revenues|income|profits|earnings|returns|benefits|advantages|gains|losses|risks|threats|dangers|hazards|challenges|problems|issues|difficulties|obstacles|barriers|limitations|constraints|restrictions|requirements|conditions|terms|specifications|standards|criteria|guidelines|rules|regulations|policies|procedures|protocols|processes|methods|techniques|approaches|strategies|plans|programs|projects|initiatives|campaigns|efforts|activities|actions|operations|functions|services|products|goods|items|articles|objects|things|materials|substances|elements|components|ingredients|contents)$/.test(word)) {
        score += 3
      }

      // Bonus for words that appear multiple times (indicating importance)
      const frequency = (text.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g')) || []).length
      if (frequency > 1) score += frequency

      return { word, score }
    })

    // Sort by score and return top words
    const topWords = scoredWords
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(item => item.word)

    console.log("📚 Smart vocabulary extraction results:", topWords)
    return topWords
  }

  private determineCulturalContext(domain: string, text: string): string {
    // Determine cultural context based on domain and content
    const culturalIndicators = {
      'bbc.com': 'British English, UK culture',
      'cnn.com': 'American English, US culture',
      'wikipedia.org': 'International, encyclopedic',
      'nytimes.com': 'American English, US perspective',
      'theguardian.com': 'British English, UK perspective',
    }

    if (culturalIndicators[domain]) {
      return culturalIndicators[domain]
    }

    // Analyze text for cultural markers
    const americanMarkers = ['dollar', 'president', 'congress', 'state', 'federal']
    const britishMarkers = ['pound', 'minister', 'parliament', 'council', 'government']

    const americanCount = americanMarkers.filter(marker =>
      text.toLowerCase().includes(marker)
    ).length

    const britishCount = britishMarkers.filter(marker =>
      text.toLowerCase().includes(marker)
    ).length

    if (americanCount > britishCount) {
      return 'American English context'
    } else if (britishCount > americanCount) {
      return 'British English context'
    }

    return 'International context'
  }

  private generateLearningObjectives(contentType: string, topics: string[], level: string): string[] {
    const objectives = []

    // Base objectives on content type
    switch (contentType) {
      case 'news':
        objectives.push('Understand current events vocabulary')
        objectives.push('Practice reading news articles')
        break
      case 'blog':
        objectives.push('Learn informal writing style')
        objectives.push('Understand personal opinions and experiences')
        break
      case 'tutorial':
        objectives.push('Follow step-by-step instructions')
        objectives.push('Learn technical vocabulary')
        break
      case 'encyclopedia':
        objectives.push('Understand factual information')
        objectives.push('Learn academic vocabulary')
        break
      default:
        objectives.push('Improve reading comprehension')
        objectives.push('Expand vocabulary knowledge')
    }

    // Add topic-specific objectives
    topics.slice(0, 2).forEach(topic => {
      objectives.push(`Discuss topics related to ${topic.toLowerCase()}`)
    })

    return objectives.slice(0, 4)
  }

  private getAudienceLevel(cefrLevel: string): "general" | "expert" | "beginner" {
    const levelMap = {
      'A1': 'beginner' as const,
      'A2': 'beginner' as const,
      'B1': 'general' as const,
      'B2': 'general' as const,
      'C1': 'expert' as const,
    }
    return levelMap[cefrLevel] || 'general'
  }

  // Enhanced fallback lesson generation with context
  private generateEnhancedFallbackLesson(params: LessonGenerationParams): GeneratedLesson {
    const {
      sourceText,
      lessonType,
      studentLevel,
      targetLanguage,
      contentMetadata,
      structuredContent
    } = params

    console.log("🔄 Generating enhanced fallback lesson with contextual warm-up...")

    // Use available context even in fallback
    const topics = structuredContent?.headings?.map(h => h.text).slice(0, 3) || []
    const contentType = contentMetadata?.contentType || 'general'

    // Create mock content analysis for fallback warm-up generation
    const mockContentAnalysis = {
      topics: topics,
      contentType: contentType,
      sourceCountry: this.determineSourceCountry(contentMetadata?.domain || ''),
      culturalContext: this.determineCulturalContext(contentMetadata?.domain || '', sourceText)
    }

    // Generate contextual warm-up questions even in fallback
    const contextualWarmup = this.getContextualWarmupFallback(studentLevel, mockContentAnalysis, contentMetadata)

    console.log("🔥 Generated fallback contextual warm-up:", contextualWarmup)

    return {
      lessonType,
      studentLevel,
      targetLanguage,
      sections: {
        warmup: contextualWarmup,
        vocabulary: this.extractContextualVocabulary(sourceText, studentLevel, topics),
        reading: this.simplifyText(sourceText, studentLevel),
        comprehension: this.getContextualComprehension(lessonType, studentLevel, topics),
        dialoguePractice: this.generateTemplateDialoguePractice(topics[0] || 'this topic', studentLevel, []),
        dialogueFillGap: this.generateTemplateDialogueFillGap(topics[0] || 'this topic', studentLevel, []),
        discussion: this.getContextualDiscussion(lessonType, studentLevel, topics),
        grammar: this.getTemplateGrammar(studentLevel),
        pronunciation: this.getTemplatePronunciation(sourceText),
        wrapup: this.getContextualWrapup(lessonType, topics),
      },
    }
  }

  private getContextualWarmup(lessonType: string, studentLevel: string, topics: string[], contentType: string): string[] {
    // Use the same contextual fallback logic
    const mockAnalysis = {
      topics: topics,
      contentType: contentType,
      sourceCountry: 'International'
    }

    return this.getContextualWarmupFallback(studentLevel, mockAnalysis, { title: topics[0] || 'Content' })
  }

  // Basic fallback for complete failures
  private generateBasicFallbackLesson(params: LessonGenerationParams): GeneratedLesson {
    const { sourceText, lessonType, studentLevel, targetLanguage } = params

    return {
      lessonType,
      studentLevel,
      targetLanguage,
      sections: {
        warmup: ["What do you already know about this topic?", "Have you had similar experiences?", "What would you like to learn?"],
        vocabulary: [],
        reading: sourceText.substring(0, 400),
        comprehension: ["What is the main idea?", "What details can you identify?"],
        dialoguePractice: this.generateTemplateDialoguePractice('this topic', studentLevel, []),
        dialogueFillGap: this.generateTemplateDialogueFillGap('this topic', studentLevel, []),
        discussion: ["What is your opinion?", "How would you handle this?"],
        grammar: this.getTemplateGrammar(studentLevel),
        pronunciation: { word: "example", ipa: "/ɪɡˈzæmpəl/", practice: "Practice saying example." },
        wrapup: ["What did you learn?", "What needs more practice?"]
      }
    }
  }

  private extractContextualVocabulary(text: string, studentLevel: string, topics: string[]) {
    const vocabulary = this.extractVocabulary(text, studentLevel)

    // Enhance with topic context if available
    if (topics.length > 0) {
      return vocabulary.map((vocab, index) => ({
        ...vocab,
        context: index < topics.length ? `Related to ${topics[index].toLowerCase()}` : vocab.meaning,
      }))
    }

    return vocabulary
  }

  private getContextualComprehension(lessonType: string, studentLevel: string, topics: string[]): string[] {
    const baseQuestions = this.getTemplateComprehension(lessonType, studentLevel)

    if (topics.length > 0) {
      return [
        `What is the main point about ${topics[0]?.toLowerCase()}?`,
        `How does the text explain ${topics[1]?.toLowerCase() || 'the topic'}?`,
        "What supporting details can you identify?",
        "What conclusions can you draw from this information?",
      ]
    }

    return baseQuestions
  }

  private getContextualDiscussion(lessonType: string, studentLevel: string, topics: string[]): string[] {
    const baseQuestions = this.getTemplateDiscussion(lessonType, studentLevel)

    if (topics.length > 0) {
      return [
        `What is your opinion about ${topics[0]?.toLowerCase()}?`,
        `How would you apply this information about ${topics[1]?.toLowerCase() || 'this topic'}?`,
        `What are the implications of what you learned about ${topics[0]?.toLowerCase()}?`,
      ]
    }

    return baseQuestions
  }

  private getContextualWrapup(lessonType: string, topics: string[]): string[] {
    if (topics.length > 0) {
      return [
        `What new vocabulary did you learn about ${topics[0]?.toLowerCase()}?`,
        `Which concepts about ${topics[1]?.toLowerCase() || 'this topic'} need more practice?`,
        "How will you use this knowledge in real situations?",
        "What questions do you still have about this content?",
      ]
    }

    return this.getTemplateWrapup(lessonType)
  }

  // Template dialogue generation methods
  private generateTemplateDialoguePractice(topic: string, studentLevel: string, vocabularyWords: string[]): any {
    const levelDialogues = {
      'A1': {
        instruction: "Practice this simple conversation with your tutor:",
        dialogue: [
          { character: "Student", line: `I want to learn about ${topic}.` },
          { character: "Tutor", line: `That's great! What do you already know about ${topic}?` },
          { character: "Student", line: "I know a little bit." },
          { character: "Tutor", line: `Let's explore ${topic} together.` }
        ],
        followUpQuestions: [
          `What interests you most about ${topic}?`,
          "What would you like to know more about?",
          "How can this help you in daily life?"
        ]
      },
      'A2': {
        instruction: "Practice this conversation with your tutor:",
        dialogue: [
          { character: "Student", line: `I've been reading about ${topic}. It's quite interesting.` },
          { character: "Tutor", line: `What did you find most interesting about ${topic}?` },
          { character: "Student", line: "I learned some new things I didn't know before." },
          { character: "Tutor", line: `Can you share what you learned about ${topic}?` }
        ],
        followUpQuestions: [
          `How does ${topic} relate to your experience?`,
          "What surprised you the most?",
          "Would you recommend this topic to others?"
        ]
      },
      'B1': {
        instruction: "Practice this discussion with your tutor:",
        dialogue: [
          { character: "Student", line: `I've been thinking about ${topic} and its implications.` },
          { character: "Tutor", line: `That's a complex topic. What aspects of ${topic} interest you most?` },
          { character: "Student", line: "There are several factors to consider when discussing this." },
          { character: "Tutor", line: `Let's explore those factors. What do you think is most important about ${topic}?` }
        ],
        followUpQuestions: [
          `What are the advantages and disadvantages of ${topic}?`,
          "How might this impact different groups of people?",
          "What solutions would you propose?"
        ]
      },
      'B2': {
        instruction: "Engage in this analytical discussion with your tutor:",
        dialogue: [
          { character: "Student", line: `The complexity of ${topic} requires careful analysis of multiple perspectives.` },
          { character: "Tutor", line: `Excellent point. How do you think different stakeholders view ${topic}?` },
          { character: "Student", line: "Each perspective brings unique insights and challenges to consider." },
          { character: "Tutor", line: `What evidence supports your analysis of ${topic}?` }
        ],
        followUpQuestions: [
          `How do cultural differences influence perspectives on ${topic}?`,
          "What long-term consequences should we consider?",
          "How would you evaluate the effectiveness of current approaches?"
        ]
      },
      'C1': {
        instruction: "Participate in this sophisticated discourse with your tutor:",
        dialogue: [
          { character: "Student", line: `The nuanced nature of ${topic} demands a multifaceted approach to understanding.` },
          { character: "Tutor", line: `Indeed. How do you reconcile the apparent contradictions within ${topic}?` },
          { character: "Student", line: "The paradoxes inherent in this subject reflect broader societal complexities." },
          { character: "Tutor", line: `What theoretical frameworks best illuminate the intricacies of ${topic}?` }
        ],
        followUpQuestions: [
          `How do philosophical underpinnings shape our understanding of ${topic}?`,
          "What paradigm shifts might be necessary for progress?",
          "How do you envision the evolution of thought regarding this matter?"
        ]
      }
    }

    return levelDialogues[studentLevel as keyof typeof levelDialogues] || levelDialogues['B1']
  }

  private generateTemplateDialogueFillGap(topic: string, studentLevel: string, vocabularyWords: string[]): any {
    const levelGapDialogues = {
      'A1': {
        instruction: "Fill in the gaps in this conversation:",
        dialogue: [
          { character: "Student", line: `I _____ to learn about ${topic}.`, isGap: true },
          { character: "Tutor", line: `That's great! What _____ you already know?`, isGap: true },
          { character: "Student", line: "I know _____ little bit.", isGap: true },
          { character: "Tutor", line: `Let's _____ together.`, isGap: true }
        ],
        answers: ["want", "do", "a", "learn"]
      },
      'A2': {
        instruction: "Complete this conversation with the missing words:",
        dialogue: [
          { character: "Student", line: `I've been _____ about ${topic}.`, isGap: true },
          { character: "Tutor", line: `What did you _____ most interesting?`, isGap: true },
          { character: "Student", line: "I _____ some new things.", isGap: true },
          { character: "Tutor", line: `Can you _____ what you learned?`, isGap: true }
        ],
        answers: ["reading", "find", "learned", "share"]
      },
      'B1': {
        instruction: "Fill in the blanks to complete this discussion:",
        dialogue: [
          { character: "Student", line: `I've been _____ about ${topic} and its implications.`, isGap: true },
          { character: "Tutor", line: `What _____ interest you most?`, isGap: true },
          { character: "Student", line: "There are several _____ to consider.", isGap: true },
          { character: "Tutor", line: `What do you think is most _____ ?`, isGap: true }
        ],
        answers: ["thinking", "aspects", "factors", "important"]
      },
      'B2': {
        instruction: "Complete this analytical discussion:",
        dialogue: [
          { character: "Student", line: `The _____ of ${topic} requires careful analysis.`, isGap: true },
          { character: "Tutor", line: `How do different _____ view this topic?`, isGap: true },
          { character: "Student", line: "Each perspective brings unique _____ .", isGap: true },
          { character: "Tutor", line: `What _____ supports your analysis?`, isGap: true }
        ],
        answers: ["complexity", "stakeholders", "insights", "evidence"]
      },
      'C1': {
        instruction: "Fill in the sophisticated vocabulary:",
        dialogue: [
          { character: "Student", line: `The _____ nature of ${topic} demands a multifaceted approach.`, isGap: true },
          { character: "Tutor", line: `How do you _____ the apparent contradictions?`, isGap: true },
          { character: "Student", line: "The _____ reflect broader complexities.", isGap: true },
          { character: "Tutor", line: `What theoretical _____ best illuminate this?`, isGap: true }
        ],
        answers: ["nuanced", "reconcile", "paradoxes", "frameworks"]
      }
    }

    return levelGapDialogues[studentLevel as keyof typeof levelGapDialogues] || levelGapDialogues['B1']
  }
}

export const lessonAIServerGenerator = new LessonAIServerGenerator()

