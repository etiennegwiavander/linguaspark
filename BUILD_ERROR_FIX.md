# Build Error Fix - Separated Server and Client Supabase Files

## Problem
Build failed with error:
```
You're importing a component that needs next/headers. 
That only works in a Server Component
```

## Root Cause
`next/headers` (used for cookies) can't be imported in files that are also used by client components. The `lib/supabase.ts` file was being imported by both:
- Client components (React components in browser)
- API routes (server-side)

## Solution
Split into two separate files:

### 1. `lib/supabase.ts` (Client Only)
- Contains browser client
- No `next/headers` import
- Used by React components

### 2. `lib/supabase-server.ts` (Server Only)  
- Contains server client
- Imports `next/headers`
- Used by API routes only

### 3. `lib/lessons.ts` (Universal)
- Dynamically imports server client when needed
- Uses browser client in browser context
- Works in both environments

## Files Changed

### Created: `lib/supabase-server.ts`
```typescript
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies()
  return createServerClient(...)
}
```

### Updated: `lib/supabase.ts`
Removed server client code, kept only browser client.

### Updated: `lib/lessons.ts`
```typescript
async function getClient() {
  if (typeof window === 'undefined') {
    // Dynamic import to avoid bundling in client
    const { createServerSupabaseClient } = await import("./supabase-server")
    return await createServerSupabaseClient()
  }
  return getSupabaseClient()
}
```

### Updated: API Routes
- `app/api/simple-lesson-check/route.ts`
- `app/api/debug-lessons/route.ts`

Changed imports from:
```typescript
import { createServerSupabaseClient } from "@/lib/supabase"
```

To:
```typescript
import { createServerSupabaseClient } from "@/lib/supabase-server"
```

## Why This Works

**The Problem:**
- Client components can't import files that use `next/headers`
- Build process bundles everything together
- `next/headers` only works on server

**The Solution:**
- Separate files = separate bundles
- Client bundle doesn't include `supabase-server.ts`
- Dynamic import in `lessons.ts` only loads server code when on server
- API routes directly import server file

## Key Concept: Dynamic Imports

```typescript
// Static import - bundled in client code ❌
import { createServerSupabaseClient } from "./supabase-server"

// Dynamic import - only loaded when executed ✅
const { createServerSupabaseClient } = await import("./supabase-server")
```

Dynamic imports are only executed at runtime, so the server-only code never gets bundled into the client.

## Testing

Build should now succeed:
```bash
npm run build
```

Then test:
1. Generate a lesson - should save to database
2. Visit `/library` - should show lessons
3. Visit `/api/simple-lesson-check` - should show user info

## Files Summary

**Client-Safe Files:**
- `lib/supabase.ts` - Browser client only
- `lib/lessons.ts` - Universal (dynamic import)
- All React components

**Server-Only Files:**
- `lib/supabase-server.ts` - Server client
- All API routes in `app/api/`

**How They Connect:**
```
React Component
  ↓
lib/lessons.ts (browser context)
  ↓
lib/supabase.ts (browser client)
  ↓
Supabase (with browser cookies)

API Route
  ↓
lib/supabase-server.ts (server client)
  ↓
Supabase (with server cookies)

lib/lessons.ts (server context)
  ↓
Dynamic import lib/supabase-server.ts
  ↓
Supabase (with server cookies)
```

## Next Steps

1. Build should complete successfully
2. Restart dev server
3. Test lesson generation and library
4. Everything should work!

The separation of concerns makes the code cleaner and follows Next.js best practices.
