import { NextRequest, NextResponse } from 'next/server';
import { usageMonitor, GenerationContext } from '@/lib/usage-monitor';

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json();

    const context: GenerationContext = {
      userId: 'test-user-123',
      lessonId: 'test-lesson-456',
      lessonType: 'discussion',
      difficultyLevel: 'B1',
      contentLength: 500,
      timestamp: new Date()
    };

    switch (action) {
      case 'logTokenUsage':
        usageMonitor.logTokenUsage(
          params.section || 'vocabulary',
          params.tokens || 150,
          params.optimization || 'keyword-extraction',
          context
        );
        return NextResponse.json({ 
          success: true, 
          message: 'Token usage logged successfully' 
        });

      case 'logError':
        const testError = new Error(params.errorMessage || 'Test AI generation error');
        usageMonitor.logError(
          testError,
          params.errorType || 'AI_GENERATION_FAILED',
          context
        );
        return NextResponse.json({ 
          success: true, 
          message: 'Error logged successfully' 
        });

      case 'logOptimization':
        usageMonitor.logOptimizationSavings(
          params.baseline || 300,
          params.optimized || 200,
          params.strategy || 'prompt-compression',
          context
        );
        return NextResponse.json({ 
          success: true, 
          message: 'Optimization savings logged successfully' 
        });

      case 'generateReport':
        const startDate = params.startDate ? new Date(params.startDate) : undefined;
        const endDate = params.endDate ? new Date(params.endDate) : undefined;
        const report = await usageMonitor.generateUsageReport(startDate, endDate);
        return NextResponse.json({ 
          success: true, 
          report 
        });

      case 'getLessonMetrics':
        const metrics = await usageMonitor.getLessonMetrics(params.lessonId || 'test-lesson-456');
        return NextResponse.json({ 
          success: true, 
          metrics 
        });

      case 'getLogCounts':
        const counts = usageMonitor.getLogCounts();
        return NextResponse.json({ 
          success: true, 
          counts 
        });

      case 'clearOldLogs':
        await usageMonitor.clearOldLogs(params.days || 30);
        return NextResponse.json({ 
          success: true, 
          message: 'Old logs cleared successfully' 
        });

      case 'simulateUsage':
        // Simulate a complete lesson generation with multiple sections
        const sections = ['vocabulary', 'reading', 'comprehension', 'dialogue', 'warmup'];
        const optimizations = ['keyword-extraction', 'prompt-compression', 'content-summarization'];
        
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          const baseTokens = 200 + Math.floor(Math.random() * 100);
          const optimizedTokens = Math.floor(baseTokens * (0.6 + Math.random() * 0.3));
          const optimization = optimizations[Math.floor(Math.random() * optimizations.length)];
          
          // Log token usage
          usageMonitor.logTokenUsage(section, optimizedTokens, optimization, {
            ...context,
            lessonId: `lesson-${Date.now()}-${i}`
          });
          
          // Log optimization savings
          usageMonitor.logOptimizationSavings(baseTokens, optimizedTokens, optimization, {
            ...context,
            lessonId: `lesson-${Date.now()}-${i}`
          });
          
          // Occasionally log an error
          if (Math.random() < 0.1) {
            const error = new Error(`Simulated error in ${section} generation`);
            usageMonitor.logError(error, 'AI_TIMEOUT', {
              ...context,
              lessonId: `lesson-${Date.now()}-${i}`
            });
          }
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Usage simulation completed',
          sectionsGenerated: sections.length
        });

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action. Available actions: logTokenUsage, logError, logOptimization, generateReport, getLessonMetrics, getLogCounts, clearOldLogs, simulateUsage' 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Usage monitor test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Return current usage statistics
    const counts = usageMonitor.getLogCounts();
    const report = await usageMonitor.generateUsageReport();
    
    return NextResponse.json({
      success: true,
      currentCounts: counts,
      recentReport: report,
      availableActions: [
        'logTokenUsage',
        'logError', 
        'logOptimization',
        'generateReport',
        'getLessonMetrics',
        'getLogCounts',
        'clearOldLogs',
        'simulateUsage'
      ]
    });
  } catch (error) {
    console.error('Usage monitor status error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }, { status: 500 });
  }
}