import { NextRequest, NextResponse } from "next/server"
import { getSupabaseClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      return NextResponse.json({
        success: false,
        error: "Authentication error",
        details: userError.message
      }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        error: "No authenticated user"
      }, { status: 401 })
    }

    // Try to fetch lessons with detailed error info
    const { data: lessons, error: lessonsError, count } = await supabase
      .from("lessons")
      .select("*", { count: 'exact' })
      .eq("tutor_id", user.id)
      .order("created_at", { ascending: false })

    // Also try to fetch ALL lessons (to see if RLS is the issue)
    const { data: allLessons, error: allLessonsError } = await supabase
      .from("lessons")
      .select("id, title, tutor_id, created_at")
      .order("created_at", { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      userLessons: {
        count: count,
        data: lessons,
        error: lessonsError
      },
      allLessons: {
        data: allLessons,
        error: allLessonsError
      }
    })
  } catch (error) {
    console.error("Debug lessons error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
