import { type NextRequest, NextResponse } from "next/server"
import { lessonAIServerGenerator } from "@/lib/lesson-ai-generator-server" // Updated import to use server-side generator
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { contentValidator } from "@/lib/content-validator"
import { errorClassifier, type AIError } from "@/lib/error-classifier"
import { usageMonitor, type GenerationContext } from "@/lib/usage-monitor"

export async function POST(request: NextRequest) {
  let userId: string | undefined;
  let requestContext: any = {};
  let lessonType: string | undefined;
  let studentLevel: string | undefined;
  let targetLanguage: string | undefined;
  let sourceText: string | undefined;

  try {
    const body = await request.json()
    const bodyData = body as { 
      sourceText: string;
      lessonType: string;
      studentLevel: string;
      targetLanguage: string;
      sourceUrl?: string;
      contentMetadata?: any;
      structuredContent?: any;
      wordCount?: number;
      readingTime?: number;
    };
    
    sourceText = bodyData.sourceText;
    lessonType = bodyData.lessonType;
    studentLevel = bodyData.studentLevel;
    targetLanguage = bodyData.targetLanguage;
    const sourceUrl = bodyData.sourceUrl;
    const contentMetadata = bodyData.contentMetadata;
    const structuredContent = bodyData.structuredContent;
    const wordCount = bodyData.wordCount;
    const readingTime = bodyData.readingTime;

    // Set up request context for error logging
    requestContext = {
      contentLength: sourceText?.length,
      lessonType,
      studentLevel,
      targetLanguage,
      apiEndpoint: '/api/generate-lesson'
    };

    // Validate required fields
    if (!sourceText || !lessonType || !studentLevel || !targetLanguage) {
      return NextResponse.json({ 
        success: false,
        error: {
          type: 'CONTENT_ISSUE',
          message: 'Missing required fields',
          actionableSteps: [
            'Ensure all required fields are provided',
            'Check that source text is selected',
            'Verify lesson type and student level are set'
          ],
          errorId: `REQ_${Date.now()}`
        }
      }, { status: 400 })
    }

    // Validate content before AI processing
    const validationResult = contentValidator.validateContent(sourceText)
    if (!validationResult.isValid) {
      const classifiedError = errorClassifier.classifyError(
        new Error(`Content validation failed: ${validationResult.reason}`) as AIError,
        requestContext
      );
      const userMessage = errorClassifier.generateUserMessage(classifiedError);
      const supportMessage = errorClassifier.generateSupportMessage(classifiedError);
      
      // Log error for support
      console.error("Content validation error:", supportMessage);
      
      return NextResponse.json({ 
        success: false,
        error: {
          type: userMessage.title,
          message: userMessage.message,
          actionableSteps: userMessage.actionableSteps,
          errorId: userMessage.errorId,
          supportContact: userMessage.supportContact
        }
      }, { status: 400 })
    }

    // Validate user authentication
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ 
        success: false,
        error: {
          type: 'AUTHENTICATION_ERROR',
          message: 'Authentication required',
          actionableSteps: [
            'Please log in to your account',
            'Refresh the page and try again',
            'Contact support if login issues persist'
          ],
          errorId: `AUTH_${Date.now()}`
        }
      }, { status: 401 })
    }

    userId = user.id;

    // Set up usage monitoring context
    const generationContext: GenerationContext = {
      userId: user.id,
      lessonId: `lesson_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lessonType,
      difficultyLevel: studentLevel,
      contentLength: sourceText.length,
      timestamp: new Date()
    };
    requestContext.userId = userId;

    // Generate lesson using AI-only approach
    console.log("🚀 Starting AI-only lesson generation...");
    
    const generationStartTime = Date.now();
    const lesson = await lessonAIServerGenerator.generateLesson({
      sourceText,
      lessonType,
      studentLevel,
      targetLanguage,
      sourceUrl,
      contentMetadata,
      structuredContent,
      wordCount,
      readingTime,
    })
    const generationEndTime = Date.now();

    // Log generation completion and basic metrics
    usageMonitor.logTokenUsage(
      'lesson-generation-complete',
      0, // Will be updated with actual token counts from AI calls
      'ai-only-generation',
      generationContext
    );

    // Validate AI-generated lesson - NO FALLBACKS
    if (!lesson || !lesson.sections || Object.keys(lesson.sections).length === 0) {
      throw new Error("AI generation returned empty or invalid lesson structure");
    }

    console.log("✅ AI lesson generation successful:", {
      lessonTitle: lesson.lessonTitle,
      sectionKeys: Object.keys(lesson.sections),
      lessonType: lesson.lessonType,
      studentLevel: lesson.studentLevel,
      targetLanguage: lesson.targetLanguage
    });

    // Prepare final lesson structure (AI-only, no fallbacks)
    const finalLesson = {
      lessonTitle: lesson.lessonTitle, // Include the AI-generated contextual title
      lessonType: lesson.lessonType,
      studentLevel: lesson.studentLevel,
      targetLanguage: lesson.targetLanguage,
      sections: lesson.sections
    };

    // Save the AI-generated lesson
    const { data: savedLesson, error: saveError } = await supabase
      .from("lessons")
      .insert({
        tutor_id: user.id,
        title: lesson.lessonTitle || `${lessonType} Lesson - ${new Date().toLocaleDateString()}`,
        lesson_type: lessonType,
        student_level: studentLevel,
        target_language: targetLanguage,
        source_url: sourceUrl,
        source_text: sourceText,
        lesson_data: finalLesson,
      })
      .select()
      .single()

    if (saveError) {
      console.error("Error saving lesson (non-critical):", saveError);
      // Return lesson even if save fails - this is not a generation failure
    }

    return NextResponse.json({
      success: true,
      lesson: {
        ...finalLesson,
        id: savedLesson?.id,
      },
    })

  } catch (error) {
    // Log error to usage monitor
    if (userId) {
      const errorContext: GenerationContext = {
        userId,
        lessonId: `lesson_${Date.now()}_error`,
        lessonType,
        difficultyLevel: studentLevel,
        contentLength: sourceText?.length || 0,
        timestamp: new Date()
      };
      usageMonitor.logError(error as Error, 'AI_GENERATION_FAILED', errorContext);
    }

    // Classify the error and generate appropriate response
    const aiError = error as AIError;
    const classifiedError = errorClassifier.classifyError(aiError, {
      ...requestContext,
      userId
    });
    
    const userMessage = errorClassifier.generateUserMessage(classifiedError);
    const supportMessage = errorClassifier.generateSupportMessage(classifiedError);
    
    // Log detailed error information for support and debugging
    console.error("AI lesson generation error:", {
      errorId: supportMessage.errorId,
      type: supportMessage.type,
      technicalDetails: supportMessage.technicalDetails,
      context: supportMessage.context,
      stackTrace: supportMessage.stackTrace
    });

    // Return structured error response (NO FALLBACK CONTENT)
    return NextResponse.json({ 
      success: false,
      error: {
        type: userMessage.title,
        message: userMessage.message,
        actionableSteps: userMessage.actionableSteps,
        errorId: userMessage.errorId,
        supportContact: userMessage.supportContact
      }
    }, { 
      status: classifiedError.type === 'QUOTA_EXCEEDED' ? 429 : 
              classifiedError.type === 'CONTENT_ISSUE' ? 400 :
              classifiedError.type === 'NETWORK_ERROR' ? 503 : 500 
    })
  }
}
