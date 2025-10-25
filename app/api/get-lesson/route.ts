import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    console.log('[API] Get lesson - Getting auth token from request headers')
    
    // Get the Authorization header from the request
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader) {
      console.error('[API] No Authorization header')
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }
    
    // Get lesson ID from URL
    const url = new URL(request.url)
    const lessonId = url.searchParams.get('id')
    
    if (!lessonId) {
      return NextResponse.json({ error: 'No lesson ID provided' }, { status: 400 })
    }
    
    console.log('[API] Fetching lesson:', lessonId)
    
    // Create a Supabase client with the user's token
    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    })
    
    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('[API] Auth error:', authError)
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }
    
    console.log('[API] Authenticated user:', user.id)
    
    // Fetch lesson (RLS policy will ensure user owns it)
    const { data: lesson, error: fetchError } = await supabase
      .from("lessons")
      .select("*")
      .eq("id", lessonId)
      .eq("tutor_id", user.id)
      .single()
    
    if (fetchError) {
      console.error('[API] Failed to fetch lesson:', fetchError)
      return NextResponse.json({ error: `Failed to fetch lesson: ${fetchError.message}` }, { status: 404 })
    }
    
    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }
    
    console.log('[API] ✅ Lesson fetched successfully:', lesson.title)
    return NextResponse.json({ lesson })
  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
