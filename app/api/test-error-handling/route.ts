import { NextRequest, NextResponse } from "next/server";
import { errorClassifier, type AIError } from "@/lib/error-classifier";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { errorType } = body;

    // Simulate different types of AI errors for testing
    let testError: AIError;
    
    switch (errorType) {
      case 'quota':
        testError = new Error('Quota exceeded') as AIError;
        testError.status = 429;
        testError.code = 'RESOURCE_EXHAUSTED';
        break;
        
      case 'content':
        testError = new Error('Invalid input content') as AIError;
        testError.status = 400;
        testError.code = 'INVALID_ARGUMENT';
        break;
        
      case 'network':
        testError = new Error('Connection timeout') as AIError;
        testError.status = 503;
        testError.code = 'ETIMEDOUT';
        break;
        
      case 'unknown':
      default:
        testError = new Error('Unexpected AI service error') as AIError;
        testError.status = 500;
        break;
    }

    // Test error classification
    const classifiedError = errorClassifier.classifyError(testError, {
      userId: 'test-user',
      contentLength: 150,
      lessonType: 'discussion',
      apiEndpoint: '/api/test-error-handling'
    });

    const userMessage = errorClassifier.generateUserMessage(classifiedError);
    const supportMessage = errorClassifier.generateSupportMessage(classifiedError);

    return NextResponse.json({
      success: true,
      test: {
        originalError: {
          message: testError.message,
          status: testError.status,
          code: testError.code
        },
        classifiedError: {
          type: classifiedError.type,
          errorId: classifiedError.errorId
        },
        userMessage,
        supportMessage: {
          errorId: supportMessage.errorId,
          type: supportMessage.type,
          technicalDetails: supportMessage.technicalDetails,
          timestamp: supportMessage.timestamp
        }
      }
    });

  } catch (error) {
    console.error("Test error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Test failed" 
    }, { status: 500 });
  }
}