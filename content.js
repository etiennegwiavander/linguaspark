// LinguaSpark Content Script - Extract from Page Button
;(() => {
  console.log('[LinguaSpark] Content script loaded on:', window.location.href);
  
  // State management
  let buttonInstance = null;
  let isInitialized = false;
  let analysisResult = null;

  // Initialize the extract button system
  function initializeExtractButton() {
    if (isInitialized) return;
    
    console.log('[LinguaSpark] Initializing extract button system...');
    
    try {
      // Analyze page content
      analyzePageContent().then(result => {
        analysisResult = result;
        console.log('[LinguaSpark] Page analysis result:', result);
        
        if (result.shouldShow) {
          createFloatingButton();
        } else {
          console.log('[LinguaSpark] Button not shown. Reason:', result.reason);
        }
      }).catch(error => {
        console.error('[LinguaSpark] Page analysis failed:', error);
      });

      isInitialized = true;
      
    } catch (error) {
      console.error('[LinguaSpark] Failed to initialize extract button:', error);
    }
  }

  // Analyze page content to determine if button should be shown
  async function analyzePageContent() {
    try {
      const content = extractCleanContent();
      const wordCount = content.wordCount;
      const contentType = determineContentType();
      
      console.log('[LinguaSpark] Content analysis:', {
        wordCount,
        contentType,
        title: document.title,
        url: window.location.href
      });

      // Decision logic
      let shouldShow = false;
      let reason = '';

      if (wordCount < 200) {
        reason = `Insufficient content: ${wordCount} words (minimum 200 required)`;
      } else if (isExcludedSite()) {
        reason = 'Site is in exclusion list (e-commerce, social media, etc.)';
      } else if (!isEducationalContent(content, contentType)) {
        reason = 'Content does not appear to be educational';
      } else {
        shouldShow = true;
        reason = 'Content meets all criteria for extraction';
      }

      return {
        shouldShow,
        reason,
        wordCount,
        contentType,
        content
      };
      
    } catch (error) {
      console.error('[LinguaSpark] Content analysis error:', error);
      return {
        shouldShow: false,
        reason: 'Analysis failed: ' + error.message,
        wordCount: 0,
        contentType: 'unknown'
      };
    }
  }

  // Determine content type based on URL and page structure
  function determineContentType() {
    const url = window.location.href.toLowerCase();
    const hostname = window.location.hostname.toLowerCase();
    
    if (hostname.includes('wikipedia') || url.includes('/wiki/')) {
      return 'encyclopedia';
    } else if (url.includes('/news/') || hostname.includes('bbc') || hostname.includes('cnn') || hostname.includes('reuters')) {
      return 'news';
    } else if (url.includes('/blog/') || hostname.includes('medium') || url.includes('/article/')) {
      return 'blog';
    } else if (url.includes('/tutorial/') || url.includes('/guide/') || url.includes('/docs/')) {
      return 'tutorial';
    } else if (url.includes('/product/') || url.includes('/shop/') || hostname.includes('amazon')) {
      return 'ecommerce';
    } else {
      return 'general';
    }
  }

  // Check if site should be excluded
  function isExcludedSite() {
    const hostname = window.location.hostname.toLowerCase();
    const url = window.location.href.toLowerCase();
    
    const excludedDomains = [
      'facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com',
      'amazon.com', 'ebay.com', 'etsy.com', 'shopify.com',
      'youtube.com', 'netflix.com', 'spotify.com'
    ];
    
    const excludedPatterns = [
      '/shop/', '/cart/', '/checkout/', '/login/', '/register/',
      '/account/', '/profile/', '/settings/'
    ];
    
    // Always exclude our own LinguaSpark pages (localhost:3000)
    if ((hostname === 'localhost' || hostname === '127.0.0.1') && url.includes(':3000')) {
      return true;
    }
    
    return excludedDomains.some(domain => hostname.includes(domain)) ||
           excludedPatterns.some(pattern => url.includes(pattern));
  }

  // Check if content appears to be educational
  function isEducationalContent(content, contentType) {
    if (contentType === 'ecommerce') return false;
    
    const educationalTypes = ['news', 'blog', 'encyclopedia', 'tutorial'];
    if (educationalTypes.includes(contentType)) return true;
    
    // Check for educational keywords in content
    const text = (content.text + ' ' + document.title).toLowerCase();
    const educationalKeywords = [
      'learn', 'education', 'study', 'research', 'analysis', 'guide',
      'tutorial', 'explanation', 'understanding', 'knowledge', 'information'
    ];
    
    return educationalKeywords.some(keyword => text.includes(keyword));
  }


  // Create and show the floating action button with cross-browser compatibility
  function createFloatingButton() {
    if (buttonInstance) return;

    try {
      // Detect device and browser capabilities
      const isMobile = window.innerWidth < 768 || navigator.maxTouchPoints > 0;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const supportsTransitions = 'transition' in document.documentElement.style;
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      // Calculate optimal button size
      const buttonSize = isMobile ? (isTouchDevice ? 56 : 48) : 64;
      const safeAreaBottom = isMobile ? 80 : 20; // Extra space for mobile browser UI
      
      // Create button container
      const buttonContainer = document.createElement('div');
      buttonContainer.id = 'linguaspark-extract-button';
      buttonContainer.style.cssText = `
        position: fixed;
        bottom: ${safeAreaBottom}px;
        right: 20px;
        z-index: 10000;
        pointer-events: none;
      `;

      // Create button element with responsive sizing
      const button = document.createElement('button');
      button.style.cssText = `
        width: ${buttonSize}px;
        height: ${buttonSize}px;
        min-width: ${buttonSize}px;
        min-height: ${buttonSize}px;
        border-radius: 50%;
        background: #2563eb;
        border: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        cursor: pointer;
        pointer-events: auto;
        ${supportsTransitions && !prefersReducedMotion ? 'transition: all 0.2s ease;' : ''}
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: ${Math.round(buttonSize * 0.4)}px;
        ${isTouchDevice ? 'touch-action: manipulation;' : ''}
        ${isTouchDevice ? '-webkit-tap-highlight-color: transparent;' : ''}
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
      `;

      // Add Sparky mascot (simplified version for content script)
      button.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
          <path d="M16 2L20 12H28L22 18L24 28L16 22L8 28L10 18L4 12H12L16 2Z" />
        </svg>
      `;

      // Add hover effects (only for non-touch devices)
      if (!isTouchDevice && !prefersReducedMotion) {
        button.addEventListener('mouseenter', () => {
          button.style.transform = 'scale(1.05)';
          button.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
        });

        button.addEventListener('mouseleave', () => {
          button.style.transform = 'scale(1)';
          button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        });
      }
      
      // Add touch feedback for touch devices
      if (isTouchDevice && !prefersReducedMotion) {
        button.addEventListener('touchstart', () => {
          button.style.transform = 'scale(0.95)';
        });
        
        button.addEventListener('touchend', () => {
          button.style.transform = 'scale(1)';
        });
        
        button.addEventListener('touchcancel', () => {
          button.style.transform = 'scale(1)';
        });
      }

      // Add click handler
      button.addEventListener('click', async () => {
        try {
          await handleExtractClick();
        } catch (error) {
          console.error('[LinguaSpark] Click handler error:', error);
        }
      });

      // Add comprehensive accessibility attributes
      button.setAttribute('aria-label', 'Extract content from page for lesson generation');
      button.setAttribute('aria-description', 'Click to extract webpage content and create a language lesson');
      button.setAttribute('title', 'Extract content from page (Alt+E)');
      button.setAttribute('role', 'button');
      button.setAttribute('tabindex', '0');
      
      // Add keyboard navigation support
      button.addEventListener('keydown', async (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          try {
            await handleExtractClick();
          } catch (error) {
            console.error('[LinguaSpark] Keyboard handler error:', error);
          }
        }
      });

      buttonContainer.appendChild(button);
      document.body.appendChild(buttonContainer);

      buttonInstance = {
        container: buttonContainer,
        button: button
      };

      console.log('[LinguaSpark] Floating button created and shown');

    } catch (error) {
      console.error('[LinguaSpark] Failed to create floating button:', error);
    }
  }

  // Remove the floating action button
  function removeFloatingButton() {
    if (buttonInstance) {
      try {
        buttonInstance.container.remove();
        buttonInstance = null;
        console.log('[LinguaSpark] Floating button removed');
      } catch (error) {
        console.error('[LinguaSpark] Failed to remove floating button:', error);
      }
    }
  }

  // Check if extension context is valid
  function isExtensionContextValid() {
    try {
      return chrome.runtime && chrome.runtime.id;
    } catch (error) {
      return false;
    }
  }

  // Safe chrome runtime message sending with context validation
  async function safeSendMessage(message) {
    return new Promise((resolve, reject) => {
      // Create fallback URL with metadata AND content
      const createFallbackUrl = () => {
        const baseUrl = 'http://localhost:3000/popup?source=extraction&autoPopulate=true';
        if (message.data) {
          const params = new URLSearchParams();
          params.set('source', 'extraction');
          params.set('autoPopulate', 'true');
          if (message.data.title) params.set('title', message.data.title);
          if (message.data.sourceUrl) params.set('sourceUrl', message.data.sourceUrl);
          if (message.data.type) params.set('type', message.data.type);
          if (message.data.level) params.set('level', message.data.level);
          if (message.data.content) params.set('content', message.data.content); // CRITICAL: Include content in URL
          return `http://localhost:3000/popup?${params.toString()}`;
        }
        return baseUrl;
      };

      if (!isExtensionContextValid()) {
        console.warn('[LinguaSpark] Extension context invalidated - opening lesson interface directly');
        const url = createFallbackUrl();
        console.log('[LinguaSpark] Opening fallback URL:', url);
        window.open(url, '_blank');
        resolve({ success: true, fallback: true });
        return;
      }

      try {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            console.warn('[LinguaSpark] Runtime error:', chrome.runtime.lastError.message);
            const url = createFallbackUrl();
            console.log('[LinguaSpark] Opening fallback URL after runtime error:', url);
            window.open(url, '_blank');
            resolve({ success: true, fallback: true });
          } else {
            resolve(response || { success: true });
          }
        });
      } catch (error) {
        console.warn('[LinguaSpark] Failed to send message:', error.message);
        const url = createFallbackUrl();
        console.log('[LinguaSpark] Opening fallback URL after exception:', url);
        window.open(url, '_blank');
        resolve({ success: true, fallback: true });
      }
    });
  }

  // Safe chrome storage operations with context validation
  async function safeStorageSet(data) {
    console.log('[LinguaSpark] safeStorageSet called with data keys:', Object.keys(data));
    console.log('[LinguaSpark] Extension context valid:', isExtensionContextValid());
    
    return new Promise((resolve, reject) => {
      // Always try Chrome storage first since that's what was working yesterday
      try {
        chrome.storage.local.set(data, () => {
          if (chrome.runtime.lastError) {
            console.warn('[LinguaSpark] Chrome storage error:', chrome.runtime.lastError.message);
            console.log('[LinguaSpark] ❌ Chrome storage failed, this explains why popup can\'t find data');
            resolve({ success: false, error: chrome.runtime.lastError.message });
          } else {
            console.log('[LinguaSpark] ✅ Chrome storage completed successfully');
            // Verify the storage worked
            chrome.storage.local.get(['lessonConfiguration'], (result) => {
              if (result.lessonConfiguration) {
                console.log('[LinguaSpark] ✅ Storage verification SUCCESS - content length:', result.lessonConfiguration.sourceContent?.length || 0);
                resolve({ success: true });
              } else {
                console.error('[LinguaSpark] ❌ Storage verification FAILED - no data found');
                resolve({ success: false, error: 'Verification failed' });
              }
            });
          }
        });
      } catch (error) {
        console.error('[LinguaSpark] Chrome storage access failed:', error.message);
        console.log('[LinguaSpark] ❌ This explains why the popup can\'t find the data');
        resolve({ success: false, error: error.message });
      }
    });
  }

  // Handle extract button click
  async function handleExtractClick() {
    console.log('[LinguaSpark] handleExtractClick called');
    if (!buttonInstance) {
      console.warn('[LinguaSpark] No button instance found');
      return;
    }

    try {
      // Show loading state
      buttonInstance.button.style.background = '#1d4ed8';
      buttonInstance.button.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="animate-spin">
          <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93"/>
        </svg>
      `;

      // Extract content using the working extractCleanContent function
      console.log('[LinguaSpark] Starting content extraction...');
      let extractedContent;
      
      try {
        // Use the working extractCleanContent function
        const cleanContent = extractCleanContent();
        console.log('[LinguaSpark] Clean content extracted:', {
          textLength: cleanContent.text?.length || 0,
          wordCount: cleanContent.wordCount || 0
        });
        
        // Create enhanced content structure from clean content
        extractedContent = {
          text: cleanContent.text,
          wordCount: cleanContent.wordCount,
          metadata: {
            title: cleanContent.metadata.title || document.title,
            author: cleanContent.metadata.author,
            description: cleanContent.metadata.description,
            sourceUrl: window.location.href,
            domain: window.location.hostname
          },
          structuredContent: cleanContent.structuredContent || {},
          suggestedLessonType: determineLessonType(cleanContent.text, window.location.href),
          suggestedCEFRLevel: determineCEFRLevel(cleanContent.wordCount),
          validation: { isValid: true, issues: [] },
          enhanced: true
        };
        
        console.log('[LinguaSpark] Enhanced content created:', {
          textLength: extractedContent.text?.length || 0,
          wordCount: extractedContent.wordCount || 0,
          suggestedType: extractedContent.suggestedLessonType,
          suggestedLevel: extractedContent.suggestedCEFRLevel
        });
        
      } catch (error) {
        console.error('[LinguaSpark] Content extraction failed, using emergency fallback:', error);
        // Emergency fallback - extract full content without truncation
        const fullBodyText = document.body.innerText || document.body.textContent || '';
        extractedContent = {
          text: fullBodyText,
          wordCount: fullBodyText.split(' ').length,
          metadata: {
            title: document.title,
            author: null,
            description: null,
            sourceUrl: window.location.href,
            domain: window.location.hostname
          },
          structuredContent: {},
          suggestedLessonType: 'discussion',
          suggestedCEFRLevel: 'B1',
          validation: { isValid: true, issues: [] },
          enhanced: false
        };
      }
      
      // Validate content - use more lenient validation
      if (!extractedContent.validation?.isValid || !extractedContent.text || extractedContent.text.length < 50) {
        console.warn('[LinguaSpark] Content validation failed or too short, using fallback');
        // Create minimal valid content - extract full content without truncation
        const fallbackText = document.body.innerText || document.body.textContent || 'No content extracted';
        extractedContent = {
          text: fallbackText,
          wordCount: fallbackText.split(' ').length,
          metadata: {
            title: document.title,
            author: null,
            description: null
          },
          structuredContent: {},
          suggestedLessonType: 'discussion',
          suggestedCEFRLevel: 'B1',
          validation: { isValid: true, issues: [] },
          enhanced: false
        };
      }

      // Create lesson configuration in the format expected by LessonInterfaceBridge
      const lessonConfiguration = {
        sourceContent: extractedContent.text,
        suggestedType: extractedContent.suggestedLessonType,
        suggestedLevel: extractedContent.suggestedCEFRLevel,
        metadata: {
          title: extractedContent.metadata.title,
          author: extractedContent.metadata.author,
          sourceUrl: window.location.href,
          domain: window.location.hostname,
          extractedAt: new Date(),
          wordCount: extractedContent.wordCount,
          readingTime: Math.ceil(extractedContent.wordCount / 200), // 200 words per minute
          complexity: determineComplexity(extractedContent.wordCount),
          suitabilityScore: extractedContent.validation.isValid ? 0.8 : 0.4
        },
        extractionSource: 'webpage',
        allowContentEditing: true,
        userCanModifySettings: true,
        attribution: `Extracted from ${document.title} - ${window.location.href}`
      };

      // Store both formats for compatibility using safe storage
      console.log('[LinguaSpark] Storing content to Chrome storage...');
      console.log('[LinguaSpark] lessonConfiguration:', {
        sourceContentLength: lessonConfiguration.sourceContent?.length || 0,
        suggestedType: lessonConfiguration.suggestedType,
        suggestedLevel: lessonConfiguration.suggestedLevel,
        title: lessonConfiguration.metadata.title
      });
      
      const storageData = {
        lessonConfiguration: lessonConfiguration, // For LessonInterfaceBridge
        extractedContent: extractedContent, // For backward compatibility
        extractionSource: 'webpage',
        extractionTimestamp: Date.now(),
        sourceUrl: window.location.href,
        sourceTitle: document.title
      };
      
      console.log('[LinguaSpark] About to store data:', {
        keys: Object.keys(storageData),
        lessonConfigExists: !!storageData.lessonConfiguration,
        contentLength: storageData.lessonConfiguration?.sourceContent?.length || 0
      });
      
      console.log('[LinguaSpark] Calling safeStorageSet...');
      try {
        const storageResult = await safeStorageSet(storageData);
        console.log('[LinguaSpark] ✅ Storage completed successfully:', storageResult);
      } catch (storageError) {
        console.error('[LinguaSpark] ❌ Storage failed:', storageError);
        // Emergency fallback - direct localStorage
        console.log('[LinguaSpark] Attempting emergency direct storage...');
        try {
          localStorage.setItem('linguaspark_lesson_config', JSON.stringify(storageData));
          console.log('[LinguaSpark] ✅ Emergency storage completed');
        } catch (emergencyError) {
          console.error('[LinguaSpark] ❌ Emergency storage also failed:', emergencyError);
        }
      }

      // Show success state
      buttonInstance.button.style.background = '#16a34a';
      buttonInstance.button.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 12L11 14L15 10M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z"/>
        </svg>
      `;

      // Open lesson generation interface using safe message sending
      console.log('[LinguaSpark] Opening lesson interface...');
      
      // Open lesson generation interface using safe message sending
      console.log('[LinguaSpark] Opening lesson interface...');
      
      await safeSendMessage({
        action: 'openLessonInterface',
        data: {
          source: 'extraction',
          autoPopulate: true,
          title: lessonConfiguration.metadata.title,
          sourceUrl: lessonConfiguration.metadata.sourceUrl,
          type: lessonConfiguration.suggestedType,
          level: lessonConfiguration.suggestedLevel
          // Content is already stored in Chrome storage - NO URL passing needed
        }
      });

      // Reset button after delay
      setTimeout(() => {
        if (buttonInstance) {
          buttonInstance.button.style.background = '#2563eb';
          buttonInstance.button.innerHTML = `
            <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
              <path d="M16 2L20 12H28L22 18L24 28L16 22L8 28L10 18L4 12H12L16 2Z" />
            </svg>
          `;
        }
      }, 2000);

    } catch (error) {
      console.error('[LinguaSpark] Content extraction failed:', error);
      
      // Show error state
      if (buttonInstance) {
        buttonInstance.button.style.background = '#dc2626';
        buttonInstance.button.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 9V13M12 17H12.01M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z"/>
          </svg>
        `;

        // Reset button after delay
        setTimeout(() => {
          buttonInstance.button.style.background = '#2563eb';
          buttonInstance.button.innerHTML = `
            <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
              <path d="M16 2L20 12H28L22 18L24 28L16 22L8 28L10 18L4 12H12L16 2Z" />
            </svg>
          `;
        }, 3000);
      }
    }
  }

  // Keyboard shortcut handler
  document.addEventListener('keydown', async (event) => {
    if (event.altKey && event.key.toLowerCase() === 'e') {
      event.preventDefault();
      if (buttonInstance) {
        try {
          await handleExtractClick();
        } catch (error) {
          console.error('[LinguaSpark] Keyboard shortcut error:', error);
        }
      }
    }
  });

  // Debug function - accessible from console
  window.linguaSparkDebug = {
    analyzeCurrentPage: () => {
      console.log('[LinguaSpark Debug] Running page analysis...');
      return analyzePageContent().then(result => {
        console.log('[LinguaSpark Debug] Analysis result:', result);
        return result;
      });
    },
    showButton: () => {
      console.log('[LinguaSpark Debug] Force showing button...');
      createFloatingButton();
    },
    hideButton: () => {
      console.log('[LinguaSpark Debug] Hiding button...');
      removeFloatingButton();
    },
    getContentInfo: () => {
      const content = extractCleanContent();
      console.log('[LinguaSpark Debug] Content info:', {
        wordCount: content.wordCount,
        title: document.title,
        url: window.location.href,
        contentType: determineContentType(),
        isExcluded: isExcludedSite()
      });
      return content;
    },
    testStorage: async () => {
      console.log('[LinguaSpark Debug] Testing storage operations...');
      
      // Test basic localStorage
      try {
        localStorage.setItem('test_basic', 'hello');
        const basic = localStorage.getItem('test_basic');
        console.log('[LinguaSpark Debug] ✅ Basic localStorage works:', basic);
        localStorage.removeItem('test_basic');
      } catch (error) {
        console.error('[LinguaSpark Debug] ❌ Basic localStorage failed:', error);
        return false;
      }
      
      // Test the actual storage function
      const testData = {
        lessonConfiguration: {
          sourceContent: 'Test content for debugging',
          suggestedType: 'discussion',
          suggestedLevel: 'B1',
          metadata: {
            title: 'Test Title',
            sourceUrl: window.location.href,
            domain: window.location.hostname
          }
        },
        extractionSource: 'webpage',
        extractionTimestamp: Date.now()
      };
      
      try {
        console.log('[LinguaSpark Debug] Testing safeStorageSet...');
        const result = await safeStorageSet(testData);
        console.log('[LinguaSpark Debug] ✅ safeStorageSet result:', result);
        
        // Verify
        const verification = localStorage.getItem('linguaspark_lesson_config');
        if (verification) {
          const parsed = JSON.parse(verification);
          console.log('[LinguaSpark Debug] ✅ Verification success:', Object.keys(parsed));
          return true;
        } else {
          console.error('[LinguaSpark Debug] ❌ Verification failed - no data found');
          return false;
        }
      } catch (error) {
        console.error('[LinguaSpark Debug] ❌ Storage test failed:', error);
        return false;
      }
    },
    simulateClick: async () => {
      console.log('[LinguaSpark Debug] Simulating Sparky click...');
      if (buttonInstance) {
        await handleExtractClick();
      } else {
        console.warn('[LinguaSpark Debug] No button instance found');
      }
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtractButton);
  } else {
    // DOM is already ready
    setTimeout(initializeExtractButton, 1000); // Give page more time to load
  }

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    if (buttonInstance) {
      removeFloatingButton();
    }
  });

  // Listen for messages from background script with context validation
  if (isExtensionContextValid()) {
    try {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "getSelectedText") {
          const selectedText = window.getSelection().toString()
          sendResponse({ selectedText: selectedText })
        }

        if (request.action === "getPageContent") {
          const pageContent = extractCleanContent()
          sendResponse({ content: pageContent })
        }

        if (request.action === "getEnhancedPageContent") {
          // Enhanced extraction with validation and lesson suggestions
          try {
            const enhancedContent = extractEnhancedContent()
            sendResponse({ success: true, content: enhancedContent })
          } catch (error) {
            sendResponse({ 
              success: false, 
              error: error.message || 'Enhanced extraction failed' 
            })
          }
        }
      });
    } catch (error) {
      console.warn('[LinguaSpark] Failed to set up message listener:', error.message);
    }
  } else {
    console.warn('[LinguaSpark] Extension context invalid - message listener not set up');
  }

  // Alternative extraction method for large content
  function extractLargeContent() {
    console.log('[DEBUG] Starting alternative large content extraction');
    
    let bestContent = '';
    let maxLength = 0;
    
    // Strategy 1: Try specific content selectors
    const contentSelectors = [
      'main', 'article', '.post-content', '.entry-content', '.article-content',
      '.content-body', '.post-body', '.article-body', '.main-content',
      '#content', '.content', 'section', '.text-content', '.story-body',
      '.article-text', '.post-text', '[data-component="text-block"]'
    ];
    
    for (const selector of contentSelectors) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent || element.innerText || '';
          console.log(`[DEBUG] ${selector} content length:`, text.length);
          if (text.length > maxLength && text.length > 200) {
            maxLength = text.length;
            bestContent = text;
          }
        }
      } catch (error) {
        console.warn(`[DEBUG] Error with selector ${selector}:`, error);
      }
    }
    
    // Strategy 2: If no good content, try all paragraphs
    if (bestContent.length < 500) {
      console.log('[DEBUG] Trying paragraph-by-paragraph extraction');
      const paragraphs = document.querySelectorAll('p');
      let combinedText = '';
      
      paragraphs.forEach((p, index) => {
        try {
          const text = p.textContent || p.innerText || '';
          if (text.trim().length > 30) { // Only substantial paragraphs
            combinedText += text.trim() + '\n\n';
          }
        } catch (error) {
          console.warn(`[DEBUG] Error extracting paragraph ${index}:`, error);
        }
      });
      
      if (combinedText.length > bestContent.length) {
        bestContent = combinedText;
        console.log('[DEBUG] Paragraph extraction yielded more content:', combinedText.length);
      }
    }
    
    // Strategy 3: If still no content, try div elements with text
    if (bestContent.length < 500) {
      console.log('[DEBUG] Trying div text extraction');
      const divs = document.querySelectorAll('div');
      let combinedText = '';
      
      divs.forEach((div, index) => {
        try {
          // Skip divs that are likely navigation or ads
          const className = div.className || '';
          const id = div.id || '';
          if (className.includes('nav') || className.includes('menu') || 
              className.includes('ad') || className.includes('sidebar') ||
              id.includes('nav') || id.includes('menu')) {
            return;
          }
          
          const text = div.textContent || div.innerText || '';
          if (text.trim().length > 100 && text.trim().length < 2000) { // Reasonable paragraph size
            combinedText += text.trim() + '\n\n';
          }
        } catch (error) {
          console.warn(`[DEBUG] Error extracting div ${index}:`, error);
        }
      });
      
      if (combinedText.length > bestContent.length) {
        bestContent = combinedText;
        console.log('[DEBUG] Div extraction yielded more content:', combinedText.length);
      }
    }
    
    console.log('[DEBUG] Alternative extraction final length:', bestContent.length);
    return bestContent;
  }

  // Function to extract clean content from page with enhanced context
  function extractCleanContent() {
    // Debug: Check raw content length
    console.log('[DEBUG] Raw document.body.innerText length:', document.body.innerText?.length);
    console.log('[DEBUG] Raw document.body.textContent length:', document.body.textContent?.length);
    
    // First, try to get content directly from body without cloning (more reliable)
    let text = '';
    
    // Try multiple extraction strategies - prioritize article content over full page
    const strategies = [
      // Strategy 1: Site-specific article content
      () => {
        // BBC-specific extraction
        if (window.location.hostname.includes('bbc.com')) {
          const selectors = [
            '[data-component="text-block"]',
            '.ssrcss-1q0x1qg-Paragraph',
            '.ssrcss-uf6wea-RichTextComponentWrapper',
            'article [data-component="text-block"] p',
            'main article p'
          ];
          
          let articleText = '';
          for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              elements.forEach(el => {
                const text = el.innerText || el.textContent || '';
                if (text.trim().length > 20) {
                  articleText += text.trim() + '\n\n';
                }
              });
              if (articleText.length > 500) {
                console.log(`[DEBUG] Strategy 1 - BBC article content (${selector}):`, articleText.length);
                return articleText;
              }
            }
          }
        }
        
        // Wikipedia-specific extraction
        if (window.location.hostname.includes('wikipedia.org')) {
          const contentDiv = document.querySelector('#mw-content-text .mw-parser-output');
          if (contentDiv) {
            const clonedContent = contentDiv.cloneNode(true);
            
            // Remove unwanted Wikipedia sections
            const unwantedSections = [
              // Navigation and metadata
              '.navbox', '.infobox', '.metadata', '.ambox', '.tmbox', '.ombox',
              '.navbox-wrapper', '.navbox-inner', '.navbox-group',
              
              // References and external links
              '.reflist', '.references', '#References', '#External_links', '#See_also',
              '#Further_reading', '#Bibliography', '#Notes', '#Citations',
              
              // Find sections by heading text
              'h2:has(#References)', 'h2:has(#External_links)', 'h2:has(#See_also)',
              'h2:has(#Further_reading)', 'h2:has(#Bibliography)', 'h2:has(#Notes)',
              
              // Other unwanted elements
              '.hatnote', '.dablink', '.rellink', '.boilerplate',
              '.sistersitebox', '.succession-box', '.geographic-box',
              '.thumb', '.thumbinner', '.thumbcaption', // Images (keep text only)
              'table', '.wikitable', '.sortable', // Tables
              '.gallery', '.commons-file-link'
            ];
            
            // Remove unwanted sections
            unwantedSections.forEach(selector => {
              const elements = clonedContent.querySelectorAll(selector);
              elements.forEach(el => el.remove());
            });
            
            // Remove sections after "References" heading
            const headings = clonedContent.querySelectorAll('h2, h3');
            let removeFromHere = false;
            headings.forEach(heading => {
              const headingText = heading.textContent.toLowerCase();
              if (headingText.includes('references') || 
                  headingText.includes('external links') || 
                  headingText.includes('see also') ||
                  headingText.includes('further reading') ||
                  headingText.includes('bibliography') ||
                  headingText.includes('notes')) {
                removeFromHere = true;
              }
              
              if (removeFromHere) {
                // Remove this heading and all following siblings
                let nextElement = heading;
                while (nextElement) {
                  const toRemove = nextElement;
                  nextElement = nextElement.nextElementSibling;
                  toRemove.remove();
                }
              }
            });
            
            // Extract clean text from paragraphs only
            const paragraphs = clonedContent.querySelectorAll('p');
            let articleText = '';
            paragraphs.forEach(p => {
              const text = p.innerText || p.textContent || '';
              if (text.trim().length > 20) {
                articleText += text.trim() + '\n\n';
              }
            });
            
            if (articleText.length > 500) {
              console.log('[DEBUG] Strategy 1 - Wikipedia article content:', articleText.length);
              return articleText;
            }
          }
        }
        
        return '';
      },
      
      // Strategy 2: Main content selectors (prioritized)
      () => {
        const contentSelectors = [
          'article', 'main article', '[role="main"]',
          '.post-content', '.entry-content', '.article-content',
          '.content-body', '.post-body', '.article-body', '.main-content',
          'main', '#content', '.content'
        ];
        
        for (const selector of contentSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            // Remove unwanted sections from the element
            const clonedElement = element.cloneNode(true);
            
            // Remove navigation, footer, sidebar, ads, related content
            const unwantedSelectors = [
              'nav', 'footer', 'aside', '.sidebar', '.related', '.comments',
              '.advertisement', '.ad', '.social', '.share', '.tags',
              '.author-bio', '.next-article', '.prev-article', '.pagination',
              '[class*="related"]', '[class*="recommend"]', '[class*="more"]',
              '[class*="footer"]', '[class*="nav"]', '[class*="sidebar"]'
            ];
            
            unwantedSelectors.forEach(unwantedSelector => {
              const unwantedElements = clonedElement.querySelectorAll(unwantedSelector);
              unwantedElements.forEach(el => el.remove());
            });
            
            const elementText = clonedElement.innerText || clonedElement.textContent || '';
            console.log(`[DEBUG] Strategy 2 - ${selector} (cleaned) length:`, elementText.length);
            if (elementText.length > 500) { // Only use if substantial content
              return elementText;
            }
          }
        }
        return '';
      },
      
      // Strategy 3: Smart paragraph aggregation (exclude footer/nav content)
      () => {
        const paragraphs = document.querySelectorAll('p');
        let combinedText = '';
        
        paragraphs.forEach(p => {
          // Skip paragraphs in unwanted sections
          const parentElement = p.closest('nav, footer, aside, .sidebar, .related, .comments, .advertisement, .ad');
          if (parentElement) return;
          
          const pText = p.innerText || p.textContent || '';
          if (pText.trim().length > 20) { // Only substantial paragraphs
            combinedText += pText.trim() + '\n\n';
          }
        });
        console.log('[DEBUG] Strategy 3 - Smart paragraph aggregation length:', combinedText.length);
        return combinedText;
      },
      
      // Strategy 4: Fallback to body text (last resort)
      () => {
        const bodyText = document.body.innerText || document.body.textContent || '';
        console.log('[DEBUG] Strategy 4 - Direct body text length:', bodyText.length);
        return bodyText;
      }
    ];
    
    // Try each strategy until we get good content
    for (let i = 0; i < strategies.length; i++) {
      try {
        const strategyText = strategies[i]();
        if (strategyText && strategyText.length > 200) {
          text = strategyText;
          console.log(`[DEBUG] Using strategy ${i + 1} with ${text.length} characters`);
          break;
        }
      } catch (error) {
        console.warn(`[DEBUG] Strategy ${i + 1} failed:`, error);
      }
    }
    
    // If still no good content, try the alternative method
    if (text.length < 200) {
      console.log('[DEBUG] All strategies failed, trying alternative extraction');
      text = extractLargeContent();
    }

    // Clean up whitespace and formatting
    if (text) {
      text = text
        .replace(/\s+/g, " ")
        .replace(/\n\s*\n/g, "\n")
        .replace(/^\s+|\s+$/gm, "")
        .trim();
    }

    console.log('[DEBUG] Final extracted text length:', text.length);

    // Extract metadata for context
    const metadata = extractContentMetadata(document);

    return {
      text: text,
      structuredContent: {},
      metadata: metadata,
      wordCount: text ? text.split(/\s+/).length : 0,
      readingTime: text ? Math.ceil(text.split(/\s+/).length / 200) : 0,
    }
  }

  // Extract content metadata for better context
  function extractContentMetadata(doc) {
    const metadata = {
      title: "",
      description: "",
      author: "",
      publishDate: "",
      contentType: "",
      domain: "",
      language: "",
      keywords: [],
      sourceUrl: window.location.href
    }

    try {
      // Extract title
      metadata.title = 
        doc.querySelector('meta[property="og:title"]')?.content ||
        doc.querySelector('meta[name="twitter:title"]')?.content ||
        doc.querySelector("title")?.textContent ||
        doc.querySelector("h1")?.textContent ||
        document.title ||
        ""

      // Extract description
      metadata.description = 
        doc.querySelector('meta[property="og:description"]')?.content ||
        doc.querySelector('meta[name="description"]')?.content ||
        doc.querySelector('meta[name="twitter:description"]')?.content ||
        ""

      // Extract author
      metadata.author = 
        doc.querySelector('meta[name="author"]')?.content ||
        doc.querySelector('[rel="author"]')?.textContent ||
        doc.querySelector('.author')?.textContent ||
        doc.querySelector('.byline')?.textContent ||
        ""

      // Extract publish date
      const dateElement = 
        doc.querySelector('meta[property="article:published_time"]')?.content ||
        doc.querySelector('meta[name="date"]')?.content ||
        doc.querySelector('time[datetime]')?.getAttribute('datetime') ||
        doc.querySelector('.date')?.textContent ||
        ""
      metadata.publishDate = dateElement

      // Determine content type based on URL and structure
      const url = window.location.href.toLowerCase()
      const hostname = window.location.hostname.toLowerCase()
      
      if (hostname.includes('bbc') || hostname.includes('cnn') || hostname.includes('reuters') || url.includes('/news/')) {
        metadata.contentType = 'news'
      } else if (url.includes('/blog/') || url.includes('/article/') || url.includes('/post/')) {
        metadata.contentType = 'blog'
      } else if (url.includes('/wiki/') || hostname.includes('wikipedia')) {
        metadata.contentType = 'encyclopedia'
      } else if (url.includes('/tutorial/') || url.includes('/guide/')) {
        metadata.contentType = 'tutorial'
      } else if (url.includes('/product/') || url.includes('/shop/')) {
        metadata.contentType = 'product'
      } else {
        metadata.contentType = 'general'
      }

      // Extract domain
      metadata.domain = window.location.hostname

      // Extract language
      metadata.language = 
        doc.documentElement?.lang ||
        doc.querySelector('meta[http-equiv="content-language"]')?.content ||
        document.documentElement?.lang ||
        'en'

      // Extract keywords
      const keywordsContent = doc.querySelector('meta[name="keywords"]')?.content;
      if (keywordsContent) {
        metadata.keywords = keywordsContent.split(',').map(k => k.trim()).slice(0, 10);
      }

    } catch (error) {
      console.warn('[DEBUG] Error extracting metadata:', error);
    }

    return metadata;
  }

  // Extract structured content elements
  function extractStructuredContent(element) {
    const structured = {
      headings: [],
      paragraphs: [],
      lists: [],
      quotes: [],
      images: [],
      links: [],
    }

    // Extract headings with hierarchy
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6')
    headings.forEach(heading => {
      structured.headings.push({
        level: parseInt(heading.tagName.charAt(1)),
        text: heading.textContent.trim(),
      })
    })

    // Extract meaningful paragraphs (filter out short ones)
    const paragraphs = element.querySelectorAll('p')
    paragraphs.forEach(p => {
      const text = p.textContent.trim()
      if (text.length > 50) { // Only include substantial paragraphs
        structured.paragraphs.push(text)
      }
    })

    // Extract lists
    const lists = element.querySelectorAll('ul, ol')
    lists.forEach(list => {
      const items = Array.from(list.querySelectorAll('li')).map(li => li.textContent.trim())
      if (items.length > 0) {
        structured.lists.push({
          type: list.tagName.toLowerCase(),
          items: items,
        })
      }
    })

    // Extract quotes
    const quotes = element.querySelectorAll('blockquote, q')
    quotes.forEach(quote => {
      const text = quote.textContent.trim()
      if (text.length > 20) {
        structured.quotes.push(text)
      }
    })

    // Extract images with alt text
    const images = element.querySelectorAll('img[alt]')
    images.forEach(img => {
      if (img.alt && img.alt.trim()) {
        structured.images.push({
          alt: img.alt.trim(),
          src: img.src,
        })
      }
    })

    // Extract meaningful links
    const links = element.querySelectorAll('a[href]')
    links.forEach(link => {
      const text = link.textContent.trim()
      const href = link.href
      if (text.length > 3 && href && !href.startsWith('javascript:')) {
        structured.links.push({
          text: text,
          url: href,
        })
      }
    })

    return structured
  }

  // Enhanced content extraction with validation and lesson suggestions
  function extractEnhancedContent() {
    console.log('[LinguaSpark] extractEnhancedContent: Starting...');
    
    const basicContent = extractCleanContent()
    console.log('[LinguaSpark] extractEnhancedContent: Basic content extracted', {
      textLength: basicContent.text?.length || 0,
      wordCount: basicContent.wordCount || 0,
      title: basicContent.metadata?.title
    });
    console.log('[DEBUG] Basic content text length:', basicContent.text?.length);
    
    // Analyze content for lesson type suggestion
    const lessonType = suggestLessonType(basicContent.text, basicContent.metadata)
    console.log('[LinguaSpark] extractEnhancedContent: Suggested lesson type:', lessonType);
    
    // Analyze content complexity for CEFR level suggestion
    const cefrLevel = suggestCEFRLevel(basicContent.text)
    console.log('[LinguaSpark] extractEnhancedContent: Suggested CEFR level:', cefrLevel);
    
    // Validate content quality
    const validation = validateContentQuality(basicContent.text, basicContent.structuredContent)
    console.log('[LinguaSpark] extractEnhancedContent: Validation result:', validation);
    
    const result = {
      ...basicContent,
      suggestedLessonType: lessonType,
      suggestedCEFRLevel: cefrLevel,
      validation: validation,
      enhanced: true
    };
    
    console.log('[LinguaSpark] extractEnhancedContent: Complete result:', {
      textLength: result.text?.length || 0,
      wordCount: result.wordCount || 0,
      lessonType: result.suggestedLessonType,
      cefrLevel: result.suggestedCEFRLevel,
      isValid: result.validation?.isValid
    });
    
    return result;
  }

  // Suggest lesson type based on content analysis
  function suggestLessonType(text, metadata) {
    if (!text || text.length < 50) return 'discussion';
    
    const textLower = text.toLowerCase();
    const titleLower = (metadata?.title || '').toLowerCase();
    
    // Business content indicators
    const businessKeywords = ['business', 'company', 'corporate', 'management', 'marketing', 'sales', 'finance', 'economy', 'industry', 'professional'];
    if (businessKeywords.some(keyword => textLower.includes(keyword) || titleLower.includes(keyword))) {
      return 'business';
    }
    
    // Travel content indicators
    const travelKeywords = ['travel', 'tourism', 'vacation', 'hotel', 'flight', 'destination', 'culture', 'country', 'city', 'visit'];
    if (travelKeywords.some(keyword => textLower.includes(keyword) || titleLower.includes(keyword))) {
      return 'travel';
    }
    
    // Grammar content indicators
    const grammarKeywords = ['grammar', 'verb', 'noun', 'adjective', 'sentence', 'tense', 'plural', 'singular', 'conjugation'];
    if (grammarKeywords.some(keyword => textLower.includes(keyword) || titleLower.includes(keyword))) {
      return 'grammar';
    }
    
    // Pronunciation content indicators
    const pronunciationKeywords = ['pronunciation', 'phonetic', 'sound', 'accent', 'speaking', 'voice', 'intonation'];
    if (pronunciationKeywords.some(keyword => textLower.includes(keyword) || titleLower.includes(keyword))) {
      return 'pronunciation';
    }
    
    // Default to discussion for general content
    return 'discussion';
  }

  // Suggest CEFR level based on content complexity
  function suggestCEFRLevel(text) {
    if (!text || text.length < 50) return 'B1';
    
    const words = text.split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = words.length / sentences.length;
    
    // Simple heuristics for CEFR level
    if (words.length < 200 && avgWordsPerSentence < 10) {
      return 'A1';
    } else if (words.length < 400 && avgWordsPerSentence < 15) {
      return 'A2';
    } else if (words.length < 800 && avgWordsPerSentence < 20) {
      return 'B1';
    } else if (words.length < 1200 && avgWordsPerSentence < 25) {
      return 'B2';
    } else {
      return 'C1';
    }
  }

  // Validate content quality for lesson generation
  function validateContentQuality(text, structuredContent) {
    const issues = [];
    const warnings = [];
    const recommendations = [];
    
    if (!text || text.trim().length === 0) {
      issues.push({ severity: 'error', message: 'No content extracted' });
      return { isValid: false, meetsMinimumQuality: false, issues, warnings, recommendations };
    }
    
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Minimum content requirements
    if (words.length < 50) {
      issues.push({ severity: 'error', message: 'Content too short (minimum 50 words required)' });
    } else if (words.length < 100) {
      warnings.push({ severity: 'warning', message: 'Content is quite short, consider adding more context' });
    }
    
    if (sentences.length < 3) {
      issues.push({ severity: 'error', message: 'Content needs at least 3 sentences for effective lesson generation' });
    }
    
    // Content quality checks
    const avgWordsPerSentence = words.length / sentences.length;
    if (avgWordsPerSentence < 3) {
      warnings.push({ severity: 'warning', message: 'Sentences are very short, may limit lesson complexity' });
    } else if (avgWordsPerSentence > 30) {
      warnings.push({ severity: 'warning', message: 'Sentences are very long, may be difficult for language learners' });
    }
    
    // Recommendations
    if (structuredContent.headings.length === 0) {
      recommendations.push('Content with headings typically creates better structured lessons');
    }
    
    if (structuredContent.lists.length === 0 && structuredContent.quotes.length === 0) {
      recommendations.push('Content with lists or quotes can enhance lesson engagement');
    }
    
    const isValid = issues.filter(issue => issue.severity === 'error').length === 0;
    const meetsMinimumQuality = isValid && words.length >= 100 && sentences.length >= 3;
    
    return {
      isValid,
      meetsMinimumQuality,
      issues,
      warnings,
      recommendations
    };
  }

  // Helper function to count keyword matches
  function countKeywordMatches(text, keywords) {
    return keywords.reduce((count, keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);
  }

  // Suggest lesson type based on content analysis
  function suggestLessonType(text, metadata) {
    const content = (text + ' ' + metadata.title + ' ' + metadata.description).toLowerCase()
    
    // Business keywords
    const businessKeywords = ['business', 'company', 'corporate', 'management', 'marketing', 'sales', 'finance', 'revenue', 'profit', 'strategy']
    const businessScore = countKeywordMatches(content, businessKeywords)
    
    // Travel keywords
    const travelKeywords = ['travel', 'trip', 'vacation', 'hotel', 'flight', 'tourist', 'destination', 'culture', 'country', 'visit']
    const travelScore = countKeywordMatches(content, travelKeywords)
    
    // Grammar keywords
    const grammarKeywords = ['grammar', 'verb', 'noun', 'tense', 'sentence', 'language', 'conjugation', 'syntax']
    const grammarScore = countKeywordMatches(content, grammarKeywords)
    
    // Determine highest scoring category
    if (businessScore > travelScore && businessScore > grammarScore && businessScore > 0) {
      return 'business'
    }
    if (travelScore > grammarScore && travelScore > 0) {
      return 'travel'
    }
    if (grammarScore > 0) {
      return 'grammar'
    }
    
    return 'discussion' // Default
  }

  // Suggest CEFR level based on content complexity
  function suggestCEFRLevel(text) {
    const words = text.split(/\s+/).filter(word => word.length > 0)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    
    if (words.length === 0 || sentences.length === 0) return 'A1'
    
    const avgWordsPerSentence = words.length / sentences.length
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length
    
    // Simple complexity scoring
    let complexityScore = 0
    
    // Sentence length factor
    if (avgWordsPerSentence > 20) complexityScore += 2
    else if (avgWordsPerSentence > 15) complexityScore += 1
    
    // Word length factor
    if (avgWordLength > 6) complexityScore += 2
    else if (avgWordLength > 5) complexityScore += 1
    
    // Complex vocabulary detection
    const complexWords = words.filter(word => word.length > 8).length
    const complexWordRatio = complexWords / words.length
    if (complexWordRatio > 0.2) complexityScore += 2
    else if (complexWordRatio > 0.1) complexityScore += 1
    
    // Map to CEFR levels
    if (complexityScore >= 5) return 'C1'
    if (complexityScore >= 4) return 'B2'
    if (complexityScore >= 2) return 'B1'
    if (complexityScore >= 1) return 'A2'
    return 'A1'
  }

  // Validate content quality
  function validateContentQuality(text, structuredContent) {
    const words = text.split(/\s+/).filter(word => word.length > 0)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    
    const issues = []
    const warnings = []
    const recommendations = []
    
    // Check minimum word count
    if (words.length < 100) {
      issues.push({
        type: 'insufficient_content',
        message: `Content too short: ${words.length} words (minimum 100 required)`,
        severity: 'error',
        suggestedAction: 'Select more content or choose a longer article'
      })
    }
    
    // Check sentence count
    if (sentences.length < 3) {
      issues.push({
        type: 'poor_quality',
        message: `Too few sentences: ${sentences.length} (minimum 3 required)`,
        severity: 'error',
        suggestedAction: 'Choose content with more complete sentences'
      })
    }
    
    // Warnings for borderline content
    if (words.length < 200) {
      warnings.push('Content is quite short - consider selecting more text for better lesson quality')
    }
    
    // Recommendations
    if (structuredContent.headings.length === 0) {
      recommendations.push('Content with headings typically creates better structured lessons')
    }
    
    if (structuredContent.lists.length === 0 && structuredContent.quotes.length === 0) {
      recommendations.push('Content with lists or quotes can enhance lesson engagement')
    }
    
    const isValid = issues.filter(issue => issue.severity === 'error').length === 0
    const meetsMinimumQuality = isValid && words.length >= 100 && sentences.length >= 3
    
    return {
      isValid,
      meetsMinimumQuality,
      issues,
      warnings,
      recommendations
    }
  }

  // Helper function to count keyword matches
  function countKeywordMatches(text, keywords) {
    return keywords.reduce((count, keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
      const matches = text.match(regex)
      return count + (matches ? matches.length : 0)
    }, 0)
  }

  // Determine content complexity based on word count and other factors
  function determineComplexity(wordCount) {
    if (wordCount < 200) return 'beginner';
    if (wordCount < 500) return 'intermediate';
    return 'advanced';
  }

  // Determine appropriate lesson type based on content and URL
  function determineLessonType(text, url) {
    const urlLower = url.toLowerCase();
    const textLower = text.toLowerCase();
    
    // Check URL patterns first
    if (urlLower.includes('business') || urlLower.includes('finance') || urlLower.includes('economy')) {
      return 'business';
    }
    if (urlLower.includes('travel') || urlLower.includes('tourism') || urlLower.includes('destination')) {
      return 'travel';
    }
    
    // Check content patterns
    if (textLower.includes('pronunciation') || textLower.includes('phonetic') || textLower.includes('accent')) {
      return 'pronunciation';
    }
    if (textLower.includes('grammar') || textLower.includes('syntax') || textLower.includes('tense')) {
      return 'grammar';
    }
    
    // Default to discussion for most content
    return 'discussion';
  }

  // Determine CEFR level based on word count and complexity
  function determineCEFRLevel(wordCount) {
    if (wordCount < 200) return 'A1';
    if (wordCount < 400) return 'A2';
    if (wordCount < 800) return 'B1';
    if (wordCount < 1200) return 'B2';
    return 'C1';
  }

  // Add visual indicator when text is selected
  document.addEventListener("mouseup", () => {
    const selection = window.getSelection();
    if (selection.toString().length > 10) {
      // Store selection for context menu using safe storage
      safeStorageSet({
        selectedText: selection.toString(),
        sourceUrl: window.location.href,
      }).catch(error => {
        console.warn('[LinguaSpark] Failed to store selected text:', error);
      });
    }
  });

})();
