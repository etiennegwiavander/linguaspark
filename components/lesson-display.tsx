"use client"

import React, { useState, useEffect } from "react"
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
  ChevronRight,
  ChevronLeft,
} from "lucide-react"
import { lessonExporter } from "@/lib/export-utils"
import { exportToHTML } from "@/lib/export-html-pptx"
import { enhanceDialogueWithAvatars, type Avatar } from "@/lib/avatar-utils"
import WorkspaceSidebar from "@/components/workspace-sidebar"
import { AdminLessonCreationDialog } from "@/components/admin-lesson-creation-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Lesson } from "@/lib/lessons"

interface LessonSection {
  id: string
  title: string
  icon: React.ComponentType<any>
  enabled: boolean
  content: React.ReactNode
}

interface LessonData {
  lessonTitle: string
  lessonType: string
  studentLevel: string
  targetLanguage: string
  metadata?: {
    title?: string
    description?: string
    author?: string
    publishDate?: string
    contentType?: string
    domain?: string
    language?: string
    keywords?: string[]
    bannerImages?: Array<{
      src: string
      alt: string
      type: 'meta' | 'content'
      priority: number
      width?: number | null
      height?: number | null
    }>
  }
  extractionSource?: {
    url: string
    domain: string
    title?: string
    author?: string
  }
  sections: {
    warmup: string[]
    vocabulary: Array<{ word: string; meaning: string; example?: string; examples?: string[] }>
    reading: string
    comprehension: string[]
    discussion: string[]
    grammar: {
      focus: string
      explanation?: {
        form: string
        usage: string
        levelNotes?: string
      }
      examples: string[]
      exercise?: string[]
      exercises?: Array<{
        prompt: string
        answer: string
        explanation?: string
      }>
    }
    pronunciation?: {
      instruction?: string
      word?: string
      ipa?: string
      practice?: string
      words?: Array<{
        word: string
        ipa: string
        difficultSounds?: string[]
        tips?: string[]
        practiceSentence?: string
      }>
      tongueTwisters?: Array<{
        text: string
        targetSounds?: string[]
        difficulty?: string
      }>
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
  onLoadLesson?: (lesson: Lesson) => void
}

// Avatar component for dialogue sections
function AvatarImage({ avatar, size = "sm" }: { avatar: Avatar; size?: "sm" | "md" }) {
  const sizeClasses = size === "md" ? "w-12 h-12" : "w-10 h-10"

  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0">
      <div className={`${sizeClasses} rounded-md overflow-hidden bg-muted border border-border`}>
        <img
          src={avatar.image}
          alt={avatar.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to initials if image fails to load
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            const parent = target.parentElement
            if (parent) {
              parent.innerHTML = `<div class="w-full h-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">${avatar.name.charAt(0)}</div>`
            }
          }}
        />
      </div>
      <span className="text-xs text-muted-foreground font-medium">{avatar.name}</span>
    </div>
  )
}

