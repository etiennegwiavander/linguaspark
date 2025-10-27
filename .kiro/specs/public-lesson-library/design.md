# Public Lesson Library - Design Document

## Overview

The Public Lesson Library feature extends LinguaSpark to support a curated collection of publicly accessible lesson materials. This system introduces an admin role that enables designated users to create lessons using the existing Sparky workflow and publish them to a shared library. The design maintains the existing lesson generation architecture while adding new database tables, access control mechanisms, and UI components for public content discovery and management.

**Key Design Principles:**
- Reuse existing lesson generation and display components
- Implement proper access control through RLS policies
- Provide seamless experience for both authenticated and unauthenticated users
- Maintain clear separation between personal and public lesson libraries
- Enable admin curation while allowing community editing

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Public Navbar  │  Public Library Page  │  Public Lesson View│
│  (with link)    │  (filtering/browsing) │  (conditional UI)  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      API Routes Layer                        │
├─────────────────────────────────────────────────────────────┤
│  /api/public-lessons/list    │  /api/public-lessons/get     │
│  /api/public-lessons/create  │  /api/public-lessons/update  │
│  /api/public-lessons/delete  │  /api/admin/stats            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                      │
├─────────────────────────────────────────────────────────────┤
│  lib/public-lessons-server.ts  │  lib/admin-utils-server.ts │
│  (CRUD operations)             │  (admin verification)      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Database Layer                          │
├─────────────────────────────────────────────────────────────┤
│  public_lessons table  │  tutors table (with is_admin)      │
│  (with RLS policies)   │  (existing, extended)              │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Admin Lesson Creation Flow:**
1. Admin user clicks Sparky extension button
2. Extension presents "Save to Personal" or "Save to Public" option
3. User selects "Save to Public" and proceeds with content extraction
4. Lesson generation follows existing Sparky workflow
5. On completion, system prompts for category/metadata assignment
6. Lesson saved to `public_lessons` table with admin as creator

**Public Lesson Viewing Flow (Unauthenticated):**
1. User navigates to Public Library from navbar
2. System loads public lessons without authentication check
3. User browses/filters lessons by category, CEFR level, type
4. User clicks lesson to view full content
5. Lesson displays without sidebar (read-only mode)

**Public Lesson Viewing Flow (Authenticated):**
1. Same browsing experience as unauthenticated
2. When viewing lesson, sidebar appears with edit/export options
3. Non-admin users see edit and export, but not delete
4. Admin users see full edit, export, and delete options

## Components and Interfaces

### Database Schema

#### Extended Tutors Table
```sql
-- Add to existing tutors table
ALTER TABLE tutors ADD COLUMN is_admin BOOLEAN DEFAULT false;
```

**Design Rationale:** Extending the existing `tutors` table avoids creating a separate admin table and simplifies authentication checks. The default `false` value ensures security by default.

#### Public Lessons Table
```sql
CREATE TABLE public_lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Creator information
  creator_id UUID REFERENCES tutors(id) ON DELETE SET NULL,
  
  -- Lesson content (same structure as lessons table)
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  source_url TEXT,
  source_title TEXT,
  banner_image_url TEXT,
  
  -- Categorization
  category TEXT NOT NULL,
  cefr_level TEXT NOT NULL CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1')),
  lesson_type TEXT NOT NULL CHECK (lesson_type IN ('discussion', 'grammar', 'travel', 'business', 'pronunciation')),
  
  -- Additional metadata
  tags TEXT[],
  estimated_duration_minutes INTEGER,
  
  -- Search optimization
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(source_title, ''))
  ) STORED
);

-- Indexes for performance
CREATE INDEX idx_public_lessons_category ON public_lessons(category);
CREATE INDEX idx_public_lessons_cefr_level ON public_lessons(cefr_level);
CREATE INDEX idx_public_lessons_lesson_type ON public_lessons(lesson_type);
CREATE INDEX idx_public_lessons_creator ON public_lessons(creator_id);
CREATE INDEX idx_public_lessons_search ON public_lessons USING GIN(search_vector);
CREATE INDEX idx_public_lessons_created_at ON public_lessons(created_at DESC);
```

