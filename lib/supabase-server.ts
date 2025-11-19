import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Server client (for API routes and server components)
export const createServerSupabaseClient = async (accessToken?: string) => {
  const cookieStore = await cookies()

  const client = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    }
  })

  // If an access token is provided, set it as the session
  if (accessToken) {
    await client.auth.setSession({
      access_token: accessToken,
      refresh_token: '' // Not needed for Bearer token auth
    })
  }

  return client
}
