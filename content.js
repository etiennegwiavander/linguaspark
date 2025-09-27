// Content script for webpage interaction
;(() => {
  // Declare chrome variable
  const chrome = window.chrome

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getSelectedText") {
      const selectedText = window.getSelection().toString()
      sendResponse({ selectedText: selectedText })
    }

    if (request.action === "getPageContent") {
      const pageContent = extractCleanContent()
      sendResponse({ content: pageContent })
    }
  })

  // Function to extract clean content from page
  function extractCleanContent() {
    // Clone the document to avoid modifying the original
    const clone = document.cloneNode(true)

    // Remove unwanted elements
    const unwantedSelectors = [
      "script",
      "style",
      "nav",
      "header",
      "footer",
      ".advertisement",
      ".ads",
      ".sidebar",
      ".menu",
      '[role="navigation"]',
      '[role="banner"]',
      '[role="contentinfo"]',
    ]

    unwantedSelectors.forEach((selector) => {
      const elements = clone.querySelectorAll(selector)
      elements.forEach((el) => el.remove())
    })

    // Get main content area
    const mainContent =
      clone.querySelector("main") ||
      clone.querySelector("article") ||
      clone.querySelector(".content") ||
      clone.querySelector("#content") ||
      clone.body

    if (!mainContent) return ""

    // Extract and clean text
    let text = mainContent.innerText || mainContent.textContent || ""

    // Clean up whitespace and formatting
    text = text
      .replace(/\s+/g, " ")
      .replace(/\n\s*\n/g, "\n")
      .trim()

    return text
  }

  // Add visual indicator when text is selected
  document.addEventListener("mouseup", () => {
    const selection = window.getSelection()
    if (selection.toString().length > 10) {
      // Store selection for context menu
      chrome.storage.local.set({
        selectedText: selection.toString(),
        sourceUrl: window.location.href,
      })
    }
  })
})()
