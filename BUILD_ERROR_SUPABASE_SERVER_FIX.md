# Build Error Fix: Missing supabase-server Module

## Error
```
Module not found: Can't resolve '@/lib/supabase-server'
```

## Root Cause
The file `app/api/generate-lesson-stream/route.ts` was trying to import `createServerSupabaseClient` from a non-existent module `@/lib/supabase-server`.

## Solution
Changed the import to use the existing `createClient` function from `@/lib/supabase`:

### Before:
```typescript
import { createServerSupabaseClient } from "@/lib/supabase-server"
// ...
const supabase = createServerSupabaseClient()
```

### After:
```typescript
import { createClient } from "@/lib/supabase"
// ...
const supabase = createClient()
```

## Files Modified
- `app/api/generate-lesson-stream/route.ts` - Fixed import and usage

## Notes
The `createClient()` function from `@/lib/supabase` works fine for API routes (server-side) since it creates a fresh Supabase client instance. The distinction between "server" and "client" Supabase clients is less critical in Next.js API routes since they always run server-side.
