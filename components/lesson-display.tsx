"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  BookOpen,
  MessageCircle,
  Volume2,
  CheckCircle,
  Users,
  FileText,
  Download,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { lessonExporter } from "@/lib/export-utils"

interface LessonSection {
  id: string
  title: string
  icon: React.ComponentType<any>
  enabled: boolean
  content: React.ReactNode
}

interface LessonData {
  lessonType: string
  studentLevel: string
  targetLanguage: string
  sections: {
    warmup: string[]
    vocabulary: Array<{ word: string; meaning: string; example: string }>
    reading: string
    comprehension: string[]
    discussion: string[]
    grammar: {
      focus: string
      examples: string[]
      exercise: string[]
    }
    pronunciation: {
      word: string
      ipa: string
      practice: string
    }
    wrapup: string[]
  }
  id?: string // Added optional id for lesson
}

interface LessonDisplayProps {
  lesson: LessonData
  onExportPDF: () => void
  onExportWord: () => void
  onNewLesson: () => void
}

export default function LessonDisplay({ lesson, onExportPDF, onExportWord, onNewLesson }: LessonDisplayProps) {
  // Ensure lesson has proper structure with fallbacks
  const safeLesson = {
    ...lesson,
    sections: {
      warmup: lesson.sections?.warmup || [],
      vocabulary: lesson.sections?.vocabulary || [],
      reading: lesson.sections?.reading || "",
      comprehension: lesson.sections?.comprehension || [],
      discussion: lesson.sections?.discussion || [],
      grammar: lesson.sections?.grammar || {
        focus: "Grammar Focus",
        examples: [],
        exercise: []
      },
      pronunciation: lesson.sections?.pronunciation || {
        word: "example",
        ipa: "/ɪɡˈzæmpəl/",
        practice: "This is an example sentence."
      },
      wrapup: lesson.sections?.wrapup || []
    }
  }

  const [sectionStates, setSectionStates] = useState<Record<string, boolean>>({
    warmup: true,
    vocabulary: true,
    reading: true,
    comprehension: true,
    discussion: true,
    grammar: true,
    pronunciation: true,
    wrapup: true,
  })

  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [isExportingWord, setIsExportingWord] = useState(false)
  const [exportError, setExportError] = useState("")

  const toggleSection = (sectionId: string) => {
    setSectionStates((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }

  const handleExportPDF = async () => {
    setIsExportingPDF(true)
    setExportError("")

    try {
      await lessonExporter.exportToPDF(safeLesson, sectionStates)

      if (lesson.id) {
        await fetch("/api/export-lesson", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lessonId: lesson.id,
            exportType: "pdf",
          }),
        })
      }
    } catch (error) {
      console.error("PDF export error:", error)
      setExportError("Failed to export PDF. Please try again.")
    } finally {
      setIsExportingPDF(false)
    }
  }

  const handleExportWord = async () => {
    setIsExportingWord(true)
    setExportError("")

    try {
      await lessonExporter.exportToWord(safeLesson, sectionStates)

      if (lesson.id) {
        await fetch("/api/export-lesson", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lessonId: lesson.id,
            exportType: "word",
          }),
        })
      }
    } catch (error) {
      console.error("Word export error:", error)
      setExportError("Failed to export Word document. Please try again.")
    } finally {
      setIsExportingWord(false)
    }
  }

  const sections: LessonSection[] = [
    {
      id: "warmup",
      title: "Warm-up Questions",
      icon: MessageCircle,
      enabled: sectionStates.warmup,
      content: (
        <div className="space-y-2">
          {safeLesson.sections.warmup.map((question, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-primary font-medium text-sm">{index + 1}.</span>
              <p className="text-sm">{question}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "vocabulary",
      title: "Key Vocabulary",
      icon: BookOpen,
      enabled: sectionStates.vocabulary,
      content: (
        <div className="space-y-3">
          {safeLesson.sections.vocabulary.map((item, index) => (
            <div key={index} className="border rounded-lg p-3 bg-muted/30">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-primary">{item.word}</span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Volume2 className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{item.meaning}</p>
              <p className="text-sm italic">"{item.example}"</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "reading",
      title: "Reading Passage",
      icon: FileText,
      enabled: sectionStates.reading,
      content: (
        <div className="prose prose-sm max-w-none">
          <div className="bg-muted/30 rounded-lg p-4 border">
            <p className="text-sm leading-relaxed">{safeLesson.sections.reading}</p>
          </div>
        </div>
      ),
    },
    {
      id: "comprehension",
      title: "Reading Comprehension",
      icon: CheckCircle,
      enabled: sectionStates.comprehension,
      content: (
        <div className="space-y-2">
          {safeLesson.sections.comprehension.map((question, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-primary font-medium text-sm">{index + 1}.</span>
              <p className="text-sm">{question}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "discussion",
      title: "Discussion Questions",
      icon: Users,
      enabled: sectionStates.discussion,
      content: (
        <div className="space-y-2">
          {safeLesson.sections.discussion.map((question, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-primary font-medium text-sm">{index + 1}.</span>
              <p className="text-sm">{question}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "grammar",
      title: "Grammar Focus",
      icon: BookOpen,
      enabled: sectionStates.grammar,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-2">Focus: {safeLesson.sections.grammar.focus}</h4>
            <div className="space-y-1">
              {safeLesson.sections.grammar.examples.map((example, index) => (
                <p key={index} className="text-sm bg-muted/30 rounded px-2 py-1">
                  {example}
                </p>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-sm mb-2">Practice Exercise</h4>
            <div className="space-y-1">
              {safeLesson.sections.grammar.exercise.map((exercise, index) => (
                <p key={index} className="text-sm font-mono bg-accent/30 rounded px-2 py-1">
                  {exercise}
                </p>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "pronunciation",
      title: "Pronunciation Practice",
      icon: Volume2,
      enabled: sectionStates.pronunciation,
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-lg">{safeLesson.sections.pronunciation.word}</span>
            <span className="text-muted-foreground font-mono">{safeLesson.sections.pronunciation.ipa}</span>
            <Button variant="outline" size="sm">
              <Volume2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-sm">Practice sentence:</p>
            <p className="text-sm font-medium mt-1">"{safeLesson.sections.pronunciation.practice}"</p>
          </div>
        </div>
      ),
    },
    {
      id: "wrapup",
      title: "Lesson Wrap-up",
      icon: CheckCircle,
      enabled: sectionStates.wrapup,
      content: (
        <div className="space-y-2">
          {safeLesson.sections.wrapup.map((question, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-primary font-medium text-sm">{index + 1}.</span>
              <p className="text-sm">{question}</p>
            </div>
          ))}
        </div>
      ),
    },
  ]

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log("🎓 Lesson Display - Received lesson:", {
      hasLesson: !!lesson,
      hasSections: !!lesson?.sections,
      sectionKeys: lesson?.sections ? Object.keys(lesson.sections) : [],
      lessonStructure: lesson
    })
    console.log("🛡️ Safe lesson structure:", safeLesson)
  }

  return (
    <div className="space-y-4">
      {/* Debug Info in Development */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-yellow-800">Debug Info (Development Only)</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xs text-yellow-700 space-y-1">
              <div>Lesson Type: {safeLesson.lessonType}</div>
              <div>Student Level: {safeLesson.studentLevel}</div>
              <div>Target Language: {safeLesson.targetLanguage}</div>
              <div>Sections: {Object.keys(safeLesson.sections).join(', ')}</div>
              <div>Warmup Items: {safeLesson.sections.warmup.length}</div>
              <div>Vocabulary Items: {safeLesson.sections.vocabulary.length}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Generated Lesson</h2>
          <div className="flex gap-2 mt-1">
            <Badge variant="default">{safeLesson.lessonType}</Badge>
            <Badge variant="outline">{safeLesson.studentLevel}</Badge>
            <Badge variant="secondary">{safeLesson.targetLanguage}</Badge>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onNewLesson}>
          New Lesson
        </Button>
      </div>

      {/* Export Error Alert */}
      {exportError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{exportError}</AlertDescription>
        </Alert>
      )}

      {/* Section Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Lesson Sections</CardTitle>
          <CardDescription className="text-xs">Toggle sections to customize your lesson</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {sections.map((section) => (
              <div key={section.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <section.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{section.title}</span>
                </div>
                <Switch checked={section.enabled} onCheckedChange={() => toggleSection(section.id)} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lesson Content */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {sections
          .filter((section) => section.enabled)
          .map((section, index) => (
            <Card key={section.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <section.icon className="h-4 w-4" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">{section.content}</CardContent>
              {index < sections.filter((s) => s.enabled).length - 1 && <Separator className="mt-2" />}
            </Card>
          ))}
      </div>

      {/* Export Actions */}
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground text-center">
              Export your lesson with only the selected sections included
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-transparent"
                onClick={handleExportPDF}
                disabled={isExportingPDF || isExportingWord}
              >
                {isExportingPDF ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export PDF
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-transparent"
                onClick={handleExportWord}
                disabled={isExportingPDF || isExportingWord}
              >
                {isExportingWord ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export Word
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
