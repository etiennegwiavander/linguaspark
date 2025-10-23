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
} from "lucide-react"
import { lessonExporter } from "@/lib/export-utils"
import { enhanceDialogueWithAvatars, type Avatar } from "@/lib/avatar-utils"

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

export default function LessonDisplay({ lesson, onExportPDF, onExportWord, onNewLesson }: LessonDisplayProps) {
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

  const sections: LessonSection[] = [
    {
      id: "warmup",
      title: "Warm-up Questions",
      icon: MessageCircle,
      enabled: sectionStates.warmup,
      content: (
        <div className="space-y-1.5">
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
        <div className="space-y-1.5">
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
                <p className="text-base text-muted-foreground mb-1.5 leading-relaxed">{item.meaning}</p>
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
      id: "reading",
      title: "Reading Passage",
      icon: FileText,
      enabled: sectionStates.reading,
      content: (
        <div className="prose prose-sm max-w-none">
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
        <div className="space-y-1.5">
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
      id: "dialoguePractice",
      title: "Dialogue Practice",
      icon: Users,
      enabled: sectionStates.dialoguePractice,
      content: (
        <div className="space-y-1.5">
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
        <div className="space-y-1.5">
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
        <div className="space-y-1.5">
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
      id: "grammar",
      title: "Grammar Focus",
      icon: BookOpen,
      enabled: sectionStates.grammar,
      content: (
        <div className="space-y-1.5">
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
      id: "pronunciation",
      title: "Pronunciation Practice",
      icon: Volume2,
      enabled: sectionStates.pronunciation,
      content: (
        <div className="space-y-1.5">
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
        <div className="space-y-1.5">
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
    <div className="w-full space-y-1.5">
      {/* Export Error Alert - Full Width */}
      {exportError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{exportError}</AlertDescription>
        </Alert>
      )}

      {/* Two Column Layout: Controls Left, Content Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-1.5">

        {/* LEFT COLUMN - Controls & Debug (Sticky on large screens) */}
        <div className="lg:col-span-4 space-y-1.5">
          <div className="lg:sticky lg:top-4 space-y-1.5">


            {/* Section Controls */}
            <Card className="rounded-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-[28px] font-semibold">Lesson Sections</CardTitle>
                <CardDescription className="text-xs">Toggle sections to customize your lesson</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sections.map((section) => (
                    <div key={section.id} className="flex items-center justify-between p-2 rounded-sm hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-1.5">
                        <section.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-base text-foreground">{section.title}</span>
                      </div>
                      <Switch checked={section.enabled} onCheckedChange={() => toggleSection(section.id)} />
                    </div>
                  ))}
                </div>
                {/* New Lesson Button - Top Right */}
                <div className="mt-2 ">
                  <Button variant="outline" size="lg" className="w-full" onClick={onNewLesson} >
                    New Lesson
                  </Button>
                </div>

              </CardContent>
            </Card>

            {/* Export Actions */}
            <Card className="rounded-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-[28px] font-semibold">Export Lesson</CardTitle>
                <CardDescription className="text-xs">
                  Export with selected sections only
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
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
                    className="w-full"
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
              </CardContent>
            </Card>
          </div>
        </div>

        {/* RIGHT COLUMN - Lesson Content (Scrollable) */}
        <div className="lg:col-span-8">
          <div className="space-y-1.5">
            {/* Header Card - Title and Banner Image */}
            <Card className="scroll-mt-4 rounded-none">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                  {/* Left Side: Title and Metadata */}
                  <div className="flex-1 min-w-0">
                    {/* Lesson Title */}
                    <h1 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight mb-4">
                      {safeLesson.lessonTitle}
                    </h1>

                    {/* Date and Level Badges */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm text-muted-foreground">
                        {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                      <Badge variant="default" className="text-sm px-3 py-1">
                        {safeLesson.studentLevel}
                      </Badge>
                      <Badge variant="outline" className="text-sm px-3 py-1 capitalize">
                        {safeLesson.lessonType}
                      </Badge>
                    </div>
                  </div>

                  {/* Right Side: Banner Image */}
                  {((safeLesson as any).bannerImage || (safeLesson.metadata?.bannerImages && safeLesson.metadata.bannerImages.length > 0)) && (
                    <div className="w-full lg:w-96 flex-shrink-0">
                      <div className="rounded-lg overflow-hidden shadow-lg">
                        <img
                          src={(safeLesson as any).bannerImage || safeLesson.metadata.bannerImages[0].src}
                          alt={safeLesson.lessonTitle}
                          className="w-full h-48 object-cover"
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
                <Card key={section.id} className="scroll-mt-4 rounded-none">
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
    </div>
  )
}


