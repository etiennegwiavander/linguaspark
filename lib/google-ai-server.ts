// Server-side Google AI (Gemini) APIs service layer
interface GoogleAIConfig {
  apiKey: string
  baseUrl: string
}

interface SummarizerOptions {
  type?: "key-points" | "tl-dr" | "teaser" | "headline"
  length?: "short" | "medium" | "long"
  format?: "markdown" | "plain-text"
}

interface TranslatorOptions {
  sourceLanguage?: string
  targetLanguage: string
}

interface PromptOptions {
  temperature?: number
  maxTokens?: number
  topP?: number
}

interface WriterOptions {
  tone?: "formal" | "casual" | "academic" | "creative"
  length?: "short" | "medium" | "long"
  format?: "paragraph" | "bullet-points" | "numbered-list"
}

interface RewriterOptions {
  tone?: "formal" | "casual" | "academic" | "creative"
  length?: "shorter" | "longer" | "same"
  audience?: "general" | "expert" | "beginner"
}

interface ProofreaderOptions {
  checkGrammar?: boolean
  checkSpelling?: boolean
  checkStyle?: boolean
  suggestImprovements?: boolean
}

class GoogleAIServerService {
  private config: GoogleAIConfig
  private model: string = "gemini-1.5-flash"

  constructor(config: GoogleAIConfig) {
    this.config = config
  }

  private async makeGeminiRequest(prompt: string, options: any = {}) {
    const url = `${this.config.baseUrl}/v1beta/models/${this.model}:generateContent?key=${this.config.apiKey}`
    
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || 1000,
        topP: options.topP || 0.9,
      }
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Gemini API Error:", errorText)
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    
    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
      throw new Error("Invalid response from Gemini API")
    }

    return result.candidates[0].content.parts[0].text
  }

  async summarize(text: string, options: SummarizerOptions = {}) {
    const summaryType = options.type || "key-points"
    const length = options.length || "medium"
    
    const lengthInstructions = {
      short: "in 2-3 sentences",
      medium: "in 4-6 sentences", 
      long: "in 7-10 sentences"
    }

    const typeInstructions = {
      "key-points": "Extract and summarize the key points",
      "tl-dr": "Create a TL;DR summary",
      "teaser": "Write an engaging teaser summary",
      "headline": "Create a headline-style summary"
    }

    const prompt = `${typeInstructions[summaryType]} of the following text ${lengthInstructions[length]}:

${text}

Summary:`

    try {
      return await this.makeGeminiRequest(prompt, { temperature: 0.3 })
    } catch (error) {
      console.error("Summarization failed:", error)
      // Fallback to simple truncation
      return text.substring(0, 500) + "..."
    }
  }

  async translate(text: string, options: TranslatorOptions) {
    const targetLang = this.getLanguageName(options.targetLanguage)
    
    const prompt = `Translate the following text to ${targetLang}. Maintain the original meaning and tone:

${text}

Translation:`

    try {
      return await this.makeGeminiRequest(prompt, { temperature: 0.2 })
    } catch (error) {
      console.error("Translation failed:", error)
      // Return original text if translation fails
      return text
    }
  }

  async prompt(prompt: string, options: PromptOptions = {}) {
    try {
      return await this.makeGeminiRequest(prompt, options)
    } catch (error) {
      console.error("Prompt generation failed:", error)
      throw error
    }
  }

  async write(prompt: string, options: WriterOptions = {}) {
    const tone = options.tone || "casual"
    const length = options.length || "medium"
    const format = options.format || "paragraph"

    const lengthInstructions = {
      short: "Keep it brief and concise",
      medium: "Write a moderate length response",
      long: "Provide a detailed and comprehensive response"
    }

    const formatInstructions = {
      paragraph: "Write in paragraph form",
      "bullet-points": "Format as bullet points",
      "numbered-list": "Format as a numbered list"
    }

    const enhancedPrompt = `${prompt}

Instructions:
- Tone: ${tone}
- ${lengthInstructions[length]}
- ${formatInstructions[format]}

Response:`

    try {
      return await this.makeGeminiRequest(enhancedPrompt, { temperature: 0.7 })
    } catch (error) {
      console.error("Writing failed:", error)
      throw error
    }
  }

  async rewrite(text: string, options: RewriterOptions = {}) {
    const tone = options.tone || "casual"
    const length = options.length || "same"
    const audience = options.audience || "general"

    const lengthInstructions = {
      shorter: "Make it more concise",
      longer: "Expand and add more detail",
      same: "Keep approximately the same length"
    }

    const prompt = `Rewrite the following text with these requirements:
- Tone: ${tone}
- Audience: ${audience}
- Length: ${lengthInstructions[length]}

Original text:
${text}

Rewritten text:`

    try {
      return await this.makeGeminiRequest(prompt, { temperature: 0.5 })
    } catch (error) {
      console.error("Rewriting failed:", error)
      return text // Return original if rewriting fails
    }
  }

  async proofread(text: string, options: ProofreaderOptions = {}) {
    const checkGrammar = options.checkGrammar !== false
    const checkSpelling = options.checkSpelling !== false
    const checkStyle = options.checkStyle !== false

    const checks = []
    if (checkGrammar) checks.push("grammar")
    if (checkSpelling) checks.push("spelling")
    if (checkStyle) checks.push("style and clarity")

    const prompt = `Proofread and correct the following text for ${checks.join(", ")}. Return only the corrected text:

${text}

Corrected text:`

    try {
      const correctedText = await this.makeGeminiRequest(prompt, { temperature: 0.2 })
      return {
        corrected_text: correctedText,
        suggestions: [],
        errors: []
      }
    } catch (error) {
      console.error("Proofreading failed:", error)
      return {
        corrected_text: text,
        suggestions: [],
        errors: []
      }
    }
  }

  private getLanguageName(code: string): string {
    const languageMap = {
      es: "Spanish",
      fr: "French", 
      de: "German",
      it: "Italian",
      pt: "Portuguese",
      ja: "Japanese",
      ko: "Korean",
      zh: "Chinese",
      en: "English"
    }
    return languageMap[code] || "English"
  }
}

// Server-side only initialization
export const createGoogleAIServerService = () => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY
  const baseUrl = process.env.NEXT_PUBLIC_GOOGLE_AI_BASE_URL || "https://generativelanguage.googleapis.com"

  if (!apiKey) {
    console.warn("Google AI API key not found. Lesson generation will use fallback templates.")
    // Return a service that will always throw errors, triggering fallbacks
    return new GoogleAIServerService({ apiKey: "dummy", baseUrl })
  }

  return new GoogleAIServerService({ apiKey, baseUrl })
}

export type { SummarizerOptions, TranslatorOptions, PromptOptions, WriterOptions, RewriterOptions, ProofreaderOptions }
