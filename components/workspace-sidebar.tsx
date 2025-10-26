"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ChevronDown,
  ChevronRight,
  BookOpen,
  MessageCircle,
  Volume2,
  CheckCircle,
  Users,
  FileText,
  Download,
  History,
  Loader2,
  Clock,
  Trash2,
  Save,
} from "lucide-react"
import { lessonService, type Lesson } from "@/lib/lessons"
import { formatDistanceToNow } from "date-fns"

interface WorkspaceSidebarProps {
  sections: Array<{
    id: string
    title: string
    icon: React.ComponentType<any>
    enabled: boolean
  }>
  onToggleSection: (sectionId: string) => void
  onExportPDF: () => void
  onExportWord: () => void
  onExportHTML?: () => void
  onSaveToLibrary?: () => void
  onNewLesson: () => void
  onLoadLesson?: (lesson: Lesson) => void
  isExportingPDF: boolean
  isExportingWord: boolean
  isExportingHTML?: boolean
  isSavingToLibrary?: boolean
  isCollapsed: boolean
}

export default function WorkspaceSidebar({
  sections,
  onToggleSection,
  onExportPDF,
  onExportWord,
  onExportHTML,
  onSaveToLibrary,
  onNewLesson,
  onLoadLesson,
  isExportingPDF,
  isExportingWord,
  isExportingHTML,
  isSavingToLibrary,
  isCollapsed,
}: WorkspaceSidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    lessonSections: true,
    export: false,
    history: false,
  })
  const [lessonHistory, setLessonHistory] = useState<Lesson[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null)

  useEffect(() => {
    if (expandedSections.history && lessonHistory.length === 0) {
      loadLessonHistory()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedSections.history])

  const loadLessonHistory = async () => {
    setLoadingHistory(true)
    try {
      const lessons = await lessonService.getLessons(10, 0)
      setLessonHistory(lessons)
    } catch (error) {
      console.error("Failed to load lesson history:", error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleDeleteLesson = async (lessonId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Are you sure you want to delete this lesson?")) return

    setDeletingLessonId(lessonId)
    try {
      await lessonService.deleteLesson(lessonId)
      setLessonHistory((prev) => prev.filter((l) => l.id !== lessonId))
    } catch (error) {
      console.error("Failed to delete lesson:", error)
      alert("Failed to delete lesson")
    } finally {
      setDeletingLessonId(null)
    }
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  if (isCollapsed) {
    return (
      <div className="h-full bg-muted/30 border-r border-border flex flex-col items-center py-4 gap-4">
        <BookOpen className="h-5 w-5 text-muted-foreground" />
        <Download className="h-5 w-5 text-muted-foreground" />
        <History className="h-5 w-5 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-full bg-muted border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <h2 className="text-lg font-semibold text-foreground">Workspace</h2>
        <p className="text-xs text-muted-foreground mt-1">Manage your lesson</p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Lesson Sections */}
        <div className="border-b border-border">
          <button
            onClick={() => toggleSection("lessonSections")}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Lesson Sections</span>
            </div>
            {expandedSections.lessonSections ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {expandedSections.lessonSections && (
            <div className="px-4 py-2 space-y-1">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="flex items-center justify-between py-2 px-2 rounded-sm hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <section.icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs font-medium truncate">{section.title}</span>
                  </div>
                  <Switch
                    checked={section.enabled}
                    onCheckedChange={() => onToggleSection(section.id)}
                    className="scale-75"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Export */}
        <div className="border-b border-border">
          <button
            onClick={() => toggleSection("export")}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Export</span>
            </div>
            {expandedSections.export ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {expandedSections.export && (
            <div className="px-4 py-2 space-y-2">
              {onSaveToLibrary && (
                <Button
                  variant="default"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={onSaveToLibrary}
                  disabled={isSavingToLibrary}
                >
                  {isSavingToLibrary ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-3.5 w-3.5" />
                      Save to Library
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={onExportHTML}
                disabled={isExportingPDF || isExportingWord || isExportingHTML}
              >
                {isExportingHTML ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-3.5 w-3.5" />
                    Export as HTML
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={onExportPDF}
                disabled={isExportingPDF || isExportingWord || isExportingHTML}
              >
                {isExportingPDF ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-3.5 w-3.5" />
                    Export as PDF
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={onExportWord}
                disabled={isExportingPDF || isExportingWord || isExportingHTML}
              >
                {isExportingWord ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-3.5 w-3.5" />
                    Export as Word
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Lesson Library Link */}
        <div className="border-b border-border">
          <a
            href="/library"
            className="w-full px-4 py-3 flex items-center gap-2 hover:bg-muted/50 transition-colors block"
          >
            <History className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Lesson Library</span>
          </a>
        </div>

        {/* Lesson History */}
        {/* <div className="border-b border-border">
          <button
            onClick={() => toggleSection("history")}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">History</span>
            </div>
            {expandedSections.history ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {expandedSections.history && (
            <div className="px-4 py-2">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : lessonHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-xs text-muted-foreground">No lessons yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {lessonHistory.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="group p-2 rounded-sm hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border"
                      onClick={() => onLoadLesson?.(lesson)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{lesson.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {lesson.student_level}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                              {lesson.lesson_type}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(lesson.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteLesson(lesson.id, e)}
                          disabled={deletingLessonId === lesson.id}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                        >
                          {deletingLessonId === lesson.id ? (
                            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                          ) : (
                            <Trash2 className="h-3 w-3 text-destructive" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div> */}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-border">
        <Button variant="default" size="sm" className="w-full" onClick={onNewLesson}>
          New Lesson
        </Button>
      </div>
    </div>
  )
}
