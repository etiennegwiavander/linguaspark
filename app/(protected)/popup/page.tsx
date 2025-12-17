"use client"

import { useState, useEffect } from "react"
import LessonGenerator from "@/components/lesson-generator"
import LessonDisplay from "@/components/lesson-display"
import { LessonInterfaceUtils } from "@/lib/lesson-interface-bridge"
import UserMenu from "@/components/user-menu"
import { AdminLessonCreationDialog } from "@/components/admin-lesson-creation-dialog"
import type { PublicLessonMetadata } from "@/lib/types/public-lessons"

// Declare chrome for extension context
declare global {
  interface Window {
    chrome: any
  }
}

export default function PopupPage() {
  // Initialize with URL parameters immediately
  const getInitialContent = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const contentParam = urlParams.get('content')
      if (contentParam) {
        try {
          // Try decoding the content parameter
          const decoded = decodeURIComponent(contentParam)
          console.log('[LinguaSpark Popup] 🎯 Initial content from URL:', decoded.length, 'characters')
          return decoded
        } catch (error) {
          console.error('[LinguaSpark Popup] ❌ Error decoding content, using raw content:', error)
          // If decoding fails, use the raw content (it might already be decoded)
          console.log('[LinguaSpark Popup] 🔄 Using raw content parameter:', contentParam.length, 'characters')
          return contentParam
        }
      }
    }
    return ""
  }

  const getInitialSourceUrl = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const sourceParam = urlParams.get('sourceUrl')
      if (sourceParam) {
        try {
          return decodeURIComponent(sourceParam)
        } catch (error) {
          console.error('[LinguaSpark Popup] ❌ Error decoding initial sourceUrl:', error)
        }
      }
    }
    return ""
  }

  const [selectedText, setSelectedText] = useState(getInitialContent)
  const [sourceUrl, setSourceUrl] = useState(getInitialSourceUrl)
  const [extractedMetadata, setExtractedMetadata] = useState<any>(null)
  const [generatedLesson, setGeneratedLesson] = useState<any>(null)
  const [saveToPublic, setSaveToPublic] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdminLessonDialog, setShowAdminLessonDialog] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(true)
  const [adminError, setAdminError] = useState<string | null>(null)

  // IMMEDIATE URL parameter check - runs first
  useEffect(() => {
    console.log('[LinguaSpark Popup] 🚀 IMMEDIATE URL check on mount...')
    const urlParams = new URLSearchParams(window.location.search)
    const contentParam = urlParams.get('content')
    const sourceParam = urlParams.get('sourceUrl')
    
    console.log('[LinguaSpark Popup] URL params on mount:', {
      hasContent: !!contentParam,
      contentLength: contentParam?.length || 0,
      hasSource: !!sourceParam,
      isExtraction: urlParams.get('source') === 'extraction',
      autoPopulate: urlParams.get('autoPopulate') === 'true'
    })
    
    if (contentParam && contentParam.length > 0) {
      try {
        const decoded = decodeURIComponent(contentParam)
        console.log('[LinguaSpark Popup] 🎯 IMMEDIATE: Setting content from URL:', decoded.length, 'characters')
        setSelectedText(decoded)
        
        if (sourceParam) {
          const decodedSource = decodeURIComponent(sourceParam)
          setSourceUrl(decodedSource)
        }
      } catch (error) {
        console.error('[LinguaSpark Popup] ❌ IMMEDIATE: Error decoding, using raw content:', error)
        // Use raw content if decoding fails
        console.log('[LinguaSpark Popup] 🔄 IMMEDIATE: Using raw content:', contentParam.length, 'characters')
        setSelectedText(contentParam)
        
        if (sourceParam) {
          setSourceUrl(sourceParam)
        }
      }
    } else {
      console.log('[LinguaSpark Popup] ⚠️ IMMEDIATE: No content parameter found')
    }
  }, [])

  // Verify admin access on mount - REQUIRED for extension
  useEffect(() => {
    const verifyAdminAccess = async () => {
      try {
        console.log('[LinguaSpark Popup] 🔐 Verifying admin access...')
        setIsVerifyingAdmin(true)
        
        // Get session from localStorage
        const sessionData = localStorage.getItem('sb-jbkpnirowdvlwlgheqho-auth-token')
        
        if (!sessionData) {
          console.error('[LinguaSpark Popup] ❌ No session found')
          setAdminError('Please sign in to use this extension')
          setIsVerifyingAdmin(false)
          // Redirect to login after 2 seconds
          setTimeout(() => {
            window.location.href = '/auth/admin/login?redirectTo=/popup'
          }, 2000)
          return
        }
        
        const session = JSON.parse(sessionData)
        const authToken = session.access_token
        const user = session.user
        
        if (!user?.id) {
          console.error('[LinguaSpark Popup] ❌ No user ID in session')
          setAdminError('Invalid session. Please sign in again.')
          setIsVerifyingAdmin(false)
          return
        }
        
        setUserId(user.id)
        console.log('[LinguaSpark Popup] 👤 User ID:', user.id)
        
        // Check admin status
        const response = await fetch('/api/admin/check-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ userId: user.id })
        })
        
        if (!response.ok) {
          console.error('[LinguaSpark Popup] ❌ Admin check failed:', response.status)
          setAdminError('Failed to verify admin status')
          setIsVerifyingAdmin(false)
          return
        }
        
        const { isAdmin: adminStatus } = await response.json()
        console.log('[LinguaSpark Popup] 👑 Admin status:', adminStatus)
        
        if (!adminStatus) {
          console.error('[LinguaSpark Popup] ❌ User is not an admin')
          setAdminError('Admin access required. This extension is only available to administrators.')
          setIsVerifyingAdmin(false)
          return
        }
        
        // Success - user is admin
        setIsAdmin(true)
        setIsVerifyingAdmin(false)
        console.log('[LinguaSpark Popup] ✅ Admin access verified')
        
        // Check for saveToPublic parameter
        const urlParams = new URLSearchParams(window.location.search)
        const saveToPublicParam = urlParams.get('saveToPublic')
        if (saveToPublicParam === 'true') {
          setSaveToPublic(true)
        }
        
      } catch (error) {
        console.error('[LinguaSpark Popup] ❌ Error verifying admin:', error)
        setAdminError('An error occurred. Please try again.')
        setIsVerifyingAdmin(false)
      }
    }
    
    verifyAdminAccess()
  }, [])

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
    // Only load content after admin verification is complete
    if (isVerifyingAdmin) {
      console.log('[LinguaSpark Popup] ⏳ Waiting for admin verification to complete...')
      return
    }
    
    const loadContent = async () => {
      try {
        console.log('[LinguaSpark Popup] 🚀 loadContent useEffect starting...')
        console.log('[LinguaSpark Popup] Current selectedText state:', selectedText.length)
        console.log('[LinguaSpark Popup] Current sourceUrl state:', sourceUrl)
        
        // Debug storage state
        if (process.env.NODE_ENV === 'development') {
          await LessonInterfaceUtils.debugStorageState()
        }

        // First check URL parameters (works in both extension and web contexts)
        const urlParams = new URLSearchParams(window.location.search)
        const contentParam = urlParams.get('content')
        const sourceParam = urlParams.get('sourceUrl')
        
        console.log('[LinguaSpark Popup] 🔍 URL params check:', {
          hasContent: !!contentParam,
          contentLength: contentParam?.length || 0,
          hasSourceUrl: !!sourceParam,
          allParams: Object.fromEntries(urlParams)
        })
        
        console.log('[LinguaSpark Popup] URL parameter check:', {
          hasContent: !!contentParam,
          contentLength: contentParam?.length || 0,
          hasSourceUrl: !!sourceParam,
          sourceUrl: sourceParam
        })

        // Check if this is an extraction source
        const isExtractionSource = urlParams.get('source') === 'extraction';

        if (isExtractionSource) {
          console.log('[LinguaSpark Popup] Extraction source detected - checking for session ID');
          console.log('[LinguaSpark Popup] URL params:', Object.fromEntries(urlParams));

          // Primary: Check for content in URL parameters (cross-domain solution)
          if (contentParam) {
            console.log('[LinguaSpark Popup] 🎯 Processing URL parameters...');
            console.log('[LinguaSpark Popup] Raw content param length:', contentParam.length);
            console.log('[LinguaSpark Popup] Raw source param:', sourceParam || 'Not provided');
            
            let decodedContent, decodedSourceUrl;
            
            try {
              decodedContent = decodeURIComponent(contentParam);
              decodedSourceUrl = sourceParam ? decodeURIComponent(sourceParam) : '';
            } catch (error) {
              console.error('[LinguaSpark Popup] ❌ Error decoding URL parameters, using raw values:', error);
              decodedContent = contentParam;
              decodedSourceUrl = sourceParam || '';
            }
            
            console.log('[LinguaSpark Popup] ✅ Found content in URL parameters, length:', decodedContent.length);
            console.log('[LinguaSpark Popup] Source URL:', decodedSourceUrl || 'Empty');
            
            console.log('[LinguaSpark Popup] 🎯 Setting selectedText to content...')
            setSelectedText(decodedContent);
            setSourceUrl(decodedSourceUrl);
            console.log('[LinguaSpark Popup] ✅ State updated - selectedText should now be:', decodedContent.length, 'characters')
            
            // Force a re-render to ensure the state update is applied
            setTimeout(() => {
              console.log('[LinguaSpark Popup] 🔄 Checking selectedText after timeout:', selectedText.length)
            }, 100)
            
            // Check if there's metadata available
            const hasMetadata = urlParams.get('hasMetadata') === 'true';
            if (hasMetadata) {
              console.log('[LinguaSpark Popup] Metadata available - creating enhanced metadata object');
              
              // Get banner image from URL parameters
              const bannerImage = urlParams.get('bannerImage');
              
              // Get images array from URL parameters
              let images = [];
              try {
                const imagesParam = urlParams.get('images');
                if (imagesParam) {
                  images = JSON.parse(imagesParam);
                }
              } catch (error) {
                console.warn('[LinguaSpark Popup] Failed to parse images from URL:', error);
              }
              
              const enhancedMetadata = {
                title: urlParams.get('title') || document.title,
                sourceUrl: decodedSourceUrl,
                domain: new URL(decodedSourceUrl).hostname,
                extractedAt: new Date(),
                wordCount: decodedContent.split(' ').length,
                readingTime: Math.ceil(decodedContent.split(' ').length / 200),
                bannerImage: bannerImage || null, // Direct banner image URL
                bannerImages: images || [], // Array of image objects (for compatibility)
                images: images || [] // Array of image objects
              };
              
              console.log('[LinguaSpark Popup] 📸 Banner image from URL:', bannerImage || 'None');
              console.log('[LinguaSpark Popup] 🖼️ Images from URL:', images.length, 'images');
              
              setExtractedMetadata(enhancedMetadata);
            }
            
            console.log('[LinguaSpark Popup] ✅ Content loaded from URL parameters');
            return;
          }

          // Fallback: Check for session ID and retrieve content from localStorage (same-domain only)
          const sessionId = urlParams.get('sessionId');
          if (sessionId) {
            console.log('[LinguaSpark Popup] No URL content, trying localStorage with session:', sessionId);

            try {
              // Try session-specific localStorage key first
              let localData = localStorage.getItem(`linguaspark_session_${sessionId}`);
              
              // Fallback to general localStorage key
              if (!localData && sessionId.startsWith('localStorage_')) {
                localData = localStorage.getItem('linguaspark_lesson_config');
              }
              
              if (localData) {
                const parsed = JSON.parse(localData);
                console.log('[LinguaSpark Popup] Found localStorage data:', {
                  hasLessonConfig: !!parsed.lessonConfiguration,
                  contentLength: parsed.lessonConfiguration?.sourceContent?.length || 0
                });
                
                if (parsed.lessonConfiguration?.sourceContent) {
                  const content = parsed.lessonConfiguration.sourceContent;
                  const metadata = parsed.lessonConfiguration.metadata;
                  
                  console.log('[LinguaSpark Popup] ✅ Retrieved content from localStorage, length:', content.length);
                  setSelectedText(content);
                  setSourceUrl(metadata?.sourceUrl || '');
                  setExtractedMetadata(metadata);
                  console.log('[LinguaSpark Popup] ✅ Content and metadata stored in state');
                  return;
                }
              } else {
                console.warn('[LinguaSpark Popup] ⚠️ No localStorage data found (expected for cross-domain)');
              }
            } catch (error) {
              console.error('[LinguaSpark Popup] ❌ localStorage retrieval failed:', error);
            }
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

        // If no content found anywhere for extraction source
        if (isExtractionSource && !result.lessonConfiguration && !result.extractedContent && !result.selectedText) {
          console.error('[LinguaSpark Popup] ❌ No content found - this indicates an extraction failure');
          console.error('[LinguaSpark Popup] Expected content in URL parameters for cross-domain extraction');
          console.error('[LinguaSpark Popup] URL params available:', Object.fromEntries(urlParams));
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
  }, [isVerifyingAdmin])

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
    console.log('[LinguaSpark Popup] Lesson generated')
    setGeneratedLesson(lesson)

    // Persist lesson to localStorage
    try {
      localStorage.setItem('linguaspark_current_lesson', JSON.stringify(lesson))
      console.log('[LinguaSpark Popup] ✅ Lesson saved to localStorage')
    } catch (error) {
      console.error('[LinguaSpark Popup] Failed to save lesson to localStorage:', error)
    }

    // Check if this should be saved to public library
    if (saveToPublic && isAdmin) {
      console.log('[LinguaSpark Popup] 🌐 Triggering save to public library flow')
      // Show admin dialog to collect metadata
      setShowAdminLessonDialog(true)
      return
    }

    // Normal save flow - save to personal library
    await saveToPersonalLibrary(lesson)
  }

  const saveToPersonalLibrary = async (lesson: any) => {
    try {
      console.log('[LinguaSpark Popup] 💾 Attempting to save lesson to personal library...')
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
      console.log('[LinguaSpark Popup] ✅ Lesson saved to personal library with ID:', savedLesson.id)
    } catch (error) {
      console.error('[LinguaSpark Popup] ❌ Failed to save lesson to personal library:', error)
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

  const saveToPublicLibrary = async (metadata: PublicLessonMetadata) => {
    setShowAdminLessonDialog(false)

    try {
      console.log('[LinguaSpark Popup] 💾 Saving lesson to public library...')

      if (!generatedLesson) {
        throw new Error('No lesson to save')
      }

      if (!userId) {
        throw new Error('User ID not available')
      }

      // Get auth token from localStorage
      const sessionData = localStorage.getItem('sb-jbkpnirowdvlwlgheqho-auth-token')
      if (!sessionData) {
        throw new Error('No authentication session found')
      }

      const session = JSON.parse(sessionData)
      const authToken = session.access_token

      console.log('[LinguaSpark Popup] Calling public lessons create API...')
      console.log('[LinguaSpark Popup] 🔑 userId:', userId)
      console.log('[LinguaSpark Popup] 📝 metadata:', metadata)

      // Transform sections array into expected flat structure
      const transformedLesson: any = {
        title: generatedLesson.lessonTitle || generatedLesson.title,
        metadata: {
          ...generatedLesson.metadata,
          cefr_level: generatedLesson.studentLevel || generatedLesson.metadata?.cefr_level || "B1",
          lesson_type: generatedLesson.lessonType || generatedLesson.metadata?.lesson_type || "discussion",
          source_url: sourceUrl || generatedLesson.metadata?.source_url,
        }
      };

      // Copy all sections from the generated lesson
      console.log('[LinguaSpark Popup] 📋 Generated lesson structure:', {
        hasTitle: !!generatedLesson.lessonTitle,
        hasSections: !!generatedLesson.sections,
        sectionsType: typeof generatedLesson.sections,
        isArray: Array.isArray(generatedLesson.sections),
        sectionKeys: generatedLesson.sections ? Object.keys(generatedLesson.sections) : []
      });
      
      if (generatedLesson.sections) {
        // Sections is an object, not an array - copy all properties
        const sectionKeys = Object.keys(generatedLesson.sections);
        console.log('[LinguaSpark Popup] 📝 Copying sections:', sectionKeys);
        
        sectionKeys.forEach((sectionKey) => {
          const sectionData = generatedLesson.sections[sectionKey];
          console.log(`[LinguaSpark Popup] Section "${sectionKey}":`, {
            type: typeof sectionData,
            hasContent: !!sectionData,
            keys: sectionData && typeof sectionData === 'object' ? Object.keys(sectionData) : []
          });
          transformedLesson[sectionKey] = sectionData;
        });
        
        console.log('[LinguaSpark Popup] ✅ Transformed lesson sections:', Object.keys(transformedLesson).filter(k => k !== 'title' && k !== 'metadata'));
      } else {
        console.warn('[LinguaSpark Popup] ⚠️ No sections found in generated lesson!');
      }

      // Ensure required sections exist with fallbacks
      if (!transformedLesson.warmup) {
        transformedLesson.warmup = {
          questions: ["What do you know about this topic?"]
        };
      }
      
      if (!transformedLesson.wrapup) {
        transformedLesson.wrapup = {
          summary: "In this lesson, we explored the key concepts and practiced using them in context."
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

      // Call the public lessons create API route with userId
      // Structure the request according to API expectations
      const requestBody = {
        lesson: lessonContent,
        metadata: {
          category: metadata.category,
          tags: metadata.tags,
          estimated_duration_minutes: metadata.estimated_duration_minutes,
        },
        userId: userId, // Pass userId for extension context
      };

      console.log('[LinguaSpark Popup] 📤 Request body structure:', {
        hasLesson: !!requestBody.lesson,
        hasMetadata: !!requestBody.metadata,
        hasUserId: !!requestBody.userId,
        userId: requestBody.userId
      })

      const response = await fetch('/api/public-lessons/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}`
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('[LinguaSpark Popup] ✅ Lesson saved to public library with ID:', result.lesson_id)
      alert('Lesson saved to public library successfully!')
    } catch (error) {
      console.error('[LinguaSpark Popup] ❌ Failed to save lesson to public library:', error)
      if (error instanceof Error) {
        alert(`Failed to save lesson: ${error.message}`)
      } else {
        alert("Failed to save lesson. Please try again.")
      }
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

  // Show admin verification UI
  if (isVerifyingAdmin) {
    return (
      <div className="w-full min-h-screen bg-vintage-cream flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vintage-brown mx-auto"></div>
          <h2 className="text-xl font-serif font-bold text-vintage-brown">Verifying Admin Access...</h2>
          <p className="text-sm text-vintage-brown/70">Please wait</p>
        </div>
      </div>
    )
  }
  
  // Show error if not admin
  if (adminError) {
    return (
      <div className="w-full min-h-screen bg-vintage-cream flex items-center justify-center">
        <div className="text-center space-y-4 p-8 max-w-md">
          <div className="text-red-600 text-5xl">🔒</div>
          <h2 className="text-xl font-serif font-bold text-vintage-brown">Admin Access Required</h2>
          <p className="text-sm text-vintage-brown/70">{adminError}</p>
          <p className="text-xs text-vintage-brown/50 mt-4">
            This extension is only available to LinguaSpark administrators. 
            Contact your administrator for access.
          </p>
          <button
            onClick={() => window.location.href = '/auth/admin/login?redirectTo=/popup'}
            className="mt-4 px-4 py-2 bg-vintage-brown text-white rounded hover:bg-vintage-brown/90"
          >
            Go to Admin Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-vintage-cream">
      <div className="w-full space-y-4">
        {/* Header with user menu - Vintage Style */}
        <div className="sticky top-0 z-50 flex items-center justify-between px-6 pt-4 pb-3 border-b-3 border-vintage-brown bg-vintage-cream-dark shadow-sm">
          <div className="text-center flex-1">
            <h1 className="text-2xl font-serif font-bold text-vintage-brown">LinguaSpark</h1>
            <p className="text-sm text-vintage-brown/70">Admin Lesson Creator</p>
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
                <div>Debug: saveToPublic = {saveToPublic.toString()}</div>
                <div>Debug: isAdmin = {isAdmin.toString()}</div>
                <div>Debug: isVerifyingAdmin = {isVerifyingAdmin.toString()}</div>
                {(() => {
                  const urlParams = new URLSearchParams(window.location.search);
                  const contentParam = urlParams.get('content');
                  return (
                    <div>
                      <div>Debug: URL content param length = {contentParam?.length || 0}</div>
                      <div>Debug: URL content preview = {contentParam?.substring(0, 100) || 'None'}...</div>
                    </div>
                  );
                })()}
              </div>
            )}
            {(() => {
              console.log('[LinguaSpark Popup] 🎯 Rendering LessonGenerator with props:', {
                initialTextLength: selectedText.length,
                sourceUrl: sourceUrl,
                hasExtractedMetadata: !!extractedMetadata
              })
              return null
            })()}
            <LessonGenerator
              key={selectedText.length > 0 ? `content-${selectedText.length}` : 'empty'}
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
