"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BookOpen,
  Search,
  Filter,
  Calendar,
  Globe,
  GraduationCap,
  FileText,
  Trash2,
  Eye,
  Loader2,
  ArrowLeft,
  AlertCircle,
} from "lucide-react"
import { lessonService, type Lesson } from "@/lib/lessons"
import { formatDistanceToNow } from "date-fns"
import { useAuth } from "@/components/auth-wrapper"
import UserMenu from "@/components/user-menu"

export default function LessonLibrary() {
  const router = useRouter()
  const { user } = useAuth() // Use the auth context instead of checking manually
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterLevel, setFilterLevel] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterLanguage, setFilterLanguage] = useState<string>("all")
  const [filterSource, setFilterSource] = useState<string>("all")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadLessons = React.useCallback(async () => {
    console.log('[LessonLibrary] loadLessons called, user:', user?.email || 'NO USER')

    if (!user) {
      console.log('[LessonLibrary] No user, returning early')
      return
    }

    console.log('[LessonLibrary] Setting loading=true')
    setLoading(true)
    setError(null)

    try {
      console.log('[LessonLibrary] Calling API route to get lessons')

      // Get the session from localStorage (where Supabase stores it)
      const sessionData = localStorage.getItem('sb-jbkpnirowdvlwlgheqho-auth-token')
      if (!sessionData) {
        throw new Error('No session found')
      }

      const session = JSON.parse(sessionData)
      const accessToken = session.access_token

      console.log('[LessonLibrary] Got access token from localStorage')

      const response = await fetch('/api/get-lessons', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      console.log('[LessonLibrary] API response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('[LessonLibrary] API error:', errorData)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const { lessons: data } = await response.json()
      console.log('[LessonLibrary] Got data:', data?.length || 0, 'lessons')

      setLessons(data || [])
    } catch (error) {
      console.error("❌ [LessonLibrary] Failed to load lessons:", error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
      setLessons([])
    } finally {
      console.log('[LessonLibrary] Setting loading=false')
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadLessons()
  }, [loadLessons])

  useEffect(() => {
    applyFilters()
  }, [lessons, searchQuery, filterLevel, filterType, filterLanguage, filterSource])



  const applyFilters = () => {
    let filtered = [...lessons]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (lesson) =>
          lesson.title.toLowerCase().includes(query) ||
          lesson.lesson_data.lessonTitle.toLowerCase().includes(query) ||
          lesson.source_url?.toLowerCase().includes(query)
      )
    }

    // Level filter
    if (filterLevel !== "all") {
      filtered = filtered.filter((lesson) => lesson.student_level === filterLevel)
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter((lesson) => lesson.lesson_type === filterType)
    }

    // Language filter
    if (filterLanguage !== "all") {
      filtered = filtered.filter((lesson) => lesson.target_language === filterLanguage)
    }

    // Source filter
    if (filterSource !== "all") {
      if (filterSource === "web") {
        filtered = filtered.filter((lesson) => lesson.source_url)
      } else if (filterSource === "manual") {
        filtered = filtered.filter((lesson) => !lesson.source_url)
      }
    }

    setFilteredLessons(filtered)
  }

  const handleDeleteLesson = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Are you sure you want to delete this lesson?")) return

    setDeletingId(id)
    try {
      console.log('[LessonLibrary] Deleting lesson:', id)

      // Get auth token from localStorage
      const sessionData = localStorage.getItem('sb-jbkpnirowdvlwlgheqho-auth-token')
      if (!sessionData) {
        throw new Error('No authentication session found')
      }

      const session = JSON.parse(sessionData)
      const authToken = session.access_token

      // Call the delete API route
      const response = await fetch(`/api/delete-lesson?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      console.log('[LessonLibrary] ✅ Lesson deleted successfully')
      setLessons((prev) => prev.filter((l) => l.id !== id))
    } catch (error) {
      console.error("[LessonLibrary] Failed to delete lesson:", error)
      alert(error instanceof Error ? error.message : "Failed to delete lesson")
    } finally {
      setDeletingId(null)
    }
  }

  const handleViewLesson = (lesson: Lesson) => {
    // Navigate to popup page with lesson data
    router.push(`/popup?lessonId=${lesson.id}`)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setFilterLevel("all")
    setFilterType("all")
    setFilterLanguage("all")
    setFilterSource("all")
  }

  // Get unique values for filters
  const uniqueLevels = Array.from(new Set(lessons.map((l) => l.student_level)))
  const uniqueTypes = Array.from(new Set(lessons.map((l) => l.lesson_type)))
  const uniqueLanguages = Array.from(new Set(lessons.map((l) => l.target_language)))

  const activeFiltersCount =
    (searchQuery ? 1 : 0) +
    (filterLevel !== "all" ? 1 : 0) +
    (filterType !== "all" ? 1 : 0) +
    (filterLanguage !== "all" ? 1 : 0) +
    (filterSource !== "all" ? 1 : 0)

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <BookOpen className="h-8 w-8" />
                Lesson Library
              </h1>
              <p className="text-muted-foreground mt-1">
                {filteredLessons.length} of {lessons.length} lessons
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => router.push("/")}>
              Create New Lesson
            </Button>
            <UserMenu />
          </div>
        </div>

        {/* Filters */}
        <Card>
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

              <Select value={filterLanguage} onValueChange={setFilterLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="All Languages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  {uniqueLanguages.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="web">From Web</SelectItem>
                  <SelectItem value="manual">Manual Entry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {activeFiltersCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear All Filters
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load lessons: {error}
              <Button
                variant="outline"
                size="sm"
                className="ml-4"
                onClick={loadLessons}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

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
              <p className="text-muted-foreground mb-4">
                {lessons.length === 0
                  ? "Create your first lesson to get started"
                  : "Try adjusting your filters"}
              </p>
              {lessons.length === 0 && (
                <Button onClick={() => router.push("/")}>
                  Create Your First Lesson
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLessons.map((lesson) => (
              <Card
                key={lesson.id}
                className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                onClick={() => handleViewLesson(lesson)}
              >
                {/* Banner Image */}
                {lesson.lesson_data.metadata?.bannerImages?.[0]?.src && (
                  <div className="w-full h-48 overflow-hidden bg-muted">
                    <img
                      src={lesson.lesson_data.metadata.bannerImages[0].src}
                      alt={lesson.lesson_data.metadata.bannerImages[0].alt || lesson.lesson_data.lessonTitle}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Hide image if it fails to load
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-2">
                      {lesson.lesson_data.lessonTitle || lesson.title}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0"
                      onClick={(e) => handleDeleteLesson(lesson.id, e)}
                      disabled={deletingId === lesson.id}
                    >
                      {deletingId === lesson.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
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
                      {lesson.student_level}
                    </Badge>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {lesson.lesson_type}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {lesson.target_language}
                    </Badge>
                  </div>

                  {/* Source */}
                  {lesson.source_url && (
                    <div className="text-xs text-muted-foreground truncate">
                      <span className="font-medium">Source:</span>{" "}
                      {new URL(lesson.source_url).hostname}
                    </div>
                  )}

                  {/* View Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleViewLesson(lesson)
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Lesson
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
