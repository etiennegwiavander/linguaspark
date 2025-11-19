"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, Shield, Home } from "lucide-react"
import Link from "next/link"

interface TutorData {
  is_admin: boolean
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = getSupabaseClient()

  if (!supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-vintage-cream">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Supabase client not initialized. Please check your environment variables.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Check if already authenticated and listen for auth changes
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // Check if user is admin
        const { data: tutor } = await supabase
          .from('tutors')
          .select('is_admin')
          .eq('id', session.user.id)
          .single() as { data: TutorData | null }

        if (tutor?.is_admin) {
          console.log('[AdminLogin] Admin user detected, redirecting to /admin/dashboard')
          // Use window.location for hard redirect
          window.location.href = '/admin/dashboard'
        }
      }
    }
    
    checkAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AdminLogin] Auth state changed:', event)
      
      if (event === 'SIGNED_IN' && session) {
        // Check if user is admin
        const { data: tutor } = await supabase
          .from('tutors')
          .select('is_admin')
          .eq('id', session.user.id)
          .single() as { data: TutorData | null }

        if (tutor?.is_admin) {
          console.log('[AdminLogin] Admin verified, redirecting to /admin/dashboard')
          // Use window.location for hard redirect to bypass any routing issues
          window.location.href = '/admin/dashboard'
        } else {
          console.log('[AdminLogin] Not an admin, signing out')
          await supabase.auth.signOut()
          setError('Access denied. This login is for admin users only.')
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Sign in with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      // Check if user is admin
      if (data.user) {
        const { data: tutor, error: tutorError } = await supabase
          .from('tutors')
          .select('is_admin')
          .eq('id', data.user.id)
          .single() as { data: TutorData | null; error: any }

        if (tutorError) {
          throw new Error('Failed to verify admin status')
        }

        if (!tutor?.is_admin) {
          // Sign out non-admin user
          await supabase.auth.signOut()
          throw new Error('Access denied. This login is for admin users only.')
        }

        // Don't redirect here - let the onAuthStateChange listener handle it
        // This prevents the loading state from getting stuck
        console.log('[AdminLogin] Sign in successful, waiting for auth state change...')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in')
      setLoading(false)
    }
    // Don't set loading to false in finally - let the redirect happen
  }

  return (
    <div className="min-h-screen bg-vintage-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 bg-vintage-gold/20 rounded-full blur-sm"></div>
              <img 
                src="/mascot.png" 
                alt="Sparky Mascot" 
                className="relative w-full h-full object-contain"
              />
            </div>
            <Shield className="h-8 w-8 text-vintage-burgundy" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-vintage-brown mb-2">
            Admin Login
          </h1>
          <p className="text-vintage-brown/70">
            Sign in to manage the public lesson library
          </p>
        </div>

        {/* Login Card */}
        <div className="vintage-card p-8">
          <form onSubmit={handleSignIn} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-2 border-red-600">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-vintage-brown font-serif">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@admin.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="border-2 border-vintage-brown focus:border-vintage-burgundy"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-vintage-brown font-serif">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="border-2 border-vintage-brown focus:border-vintage-burgundy"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full vintage-button-primary text-lg py-6"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-5 w-5" />
                  Sign In as Admin
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-vintage-brown/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-vintage-cream text-vintage-brown/60 font-serif">
                Not an admin?
              </span>
            </div>
          </div>

          {/* Regular User Link */}
          <div className="text-center space-y-3">
            <Link href="/">
              <Button variant="outline" className="w-full vintage-button-secondary">
                <Home className="mr-2 h-4 w-4" />
                Go to Homepage
              </Button>
            </Link>
            <p className="text-sm text-vintage-brown/60">
              Regular users can browse the{" "}
              <Link href="/library" className="text-vintage-burgundy hover:underline font-medium">
                Public Library
              </Link>
            </p>
          </div>
        </div>

        {/* Admin Info */}
        <div className="mt-6 p-4 bg-vintage-gold/10 border-2 border-vintage-gold rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-vintage-burgundy flex-shrink-0 mt-0.5" />
            <div className="text-sm text-vintage-brown/80">
              <p className="font-semibold mb-1">Admin Credentials</p>
              <p className="mb-2">
                Use these credentials to sign in as an admin:
              </p>
              <div className="font-mono text-xs bg-vintage-cream/50 p-2 rounded border border-vintage-brown/20">
                <p>Email: <span className="font-semibold">admin@admin.com</span></p>
                <p>Password: <span className="font-semibold">admin123</span></p>
              </div>
              <p className="mt-2 text-xs">
                Make sure this account exists in your Supabase database with <code className="bg-vintage-brown/10 px-1 rounded">is_admin = true</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
