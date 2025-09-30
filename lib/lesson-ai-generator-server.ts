import { createGoogleAIServerService } from "./google-ai-server"

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
}

interface GeneratedLesson {
  lessonType: string
  studentLevel: string
  targetLanguage: string
  sections: {
    warmup: string[]
    vocabulary: Array<{ word: string; meaning: string; example: string }>
    reading: string
    comprehension: string[]
    discussion: string[]
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
}

export class LessonAIServerGenerator {
  private googleAI: ReturnType<typeof createGoogleAIServerService> | null = null

  private getGoogleAI() {
    if (!this.googleAI) {
      this.googleAI = createGoogleAIServerService()
    }
    return this.googleAI
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
      readingTime
    } = params

    console.log("🚀 Starting optimized AI lesson generation with params:", {
      textLength: sourceText.length,
      lessonType,
      studentLevel,
      targetLanguage,
      hasMetadata: !!contentMetadata,
      hasStructuredContent: !!structuredContent
    })

    try {
      // Use ultra-minimal AI approach to avoid MAX_TOKENS
      console.log("🤖 Step 1: Generating lesson with ultra-minimal AI prompts...")
      const lessonStructure = await this.generateMinimalAILesson(
        sourceText,
        lessonType,
        studentLevel,
        targetLanguage,
        contentMetadata
      )
      console.log("✅ Minimal AI lesson generated:", Object.keys(lessonStructure))

      // Return properly structured GeneratedLesson object
      const finalLesson: GeneratedLesson = {
        lessonType,
        studentLevel,
        targetLanguage,
        sections: lessonStructure
      }

      console.log("🎯 Returning AI-generated lesson:", {
        lessonType: finalLesson.lessonType,
        studentLevel: finalLesson.studentLevel,
        targetLanguage: finalLesson.targetLanguage,
        sectionsCount: Object.keys(finalLesson.sections).length,
        warmupCount: finalLesson.sections.warmup?.length || 0,
        vocabularyCount: finalLesson.sections.vocabulary?.length || 0
      })

      console.log("🎉 Optimized AI lesson generation complete!")
      return finalLesson
    } catch (error) {
      console.error("❌ Error in AI lesson generation:", error)
      console.log("🔄 Falling back to smart template generation...")
      // Fallback to smart templates if AI fails
      return await this.generateSmartTemplateFallback(params)
    }
  }

