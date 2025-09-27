import { getSupabaseClient } from "./supabase"

export interface User {
  id: string
  email: string
  full_name?: string
}

export interface AuthState {
  user: User | null
  loading: boolean
}

export const authService = {
  async signUp(email: string, password: string, fullName?: string) {
    const supabase = getSupabaseClient()

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

    // Create tutor profile
    if (data.user) {
      const { error: profileError } = await supabase.from("tutors").insert({
        id: data.user.id,
        email: data.user.email!,
        full_name: fullName,
      })

      if (profileError) {
        console.error("Error creating tutor profile:", profileError)
      }
    }

    return data
  },

  async signIn(email: string, password: string) {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  },

  async signOut() {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getCurrentUser() {
    const supabase = getSupabaseClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) throw error
    return user
  },

  async updateProfile(updates: { full_name?: string }) {
    const supabase = getSupabaseClient()
    const user = await this.getCurrentUser()

    if (!user) throw new Error("No authenticated user")

    const { error } = await supabase.from("tutors").update(updates).eq("id", user.id)

    if (error) throw error
  },
}