**Design Rationale:** 
- JSONB content field maintains compatibility with existing lesson structure
- Check constraints ensure data integrity for enums
- Full-text search vector enables future search functionality
- Indexes optimize common query patterns (filtering, sorting)
- `creator_id` uses SET NULL on delete to preserve lessons if admin account is deleted

### TypeScript Interfaces

```typescript
// lib/types/public-lessons.ts

export interface PublicLesson {
  id: string;
  created_at: string;
  updated_at: string;
  creator_id: string | null;
  title: string;
  content: LessonContent; // Reuse existing LessonContent type
  source_url: string | null;
  source_title: string | null;
  banner_image_url: string | null;
  category: LessonCategory;
  cefr_level: CEFRLevel;
  lesson_type: LessonType;
  tags: string[];
  estimated_duration_minutes: number | null;
}

export type LessonCategory = 
  | 'general-english'
  | 'business'
  | 'travel'
  | 'academic'
  | 'conversation'
  | 'grammar'
  | 'vocabulary'
  | 'pronunciation'
  | 'culture';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export type LessonType = 'discussion' | 'grammar' | 'travel' | 'business' | 'pronunciation';

export interface PublicLessonFilters {
  category?: LessonCategory;
  cefr_level?: CEFRLevel;
  lesson_type?: LessonType;
  search?: string;
}

export interface PublicLessonMetadata {
  category: LessonCategory;
  tags?: string[];
  estimated_duration_minutes?: number;
}

export interface AdminStats {
  total_lessons: number;
  lessons_by_category: Record<LessonCategory, number>;
  lessons_by_level: Record<CEFRLevel, number>;
  recent_lessons: PublicLesson[];
  my_lessons_count: number;
}
```

### API Routes

#### GET /api/public-lessons/list
```typescript
// Query parameters: category, cefr_level, lesson_type, search, limit, offset
// Returns: { lessons: PublicLesson[], total: number }
// Access: Public (no authentication required)
```

#### GET /api/public-lessons/get/[id]
```typescript
// Returns: { lesson: PublicLesson }
// Access: Public (no authentication required)
```

#### POST /api/public-lessons/create
```typescript
// Body: { lesson: LessonContent, metadata: PublicLessonMetadata }
// Returns: { success: boolean, lesson_id: string }
// Access: Authenticated users only
// Note: Any authenticated user can create, but UI only shows option to admins
```

#### PUT /api/public-lessons/update/[id]
```typescript
// Body: { lesson: Partial<PublicLesson> }
// Returns: { success: boolean }
// Access: Authenticated users (RLS enforces update permissions)
```

#### DELETE /api/public-lessons/delete/[id]
```typescript
// Returns: { success: boolean }
// Access: Admin users only (enforced by RLS)
```

#### GET /api/admin/stats
```typescript
// Returns: { stats: AdminStats }
// Access: Admin users only
```

### Row Level Security Policies

```sql
-- Enable RLS
ALTER TABLE public_lessons ENABLE ROW LEVEL SECURITY;

-- Public read access (authenticated and unauthenticated)
CREATE POLICY "Public lessons are viewable by everyone"
  ON public_lessons
  FOR SELECT
  USING (true);

-- Authenticated users can insert
CREATE POLICY "Authenticated users can create public lessons"
  ON public_lessons
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update any public lesson
CREATE POLICY "Authenticated users can update public lessons"
  ON public_lessons
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only admins can delete
CREATE POLICY "Only admins can delete public lessons"
  ON public_lessons
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tutors
      WHERE tutors.id = auth.uid()
      AND tutors.is_admin = true
    )
  );
```

**Design Rationale:**
- Universal read access enables unauthenticated browsing
- Liberal update policy allows community editing (can be restricted later if needed)
- Strict delete policy ensures only admins can remove content
- Policies leverage Supabase's built-in authentication context