  // Ultra-minimal AI lesson generation to avoid MAX_TOKENS
  private async generateMinimalAILesson(
    sourceText: string,
    lessonType: string,
    studentLevel: string,
    targetLanguage: string,
    metadata?: any
  ) {
    console.log("🎯 Using ultra-minimal AI prompts to avoid token limits...")

    // Step 1: Generate just the essential parts with minimal prompts
    const warmupQuestions = await this.generateMinimalWarmup(sourceText, studentLevel)
    const vocabulary = await this.generateMinimalVocabulary(sourceText, studentLevel)
    const comprehensionQuestions = await this.generateMinimalComprehension(sourceText, studentLevel)

    // Step 2: Use hybrid approach - AI for key parts, templates for the rest
    const vocabularyWords = vocabulary.map(v => v.word)
    const readingPassage = await this.generateSmartReading(sourceText, studentLevel, vocabularyWords)
    
    return {
      warmup: this.addWarmupInstructions(warmupQuestions, studentLevel),
      vocabulary: this.addVocabularyInstructions(vocabulary, studentLevel),
      reading: this.addReadingInstructions(readingPassage, studentLevel),
      comprehension: this.addComprehensionInstructions(comprehensionQuestions, studentLevel),
      discussion: this.addDiscussionInstructions(this.generateSmartDiscussion(this.extractBetterTopics(sourceText), lessonType, studentLevel), studentLevel),
      grammar: this.generateSmartGrammar(studentLevel, sourceText),
      pronunciation: this.generateSmartPronunciation(vocabulary.map(v => v.word)),
      wrapup: this.addWrapupInstructions(this.generateSmartWrapup(this.extractBetterTopics(sourceText), studentLevel), studentLevel)
    }
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
      const response = await this.getGoogleAI().prompt(prompt)

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

      return questions.length >= 3 ? questions : this.generateSmartWarmupQuestions(
        topics,
        studentLevel,
        {}
      )
    } catch (error) {
      console.log("⚠️ Minimal warmup failed, using template")
      return this.generateSmartWarmupQuestions(
        this.extractBetterTopics(sourceText),
        studentLevel,
        {}
      )
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
    const words = sourceText.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
    const uniqueWords = Array.from(new Set(words)).slice(0, 8) // 6-10 words, start with 8

    const vocabulary = []

    for (const word of uniqueWords) {
      try {
        const capitalizedWord = this.capitalizeWord(word)

        // Generate AI definition
        const definitionPrompt = `Define "${word}" simply for ${studentLevel} level. Context: ${sourceText.substring(0, 80)}. Give only the definition, no extra text:`
        console.log("📚 Vocab definition prompt:", definitionPrompt.length, "chars")
        const rawMeaning = await this.getGoogleAI().prompt(definitionPrompt)
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
    const shortText = sourceText.substring(0, 150) // Use only first 150 chars
    const prompt = `Write 3 ${studentLevel} reading comprehension questions about this text. Only return questions, no instructions: ${shortText}`

    try {
      console.log("❓ Minimal comprehension prompt:", prompt.length, "chars")
      const response = await this.getGoogleAI().prompt(prompt)

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
        .slice(0, 3)

      return questions.length >= 3 ? questions : this.generateSmartComprehension(
        this.extractBetterTopics(sourceText),
        studentLevel
      )
    } catch (error) {
      console.log("⚠️ Minimal comprehension failed, using template")
      return this.generateSmartComprehension(
        this.extractBetterTopics(sourceText),
        studentLevel
      )
    }
  }

  // Smart template fallback with AI-generated examples
  private async generateSmartTemplateFallback(params: LessonGenerationParams): Promise<GeneratedLesson> {
    const { sourceText, lessonType, studentLevel, targetLanguage } = params

    console.log("🎨 Using smart template fallback...")
    const topics = this.extractBetterTopics(sourceText)
    const vocabulary = this.extractVocabularyFromText(sourceText, studentLevel)

    return {
      lessonType,
      studentLevel,
      targetLanguage,
      sections: {
        warmup: this.addWarmupInstructions(this.generateSmartWarmupQuestions(topics, studentLevel, {}), studentLevel),
        vocabulary: this.addVocabularyInstructions(await this.generateSmartVocabulary(vocabulary, sourceText, studentLevel), studentLevel),
        reading: this.addReadingInstructions(await this.generateSmartReading(sourceText, studentLevel, vocabulary), studentLevel),
        comprehension: this.addComprehensionInstructions(this.generateSmartComprehension(topics, studentLevel), studentLevel),
        discussion: this.addDiscussionInstructions(this.generateSmartDiscussion(topics, lessonType, studentLevel), studentLevel),
        grammar: this.generateSmartGrammar(studentLevel, sourceText),
        pronunciation: this.generateSmartPronunciation(vocabulary),
        wrapup: this.addWrapupInstructions(this.generateSmartWrapup(topics, studentLevel), studentLevel)
      }
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
      const summary = await this.getGoogleAI().prompt(summaryPrompt, {
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

      const response = await this.getGoogleAI().prompt(warmupPrompt, {
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
      const response = await this.getGoogleAI().prompt(prompt, {
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
          const enhancedExample = await this.getGoogleAI().write(contextualExamplePrompt, {
            tone: "casual",
            length: "short"
          })
          sections.vocabulary[i].example = enhancedExample

          // Add contextual meaning based on source content
          const contextualMeaningPrompt = `
Explain the meaning of "${vocab.word}" in the context of: ${contentAnalysis.topics[0] || contentAnalysis.contentType}
Keep it simple for ${studentLevel} level students.
`
          const contextualMeaning = await this.getGoogleAI().write(contextualMeaningPrompt, {
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
        const enhancedDiscussion = await this.getGoogleAI().write(enhancedDiscussionPrompt, {
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
        const enhancedReading = await this.getGoogleAI().rewrite(sections.reading, {
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
        const contextualGrammarExamples = await this.getGoogleAI().write(grammarExamplesPrompt, {
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
        const proofread = await this.getGoogleAI().proofread(value, {
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

  private extractVocabularyFromText(text: string, level: string): string[] {
    // Extract words based on complexity appropriate for the level
    const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
    const uniqueWords = Array.from(new Set(words))

    // Filter by complexity based on level
    const complexityThreshold = {
      'A1': 6,
      'A2': 7,
      'B1': 8,
      'B2': 10,
      'C1': 12
    }

    const maxLength = complexityThreshold[level] || 8
    return uniqueWords
      .filter(word => word.length <= maxLength && word.length >= 4)
      .slice(0, 8)
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

  // Smart template-based lesson generation
  private async generateSmartTemplateLesson(
    sourceText: string,
    contentAnalysis: any,
    lessonType: string,
    studentLevel: string,
    targetLanguage: string,
    metadata?: any
  ) {
    console.log("🎨 Generating smart template lesson...")

    const topics = contentAnalysis.topics
    const vocabulary = contentAnalysis.keyVocabulary
    const title = metadata?.title || 'Content'

    return {
      warmup: this.generateSmartWarmupQuestions(topics, studentLevel, contentAnalysis),
      vocabulary: await this.generateSmartVocabulary(vocabulary, sourceText, studentLevel),
      reading: await this.generateSmartReading(sourceText, studentLevel, vocabulary),
      comprehension: this.generateSmartComprehension(topics, studentLevel),
      discussion: this.generateSmartDiscussion(topics, lessonType, studentLevel),
      grammar: this.generateSmartGrammar(studentLevel, sourceText),
      pronunciation: this.generateSmartPronunciation(vocabulary),
      wrapup: this.generateSmartWrapup(topics, studentLevel)
    }
  }

  // Smart warm-up questions based on content (prior knowledge activation)
  private generateSmartWarmupQuestions(topics: string[], studentLevel: string, contentAnalysis: any): string[] {
    const topic = topics[0] || 'this topic'
    const secondTopic = topics[1] || 'technology'

    // Focus on activating prior knowledge, not assuming content knowledge
    const levelQuestions = {
      'A1': [
        `Do you know about ${topic.toLowerCase()}?`,
        `Is ${topic.toLowerCase()} popular in your country?`,
        `Do you like ${topic.toLowerCase()}?`
      ],
      'A2': [
        `Have you heard about ${topic.toLowerCase()} before?`,
        `What do you already know about ${topic.toLowerCase()}?`,
        `Is ${topic.toLowerCase()} common in your country?`
      ],
      'B1': [
        `What comes to mind when you hear about ${topic.toLowerCase()}?`,
        `Have you had any experience with ${topic.toLowerCase()}?`,
        `What would you like to know about ${topic.toLowerCase()}?`
      ],
      'B2': [
        `What is your general opinion about ${topic.toLowerCase()}?`,
        `How familiar are you with ${topic.toLowerCase()}?`,
        `What role does ${topic.toLowerCase()} play in your daily life?`
      ],
      'C1': [
        `How would you describe the significance of ${topic.toLowerCase()} in modern society?`,
        `What are your thoughts on the current state of ${topic.toLowerCase()}?`,
        `How do you think ${topic.toLowerCase()} has evolved over time?`
      ]
    }

    return levelQuestions[studentLevel] || levelQuestions['B1']
  }

  // Enhanced smart vocabulary with AI-generated contextual examples
  private async generateSmartVocabulary(vocabulary: string[], sourceText: string, studentLevel: string) {
    const selectedWords = vocabulary.slice(0, 8) // Start with 8 words
    const vocabPromises = selectedWords.map(async (word) => {
      const capitalizedWord = this.capitalizeWord(word)

      return {
        word: capitalizedWord,
        meaning: this.generateContextualWordMeaning(word, studentLevel, sourceText),
        example: await this.generateAIExampleSentences(word, studentLevel, sourceText)
      }
    })

    const results = await Promise.all(vocabPromises)
    // Ensure we have 6-10 words
    return results.slice(0, 10).length >= 6 ? results.slice(0, 10) : results.slice(0, 6)
  }

  // Capitalize word properly
  private capitalizeWord(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  }

  // Generate contextual word meanings based on level and source text
  private generateContextualWordMeaning(word: string, level: string, sourceText: string): string {
    const lowerWord = word.toLowerCase()

    // Enhanced contextual definitions based on level
    const contextualMeanings = {
      'efficient': {
        'A1': 'working well without wasting time',
        'A2': 'doing something well and quickly without wasting time or energy',
        'B1': 'working in a way that achieves the best results with the least waste of time and effort',
        'B2': 'achieving maximum productivity with minimum wasted effort or expense',
        'C1': 'achieving maximum productivity with minimum wasted effort, expense, or unnecessary activity'
      },
      'technology': {
        'A1': 'computers and machines that help us',
        'A2': 'machines and computer systems that make life easier',
        'B1': 'the use of scientific knowledge to create useful tools and machines',
        'B2': 'the application of scientific knowledge for practical purposes in industry and daily life',
        'C1': 'the systematic application of scientific knowledge to develop practical solutions and innovations'
      },
      'europe': {
        'A1': 'a big area with many countries',
        'A2': 'a continent with many different countries like France, Germany, and Italy',
        'B1': 'a continent consisting of many countries, known for its history and culture',
        'B2': 'a continent comprising numerous nations with diverse cultures, languages, and political systems',
        'C1': 'a geopolitical and cultural continent characterized by diverse nation-states, shared historical heritage, and economic integration'
      },
      'sensational': {
        'A1': 'very exciting and good',
        'A2': 'extremely exciting or impressive, causing strong feelings',
        'B1': 'causing great excitement, interest, or shock; extremely impressive',
        'B2': 'causing intense excitement, interest, or shock; extraordinarily impressive or remarkable',
        'C1': 'causing or designed to cause intense excitement, interest, or shock through dramatic or extraordinary qualities'
      },
      'stages': {
        'A1': 'does or makes something happen',
        'A2': 'organizes and presents an event or performance',
        'B1': 'organizes and presents an event, or refers to different parts of a process',
        'B2': 'organizes and presents an event or performance, or represents distinct phases in a process',
        'C1': 'orchestrates and presents an event or performance, or denotes sequential phases in a complex process'
      },
      'comeback': {
        'A1': 'winning after losing',
        'A2': 'returning to win after being behind in a game or competition',
        'B1': 'a return to a winning position after being behind, or a return to success',
        'B2': 'a recovery from a disadvantageous position to achieve success or victory',
        'C1': 'a strategic recovery from a disadvantageous position to achieve success, often against expectations'
      },
      'dramatic': {
        'A1': 'very exciting and surprising',
        'A2': 'very exciting, with sudden changes that surprise people',
        'B1': 'involving sudden changes or strong emotions; very noticeable or impressive',
        'B2': 'characterized by sudden, striking changes or intense emotions; highly impressive or theatrical',
        'C1': 'marked by sudden, striking developments or intense emotional impact; theatrically impressive or emotionally powerful'
      }
    }

    const levelMeanings = contextualMeanings[lowerWord]
    if (levelMeanings && levelMeanings[level]) {
      return levelMeanings[level]
    }

    // Fallback to basic level-appropriate definition
    const isSimpleLevel = level === 'A1' || level === 'A2'
    return isSimpleLevel ?
      `a word that means ${lowerWord}` :
      `a term referring to ${lowerWord} in this context`
  }

  // Generate AI-powered contextual example sentences
  private async generateAIExampleSentences(word: string, level: string, sourceText: string): Promise<string> {
    const exampleCount = this.getExampleCount(level)
    const context = sourceText.substring(0, 120) // More context for relevance

    try {
      const levelGuidance = this.getLevelGuidance(level)
      const prompt = `Create ${exampleCount} contextual ${level} level sentences using "${word}" related to: ${context}. Make sentences meaningful and relevant to the topic. ${levelGuidance} Format: one sentence per line, no quotes:`
      console.log("📝 Contextual example sentences prompt:", prompt.length, "chars")

      const response = await this.getGoogleAI().prompt(prompt)

      // Parse and clean AI response
      const sentences = response.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 5 && line.toLowerCase().includes(word.toLowerCase()))
        .map(line => this.cleanSentence(line))
        .map(line => this.boldifyTargetWord(line, word))
        .filter(line => line.length > 0)
        .slice(0, exampleCount)

      // If AI generated enough contextual sentences, use them
      if (sentences.length >= exampleCount) {
        return sentences.join(' | ')
      }

      // Otherwise, supplement with contextual template sentences
      const additionalNeeded = exampleCount - sentences.length
      const templateSentences = this.generateContextualExamples(word, level, sourceText, additionalNeeded)

      return [...sentences, ...templateSentences].slice(0, exampleCount).join(' | ')

    } catch (error) {
      console.log(`⚠️ AI example generation failed for ${word}, using contextual templates`)
      // Fallback to contextual template examples
      return this.generateContextualExamples(word, level, sourceText, exampleCount).join(' | ')
    }
  }

  // Get level-specific guidance for AI prompts
  private getLevelGuidance(level: string): string {
    const guidance = {
      'A1': 'Use very simple words, short sentences (5-8 words), present tense.',
      'A2': 'Use simple words, short sentences (6-10 words), basic grammar.',
      'B1': 'Use common words, medium sentences (8-12 words), clear meaning.',
      'B2': 'Use varied vocabulary, longer sentences (10-15 words), complex ideas.',
      'C1': 'Use sophisticated vocabulary, complex sentences (12+ words), nuanced meaning.'
    }
    return guidance[level] || guidance['B1']
  }

  // Clean sentence formatting
  private cleanSentence(sentence: string): string {
    return sentence
      .replace(/^\d+\.?\s*/, '') // Remove numbering
      .replace(/^-\s*/, '') // Remove dashes
      .replace(/^\*\s*/, '') // Remove asterisks
      .replace(/^•\s*/, '') // Remove bullet points
      .trim()
  }

  // Clean definition formatting
  private cleanDefinition(definition: string, level: string): string {
    return definition
      .replace(/^For an? [A-Z]\d+ student,?\s*/i, '') // Remove level prefixes
      .replace(/^In this context,?\s*/i, '') // Remove context prefixes
      .replace(/^Here's? (a )?definition.*?:\s*/i, '') // Remove definition intros
      .replace(/^\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .trim()
  }

  // Make target word bold in sentence
  private boldifyTargetWord(sentence: string, targetWord: string): string {
    const regex = new RegExp(`\\b${targetWord}\\b`, 'gi')
    return sentence.replace(regex, `**${targetWord}**`)
  }

  // Generate contextual examples based on source material
  private generateContextualExamples(word: string, level: string, sourceText: string, count: number): string[] {
    const lowerWord = word.toLowerCase()
    const capitalizedWord = this.capitalizeWord(word)

    // Extract themes from source text for context
    const themes = this.extractThemesFromText(sourceText)
    const mainTheme = themes[0] || 'this topic'

    const contextualExamples = {
      'A1': [
        `**${capitalizedWord}** is in the news today.`,
        `I read about **${lowerWord}** online.`,
        `**${capitalizedWord}** is important for ${mainTheme}.`,
        `People talk about **${lowerWord}**.`,
        `**${capitalizedWord}** helps with ${mainTheme}.`
      ],
      'A2': [
        `**${capitalizedWord}** plays a big role in ${mainTheme}.`,
        `Many people are interested in **${lowerWord}**.`,
        `**${capitalizedWord}** affects how we think about ${mainTheme}.`,
        `The news often mentions **${lowerWord}**.`,
        `**${capitalizedWord}** is becoming more important in ${mainTheme}.`
      ],
      'B1': [
        `**${capitalizedWord}** has changed the way we approach ${mainTheme}.`,
        `Understanding **${lowerWord}** is crucial for ${mainTheme}.`,
        `**${capitalizedWord}** continues to influence ${mainTheme}.`,
        `The role of **${lowerWord}** in ${mainTheme} is growing.`
      ],
      'B2': [
        `**${capitalizedWord}** represents a significant development in ${mainTheme}.`,
        `The implications of **${lowerWord}** for ${mainTheme} are far-reaching.`,
        `**${capitalizedWord}** has transformed our understanding of ${mainTheme}.`
      ],
      'C1': [
        `**${capitalizedWord}** exemplifies the complex dynamics within ${mainTheme}.`,
        `The multifaceted nature of **${lowerWord}** requires nuanced analysis in ${mainTheme}.`,
        `**${capitalizedWord}** represents a paradigmatic shift in contemporary ${mainTheme}.`
      ]
    }

    const levelExamples = contextualExamples[level] || contextualExamples['B1']
    return levelExamples.slice(0, count)
  }

  // Extract themes from source text for contextual examples
  private extractThemesFromText(text: string): string[] {
    const themes = []

    // Common themes based on keywords
    const themeKeywords = {
      'sports': ['team', 'game', 'win', 'play', 'match', 'competition', 'tournament', 'cup'],
      'technology': ['AI', 'computer', 'digital', 'software', 'system', 'device', 'artificial', 'intelligence'],
      'environment': ['climate', 'nature', 'earth', 'green', 'pollution', 'energy', 'change'],
      'health': ['medical', 'doctor', 'treatment', 'patient', 'medicine', 'care', 'healthcare'],
      'business': ['company', 'market', 'economy', 'finance', 'industry', 'trade'],
      'education': ['student', 'learn', 'school', 'knowledge', 'study', 'teach']
    }

    const lowerText = text.toLowerCase()

    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      const matchCount = keywords.filter(keyword => lowerText.includes(keyword)).length
      if (matchCount >= 2) {
        themes.push(theme)
      }
    }

    return themes.length > 0 ? themes : ['this topic']
  }

  // Generate truly level-appropriate example sentences
  private generateLevelAppropriateExamples(word: string, level: string, count: number): string[] {
    const lowerWord = word.toLowerCase()
    const capitalizedWord = this.capitalizeWord(word)

    const examples = {
      'A1': [
        `${capitalizedWord} is good.`,
        `I like ${lowerWord}.`,
        `This is ${lowerWord}.`,
        `${capitalizedWord} helps us.`,
        `We see ${lowerWord}.`
      ],
      'A2': [
        `${capitalizedWord} is very important.`,
        `I think ${lowerWord} is interesting.`,
        `Many people know about ${lowerWord}.`,
        `${capitalizedWord} is useful for us.`,
        `We can learn about ${lowerWord}.`
      ],
      'B1': [
        `${capitalizedWord} plays an important role today.`,
        `People are interested in ${lowerWord}.`,
        `${capitalizedWord} affects our daily lives.`,
        `We should understand ${lowerWord} better.`
      ],
      'B2': [
        `${capitalizedWord} has significant implications for society.`,
        `The impact of ${lowerWord} continues to grow.`,
        `Understanding ${lowerWord} requires careful consideration.`
      ],
      'C1': [
        `${capitalizedWord} exemplifies contemporary challenges.`,
        `The complexity of ${lowerWord} demands sophisticated analysis.`,
        `${capitalizedWord} represents a paradigm shift in thinking.`
      ]
    }

    const levelExamples = examples[level] || examples['B1']
    return levelExamples.slice(0, count)
  }

  // Fallback template-based example generation
  private generateTemplateExamples(word: string, level: string, sourceText: string): string {
    const exampleCount = this.getExampleCount(level)

    // Try to find the word in the source text first
    const sentences = sourceText.split(/[.!?]+/).filter(s => s.trim().length > 10)
    const contextSentence = sentences.find(s => s.toLowerCase().includes(word.toLowerCase()))

    const examples = []

    // Add context sentence if found
    if (contextSentence) {
      examples.push(contextSentence.trim())
    }

    // Generate additional level-appropriate examples
    const additionalExamples = this.generateAdditionalExamples(word, level, exampleCount - examples.length)
    examples.push(...additionalExamples)

    // Ensure we have the right number of examples
    return examples.slice(0, exampleCount).join(' | ')
  }

  // Get number of examples based on CEFR level
  private getExampleCount(level: string): number {
    switch (level) {
      case 'A1':
      case 'A2':
        return 5
      case 'B1':
        return 4
      case 'B2':
      case 'C1':
        return 3
      default:
        return 4
    }
  }

  // Generate additional level-appropriate example sentences
  private generateAdditionalExamples(word: string, level: string, count: number): string[] {
    const lowerWord = word.toLowerCase()
    const capitalizedWord = this.capitalizeWord(word)

    const exampleTemplates = {
      'A1': [
        `${capitalizedWord} is important.`,
        `I like ${lowerWord}.`,
        `This is ${lowerWord}.`,
        `${capitalizedWord} is good.`,
        `We use ${lowerWord}.`
      ],
      'A2': [
        `${capitalizedWord} is very important in our daily life.`,
        `I think ${lowerWord} is interesting.`,
        `Many people use ${lowerWord} today.`,
        `${capitalizedWord} helps us a lot.`,
        `We can learn about ${lowerWord}.`
      ],
      'B1': [
        `${capitalizedWord} plays an important role in modern society.`,
        `The concept of ${lowerWord} has evolved significantly.`,
        `Understanding ${lowerWord} is essential for students.`,
        `${capitalizedWord} continues to influence our daily lives.`
      ],
      'B2': [
        `${capitalizedWord} represents a significant development in this field.`,
        `The implications of ${lowerWord} extend beyond immediate applications.`,
        `Experts consider ${lowerWord} to be a crucial factor in future progress.`
      ],
      'C1': [
        `${capitalizedWord} exemplifies the complex interplay between innovation and practical application.`,
        `The multifaceted nature of ${lowerWord} requires comprehensive analysis.`,
        `Contemporary discourse surrounding ${lowerWord} reflects broader societal transformations.`
      ]
    }

    const templates = exampleTemplates[level] || exampleTemplates['B1']
    return templates.slice(0, count)
  }

  // Enhanced reading passage adaptation with AI rewriting and vocabulary bolding
  private async generateSmartReading(sourceText: string, studentLevel: string, vocabularyWords: string[] = []): Promise<string> {
    const maxLength = {
      'A1': 150,
      'A2': 250,
      'B1': 350,
      'B2': 450,
      'C1': 550
    }

    const targetLength = maxLength[studentLevel] || 350

    try {
      // Use AI to rewrite text for appropriate level
      const rewrittenText = await this.rewriteForLevel(sourceText, studentLevel, targetLength)
      // Bold vocabulary words in the reading passage
      return this.boldVocabularyInText(rewrittenText, vocabularyWords)
    } catch (error) {
      console.log(`⚠️ AI rewriting failed for reading passage, using template adaptation`)
      // Fallback to template-based adaptation
      const adaptedText = this.adaptReadingTemplate(sourceText, studentLevel, targetLength)
      return this.boldVocabularyInText(adaptedText, vocabularyWords)
    }
  }

  // AI-powered text rewriting for CEFR levels
  private async rewriteForLevel(sourceText: string, studentLevel: string, targetLength: number): Promise<string> {
    const levelGuidance = this.getReadingLevelGuidance(studentLevel)
    const shortText = sourceText.substring(0, targetLength + 100) // Give AI more context to work with
    
    const prompt = `Rewrite this text for ${studentLevel} level students. ${levelGuidance} Keep the main ideas but adapt the language. Target length: ${targetLength} characters. Text: ${shortText}`
    
    console.log("📖 Reading rewrite prompt:", prompt.length, "chars")
    
    const rewrittenText = await this.getGoogleAI().prompt(prompt)
    
    // Clean and limit the rewritten text
    return rewrittenText.trim().substring(0, targetLength)
  }

  // Get level-specific guidance for reading adaptation
  private getReadingLevelGuidance(level: string): string {
    const guidance = {
      'A1': 'Use very simple words, short sentences (5-8 words), present tense only, basic vocabulary.',
      'A2': 'Use simple words, short sentences (6-10 words), simple past and present, common vocabulary.',
      'B1': 'Use clear language, medium sentences (8-12 words), various tenses, intermediate vocabulary.',
      'B2': 'Use varied vocabulary, longer sentences (10-15 words), complex grammar, advanced concepts.',
      'C1': 'Use sophisticated language, complex sentences (12+ words), advanced grammar, nuanced ideas.'
    }
    return guidance[level] || guidance['B1']
  }

  // Template-based reading adaptation (fallback)
  private adaptReadingTemplate(sourceText: string, studentLevel: string, targetLength: number): string {
    const sentences = sourceText.split(/[.!?]+/).filter(s => s.trim().length > 10)
    
    if (studentLevel === 'A1' || studentLevel === 'A2') {
      // Simplify for lower levels
      const simplifiedSentences = sentences
        .map(s => this.simplifysentence(s.trim(), studentLevel))
        .filter(s => s.length > 0)
        .slice(0, 6) // Limit number of sentences for A1/A2
      
      return simplifiedSentences.join('. ').substring(0, targetLength)
    } else {
      // For B1+ levels, use original text with length control
      return sentences.join('. ').substring(0, targetLength)
    }
  }

  // Simplify individual sentences for lower levels
  private simplifysentence(sentence: string, level: string): string {
    if (level === 'A1') {
      // Very basic simplification for A1
      return sentence
        .replace(/\b(however|nevertheless|furthermore|moreover)\b/gi, 'but')
        .replace(/\b(approximately|approximately)\b/gi, 'about')
        .replace(/\b(significant|substantial)\b/gi, 'big')
        .replace(/\b(demonstrate|illustrate)\b/gi, 'show')
    } else if (level === 'A2') {
      // Moderate simplification for A2
      return sentence
        .replace(/\b(nevertheless|furthermore)\b/gi, 'however')
        .replace(/\b(approximately)\b/gi, 'about')
        .replace(/\b(substantial)\b/gi, 'significant')
    }
    
    return sentence
  }

  // Bold vocabulary words in reading passage for visual landmarks
  private boldVocabularyInText(text: string, vocabularyWords: string[]): string {
    if (!vocabularyWords || vocabularyWords.length === 0) {
      return text
    }

    let boldedText = text
    
    // Sort vocabulary words by length (longest first) to avoid partial matches
    const sortedWords = vocabularyWords
      .filter(word => word && word !== 'INSTRUCTION') // Filter out instruction marker
      .sort((a, b) => b.length - a.length)
    
    for (const word of sortedWords) {
      // Create regex to match whole words only (case insensitive)
      const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      
      // Replace with bold markdown, but avoid double-bolding
      boldedText = boldedText.replace(regex, (match) => {
        // Check if already bolded
        if (boldedText.includes(`**${match}**`)) {
          return match
        }
        return `**${match}**`
      })
    }
    
    return boldedText
  }

  // Smart comprehension questions
  private generateSmartComprehension(topics: string[], studentLevel: string): string[] {
    const topic = topics[0] || 'the content'

    const levelQuestions = {
      'A1': [
        `What is ${topic.toLowerCase()}?`,
        "What is the main idea?",
        "Is this information new to you?"
      ],
      'A2': [
        `What does the text say about ${topic.toLowerCase()}?`,
        "What are the main points?",
        "Do you agree with the information?"
      ],
      'B1': [
        `How does the text explain ${topic.toLowerCase()}?`,
        "What supporting details are provided?",
        "What conclusions can you draw?",
        "How does this relate to your experience?"
      ],
      'B2': [
        `What is the author's perspective on ${topic.toLowerCase()}?`,
        "What evidence supports the main arguments?",
        "What are the implications of this information?",
        "How might this affect different groups of people?"
      ],
      'C1': [
        `How does the author's treatment of ${topic.toLowerCase()} reflect broader themes?`,
        "What underlying assumptions can you identify?",
        "How might this information be interpreted differently in various contexts?",
        "What are the potential long-term consequences discussed?"
      ]
    }

    return levelQuestions[studentLevel] || levelQuestions['B1']
  }

  // Smart discussion questions
  private generateSmartDiscussion(topics: string[], lessonType: string, studentLevel: string): string[] {
    const topic = topics[0] || 'this topic'
    const secondTopic = topics[1] || 'technology'

    const levelQuestions = {
      'A1': [
        `Do you like ${topic.toLowerCase()}? Why?`,
        `Is ${topic.toLowerCase()} good or bad?`,
        `Would you recommend ${topic.toLowerCase()} to friends?`
      ],
      'A2': [
        `What is your opinion about ${topic.toLowerCase()}?`,
        `How do you use ${topic.toLowerCase()} in your life?`,
        `What problems can ${topic.toLowerCase()} cause?`
      ],
      'B1': [
        `What are the advantages and disadvantages of ${topic.toLowerCase()}?`,
        `How has ${topic.toLowerCase()} changed over time?`,
        `What would happen if ${topic.toLowerCase()} didn't exist?`
      ],
      'B2': [
        `How might ${topic.toLowerCase()} impact society in the next decade?`,
        `What ethical considerations surround ${topic.toLowerCase()}?`,
        `How does ${topic.toLowerCase()} differ across cultures?`
      ],
      'C1': [
        `What are the broader societal implications of ${topic.toLowerCase()}?`,
        `How might ${topic.toLowerCase()} reshape our understanding of ${secondTopic.toLowerCase()}?`,
        `What role should regulation play in ${topic.toLowerCase()}?`
      ]
    }

    return levelQuestions[studentLevel] || levelQuestions['B1']
  }

  // Smart grammar focus
  private generateSmartGrammar(studentLevel: string, sourceText: string) {
    const grammarFocus = {
      'A1': {
        focus: 'Present Simple',
        examples: ['It is efficient.', 'This works well.', 'People use technology.'],
        exercise: ['It _____ (be) very useful.', 'Technology _____ (help) people.', 'This _____ (work) on phones.']
      },
      'A2': {
        focus: 'Present Continuous and Simple',
        examples: ['It is working on your device.', 'People are using this technology.', 'It helps with privacy.'],
        exercise: ['It _____ (work) right now.', 'People _____ (use) it every day.', 'This _____ (help) with security.']
      },
      'B1': {
        focus: 'Present Perfect',
        examples: ['Technology has improved significantly.', 'It has become more efficient.', 'Users have experienced better privacy.'],
        exercise: ['Technology _____ (improve) a lot.', 'It _____ (become) very popular.', 'People _____ (start) using it more.']
      },
      'B2': {
        focus: 'Passive Voice',
        examples: ['It is designed for mobile devices.', 'Privacy is enhanced by this technology.', 'Data is processed locally.'],
        exercise: ['It _____ (design) for phones.', 'Privacy _____ (improve) significantly.', 'Information _____ (process) safely.']
      },
      'C1': {
        focus: 'Complex Sentence Structures',
        examples: ['Having been designed for efficiency, it operates seamlessly.', 'The technology, which prioritizes privacy, has gained popularity.'],
        exercise: ['_____ (design) for mobile use, it works offline.', 'The system, _____ (focus) on privacy, appeals to users.']
      }
    }

    return grammarFocus[studentLevel] || grammarFocus['B1']
  }

  // Smart pronunciation
  private generateSmartPronunciation(vocabulary: string[]) {
    const word = vocabulary.find(w => w.length > 6) || vocabulary[0] || 'technology'

    const pronunciations = {
      'technology': '/tekˈnɒlədʒi/',
      'efficient': '/ɪˈfɪʃənt/',
      'privacy': '/ˈpraɪvəsi/',
      'processing': '/ˈprəʊsesɪŋ/',
      'device': '/dɪˈvaɪs/',
      'artificial': '/ˌɑːtɪˈfɪʃəl/',
      'intelligence': '/ɪnˈtelɪdʒəns/',
      'compact': '/kəmˈpækt/',
      'version': '/ˈvɜːʃən/',
      'family': '/ˈfæməli/',
      'nano': '/ˈnænoʊ/',
      'gemini': '/ˈdʒemɪnaɪ/'
    }

    return {
      word: word,
      ipa: pronunciations[word.toLowerCase()] || `/ˈwɜːrd/`,
      practice: `Practice saying "${word}" in this sentence: This ${word} is very useful.`
    }
  }

  // Smart wrap-up questions
  private generateSmartWrapup(topics: string[], studentLevel: string): string[] {
    const topic = topics[0] || 'this topic'

    return [
      `What new vocabulary did you learn about ${topic.toLowerCase()}?`,
      `Which concepts about ${topic.toLowerCase()} need more practice?`,
      "How will you use this knowledge in real situations?",
      "What questions do you still have about this content?"
    ]
  }

  // Helper method to determine source country from domain
  private determineSourceCountry(domain: string): string {
    const countryMap = {
      'bbc.com': 'United Kingdom',
      'bbc.co.uk': 'United Kingdom',
      'cnn.com': 'United States',
      'nytimes.com': 'United States',
      'theguardian.com': 'United Kingdom',
      'washingtonpost.com': 'United States',
      'reuters.com': 'International',
      'ap.org': 'United States',
      'npr.org': 'United States',
      'abc.net.au': 'Australia',
      'cbc.ca': 'Canada',
    }

    for (const [domainKey, country] of Object.entries(countryMap)) {
      if (domain.includes(domainKey)) {
        return country
      }
    }

    return 'International'
  }

  // Fallback warm-up question generator
  private getFallbackWarmupQuestion(level: string, contentAnalysis: any, questionIndex: number): string {
    const topic = contentAnalysis.topics[0] || 'this topic'
    const contentType = contentAnalysis.contentType

    const fallbackQuestions = {
      'A1': [
        `Do you know about ${topic.toLowerCase()}?`,
        `Is ${topic.toLowerCase()} important in your country?`,
        `Do you like to read about ${topic.toLowerCase()}?`
      ],
      'A2': [
        `Have you heard about ${topic.toLowerCase()} before?`,
        `What do you know about ${topic.toLowerCase()}?`,
        `Is ${topic.toLowerCase()} different in your country?`
      ],
      'B1': [
        `What do you think about ${topic.toLowerCase()}?`,
        `How is ${topic.toLowerCase()} important in your daily life?`,
        `What would you like to know about ${topic.toLowerCase()}?`
      ],
      'B2': [
        `What are your thoughts on ${topic.toLowerCase()}?`,
        `How might ${topic.toLowerCase()} affect people in different countries?`,
        `What questions would you ask about ${topic.toLowerCase()}?`
      ],
      'C1': [
        `How do cultural perspectives influence attitudes toward ${topic.toLowerCase()}?`,
        `What are the broader implications of ${topic.toLowerCase()} in modern society?`,
        `How might ${topic.toLowerCase()} evolve in the coming years?`
      ]
    }

    const levelQuestions = fallbackQuestions[level] || fallbackQuestions['B1']
    return levelQuestions[questionIndex] || levelQuestions[0]
  }

  // Contextual warm-up fallback when AI fails
  private getContextualWarmupFallback(level: string, contentAnalysis: any, metadata?: any): string[] {
    const topic = contentAnalysis.topics[0] || 'this topic'
    const sourceCountry = contentAnalysis.sourceCountry || 'this country'
    const title = metadata?.title || 'this content'

    const fallbackSets = {
      'A1': [
        `Do you know about ${topic.toLowerCase()}?`,
        `Is this topic common in your country?`,
        `Do you want to learn about ${topic.toLowerCase()}?`
      ],
      'A2': [
        `Have you experienced ${topic.toLowerCase()} before?`,
        `What is ${topic.toLowerCase()} like in your country?`,
        `Why is ${topic.toLowerCase()} interesting to you?`
      ],
      'B1': [
        `What do you think about ${topic.toLowerCase()}?`,
        `How is ${topic.toLowerCase()} different in your country compared to ${sourceCountry}?`,
        `What would you expect to learn from this ${contentAnalysis.contentType}?`
      ],
      'B2': [
        `What are your thoughts on how ${topic.toLowerCase()} is presented in ${sourceCountry} media?`,
        `What challenges do you think people face with ${topic.toLowerCase()}?`,
        `How might your perspective on ${topic.toLowerCase()} differ from the author's?`
      ],
      'C1': [
        `How do cultural attitudes toward ${topic.toLowerCase()} vary between ${sourceCountry} and your country?`,
        `What are the broader societal implications of ${topic.toLowerCase()}?`,
        `How might the perspective in this ${contentAnalysis.contentType} reflect ${sourceCountry} values?`
      ]
    }

    return fallbackSets[level] || fallbackSets['B1']
  }
}

export const lessonAIServerGenerator = new LessonAIServerGenerator()
