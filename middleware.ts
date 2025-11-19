import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )
  
  const { pathname } = request.nextUrl
  
  // Public routes (no auth required)
  const publicRoutes = [
    '/',                      // Landing page
    '/library',               // Public library browse
    '/auth/admin/login',      // Admin login
    '/api/library/list',
    '/api/library/[id]'
  ]
  
  // TEMPORARY: Bypass middleware for admin routes due to cookie sync issues
  // TODO: Fix Supabase SSR cookie handling in middleware
  const bypassRoutes = [
    '/admin',
    '/popup',
    '/my-library',
    '/api/admin/check-status',  // Allow admin check API
    '/api/get-lessons',          // Allow personal library API
    '/api/get-lesson',           // Allow single lesson fetch
    '/api/save-lesson',          // Allow lesson save
    '/api/delete-lesson',        // Allow lesson delete
    '/api/generate-lesson',      // Allow lesson generation
    '/api/generate-lesson-stream' // Allow streaming generation
  ]
  
  // Check if route should bypass middleware
  if (bypassRoutes.some(route => pathname.startsWith(route))) {
    console.log('[Middleware] Bypassing middleware for:', pathname)
    return response
  }
  
  // Check if route is public or starts with public path
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || 
    pathname.startsWith('/library/') ||
    pathname.startsWith('/api/public-lessons/')
  )
  
  if (isPublicRoute) {
    return response
  }
  
  // Protected routes require admin authentication
  const { data: { session } } = await supabase.auth.getSession()
  
  console.log('[Middleware] Path:', pathname)
  console.log('[Middleware] Session exists:', !!session)
  console.log('[Middleware] User email:', session?.user?.email)
  
  if (!session) {
    console.log('[Middleware] No session, redirecting to login')
    const redirectUrl = new URL('/auth/admin/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  // Verify admin status for protected routes
  const { data: tutor, error: tutorError } = await supabase
    .from('tutors')
    .select('is_admin')
    .eq('id', session.user.id)
    .single()
  
  console.log('[Middleware] Tutor query result:', { tutor, tutorError })
  console.log('[Middleware] is_admin:', tutor?.is_admin)
  
  if (!tutor?.is_admin) {
    // Non-admin trying to access admin route
    console.log('[Middleware] Not admin, redirecting to home')
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  console.log('[Middleware] Admin verified, allowing access')
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
