import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lessonId, exportType } = body

    // Validate required fields
    if (!lessonId || !exportType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["pdf", "word"].includes(exportType)) {
      return NextResponse.json({ error: "Invalid export type" }, { status: 400 })
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

    // Get lesson data
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("*")
      .eq("id", lessonId)
      .eq("tutor_id", user.id)
      .single()

    if (lessonError || !lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    // Record export in database
    const { error: exportError } = await supabase.from("lesson_exports").insert({
      lesson_id: lessonId,
      export_type: exportType,
      file_path: null, // Client-side export, no server file path
    })

    if (exportError) {
      console.error("Error recording export:", exportError)
    }

    // Return lesson data for client-side export
    return NextResponse.json({
      lesson: {
        id: lesson.id,
        title: lesson.title,
        lessonType: lesson.lesson_type,
        studentLevel: lesson.student_level,
        targetLanguage: lesson.target_language,
        sections: lesson.lesson_data.sections,
      },
    })
  } catch (error) {
    console.error("Error in export API:", error)
    return NextResponse.json({ error: "Failed to prepare export" }, { status: 500 })
  }
}
