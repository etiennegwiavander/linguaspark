import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import PublicNavbar from '@/components/public-navbar';
import PublicFooter from '@/components/public-footer';
import type { PublicLesson } from '@/lib/types/public-lessons';

export const metadata: Metadata = {
  title: 'Public Lesson Library | LinguaSpark',
  description: 'Browse and discover professional language lessons created by tutors worldwide',
};

// Enable ISR with 5 minute revalidation
export const revalidate = 300;

// Temporary placeholder components until tasks 12 and 13 are complete
function PublicLessonCard({ lesson }: { lesson: PublicLesson }) {
  return (
    <div className="bg-white border-2 border-vintage-brown rounded-lg p-6 shadow-vintage hover:shadow-vintage-lg transition-shadow">
      {lesson.banner_image_url && (
        <div className="mb-4 rounded-lg overflow-hidden border border-vintage-brown/20">
          <img
            src={lesson.banner_image_url}
            alt={lesson.title}
            className="w-full h-48 object-cover"
          />
        </div>
      )}
      <h3 className="font-serif text-xl font-bold text-vintage-brown mb-2">
        {lesson.title}
      </h3>
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="px-2 py-1 bg-vintage-gold/20 text-vintage-brown text-xs rounded border border-vintage-gold">
          {lesson.cefr_level}
        </span>
        <span className="px-2 py-1 bg-vintage-burgundy/10 text-vintage-burgundy text-xs rounded border border-vintage-burgundy/30">
          {lesson.lesson_type}
        </span>
        <span className="px-2 py-1 bg-vintage-brown/10 text-vintage-brown text-xs rounded border border-vintage-brown/30">
          {lesson.category}
        </span>
      </div>
      {lesson.estimated_duration_minutes && (
        <p className="text-sm text-vintage-brown/60 mb-4">
          {lesson.estimated_duration_minutes} minutes
        </p>
      )}
      <Link href={`/public-lessons/${lesson.id}`}>
        <Button className="w-full bg-vintage-burgundy hover:bg-vintage-burgundy/90 text-vintage-cream">
          View Lesson
        </Button>
      </Link>
    </div>
  );
}

function PublicLibraryFilters() {
  return (
    <div className="bg-white border-2 border-vintage-brown rounded-lg p-6 shadow-vintage">
      <h2 className="font-serif text-lg font-bold text-vintage-brown mb-4">
        Filters
      </h2>
      <p className="text-sm text-vintage-brown/60">
        Filter functionality coming soon...
      </p>
    </div>
  );
}

async function fetchPublicLessons(): Promise<{
  lessons: PublicLesson[];
  nextCursor?: string;
}> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/public-lessons/list?limit=20`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.error('Failed to fetch public lessons:', response.statusText);
      return { lessons: [] };
    }

    const data = await response.json();
    
    if (!data.success) {
      console.error('API returned error:', data.error);
      return { lessons: [] };
    }

    return {
      lessons: data.lessons || [],
      nextCursor: data.nextCursor,
    };
  } catch (error) {
    console.error('Error fetching public lessons:', error);
    return { lessons: [] };
  }
}

export default async function PublicLibraryPage() {
  const { lessons, nextCursor } = await fetchPublicLessons();

  return (
    <div className="min-h-screen flex flex-col bg-vintage-cream">
      <PublicNavbar />
      
      <main className="flex-1 container mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-bold text-vintage-brown mb-3">
            Public Lesson Library
          </h1>
          <p className="text-lg text-vintage-brown/70">
            Discover professional language lessons created by tutors worldwide
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <PublicLibraryFilters />
          </aside>

          {/* Lessons Grid */}
          <div className="lg:col-span-3">
            {lessons.length === 0 ? (
              <div className="bg-white border-2 border-vintage-brown rounded-lg p-12 text-center shadow-vintage">
                <p className="text-lg text-vintage-brown/60 mb-4">
                  No lessons available yet
                </p>
                <p className="text-sm text-vintage-brown/50">
                  Check back soon for new content!
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {lessons.map((lesson) => (
                    <PublicLessonCard key={lesson.id} lesson={lesson} />
                  ))}
                </div>

                {/* Pagination Controls */}
                {nextCursor && (
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      className="border-2 border-vintage-brown text-vintage-brown hover:bg-vintage-brown hover:text-vintage-cream"
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
