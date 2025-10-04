// Server-side Google AI (Gemini) APIs service layer
import { errorClassifier, type AIError, type ErrorContext } from './error-classifier';
import { usageMonitor, type GenerationContext } from './usage-monitor';

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

// Token usage tracking interface
interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

// Request metadata for tracking and optimization
interface RequestMetadata {
  section?: string;
  optimization?: string;
  context?: GenerationContext;
  retryAttempt?: number;
}

// Batch request interface
interface BatchRequest {
  id: string;
  prompt: string;
  options: any;
  metadata?: RequestMetadata;
}

// Batch response interface
interface BatchResponse {
  id: string;
  result?: string;
  error?: Error;
  tokenUsage?: TokenUsage;
}

class GoogleAIServerService {
  private config: GoogleAIConfig
  private model: string = "models/gemini-2.5-flash" // Use actual available model
  private readonly maxRetries = 3;
  private readonly baseRetryDelay = 1000; // 1 second
  private readonly maxRetryDelay = 30000; // 30 seconds

  constructor(config: GoogleAIConfig) {
    this.config = config
  }

  private async makeGeminiRequest(
    prompt: string, 
    options: any = {}, 
    metadata?: RequestMetadata
  ): Promise<string> {
    return this.makeGeminiRequestWithRetry(prompt, options, metadata, 0);
  }

