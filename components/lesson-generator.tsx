"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, BookOpen, Globe, Users, FileText, Mic, AlertCircle, Sparkles, ExternalLink, Info } from "lucide-react"
import { useAuth } from "./auth-wrapper"
import { LessonInterfaceBridge, LessonInterfaceUtils } from "@/lib/lesson-interface-bridge"
import type { LessonPreConfiguration } from "@/lib/lesson-interface-bridge"
import result from "postcss/lib/result"

const LESSON_TYPES = [
  { value: "discussion", label: "Discussion", icon: Users, description: "Conversation-focused lessons" },
  { value: "grammar", label: "Grammar", icon: BookOpen, description: "Grammar rules and exercises" },
  { value: "travel", label: "Travel & Tourism", icon: Globe, description: "Travel-related vocabulary and scenarios" },
  { value: "business", label: "Business", icon: FileText, description: "Professional communication skills" },
  { value: "pronunciation", label: "Pronunciation", icon: Mic, description: "Sound practice and phonetics" },
]

const STUDENT_LEVELS = [
  { value: "A1", label: "A1 - Beginner", description: "Basic words and phrases" },
  { value: "A2", label: "A2 - Elementary", description: "Simple conversations" },
  { value: "B1", label: "B1 - Intermediate", description: "Familiar topics" },
  { value: "B2", label: "B2 - Upper Intermediate", description: "Complex topics" },
  { value: "C1", label: "C1 - Advanced", description: "Fluent expression" },
]

const TARGET_LANGUAGES = [
  { value: "english", label: "English", flag: "🇺🇸" },
  { value: "spanish", label: "Spanish", flag: "🇪🇸" },
  { value: "french", label: "French", flag: "🇫🇷" },
  { value: "german", label: "German", flag: "🇩🇪" },
  { value: "italian", label: "Italian", flag: "🇮🇹" },
  { value: "portuguese", label: "Portuguese", flag: "🇵🇹" },
  { value: "japanese", label: "Japanese", flag: "🇯🇵" },
  { value: "korean", label: "Korean", flag: "🇰🇷" },
  { value: "chinese", label: "Chinese", flag: "🇨🇳" },
]

interface ErrorState {
  type?: string
  message?: string
  actionableSteps?: string[]
  errorId?: string
  supportContact?: string
}

interface LessonGeneratorProps {
  initialText?: string
  sourceUrl?: string
  extractedMetadata?: any
  onLessonGenerated: (lesson: any) => void
  onExtractFromPage: () => void
}

interface ExtractionMetadata {
  title: string
  author?: string
  sourceUrl: string
  domain: string
  extractedAt: Date
  wordCount: number
  readingTime: number
  complexity: 'beginner' | 'intermediate' | 'advanced'
  suitabilityScore: number
}

