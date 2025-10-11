# Design Document - Lesson Typography Enhancement

## Overview

This design document outlines the implementation of enhanced typography hierarchy and responsive font sizing for the lesson display component. The enhancement focuses on creating a clear visual hierarchy with AI-generated contextual lesson titles and properly sized content elements to improve readability and user experience across all devices.

The design leverages Tailwind CSS utility classes and responsive design patterns to ensure consistent typography scaling while maintaining accessibility standards.

## Architecture

### Component Structure

The typography enhancement will be implemented primarily within the existing `lesson-display.tsx` component, with potential updates to the lesson generation pipeline for contextual title creation.

```
lesson-display.tsx
├── Lesson Title (32px lg+, responsive scaling)
├── Section Headers (28px, consistent)
├── Main Content (16px base)
├── Instructional Text (15px)
└── Supplementary Content (14px)
```

### Typography Hierarchy

The design establishes a five-tier typography hierarchy:

1. **Lesson Title**: Primary heading (32px on large screens)
2. **Section Headers**: Secondary headings (28px)
3. **Main Content**: Body text (16px)
4. **Instructions**: Guidance text (15px)
5. **Supplementary**: Answer keys, explanations (14px)

## Components and Interfaces

### Typography Scale Interface

```typescript
interface TypographyScale {
  lessonTitle: {
    base: string;    // Responsive classes
    lg: string;      // Large screen classes
  };
  sectionHeader: string;
  mainContent: string;
  instructions: string;
  supplementary: string;
}
```

### Lesson Title Generation

The contextual lesson title generation will be integrated into the existing AI lesson generation pipeline:

```typescript
interface LessonWithTitle extends Lesson {
  contextualTitle: string;
  sourceContentSummary?: string;
}
```

### Component Updates

#### LessonDisplay Component

The `lesson-display.tsx` component will be updated to implement the new typography hierarchy:

- Apply responsive title styling with proper semantic HTML (h1)
- Implement consistent section header styling (h2)
- Ensure content text maintains 16px base size
- Style instructional text distinctly at 15px
- Format supplementary content at 14px

#### Responsive Design Strategy

The design uses Tailwind's responsive prefix system:
- Mobile-first approach with base sizes
- `lg:` prefix for large screen enhancements
- Maintains proportional scaling across breakpoints

## Data Models

### Enhanced Lesson Model

```typescript
interface EnhancedLesson {
  id: string;
  contextualTitle: string;        // AI-generated contextual title
  sourceContent: string;          // Original content used for generation
  sections: LessonSection[];
  createdAt: Date;
  updatedAt: Date;
}

interface LessonSection {
  type: 'warmup' | 'vocabulary' | 'reading' | 'discussion' | 'grammar';
  title: string;                  // Section header (28px)
  content: SectionContent[];
  instructions?: string;          // Instructional text (15px)
}

interface SectionContent {
  type: 'text' | 'question' | 'answer' | 'example';
  content: string;
  fontSize: 'main' | 'supplementary';  // 16px or 14px
}
```

## Error Handling

### Typography Fallbacks

The design includes fallback strategies for typography rendering:

1. **Font Loading**: Graceful degradation to system fonts if custom fonts fail
2. **Responsive Breakpoints**: Ensure readability at all screen sizes
3. **Content Overflow**: Handle long titles and content gracefully
4. **Accessibility**: Maintain contrast ratios and support browser zoom

### Title Generation Failures

If contextual title generation fails:
- Fall back to generic lesson type titles
- Use source content first sentence as backup
- Maintain consistent styling regardless of title source

## Testing Strategy

### Visual Regression Testing

1. **Typography Consistency**: Verify font sizes across all lesson types
2. **Responsive Behavior**: Test scaling on different screen sizes
3. **Content Variations**: Test with various content lengths and types

### Accessibility Testing

1. **Screen Reader Compatibility**: Ensure proper heading hierarchy
2. **Zoom Support**: Test at 200% browser zoom
3. **Contrast Ratios**: Verify WCAG compliance for all text sizes

### Cross-Browser Testing

1. **Font Rendering**: Test across Chrome, Firefox, Safari, Edge
2. **Responsive Breakpoints**: Verify consistent behavior
3. **Performance**: Ensure no layout shifts during font loading

## Implementation Details

### Tailwind CSS Classes

The design will use the following Tailwind utility classes:

```css
/* Lesson Title */
.lesson-title {
  @apply text-2xl lg:text-3xl font-bold leading-tight;
}

/* Section Headers */
.section-header {
  @apply text-xl font-semibold mb-4;
}

/* Main Content */
.main-content {
  @apply text-base leading-relaxed;
}

/* Instructions */
.instructions {
  @apply text-sm text-gray-600 italic mb-2;
}

/* Supplementary */
.supplementary {
  @apply text-sm text-gray-500;
}
```

### Responsive Breakpoints

- **Mobile (default)**: Optimized for readability on small screens
- **Tablet (md: 768px+)**: Balanced scaling for medium screens
- **Desktop (lg: 1024px+)**: Full 32px title size and optimal spacing
- **Large Desktop (xl: 1280px+)**: Enhanced spacing and line heights

### AI Title Generation Integration

The contextual title generation will be integrated into the existing lesson generation pipeline:

1. **Content Analysis**: Extract key themes from source content
2. **Title Generation**: Use AI to create contextual, descriptive titles
3. **Fallback Strategy**: Implement robust fallbacks for generation failures
4. **Caching**: Store generated titles to avoid regeneration

## Design Decisions and Rationales

### Font Size Selection

**32px Lesson Title**: Chosen to create strong visual hierarchy while remaining readable on mobile devices when scaled down. The large size on desktop creates immediate focus and professional appearance.

**28px Section Headers**: Provides clear distinction from main content while maintaining readability. The 4px difference from title creates subtle but effective hierarchy.

**16px Main Content**: Standard web typography size that ensures optimal readability across all devices and user preferences.

**15px Instructions**: Slightly smaller than main content to indicate secondary importance while remaining easily readable.

**14px Supplementary**: Small enough to be visually secondary but large enough to maintain accessibility standards.

### Responsive Strategy

**Mobile-First Approach**: Ensures optimal experience on the most constrained screens first, then enhances for larger displays.

**Proportional Scaling**: Maintains visual hierarchy relationships across all screen sizes.

### Semantic HTML Structure

**Proper Heading Hierarchy**: Uses h1 for lesson titles, h2 for sections, ensuring screen reader compatibility and SEO benefits.

**Content Grouping**: Logical grouping of related content elements for better accessibility and styling consistency.

### Integration with Existing System

**Minimal Disruption**: Design works within existing component structure without requiring major architectural changes.

**Backward Compatibility**: Ensures existing lessons continue to display properly while new lessons benefit from enhanced typography.

**Performance Considerations**: Uses efficient CSS classes and avoids complex calculations that could impact rendering performance.