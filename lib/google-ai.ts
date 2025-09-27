// Google AI APIs service layer
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

class GoogleAIService {
  private config: GoogleAIConfig

  constructor(config: GoogleAIConfig) {
    this.config = config
  }

  private async makeRequest(endpoint: string, data: any) {
    const response = await fetch(`${this.config.baseUrl}/${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Google AI API error: ${response.statusText}`)
    }

    return response.json()
  }

  async summarize(text: string, options: SummarizerOptions = {}) {
    const data = {
      input: text,
      type: options.type || "key-points",
      length: options.length || "medium",
      format: options.format || "plain-text",
    }

    const result = await this.makeRequest("summarizer/v1/summarize", data)
    return result.summary
  }

  async translate(text: string, options: TranslatorOptions) {
    const data = {
      input: text,
      source_language: options.sourceLanguage || "auto",
      target_language: options.targetLanguage,
    }

    const result = await this.makeRequest("translator/v1/translate", data)
    return result.translation
  }

  async prompt(prompt: string, options: PromptOptions = {}) {
    const data = {
      prompt,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1000,
      top_p: options.topP || 0.9,
    }

    const result = await this.makeRequest("prompt/v1/generate", data)
    return result.response
  }

  async write(prompt: string, options: WriterOptions = {}) {
    const data = {
      prompt,
      tone: options.tone || "casual",
      length: options.length || "medium",
      format: options.format || "paragraph",
    }

    const result = await this.makeRequest("writer/v1/write", data)
    return result.content
  }

  async rewrite(text: string, options: RewriterOptions = {}) {
    const data = {
      input: text,
      tone: options.tone || "casual",
      length: options.length || "same",
      audience: options.audience || "general",
    }

    const result = await this.makeRequest("rewriter/v1/rewrite", data)
    return result.rewritten_text
  }

  async proofread(text: string, options: ProofreaderOptions = {}) {
    const data = {
      input: text,
      check_grammar: options.checkGrammar !== false,
      check_spelling: options.checkSpelling !== false,
      check_style: options.checkStyle !== false,
      suggest_improvements: options.suggestImprovements !== false,
    }

    const result = await this.makeRequest("proofreader/v1/proofread", data)
    return {
      corrected_text: result.corrected_text,
      suggestions: result.suggestions,
      errors: result.errors,
    }
  }
}

// Initialize Google AI service
export const createGoogleAIService = () => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY
  const baseUrl = process.env.NEXT_PUBLIC_GOOGLE_AI_BASE_URL || "https://generativelanguage.googleapis.com"

  if (!apiKey) {
    throw new Error("Google AI API key is required")
  }

  return new GoogleAIService({ apiKey, baseUrl })
}

export type { SummarizerOptions, TranslatorOptions, PromptOptions, WriterOptions, RewriterOptions, ProofreaderOptions }