export default function LessonDisplay({ lesson, onExportPDF, onExportWord, onNewLesson, onLoadLesson }: LessonDisplayProps) {
  // Create a consistent lesson ID for avatar persistence
  const lessonId = React.useMemo(() => {
    if (lesson.id) return lesson.id

    // Create hash from lesson content for consistency
    const content = JSON.stringify({
      type: lesson.lessonType,
      level: lesson.studentLevel,
      title: lesson.lessonTitle,
      // Use first few dialogue lines as unique identifier
      dialogue: lesson.sections?.dialoguePractice?.dialogue?.slice(0, 2) ||
        lesson.sections?.dialogueFillGap?.dialogue?.slice(0, 2) || []
    })

    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return `lesson-${Math.abs(hash)}`
  }, [lesson])

  // Ensure lesson has proper structure with fallbacks
  const safeLesson = {
    ...lesson,
    lessonTitle: lesson.lessonTitle,
    sections: {
      warmup: lesson.sections?.warmup || [],
      vocabulary: lesson.sections?.vocabulary || [],
      reading: lesson.sections?.reading || "",
      comprehension: lesson.sections?.comprehension || [],
      dialoguePractice: lesson.sections?.dialoguePractice || {
        instruction: "",
        dialogue: [],
        followUpQuestions: []
      },
      dialogueFillGap: lesson.sections?.dialogueFillGap || {
        instruction: "",
        dialogue: [],
        answers: []
      },
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
    dialoguePractice: true,
    dialogueFillGap: true,
    discussion: true,
    grammar: true,
    pronunciation: true,
    wrapup: true,
  })

  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [isExportingWord, setIsExportingWord] = useState(false)
  const [isExportingHTML, setIsExportingHTML] = useState(false)
  const [isSavingToLibrary, setIsSavingToLibrary] = useState(false)
  const [exportError, setExportError] = useState("")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true) // Start collapsed on mobile
  
  // Admin public library state
  const [showSaveLocationDialog, setShowSaveLocationDialog] = useState(false)
  const [showAdminLessonDialog, setShowAdminLessonDialog] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        console.log('[LessonDisplay] 🔍 Checking admin status...')
        const sessionData = localStorage.getItem('sb-jbkpnirowdvlwlgheqho-auth-token')
        if (!sessionData) {
          console.log('[LessonDisplay] ❌ No session data found')
          return
        }
        
        const session = JSON.parse(sessionData)
        const userId = session.user?.id
        
        if (!userId) {
          console.log('[LessonDisplay] ❌ No user ID found')
          return
        }
        
        console.log('[LessonDisplay] 📡 Calling admin check API with userId:', userId)
        const response = await fetch('/api/admin/check-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('[LessonDisplay] ✅ Admin check response:', data)
          setIsAdmin(data.isAdmin === true)
          console.log('[LessonDisplay] 🎯 isAdmin set to:', data.isAdmin === true)
        } else {
          console.log('[LessonDisplay] ❌ Admin check failed with status:', response.status)
        }
      } catch (error) {
        console.error('[LessonDisplay] ❌ Failed to check admin status:', error)
      }
    }
    
    checkAdminStatus()
  }, [])

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
      // Create export-compatible lesson structure with fallbacks
      const exportLesson = {
        lessonTitle: safeLesson.lessonTitle,
        lessonType: safeLesson.lessonType || "discussion",
        studentLevel: safeLesson.studentLevel || "B1",
        targetLanguage: safeLesson.targetLanguage || "english",
        sections: {
          warmup: safeLesson.sections.warmup || [],
          vocabulary: safeLesson.sections.vocabulary || [],
          reading: safeLesson.sections.reading || "",
          comprehension: safeLesson.sections.comprehension || [],
          discussion: safeLesson.sections.discussion || [],
          dialoguePractice: safeLesson.sections.dialoguePractice || undefined,
          dialogueFillGap: safeLesson.sections.dialogueFillGap || undefined,
          grammar: safeLesson.sections.grammar || {
            focus: "Grammar Focus",
            examples: [],
            exercise: []
          },
          pronunciation: safeLesson.sections.pronunciation || {
            word: "example",
            ipa: "/ɪɡˈzæmpəl/",
            practice: "This is an example sentence."
          },
          wrapup: safeLesson.sections.wrapup || []
        }
      }

      console.log('Exporting PDF with lesson data:', exportLesson)
      console.log('Section states:', sectionStates)
      console.log('Safe lesson structure:', safeLesson)
      await lessonExporter.exportToPDF(exportLesson, sectionStates)
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
      // Create export-compatible lesson structure with fallbacks
      const exportLesson = {
        lessonTitle: safeLesson.lessonTitle,
        lessonType: safeLesson.lessonType || "discussion",
        studentLevel: safeLesson.studentLevel || "B1",
        targetLanguage: safeLesson.targetLanguage || "english",
        sections: {
          warmup: safeLesson.sections.warmup || [],
          vocabulary: safeLesson.sections.vocabulary || [],
          reading: safeLesson.sections.reading || "",
          comprehension: safeLesson.sections.comprehension || [],
          discussion: safeLesson.sections.discussion || [],
          dialoguePractice: safeLesson.sections.dialoguePractice || undefined,
          dialogueFillGap: safeLesson.sections.dialogueFillGap || undefined,
          grammar: safeLesson.sections.grammar || {
            focus: "Grammar Focus",
            examples: [],
            exercise: []
          },
          pronunciation: safeLesson.sections.pronunciation || {
            word: "example",
            ipa: "/ɪɡˈzæmpəl/",
            practice: "This is an example sentence."
          },
          wrapup: safeLesson.sections.wrapup || []
        }
      }

      console.log('Exporting Word with lesson data:', exportLesson)
      await lessonExporter.exportToWord(exportLesson, sectionStates)
    } catch (error) {
      console.error("Word export error:", error)
      setExportError("Failed to export Word document. Please try again.")
    } finally {
      setIsExportingWord(false)
    }
  }

  const handleExportHTML = async () => {
    setIsExportingHTML(true)
    setExportError("")

    try {
      const exportLesson = {
        lessonTitle: safeLesson.lessonTitle,
        lessonType: safeLesson.lessonType || "discussion",
        studentLevel: safeLesson.studentLevel || "B1",
        targetLanguage: safeLesson.targetLanguage || "english",
        id: lessonId,
        sections: {
          warmup: safeLesson.sections.warmup || [],
          vocabulary: safeLesson.sections.vocabulary || [],
          reading: safeLesson.sections.reading || "",
          comprehension: safeLesson.sections.comprehension || [],
          discussion: safeLesson.sections.discussion || [],
          dialoguePractice: safeLesson.sections.dialoguePractice || undefined,
          dialogueFillGap: safeLesson.sections.dialogueFillGap || undefined,
          grammar: safeLesson.sections.grammar || {
            focus: "Grammar Focus",
            examples: [],
            exercise: []
          },
          pronunciation: safeLesson.sections.pronunciation || {
            word: "example",
            ipa: "/ɪɡˈzæmpəl/",
            practice: "This is an example sentence."
          },
          wrapup: safeLesson.sections.wrapup || []
        }
      }

      await exportToHTML(exportLesson, sectionStates)
    } catch (error) {
      console.error("HTML export error:", error)
      setExportError("Failed to export HTML. Please try again.")
    } finally {
      setIsExportingHTML(false)
    }
  }

  const handleSaveToLibrary = async () => {
    console.log('[LessonDisplay] 💾 handleSaveToLibrary called, isAdmin:', isAdmin)
    
    // If admin, show dialog to choose where to save
    if (isAdmin) {
      console.log('[LessonDisplay] ✅ User is admin, showing save location dialog')
      setShowSaveLocationDialog(true)
      return
    }
    
    console.log('[LessonDisplay] ℹ️ User is not admin, saving to personal library')
    // Non-admin: save to personal library directly
    await saveToPersonalLibrary()
  }
  
  const saveToPersonalLibrary = async () => {
    setIsSavingToLibrary(true)
    setExportError("")

    try {
      console.log('[LessonDisplay] 💾 Saving lesson to personal library...')

      // Get source URL from metadata or extraction source
      const sourceUrl = safeLesson.metadata?.sourceUrl ||
        safeLesson.extractionSource?.url ||
        undefined

      // Get auth token from localStorage
      const sessionData = localStorage.getItem('sb-jbkpnirowdvlwlgheqho-auth-token')
      if (!sessionData) {
        throw new Error('No authentication session found. Please sign in again.')
      }

      const session = JSON.parse(sessionData)
      const authToken = session.access_token

      console.log('[LessonDisplay] Calling save API...')

      // Call the save API route
      const response = await fetch('/api/save-lesson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: safeLesson.lessonTitle,
          lesson_type: safeLesson.lessonType || "discussion",
          student_level: safeLesson.studentLevel || "B1",
          target_language: safeLesson.targetLanguage || "english",
          source_url: sourceUrl,
          lesson_data: safeLesson,
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const { lesson } = await response.json()
      console.log('[LessonDisplay] ✅ Lesson saved to personal library with ID:', lesson.id)
      alert('Lesson saved to your personal library successfully!')
    } catch (error) {
      console.error('[LessonDisplay] ❌ Failed to save lesson:', error)
      if (error instanceof Error) {
        setExportError(`Failed to save lesson: ${error.message}`)
        alert(`Failed to save lesson: ${error.message}`)
      } else {
        setExportError("Failed to save lesson. Please try again.")
        alert("Failed to save lesson. Please try again.")
      }
    } finally {
      setIsSavingToLibrary(false)
    }
  }
  
  const saveToPublicLibrary = async (metadata: any) => {
    setIsSavingToLibrary(true)
    setExportError("")
    setShowAdminLessonDialog(false)

    try {
      console.log('[LessonDisplay] 💾 Saving lesson to public library...')

      // Get source URL from metadata or extraction source
      const sourceUrl = safeLesson.metadata?.sourceUrl ||
        safeLesson.extractionSource?.url ||
        undefined

      // Get auth token from localStorage
      const sessionData = localStorage.getItem('sb-jbkpnirowdvlwlgheqho-auth-token')
      if (!sessionData) {
        throw new Error('No authentication session found. Please sign in again.')
      }

      const session = JSON.parse(sessionData)
      const authToken = session.access_token

      console.log('[LessonDisplay] Calling public lessons create API...')

      // Transform sections array into expected flat structure
      const transformedLesson: any = {
        title: safeLesson.lessonTitle || safeLesson.title,
        metadata: {
          ...safeLesson.metadata,
          cefr_level: safeLesson.studentLevel || safeLesson.metadata?.cefr_level || "B1",
          lesson_type: safeLesson.lessonType || safeLesson.metadata?.lesson_type || "discussion",
          source_url: sourceUrl || safeLesson.metadata?.source_url,
        }
      };

      // Copy all sections from the lesson
      console.log('[LessonDisplay] 📋 Lesson structure:', {
        hasSections: !!safeLesson.sections,
        sectionsType: typeof safeLesson.sections,
        isArray: Array.isArray(safeLesson.sections),
        sectionKeys: safeLesson.sections && typeof safeLesson.sections === 'object' ? Object.keys(safeLesson.sections) : []
      });
      
      if (safeLesson.sections) {
        if (typeof safeLesson.sections === 'object' && !Array.isArray(safeLesson.sections)) {
          // Sections is an object - copy all properties
          const sectionKeys = Object.keys(safeLesson.sections);
          console.log('[LessonDisplay] 📝 Copying sections:', sectionKeys);
          
          sectionKeys.forEach((sectionKey) => {
            transformedLesson[sectionKey] = safeLesson.sections[sectionKey];
          });
          
          console.log('[LessonDisplay] ✅ Transformed lesson sections:', Object.keys(transformedLesson).filter(k => k !== 'title' && k !== 'metadata'));
        } else if (Array.isArray(safeLesson.sections)) {
          // Legacy: sections as array
          safeLesson.sections.forEach((section: any) => {
            if (section.type) {
              transformedLesson[section.type] = section;
            }
          });
        }
      } else {
        console.warn('[LessonDisplay] ⚠️ No sections found in lesson!');
      }

      // Transform warmup from array to object format if needed
      if (transformedLesson.warmup && Array.isArray(transformedLesson.warmup)) {
        transformedLesson.warmup = {
          questions: transformedLesson.warmup
        };
      } else if (!transformedLesson.warmup) {
        transformedLesson.warmup = {
          questions: ["What do you know about this topic?"]
        };
      }
      
      // Transform wrapup from array to object format if needed
      if (transformedLesson.wrapup && Array.isArray(transformedLesson.wrapup)) {
        transformedLesson.wrapup = {
          questions: transformedLesson.wrapup
        };
      } else if (!transformedLesson.wrapup) {
        transformedLesson.wrapup = {
          questions: ["Reflect on your learning by discussing these wrap-up questions:", "What did you learn today?", "How can you apply this knowledge?"]
        };
      }

      // Ensure at least one main content section exists
      const mainSections = ['vocabulary', 'grammar', 'reading', 'discussion', 'pronunciation'];
      const hasMainSection = mainSections.some(section => transformedLesson[section]);
      
      if (!hasMainSection) {
        // Create a discussion section as fallback
        transformedLesson.discussion = {
          questions: ["What are your thoughts on this topic?", "How does this relate to your experience?"]
        };
      }

      const lessonContent = transformedLesson;

      // Call the public lessons create API route
      const response = await fetch('/api/public-lessons/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          lesson: lessonContent,
          metadata: {
            category: metadata.category,
            tags: metadata.tags,
            estimated_duration_minutes: metadata.estimated_duration_minutes,
          }
          // No userId needed here - web app uses session-based auth
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}`
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('[LessonDisplay] ✅ Lesson saved to public library with ID:', result.lesson_id)
      alert('Lesson saved to public library successfully!')
    } catch (error) {
      console.error('[LessonDisplay] ❌ Failed to save lesson to public library:', error)
      if (error instanceof Error) {
        setExportError(`Failed to save lesson: ${error.message}`)
        alert(`Failed to save lesson: ${error.message}`)
      } else {
        setExportError("Failed to save lesson. Please try again.")
        alert("Failed to save lesson. Please try again.")
      }
    } finally {
      setIsSavingToLibrary(false)
    }
  }

  const sections: LessonSection[] = [
    {
      id: "warmup",
      title: "Warm-up Questions",
      icon: MessageCircle,
      enabled: sectionStates.warmup,
      content: (
        <div className="space-y-1.5 px-2">
          {safeLesson.sections.warmup.map((question, index) => {
            // First item is the instruction
            if (index === 0) {
              return (
                <div key={index} className="mb-1.5">
                  <p className="text-[15px] text-muted-foreground italic border-l-2 border-primary/20 pl-3 py-2 rounded-sm" style={{ backgroundColor: '#EEF7DC' }} style={{ backgroundColor: "#EEF7DC" }}>
                    {question}
                  </p>
                </div>
              )
            }
            // Rest are actual questions
            return (
              <div key={index} className="flex items-start gap-1.5">
                <span className="text-[15px] font-medium text-primary">{index}.</span>
                <p className="text-base text-foreground">{question}</p>
              </div>
            )
          })}
        </div>
      ),
    },
    {
      id: "vocabulary",
      title: "Key Vocabulary",
      icon: BookOpen,
      enabled: sectionStates.vocabulary,
      content: (
        <div className="space-y-1.5 px-2">
          {safeLesson.sections.vocabulary.map((item, index) => {
            // First item is the instruction
            if (index === 0 && item.word === "INSTRUCTION") {
              return (
                <div key={index} className="mb-1.5">
                  <p className="text-[15px] text-muted-foreground italic border-l-2 border-primary/20 pl-3 py-2 rounded-sm" style={{ backgroundColor: '#F1FAFF' }} style={{ backgroundColor: "#F1FAFF" }}>
                    {item.meaning}
                  </p>
                </div>
              )
            }

            // Handle both old format (example string) and new format (examples array)
            let examples: string[] = []
            if (item.examples && Array.isArray(item.examples)) {
              // New format: examples array
              examples = item.examples.filter(ex => ex.trim().length > 0)
            } else if (item.example) {
              // Old format: single example string, possibly with | separator
              examples = item.example.split(' | ').filter(ex => ex.trim().length > 0)
            }

            return (
              <div key={index} className="border rounded-sm p-3 bg-muted/30">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="font-semibold text-primary text-base">{item.word}</span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Volume2 className="h-3 w-3" />
                  </Button>
                </div>
                <p 
                  className="text-base text-muted-foreground mb-1.5 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: item.meaning.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  }}
                />
                {examples.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {examples.length === 1 ? 'Example:' : 'Examples:'}
                    </p>
                    <ul className="space-y-1">
                      {examples.map((example, exIndex) => (
                        <li key={exIndex} className="flex items-start gap-1.5">
                          <span className="text-primary mt-1">•</span>
                          <span
                            className="text-base text-slate-700"
                            dangerouslySetInnerHTML={{
                              __html: example.trim().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            }}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ),
    },
    {
      id: "grammar",
      title: "Grammar Focus",
      icon: BookOpen,
      enabled: sectionStates.grammar,
      content: (
        <div className="space-y-1.5 px-2">
          <div>
            <h4 className="font-semibold text-base mb-1.5">{safeLesson.sections.grammar.focus}</h4>

            {/* Grammar Explanation */}
            {safeLesson.sections.grammar.explanation && (
              <div className="space-y-1.5 mb-1.5 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-sm border border-blue-200 dark:border-blue-800">
                {safeLesson.sections.grammar.explanation.form && (
                  <div>
                    <h5 className="font-medium text-sm text-blue-900 dark:text-blue-100 mb-1">Form:</h5>
                    <p className="text-sm text-blue-800 dark:text-blue-200">{safeLesson.sections.grammar.explanation.form}</p>
                  </div>
                )}
                {safeLesson.sections.grammar.explanation.usage && (
                  <div>
                    <h5 className="font-medium text-sm text-blue-900 dark:text-blue-100 mb-1">Usage:</h5>
                    <p className="text-sm text-blue-800 dark:text-blue-200">{safeLesson.sections.grammar.explanation.usage}</p>
                  </div>
                )}
                {safeLesson.sections.grammar.explanation.levelNotes && (
                  <div>
                    <h5 className="font-medium text-sm text-blue-900 dark:text-blue-100 mb-1">Note:</h5>
                    <p className="text-sm text-blue-800 dark:text-blue-200 italic">{safeLesson.sections.grammar.explanation.levelNotes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Examples */}
            <div className="mb-1.5">
              <h5 className="font-medium text-sm mb-1.5">Examples:</h5>
              <div className="space-y-1">
                {safeLesson.sections.grammar.examples.map((example, index) => (
                  <p key={index} className="text-base bg-muted/30 rounded px-3 py-2 border-l-2 border-primary/50">
                    {example}
                  </p>
                ))}
              </div>
            </div>

            {/* Practice Exercises */}
            <div>
              <h5 className="font-medium text-sm mb-1.5">Practice Exercises:</h5>
              <div className="space-y-2">
                {safeLesson.sections.grammar.exercises ? (
                  // New format with structured exercises
                  safeLesson.sections.grammar.exercises.map((exercise: any, index: number) => (
                    <div key={index} className="bg-accent/30 rounded px-3 py-2 space-y-1">
                      <p className="text-base text-foreground font-medium">{index + 1}. {exercise.prompt}</p>
                      {exercise.answer && (
                        <p className="text-sm text-muted-foreground ml-4">
                          <span className="font-medium">Answer:</span> {exercise.answer}
                        </p>
                      )}
                      {exercise.explanation && (
                        <p className="text-sm ml-4 italic text-muted-foreground">
                          {exercise.explanation}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  // Fallback for old format
                  safeLesson.sections.grammar.exercise?.map((exercise, index) => (
                    <p key={index} className="text-base font-mono bg-accent/30 rounded px-3 py-2">
                      {exercise}
                    </p>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "reading",
      title: "Reading Passage",
      icon: FileText,
      enabled: sectionStates.reading,
      content: (
        <div className="prose prose-sm max-w-none px-2">
          {(() => {
            const readingContent = safeLesson.sections.reading
            const parts = readingContent.split('\n\n')

            // Check if first part is an instruction
            if (parts.length > 1 && parts[0].includes('Read the following text carefully')) {
              return (
                <div className="space-y-1.5">
                  <div className="mb-1.5">
                    <p className="text-[15px] text-muted-foreground italic border-l-2 border-primary/20 pl-3 py-2 rounded-sm" style={{ backgroundColor: '#EEF7DC' }} style={{ backgroundColor: "#EEF7DC" }}>
                      {parts[0]}
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-sm p-4 border">
                    <div
                      className="text-base leading-relaxed space-y-1.5"
                      dangerouslySetInnerHTML={{
                        __html: parts.slice(1).join('\n\n')
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\n\n/g, '</p><p class="mb-1.5">')
                          .replace(/^/, '<p class="mb-1.5">')
                          .replace(/$/, '</p>')
                      }}
                    />
                  </div>
                </div>
              )
            } else {
              // No instruction, display as before
              return (
                <div className="bg-muted/30 rounded-sm p-4 border">
                  <div
                    className="text-base leading-relaxed space-y-1.5"
                    dangerouslySetInnerHTML={{
                      __html: readingContent
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n\n/g, '</p><p class="mb-1.5">')
                        .replace(/^/, '<p class="mb-1.5">')
                        .replace(/$/, '</p>')
                    }}
                  />
                </div>
              )
            }
          })()}
        </div>
      ),
    },
    {
      id: "comprehension",
      title: "Reading Comprehension",
      icon: CheckCircle,
      enabled: sectionStates.comprehension,
      content: (
        <div className="space-y-1.5 px-2">
          {safeLesson.sections.comprehension.map((question, index) => {
            // First item is the instruction
            if (index === 0) {
              return (
                <div key={index} className="mb-1.5">
                  <p className="text-[15px] text-muted-foreground italic border-l-2 border-primary/20 pl-3 py-2 rounded-sm" style={{ backgroundColor: '#F1FAFF' }} style={{ backgroundColor: "#F1FAFF" }}>
                    {question}
                  </p>
                </div>
              )
            }
            // Rest are actual questions
            // Remove leading number if present (e.g., "1. " or "2. ")
            const cleanQuestion = question.replace(/^\d+\.\s*/, '')
            return (
              <div key={index} className="flex items-start gap-1.5">
                <span className="text-[15px] font-medium text-primary">{index}.</span>
                <p className="text-base text-foreground">{cleanQuestion}</p>
              </div>
            )
          })}
        </div>
      ),
    },
    {
      id: "dialoguePractice",
      title: "Dialogue Practice",
      icon: Users,
      enabled: sectionStates.dialoguePractice,
      content: (
        <div className="space-y-1.5 px-2">
          <div className="mb-1.5">
            <p className="text-[15px] text-muted-foreground italic border-l-2 border-primary/20 pl-3 py-2 rounded-sm" style={{ backgroundColor: '#EEF7DC' }} style={{ backgroundColor: "#EEF7DC" }}>
              {safeLesson.sections.dialoguePractice.instruction}
            </p>
          </div>
          <div className="bg-muted/30 rounded-sm p-4 border">
            <div className="space-y-1.5">
              {(() => {
                const enhancedDialogue = enhanceDialogueWithAvatars(safeLesson.sections.dialoguePractice.dialogue, lessonId, 'dialoguePractice')
                return enhancedDialogue.map((line, index) => (
                  <div key={index} className="flex items-start gap-1.5">
                    {line.avatar && <AvatarImage avatar={line.avatar} size="md" />}
                    <div className="flex-1">
                      <p className="text-base text-foreground leading-relaxed">{line.line}</p>
                    </div>
                  </div>
                ))
              })()}
            </div>
          </div>
          {safeLesson.sections.dialoguePractice.followUpQuestions.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-sm mb-1.5">Follow-up Questions:</h4>
              <div className="space-y-2">
                {safeLesson.sections.dialoguePractice.followUpQuestions.map((question, index) => (
                  <div key={index} className="flex items-start gap-1.5">
                    <span className="text-[15px] font-medium text-primary">{index + 1}.</span>
                    <p className="text-base text-foreground">{question}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "dialogueFillGap",
      title: "Dialogue Fill-in-the-Gap",
      icon: MessageCircle,
      enabled: sectionStates.dialogueFillGap,
      content: (
        <div className="space-y-1.5 px-2">
          <div className="mb-1.5">
            <p className="text-[15px] text-muted-foreground italic border-l-2 border-primary/20 pl-3 py-2 rounded-sm" style={{ backgroundColor: '#F1FAFF' }} style={{ backgroundColor: "#F1FAFF" }}>
              {safeLesson.sections.dialogueFillGap.instruction}
            </p>
          </div>
          <div className="bg-muted/30 rounded-sm p-4 border">
            <div className="space-y-1.5">
              {(() => {
                const enhancedDialogue = enhanceDialogueWithAvatars(safeLesson.sections.dialogueFillGap.dialogue, lessonId, 'dialogueFillGap')
                return enhancedDialogue.map((line, index) => (
                  <div key={index} className="flex items-start gap-1.5">
                    {line.avatar && <AvatarImage avatar={line.avatar} size="md" />}
                    <div className="flex-1">
                      <div className="text-base text-foreground leading-relaxed">
                        {line.isGap ? (
                          <span
                            dangerouslySetInnerHTML={{
                              __html: line.line.replace(/_____/g, '<span class="inline-block w-20 h-6 border-b-2 border-primary/50 mx-1"></span>')
                            }}
                          />
                        ) : (
                          line.line
                        )}
                      </div>
                    </div>
                  </div>
                ))
              })()}
            </div>
          </div>
          {safeLesson.sections.dialogueFillGap.answers.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-sm mb-1.5">Answer Key:</h4>
              <div className="text-sm text-muted-foreground">
                {safeLesson.sections.dialogueFillGap.answers.join(', ')}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "discussion",
      title: "Discussion Questions",
      icon: Users,
      enabled: sectionStates.discussion,
      content: (
        <div className="space-y-1.5 px-2">
          {safeLesson.sections.discussion.map((question, index) => {
            // First item is the instruction
            if (index === 0) {
              return (
                <div key={index} className="mb-1.5">
                  <p className="text-[15px] text-muted-foreground italic border-l-2 border-primary/20 pl-3 py-2 rounded-sm" style={{ backgroundColor: '#EEF7DC' }} style={{ backgroundColor: "#EEF7DC" }}>
                    {question}
                  </p>
                </div>
              )
            }
            // Rest are actual questions
            return (
              <div key={index} className="flex items-start gap-1.5">
                <span className="text-[15px] font-medium text-primary">{index}.</span>
                <p className="text-base text-foreground">{question}</p>
              </div>
            )
          })}
        </div>
      ),
    },
    {
      id: "pronunciation",
      title: "Pronunciation Practice",
      icon: Volume2,
      enabled: sectionStates.pronunciation,
      title: "Pronunciation Practice",
      icon: Volume2,
      enabled: sectionStates.pronunciation,
      content: (
        <div className="space-y-1.5 px-2">
          {/* Instruction */}
          {safeLesson.sections.pronunciation?.instruction && (
            <p className="text-[15px] text-muted-foreground italic border-l-2 border-primary/20 pl-3 py-2 rounded-sm" style={{ backgroundColor: '#F1FAFF' }} style={{ backgroundColor: "#F1FAFF" }}>
              {safeLesson.sections.pronunciation.instruction}
            </p>
          )}

          {/* New format: Multiple words with detailed practice */}
          {safeLesson.sections.pronunciation?.words && safeLesson.sections.pronunciation.words.length > 0 ? (
            <div className="space-y-6">
              {safeLesson.sections.pronunciation.words.map((wordItem, index) => (
                <div key={index} className="border rounded-sm p-4 space-y-1.5">
                  {/* Word and IPA */}
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-lg">{wordItem.word}</span>
                    <span className="text-muted-foreground font-mono text-sm">{wordItem.ipa}</span>
                    <Button variant="outline" size="sm">
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Difficult Sounds */}
                  {wordItem.difficultSounds && wordItem.difficultSounds.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Difficult Sounds:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {wordItem.difficultSounds.map((sound, i) => (
                          <Badge key={i} variant="secondary" className="font-mono text-xs">
                            {sound}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tips */}
                  {wordItem.tips && wordItem.tips.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">Pronunciation Tips:</p>
                      <ul className="space-y-1.5 text-sm">
                        {wordItem.tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Practice Sentence */}
                  {wordItem.practiceSentence && (
                    <div className="bg-muted/30 rounded-sm p-3 mt-2">
                      <p className="text-sm text-muted-foreground mb-1">Practice Sentence:</p>
                      <p className="text-base text-foreground font-medium">{wordItem.practiceSentence}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Old format: Single word */
            safeLesson.sections.pronunciation?.word && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-lg">{safeLesson.sections.pronunciation.word}</span>
                  <span className="text-muted-foreground font-mono">{safeLesson.sections.pronunciation.ipa}</span>
                  <Button variant="outline" size="sm">
                    <Volume2 className="h-4 w-4" />
                  </Button>
                </div>
                {safeLesson.sections.pronunciation.practice && (
                  <div className="bg-muted/30 rounded-sm p-3">
                    <p className="text-sm text-muted-foreground">Practice sentence:</p>
                    <p className="text-base text-foreground font-medium mt-1">"{safeLesson.sections.pronunciation.practice}"</p>
                  </div>
                )}
              </div>
            )
          )}

          {/* Tongue Twisters */}
          {safeLesson.sections.pronunciation?.tongueTwisters && safeLesson.sections.pronunciation.tongueTwisters.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <p className="text-base font-medium mb-1.5">Tongue Twisters:</p>
              <div className="space-y-1.5">
                {safeLesson.sections.pronunciation.tongueTwisters.map((twister, index) => (
                  <div key={index} className="bg-primary/5 rounded-sm p-3">
                    <p className="text-base font-medium mb-1">{twister.text}</p>
                    {twister.targetSounds && twister.targetSounds.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-sm text-muted-foreground">Target sounds:</span>
                        {twister.targetSounds.map((sound, i) => (
                          <Badge key={i} variant="outline" className="font-mono text-xs">
                            {sound}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {twister.difficulty && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {twister.difficulty}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "wrapup",
      title: "Lesson Wrap-up",
      icon: CheckCircle,
      enabled: sectionStates.wrapup,
      content: (
        <div className="space-y-1.5 px-2">
          {safeLesson.sections.wrapup.map((question, index) => {
            // First item is the instruction
            if (index === 0) {
              return (
                <div key={index} className="mb-1.5">
                  <p className="text-[15px] text-muted-foreground italic border-l-2 border-primary/20 pl-3 py-2 rounded-sm" style={{ backgroundColor: '#EEF7DC' }} style={{ backgroundColor: "#EEF7DC" }}>
                    {question}
                  </p>
                </div>
              )
            }
            // Rest are actual questions
            // Remove leading number if present (e.g., "1. " or "2. ")
            const cleanQuestion = question.replace(/^\d+\.\s*/, '')
            return (
              <div key={index} className="flex items-start gap-1.5">
                <span className="text-[15px] font-medium text-primary">{index}.</span>
                <p className="text-base text-foreground">{cleanQuestion}</p>
              </div>
            )
          })}
        </div>
      ),
    },
  ]

  return (
    <div className="w-full space-y-1.5">
      {/* Admin Status Debug - Remove after testing */}
      {isAdmin && (
        <Alert className="bg-green-50 border-green-200">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-xs text-green-800">
            ✅ Admin Mode Active - You can save to public library
          </AlertDescription>
        </Alert>
      )}
      
      {/* Export Error Alert - Full Width */}
      {exportError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{exportError}</AlertDescription>
        </Alert>
      )}

      {/* Mobile Menu Toggle - Follows sidebar at top left */}
      <Button
        className={`
          lg:hidden fixed top-20 z-50 h-10 w-10 rounded-md shadow-lg
          transition-all duration-300
          ${isSidebarCollapsed ? 'left-4' : 'left-[18rem]'}
        `}
        size="icon"
        variant="default"
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      >
        {isSidebarCollapsed ? (
          <ChevronRight className="h-5 w-5" />
        ) : (
          <ChevronLeft className="h-5 w-5" />
        )}
      </Button>

      {/* Mobile Sidebar Overlay */}
      {!isSidebarCollapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-black/80 z-40"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}

      {/* Two Column Layout: Workspace Sidebar Left, Content Right */}
      <div className="flex gap-0 h-screen lg:h-auto ml-0">

        {/* LEFT COLUMN - Workspace Sidebar */}
        <div
          className={`
            ${isSidebarCollapsed ? 'lg:w-16 -translate-x-full lg:translate-x-0' : 'lg:w-72 translate-x-0'} 
            fixed lg:relative inset-y-0 left-0 z-40 w-72
            transition-all duration-300 flex-shrink-0
          `}
          onMouseEnter={() => setIsSidebarCollapsed(false)}
        >
          <div className="lg:sticky lg:top-20 h-screen lg:h-[calc(100vh-5rem)] overflow-y-auto">
            <WorkspaceSidebar
              sections={sections}
              onToggleSection={toggleSection}
              onExportPDF={handleExportPDF}
              onExportWord={handleExportWord}
              onExportHTML={handleExportHTML}
              onSaveToLibrary={handleSaveToLibrary}
              onNewLesson={onNewLesson}
              onLoadLesson={onLoadLesson}
              isExportingPDF={isExportingPDF}
              isExportingWord={isExportingWord}
              isExportingHTML={isExportingHTML}
              isSavingToLibrary={isSavingToLibrary}
              isCollapsed={isSidebarCollapsed}
            />
          </div>
        </div>

        {/* RIGHT COLUMN - Lesson Content (Scrollable, Expands when sidebar collapsed) */}
        <div
          className="flex-1 transition-all duration-300 relative overflow-y-auto"
          onMouseEnter={() => setIsSidebarCollapsed(true)}
        >
          <div className="space-y-1.5 px-2 ">
            {/* Header Card - Title and Banner Image */}
            <Card className="scroll-mt-4 rounded-none mx-4 sm:mx-8 md:mx-16 lg:mx-28">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                  {/* Left Side: Title and Metadata */}
                  <div className="flex-1 min-w-0">
                    {/* Lesson Title - Responsive font sizes that adapt to container width, with word wrapping */}
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl xl:text-4xl font-medium text-foreground leading-tight mb-4 break-words whitespace-normal overflow-visible">
                      {safeLesson.lessonTitle}
                    </h1>

                    {/* Date and Level Badges */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                      <Badge variant="default" className="text-xs sm:text-sm px-2 sm:px-3 py-1">
                        {safeLesson.studentLevel}
                      </Badge>
                      <Badge variant="outline" className="text-xs sm:text-sm px-2 sm:px-3 py-1 capitalize">
                        {safeLesson.lessonType}
                      </Badge>
                    </div>
                  </div>

                  {/* Right Side: Banner Image - Flexible sizing that responds to available space */}
                  {((safeLesson as any).bannerImage || (safeLesson.metadata?.bannerImages && safeLesson.metadata.bannerImages.length > 0)) && (
                    <div className="w-full lg:w-[40%] lg:max-w-md flex-shrink-0">
                      <div className="rounded-lg overflow-hidden shadow-lg">
                        <img
                          src={(safeLesson as any).bannerImage || safeLesson.metadata.bannerImages[0].src}
                          alt={safeLesson.lessonTitle}
                          className="w-full h-40 sm:h-48 lg:h-56 object-cover"
                          onError={(e) => {
                            console.log('❌ Banner image failed to load');
                            e.currentTarget.style.display = 'none';
                          }}
                          onLoad={() => console.log('✅ Banner image loaded successfully')}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lesson Sections */}
            {sections
              .filter((section) => section.enabled)
              .map((section, index) => (
                <Card key={section.id} className="scroll-mt-4 mx-28 rounded-none">
                  <CardHeader className="pb-4">
                    <CardTitle asChild>
                      <h2 className="text-[28px] font-semibold text-foreground flex items-center gap-1.5">
                        <section.icon className="h-6 w-6 lg:h-7 lg:w-7" />
                        {section.title}
                      </h2>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {section.content}
                  </CardContent>
                </Card>
              ))}

            {/* Empty State */}
            {sections.filter((s) => s.enabled).length === 0 && (
              <Card className="border-dashed">
                <CardContent className="pt-6 pb-6 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-1.5" />
                  <p className="text-sm text-muted-foreground">
                    No sections selected. Enable sections from the left panel to view lesson content.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Source Attribution */}
            {lesson.extractionSource && (
              <div className="mt-8 pt-6 border-t border-border text-center">
                <a
                  href={lesson.extractionSource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 hover:underline"
                >
                  <span>Article from</span>
                  <span className="font-medium capitalize">
                    {lesson.extractionSource.domain?.replace('www.', '').split('.')[0] || 'Unknown Source'}
                  </span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Admin Save Location Dialog */}
      <Dialog open={showSaveLocationDialog} onOpenChange={setShowSaveLocationDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>Save Lesson</span>
              <Badge variant="outline" className="bg-vintage-gold text-vintage-brown">Admin</Badge>
            </DialogTitle>
            <DialogDescription>
              Choose where to save this lesson. You can save to your personal library or share it publicly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {/* Personal Library Option */}
            <Card 
              className="cursor-pointer hover:border-vintage-brown transition-colors"
              onClick={() => {
                setShowSaveLocationDialog(false)
                saveToPersonalLibrary()
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-vintage-brown/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-vintage-brown" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-vintage-brown mb-1">My Personal Library</h3>
                    <p className="text-sm text-vintage-brown/70">
                      Private workspace for drafts and personal use. Only visible to you.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-vintage-brown/40" />
                </div>
              </CardContent>
            </Card>
            
            {/* Public Library Option */}
            <Card 
              className="cursor-pointer hover:border-vintage-brown transition-colors"
              onClick={() => {
                setShowSaveLocationDialog(false)
                setShowAdminLessonDialog(true)
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-vintage-gold/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-vintage-brown" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-vintage-brown mb-1">Public Library</h3>
                    <p className="text-sm text-vintage-brown/70">
                      Share with everyone. Lesson will be visible on the public website.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-vintage-brown/40" />
                </div>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowSaveLocationDialog(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Admin Lesson Creation Dialog */}
      <AdminLessonCreationDialog
        open={showAdminLessonDialog}
        onOpenChange={setShowAdminLessonDialog}
        onConfirm={saveToPublicLibrary}
        onCancel={() => setShowAdminLessonDialog(false)}
      />
    </div>
  )
}


