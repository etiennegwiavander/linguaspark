import { type NextRequest, NextResponse } from "next/server"
import { lessonAIServerGenerator } from "@/lib/lesson-ai-generator-server" // Updated import to use server-side generator
import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
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
      readingTime
    } = body

    // Validate required fields
    if (!sourceText || !lessonType || !studentLevel || !targetLanguage) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate user authentication
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Generate lesson using enhanced AI pipeline with contextual information
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

    // Save lesson to database
    const { data: savedLesson, error: saveError } = await supabase
      .from("lessons")
      .insert({
        tutor_id: user.id,
        title: `${lessonType} Lesson - ${new Date().toLocaleDateString()}`,
        lesson_type: lessonType,
        student_level: studentLevel,
        target_language: targetLanguage,
        source_url: sourceUrl,
        source_text: sourceText,
        lesson_data: lesson,
      })
      .select()
      .single()

    if (saveError) {
      console.error("Error saving lesson:", saveError)
      // Return lesson even if save fails
      return NextResponse.json({ lesson })
    }

    return NextResponse.json({
      lesson: {
        ...lesson,
        id: savedLesson.id,
      },
    })
  } catch (error) {
    console.error("Error generating lesson:", error)
    return NextResponse.json({ error: "Failed to generate lesson" }, { status: 500 })
  }
}
