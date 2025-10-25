import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    console.log('[API] Save lesson - Getting auth token from request headers')
    
    // Get the Authorization header from the request
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader) {
      console.error('[API] No Authorization header')
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }
    
    const body = await request.json()
    const { title, lesson_type, student_level, target_language, source_url, lesson_data } = body
    
    console.log('[API] Saving lesson:', { title, lesson_type, student_level, target_language })
    
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
    
    // Check if tutor profile exists
    const { data: tutorProfile, error: tutorError } = await supabase
      .from("tutors")
      .select("id")
      .eq("id", user.id)
      .single()
    
    if (tutorError && tutorError.code !== 'PGRST116') {
      console.error('[API] Error checking tutor profile:', tutorError)
    }
    
    if (!tutorProfile) {
      console.log('[API] Creating tutor profile...')
      const { error: createTutorError } = await supabase
        .from("tutors")
        .insert({
          id: user.id,
          email: user.email || '',
        })
      
      if (createTutorError) {
        console.error('[API] Failed to create tutor profile:', createTutorError)
        return NextResponse.json({ error: `Failed to create tutor profile: ${createTutorError.message}` }, { status: 500 })
      }
      console.log('[API] ✅ Tutor profile created')
    }
    
    // Insert lesson
    const { data: lesson, error: insertError } = await supabase
      .from("lessons")
      .insert({
        title,
        lesson_type,
        student_level,
        target_language,
        source_url,
        lesson_data,
        tutor_id: user.id,
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('[API] Failed to insert lesson:', insertError)
      return NextResponse.json({ error: `Failed to save lesson: ${insertError.message}` }, { status: 500 })
    }
    
    console.log('[API] ✅ Lesson saved successfully:', lesson.id)
    return NextResponse.json({ lesson })
  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
