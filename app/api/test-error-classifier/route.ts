import { NextRequest, NextResponse } from 'next/server';
import { errorClassifier, AIError, ErrorType } from '@/lib/error-classifier';

export async function POST(request: NextRequest) {
  try {
    const { errorType, message, code, status } = await request.json();

    // Create mock AI error based on test parameters
    const mockError: AIError = new Error(message || 'Test error') as AIError;
    
    if (code) mockError.code = code;
    if (status) mockError.status = status;

    // Add specific properties based on error type for testing
    switch (errorType) {
      case 'quota':
        mockError.message = 'Rate limit exceeded';
        mockError.status = 429;
        mockError.code = 'RESOURCE_EXHAUSTED';
        break;
      case 'network':
        mockError.message = 'Network connection failed';
        mockError.code = 'ECONNREFUSED';
        break;
      case 'content':
        mockError.message = 'Invalid input content';
        mockError.status = 400;
        mockError.code = 'INVALID_ARGUMENT';
        break;
      case 'unknown':
        mockError.message = 'Unexpected error occurred';
        break;
    }

    // Test error classification
    const context = {
      userId: 'test-user-123',
      contentLength: 500,
      lessonType: 'discussion',
      requestId: 'req-test-123',
      apiEndpoint: '/api/generate-lesson'
    };

    const classifiedError = errorClassifier.classifyError(mockError, context);
    const userMessage = errorClassifier.generateUserMessage(classifiedError);
    const supportMessage = errorClassifier.generateSupportMessage(classifiedError);

    return NextResponse.json({
      success: true,
      results: {
        originalError: {
          message: mockError.message,
          code: mockError.code,
          status: mockError.status
        },
        classifiedError: {
          type: classifiedError.type,
          errorId: classifiedError.errorId,
          context: classifiedError.context
        },
        userMessage,
        supportMessage: {
          ...supportMessage,
          stackTrace: supportMessage.stackTrace ? '[STACK TRACE PRESENT]' : undefined
        }
      }
    });

  } catch (error) {
    console.error('Error testing error classifier:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test error classifier',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Error Classifier Test Endpoint',
    usage: 'POST with { errorType: "quota" | "network" | "content" | "unknown", message?, code?, status? }',
    examples: [
      {
        description: 'Test quota exceeded error',
        payload: { errorType: 'quota' }
      },
      {
        description: 'Test network error',
        payload: { errorType: 'network' }
      },
      {
        description: 'Test content error',
        payload: { errorType: 'content' }
      },
      {
        description: 'Test unknown error',
        payload: { errorType: 'unknown' }
      },
      {
        description: 'Test custom error',
        payload: { 
          errorType: 'custom',
          message: 'Custom error message',
          code: 'CUSTOM_CODE',
          status: 500
        }
      }
    ]
  });
}