export default function LessonGenerator({
  initialText = "",
  sourceUrl = "",
  extractedMetadata,
  onLessonGenerated,
  onExtractFromPage,
}: LessonGeneratorProps) {
  const [selectedText, setSelectedText] = useState(initialText)
  const [lessonType, setLessonType] = useState("")
  const [studentLevel, setStudentLevel] = useState("")
  const [targetLanguage, setTargetLanguage] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStep, setGenerationStep] = useState("")
  const [generationPhase, setGenerationPhase] = useState("")
  const [generationSection, setGenerationSection] = useState("")
  const [error, setError] = useState<ErrorState | null>(null)
  const { user } = useAuth()

  // Extraction-related state
  const [isExtractionSource, setIsExtractionSource] = useState(false)
  const [extractionConfig, setExtractionConfig] = useState<LessonPreConfiguration | null>(null)
  const [showExtractionInfo, setShowExtractionInfo] = useState(false)
  const [hasAppliedInitialValues, setHasAppliedInitialValues] = useState(false)

  // Update selectedText when initialText prop changes
  useEffect(() => {
    console.log('[LessonGenerator] Props received - initialText length:', initialText.length, 'sourceUrl:', sourceUrl)
    if (initialText && initialText !== selectedText) {
      console.log('[LessonGenerator] Updating selectedText from initialText:', initialText.substring(0, 100) + '...')
      setSelectedText(initialText)

      // CRITICAL FIX: Also set lesson type and level from URL parameters
      const urlParams = new URLSearchParams(window.location.search)
      const urlType = urlParams.get('type')
      const urlLevel = urlParams.get('level')

      if (urlType && !lessonType) {
        console.log('[LessonGenerator] Setting lesson type from URL:', urlType)
        setLessonType(urlType)
      }

      if (urlLevel && !studentLevel) {
        console.log('[LessonGenerator] Setting student level from URL:', urlLevel)
        setStudentLevel(urlLevel)
      }

      if (!targetLanguage) {
        console.log('[LessonGenerator] Setting default target language: english')
        setTargetLanguage("english")
      }
    }
  }, [initialText, sourceUrl, lessonType, studentLevel, targetLanguage])

  // Clear error when user makes changes
  const clearError = () => {
    if (error) {
      setError(null)
    }
  }

  // Check for extraction source and load configuration
  useEffect(() => {
    const checkExtractionSource = async () => {
      try {
        // Check if this is from extraction
        const isExtraction = await LessonInterfaceBridge.isExtractionSource()

        if (isExtraction) {
          setIsExtractionSource(true)

          // Load extraction configuration
          const config = await LessonInterfaceBridge.loadExtractionConfiguration()

          if (config) {
            setExtractionConfig(config)
            setShowExtractionInfo(true)

            // Auto-populate fields if not already done (Requirement 4.2, 4.3)
            if (!hasAppliedInitialValues) {
              setSelectedText(config.sourceContent)
              setLessonType(config.suggestedType)
              setStudentLevel(config.suggestedLevel)
              setTargetLanguage("english") // Default to English for now
              setHasAppliedInitialValues(true)
            }
          }
        }
      } catch (error) {
        console.error('Failed to check extraction source:', error)
      }
    }

    checkExtractionSource()
  }, [hasAppliedInitialValues])

  // Handle clearing extraction data
  const handleClearExtraction = async () => {
    try {
      await LessonInterfaceBridge.clearExtractionConfiguration()
      setIsExtractionSource(false)
      setExtractionConfig(null)
      setShowExtractionInfo(false)
      setSelectedText("")
      setLessonType("")
      setStudentLevel("")
      setHasAppliedInitialValues(false)
    } catch (error) {
      console.error('Failed to clear extraction data:', error)
    }
  }

  const handleGenerateLesson = async () => {
    console.log('[LessonGenerator] Generate lesson clicked:', {
      selectedTextLength: selectedText.length,
      lessonType,
      studentLevel,
      targetLanguage,
      isExtractionSource,
      hasExtractionConfig: !!extractionConfig
    })

    if (!lessonType || !studentLevel || !targetLanguage || !selectedText.trim()) {
      console.error('[LessonGenerator] Validation failed:', {
        hasLessonType: !!lessonType,
        hasStudentLevel: !!studentLevel,
        hasTargetLanguage: !!targetLanguage,
        hasSelectedText: !!selectedText.trim()
      })
      setError({
        type: "Validation Error",
        message: "Please fill in all fields and provide source content.",
        actionableSteps: [
          "Select a lesson type from the dropdown",
          "Choose a student level (A1-C1)",
          "Select a target language",
          "Provide source content by extracting from page or pasting text"
        ]
      })
      return
    }

    if (selectedText.length < 50) {
      setError({
        type: "Content Too Short",
        message: "Please provide more content (at least 50 characters) for better lesson generation.",
        actionableSteps: [
          "Select more text from the webpage",
          "Paste additional content into the text area",
          "Ensure the content has meaningful information for lesson creation"
        ]
      })
      return
    }

    setError(null)
    setIsGenerating(true)
    setGenerationProgress(0)
    setGenerationStep("Initializing...")
    setGenerationPhase("")
    setGenerationSection("")

    try {
      // Get enhanced content data if available
      let enhancedContent = null
      try {
        if (typeof window !== "undefined" && window.chrome?.storage) {
          const result = await new Promise((resolve, reject) => {
            window.chrome.storage.local.get(["lessonConfiguration", "extractedContent"], (result) => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError)
              } else {
                resolve(result)
              }
            })
          })

          // Map lessonConfiguration to enhancedContent format (Phase 1 storage structure)
          if (result.lessonConfiguration) {
            console.log('[LessonGenerator] Found lessonConfiguration in storage')
            enhancedContent = {
              metadata: result.lessonConfiguration.metadata,
              structuredContent: {}, // Not stored in lessonConfiguration
              wordCount: result.lessonConfiguration.metadata?.wordCount,
              readingTime: result.lessonConfiguration.metadata?.readingTime
            }
          } else if (result.extractedContent) {
            // Fallback to extractedContent if available
            console.log('[LessonGenerator] Found extractedContent in storage')
            enhancedContent = result.extractedContent
          }
        }
      } catch (error) {
        console.warn('[LessonGenerator] Failed to load enhanced content from storage:', error)
        // Continue without enhanced content - it's optional
      }

      // Prepare request body with enhanced content data
      const requestBody = {
        sourceText: selectedText,
        lessonType,
        studentLevel,
        targetLanguage,
        sourceUrl,
      }

      // Add enhanced content data if available
      if (enhancedContent) {
        console.log('[LessonGenerator] Adding enhanced content to request:', {
          hasMetadata: !!enhancedContent.metadata,
          hasStructuredContent: !!enhancedContent.structuredContent,
          wordCount: enhancedContent.wordCount,
          readingTime: enhancedContent.readingTime
        })
        requestBody.contentMetadata = enhancedContent.metadata
        requestBody.structuredContent = enhancedContent.structuredContent
        requestBody.wordCount = enhancedContent.wordCount
        requestBody.readingTime = enhancedContent.readingTime
      } else if (extractedMetadata) {
        // Use extracted metadata from page.tsx if no enhanced content
        console.log('[LessonGenerator] Using extracted metadata from props:', {
          hasTitle: !!extractedMetadata.title,
          hasBannerImages: !!extractedMetadata.bannerImages,
          bannerImagesCount: extractedMetadata.bannerImages?.length || 0,
          hasImages: !!extractedMetadata.images,
          imagesCount: extractedMetadata.images?.length || 0
        })
        requestBody.contentMetadata = extractedMetadata
      } else {
        console.log('[LessonGenerator] No enhanced content or extracted metadata available, sending basic request')
      }

      console.log('[LessonGenerator] Sending request to streaming API:', {
        sourceTextLength: requestBody.sourceText.length,
        lessonType: requestBody.lessonType,
        studentLevel: requestBody.studentLevel,
        targetLanguage: requestBody.targetLanguage,
        hasMetadata: !!requestBody.contentMetadata
      })

      // Get auth token from localStorage
      const sessionData = localStorage.getItem('sb-jbkpnirowdvlwlgheqho-auth-token')
      let authToken = ''
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData)
          authToken = session.access_token
        } catch (e) {
          console.error('[LessonGenerator] Failed to parse session data:', e)
        }
      }

      // Call the streaming AI generation API
      const response = await fetch("/api/generate-lesson-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Read the stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let finalLesson = null

      if (!reader) {
        throw new Error('No response body reader available')
      }

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'progress') {
                // Update progress state from actual SSE events (Requirement 1.1, 1.2, 1.3)
                setGenerationStep(data.data.step)
                setGenerationProgress(data.data.progress)
                setGenerationPhase(data.data.phase || "")
                setGenerationSection(data.data.section || "")
              } else if (data.type === 'complete') {
                setGenerationStep(data.step)
                setGenerationProgress(data.progress)
                finalLesson = data.lesson
              } else if (data.type === 'error') {
                // Include progress state in error reporting (Requirement 1.6)
                setError({
                  type: data.error.type,
                  message: data.error.message,
                  actionableSteps: data.error.actionableSteps || [],
                  errorId: data.error.errorId,
                  supportContact: data.error.supportContact
                })
                setIsGenerating(false)
                return
              }
            } catch (parseError) {
              console.error('Error parsing SSE message:', parseError)
            }
          }
        }
      }

      if (!finalLesson) {
        throw new Error('No lesson data received from stream')
      }

      // Add extraction metadata to lesson if from extraction (Requirement 6.6)
      let enhancedLesson = finalLesson

      // Use extractedMetadata (from props) or extractionConfig (from bridge)
      const metadataSource = extractedMetadata || extractionConfig?.metadata
      const hasExtractionData = isExtractionSource && (extractionConfig || extractedMetadata)

      if (hasExtractionData && metadataSource) {
        console.log('[LessonGenerator] Enhancing lesson with extraction data:', {
          hasExtractionConfig: !!extractionConfig,
          hasExtractedMetadata: !!extractedMetadata,
          hasBannerImages: !!(metadataSource.bannerImages || metadataSource.images),
          bannerImagesCount: (metadataSource.bannerImages?.length || metadataSource.images?.length || 0)
        })

        enhancedLesson = {
          ...finalLesson,
          extractionSource: {
            url: metadataSource.sourceUrl || sourceUrl,
            domain: metadataSource.domain || '',
            title: metadataSource.title || '',
            author: metadataSource.author || '',
            extractedAt: metadataSource.extractedAt || new Date(),
            attribution: extractionConfig?.attribution || `Article from ${metadataSource.domain}`
          },
          metadata: {
            ...metadataSource,
            bannerImages: metadataSource.bannerImages || metadataSource.images || []
          },
          bannerImage: metadataSource.bannerImage || metadataSource.bannerImages?.[0]?.src || metadataSource.images?.[0]?.src || null,
          images: metadataSource.images || metadataSource.bannerImages || []
        }

        console.log('[LessonGenerator] Enhanced lesson with banner:', {
          hasBannerImage: !!enhancedLesson.bannerImage,
          bannerImageUrl: enhancedLesson.bannerImage,
          hasExtractionSource: !!enhancedLesson.extractionSource,
          extractionSourceUrl: enhancedLesson.extractionSource?.url
        })
      }

      onLessonGenerated(enhancedLesson)
      setIsGenerating(false)
    } catch (error) {
      console.error("Error generating lesson:", error)
      setError({
        type: "Network Error",
        message: "Connection error occurred while generating lesson.",
        actionableSteps: [
          "Check your internet connection",
          "Refresh the page and try again",
          "Contact support if the problem continues"
        ],
        errorId: `ERR_${Date.now()}`
      })
      setIsGenerating(false)
    }
  }

  const selectedLessonType = LESSON_TYPES.find((t) => t.value === lessonType)
  const selectedLevel = STUDENT_LEVELS.find((l) => l.value === studentLevel)
  const selectedLanguage = TARGET_LANGUAGES.find((l) => l.value === targetLanguage)

  return (
    <div className="space-y-4">
      {/* Extraction Information Card (Requirement 4.4, 6.6) */}
      {showExtractionInfo && extractionConfig && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-600" />
              Content Extracted from Web
              <Badge variant="secondary" className="text-xs">
                Auto-populated
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              This lesson is being generated from content extracted from a webpage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Source Information */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Source</span>
                <a
                  href={extractionConfig.metadata.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  {extractionConfig.metadata.domain}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="text-xs text-gray-600">
                {LessonInterfaceUtils.createMetadataDisplay(extractionConfig.metadata)}
              </div>

              {extractionConfig.metadata.title && (
                <div className="text-sm font-medium text-gray-900">
                  "{extractionConfig.metadata.title}"
                </div>
              )}
            </div>

            <Separator />

            {/* AI Suggestions (Requirement 4.3) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-medium text-gray-600">AI Suggested Type</span>
                <div className="text-sm font-medium capitalize">
                  {extractionConfig.suggestedType}
                </div>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-600">AI Suggested Level</span>
                <div className="text-sm font-medium">
                  {extractionConfig.suggestedLevel}
                </div>
              </div>
            </div>

            <Separator />

            {/* Content Quality */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">Content Quality</span>
              <Badge variant="outline" className="text-xs">
                {Math.round(extractionConfig.metadata.suitabilityScore * 100)}% suitable
              </Badge>
            </div>

            {/* Attribution (Requirement 6.6) */}
            <div className="text-xs text-gray-500 italic">
              {LessonInterfaceUtils.formatAttribution(extractionConfig.attribution)}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExtractionInfo(false)}
                className="text-xs h-7"
              >
                <Info className="h-3 w-3 mr-1" />
                Hide Details
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleClearExtraction}
                className="text-xs h-7"
              >
                Clear & Start Fresh
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI-Powered Lesson Generator
          </CardTitle>
          <CardDescription className="text-xs">
            Configure your lesson parameters for intelligent generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs space-y-2">
                <div>
                  <div className="font-medium">{error.type}</div>
                  <div>{error.message}</div>
                </div>
                {error.actionableSteps && error.actionableSteps.length > 0 && (
                  <div>
                    <div className="font-medium mb-1">What you can do:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {error.actionableSteps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {error.errorId && (
                  <div className="text-xs text-muted-foreground border-t pt-2">
                    <div>Error ID: <code className="bg-muted px-1 rounded">{error.errorId}</code></div>
                    {error.supportContact && (
                      <div>Support: {error.supportContact}</div>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Lesson Type</label>
            <Select value={lessonType} onValueChange={(value) => { setLessonType(value); clearError(); }}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Choose lesson type" />
              </SelectTrigger>
              <SelectContent>
                {LESSON_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedLessonType && <p className="text-xs text-muted-foreground">{selectedLessonType.description}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Student Level</label>
            <Select value={studentLevel} onValueChange={(value) => { setStudentLevel(value); clearError(); }}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Choose CEFR level" />
              </SelectTrigger>
              <SelectContent>
                {STUDENT_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    <div>
                      <div className="font-medium">{level.label}</div>
                      <div className="text-xs text-muted-foreground">{level.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedLevel && <p className="text-xs text-muted-foreground">{selectedLevel.description}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Target Language</label>
            <Select value={targetLanguage} onValueChange={(value) => { setTargetLanguage(value); clearError(); }}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Choose language" />
              </SelectTrigger>
              <SelectContent>
                {TARGET_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    <div className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      {lang.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* User customization note (Requirement 4.4) */}
          {isExtractionSource && extractionConfig?.userCanModifySettings && (
            <div className="text-xs text-green-600 bg-green-50 p-2 rounded border">
              <Sparkles className="h-3 w-3 inline mr-1" />
              AI has pre-selected lesson type and level based on content analysis, but you can modify any settings above
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Source Content</label>
              {!isExtractionSource && (
                <Button variant="outline" size="sm" onClick={onExtractFromPage} className="h-7 text-xs bg-transparent">
                  Extract from Page
                </Button>
              )}
            </div>

            {/* Content editing capability (Requirement 4.5) */}
            {isExtractionSource && extractionConfig?.allowContentEditing && (
              <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border">
                <Info className="h-3 w-3 inline mr-1" />
                You can edit the extracted content below before generating your lesson
              </div>
            )}

            <Textarea
              value={selectedText}
              onChange={(e) => { setSelectedText(e.target.value); clearError(); }}
              placeholder={isExtractionSource ? "Edit the extracted content as needed..." : "Select text on the page or paste content here..."}
              className="min-h-[100px] text-xs"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{selectedText.length} characters</span>
              {(sourceUrl || extractionConfig?.metadata.sourceUrl) && (
                <span className="truncate max-w-[200px]">
                  Source: {extractionConfig?.metadata.domain || sourceUrl}
                </span>
              )}
            </div>
          </div>

          {isGenerating && (
            <div className="space-y-3">
              {/* Main progress header */}
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 animate-pulse text-primary" />
                  <span className="font-medium">Generating Lesson</span>
                </span>
                <span className="font-semibold text-primary">{generationProgress}%</span>
              </div>

              {/* Progress bar */}
              <Progress value={generationProgress} className="h-2.5" />

              {/* Detailed step information (Requirement 1.2, 1.3) */}
              <div className="space-y-2 bg-muted/50 rounded-lg p-3 border border-muted">
                {/* Current step display */}
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {generationStep || "Initializing..."}
                    </p>

                    {/* Phase-specific progress indicators */}
                    {generationPhase && (
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                            {generationPhase}
                          </Badge>
                          {generationSection && (
                            <>
                              <span className="text-muted-foreground/50">•</span>
                              <span className="font-medium">{generationSection}</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI processing indicator */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t border-muted">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>AI is analyzing your content and creating a personalized lesson...</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Button
              onClick={handleGenerateLesson}
              disabled={!lessonType || !studentLevel || !targetLanguage || !selectedText.trim() || isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating AI Lesson...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate AI Lesson
                </>
              )}
            </Button>
          </div>

          {user && (
            <p className="text-xs text-muted-foreground text-center">
              AI-generated lessons are automatically saved to your account
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
