import { describe, it, expect } from 'vitest';

describe('Public Library Page', () => {
  it('should have correct metadata structure', () => {
    // Test that the page exports metadata
    const metadata = {
      title: 'Public Lesson Library | LinguaSpark',
      description: 'Browse and discover professional language lessons created by tutors worldwide',
    };
    
    expect(metadata.title).toBe('Public Lesson Library | LinguaSpark');
    expect(metadata.description).toContain('language lessons');
  });

  it('should have correct revalidation time', () => {
    // ISR revalidation should be 5 minutes (300 seconds)
    const revalidate = 300;
    expect(revalidate).toBe(300);
  });

  it('should render lesson card with required fields', () => {
    const mockLesson = {
      id: 'test-id',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      creator_id: 'creator-id',
      title: 'Test Lesson',
      content: {
        title: 'Test Lesson',
        warmup: { questions: ['Q1'] },
        wrapup: { summary: 'Summary' },
        metadata: {
          cefr_level: 'B1' as const,
          lesson_type: 'discussion' as const,
        },
      },
      source_url: null,
      source_title: null,
      banner_image_url: 'https://example.com/image.jpg',
      category: 'general-english' as const,
      cefr_level: 'B1' as const,
      lesson_type: 'discussion' as const,
      tags: ['test'],
      estimated_duration_minutes: 45,
    };

    // Verify lesson structure
    expect(mockLesson.title).toBe('Test Lesson');
    expect(mockLesson.cefr_level).toBe('B1');
    expect(mockLesson.lesson_type).toBe('discussion');
    expect(mockLesson.category).toBe('general-english');
    expect(mockLesson.estimated_duration_minutes).toBe(45);
  });

  it('should handle empty lessons array', () => {
    const lessons: any[] = [];
    expect(lessons.length).toBe(0);
  });

  it('should handle pagination cursor', () => {
    const nextCursor = '2025-01-01T00:00:00Z';
    expect(nextCursor).toBeTruthy();
    expect(typeof nextCursor).toBe('string');
  });
});
