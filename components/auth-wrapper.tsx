"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"
import type { User } from "@supabase/supabase-js"
import { getSupabaseClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName?: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseClient()

  const createTutorProfile = async (user: User) => {
    try {
      // Check if tutor profile already exists
      const { data: existingTutor } = await supabase
        .from("tutors")
        .select("id")
        .eq("id", user.id)
        .single()

      if (!existingTutor) {
        // Create tutor profile
        const { error: profileError } = await supabase.from("tutors").insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || null,
        })

        if (profileError) {
          console.error("Error creating tutor profile:", profileError)
        } else {
          console.log("Tutor profile created successfully")
        }
      }
    } catch (error) {
      console.error("Error in createTutorProfile:", error)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)

      // Create tutor profile if user exists and is confirmed
      if (session?.user && session.user.email_confirmed_at) {
        createTutorProfile(session.user)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)

      // Create tutor profile when user signs in or confirms email
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        await createTutorProfile(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) throw error

    console.log("Signup response:", data)

    // Check if user needs email confirmation
    if (data.user && !data.session) {
      console.log("User created but needs email confirmation")
    } else if (data.user && data.session) {
      console.log("User created and automatically signed in")
    }
  }

  const signOut = async () => {
    console.log('[AuthWrapper] Starting sign out...')

    try {
      // Add timeout to prevent hanging
      const signOutPromise = supabase.auth.signOut({ scope: 'global' })
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Sign out timeout')), 5000)
      )

      const { error } = await Promise.race([signOutPromise, timeoutPromise]) as any

      if (error) {
        console.error('[AuthWrapper] Sign out error:', error)
        // Don't throw, just continue to clear state
      }

      console.log('[AuthWrapper] Sign out successful')
    } catch (error) {
      console.error('[AuthWrapper] Sign out failed or timed out:', error)
      // Continue anyway to clear client state
    }

    console.log('[AuthWrapper] Clearing state and redirecting...')

    // Clear user state immediately
    setUser(null)

    // Clear all local storage related to auth
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.includes('supabase') || key.includes('auth')) {
          localStorage.removeItem(key)
        }
      })
    } catch (e) {
      console.error('[AuthWrapper] Error clearing localStorage:', e)
    }

    // Use replace to prevent back button from returning to authenticated page
    window.location.replace('/signin')
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

interface AuthWrapperProps {
  children: React.ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  return (
    <AuthProvider>
      <AuthGuard>{children}</AuthGuard>
    </AuthProvider>
  )
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const supabase = getSupabaseClient()

  useEffect(() => {
    // Redirect to sign in if not authenticated
    if (!loading && !user) {
      window.location.href = '/signin'
    }

    // Re-verify session when page becomes visible (e.g., after browser back button)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user) {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) {
            // Session expired but user state still exists - force reload
            console.log('[AuthGuard] Session expired on visibility change, reloading...')
            window.location.replace('/signin')
          }
        } catch (error) {
          console.error('[AuthGuard] Error verifying session:', error)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    // Show loading while redirecting
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}


