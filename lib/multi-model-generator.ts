/**
 * Multi-Model Distributed Lesson Generator
 * Uses multiple Gemini models in parallel for faster, more reliable generation
 */

import { createOpenRouterAIService } from './openrouter-ai-server'

// Model configuration with priorities
export const MODEL_CONFIG = {
  // Best for complex, critical sections
  PRIMARY: 'gemini-2.5-flash',
  
  // Good for standard sections
  SECONDARY: 'gemini-2.0-flash',
  
  // Experimental, good for creative content
  E
