"use client"

import { useState, useEffect } from "react"
import LessonGenerator from "@/components/lesson-generator"
import LessonDisplay from "@/components/lesson-display"
import { LessonInterfaceUtils } from "@/lib/lesson-interface-bridge"

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
    const loadContent = async () => {
      try {
        // Debug storage state
        if (process.env.NODE_ENV === 'development') {
          await LessonInterfaceUtils.debugStorageState()
        }

        // First check URL parameters (works in both extension and web contexts)
        const urlParams = new URLSearchParams(window.location.search)
        const contentParam = urlParams.get('content')
        const sourceParam = urlParams.get('sourceUrl')

        // Check if this is an extraction source
        const isExtractionSource = urlParams.get('source') === 'extraction';

        if (isExtractionSource) {
          console.log('[LinguaSpark Popup] Extraction source detected - checking for session ID');
          console.log('[LinguaSpark Popup] URL params:', Object.fromEntries(urlParams));
          
          // NEW: Check for session ID and retrieve content from API
          const sessionId = urlParams.get('sessionId');
          if (sessionId) {
            console.log('[LinguaSpark Popup] Found session ID, retrieving content from API:', sessionId);
            
            try {
              const response = await fetch('/api/get-extracted-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'retrieve',
                  sessionId: sessionId
                })
              });
              
              const apiResult = await response.json();
              if (apiResult.success && apiResult.data.lessonConfiguration) {
                const content = apiResult.data.lessonConfiguration.sourceContent;
                console.log('[LinguaSpark Popup] ✅ Retrieved content from API, length:', content.length);
                setSelectedText(content);
                setSourceUrl(apiResult.data.lessonConfiguration.metadata.sourceUrl || '');
                return;
              } else {
                console.error('[LinguaSpark Popup] Failed to retrieve content from API:', apiResult.error);
              }
            } catch (error) {
              console.error('[LinguaSpark Popup] API request failed:', error);
            }
          }
          
          // Fallback: Check for content in URL parameters (legacy support)
          if (contentParam && sourceParam) {
            const decodedContent = decodeURIComponent(contentParam);
            console.log('[LinguaSpark Popup] ✅ Found content in URL parameters, length:', decodedContent.length);
            setSelectedText(decodedContent);
            setSourceUrl(decodeURIComponent(sourceParam));
            return;
          }
          
          // For extraction sources, check storage as final fallback
        } else if (contentParam && sourceParam) {
          // Only use URL parameters for non-extraction sources (manual URLs, etc.)
          const decodedContent = decodeURIComponent(contentParam);
          console.log('[LinguaSpark Popup] Non-extraction source with URL content, length:', decodedContent.length);
          setSelectedText(decodedContent);
          setSourceUrl(decodeURIComponent(sourceParam));
          return;
        }

        // Use safe storage access
        const result = await LessonInterfaceUtils.safeStorageGet(['lessonConfiguration', 'extractedContent', 'selectedText', 'sourceUrl'])
        console.log('[LinguaSpark Popup] Storage result:', result)
        console.log('[LinguaSpark Popup] Storage result keys:', Object.keys(result || {}))
        
        // Also check localStorage directly for debugging
        try {
          const directCheck = localStorage.getItem('linguaspark_lesson_config');
          console.log('[LinguaSpark Popup] Direct localStorage check:', directCheck ? 'Found data' : 'No data');
          if (directCheck) {
            const parsed = JSON.parse(directCheck);
            console.log('[LinguaSpark Popup] Direct localStorage keys:', Object.keys(parsed));
            console.log('[LinguaSpark Popup] Direct localStorage lessonConfiguration:', !!parsed.lessonConfiguration);
            console.log('[LinguaSpark Popup] Direct localStorage content length:', parsed.lessonConfiguration?.sourceContent?.length || 0);
            
            // If we found data in localStorage but not in the result, use it directly
            if (parsed.lessonConfiguration && !result.lessonConfiguration) {
              console.log('[LinguaSpark Popup] Using localStorage data directly');
              console.log('[LinguaSpark Popup] Setting selectedText to:', parsed.lessonConfiguration.sourceContent?.length || 0, 'characters');
              setSelectedText(parsed.lessonConfiguration.sourceContent || '');
              setSourceUrl(parsed.lessonConfiguration.metadata?.sourceUrl || '');
              return;
            }
          }
        } catch (error) {
          console.log('[LinguaSpark Popup] Direct localStorage check failed:', error);
        }

        // Check for new lesson configuration format first
        if (result.lessonConfiguration) {
          console.log('[LinguaSpark Popup] Found lesson configuration with', result.lessonConfiguration.sourceContent?.length || 0, 'characters')
          setSelectedText(result.lessonConfiguration.sourceContent)
          setSourceUrl(result.lessonConfiguration.metadata.sourceUrl)
          return
        }

        // Check for extracted content format
        if (result.extractedContent) {
          console.log('[LinguaSpark Popup] Found extracted content with', result.extractedContent.text?.length || 0, 'characters')
          setSelectedText(result.extractedContent.text)
          setSourceUrl(result.extractedContent.metadata?.sourceUrl || window.location.href)
          return
        }

        // Fallback to legacy format
        if (result.selectedText) {
          console.log('[LinguaSpark Popup] Found legacy selected text')
          setSelectedText(result.selectedText)
        }
        if (result.sourceUrl) {
          setSourceUrl(result.sourceUrl)
        }

        // If no content found in storage and this is an extraction source, use URL fallback
        if (isExtractionSource && !result.lessonConfiguration && !result.extractedContent && !result.selectedText) {
          console.log('[LinguaSpark Popup] No content in storage - checking URL parameters as fallback');
          // CRITICAL FIX: Use URL content as primary fallback (cross-domain solution)
          if (contentParam && sourceParam) {
            const decodedContent = decodeURIComponent(contentParam);
            console.log('[LinguaSpark Popup] ✅ Using URL content fallback, length:', decodedContent.length);
            setSelectedText(decodedContent);
            setSourceUrl(decodeURIComponent(sourceParam));
            return;
          } else {
            console.error('[LinguaSpark Popup] ❌ No content in storage OR URL - extraction failed completely');
          }
        }

        // If no content found and we're in extension context, try to get current tab content
        if (!result.lessonConfiguration && !result.extractedContent && !result.selectedText && LessonInterfaceUtils.isChromeExtensionContext()) {
          console.log('[LinguaSpark Popup] No stored content, trying current tab')
          window.chrome.tabs?.query({ active: true, currentWindow: true }, (tabs: any[]) => {
            if (tabs[0]?.id) {
              window.chrome.tabs.sendMessage(tabs[0].id, { action: "getPageContent" }, (response: any) => {
                if (response && response.content) {
                  // Use full content without truncation
                  const fullContent = typeof response.content === 'object' ? response.content.text : response.content;
                  setSelectedText(fullContent)
                  setSourceUrl(tabs[0].url)
                }
              })
            }
          })
        }
      } catch (error) {
        console.error('[LinguaSpark Popup] Failed to load content:', error)
      }
    }

    loadContent()
  }, [])

  const handleExtractFromPage = () => {
    if (typeof window !== "undefined" && window.chrome?.tabs) {
      window.chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
        if (tabs[0]?.id) {
          window.chrome.tabs.sendMessage(tabs[0].id, { action: "getPageContent" }, (response: any) => {
            if (response && response.content) {
              // Handle enhanced content extraction
              if (typeof response.content === 'object') {
                // Use full content without truncation
                setSelectedText(response.content.text)
                setSourceUrl(tabs[0].url)
                // Store enhanced content data for lesson generation
                window.chrome.storage.local.set({
                  enhancedContent: response.content,
                  sourceUrl: tabs[0].url,
                })
              } else {
                // Fallback for simple text content - use full content
                setSelectedText(response.content)
                setSourceUrl(tabs[0].url)
              }
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
    <div className="w-full min-h-screen">
      <div className="w-full px-6 lg:px-8 py-4 space-y-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-primary">LinguaSpark</h1>
          <p className="text-sm text-muted-foreground">Transform content into lessons</p>
        </div>

        {!generatedLesson ? (
          <div className="max-w-2xl mx-auto">
            {/* Debug info - remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-4 p-2 bg-gray-100 text-xs">
                <div>Debug: selectedText length = {selectedText.length}</div>
                <div>Debug: sourceUrl = {sourceUrl}</div>
                <div>Debug: URL params = {window.location.search}</div>
              </div>
            )}
            <LessonGenerator
              initialText={selectedText}
              sourceUrl={sourceUrl}
              onLessonGenerated={handleLessonGenerated}
              onExtractFromPage={handleExtractFromPage}
            />
          </div>
        ) : (
          <LessonDisplay
            lesson={generatedLesson}
            onExportPDF={handleExportPDF}
            onExportWord={handleExportWord}
            onNewLesson={handleNewLesson}
          />
        )}
      </div>
    </div>
  )
}
