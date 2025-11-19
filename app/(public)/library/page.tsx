'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BookOpen,
  Search,
  Filter,
  Calendar,
  Globe,
  GraduationCap,
  FileText,
  Eye,
  Loader2,
  Trash2,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';
import PublicNavbar from '@/components/public-navbar';
import PublicFooter from '@/components/public-footer';
import type { PublicLesson } from '@/lib/types/public-lessons';

export default function PublicLibraryPage() {
  const router = useRouter();
  const [lessons, setLessons] = useState<PublicLesson[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<PublicLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isAdmin, setIsAdmin] = useState(false);
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<PublicLesson | null>(null);

  // Check admin status
  useEffect(() => {
    async function checkAdminStatus() {
      try {
        const sessionData = localStorage.getItem('sb-jbkpnirowdvlwlgheqho-auth-token');
        if (!sessionData) return;
        
        const session = JSON.parse(sessionData);
        const userId = session.user?.id;
        if (!userId) return;
        
        const response = await fetch('/api/admin/check-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.isAdmin === true);
        }
      } catch (error) {
        console.error('Failed to check admin status:', error);
      }
    }
    
    checkAdminStatus();
  }, []);

  // Load lessons
  useEffect(() => {
    async function loadLessons() {
      try {
        setLoading(true);
        const response = await fetch('/api/public-lessons/list?limit=100');
        
        if (!response.ok) {
          console.error('Failed to fetch lessons');
          return;
        }

        const data = await response.json();
        if (data.success) {
          setLessons(data.lessons || []);
        }
      } catch (error) {
        console.error('Error loading lessons:', error);
      } finally {
        setLoading(false);
      }
    }

    loadLessons();
  }, []);

  // Filter lessons
  useEffect(() => {
    let filtered = lessons;

    if (searchQuery) {
      filtered = filtered.filter((lesson) =>
        lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.source_url?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterLevel !== 'all') {
      filtered = filtered.filter((lesson) => lesson.cefr_level === filterLevel);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((lesson) => lesson.lesson_type === filterType);
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter((lesson) => lesson.category === filterCategory);
    }

    setFilteredLessons(filtered);
  }, [lessons, searchQuery, filterLevel, filterType, filterCategory]);

  const handleViewLesson = (lessonId: string) => {
    router.push(`/library/${lessonId}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, lesson: PublicLesson) => {
    e.stopPropagation();
    setLessonToDelete(lesson);
  };

  const handleDeleteConfirm = async () => {
    if (!lessonToDelete) return;
    
    setDeletingLessonId(lessonToDelete.id);
    try {
      const response = await fetch(`/api/public-lessons/delete/${lessonToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete lesson');
      }

      // Remove lesson from state
      setLessons(lessons.filter(l => l.id !== lessonToDelete.id));
      alert('Lesson deleted successfully!');
    } catch (error) {
      console.error('Failed to delete lesson:', error);
      alert(`Failed to delete lesson: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeletingLessonId(null);
      setLessonToDelete(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterLevel('all');
    setFilterType('all');
    setFilterCategory('all');
  };

  const uniqueLevels = Array.from(new Set(lessons.map((l) => l.cefr_level)));
  const uniqueTypes = Array.from(new Set(lessons.map((l) => l.lesson_type)));
  const uniqueCategories = Array.from(new Set(lessons.map((l) => l.category)));

  const activeFiltersCount =
    (searchQuery ? 1 : 0) +
    (filterLevel !== 'all' ? 1 : 0) +
    (filterType !== 'all' ? 1 : 0) +
    (filterCategory !== 'all' ? 1 : 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />
      
      <main className="flex-1 container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            Lesson Library
          </h1>
          <p className="text-muted-foreground mt-1">
            {filteredLessons.length} of {lessons.length} lessons
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary">{activeFiltersCount} active</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search lessons by title or source..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {uniqueLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Languages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  {uniqueCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center">
                {activeFiltersCount > 0 && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lessons Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Loading lessons...</p>
          </div>
        ) : filteredLessons.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No lessons found</h3>
              <p className="text-muted-foreground">
                {lessons.length === 0
                  ? 'Check back soon for new content!'
                  : 'Try adjusting your filters'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLessons.map((lesson) => {
              // Get banner image from content.metadata
              const bannerImage = lesson.content?.metadata?.bannerImages?.[0]?.src;
              
              return (
                <Card
                  key={lesson.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                  onClick={() => handleViewLesson(lesson.id)}
                >
                  {/* Banner Image */}
                  {bannerImage && (
                    <div className="w-full h-48 overflow-hidden bg-muted">
                      <img
                        src={bannerImage}
                        alt={lesson.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2">
                      {lesson.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 text-xs">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(lesson.created_at), { addSuffix: true })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="default" className="flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" />
                        {lesson.cefr_level}
                      </Badge>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {lesson.lesson_type}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {lesson.category}
                      </Badge>
                    </div>

                    {/* Source */}
                    {lesson.source_url && (
                      <div className="text-xs text-muted-foreground truncate">
                        <span className="font-medium">Source:</span>{' '}
                        {new URL(lesson.source_url).hostname}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewLesson(lesson.id);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      
                      {/* Admin Delete Button */}
                      {isAdmin && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex items-center gap-2"
                          onClick={(e) => handleDeleteClick(e, lesson)}
                          disabled={deletingLessonId === lesson.id}
                        >
                          {deletingLessonId === lesson.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <PublicFooter />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!lessonToDelete} onOpenChange={(open) => !open && setLessonToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{lessonToDelete?.title}"? This action cannot be undone and will remove the lesson from the public library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingLessonId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={!!deletingLessonId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingLessonId ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
