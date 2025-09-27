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

  // Function to extract clean content from page with enhanced context
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
      ".comments",
      ".social-share",
      ".related-articles",
      '[role="navigation"]',
      '[role="banner"]',
      '[role="contentinfo"]',
      '[role="complementary"]',
    ]

    unwantedSelectors.forEach((selector) => {
      const elements = clone.querySelectorAll(selector)
      elements.forEach((el) => el.remove())
    })

    // Get main content area with priority order
    const mainContent =
      clone.querySelector("main") ||
      clone.querySelector("article") ||
      clone.querySelector(".post-content") ||
      clone.querySelector(".entry-content") ||
      clone.querySelector(".content") ||
      clone.querySelector("#content") ||
      clone.querySelector(".article-body") ||
      clone.body

    if (!mainContent) return { text: "", metadata: {} }

    // Extract metadata for context
    const metadata = extractContentMetadata(clone)

    // Extract structured content
    const structuredContent = extractStructuredContent(mainContent)

    // Extract and clean text
    let text = mainContent.innerText || mainContent.textContent || ""

    // Clean up whitespace and formatting
    text = text
      .replace(/\s+/g, " ")
      .replace(/\n\s*\n/g, "\n")
      .replace(/^\s+|\s+$/gm, "")
      .trim()

    return {
      text: text,
      structuredContent: structuredContent,
      metadata: metadata,
      wordCount: text.split(/\s+/).length,
      readingTime: Math.ceil(text.split(/\s+/).length / 200), // Approximate reading time in minutes
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
    }

    // Extract title
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
    const dateElement = 
      doc.querySelector('meta[property="article:published_time"]')?.content ||
      doc.querySelector('meta[name="date"]')?.content ||
      doc.querySelector('time[datetime]')?.getAttribute('datetime') ||
      doc.querySelector('.date')?.textContent ||
      ""
    metadata.publishDate = dateElement

    // Determine content type based on URL and structure
    const url = window.location.href.toLowerCase()
    if (url.includes('/blog/') || url.includes('/article/') || url.includes('/post/')) {
      metadata.contentType = 'blog'
    } else if (url.includes('/news/')) {
      metadata.contentType = 'news'
    } else if (url.includes('/wiki/') || url.includes('wikipedia')) {
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
      doc.documentElement.lang ||
      doc.querySelector('meta[http-equiv="content-language"]')?.content ||
      'en'

    // Extract keywords
    const keywordsContent = doc.querySelector('meta[name="keywords"]')?.content
    if (keywordsContent) {
      metadata.keywords = keywordsContent.split(',').map(k => k.trim()).slice(0, 10)
    }

    return metadata
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
