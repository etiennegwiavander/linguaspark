// Server-side OpenRouter (DeepSeek) AI service layer
import { errorClassifier, type AIError, type ErrorContext } from './error-classifier';
import { usageMonitor, type GenerationContext } from './usage-monitor';

interface OpenRouterConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  siteUrl: string;
}

interface PromptOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

interface RequestMetadata {
  section?: string;
  optimization?: string;
  context?: GenerationContext;
  retryAttempt?: number;
}

class OpenRouterAIService {
  private config: OpenRouterConfig;
  private readonly maxRetries = 3;
  private readonly baseRetryDelay = 1000;
  private readonly maxRetryDelay = 30000;

  constructor(config: OpenRouterConfig) {
    this.config = config;
  }

  private async makeOpenRouterRequest(
    prompt: string,
    options: PromptOptions = {},
    metadata?: RequestMetadata,
    retryAttempt: number = 0
  ): Promise<string> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    const requestBody = {
      model: this.config.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 8000,
      top_p: options.topP || 0.9,
    };

    const estimatedInputTokens = Math.ceil(prompt.length / 4);

    const url = `${this.config.baseUrl}/chat/completions`;
    console.log(`🌐 OpenRouter Request [${requestId}] - Attempt ${retryAttempt + 1}/${this.maxRetries + 1}`);
    console.log(`📊 Model: ${this.config.model}`);
    console.log(`📊 Estimated input tokens: ${estimatedInputTokens}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': this.config.siteUrl,
          'X-Title': 'LinguaSpark'
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`📡 Response [${requestId}]: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const result = await response.json();
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        console.log("✅ Successful API response received");

        // Extract token usage
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
        if (result.choices && result.choices.length > 0) {
          const choice = result.choices[0];
          const content = choice.message?.content;

          if (content && content.trim().length > 0) {
            console.log(`✅ Generated text (${content.length} chars) in ${responseTime}ms`);
            return content;
          } else {
            const error = new Error("No content in API response") as AIError;
            error.code = "NO_CONTENT";
            throw error;
          }
        } else {
          const error = new Error("No choices in API response") as AIError;
          error.code = "NO_CHOICES";
          throw error;
        }
      } else {
        // Handle HTTP errors with potential retry
        const errorText = await response.text();
        const error = new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`) as AIError;
        error.status = response.status;
        error.response = errorText;

        // Check if this is a retryable error
        if (this.isRetryableError(response.status) && retryAttempt < this.maxRetries) {
          const delay = this.calculateRetryDelay(retryAttempt);
          console.warn(`⚠️ Retryable error (${response.status}), retrying in ${delay}ms...`);

          await this.sleep(delay);
          return this.makeOpenRouterRequest(prompt, options, metadata, retryAttempt + 1);
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
        return this.makeOpenRouterRequest(prompt, options, metadata, retryAttempt + 1);
      }

      console.error(`❌ API call failed [${requestId}]:`, aiError.message);
      throw aiError;
    }
  }

  private extractTokenUsage(result: any, estimatedInputTokens: number): TokenUsage {
    let inputTokens = estimatedInputTokens;
    let outputTokens = 0;

    if (result.usage) {
      inputTokens = result.usage.prompt_tokens || estimatedInputTokens;
      outputTokens = result.usage.completion_tokens || 0;
    } else if (result.choices && result.choices[0]?.message?.content) {
      const responseText = result.choices[0].message.content;
      outputTokens = Math.ceil(responseText.length / 4);
    }

    return {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens
    };
  }

  private isRetryableError(status: number): boolean {
    return [429, 500, 502, 503, 504].includes(status);
  }

  private isNetworkError(error: AIError): boolean {
    const networkIndicators = ['fetch', 'network', 'connection', 'timeout', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT'];
    const errorMessage = error.message.toLowerCase();
    return networkIndicators.some(indicator => errorMessage.includes(indicator));
  }

  private calculateRetryDelay(retryAttempt: number): number {
    const delay = this.baseRetryDelay * Math.pow(2, retryAttempt);
    const jitter = Math.random() * 0.1 * delay;
    return Math.min(delay + jitter, this.maxRetryDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async prompt(prompt: string, options: PromptOptions = {}, metadata?: RequestMetadata): Promise<string> {
    const requestMetadata: RequestMetadata = {
      section: 'prompt',
      optimization: 'direct_prompt',
      ...metadata
    };

    try {
      return await this.makeOpenRouterRequest(prompt, options, requestMetadata);
    } catch (error) {
      console.error("Prompt generation failed:", error);
      throw error;
    }
  }
}

// Server-side only initialization
export const createOpenRouterAIService = () => {
  const apiKey = process.env.OPEN_ROUTER_KEY;
  const baseUrl = process.env.OPEN_ROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  const model = process.env.OPEN_ROUTER_MODEL || 'deepseek/deepseek-chat';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';

  if (!apiKey) {
    throw new Error("OpenRouter API key not found. Please set OPEN_ROUTER_KEY in .env.local");
  }

  return new OpenRouterAIService({ apiKey, baseUrl, model, siteUrl });
};

export type {
  PromptOptions,
  TokenUsage,
  RequestMetadata
};
