"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, BookOpen, Globe, Users, FileText, Mic, AlertCircle, Sparkles } from "lucide-react"
import { useAuth } from "./auth-wrapper"

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

interface LessonGeneratorProps {
  initialText?: string
  sourceUrl?: string
  onLessonGenerated: (lesson: any) => void
  onExtractFromPage: () => void
}

export default function LessonGenerator({
  initialText = "",
  sourceUrl = "",
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
  const [error, setError] = useState("")
  const { user } = useAuth()

  const handleGenerateLesson = async () => {
    if (!lessonType || !studentLevel || !targetLanguage || !selectedText.trim()) {
      setError("Please fill in all fields and provide source content.")
      return
    }

    if (selectedText.length < 50) {
      setError("Please provide more content (at least 50 characters) for better lesson generation.")
      return
    }

    setError("")
    setIsGenerating(true)
    setGenerationProgress(0)

    try {
      const steps = [
        { step: "Analyzing content context and complexity...", progress: 15 },
        { step: "Extracting key topics and vocabulary...", progress: 30 },
        { step: "Creating contextual summary...", progress: 45 },
        { step: "Generating lesson structure...", progress: 60 },
        { step: "Creating detailed contextual exercises...", progress: 80 },
        { step: "Proofreading and finalizing...", progress: 100 },
      ]

      for (const { step, progress } of steps) {
        setGenerationStep(step)
        setGenerationProgress(progress)
        await new Promise((resolve) => setTimeout(resolve, 800))
      }

      // Get enhanced content data if available
      let enhancedContent = null
      if (typeof window !== "undefined" && window.chrome?.storage) {
        const result = await new Promise((resolve) => {
          window.chrome.storage.local.get(["enhancedContent"], resolve)
        })
        enhancedContent = result.enhancedContent
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
        requestBody.contentMetadata = enhancedContent.metadata
        requestBody.structuredContent = enhancedContent.structuredContent
        requestBody.wordCount = enhancedContent.wordCount
        requestBody.readingTime = enhancedContent.readingTime
      }

      // Call the AI generation API
      const response = await fetch("/api/generate-lesson", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error("Failed to generate lesson")
      }

      const { lesson } = await response.json()
      onLessonGenerated(lesson)
      setIsGenerating(false)
    } catch (error) {
      console.error("Error generating lesson:", error)
      setError("Failed to generate lesson. Please try again.")
      setIsGenerating(false)
    }
  }

  const selectedLessonType = LESSON_TYPES.find((t) => t.value === lessonType)
  const selectedLevel = STUDENT_LEVELS.find((l) => l.value === studentLevel)
  const selectedLanguage = TARGET_LANGUAGES.find((l) => l.value === targetLanguage)

  return (
    <div className="space-y-4">
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
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Lesson Type</label>
            <Select value={lessonType} onValueChange={setLessonType}>
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
            <Select value={studentLevel} onValueChange={setStudentLevel}>
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
            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Source Content</label>
              <Button variant="outline" size="sm" onClick={onExtractFromPage} className="h-7 text-xs bg-transparent">
                Extract from Page
              </Button>
            </div>
            <Textarea
              value={selectedText}
              onChange={(e) => setSelectedText(e.target.value)}
              placeholder="Select text on the page or paste content here..."
              className="min-h-[100px] text-xs"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{selectedText.length} characters</span>
              {sourceUrl && <span className="truncate max-w-[200px]">Source: {sourceUrl}</span>}
            </div>
          </div>

          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-3 w-3 animate-pulse text-primary" />
                  {generationStep}
                </span>
                <span>{generationProgress}%</span>
              </div>
              <Progress value={generationProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                AI is analyzing your content and creating a personalized lesson...
              </p>
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
            
            {process.env.NODE_ENV === 'development' && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const response = await fetch("/api/test-ai", { method: "POST" })
                    const result = await response.json()
                    console.log("AI Test Result:", result)
                    alert(result.success ? `AI Working: ${result.response}` : `AI Error: ${result.error}`)
                  } catch (error) {
                    console.error("Test failed:", error)
                    alert("Test failed: " + error.message)
                  }
                }}
                className="w-full text-xs"
              >
                Test AI Connection
              </Button>
            )}
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