### React Components

#### PublicLibraryPage Component
```typescript
// app/public-library/page.tsx
// Server component that renders the public library interface
// Features:
// - Category filter sidebar
// - CEFR level filter
// - Lesson type filter
// - Grid of lesson cards
// - Pagination
// - No authentication required
```

#### PublicLessonCard Component
```typescript
// components/public-lesson-card.tsx
// Displays lesson preview with:
// - Banner image (if available)
// - Title
// - Category badge
// - CEFR level badge
// - Lesson type badge
// - Estimated duration
// - Click to view full lesson
```

#### PublicLessonView Component
```typescript
// app/public-library/[id]/page.tsx
// Displays full lesson content
// Conditionally renders workspace sidebar based on auth status
// Reuses existing lesson-display component for content
// Passes appropriate props to control sidebar visibility and actions
```

#### AdminLessonCreationDialog Component
```typescript
// components/admin-lesson-creation-dialog.tsx
// Modal that appears after lesson generation for admins
// Prompts for:
// - Category selection
// - Additional tags
// - Estimated duration
// - Confirmation to save to public library
```

#### PublicLibraryFilters Component
```typescript
// components/public-library-filters.tsx
// Client component for interactive filtering
// Features:
// - Category checkboxes
// - CEFR level radio buttons
// - Lesson type checkboxes
// - Clear filters button
// - Shows active filter count
```

#### AdminStatsPanel Component
```typescript
// components/admin-stats-panel.tsx
// Displays admin-specific statistics
// Only visible to admin users
// Shows:
// - Total lessons count
// - Breakdown by category
// - Breakdown by CEFR level
// - Recent additions
// - Lessons created by current admin
```

### Chrome Extension Integration

#### Modified Popup Flow
```javascript
// popup.js modifications

// After successful content extraction
if (userIsAdmin) {
  // Show save destination choice
  showSaveDestinationDialog({
    options: ['Personal Library', 'Public Library'],
    onSelect: (destination) => {
      if (destination === 'Public Library') {
        // Set flag in chrome.storage
        chrome.storage.local.set({ saveToPublic: true });
      }
      // Continue with lesson generation
      generateLesson();
    }
  });
}

// After lesson generation completes
chrome.storage.local.get(['saveToPublic'], (result) => {
  if (result.saveToPublic) {
    // Show metadata dialog
    showPublicLessonMetadataDialog();
  } else {
    // Save to personal library as usual
    saveToPersonalLibrary();
  }
});
```

**Design Rationale:** Minimal changes to existing extension flow. Admin check happens early, and a simple flag determines save destination. Metadata collection happens after generation to avoid interrupting the user's workflow.

## Data Models

### Lesson Content Structure

Public lessons reuse the existing `LessonContent` interface to maintain compatibility:

```typescript
interface LessonContent {
  title: string;
  warmup: WarmupSection;
  vocabulary?: VocabularySection;
  grammar?: GrammarSection;
  reading?: ReadingSection;
  discussion?: DiscussionSection;
  pronunciation?: PronunciationSection;
  wrapup: WrapupSection;
  metadata: {
    cefr_level: CEFRLevel;
    lesson_type: LessonType;
    source_url?: string;
    source_title?: string;
    banner_image_url?: string;
  };
}
```

**Design Rationale:** Reusing the existing structure ensures that all lesson display, export, and editing functionality works without modification. The `public_lessons` table stores this as JSONB, allowing flexibility for future schema evolution.

### Category Taxonomy

Categories are designed to be broad enough for easy classification but specific enough for meaningful filtering:

- **general-english**: Everyday topics and general language skills
- **business**: Professional communication, meetings, emails
- **travel**: Tourism, directions, hospitality
- **academic**: Educational content, research, formal writing
- **conversation**: Dialogue practice, speaking skills
- **grammar**: Specific grammar points and structures
- **vocabulary**: Thematic vocabulary building
- **pronunciation**: Phonetics, intonation, accent work
- **culture**: Cultural topics, traditions, customs

