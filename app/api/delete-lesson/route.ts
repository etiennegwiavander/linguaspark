import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function DELETE(request: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

        console.log('[API] Delete lesson - Getting auth token from request headers')

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

        console.log('[API] Deleting lesson:', lessonId)

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

        // Delete lesson (RLS policy will ensure user owns it)
        const { error: deleteError } = await supabase
            .from("lessons")
            .delete()
            .eq("id", lessonId)
            .eq("tutor_id", user.id)

        if (deleteError) {
            console.error('[API] Failed to delete lesson:', deleteError)
            return NextResponse.json({ error: `Failed to delete lesson: ${deleteError.message}` }, { status: 500 })
        }

        console.log('[API] ✅ Lesson deleted successfully')
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[API] Error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
