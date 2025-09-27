"use client"

import { useState, useEffect } from "react"
import LessonGenerator from "@/components/lesson-generator"
import LessonDisplay from "@/components/lesson-display"

// Declare chrome for extension context
declare global {
  interface Window {
    chrome: any
  }
}

export default function PopupPage() {
  const [selectedText, setSelectedText] = useState("")
  const [sourceUrl, setSourceUrl] = useState("")
  const [generatedLesson, setGeneratedLesson] = useState(null)

  useEffect(() => {
    // Load selected text from storage
    if (typeof window !== "undefined" && window.chrome?.storage) {
      window.chrome.storage.local.get(["selectedText", "sourceUrl"], (result: any) => {
        if (result.selectedText) {
          setSelectedText(result.selectedText)
        }
        if (result.sourceUrl) {
          setSourceUrl(result.sourceUrl)
        }
      })

      // Get current tab content if no selection
      if (!selectedText) {
        window.chrome.tabs?.query({ active: true, currentWindow: true }, (tabs: any[]) => {
          if (tabs[0]?.id) {
            window.chrome.tabs.sendMessage(tabs[0].id, { action: "getPageContent" }, (response: any) => {
              if (response && response.content) {
                setSelectedText(response.content.substring(0, 2000))
                setSourceUrl(tabs[0].url)
              }
            })
          }
        })
      }
    }
  }, [selectedText])

  const handleExtractFromPage = () => {
    if (typeof window !== "undefined" && window.chrome?.tabs) {
      window.chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
        if (tabs[0]?.id) {
          window.chrome.tabs.sendMessage(tabs[0].id, { action: "getPageContent" }, (response: any) => {
            if (response && response.content) {
              setSelectedText(response.content.substring(0, 2000))
              setSourceUrl(tabs[0].url)
            }
          })
        }
      })
    }
  }

  const handleLessonGenerated = (lesson: any) => {
    setGeneratedLesson(lesson)
  }

  const handleNewLesson = () => {
    setGeneratedLesson(null)
  }

  const handleExportPDF = () => {
    // PDF export functionality will be implemented in the next milestone
    console.log("Exporting as PDF...")
  }

  const handleExportWord = () => {
    // Word export functionality will be implemented in the next milestone
    console.log("Exporting as Word...")
  }

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-4">
      <div className="text-center">
        <h1 className="text-xl font-bold text-primary">LinguaSpark</h1>
        <p className="text-sm text-muted-foreground">Transform content into lessons</p>
      </div>

      {!generatedLesson ? (
        <LessonGenerator
          initialText={selectedText}
          sourceUrl={sourceUrl}
          onLessonGenerated={handleLessonGenerated}
          onExtractFromPage={handleExtractFromPage}
        />
      ) : (
        <LessonDisplay
          lesson={generatedLesson}
          onExportPDF={handleExportPDF}
          onExportWord={handleExportWord}
          onNewLesson={handleNewLesson}
        />
      )}
    </div>
  )
}
