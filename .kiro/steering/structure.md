# Project Structure & Conventions

## Directory Organization

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── popup/             # Extension popup pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   ├── auth-wrapper.tsx  # Authentication logic
│   ├── lesson-display.tsx # Lesson viewer
│   └── lesson-generator.tsx # AI lesson creation
├── lib/                  # Utility libraries
│   ├── auth.ts           # Authentication helpers
│   ├── supabase*.ts      # Database clients
│   ├── google-ai*.ts     # AI API integration
│   ├── lesson*.ts        # Lesson logic
│   ├── export-utils.ts   # PDF/Word export
│   └── utils.ts          # General utilities
├── hooks/                # Custom React hooks
├── scripts/              # Database migration scripts
├── public/               # Static assets
└── styles/               # Additional stylesheets
```

## Chrome Extension Files
- `manifest.json` - Extension configuration
- `background.js` - Service worker
- `content.js` - Content script
- `popup.html` - Extension popup

## Code Conventions

### Components
- Use TypeScript with explicit interfaces
- Prefer functional components with hooks
- Use "use client" directive for client components
- Import UI components from `@/components/ui/`
- Use Lucide React for icons

### File Naming
- Components: PascalCase (e.g., `LessonDisplay.tsx`)
- Utilities: kebab-case (e.g., `export-utils.ts`)
- Pages: lowercase (e.g., `page.tsx`)

### Import Patterns
```typescript
import type React from "react"           // Type-only imports
import { useState } from "react"         // Named imports
import { Button } from "@/components/ui/button"  // Absolute imports
```

### State Management
- Use React hooks for local state
- Supabase for persistent data
- Context for authentication state

### Styling
- Tailwind CSS utility classes
- Shadcn UI component variants
- Responsive design patterns

### Error Handling
- Try-catch blocks for async operations
- User-friendly error messages
- Console logging for debugging

## Database Schema
Tables managed via scripts in `scripts/` directory:
- `tutors` - User profiles
- `lessons` - Generated lesson data
- Row Level Security (RLS) policies enforced