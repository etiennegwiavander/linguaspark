import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

console.log('[Supabase] Initializing with URL:', supabaseUrl)

// Browser client (for client components)
export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      // Refresh token before it expires
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    global: {
      headers: {
        'X-Client-Info': 'linguaspark-web'
      }
    }
  })
}

// Singleton pattern for browser client
let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    console.log('[Supabase] Creating new client instance')
    supabaseClient = createClient()
    
    // Set up auth state change listener to handle token refresh
    supabaseClient.auth.onAuthStateChange((event, session) => {
      console.log('[Supabase] Auth state changed:', event)
      if (event === 'TOKEN_REFRESHED') {
        console.log('[Supabase] Token refreshed successfully')
      }
      if (event === 'SIGNED_OUT') {
        console.log('[Supabase] User signed out')
      }
    })
  }
  return supabaseClient
}
