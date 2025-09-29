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

    console.log("🎓 Generated lesson structure:", {
      hasLesson: !!lesson,
      hasSections: !!lesson?.sections,
      sectionKeys: lesson?.sections ? Object.keys(lesson.sections) : [],
      lessonType: lesson?.lessonType,
      studentLevel: lesson?.studentLevel,
      targetLanguage: lesson?.targetLanguage,
      warmupQuestions: lesson?.sections?.warmup?.length || 0,
      vocabularyItems: lesson?.sections?.vocabulary?.length || 0
    })

    // Check if we have a valid AI-generated lesson
    if (lesson && lesson.sections && Object.keys(lesson.sections).length > 0) {
      console.log("✅ Using AI-generated lesson content")
      
      // Use AI-generated content with minimal fallbacks only for missing properties
      const finalLesson = {
        lessonType: lesson.lessonType || lessonType,
        studentLevel: lesson.studentLevel || studentLevel,
        targetLanguage: lesson.targetLanguage || targetLanguage,
        sections: lesson.sections // Use AI-generated sections as-is
      }
      
      console.log("🎉 Returning AI-generated lesson with sections:", Object.keys(finalLesson.sections))
      
      // Save and return the AI-generated lesson
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
          lesson_data: finalLesson,
        })
        .select()
        .single()

      if (saveError) {
        console.error("Error saving lesson:", saveError)
        return NextResponse.json({ lesson: finalLesson })
      }

      return NextResponse.json({
        lesson: {
          ...finalLesson,
          id: savedLesson.id,
        },
      })
    }

    // Only use fallback if AI generation completely failed
    console.warn("⚠️ AI generation failed, using fallback lesson structure")
    const safeLesson = {
      lessonType: lessonType,
      studentLevel: studentLevel,
      targetLanguage: targetLanguage,
      sections: {
        warmup: ["What do you already know about this topic?", "Have you had similar experiences?", "What would you like to learn more about?"],
        vocabulary: [],
        reading: sourceText.substring(0, 500),
        comprehension: ["What is the main idea of this text?", "What supporting details can you identify?"],
        discussion: ["What is your opinion on this topic?", "How would you handle this situation?"],
        grammar: {
          focus: "Present Perfect Tense",
          examples: ["I have learned many new things.", "She has improved her skills."],
          exercise: ["I _____ (learn) a lot today.", "They _____ (complete) the project."]
        },
        pronunciation: {
          word: "communication",
          ipa: "/kəˌmjuːnɪˈkeɪʃən/",
          practice: "Practice saying: communication in a sentence."
        },
        wrapup: ["What new vocabulary did you learn?", "Which concepts need more practice?"]
      }
    }

    console.log("✅ Using fallback lesson structure")

    // Save fallback lesson to database
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
        lesson_data: safeLesson,
      })
      .select()
      .single()

    if (saveError) {
      console.error("Error saving lesson:", saveError)
      return NextResponse.json({ lesson: safeLesson })
    }

    return NextResponse.json({
      lesson: {
        ...safeLesson,
        id: savedLesson.id,
      },
    })
  } catch (error) {
    console.error("Error generating lesson:", error)
    return NextResponse.json({ error: "Failed to generate lesson" }, { status: 500 })
  }
}
