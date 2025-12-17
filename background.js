// LinguaSpark Chrome Extension Background Script
// Handles extension lifecycle and communication between content scripts and popup

chrome.runtime.onInstalled.addListener(() => {
  console.log('LinguaSpark extension installed');
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[LinguaSpark Background] Received message:', request.action);
  
  if (request.action === 'openLessonInterface') {
    // This action is now handled directly by content script
    // Background script is no longer needed for this flow
    console.log('[LinguaSpark Background] openLessonInterface action received (legacy)');
    sendResponse({ success: true, message: 'Handled by content script directly' });
    return true;
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