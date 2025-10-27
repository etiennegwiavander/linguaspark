import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getPublicLesson } from '@/lib/public-lessons-server';
import PublicLessonView from '@/components/public-lesson-view';

// Enable ISR with 1 hour revalidation
export const revalidate = 3600;

// Generate static params for known lessons
export async function generateStaticParams() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: lessons } = await supabase
      .from('public_lessons')
      .select('id')
      .limit(100);

    if (!lessons) return [];

    return lessons.map((lesson) => ({
      id: lesson.id,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const result = await getPublicLesson(params.id);

  if (!result.success || !result.data) {
    return {
      title: 'Lesson Not Found | LinguaSpark',
    };
  }

  const lesson = result.data;

  return {
    title: `${lesson.title} | LinguaSpark`,
    description: `${lesson.cefr_level} ${lesson.lesson_type} lesson - ${lesson.category}`,
    openGraph: {
      title: lesson.title,
      description: `${lesson.cefr_level} ${lesson.lesson_type} lesson`,
      images: lesson.banner_image_url ? [lesson.banner_image_url] : [],
    },
  };
}

interface PublicLessonPageProps {
  params: {
    id: string;
  };
}

export default async function PublicLessonPage({ params }: PublicLessonPageProps) {
  // Fetch the public lesson
  const result = await getPublicLesson(params.id);

  if (!result.success || !result.data) {
    notFound();
  }

  const lesson = result.data;

  // Check authentication status
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check if user is admin (if authenticated)
  let isAdmin = false;
  if (user) {
    const { data: tutor } = await supabase
      .from('tutors')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    isAdmin = tutor?.is_admin === true;
  }

  return (
    <PublicLessonView
      lesson={lesson}
      isAuthenticated={!!user}
      isAdmin={isAdmin}
      userId={user?.id}
    />
  );
}
