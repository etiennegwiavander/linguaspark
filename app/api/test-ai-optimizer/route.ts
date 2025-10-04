import { NextRequest, NextResponse } from 'next/server';
import { aiOptimizer, type SharedContext } from '@/lib/ai-optimizer';

export async function POST(request: NextRequest) {
  try {
    const { content, section, difficultyLevel } = await request.json();

    if (!content || !section || !difficultyLevel) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: content, section, difficultyLevel'
      }, { status: 400 });
    }

    console.log('Testing AI Optimizer with:', { section, difficultyLevel, contentLength: content.length });

    // Test extractKeyTerms
    const keyTerms = aiOptimizer.extractKeyTerms(content);
    console.log('Extracted key terms:', keyTerms);

    // Test summarizeContent
    const summary = aiOptimizer.summarizeContent(content, 300);
    console.log('Content summary:', summary);

    // Create shared context
    const sharedContext: SharedContext = {
      keyVocabulary: keyTerms,
      mainThemes: ['technology', 'innovation', 'business'], // Mock themes for testing
      difficultyLevel: difficultyLevel,
      contentSummary: summary
    };

    // Test optimizePrompt
    const optimizedPrompt = aiOptimizer.optimizePrompt(section, sharedContext);
    console.log('Optimized prompt:', optimizedPrompt);

    // Test batchPrompts
    const testPrompts = [
      { section: 'warmup', prompt: 'Generate warmup questions' },
      { section: 'vocabulary', prompt: 'Create vocabulary list' },
      { section: 'reading', prompt: 'Generate reading passage' }
    ];
    const batchedPrompts = aiOptimizer.batchPrompts(testPrompts);
    console.log('Batched prompts:', batchedPrompts);

    return NextResponse.json({
      success: true,
      results: {
        keyTerms,
        summary,
        optimizedPrompt,
        batchedPrompts,
        sharedContext
      }
    });

  } catch (error) {
    console.error('AI Optimizer test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}