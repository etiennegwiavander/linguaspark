---
inclusion: always
---

# Technology Stack & Development Guidelines

## Core Stack

- **Next.js 14** with App Router - Use server components by default, client components only when needed
- **TypeScript** - Strict mode enabled, explicit types required for all functions and interfaces
- **React 18** - Hooks-based components, avoid class components
- **Tailwind CSS** - Utility-first styling, mobile-first responsive design
- **Shadcn UI** - Component library built on Radix UI primitives

## Backend & Data

- **Supabase** - Authentication, PostgreSQL with RLS policies
- **Google AI APIs** - Primary AI provider (Gemini models)
- **Chrome Extension** - Manifest v3 architecture

## Development Conventions

### File Organization

- API routes: `app/api/` - Keep thin, delegate to `lib/*-server.ts`
- Server utilities: `lib/*-server.ts` - Business logic for API routes
- Client utilities: `lib/*.ts` - Browser-safe utilities
- Components: `components/` - Reusable UI components
- Tests: `test/` - Unit and integration tests

### TypeScript Standards

```typescript
// Explicit return types required
export async function generateLesson(): Promise<LessonData> {}

// Use interfaces for objects, types for unions
interface LessonData {
  title: string;
  content: string;
}
type LessonType = "grammar" | "discussion" | "pronunciation";

// Strict error handling
try {
  const result = await aiCall();
  return { success: true, data: result };
} catch (error) {
  return { success: false, error: classifyError(error) };
}
```

### AI Integration Rules

- **Never use fallback content** - Always generate fresh AI responses
- **Progressive generation** - Handle token limits with chunking
- **Multi-model strategy** - Implement fallback between Gemini models
- **Response validation** - Validate all AI output before display
- **Error classification** - Categorize errors (quota, network, validation)

### Component Patterns

```typescript
// Server components by default
export default function LessonDisplay({ lesson }: { lesson: LessonData }) {
  return <div>{lesson.title}</div>;
}

// Client components when needed
("use client");
export function LessonGenerator() {
  const [loading, setLoading] = useState(false);
  // ... interactive logic
}
```

### API Route Structure

```typescript
// app/api/example/route.ts
import { generateContent } from "@/lib/content-generator-server";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const result = await generateContent(data);
    return Response.json({ success: true, data: result });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: "Generation failed",
      },
      { status: 500 }
    );
  }
}
```

### Styling Guidelines

- Use Tailwind utility classes exclusively
- Mobile-first responsive design (`sm:`, `md:`, `lg:`)
- Consistent spacing scale (`space-y-4`, `p-6`)
- Shadcn UI component variants for consistency
- Proper contrast ratios for accessibility

### Environment Setup

Required in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_GOOGLE_AI_API_KEY=
NEXT_PUBLIC_GOOGLE_AI_BASE_URL=
```

### Testing Strategy

- Unit tests for utilities and generators
- Integration tests for API routes
- Component tests for UI interactions
- Use Vitest for test runner

### Chrome Extension Integration

- `manifest.json` - Manifest v3 configuration
- `background.js` - Service worker for extension lifecycle
- `content.js` - DOM interaction and content extraction
- `popup.html` - Extension popup interface