**Design Rationale:** This taxonomy balances specificity with simplicity. It aligns with common ESL/EFL teaching categories and allows for intuitive browsing. The tags field provides additional flexibility for cross-cutting themes.

## Error Handling

### Access Control Errors

```typescript
// lib/public-lessons-server.ts

export async function deletePublicLesson(lessonId: string, userId: string): Promise<Result> {
  try {
    // Verify admin status
    const { data: tutor, error: tutorError } = await supabase
      .from('tutors')
      .select('is_admin')
      .eq('id', userId)
      .single();
    
    if (tutorError || !tutor?.is_admin) {
      return {
        success: false,
        error: 'PERMISSION_DENIED',
        message: 'Only administrators can delete public lessons'
      };
    }
    
    // Proceed with deletion
    const { error } = await supabase
      .from('public_lessons')
      .delete()
      .eq('id', lessonId);
    
    if (error) {
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Failed to delete lesson'
      };
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred'
    };
  }
}
```

### Validation Errors

```typescript
// Validate lesson content before saving to public library
export function validatePublicLessonContent(content: LessonContent): ValidationResult {
  const errors: string[] = [];
  
  if (!content.title || content.title.trim().length === 0) {
    errors.push('Lesson title is required');
  }
  
  if (!content.warmup || !content.warmup.questions || content.warmup.questions.length === 0) {
    errors.push('Warmup section is required');
  }
  
  if (!content.wrapup || !content.wrapup.summary) {
    errors.push('Wrapup section is required');
  }
  
  // Validate at least one main content section exists
  const hasMainContent = !!(
    content.vocabulary ||
    content.grammar ||
    content.reading ||
    content.discussion ||
    content.pronunciation
  );
  
  if (!hasMainContent) {
    errors.push('At least one main content section is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

**Design Rationale:** Validation ensures public lessons meet quality standards. Errors are specific and actionable, helping admins correct issues before publication.

## Testing Strategy

### Unit Tests

```typescript
// test/public-lessons-server.test.ts
describe('Public Lessons Server Functions', () => {
  test('createPublicLesson validates content', async () => {
    const invalidLesson = { title: '', content: {} };
    const result = await createPublicLesson(invalidLesson, 'user-id');
    expect(result.success).toBe(false);
    expect(result.error).toBe('VALIDATION_ERROR');
  });
  
  test('deletePublicLesson requires admin privileges', async () => {
    const result = await deletePublicLesson('lesson-id', 'non-admin-user-id');
    expect(result.success).toBe(false);
    expect(result.error).toBe('PERMISSION_DENIED');
  });
});

