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

    console.log("🚀 Starting AI lesson generation with params:", {
      textLength: sourceText.length,
      lessonType,
      studentLevel,
      targetLanguage,
      hasMetadata: !!contentMetadata,
      hasStructuredContent: !!structuredContent
    })

    try {
      // Step 1: Analyze content context and complexity
      console.log("📊 Step 1: Analyzing content context...")
      const contentAnalysis = await this.analyzeContentContext(
        sourceText,
        contentMetadata,
        structuredContent,
        studentLevel
      )
      console.log("✅ Content analysis complete:", contentAnalysis)

      // Step 2: Create contextual summary based on lesson type and content analysis
      console.log("📝 Step 2: Creating contextual summary...")
      const contextualSummary = await this.createContextualSummary(
        sourceText,
        contentAnalysis,
        lessonType,
        studentLevel
      )
      console.log("✅ Contextual summary created, length:", contextualSummary.length)

      // Step 3: Translate if needed (for non-English target languages)
      let translatedContent = contextualSummary
      if (targetLanguage !== "english") {
        console.log("🌐 Step 3: Translating to", targetLanguage)
        translatedContent = await this.getGoogleAI().translate(contextualSummary, {
          targetLanguage: this.getLanguageCode(targetLanguage),
        })
        console.log("✅ Translation complete, length:", translatedContent.length)
      } else {
        console.log("⏭️ Step 3: Skipping translation (target is English)")
      }

      // Step 4: Generate contextual lesson structure
      console.log("🏗️ Step 4: Generating lesson structure...")
      const lessonStructure = await this.generateContextualLessonStructure(
        translatedContent,
        contentAnalysis,
        lessonType,
        studentLevel,
        targetLanguage,
        contentMetadata
      )
      console.log("✅ Lesson structure generated:", Object.keys(lessonStructure))

      // Step 5: Generate detailed content for each section with context
      console.log("🔧 Step 5: Enhancing lesson content...")
      const detailedLesson = await this.generateDetailedContextualContent(
        lessonStructure,
        translatedContent,
        contentAnalysis,
        lessonType,
        studentLevel,
        targetLanguage,
        structuredContent
      )
      console.log("✅ Detailed content generated")

      // Step 6: Proofread and polish the final lesson
      console.log("✨ Step 6: Proofreading lesson...")
      const polishedLesson = await this.proofreadLesson(detailedLesson)
      console.log("🎉 AI lesson generation complete!")

      return polishedLesson
    } catch (error) {
      console.error("❌ Error in AI lesson generation:", error)
      console.log("🔄 Falling back to enhanced template generation...")
      // Fallback to enhanced template-based generation with context
      return this.generateEnhancedFallbackLesson(params)
    }
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

    // Extract key topics using AI
    try {
      console.log("🎯 Extracting topics using AI...")
      const topicsPrompt = `Analyze this content and identify 3-5 main topics or themes. Return only the topics, one per line:

"${sourceText.substring(0, 1000)}"

Topics:`
      
      const topicsResponse = await this.getGoogleAI().prompt(topicsPrompt, {
        temperature: 0.3,
        maxTokens: 200,
      })
      
      console.log("🤖 AI topics response:", topicsResponse)
      analysis.topics = this.parseListFromText(topicsResponse).slice(0, 5)
      console.log("✅ Extracted topics:", analysis.topics)
    } catch (error) {
      console.warn("⚠️ AI topic extraction failed, using fallback:", error.message)
      // Fallback topic extraction
      analysis.topics = this.extractTopicsFromHeadings(structuredContent?.headings || [])
      console.log("🔄 Fallback topics:", analysis.topics)
    }

    // Extract key vocabulary for the target level
    try {
      console.log("📚 Extracting vocabulary using AI...")
      const vocabPrompt = `Extract 8-10 key vocabulary words from this content that would be appropriate for ${studentLevel} level language learners. Focus on useful, practical words. Return only the words, one per line:

"${sourceText.substring(0, 800)}"

Vocabulary words:`
      
      const vocabResponse = await this.getGoogleAI().prompt(vocabPrompt, {
        temperature: 0.2,
        maxTokens: 300,
      })
      
      console.log("🤖 AI vocabulary response:", vocabResponse)
      analysis.keyVocabulary = this.parseListFromText(vocabResponse).slice(0, 10)
      console.log("✅ Extracted vocabulary:", analysis.keyVocabulary)
    } catch (error) {
      console.warn("⚠️ AI vocabulary extraction failed, using fallback:", error.message)
      // Fallback vocabulary extraction
      analysis.keyVocabulary = this.extractVocabularyFromText(sourceText, studentLevel)
      console.log("🔄 Fallback vocabulary:", analysis.keyVocabulary)
    }

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
    
    const summaryPrompt = `Create a focused summary of this content for a ${lessonType} lesson at ${studentLevel} level.

Content type: ${contentAnalysis.contentType}
Main topics: ${contentAnalysis.topics.join(', ')}
Complexity: ${contentAnalysis.complexity}

Focus on aspects most relevant for ${lessonType} learning objectives.
Keep the summary appropriate for ${studentLevel} CEFR level students.
Write 4-6 sentences that capture the key information.

Content: "${sourceText.substring(0, 1500)}"

Summary:`

    try {
      console.log("🤖 Calling AI for contextual summary...")
      const summary = await this.getGoogleAI().prompt(summaryPrompt, {
        temperature: 0.4,
        maxTokens: 500,
      })
      console.log("✅ AI contextual summary created:", summary.substring(0, 100) + "...")
      return summary
    } catch (error) {
      console.warn("⚠️ AI contextual summary failed, trying basic summarization:", error.message)
      // Fallback to basic summarization
      try {
        const basicSummary = await this.getGoogleAI().summarize(sourceText, {
          type: "key-points",
          length: this.getSummaryLength(studentLevel),
          format: "plain-text",
        })
        console.log("✅ Basic AI summary created:", basicSummary.substring(0, 100) + "...")
        return basicSummary
      } catch (summaryError) {
        console.warn("⚠️ All AI summarization failed, using text truncation:", summaryError.message)
        // Final fallback to simple truncation
        return sourceText.substring(0, 800) + "..."
      }
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
    
    const prompt = `Create a highly contextual ${lessonType} lesson for ${studentLevel} level students learning ${targetLanguage}.

CONTENT CONTEXT:
- Content Type: ${contentAnalysis.contentType}
- Source: ${metadata?.domain || 'web content'}
- Main Topics: ${contentAnalysis.topics.join(', ')}
- Complexity Level: ${contentAnalysis.complexity}
- Key Vocabulary: ${contentAnalysis.keyVocabulary.slice(0, 5).join(', ')}
- Cultural Context: ${contentAnalysis.culturalContext}

LESSON CONTENT: "${content.substring(0, 1000)}"

Create a JSON structure with these sections, making each section highly relevant to the source content:

{
  "warmup": ["question 1", "question 2", "question 3"],
  "vocabulary": [
    {"word": "word1", "meaning": "definition", "example": "example sentence"},
    {"word": "word2", "meaning": "definition", "example": "example sentence"}
  ],
  "reading": "adapted reading passage",
  "comprehension": ["question 1", "question 2", "question 3", "question 4"],
  "discussion": ["question 1", "question 2", "question 3"],
  "grammar": {
    "focus": "grammar topic",
    "examples": ["example 1", "example 2"],
    "exercise": ["exercise 1", "exercise 2"]
  },
  "pronunciation": {
    "word": "challenging word",
    "ipa": "/pronunciation/",
    "practice": "practice sentence"
  },
  "wrapup": ["reflection 1", "reflection 2", "reflection 3"]
}

IMPORTANT: 
- All content must be directly related to and derived from the source material
- Vocabulary should come from the actual text, not generic word lists
- Examples should reference the specific content, not generic scenarios
- Questions should be about the actual topics discussed, not general themes

Return only valid JSON:`

    try {
      console.log("🤖 Calling AI for lesson structure...")
      const response = await this.getGoogleAI().prompt(prompt, {
        temperature: 0.7,
        maxTokens: 2000,
      })
      
      console.log("🤖 AI lesson structure response:", response.substring(0, 200) + "...")
      
      try {
        const parsed = JSON.parse(response)
        console.log("✅ Successfully parsed lesson structure JSON")
        return parsed
      } catch (parseError) {
        console.warn("⚠️ Failed to parse JSON, attempting to clean response...")
        // Try to extract JSON from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            const cleaned = JSON.parse(jsonMatch[0])
            console.log("✅ Successfully parsed cleaned JSON")
            return cleaned
          } catch (cleanError) {
            console.warn("⚠️ Failed to parse cleaned JSON, using fallback")
          }
        }
        // If JSON parsing fails, return a structured fallback
        return this.createStructuredFallback(content, lessonType, studentLevel)
      }
    } catch (error) {
      console.warn("⚠️ AI lesson structure generation failed, using fallback:", error.message)
      return this.createStructuredFallback(content, lessonType, studentLevel)
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
    const uniqueWords = [...new Set(words)].slice(0, 6)
    
    const fallback = {
      warmup: this.getTemplateWarmup(lessonType, studentLevel),
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
    
    console.log("✅ Structured fallback created")
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
    const uniqueWords = [...new Set(words)]
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

  private extractVocabularyFromText(text: string, level: string): string[] {
    // Extract words based on complexity appropriate for the level
    const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
    const uniqueWords = [...new Set(words)]
    
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

    // Use available context even in fallback
    const topics = structuredContent?.headings?.map(h => h.text).slice(0, 3) || []
    const contentType = contentMetadata?.contentType || 'general'

    return {
      lessonType,
      studentLevel,
      targetLanguage,
      sections: {
        warmup: this.getContextualWarmup(lessonType, studentLevel, topics, contentType),
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
    const baseQuestions = this.getTemplateWarmup(lessonType, studentLevel)
    
    if (topics.length > 0) {
      return [
        `What do you know about ${topics[0]?.toLowerCase()}?`,
        `Have you experienced anything related to ${topics[1]?.toLowerCase() || topics[0]?.toLowerCase()}?`,
        `What would you like to learn about this ${contentType} content?`,
      ]
    }
    
    return baseQuestions
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
}

export const lessonAIServerGenerator = new LessonAIServerGenerator()
