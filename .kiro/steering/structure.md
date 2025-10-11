---
inclusion: always
---

# Project Structure & Architecture

## Directory Organization

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes (server-side endpoints)
│   ├── popup/             # Extension popup pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   ├── auth-wrapper.tsx  # Authentication logic
│   ├── lesson-display.tsx # Lesson viewer
│   └── lesson-generator.tsx # AI lesson creation
├── lib/                  # Core business logic
│   ├── *-server.ts       # Server-side utilities (use in API routes)
│   ├── google-ai*.ts     # AI API integration
│   ├── lesson*.ts        # Lesson generation logic
│   ├── *-generator.ts    # Content generation utilities
│   ├── *-validator.ts    # Content validation utilities
│   └── export-utils.ts   # PDF/Word export
├── test/                 # Test files
├── scripts/              # Database migration scripts
└── public/               # Static assets
```

## Architecture Patterns

### API Route Structure

- Place all server-side logic in `lib/*-server.ts` files
- API routes in `app/api/` should be thin wrappers
- Use consistent error handling and response formats
- Implement proper CORS for extension compatibility

### Component Architecture

- Separate display components from generator components
- Use composition over inheritance
- Implement proper loading and error states
- Follow responsive design principles

### AI Integration Patterns

- Use progressive generation for large content
- Implement multi-model fallback strategies
- Always validate AI responses before display
- Handle token limits with chunking strategies

## Code Conventions

### File Naming & Organization

- Components: PascalCase (e.g., `LessonDisplay.tsx`)
- Utilities: kebab-case (e.g., `export-utils.ts`)
- Server utilities: `*-server.ts` suffix
- Validators: `*-validator.ts` suffix
- Generators: `*-generator.ts` suffix

### Import Patterns

```typescript
import type { ComponentProps } from "react"; // Type-only imports
import { useState, useEffect } from "react"; // Named imports
import { Button } from "@/components/ui/button"; // Absolute imports with @/ alias
```

### TypeScript Standards

- Use explicit interfaces for all props and data structures
- Prefer `type` for unions, `interface` for objects
- Use strict null checks and proper error types
- Define return types for all functions

### Error Handling Patterns

- Use try-catch blocks for all async operations
- Implement error classification (quota, network, validation)
- Provide user-friendly error messages
- Log detailed errors for debugging
- Never expose raw API errors to users

### State Management

- React hooks for component state
- Supabase for persistent data
- Context for authentication state
- No global state management library needed

### Styling Conventions

- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Use Shadcn UI component variants
- Maintain consistent spacing and typography
- Implement proper contrast ratios for accessibility

## Chrome Extension Integration

- `manifest.json` - Extension configuration (Manifest v3)
- `background.js` - Service worker for extension lifecycle
- `content.js` - Content script for webpage interaction
- `popup.html` - Extension popup interface

## Database Patterns

- Use Row Level Security (RLS) policies
- Auto-create tutor profiles on authentication
- Store lessons with proper foreign key relationships
- Implement soft deletes where appropriate
