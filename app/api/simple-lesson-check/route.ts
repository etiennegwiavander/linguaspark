import { NextResponse } from "next/server"
import { getSupabaseClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = getSupabaseClient()
    
    // Step 1: Check authentication
    console.log('[SimpleCheck] Step 1: Checking authentication...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      return NextResponse.json({
        step: 1,
        success: false,
        error: "Authentication error",
        details: authError.message
      })
    }

    if (!user) {
      return NextResponse.json({
        step: 1,
        success: false,
        error: "No authenticated user",
        message: "Please sign in first"
      })
    }

    console.log('[SimpleCheck] User authenticated:', user.email)

    // Step 2: Check if tutor profile exists
    console.log('[SimpleCheck] Step 2: Checking tutor profile...')
    const { data: tutorProfile, error: tutorError } = await supabase
      .from("tutors")
      .select("*")
      .eq("id", user.id)
      .single()

    const hasTutorProfile = !tutorError && tutorProfile !== null

    // Step 3: Count lessons for this user
    console.log('[SimpleCheck] Step 3: Counting lessons...')
    const { count: userLessonCount, error: countError } = await supabase
      .from("lessons")
      .select("*", { count: 'exact', head: true })
      .eq("tutor_id", user.id)

    // Step 4: Get sample lessons
    console.log('[SimpleCheck] Step 4: Fetching sample lessons...')
    const { data: sampleLessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("id, title, lesson_type, student_level, tutor_id, created_at")
      .eq("tutor_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)

    // Step 5: Count ALL lessons in database (to check if any exist)
    console.log('[SimpleCheck] Step 5: Counting all lessons...')
    const { count: totalLessonCount } = await supabase
      .from("lessons")
      .select("*", { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      tutorProfile: {
        exists: hasTutorProfile,
        data: tutorProfile,
        error: tutorError ? {
          code: tutorError.code,
          message: tutorError.message
        } : null
      },
      lessons: {
        userCount: userLessonCount,
        totalCount: totalLessonCount,
        sampleLessons: sampleLessons,
        errors: {
          count: countError ? countError.message : null,
          fetch: lessonsError ? lessonsError.message : null
        }
      },
      diagnosis: {
        isAuthenticated: true,
        hasTutorProfile: hasTutorProfile,
        hasLessons: (userLessonCount || 0) > 0,
        canSeeLessons: !lessonsError,
        issue: !hasTutorProfile ? "NO_TUTOR_PROFILE" :
               (userLessonCount || 0) === 0 && (totalLessonCount || 0) > 0 ? "LESSONS_EXIST_BUT_NOT_YOURS" :
               (userLessonCount || 0) === 0 ? "NO_LESSONS_YET" :
               lessonsError ? "FETCH_ERROR" :
               "OK"
      }
    })
  } catch (error) {
    console.error("[SimpleCheck] Unexpected error:", error)
    return NextResponse.json({
      success: false,
      error: "Unexpected error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
