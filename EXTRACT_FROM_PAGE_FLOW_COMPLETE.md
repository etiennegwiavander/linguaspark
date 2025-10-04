# Extract from Page Flow - Complete Step by Step

## **When "Extract from Page" Button is Clicked**

### **🖱️ FRONTEND PHASE (Chrome Extension Popup)**

#### **Step 1: Button Click Handler**
```typescript
// Location: app/popup/page.tsx - handleExtractFromPage()
const handleExtractFromPage = () => {
  if (typeof window !== "undefined" && window.chrome?.tabs) {
    // Proceed with Chrome extension API calls
  }
}
```

#### **Step 2: Get Active Tab Information**
```typescript
// Query for the currently active tab in the current window
window.chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
  if (tabs[0]?.id) {
    // Found active tab, proceed with content extraction
  }
})
```

#### **Step 3: Send Message to Content Script**
```typescript
// Send message to content script running on the active webpage
window.chrome.tabs.sendMessage(tabs[0].id, { action: "getPageContent" }, (response: any) => {
  // Handle response from content script
})
```

---

### **🌐 CONTENT SCRIPT PHASE (content.js - Running on Webpage)**

#### **Step 4: Message Reception**
```javascript
// Location: content.js - Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageContent") {
    const pageContent = extractCleanContent()
    sendResponse({ content: pageContent })
  }
})
```

#### **Step 5: Content Extraction Process**
```javascript
function extractCleanContent() {
  // Clone document to avoid modifying original
  const clone = document.cloneNode(true)
  
  // Remove unwanted elements
  const unwantedSelectors = [
    "script", "style", "nav", "header", "footer", 
    ".advertisement", ".ads", ".sidebar", ".menu", 
    ".comments", ".social-share", ".related-articles"
  ]
  
  unwantedSelectors.forEach((selector) => {
    const elements = clone.querySelectorAll(selector)
    elements.forEach((el) => el.remove())
  })
}
```

#### **Step 6: Main Content Identification**
```javascript
// Priority-based content area detection
const mainContent =
  clone.querySelector("main") ||           // HTML5 main element
  clone.querySelector("article") ||        // HTML5 article element
  clone.querySelector(".post-content") ||  // Common blog class
  clone.querySelector(".entry-content") || // WordPress standard
  clone.querySelector(".content") ||       // Generic content class
  clone.querySelector("#content") ||       // Generic content ID
  clone.querySelector(".article-body") ||  // News article class
  clone.body                               // Fallback to body
```

#### **Step 7: Metadata Extraction**
```javascript
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
  }

  // Extract title from multiple sources
  metadata.title = 
    doc.querySelector('meta[property="og:title"]')?.content ||
    doc.querySelector('meta[name="twitter:title"]')?.content ||
    doc.querySelector("title")?.textContent ||
    doc.querySelector("h1")?.textContent ||
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
    ""

  // Extract publish date
  metadata.publishDate = 
    doc.querySelector('meta[property="article:published_time"]')?.content ||
    doc.querySelector('meta[name="date"]')?.content ||
    doc.querySelector('time[datetime]')?.getAttribute('datetime') ||
    doc.querySelector('.date')?.textContent ||
    ""

  // Determine content type based on URL patterns
  const url = window.location.href.toLowerCase()
  if (url.includes('/blog/') || url.includes('/article/')) {
    metadata.contentType = 'blog'
  } else if (url.includes('/news/')) {
    metadata.contentType = 'news'
  } else if (url.includes('/wiki/')) {
    metadata.contentType = 'encyclopedia'
  } else if (url.includes('/tutorial/')) {
    metadata.contentType = 'tutorial'
  } else {
    metadata.contentType = 'general'
  }

  // Extract domain and language
  metadata.domain = window.location.hostname
  metadata.language = doc.documentElement.lang || 'en'

  return metadata
}
```

#### **Step 8: Structured Content Extraction**
```javascript
function extractStructuredContent(element) {
  const structured = {
    headings: [],
    paragraphs: [],
    lists: [],
    quotes: [],
    images: [],
    links: [],
  }

  // Extract headings with hierarchy (H1-H6)
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
    if (text.length > 50) { // Only substantial paragraphs
      structured.paragraphs.push(text)
    }
  })

  // Extract lists (ordered and unordered)
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
```

#### **Step 9: Text Cleaning and Processing**
```javascript
// Extract and clean text content
let text = mainContent.innerText || mainContent.textContent || ""

// Clean up whitespace and formatting
text = text
  .replace(/\s+/g, " ")           // Replace multiple spaces with single space
  .replace(/\n\s*\n/g, "\n")      // Replace multiple newlines with single newline
  .replace(/^\s+|\s+$/gm, "")     // Trim whitespace from each line
  .trim()                         // Trim overall content

// Calculate reading metrics
const wordCount = text.split(/\s+/).length
const readingTime = Math.ceil(wordCount / 200) // Approximate reading time in minutes
```