// test/public-library-filters.test.tsx
describe('PublicLibraryFilters Component', () => {
  test('applies multiple filters correctly', () => {
    const onFilterChange = jest.fn();
    render(<PublicLibraryFilters onFilterChange={onFilterChange} />);
    
    // Select category
    fireEvent.click(screen.getByLabelText('Business'));
    // Select CEFR level
    fireEvent.click(screen.getByLabelText('B1'));
    
    expect(onFilterChange).toHaveBeenCalledWith({
      category: 'business',
      cefr_level: 'B1'
    });
  });
});
```

### Integration Tests

```typescript
// test/public-library-integration.test.ts
describe('Public Library Integration', () => {
  test('unauthenticated user can view public lessons', async () => {
    const response = await fetch('/api/public-lessons/list');
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.lessons).toBeInstanceOf(Array);
  });
  
  test('authenticated user can update public lesson', async () => {
    const session = await createTestSession();
    const response = await fetch('/api/public-lessons/update/test-id', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title: 'Updated Title' })
    });
    expect(response.status).toBe(200);
  });
  
  test('non-admin cannot delete public lesson', async () => {
    const session = await createTestSession({ isAdmin: false });
    const response = await fetch('/api/public-lessons/delete/test-id', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    expect(response.status).toBe(403);
  });
});
```

### Manual Testing Checklist

1. **Admin Lesson Creation**
   - Verify admin sees "Save to Public" option in Sparky
   - Confirm metadata dialog appears after generation
   - Check lesson saves to public_lessons table

2. **Public Library Browsing**
   - Test unauthenticated access to /public-library
   - Verify filtering by category, level, type
   - Confirm pagination works correctly

3. **Lesson Viewing**
   - Test unauthenticated view (no sidebar)
   - Test authenticated non-admin view (sidebar with edit/export)
   - Test admin view (sidebar with edit/export/delete)

4. **Access Control**
   - Verify non-admin cannot delete lessons
   - Confirm authenticated users can edit
   - Test admin-only statistics panel

5. **Export Functionality**
   - Test PDF export from public lesson
   - Test Word export from public lesson
   - Verify attribution is included

## Performance Considerations

### Database Query Optimization

```typescript
// Efficient pagination with cursor-based approach
export async function getPublicLessons(
  filters: PublicLessonFilters,
  cursor?: string,
  limit: number = 20
): Promise<{ lessons: PublicLesson[], nextCursor?: string }> {
  let query = supabase
    .from('public_lessons')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (cursor) {
    query = query.lt('created_at', cursor);
  }
  
  if (filters.category) {
    query = query.eq('category', filters.category);
  }
  
  if (filters.cefr_level) {
    query = query.eq('cefr_level', filters.cefr_level);
  }
  
  if (filters.lesson_type) {
    query = query.eq('lesson_type', filters.lesson_type);
  }
  
  const { data, error } = await query;
  
  if (error || !data) {
    return { lessons: [] };
  }
  
  const nextCursor = data.length === limit ? data[data.length - 1].created_at : undefined;
  
  return { lessons: data, nextCursor };
}
```

**Design Rationale:** Cursor-based pagination is more efficient than offset-based for large datasets. Indexes on filter columns ensure fast query execution.

### Caching Strategy

```typescript
// app/public-library/page.tsx
export const revalidate = 300; // Revalidate every 5 minutes

// For individual lessons
export const dynamic = 'force-static';
export const revalidate = 3600; // Revalidate every hour
```

**Design Rationale:** Public lessons change infrequently, making them ideal for static generation with periodic revalidation. This reduces database load and improves page load times.

### Image Optimization

```typescript
// Use Next.js Image component for banner images
import Image from 'next/image';

<Image
  src={lesson.banner_image_url}
  alt={lesson.title}
  width={800}
  height={400}
  className="rounded-lg"
  loading="lazy"
/>
```

**Design Rationale:** Next.js Image component provides automatic optimization, lazy loading, and responsive images, improving performance especially for image-heavy library pages.

## Security Considerations

### Input Sanitization

```typescript
// Sanitize user input before storing
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeLessonContent(content: LessonContent): LessonContent {
  return {
    ...content,
    title: DOMPurify.sanitize(content.title),
    // Sanitize all text fields recursively
  };
}
```

### Rate Limiting

```typescript
// lib/rate-limiter.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
});

export async function checkRateLimit(identifier: string): Promise<boolean> {
  const { success } = await ratelimit.limit(identifier);
  return success;
}
```

**Design Rationale:** Rate limiting prevents abuse of public endpoints, especially important for unauthenticated access. Sliding window algorithm provides smooth rate limiting.

### Content Moderation

```typescript
// Future enhancement: AI-powered content moderation
export async function moderateContent(content: string): Promise<ModerationResult> {
  // Check for inappropriate content
  // Flag for admin review if needed
  // Return moderation decision
}
```

**Design Rationale:** While not in initial scope, content moderation hooks are designed into the architecture for future implementation as the public library grows.

## Migration Strategy

### Database Migration Script

```sql
-- scripts/006_create_public_lessons.sql

