# Security Guidelines

## Environment Variables

**CRITICAL:** Never commit `.env.local` or any file containing actual API keys to GitHub!

### Protected Files

The following files contain sensitive information and are automatically excluded by `.gitignore`:

- `.env.local` - Your actual environment variables with real API keys
- `.env.development.local`
- `.env.production.local`
- `.env.test.local`

### Setup Instructions

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your actual API keys in `.env.local`:
   - **Supabase Keys**: Get from your Supabase project dashboard
   - **Google AI Key**: Get from Google AI Studio
   - **OpenRouter Key**: Get from OpenRouter dashboard

### API Key Security Checklist

Before committing to GitHub, verify:

- [ ] `.env.local` is listed in `.gitignore`
- [ ] No API keys are hardcoded in source files
- [ ] `.env.example` contains only placeholder values
- [ ] All sensitive keys are loaded from environment variables only

### What to Do If Keys Are Exposed

If you accidentally commit API keys to GitHub:

1. **Immediately revoke/regenerate** the exposed keys:
   - **Supabase**: Project Settings → API → Reset keys
   - **Google AI**: Google Cloud Console → Credentials → Delete & create new
   - **OpenRouter**: Dashboard → API Keys → Revoke & create new

2. **Remove from Git history**:
   ```bash
   # Use git filter-branch or BFG Repo-Cleaner
   # Then force push (be careful!)
   ```

3. **Update `.env.local`** with new keys

### Environment Variable Usage

All API keys should be accessed via `process.env`:

```typescript
// ✅ CORRECT - Server-side only
const apiKey = process.env.OPEN_ROUTER_KEY;

// ❌ WRONG - Never hardcode
const apiKey = "sk-or-v1-abc123...";

// ⚠️ CAUTION - Client-side exposure
// Only use NEXT_PUBLIC_ prefix for non-sensitive values
const publicUrl = process.env.NEXT_PUBLIC_SITE_URL;
```

### Client vs Server Environment Variables

- **Server-only** (secure): `OPEN_ROUTER_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Client-exposed** (public): `NEXT_PUBLIC_*` variables
  - These are bundled into the client JavaScript
  - Only use for non-sensitive configuration

## Additional Security Measures

### API Routes

All sensitive operations should use API routes (server-side):

```typescript
// app/api/generate-lesson/route.ts
export async function POST(request: NextRequest) {
  const apiKey = process.env.OPEN_ROUTER_KEY; // Server-side only
  // ... make API call
}
```

### Rate Limiting

Consider implementing rate limiting for API routes to prevent abuse.

### CORS Configuration

Ensure proper CORS headers are set for API routes to prevent unauthorized access.

## Reporting Security Issues

If you discover a security vulnerability, please email [your-email] instead of opening a public issue.