#### **Step 10: Response Assembly**
```javascript
// Return comprehensive content object
return {
  text: text,                           // Clean text content
  structuredContent: structuredContent, // Structured elements
  metadata: metadata,                   // Page metadata
  wordCount: wordCount,                 // Word count
  readingTime: readingTime,            // Estimated reading time
}
```

---

### **🔄 RESPONSE HANDLING PHASE (Back to Chrome Extension Popup)**

#### **Step 11: Content Processing**
```typescript
// Location: app/popup/page.tsx - Response handler
window.chrome.tabs.sendMessage(tabs[0].id, { action: "getPageContent" }, (response: any) => {
  if (response && response.content) {
    // Handle enhanced content extraction
    if (typeof response.content === 'object') {
      // Process structured content object
      setSelectedText(response.content.text.substring(0, 2000))
      setSourceUrl(tabs[0].url)
      
      // Store enhanced content data for lesson generation
      window.chrome.storage.local.set({
        enhancedContent: response.content,
        sourceUrl: tabs[0].url,
      })
    } else {
      // Fallback for simple text content
      setSelectedText(response.content.substring(0, 2000))
      setSourceUrl(tabs[0].url)
    }
  }
})
```

#### **Step 12: Chrome Storage Update**
```typescript
// Store enhanced content in Chrome extension storage
window.chrome.storage.local.set({
  enhancedContent: {
    text: cleanedText,
    structuredContent: structuredElements,
    metadata: pageMetadata,
    wordCount: wordCount,
    readingTime: readingTime
  },
  sourceUrl: currentPageUrl,
})
```

#### **Step 13: UI State Update**
```typescript
// Update React component state
setSelectedText(response.content.text.substring(0, 2000)) // Truncate for display
setSourceUrl(tabs[0].url)                                 // Set source URL

// UI automatically updates to show:
// - Extracted text in the textarea
// - Source URL indicator
// - Character count
// - Ready state for lesson generation
```

---

### **📊 DATA FLOW SUMMARY**

#### **Input**: Active webpage content
#### **Processing**: 
1. **Content Cleaning**: Remove ads, navigation, scripts
2. **Structure Analysis**: Extract headings, paragraphs, lists
3. **Metadata Extraction**: Title, author, date, content type
4. **Text Processing**: Clean whitespace, calculate metrics

#### **Output**: Enhanced content object
```javascript
{
  text: "Clean, readable text content...",
  structuredContent: {
    headings: [{level: 1, text: "Main Title"}, ...],
    paragraphs: ["First paragraph...", "Second paragraph...", ...],
    lists: [{type: "ul", items: ["Item 1", "Item 2", ...]}, ...],
    quotes: ["Important quote...", ...],
    images: [{alt: "Image description", src: "image.jpg"}, ...],
    links: [{text: "Link text", url: "https://..."}, ...]
  },
  metadata: {
    title: "Page Title",
    description: "Page description",
    author: "Author Name",
    publishDate: "2025-01-01",
    contentType: "blog",
    domain: "example.com",
    language: "en",
    keywords: ["keyword1", "keyword2", ...]
  },
  wordCount: 1250,
  readingTime: 7
}
```

---

### **🎯 INTEGRATION WITH LESSON GENERATION**

When the user later clicks "Generate AI Lesson", the system:

1. **Retrieves Enhanced Content** from Chrome storage
2. **Passes Structured Data** to the lesson generation API
3. **Uses Metadata** for better content adaptation
4. **Leverages Structure** for improved lesson quality

This enhanced extraction provides much richer context for AI lesson generation compared to simple text extraction, resulting in more accurate and contextually relevant lessons.

---

### **⏱️ TIMING BREAKDOWN**

**Total Process Time: ~1-3 seconds**

1. **Button Click & Tab Query**: ~50ms
2. **Message to Content Script**: ~50ms
3. **Content Extraction**: ~500-1500ms (depends on page complexity)
4. **Metadata Extraction**: ~200-500ms
5. **Text Processing**: ~100-300ms
6. **Response & Storage**: ~100ms
7. **UI Update**: ~50ms

---

### **🔧 ERROR HANDLING**

The system includes robust error handling for:
- **No Active Tab**: Graceful fallback
- **Content Script Not Loaded**: Retry mechanism
- **Empty Content**: User notification
- **Large Content**: Automatic truncation
- **Network Issues**: Timeout handling

The "Extract from Page" functionality provides a seamless way to capture rich, structured content from any webpage for high-quality lesson generation! 🚀