-- Add is_admin column to tutors table
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create public_lessons table
CREATE TABLE IF NOT EXISTS public_lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  creator_id UUID REFERENCES tutors(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  source_url TEXT,
  source_title TEXT,
  banner_image_url TEXT,
  category TEXT NOT NULL,
  cefr_level TEXT NOT NULL CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1')),
  lesson_type TEXT NOT NULL CHECK (lesson_type IN ('discussion', 'grammar', 'travel', 'business', 'pronunciation')),
  tags TEXT[],
  estimated_duration_minutes INTEGER,
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(source_title, ''))
  ) STORED
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_public_lessons_category ON public_lessons(category);
CREATE INDEX IF NOT EXISTS idx_public_lessons_cefr_level ON public_lessons(cefr_level);
CREATE INDEX IF NOT EXISTS idx_public_lessons_lesson_type ON public_lessons(lesson_type);
CREATE INDEX IF NOT EXISTS idx_public_lessons_creator ON public_lessons(creator_id);
CREATE INDEX IF NOT EXISTS idx_public_lessons_search ON public_lessons USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_public_lessons_created_at ON public_lessons(created_at DESC);

-- Enable RLS
ALTER TABLE public_lessons ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public lessons are viewable by everyone"
  ON public_lessons FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create public lessons"
  ON public_lessons FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update public lessons"
  ON public_lessons FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Only admins can delete public lessons"
  ON public_lessons FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tutors
      WHERE tutors.id = auth.uid()
      AND tutors.is_admin = true
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_public_lessons_updated_at
  BEFORE UPDATE ON public_lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Rollback Plan

```sql
-- scripts/rollback_006_public_lessons.sql

DROP TRIGGER IF EXISTS update_public_lessons_updated_at ON public_lessons;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP TABLE IF EXISTS public_lessons CASCADE;
ALTER TABLE tutors DROP COLUMN IF EXISTS is_admin;
```

## Future Enhancements

### Phase 2 Features (Not in Current Scope)

1. **Lesson Ratings and Reviews**
   - User ratings (1-5 stars)
   - Written reviews
   - Helpful/not helpful voting

2. **Advanced Search**
   - Full-text search across lesson content
   - Search by tags
   - Search by source domain

3. **Lesson Collections**
   - Curated collections by theme
   - Course sequences
   - Difficulty progressions

4. **Usage Analytics**
   - View counts
   - Export counts
   - Popular lessons dashboard

5. **Content Moderation Tools**
   - Automated content screening
   - User reporting system
   - Admin review queue

6. **Collaborative Editing**
   - Suggested edits from community
   - Version history
   - Change approval workflow

**Design Rationale:** These features are intentionally deferred to keep the initial implementation focused and manageable. The architecture is designed to accommodate these enhancements without major refactoring.

## Design Decisions Summary

### Key Architectural Choices

1. **Reuse Existing Lesson Structure**: Maintains compatibility and reduces development effort
2. **Liberal Update Policy**: Encourages community contribution; can be restricted later if needed
3. **Cursor-Based Pagination**: Scales better than offset pagination for large datasets
4. **Static Generation with Revalidation**: Optimizes performance for infrequently changing content
5. **Separate Table for Public Lessons**: Clear separation of concerns and simplified RLS policies
6. **Admin Flag on Tutors Table**: Simple, efficient admin management without separate roles system
7. **Category Taxonomy**: Balances specificity with usability for browsing
8. **Universal Read Access**: Enables unauthenticated browsing, core to public library concept

### Trade-offs Considered

| Decision | Pros | Cons | Rationale |
|----------|------|------|-----------|
| Allow all authenticated users to edit | Encourages community contribution | Risk of vandalism | Start permissive, add restrictions if needed |
| Separate public_lessons table | Clear separation, simpler RLS | Data duplication with lessons table | Separation outweighs duplication concerns |
| Static generation | Fast page loads, low server load | Slight delay in content updates | Acceptable for public library use case |
| Simple admin flag | Easy to implement and check | Less flexible than full RBAC | Sufficient for current requirements |
| JSONB content storage | Flexible schema, easy migration | Harder to query specific fields | Flexibility more important than queryability |

