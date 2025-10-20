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
  
  // Track current progress state for error reporting
  let currentProgressState = {
    step: 'Not started',
    progress: 0,
    phase: 'initialization',
    section: undefined as string | undefined
  }

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
        currentProgressState = {
          step: 'Initializing lesson generation...',
          progress: 5,
          phase: 'initialization',
          section: undefined
        }
        controller.enqueue(
          encoder.encode(createSSEMessage({
            type: 'progress',
            ...currentProgressState
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
              },
              progressState: currentProgressState
            }))
          )
          controller.close()
          return
        }

        // Validate content
        currentProgressState = {
          step: 'Validating content...',
          progress: 10,
          phase: 'validation',
          section: undefined
        }
        controller.enqueue(
          encoder.encode(createSSEMessage({
            type: 'progress',
            ...currentProgressState
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
              },
              progressState: currentProgressState
            }))
          )
          controller.close()
          return
        }

        // Validate authentication
        currentProgressState = {
          step: 'Authenticating...',
          progress: 15,
          phase: 'authentication',
          section: undefined
        }
        controller.enqueue(
          encoder.encode(createSSEMessage({
            type: 'progress',
            ...currentProgressState
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
              },
              progressState: currentProgressState
            }))
          )
          controller.close()
          return
        }

        userId = user.id

        // Create progress callback that streams real-time updates to frontend
        const progressCallback = (update: {
          step: string
          progress: number
          phase: string
          section?: string
        }) => {
          try {
            // Update current progress state for error reporting
            currentProgressState = {
              step: update.step,
              progress: update.progress,
              phase: update.phase,
              section: update.section
            }
            
            controller.enqueue(
              encoder.encode(createSSEMessage({
                type: 'progress',
                ...currentProgressState
              }))
            )
          } catch (error) {
            // Log but don't throw - generation should continue even if streaming fails
            console.error('Failed to stream progress update:', error)
          }
        }

        // Generate the lesson with real-time progress callbacks
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
          onProgress: progressCallback
        })

        // Save to database
        currentProgressState = {
          step: 'Saving lesson...',
          progress: 95,
          phase: 'saving',
          section: undefined
        }
        controller.enqueue(
          encoder.encode(createSSEMessage({
            type: 'progress',
            ...currentProgressState
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
        console.error("Progress state at error:", currentProgressState)
        
        const classifiedError = errorClassifier.classifyError(error as AIError, requestContext)
        const userMessage = errorClassifier.generateUserMessage(classifiedError)
        
        controller.enqueue(
          encoder.encode(createSSEMessage({
            type: 'error',
            error: {
              type: userMessage.title,
              message: userMessage.message,
              errorId: userMessage.errorId
            },
            progressState: currentProgressState
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
