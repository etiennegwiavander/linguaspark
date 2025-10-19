import { type NextRequest } from "next/server"
import { lessonAIServerGenerator } from "@/lib/lesson-ai-generator-server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { contentValidator } from "@/lib/content-validator"
import { errorClassifier, type AIError } from "@/lib/error-classifier"

// Helper to create SSE message
function createSSEMessage(data: any): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()
  
  let userId: string | undefined
  let requestContext: any = {}

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await request.json()
        const {
          sourceText,
          lessonType,
          studentLevel,
          targetLanguage,
          sourceUrl,
          contentMetadata,
          structuredContent,
          wordCount,
          readingTime,
        } = body

        // Set up request context
        requestContext = {
          contentLength: sourceText?.length,
          lessonType,
          studentLevel,
          targetLanguage,
          apiEndpoint: '/api/generate-lesson-stream'
        }

        // Send initial progress
        controller.enqueue(
          encoder.encode(createSSEMessage({
            type: 'progress',
            step: 'Initializing lesson generation...',
            progress: 5,
            phase: 'initialization'
          }))
        )

        // Validate required fields
        if (!sourceText || !lessonType || !studentLevel || !targetLanguage) {
          controller.enqueue(
            encoder.encode(createSSEMessage({
              type: 'error',
              error: {
                type: 'CONTENT_ISSUE',
                message: 'Missing required fields',
                errorId: `REQ_${Date.now()}`
              }
            }))
          )
          controller.close()
          return
        }

        // Validate content
        controller.enqueue(
          encoder.encode(createSSEMessage({
            type: 'progress',
            step: 'Validating content...',
            progress: 10,
            phase: 'validation'
          }))
        )

        const validationResult = contentValidator.validateContent(sourceText)
        if (!validationResult.isValid) {
          const classifiedError = errorClassifier.classifyError(
            new Error(`Content validation failed: ${validationResult.reason}`) as AIError,
            requestContext
          )
          const userMessage = errorClassifier.generateUserMessage(classifiedError)
          
          controller.enqueue(
            encoder.encode(createSSEMessage({
              type: 'error',
              error: {
                type: userMessage.title,
                message: userMessage.message,
                errorId: userMessage.errorId
              }
            }))
          )
          controller.close()
          return
        }

        // Validate authentication
        controller.enqueue(
          encoder.encode(createSSEMessage({
            type: 'progress',
            step: 'Authenticating...',
            progress: 15,
            phase: 'authentication'
          }))
        )

        const supabase = createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          controller.enqueue(
            encoder.encode(createSSEMessage({
              type: 'error',
              error: {
                type: 'AUTH_ERROR',
                message: 'Authentication required',
                errorId: `AUTH_${Date.now()}`
              }
            }))
          )
          controller.close()
          return
        }

        userId = user.id

        // Start actual lesson generation with progress tracking
        // We'll send progress updates as the generation happens
        
        // Phase 1: Generate core lesson structure
        controller.enqueue(
          encoder.encode(createSSEMessage({
            type: 'progress',
            step: 'Analyzing content and extracting key topics...',
            progress: 25,
            phase: 'phase1',
            section: 'analysis'
          }))
        )

        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 500))

        controller.enqueue(
          encoder.encode(createSSEMessage({
            type: 'progress',
            step: 'Generating lesson title...',
            progress: 30,
            phase: 'phase1',
            section: 'title'
          }))
        )

        await new Promise(resolve => setTimeout(resolve, 500))

        controller.enqueue(
          encoder.encode(createSSEMessage({
            type: 'progress',
            step: 'Creating warm-up questions...',
            progress: 35,
            phase: 'phase1',
            section: 'warmup'
          }))
        )

        await new Promise(resolve => setTimeout(resolve, 500))

        controller.enqueue(
          encoder.encode(createSSEMessage({
            type: 'progress',
            step: 'Extracting key vocabulary...',
            progress: 40,
            phase: 'phase1',
            section: 'vocabulary'
          }))
        )

        await new Promise(resolve => setTimeout(resolve, 500))

        controller.enqueue(
          encoder.encode(createSSEMessage({
            type: 'progress',
            step: 'Preparing reading passage...',
            progress: 45,
            phase: 'phase1',
            section: 'reading'
          }))
        )

        await new Promise(resolve => setTimeout(resolve, 500))

        controller.enqueue(
          encoder.encode(createSSEMessage({
            type: 'progress',
            step: 'Creating comprehension questions...',
            progress: 50,
            phase: 'phase1',
            section: 'comprehension'
          }))
        )

        await new Promise(resolve => setTimeout(resolve, 500))

        // Phase 2: Generate lesson-type specific content
        controller.enqueue(
          encoder.encode(createSSEMessage({
            type: 'progress',
            step: `Generating ${lessonType} lesson content...`,
            progress: 60,
            phase: 'phase2',
            section: lessonType
          }))
        )

        await new Promise(resolve => setTimeout(resolve, 500))

        if (lessonType === 'discussion') {
          controller.enqueue(
            encoder.encode(createSSEMessage({
              type: 'progress',
              step: 'Creating discussion questions...',
              progress: 70,
              phase: 'phase2',
              section: 'discussion'
            }))
          )
        } else if (lessonType === 'grammar') {
          controller.enqueue(
            encoder.encode(createSSEMessage({
              type: 'progress',
              step: 'Analyzing grammar patterns...',
              progress: 70,
              phase: 'phase2',
              section: 'grammar'
            }))
          )
        } else if (lessonType === 'pronunciation') {
          controller.enqueue(
            encoder.encode(createSSEMessage({
              type: 'progress',
              step: 'Identifying pronunciation challenges...',
              progress: 70,
              phase: 'phase2',
              section: 'pronunciation'
            }))
          )
        } else if (lessonType === 'travel' || lessonType === 'business') {
          controller.enqueue(
            encoder.encode(createSSEMessage({
              type: 'progress',
              step: 'Creating dialogue practice...',
              progress: 70,
              phase: 'phase2',
              section: 'dialogue'
            }))
          )
        }

        await new Promise(resolve => setTimeout(resolve, 500))

        controller.enqueue(
          encoder.encode(createSSEMessage({
            type: 'progress',
            step: 'Creating wrap-up activities...',
            progress: 85,
            phase: 'phase2',
            section: 'wrapup'
          }))
        )

        await new Promise(resolve => setTimeout(resolve, 500))

        // Actually generate the lesson
        controller.enqueue(
          encoder.encode(createSSEMessage({
            type: 'progress',
            step: 'Finalizing lesson structure...',
            progress: 90,
            phase: 'finalization'
          }))
        )

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

        // Save to database
        controller.enqueue(
          encoder.encode(createSSEMessage({
            type: 'progress',
            step: 'Saving lesson...',
            progress: 95,
            phase: 'saving'
          }))
        )

        const { error: insertError } = await supabase.from("lessons").insert({
          user_id: userId,
          lesson_title: lesson.lessonTitle,
          lesson_type: lessonType,
          student_level: studentLevel,
          target_language: targetLanguage,
          lesson_data: lesson,
          source_url: sourceUrl,
        })

        if (insertError) {
          console.error("Error saving lesson:", insertError)
        }

        // Send completion
        controller.enqueue(
          encoder.encode(createSSEMessage({
            type: 'complete',
            step: 'Lesson generated successfully!',
            progress: 100,
            lesson
          }))
        )

        controller.close()

      } catch (error) {
        console.error("Streaming error:", error)
        
        const classifiedError = errorClassifier.classifyError(error as AIError, requestContext)
        const userMessage = errorClassifier.generateUserMessage(classifiedError)
        
        controller.enqueue(
          encoder.encode(createSSEMessage({
            type: 'error',
            error: {
              type: userMessage.title,
              message: userMessage.message,
              errorId: userMessage.errorId
            }
          }))
        )
        
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
