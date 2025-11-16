# LinguaSpark Setup Guide

## Prerequisites

- Node.js 18+ and npm
- A Supabase account
- Google AI API key (Gemini)
- OpenRouter API key (for DeepSeek)

## Installation Steps

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd linguaspark
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your actual API keys:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Google AI Configuration (Gemini)
NEXT_PUBLIC_GOOGLE_AI_API_KEY=your_google_ai_api_key_here
NEXT_PUBLIC_GOOGLE_AI_BASE_URL=https://generativelanguage.googleapis.com

# OpenRouter Configuration (DeepSeek AI)
OPEN_ROUTER_KEY=your_openrouter_api_key_here
OPEN_ROUTER_BASE_URL=https://openrouter.ai/api/v1
OPEN_ROUTER_MODEL=deepseek/deepseek-chat

# Development Configuration
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

### 4. Set Up Supabase Database

Run the migration scripts in order:

```bash
# Connect to your Supabase project and run:
# scripts/006_create_public_lessons.sql
# scripts/008_set_admin_flag.sql
# scripts/009_allow_admin_check.sql
```

### 5. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3001`

### 6. Load Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the project root directory
5. The extension should now be loaded

## Getting API Keys

### Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Project Settings → API
4. Copy the URL and anon key
5. Copy the service_role key (keep this secret!)

### Google AI (Gemini)

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Copy the key

### OpenRouter (DeepSeek)

1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up and go to Keys
3. Create a new API key
4. Copy the key

## Testing

### Test OpenRouter API

```bash
# Make sure dev server is running on port 3001
npm run dev

# In another terminal:
.\test-openrouter.ps1
```

### Test Extension

1. Navigate to any webpage with substantial text content
2. Click the Sparky icon in the extension toolbar
3. The extension should extract content and redirect to the lesson generator

## Security Notes

⚠️ **NEVER commit `.env.local` to Git!**

- All API keys should remain in `.env.local`
- The `.gitignore` file is configured to exclude this file
- See `SECURITY.md` for more details

## Troubleshooting

### Port Already in Use

If port 3001 is already in use, you can change it in `package.json`:

```json
"scripts": {
  "dev": "next dev -p 3002"
}
```

Then update the port in `.env.local` and extension files.

### Extension Not Working

1. Check that the dev server is running on the correct port
2. Reload the extension in `chrome://extensions/`
3. Check the browser console for errors
4. Check the extension background page console

### API Errors

1. Verify all API keys are correctly set in `.env.local`
2. Check that keys haven't expired or been revoked
3. Check API usage limits haven't been exceeded
4. Review the console logs for detailed error messages

## Development Workflow

1. Make changes to source files
2. Test locally
3. Commit changes (`.env.local` is automatically excluded)
4. Push to GitHub

## Production Deployment

When deploying to production (e.g., Vercel):

1. Set environment variables in your hosting platform
2. Update `NEXT_PUBLIC_SITE_URL` to your production URL
3. Update extension files to point to production URL
4. Build the application: `npm run build`

## Support

For issues or questions, please open an issue on GitHub.
