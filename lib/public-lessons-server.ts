// Server-side utilities for public lesson library
// This file contains CRUD operations for public lessons with proper validation and access control

import { createServerSupabaseClient } from './supabase-server';
import type {
  PublicLesson,
  PublicLessonFilters,
  PublicLessonListResponse,
  LessonContent,
  PublicLessonMetadata,
} from './types/public-lessons';

// Result type for operations
interface OperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Validation result type
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates public lesson content before saving
 * Ensures all required sections are present and properly formatted
 */
export function validatePublicLessonContent(content: LessonContent): ValidationResult {
  const errors: string[] = [];

  // Validate title
  if (!content.title || content.title.trim().length === 0) {
    errors.push('Lesson title is required');
  }

  // Validate warmup section
  if (!content.warmup || !content.warmup.questions || content.warmup.questions.length === 0) {
    errors.push('Warmup section with at least one question is required');
  }

  // Validate wrapup section
  if (!content.wrapup || !content.wrapup.summary || content.wrapup.summary.trim().length === 0) {
    errors.push('Wrapup section with summary is required');
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
    errors.push('At least one main content section (vocabulary, grammar, reading, discussion, or pronunciation) is required');
  }

  // Validate metadata
  if (!content.metadata) {
    errors.push('Lesson metadata is required');
  } else {
    if (!content.metadata.cefr_level) {
      errors.push('CEFR level is required in metadata');
    }
    if (!content.metadata.lesson_type) {
      errors.push('Lesson type is required in metadata');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Retrieves public lessons with filtering and cursor-based pagination
 * Supports filtering by category, CEFR level, lesson type, and search
 */
export async function getPublicLessons(
  filters: PublicLessonFilters = {},
  cursor?: string,
  limit: number = 20
): Promise<OperationResult<PublicLessonListResponse>> {
  try {
    const supabase = await createServerSupabaseClient();

    // Build query with filters
    let query = supabase
      .from('public_lessons')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply cursor-based pagination
    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    // Apply category filter
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    // Apply CEFR level filter
    if (filters.cefr_level) {
      query = query.eq('cefr_level', filters.cefr_level);
    }

    // Apply lesson type filter
    if (filters.lesson_type) {
      query = query.eq('lesson_type', filters.lesson_type);
    }

    // Apply search filter (searches in title and source_title)
    if (filters.search && filters.search.trim().length > 0) {
      query = query.textSearch('search_vector', filters.search.trim());
    }

    const { data, error } = await query;

    if (error) {
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: `Failed to fetch public lessons: ${error.message}`,
      };
    }

    // Calculate next cursor
    const nextCursor = data && data.length === limit ? data[data.length - 1].created_at : undefined;

    return {
      success: true,
      data: {
        lessons: data || [],
        nextCursor,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'UNKNOWN_ERROR',
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Retrieves a single public lesson by ID
 * Accessible to all users (authenticated and unauthenticated)
 */
export async function getPublicLesson(lessonId: string): Promise<OperationResult<PublicLesson>> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('public_lessons')
      .select('*')
      .eq('id', lessonId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: 'NOT_FOUND',
          message: 'Public lesson not found',
        };
      }
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: `Failed to fetch public lesson: ${error.message}`,
      };
    }

    return {
      success: true,
      data: data as PublicLesson,
    };
  } catch (error) {
    return {
      success: false,
      error: 'UNKNOWN_ERROR',
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Creates a new public lesson
 * Requires authentication and validates content before saving
 */
export async function createPublicLesson(
  content: LessonContent,
  metadata: PublicLessonMetadata,
  userId: string
): Promise<OperationResult<string>> {
  try {
    // Validate content
    const validation = validatePublicLessonContent(content);
    if (!validation.valid) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: `Content validation failed: ${validation.errors.join(', ')}`,
      };
    }

    // Use service role client to bypass RLS for admin operations
    // This is safe because we've already verified admin status in the API route
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Prepare lesson data
    const lessonData = {
      creator_id: userId,
      title: content.title,
      content: content,
      source_url: content.metadata.source_url || null,
      source_title: content.metadata.source_title || null,
      banner_image_url: content.metadata.banner_image_url || null,
      category: metadata.category,
      cefr_level: content.metadata.cefr_level,
      lesson_type: content.metadata.lesson_type,
      tags: metadata.tags || [],
      estimated_duration_minutes: metadata.estimated_duration_minutes || null,
    };

    const { data, error } = await supabase
      .from('public_lessons')
      .insert(lessonData)
      .select('id')
      .single();

    if (error) {
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: `Failed to create public lesson: ${error.message}`,
      };
    }

    return {
      success: true,
      data: data.id,
      message: 'Public lesson created successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: 'UNKNOWN_ERROR',
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Updates an existing public lesson
 * Requires authentication (RLS enforces update permissions)
 */
export async function updatePublicLesson(
  lessonId: string,
  updates: Partial<PublicLesson>,
  userId: string
): Promise<OperationResult> {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      return {
        success: false,
        error: 'AUTHENTICATION_ERROR',
        message: 'User must be authenticated to update public lessons',
      };
    }

    // If content is being updated, validate it
    if (updates.content) {
      const validation = validatePublicLessonContent(updates.content);
      if (!validation.valid) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: `Content validation failed: ${validation.errors.join(', ')}`,
        };
      }
    }

    // Remove fields that shouldn't be updated directly
    const { id, created_at, creator_id, ...allowedUpdates } = updates;

    const { error } = await supabase
      .from('public_lessons')
      .update(allowedUpdates)
      .eq('id', lessonId);

    if (error) {
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: `Failed to update public lesson: ${error.message}`,
      };
    }

    return {
      success: true,
      message: 'Public lesson updated successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: 'UNKNOWN_ERROR',
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Deletes a public lesson
 * Requires admin privileges (enforced by RLS)
 */
export async function deletePublicLesson(
  lessonId: string,
  userId: string,
  skipAuthCheck: boolean = false
): Promise<OperationResult> {
  try {
    const supabase = await createServerSupabaseClient();

    // Skip auth check if already verified by caller (e.g., API route)
    if (!skipAuthCheck) {
      // Verify user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== userId) {
        return {
          success: false,
          error: 'AUTHENTICATION_ERROR',
          message: 'User must be authenticated to delete public lessons',
        };
      }
    }

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
        message: 'Only administrators can delete public lessons',
      };
    }

    // Proceed with deletion
    console.log('[deletePublicLesson] Attempting to delete lesson:', lessonId);
    console.log('[deletePublicLesson] User ID:', userId);
    console.log('[deletePublicLesson] Is admin:', tutor?.is_admin);
    
    const { error, count } = await supabase
      .from('public_lessons')
      .delete({ count: 'exact' })
      .eq('id', lessonId);

    console.log('[deletePublicLesson] Delete result - error:', error, 'count:', count);

    if (error) {
      console.error('[deletePublicLesson] Database error:', error);
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: `Failed to delete public lesson: ${error.message}`,
      };
    }

    if (count === 0) {
      console.warn('[deletePublicLesson] No rows deleted - lesson may not exist or RLS blocked it');
      return {
        success: false,
        error: 'NOT_FOUND',
        message: 'Lesson not found or you do not have permission to delete it',
      };
    }

    console.log('[deletePublicLesson] ✅ Successfully deleted lesson');
    return {
      success: true,
      message: 'Public lesson deleted successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: 'UNKNOWN_ERROR',
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
