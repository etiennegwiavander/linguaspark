"use client";

import React, { useEffect, useState } from "react";
import { AdminStats, LessonCategory, CEFRLevel } from "@/lib/types/public-lessons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, BookOpen, Calendar, TrendingUp, User } from "lucide-react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase";

interface AdminStatsPanelProps {
  className?: string;
}

// Helper function to format category for display
function formatCategory(category: string): string {
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Helper function to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Category colors for visual distinction
const categoryColors: Record<LessonCategory, string> = {
  "general-english": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "business": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "travel": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "academic": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  "conversation": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  "grammar": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  "vocabulary": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  "pronunciation": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  "culture": "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
};

// CEFR level colors
const levelColors: Record<CEFRLevel, string> = {
  "A1": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "A2": "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200",
  "B1": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  "B2": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  "C1": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function AdminStatsPanel({ className }: AdminStatsPanelProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdminAndFetchStats() {
      try {
        const supabase = getSupabaseClient();
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // Check if user is admin
        const { data: tutorData, error: tutorError } = await supabase
          .from('tutors')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (tutorError || !tutorData?.is_admin) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        setIsAdmin(true);

        // Fetch admin stats
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('No active session');
        }

        const response = await fetch('/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch admin statistics');
        }

        const data = await response.json();

        if (data.success && data.stats) {
          setStats(data.stats);
        } else {
          throw new Error(data.error || 'Failed to load statistics');
        }
      } catch (err) {
        console.error('Error fetching admin stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    }

    checkAdminAndFetchStats();
  }, []);

  // Don't render anything if not admin
  if (!isAdmin && !loading) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={className}>
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardHeader>
            <CardTitle className="text-red-800 dark:text-red-200">Error Loading Statistics</CardTitle>
            <CardDescription className="text-red-600 dark:text-red-400">{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // No stats available
  if (!stats) {
    return null;
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Admin Statistics
          </CardTitle>
          <CardDescription>
            Overview of public lesson library content and your contributions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Total Lessons Count */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Lessons</p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                      {stats.total_lessons}
                    </p>
                  </div>
                  <BookOpen className="h-10 w-10 text-blue-600 dark:text-blue-400 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Your Lessons</p>
                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                      {stats.my_lessons_count}
                    </p>
                  </div>
                  <User className="h-10 w-10 text-purple-600 dark:text-purple-400 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lessons by Category */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Lessons by Category
            </h3>
            <div className="space-y-2">
              {Object.entries(stats.lessons_by_category)
                .filter(([_, count]) => count > 0)
                .sort(([_, a], [__, b]) => b - a)
                .map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Badge className={categoryColors[category as LessonCategory]}>
                        {formatCategory(category)}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
              {Object.values(stats.lessons_by_category).every(count => count === 0) && (
                <p className="text-sm text-muted-foreground italic">No lessons yet</p>
              )}
            </div>
          </div>

          {/* Lessons by CEFR Level */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Lessons by CEFR Level
            </h3>
            <div className="space-y-2">
              {Object.entries(stats.lessons_by_level)
                .filter(([_, count]) => count > 0)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([level, count]) => (
                  <div key={level} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Badge className={levelColors[level as CEFRLevel]}>
                        {level}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
              {Object.values(stats.lessons_by_level).every(count => count === 0) && (
                <p className="text-sm text-muted-foreground italic">No lessons yet</p>
              )}
            </div>
          </div>

          {/* Recent Additions */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Recent Additions
            </h3>
            <div className="space-y-2">
              {stats.recent_lessons.length > 0 ? (
                stats.recent_lessons.slice(0, 5).map((lesson) => (
                  <Link
                    key={lesson.id}
                    href={`/library/${lesson.id}`}
                    className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{lesson.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {formatCategory(lesson.category)}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {lesson.cefr_level}
                          </Badge>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(lesson.created_at)}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">No recent lessons</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
