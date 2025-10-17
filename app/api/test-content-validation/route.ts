import { NextRequest, NextResponse } from 'next/server';
import { ContentExtractionValidator } from '@/lib/content-extraction-validator';

export async function POST(request: NextRequest) {
  try {
    const { content, metadata, options } = await request.json();

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    // Create validator with options
    const validator = new ContentExtractionValidator(options);

    // Validate the content
    const result = await validator.validateExtractedContent({
      text: content,
      metadata
    });

    // Get detailed error information if validation failed
    let errorDetails = null;
    if (!result.success && result.error) {
      errorDetails = validator.getErrorDetails(result);
    }

    // Get validation feedback
    const feedback = validator.getValidationFeedback(result);
    
    // Get quality assessment
    const qualityAssessment = validator.getQualityAssessment(result);
    
    // Get improvement suggestions
    const improvements = validator.suggestImprovements(result);
    
    // Create validation summary
    const summary = validator.createValidationSummary(result);

    return NextResponse.json({
      success: result.success,
      canProceed: result.canProceed,
      needsUserAction: result.needsUserAction,
      validation: {
        isValid: result.validation?.isValid,
        meetsMinimumQuality: result.validation?.meetsMinimumQuality,
        score: result.validation?.score,
        issues: result.validation?.issues,
        warnings: result.validation?.warnings,
        recommendations: result.validation?.recommendations
      },
      error: errorDetails,
      feedback,
      qualityAssessment,
      improvements,
      summary,
      canRetry: result.error?.canRetry || false
    });

  } catch (error) {
    console.error('Content validation test error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during validation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Test different validation scenarios
export async function GET() {
  const validator = new ContentExtractionValidator();
  
  const testCases = [
    {
      name: 'Valid Educational Content',
      content: `
        # Understanding Language Learning
        
        Language learning is a complex cognitive process that involves multiple skills and strategies.
        Research in applied linguistics has shown that successful language acquisition requires both
        explicit instruction and meaningful practice opportunities.
        
        ## Key Principles
        
        First, learners need comprehensible input that is slightly above their current level.
        This concept, known as "i+1," was introduced by Stephen Krashen in his Input Hypothesis.
        When students encounter language that challenges them without overwhelming them,
        they can naturally acquire new structures and vocabulary.
        
        Second, meaningful interaction plays a crucial role in language development.
        Students learn best when they use language for real communication purposes,
        not just for completing grammar exercises or memorizing vocabulary lists.
        
        ## Effective Teaching Strategies
        
        Teachers can employ various evidence-based strategies to facilitate learning:
        - Provide scaffolded instruction that gradually increases in complexity
        - Create opportunities for authentic communication and collaboration
        - Use multimedia resources to appeal to different learning styles
        - Implement formative assessment to monitor student progress
        
        Research consistently shows that these approaches lead to better outcomes
        for students across different age groups and proficiency levels.
      `,
      metadata: {
        title: 'Understanding Language Learning',
        language: 'en',
        languageConfidence: 0.95,
        contentType: 'article',
        url: 'https://education.example.com/language-learning'
      }
    },
    {
      name: 'Insufficient Content',
      content: 'This is too short for a lesson.',
      metadata: {
        language: 'en',
        languageConfidence: 0.9
      }
    },
    {
      name: 'Social Media Content',
      content: `
        @user123 this is amazing! #trending #viral
        Posted 2 hours ago • 15 likes, 3 shares, 8 comments
        Reply to this post • Like this content • Share with friends
        Follow @user123 for more content like this!
        Don't forget to subscribe and hit the notification bell!
      `.repeat(10),
      metadata: {
        language: 'en',
        languageConfidence: 0.8,
        contentType: 'social',
        url: 'https://social.example.com/post/123'
      }
    },
    {
      name: 'High Advertising Content',
      content: `
        Buy now! Special limited time offer! Don't miss out on these amazing deals!
        Click here for exclusive discounts and promotional offers that won't last long!
        Subscribe to our newsletter for more sales, deals, and affiliate marketing content!
        Advertisement: This sponsored content is brought to you by our partners.
        Sale! Sale! Sale! Everything must go in this incredible clearance event!
      `.repeat(15),
      metadata: {
        language: 'en',
        languageConfidence: 0.9,
        contentType: 'product',
        url: 'https://shop.example.com/sale'
      }
    },
    {
      name: 'Unsupported Language',
      content: `
        Dette er innhold på norsk som ikke støttes av systemet.
        Språkgjenkjenning bør oppdage at dette ikke er et støttet språk.
        Systemet bør gi en klar feilmelding og foreslå alternativer.
      `.repeat(10),
      metadata: {
        language: 'no',
        languageConfidence: 0.95,
        contentType: 'article'
      }
    }
  ];

  const results = [];

  for (const testCase of testCases) {
    try {
      const result = await validator.validateExtractedContent({
        text: testCase.content,
        metadata: testCase.metadata
      });

      const errorDetails = result.error ? validator.getErrorDetails(result) : null;
      const feedback = validator.getValidationFeedback(result);
      const qualityAssessment = validator.getQualityAssessment(result);
      const summary = validator.createValidationSummary(result);

      results.push({
        testCase: testCase.name,
        success: result.success,
        canProceed: result.canProceed,
        score: result.validation?.score,
        issues: result.validation?.issues?.length || 0,
        warnings: result.validation?.warnings?.length || 0,
        errorDetails,
        feedback,
        qualityAssessment,
        summary
      });
    } catch (error) {
      results.push({
        testCase: testCase.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return NextResponse.json({
    message: 'Content validation test results',
    testResults: results,
    summary: {
      totalTests: testCases.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    }
  });
}