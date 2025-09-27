// Background script for Chrome extension
const chrome = window.chrome // Declare the chrome variable

chrome.runtime.onInstalled.addListener(() => {
  // Create context menu for selected text
  chrome.contextMenus.create({
    id: "generateLesson",
    title: "Generate Lesson from Selection",
    contexts: ["selection"],
  })
})

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "generateLesson") {
    // Send selected text to popup
    chrome.storage.local.set({
      selectedText: info.selectionText,
      sourceUrl: tab.url,
    })

    // Open popup
    chrome.action.openPopup()
  }
})

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractPageText") {
    // Inject content script to extract page text
    chrome.scripting.executeScript(
      {
        target: { tabId: sender.tab.id },
        function: extractPageContent,
      },
      (results) => {
        sendResponse({ content: results[0].result })
      },
    )
    return true // Keep message channel open for async response
  }

  if (request.action === "generateLesson") {
    // Forward lesson generation request to popup
    chrome.runtime.sendMessage({
      action: "processLessonGeneration",
      data: request.data,
    })
  }
})

// Function to be injected for page content extraction
function extractPageContent() {
  // Remove script and style elements
  const scripts = document.querySelectorAll("script, style, nav, header, footer")
  scripts.forEach((el) => el.remove())

  // Get main content
  const mainContent =
    document.querySelector("main") ||
    document.querySelector("article") ||
    document.querySelector(".content") ||
    document.body

  // Extract text content
  const textContent = mainContent.innerText || mainContent.textContent || ""

  // Clean up whitespace
  return textContent.replace(/\s+/g, " ").trim()
}
