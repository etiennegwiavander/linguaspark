import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    console.log('[API] Getting auth token from request headers')
    
    // Get the Authorization header from the request
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader) {
      console.error('[API] No Authorization header')
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }
    
    console.log('[API] Fetching lessons with user token')
    
    // Make direct REST API call with user's token
    const response = await fetch(
      `${supabaseUrl}/rest/v1/lessons?order=created_at.desc&limit=100`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': authHeader,  // Forward the user's token
          'Content-Type': 'application/json',
        }
      }
    )
    
    console.log('[API] Supabase response status:', response.status)
    
    if (!response.ok) {
      const error = await response.text()
      console.error('[API] Supabase error:', error)
      return NextResponse.json({ error }, { status: response.status })
    }
    
    const lessons = await response.json()
    console.log('[API] Found', lessons.length, 'lessons')
    
    return NextResponse.json({ lessons })
  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
