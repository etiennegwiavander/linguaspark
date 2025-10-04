import { createGoogleAIServerService } from "./google-ai-server"

// Types for progressive generation
export interface SharedContext {
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
      // Extract key vocabulary using AI optimization
      const keyVocabulary = await this.extractKeyVocabulary(sourceText, studentLevel)
      
      // Extract main themes
      const mainThemes = await this.extractMainThemes(sourceText, studentLevel)
      
      // Create content summary
      const contentSummary = await this.createContentSummary(sourceText, studentLevel)

      const sharedContext: SharedContext = {
        keyVocabulary,
        mainThemes,
        difficultyLevel: studentLevel,
        contentSummary,
        sourceText: sourceText.substring(0, 1000), // Limit for token optimization
        lessonType,
        targetLanguage
      }

      console.log("✅ Shared context built:", {
        vocabularyCount: keyVocabulary.length,
        themesCount: mainThemes.length,
        summaryLength: contentSummary.length
      })

      return sharedContext
    } catch (error) {
      console.error("❌ Failed to build shared context:", error)
      throw new Error("Failed to build shared context: " + error.message)
    }
  }

  /**
   * Generate a specific lesson section using shared context
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
      throw new Error(`Failed to generate ${section.name} section: ${error.message}`)
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

  private async generateWarmupWithContext(
    context: SharedContext,
    previousSections: GeneratedSection[]
  ): Promise<string[]> {
    const mainTheme = context.mainThemes[0] || 'this topic'
    
    const prompt = `Create 3 ${context.difficultyLevel} warm-up questions about ${mainTheme}. 
Context: ${context.contentSummary}
Return only questions, one per line:`

    try {
      const response = await this.getGoogleAI().prompt(prompt)
      const questions = response.split('\n')
        .map(line => line.trim())
        .filter(line => line.endsWith('?') && line.length > 10)
        .slice(0, 3)

      if (questions.length < 3) {
        throw new Error("Insufficient questions generated")
      }

      const instruction = "Have the following conversations or discussions with your tutor before reading the text:"
      return [instruction, ...questions]
    } catch (error) {
      throw new Error("Failed to generate warmup questions: " + error.message)
    }
  }

  private async generateVocabularyWithContext(
    context: SharedContext,
    previousSections: GeneratedSection[]
  ): Promise<Array<{ word: string, meaning: string, example: string }>> {
    const vocabulary = []
    
    for (const word of context.keyVocabulary.slice(0, 8)) {
      try {
        const definitionPrompt = `Define "${word}" simply for ${context.difficultyLevel} level. Context: ${context.contentSummary}. Give only the definition:`
        const meaning = await this.getGoogleAI().prompt(definitionPrompt)
        
        const examplePrompt = `Create a simple example sentence using "${word}" for ${context.difficultyLevel} level students:`
        const example = await this.getGoogleAI().prompt(examplePrompt)

        vocabulary.push({
          word: this.capitalizeWord(word),
          meaning: meaning.trim().substring(0, 150),
          example: example.trim().substring(0, 100)
        })
      } catch (error) {
        console.log(`⚠️ Failed to generate vocabulary for ${word}`)
      }
    }

    const instruction = {
      word: "INSTRUCTION",
      meaning: "Study the following words with your tutor before reading the text:",
      example: ""
    }

    return [instruction, ...vocabulary]
  }

  private async generateReadingWithContext(
    context: SharedContext,
    previousSections: GeneratedSection[]
  ): Promise<string> {
    // Use vocabulary from previous sections if available
    const vocabularySection = previousSections.find(s => s.sectionName === 'vocabulary')
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
      throw new Error("Failed to generate reading passage: " + error.message)
    }
  }

  private async generateComprehensionWithContext(
    context: SharedContext,
    previousSections: GeneratedSection[]
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
      throw new Error("Failed to generate comprehension questions: " + error.message)
    }
  }

  private async generateDiscussionWithContext(
    context: SharedContext,
    previousSections: GeneratedSection[]
  ): Promise<string[]> {
    const themes = context.mainThemes.slice(0, 2).join(' and ')
    
    const prompt = `Create 3 ${context.difficultyLevel} discussion questions about ${themes}.
Context: ${context.contentSummary}
Return only questions, one per line:`

    try {
      const response = await this.getGoogleAI().prompt(prompt)
      const questions = response.split('\n')
        .map(line => line.trim())
        .filter(line => line.endsWith('?') && line.length > 10)
        .slice(0, 3)

      if (questions.length < 3) {
        throw new Error("Insufficient discussion questions generated")
      }

      const instruction = "Discuss these questions with your tutor to explore the topic in depth:"
      return [instruction, ...questions]
    } catch (error) {
      throw new Error("Failed to generate discussion questions: " + error.message)
    }
  }

  private async generateGrammarWithContext(
    context: SharedContext,
    previousSections: GeneratedSection[]
  ): Promise<any> {
    const prompt = `Create a grammar lesson for ${context.difficultyLevel} level based on this content:
${context.contentSummary}

Return JSON with: focus (grammar point), examples (3 examples), exercise (3 practice sentences)`

    try {
      const response = await this.getGoogleAI().prompt(prompt)
      return JSON.parse(response)
    } catch (error) {
      // Fallback grammar structure
      return {
        focus: "Present Simple Tense",
        examples: [
          "I read the news every day.",
          "She works in an office.",
          "They play sports on weekends."
        ],
        exercise: [
          "Complete: He _____ (work) in London.",
          "Complete: We _____ (study) English.",
          "Complete: She _____ (like) coffee."
        ]
      }
    }
  }

  private async generatePronunciationWithContext(
    context: SharedContext,
    previousSections: GeneratedSection[]
  ): Promise<any> {
    const word = context.keyVocabulary[0] || 'communication'
    
    const prompt = `Create pronunciation practice for "${word}". 
Return JSON with: word, ipa (phonetic transcription), practice (pronunciation tip)`

    try {
      const response = await this.getGoogleAI().prompt(prompt)
      return JSON.parse(response)
    } catch (error) {
      // Fallback pronunciation structure
      return {
        word: word,
        ipa: `/kəˌmjuːnɪˈkeɪʃən/`,
        practice: `Break it down: com-mu-ni-ca-tion. Stress on the 4th syllable: ca-TION.`
      }
    }
  }

  private async generateWrapupWithContext(
    context: SharedContext,
    previousSections: GeneratedSection[]
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
      throw new Error("Failed to generate wrapup questions: " + error.message)
    }
  }

  // Fallback methods for when AI extraction fails

  private extractVocabularyFallback(sourceText: string, studentLevel: CEFRLevel): string[] {
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