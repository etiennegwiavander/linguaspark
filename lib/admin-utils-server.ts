/**
 * Admin Utilities - Server-side functions for admin verification and statistics
 * 
 * This module provides admin-related functionality including:
 * - Admin status verification
 * - Admin statistics retrieval
 * - Admin verification middleware
 */

import { createClient } from '@supabase/supabase-js';
import type { AdminStats, PublicLesson, LessonCategory, CEFRLevel } from './types/public-lessons';

/**
 * Create admin Supabase client (bypasses RLS for admin checks)
 */
function getAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Check if a user has admin privileges
 * 
 * @param userId - The UUID of the user to check
 * @returns Promise<boolean> - True if user is admin, false otherwise
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    console.log('[isAdmin] 🔍 Checking admin status for userId:', userId);
    const supabase = getAdminSupabaseClient();

    console.log('[isAdmin] 📡 Querying tutors table...');
    const { data, error } = await supabase
      .from('tutors')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[isAdmin] ❌ Database error:', error);
      return false;
    }

    console.log('[isAdmin] 📊 Database returned data:', data);
    console.log('[isAdmin] 🎯 is_admin value:', data?.is_admin);
    console.log('[isAdmin] ✅ Returning:', data?.is_admin === true);

    return data?.is_admin === true;
  } catch (error) {
    console.error('[isAdmin] ❌ Exception:', error);
    return false;
  }
}

/**
 * Verify admin status and throw error if not admin
 * Used as middleware-style verification
 * 
 * @param userId - The UUID of the user to verify
 * @throws Error if user is not admin
 */
export async function verifyAdmin(userId: string): Promise<void> {
  const adminStatus = await isAdmin(userId);

  if (!adminStatus) {
    throw new Error('PERMISSION_DENIED: Admin privileges required');
  }
}

/**
 * Get comprehensive admin statistics
 * 
 * @param adminId - The UUID of the admin user requesting stats
 * @returns Promise<AdminStats> - Statistics object with lesson counts and breakdowns
 */
export async function getAdminStats(adminId: string): Promise<AdminStats> {
  try {
    // Verify admin status first
    await verifyAdmin(adminId);

    const supabase = getAdminSupabaseClient();

    // Get all public lessons
    const { data: allLessons, error: lessonsError } = await supabase
      .from('public_lessons')
      .select('*')
      .order('created_at', { ascending: false });

    if (lessonsError) {
      throw new Error(`Failed to fetch lessons: ${lessonsError.message}`);
    }

    const lessons = allLessons || [];

    // Calculate total lessons
    const total_lessons = lessons.length;

    // Calculate lessons by category
    const lessons_by_category: Record<LessonCategory, number> = {
      'general-english': 0,
      'business': 0,
      'travel': 0,
      'academic': 0,
      'conversation': 0,
      'grammar': 0,
      'vocabulary': 0,
      'pronunciation': 0,
      'culture': 0
    };

    lessons.forEach((lesson: PublicLesson) => {
      if (lesson.category in lessons_by_category) {
        lessons_by_category[lesson.category as LessonCategory]++;
      }
    });

    // Calculate lessons by CEFR level
    const lessons_by_level: Record<CEFRLevel, number> = {
      'A1': 0,
      'A2': 0,
      'B1': 0,
      'B2': 0,
      'C1': 0
    };

    lessons.forEach((lesson: PublicLesson) => {
      if (lesson.cefr_level in lessons_by_level) {
        lessons_by_level[lesson.cefr_level as CEFRLevel]++;
      }
    });

    // Get recent lessons (last 10)
    const recent_lessons = lessons.slice(0, 10);

    // Count lessons created by this admin
    const my_lessons_count = lessons.filter(
      (lesson: PublicLesson) => lesson.creator_id === adminId
    ).length;

    return {
      total_lessons,
      lessons_by_category,
      lessons_by_level,
      recent_lessons,
      my_lessons_count
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
      throw error;
    }
    console.error('Error getting admin stats:', error);
    throw new Error('Failed to retrieve admin statistics');
  }
}

/**
 * Admin verification middleware for API routes
 * Returns user ID if admin, throws error otherwise
 * 
 * @param request - The incoming request object
 * @returns Promise<string> - The admin user's ID
 * @throws Error if not authenticated or not admin
 */
export async function requireAdmin(request: Request): Promise<string> {
  try {
    const supabase = getAdminSupabaseClient();

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      throw new Error('UNAUTHORIZED: No authorization header');
    }

    // Extract token
    const token = authHeader.replace('Bearer ', '');

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('UNAUTHORIZED: Invalid token');
    }

    // Verify admin status
    await verifyAdmin(user.id);

    return user.id;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('UNAUTHORIZED: Authentication failed');
  }
}

/**
 * Get admin user information
 * 
 * @param userId - The UUID of the admin user
 * @returns Promise with admin user data
 */
export async function getAdminInfo(userId: string): Promise<{
  id: string;
  email: string;
  is_admin: boolean;
} | null> {
  try {
    const supabase = getAdminSupabaseClient();

    const { data, error } = await supabase
      .from('tutors')
      .select('id, email, is_admin')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching admin info:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception fetching admin info:', error);
    return null;
  }
}
