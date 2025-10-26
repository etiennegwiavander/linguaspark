"use client"

import { useState, useEffect } from "react"
import LessonGenerator from "@/components/lesson-generator"
import LessonDisplay from "@/components/lesson-display"
import { LessonInterfaceUtils } from "@/lib/lesson-interface-bridge"
import UserMenu from "@/components/user-menu"

// Declare chrome for extension context
declare global {
  interface Window {
    chrome: any
  }
}

export default function PopupPage() {
  const [selectedText, setSelectedText] = useState("")
  const [sourceUrl, setSourceUrl] = useState("")
  const [extractedMetadata, setExtractedMetadata] = useState<any>(null)
  const [generatedLesson, setGeneratedLesson] = useState<any>(null)

  // Load persisted lesson or lesson from URL parameter on mount
  useEffect(() => {
    const loadLesson = async () => {
      try {
        // Check if there's a lessonId in the URL
        const urlParams = new URLSearchParams(window.location.search)
        const lessonId = urlParams.get('lessonId')
        
        if (lessonId) {
          console.log('[LinguaSpark Popup] 🔍 Loading lesson from database with ID:', lessonId)
          
          try {
            // Get auth token from localStorage
            const sessionData = localStorage.getItem('sb-jbkpnirowdvlwlgheqho-auth-token')
            if (!sessionData) {
              throw new Error('No authentication session found. Please sign in again.')
            }

            const session = JSON.parse(sessionData)
            const authToken = session.access_token

            // Call the get lesson API route
            const response = await fetch(`/api/get-lesson?id=${lessonId}`, {
              headers: {
                'Authorization': `Bearer ${authToken}`
              }
            })

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.error || `HTTP ${response.status}`)
            }

            const { lesson } = await response.json()
            
            console.log('[LinguaSpark Popup] ✅ Loaded lesson from database:', lesson.title)
            console.log('[LinguaSpark Popup] Lesson data structure:', {
              hasLessonData: !!lesson.lesson_data,
              lessonType: lesson.lesson_type,
              studentLevel: lesson.student_level
            })
            
            setGeneratedLesson(lesson.lesson_data)
            setSourceUrl(lesson.source_url || '')
            
            // Persist to localStorage
            localStorage.setItem('linguaspark_current_lesson', JSON.stringify(lesson.lesson_data))
            return
          } catch (loadError) {
            console.error('[LinguaSpark Popup] ❌ Error loading lesson from database:', loadError)
            if (loadError instanceof Error) {
              console.error('[LinguaSpark Popup] Error details:', {
                message: loadError.message,
                name: loadError.name
              })
              alert(`Failed to load lesson: ${loadError.message}`)
            }
          }
          
          // Don't continue to localStorage fallback if we had a lessonId
          return
        }
        
        // Fallback to localStorage if no lessonId in URL
        const savedLesson = localStorage.getItem('linguaspark_current_lesson')
        if (savedLesson) {
          const lesson = JSON.parse(savedLesson)
          console.log('[LinguaSpark Popup] ✅ Loaded persisted lesson from localStorage')
          setGeneratedLesson(lesson)
        }
      } catch (error) {
        console.error('[LinguaSpark Popup] Failed to load lesson:', error)
      }
    }
    loadLesson()
  }, [])

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
                const metadata = apiResult.data.lessonConfiguration.metadata;
                console.log('[LinguaSpark Popup] ✅ Retrieved content from API, length:', content.length);
                console.log('[LinguaSpark Popup] 📸 Banner image:', metadata.bannerImage || 'None');
                console.log('[LinguaSpark Popup] 🖼️ Images count:', metadata.images?.length || 0);
                if (metadata.images && metadata.images.length > 0) {
                  console.log('[LinguaSpark Popup] First image:', metadata.images[0]);
                }
                setSelectedText(content);
                setSourceUrl(metadata.sourceUrl || '');
                setExtractedMetadata(metadata); // ← STORE METADATA
                console.log('[LinguaSpark Popup] ✅ Metadata stored in state');
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

  const handleLessonGenerated = async (lesson: any) => {
    console.log('[LinguaSpark Popup] Lesson generated, saving to localStorage and database')
    setGeneratedLesson(lesson)

    // Persist lesson to localStorage
    try {
      localStorage.setItem('linguaspark_current_lesson', JSON.stringify(lesson))
      console.log('[LinguaSpark Popup] ✅ Lesson saved to localStorage')
    } catch (error) {
      console.error('[LinguaSpark Popup] Failed to save lesson to localStorage:', error)
    }

    // Save to Supabase database using the new API route
    try {
      console.log('[LinguaSpark Popup] 💾 Attempting to save lesson to database...')
      console.log('[LinguaSpark Popup] Lesson data:', {
        title: lesson.lessonTitle,
        lesson_type: lesson.lessonType,
        student_level: lesson.studentLevel,
        target_language: lesson.targetLanguage,
        has_source_url: !!sourceUrl,
      })

      // Get auth token from localStorage
      const sessionData = localStorage.getItem('sb-jbkpnirowdvlwlgheqho-auth-token')
      if (!sessionData) {
        throw new Error('No authentication session found')
      }

      const session = JSON.parse(sessionData)
      const authToken = session.access_token

      // Call the save API route
      const response = await fetch('/api/save-lesson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: lesson.lessonTitle,
          lesson_type: lesson.lessonType,
          student_level: lesson.studentLevel,
          target_language: lesson.targetLanguage,
          source_url: sourceUrl || undefined,
          lesson_data: lesson,
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const { lesson: savedLesson } = await response.json()
      console.log('[LinguaSpark Popup] ✅ Lesson saved to database with ID:', savedLesson.id)
    } catch (error) {
      console.error('[LinguaSpark Popup] ❌ Failed to save lesson to database:', error)
      if (error instanceof Error) {
        console.error('[LinguaSpark Popup] Error details:', {
          message: error.message,
          name: error.name,
        })
      }
      // Show user-friendly error notification (non-blocking)
      console.warn('[LinguaSpark Popup] Lesson generated but not saved to library. User can save manually.')
    }
  }

  const handleNewLesson = () => {
    console.log('[LinguaSpark Popup] Creating new lesson, clearing persisted data')
    setGeneratedLesson(null)

    // Clear persisted lesson from localStorage
    try {
      localStorage.removeItem('linguaspark_current_lesson')
      console.log('[LinguaSpark Popup] ✅ Cleared persisted lesson from localStorage')
    } catch (error) {
      console.error('[LinguaSpark Popup] Failed to clear persisted lesson:', error)
    }
  }

  const handleExportPDF = () => {
    // PDF export functionality will be implemented in the next milestone
    console.log("Exporting as PDF...")
  }

  const handleExportWord = () => {
    // Word export functionality will be implemented in the next milestone
    console.log("Exporting as Word...")
  }

  const handleLoadLesson = (lesson: any) => {
    console.log('[LinguaSpark Popup] Loading lesson from history:', lesson.title)
    // Convert database lesson format to display format
    const lessonData = lesson.lesson_data
    setGeneratedLesson(lessonData)

    // Persist loaded lesson to localStorage
    try {
      localStorage.setItem('linguaspark_current_lesson', JSON.stringify(lessonData))
      console.log('[LinguaSpark Popup] ✅ Loaded lesson saved to localStorage')
    } catch (error) {
      console.error('[LinguaSpark Popup] Failed to save loaded lesson:', error)
    }
  }

  return (
    <div className="w-full min-h-screen bg-vintage-cream">
      <div className="w-full space-y-4">
        {/* Header with user menu - Vintage Style */}
        <div className="sticky top-0 z-50 flex items-center justify-between px-6 pt-4 pb-3 border-b-3 border-vintage-brown bg-vintage-cream-dark shadow-sm">
          <div className="text-center flex-1">
            <h1 className="text-2xl font-serif font-bold text-vintage-brown">LinguaSpark</h1>
            <p className="text-sm text-vintage-brown/70">Transform content into professional lessons</p>
          </div>
          <UserMenu />
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
              extractedMetadata={extractedMetadata}
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
            onLoadLesson={handleLoadLesson}
          />
        )}
      </div>
    </div>
  )
}
