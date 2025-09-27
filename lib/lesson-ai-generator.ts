import { createGoogleAIService } from "./google-ai"

interface LessonGenerationParams {
  sourceText: string
  lessonType: string
  studentLevel: string
  targetLanguage: string
  sourceUrl?: string
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

export class LessonAIGenerator {
  private googleAI = createGoogleAIService()

  async generateLesson(params: LessonGenerationParams): Promise<GeneratedLesson> {
    const { sourceText, lessonType, studentLevel, targetLanguage, sourceUrl } = params

    try {
      // Step 1: Summarize the source text
      const summary = await this.googleAI.summarize(sourceText, {
        type: "key-points",
        length: this.getSummaryLength(studentLevel),
        format: "plain-text",
      })

      // Step 2: Translate if needed (for non-English target languages)
      let translatedContent = summary
      if (targetLanguage !== "english") {
        translatedContent = await this.googleAI.translate(summary, {
          targetLanguage: this.getLanguageCode(targetLanguage),
        })
      }

      // Step 3: Generate lesson structure using Prompt API
      const lessonStructure = await this.generateLessonStructure(
        translatedContent,
        lessonType,
        studentLevel,
        targetLanguage,
      )

      // Step 4: Generate detailed content for each section
      const detailedLesson = await this.generateDetailedContent(
        lessonStructure,
        translatedContent,
        lessonType,
        studentLevel,
        targetLanguage,
      )

      // Step 5: Proofread and polish the final lesson
      const polishedLesson = await this.proofreadLesson(detailedLesson)

      return polishedLesson
    } catch (error) {
      console.error("Error in AI lesson generation:", error)
      // Fallback to template-based generation
      return this.generateFallbackLesson(params)
    }
  }

  private async generateLessonStructure(
    content: string,
    lessonType: string,
    studentLevel: string,
    targetLanguage: string,
  ) {
    const prompt = `
Create a structured ${lessonType} lesson for ${studentLevel} level students learning ${targetLanguage}.
Base the lesson on this content: "${content}"

Generate a JSON structure with these sections:
- warmup: 3 engaging warm-up questions
- vocabulary: 5-8 key vocabulary words with meanings and examples
- reading: A simplified version of the content appropriate for ${studentLevel} level
- comprehension: 4-5 reading comprehension questions
- discussion: 3-4 discussion questions that encourage conversation
- grammar: Grammar focus with examples and exercises
- pronunciation: One challenging word with IPA and practice sentence
- wrapup: 3 reflection questions

Ensure the content is appropriate for ${studentLevel} CEFR level and focuses on ${lessonType} learning objectives.
Return only valid JSON.
`

    const response = await this.googleAI.prompt(prompt, {
      temperature: 0.7,
      maxTokens: 2000,
    })

    try {
      return JSON.parse(response)
    } catch {
      // If JSON parsing fails, return a structured fallback
      return this.createStructuredFallback(content, lessonType, studentLevel)
    }
  }

  private async generateDetailedContent(
    structure: any,
    content: string,
    lessonType: string,
    studentLevel: string,
    targetLanguage: string,
  ) {
    // Use Writer API to expand each section with more detailed content
    const sections = { ...structure }

    // Enhance vocabulary section
    if (sections.vocabulary) {
      for (let i = 0; i < sections.vocabulary.length; i++) {
        const vocab = sections.vocabulary[i]
        const enhancedExample = await this.googleAI.write(
          `Create a natural example sentence using the word "${vocab.word}" for ${studentLevel} level students`,
          { tone: "casual", length: "short" },
        )
        sections.vocabulary[i].example = enhancedExample
      }
    }

    // Enhance discussion questions
    if (sections.discussion) {
      const enhancedDiscussion = await this.googleAI.write(
        `Expand these discussion questions for ${lessonType} lesson: ${sections.discussion.join(", ")}. Make them more engaging for ${studentLevel} level students.`,
        { tone: "casual", length: "medium", format: "bullet-points" },
      )
      sections.discussion = this.parseListFromText(enhancedDiscussion)
    }

    return sections
  }

  private async proofreadLesson(lesson: any) {
    // Proofread key text sections
    const sectionsToProofread = ["reading", "grammar.examples", "pronunciation.practice"]

    for (const sectionPath of sectionsToProofread) {
      const value = this.getNestedValue(lesson, sectionPath)
      if (typeof value === "string") {
        const proofread = await this.googleAI.proofread(value, {
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
    return {
      warmup: this.getTemplateWarmup(lessonType, studentLevel),
      vocabulary: this.extractVocabulary(content, studentLevel),
      reading: content.substring(0, 500),
      comprehension: this.getTemplateComprehension(lessonType, studentLevel),
      discussion: this.getTemplateDiscussion(lessonType, studentLevel),
      grammar: this.getTemplateGrammar(studentLevel),
      pronunciation: this.getTemplatePronunciation(content),
      wrapup: this.getTemplateWrapup(lessonType),
    }
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
}

export const lessonAIGenerator = new LessonAIGenerator()
