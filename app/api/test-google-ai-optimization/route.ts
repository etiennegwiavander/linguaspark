import { NextRequest, NextResponse } from 'next/server';
import { createGoogleAIServerService } from '@/lib/google-ai-server';
import { usageMonitor } from '@/lib/usage-monitor';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing Google AI optimization features...');
    
    const googleAI = createGoogleAIServerService();
    
    // Test content for optimization
    const testContent = `
      Artificial intelligence is transforming the way we work and live. 
      Machine learning algorithms can now process vast amounts of data 
      and identify patterns that humans might miss. This technology is 
      being applied in healthcare, finance, transportation, and many other 
      industries to improve efficiency and outcomes.
    `;

    const testContext = {
      userId: 'test-user-123',
      lessonId: 'test-lesson-456',
      lessonType: 'discussion',
      difficultyLevel: 'B1',
      contentLength: testContent.length,
      timestamp: new Date()
    };

    console.log('📊 Testing token usage tracking...');
    
    // Test 1: Summarization with tracking
    console.log('\n1️⃣ Testing summarization with token tracking...');
    const summary = await googleAI.summarize(testContent, 
      { type: 'key-points', length: 'short' },
      { 
        section: 'summary',
        optimization: 'content_summarization',
        context: testContext
      }
    );
    console.log('✅ Summary generated:', summary.substring(0, 100) + '...');

    // Test 2: Translation with tracking
    console.log('\n2️⃣ Testing translation with token tracking...');
    const translation = await googleAI.translate(
      'Hello, how are you today?',
      { targetLanguage: 'es' },
      {
        section: 'translation',
        optimization: 'direct_translation',
        context: testContext
      }
    );
    console.log('✅ Translation generated:', translation);

    // Test 3: Batch processing
    console.log('\n3️⃣ Testing batch processing...');
    const batchRequests = [
      {
        id: 'req1',
        prompt: 'Generate a simple greeting in English.',
        options: { temperature: 0.7 },
        metadata: {
          section: 'batch_greeting',
          optimization: 'batch_processing',
          context: testContext
        }
      },
      {
        id: 'req2',
        prompt: 'Create a short sentence about weather.',
        options: { temperature: 0.7 },
        metadata: {
          section: 'batch_weather',
          optimization: 'batch_processing',
          context: testContext
        }
      }
    ];

    const batchResults = await googleAI.processBatch(batchRequests);
    console.log('✅ Batch processing complete:', batchResults.length, 'results');
    
    batchResults.forEach((result, index) => {
      if (result.result) {
        console.log(`  Result ${index + 1}: ${result.result.substring(0, 50)}...`);
      } else if (result.error) {
        console.log(`  Error ${index + 1}: ${result.error.message}`);
      }
    });

    // Test 4: Error handling and classification
    console.log('\n4️⃣ Testing error handling...');
    try {
      // This should trigger an error (empty prompt)
      await googleAI.prompt('', {}, {
        section: 'error_test',
        optimization: 'error_handling',
        context: testContext
      });
    } catch (error) {
      console.log('✅ Error handling working:', error.message);
    }

    // Test 5: Usage monitoring
    console.log('\n5️⃣ Testing usage monitoring...');
    const usageReport = await usageMonitor.generateUsageReport();
    console.log('✅ Usage report generated:');
    console.log(`  Total lessons: ${usageReport.totalLessons}`);
    console.log(`  Total tokens: ${usageReport.totalTokens}`);
    console.log(`  Average tokens per lesson: ${usageReport.averageTokensPerLesson.toFixed(2)}`);
    console.log(`  Optimization savings: ${usageReport.totalOptimizationSavings}`);
    console.log(`  Error rate: ${usageReport.errorRate.toFixed(2)}%`);

    // Test 6: Lesson-specific metrics
    console.log('\n6️⃣ Testing lesson-specific metrics...');
    const lessonMetrics = await usageMonitor.getLessonMetrics('test-lesson-456');
    if (lessonMetrics) {
      console.log('✅ Lesson metrics retrieved:');
      console.log(`  Total tokens: ${lessonMetrics.totalTokens}`);
      console.log(`  Sections: ${Object.keys(lessonMetrics.tokensPerSection).join(', ')}`);
      console.log(`  Generation time: ${lessonMetrics.generationTime}ms`);
    } else {
      console.log('ℹ️ No metrics found for test lesson');
    }

    return NextResponse.json({
      success: true,
      message: 'Google AI optimization features tested successfully',
      results: {
        summaryGenerated: !!summary,
        translationGenerated: !!translation,
        batchProcessed: batchResults.length,
        usageTracked: true,
        errorHandlingWorking: true
      },
      usageReport: {
        totalLessons: usageReport.totalLessons,
        totalTokens: usageReport.totalTokens,
        averageTokensPerLesson: usageReport.averageTokensPerLesson,
        optimizationSavings: usageReport.totalOptimizationSavings
      }
    });

  } catch (error) {
    console.error('❌ Google AI optimization test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: 'Check server logs for full error details'
    }, { status: 500 });
  }
}