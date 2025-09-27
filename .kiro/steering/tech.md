# Technology Stack

## Framework & Runtime

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development throughout
- **Node.js 18+**: Runtime environment

## Frontend

- **React 18**: Component library with hooks
- **Tailwind CSS**: Utility-first styling
- **Shadcn UI**: Component library built on Radix UI
- **Lucide React**: Icon library

## Backend & Database

- **Supabase**: Authentication, PostgreSQL database, and storage
- **Row Level Security (RLS)**: Data protection and privacy
- **PostgreSQL**: Relational database with JSONB support

## AI Integration

- **Google AI APIs**: Complete pipeline for content processing
  - Summarizer API, Translator API, Prompt API
  - Writer API, Rewriter API, Proofreader API

## Chrome Extension

- **Manifest v3**: Modern extension architecture
- **Service Worker**: Background script handling
- **Content Scripts**: Page interaction capabilities

## Export & Document Generation

- **jsPDF**: Client-side PDF generation
- **docx**: Professional Word document creation

## Development Tools

- **ESLint**: Code linting (disabled during builds)
- **PostCSS**: CSS processing
- **Cross-env**: Environment variable management

## Common Commands

### Development

```bash
npm run dev          # Start development server
npm run dev:clean    # Start on port 3001 (clean)
```

### Building

```bash
npm run build                # Production build
npm run build:extension      # Extension-specific build
```

### Extension Testing

1. Run `npm run build`
2. Load `dist` folder in Chrome extensions (Developer mode)

## Environment Variables

Required in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_GOOGLE_AI_API_KEY`
- `NEXT_PUBLIC_GOOGLE_AI_BASE_URL`
- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`
