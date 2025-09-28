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
  private model: string = "models/gemini-2.5-flash" // Use actual available model

  constructor(config: GoogleAIConfig) {
    this.config = config
  }

  private async makeGeminiRequest(prompt: string, options: any = {}) {
    // Try different model names based on actual available models from API
    const modelsToTry = [
      'models/gemini-2.5-flash',
      'models/gemini-2.5-pro', 
      'models/gemini-2.0-flash',
      'models/gemini-flash-latest',
      'models/gemini-pro-latest',
      'models/gemini-2.0-flash-001',
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-2.0-flash',
      'gemini-flash-latest',
      'gemini-pro-latest'
    ]
    
    const possibleUrls = []
    
    // Generate URLs for different combinations
    for (const model of modelsToTry) {
      possibleUrls.push(`${this.config.baseUrl}/v1beta/models/${model}:generateContent?key=${this.config.apiKey}`)
      possibleUrls.push(`${this.config.baseUrl}/v1/models/${model}:generateContent?key=${this.config.apiKey}`)
    }
    
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

    console.log("🔗 Trying Gemini API endpoints...")

    // Try each URL until one works
    for (let i = 0; i < possibleUrls.length; i++) {
      const url = possibleUrls[i]
      console.log(`🌐 Attempt ${i + 1}: ${url.replace(this.config.apiKey, 'API_KEY_HIDDEN')}`)
      
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        })

        console.log(`📡 Response status: ${response.status} ${response.statusText}`)

        if (response.ok) {
          const result = await response.json()
          console.log("✅ Successful API response received")
          
          if (result.candidates && result.candidates[0] && result.candidates[0].content) {
            return result.candidates[0].content.parts[0].text
          } else {
            console.warn("⚠️ Invalid response structure:", result)
            throw new Error("Invalid response structure from Gemini API")
          }
        } else {
          const errorText = await response.text()
          console.warn(`❌ Attempt ${i + 1} failed:`, response.status, errorText)
          
          // If this is the last attempt, throw the error
          if (i === possibleUrls.length - 1) {
            throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`)
          }
        }
      } catch (error) {
        console.warn(`❌ Attempt ${i + 1} exception:`, error.message)
        
        // If this is the last attempt, throw the error
        if (i === possibleUrls.length - 1) {
          throw error
        }
      }
    }
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