  private async makeGeminiRequestWithRetry(
    prompt: string, 
    options: any = {}, 
    metadata?: RequestMetadata,
    retryAttempt: number = 0
  ): Promise<string> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || 2000,
        topP: options.topP || 0.9,
      }
    };

    // Estimate input tokens (rough approximation: 1 token ≈ 4 characters)
    const estimatedInputTokens = Math.ceil(prompt.length / 4);

    const url = `${this.config.baseUrl}/v1beta/models/gemini-2.5-flash:generateContent?key=${this.config.apiKey}`;
    console.log(`🌐 API Request [${requestId}] - Attempt ${retryAttempt + 1}/${this.maxRetries + 1}`);
    console.log(`📊 Estimated input tokens: ${estimatedInputTokens}`);
    
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`📡 Response [${requestId}]: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const result = await response.json();
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        console.log("✅ Successful API response received");
        
        // Extract token usage information if available
        const tokenUsage = this.extractTokenUsage(result, estimatedInputTokens);
        
        // Log token usage
        if (metadata?.section && tokenUsage) {
          usageMonitor.logTokenUsage(
            metadata.section,
            tokenUsage.totalTokens,
            metadata.optimization || 'none',
            metadata.context
          );
        }

        // Parse response content
        if (result.candidates && result.candidates.length > 0) {
          const candidate = result.candidates[0];
          
          // Check if we hit MAX_TOKENS limit
          if (candidate.finishReason === "MAX_TOKENS") {
            console.warn("⚠️ Hit MAX_TOKENS limit, response may be incomplete");
            if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
              const text = candidate.content.parts[0].text;
              console.log(`⚠️ Extracted partial text (${text.length} chars) due to MAX_TOKENS`);
              return text;
            } else {
              const error = new Error("MAX_TOKENS_EXCEEDED") as AIError;
              error.code = "MAX_TOKENS";
              throw error;
            }
          }
          
          // Normal response processing
          if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
            const text = candidate.content.parts[0].text;
            console.log(`✅ Generated text (${text.length} chars) in ${responseTime}ms`);
            return text;
          } else {
            const error = new Error("Invalid content structure in API response") as AIError;
            error.code = "INVALID_RESPONSE_STRUCTURE";
            throw error;
          }
        } else {
          const error = new Error("No candidates in API response") as AIError;
          error.code = "NO_CANDIDATES";
          throw error;
        }
      } else {
        // Handle HTTP errors with potential retry
        const errorText = await response.text();
        const error = new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`) as AIError;
        error.status = response.status;
        error.response = errorText;
        
        // Check if this is a retryable error
        if (this.isRetryableError(response.status) && retryAttempt < this.maxRetries) {
          const delay = this.calculateRetryDelay(retryAttempt);
          console.warn(`⚠️ Retryable error (${response.status}), retrying in ${delay}ms...`);
          
          await this.sleep(delay);
          return this.makeGeminiRequestWithRetry(prompt, options, metadata, retryAttempt + 1);
        }
        
        throw error;
      }
    } catch (error) {
      const aiError = error as AIError;
      
      // Log error with context
      if (metadata?.context) {
        const errorContext: ErrorContext = {
          userId: metadata.context.userId,
          contentLength: prompt.length,
          lessonType: metadata.context.lessonType,
          timestamp: new Date(),
          requestId,
          apiEndpoint: url
        };
        
        const classifiedError = errorClassifier.classifyError(aiError, errorContext);
        usageMonitor.logError(aiError, classifiedError.type, metadata.context);
      }
      
      // Check if this is a retryable network error
      if (this.isNetworkError(aiError) && retryAttempt < this.maxRetries) {
        const delay = this.calculateRetryDelay(retryAttempt);
        console.warn(`⚠️ Network error, retrying in ${delay}ms...`);
        
        await this.sleep(delay);
        return this.makeGeminiRequestWithRetry(prompt, options, metadata, retryAttempt + 1);
      }
      
      console.error(`❌ API call failed [${requestId}]:`, aiError.message);
      throw aiError;
    }
  }

  /**
   * Extract token usage from API response
   */
  private extractTokenUsage(result: any, estimatedInputTokens: number): TokenUsage {
    // Try to extract actual token usage from response metadata
    let inputTokens = estimatedInputTokens;
    let outputTokens = 0;
    
    // Check if response includes usage metadata
    if (result.usageMetadata) {
      inputTokens = result.usageMetadata.promptTokenCount || estimatedInputTokens;
      outputTokens = result.usageMetadata.candidatesTokenCount || 0;
    } else if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
      // Estimate output tokens from response text
      const responseText = result.candidates[0].content.parts[0].text;
      outputTokens = Math.ceil(responseText.length / 4);
    }
    
    return {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens
    };
  }

  /**
   * Check if error is retryable based on status code
   */
  private isRetryableError(status: number): boolean {
    return [429, 500, 502, 503, 504].includes(status);
  }

  /**
   * Check if error is a network error
   */
  private isNetworkError(error: AIError): boolean {
    const networkIndicators = ['fetch', 'network', 'connection', 'timeout', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT'];
    const errorMessage = error.message.toLowerCase();
    return networkIndicators.some(indicator => errorMessage.includes(indicator));
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(retryAttempt: number): number {
    const delay = this.baseRetryDelay * Math.pow(2, retryAttempt);
    const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
    return Math.min(delay + jitter, this.maxRetryDelay);
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate unique request ID for tracking
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Process batch requests with intelligent batching
   */
  async processBatch(requests: BatchRequest[]): Promise<BatchResponse[]> {
    console.log(`🔄 Processing batch of ${requests.length} requests`);
    
    const results: BatchResponse[] = [];
    const batchSize = 5; // Process in smaller batches to avoid overwhelming the API
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(requests.length / batchSize)}`);
      
      // Process batch requests concurrently
      const batchPromises = batch.map(async (request): Promise<BatchResponse> => {
        try {
          const result = await this.makeGeminiRequest(
            request.prompt, 
            request.options, 
            request.metadata
          );
          
          return {
            id: request.id,
            result
          };
        } catch (error) {
          return {
            id: request.id,
            error: error as Error
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < requests.length) {
        await this.sleep(500); // 500ms delay between batches
      }
    }
    
    console.log(`✅ Batch processing complete: ${results.filter(r => r.result).length} successful, ${results.filter(r => r.error).length} failed`);
    return results;
  }

  async summarize(text: string, options: SummarizerOptions = {}, metadata?: RequestMetadata) {
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

    const requestMetadata: RequestMetadata = {
      section: 'summarize',
      optimization: 'content_summarization',
      ...metadata
    };

    try {
      return await this.makeGeminiRequest(prompt, { temperature: 0.3 }, requestMetadata)
    } catch (error) {
      console.error("Summarization failed:", error)
      // Re-throw error instead of fallback to maintain AI-only approach
      throw error;
    }
  }

  async translate(text: string, options: TranslatorOptions, metadata?: RequestMetadata) {
    const targetLang = this.getLanguageName(options.targetLanguage)
    
    const prompt = `Translate the following text to ${targetLang}. Maintain the original meaning and tone:

${text}

Translation:`

    const requestMetadata: RequestMetadata = {
      section: 'translate',
      optimization: 'direct_translation',
      ...metadata
    };

    try {
      return await this.makeGeminiRequest(prompt, { temperature: 0.2 }, requestMetadata)
    } catch (error) {
      console.error("Translation failed:", error)
      // Re-throw error instead of fallback to maintain AI-only approach
      throw error;
    }
  }

  async prompt(prompt: string, options: PromptOptions = {}, metadata?: RequestMetadata) {
    const requestMetadata: RequestMetadata = {
      section: 'prompt',
      optimization: 'direct_prompt',
      ...metadata
    };

    try {
      return await this.makeGeminiRequest(prompt, options, requestMetadata)
    } catch (error) {
      console.error("Prompt generation failed:", error)
      throw error
    }
  }

  async write(prompt: string, options: WriterOptions = {}, metadata?: RequestMetadata) {
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

    const requestMetadata: RequestMetadata = {
      section: 'write',
      optimization: 'structured_writing',
      ...metadata
    };

    try {
      return await this.makeGeminiRequest(enhancedPrompt, { temperature: 0.7 }, requestMetadata)
    } catch (error) {
      console.error("Writing failed:", error)
      throw error
    }
  }

  async rewrite(text: string, options: RewriterOptions = {}, metadata?: RequestMetadata) {
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

    const requestMetadata: RequestMetadata = {
      section: 'rewrite',
      optimization: 'content_rewriting',
      ...metadata
    };

    try {
      return await this.makeGeminiRequest(prompt, { temperature: 0.5 }, requestMetadata)
    } catch (error) {
      console.error("Rewriting failed:", error)
      // Re-throw error instead of fallback to maintain AI-only approach
      throw error;
    }
  }

  async proofread(text: string, options: ProofreaderOptions = {}, metadata?: RequestMetadata) {
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

    const requestMetadata: RequestMetadata = {
      section: 'proofread',
      optimization: 'text_correction',
      ...metadata
    };

    try {
      const correctedText = await this.makeGeminiRequest(prompt, { temperature: 0.2 }, requestMetadata)
      return {
        corrected_text: correctedText,
        suggestions: [],
        errors: []
      }
    } catch (error) {
      console.error("Proofreading failed:", error)
      // Re-throw error instead of fallback to maintain AI-only approach
      throw error;
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

export type { 
  SummarizerOptions, 
  TranslatorOptions, 
  PromptOptions, 
  WriterOptions, 
  RewriterOptions, 
  ProofreaderOptions,
  TokenUsage,
  RequestMetadata,
  BatchRequest,
  BatchResponse
}
