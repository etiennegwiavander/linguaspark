// LinguaSpark Chrome Extension Background Script
// Handles extension lifecycle and communication between content scripts and popup

chrome.runtime.onInstalled.addListener(() => {
  console.log('LinguaSpark extension installed');
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[LinguaSpark Background] Received message:', request.action);
  
  if (request.action === 'openLessonInterface') {
    // Get content from Chrome storage and pass it to popup via API
    chrome.storage.local.get(['lessonConfiguration', 'extractedContent', 'extractionSource', 'extractionTimestamp', 'sourceUrl', 'sourceTitle'], (result) => {
      if (result.lessonConfiguration) {
        // Generate unique session ID
        const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Store content in API for popup to retrieve
        fetch('http://localhost:3000/api/get-extracted-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'store',
            sessionId: sessionId,
            data: result
          })
        }).then(response => response.json()).then(apiResult => {
          if (apiResult.success) {
            // Build URL with metadata and session ID
            const encodedTitle = encodeURIComponent(result.lessonConfiguration.metadata.title || '');
            const encodedUrl = encodeURIComponent(result.lessonConfiguration.metadata.sourceUrl || '');
            
            let url = `http://localhost:3000/popup?source=extraction&autoPopulate=true&sessionId=${sessionId}`;
            url += `&title=${encodedTitle}&sourceUrl=${encodedUrl}&type=${result.lessonConfiguration.suggestedType}&level=${result.lessonConfiguration.suggestedLevel}`;
            
            console.log('[LinguaSpark Background] Content stored in API for session:', sessionId);
            console.log('[LinguaSpark Background] Content length:', result.lessonConfiguration.sourceContent.length, 'characters');
            console.log('[LinguaSpark Background] 📸 Banner image:', result.lessonConfiguration.metadata.bannerImage || 'None');
            console.log('[LinguaSpark Background] 🖼️ Images count:', result.lessonConfiguration.metadata.images?.length || 0);
            
            chrome.tabs.create({ url }).then((tab) => {
              console.log('[LinguaSpark Background] Opened lesson interface tab:', tab.id);
              sendResponse({ success: true, tabId: tab.id });
            }).catch((error) => {
              console.error('[LinguaSpark Background] Failed to open tab:', error);
              sendResponse({ success: false, error: error.message });
            });
          } else {
            console.error('[LinguaSpark Background] Failed to store content in API:', apiResult.error);
            sendResponse({ success: false, error: 'Failed to store content' });
          }
        }).catch((error) => {
          console.error('[LinguaSpark Background] API request failed:', error);
          sendResponse({ success: false, error: 'API request failed' });
        });
      } else {
        console.error('[LinguaSpark Background] No lesson configuration found in storage');
        sendResponse({ success: false, error: 'No content found' });
      }
    });
    
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'storeExtractedContent') {
    // Store extracted content for the lesson interface
    chrome.storage.local.set({
      extractedContent: request.content,
      extractionSource: 'webpage',
      timestamp: Date.now()
    }).then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message channel open for async response
  }
  
  return false;
});