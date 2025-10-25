import { NextResponse } from "next"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Missing Supabase credentials" },
        { status: 500 }
      )
    }

    console.log("[Test] Creating Supabase client...")
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log("[Test] Getting user session...")
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error("[Test] Auth error:", authError)
      return NextResponse.json(
        { error: "Auth error", details: authError.message },
        { status: 401 }
      )
    }

    if (!user) {
      console.error("[Test] No user found")
      return NextResponse.json(
        { error: "No authenticated user" },
        { status: 401 }
      )
    }

    console.log("[Test] User authenticated:", user.id, user.email)

    console.log("[Test] Querying lessons table...")
    const { data, error, count } = await supabase
      .from("lessons")
      .select("*", { count: "exact" })
      .eq("tutor_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[Test] Database error:", error)
      return NextResponse.json(
        {
          error: "Database query failed",
          details: error.message,
          code: error.code,
          hint: error.hint,
        },
        { status: 500 }
      )
    }

    console.log("[Test] Query successful!")
    console.log("[Test] Found", data?.length || 0, "lessons")
    console.log("[Test] Total count:", count)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
      lessons: data,
      count: count,
      message: `Found ${data?.length || 0} lessons for user ${user.email}`,
    })
  } catch (error) {
    console.error("[Test] Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Unexpected error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
