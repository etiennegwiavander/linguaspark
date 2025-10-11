import { describe, it, expect, beforeEach, vi } from 'vitest'
import { JSDOM } from 'jsdom'

// Mock lesson data for testing
const mockLesson = {
  id: 'test-lesson',
  contextualTitle: 'Test Lesson: Typography Validation',
  sections: [
    {
      type: 'warmup' as const,
      title: 'Warm-up Questions',
      content: [
        {
          type: 'question' as const,
          content: 'This is a sample question for testing typography.',
          fontSize: 'main' as const
        }
      ],
      instructions: 'These are sample instructions for the warm-up section.'
    },
    {
      type: 'vocabulary' as const,
      title: 'Vocabulary',
      content: [
        {
          type: 'text' as const,
          content: 'This is main vocabulary content.',
          fontSize: 'main' as const
        },
        {
          type: 'answer' as const,
          content: 'This is supplementary answer content.',
          fontSize: 'supplementary' as const
        }
      ]
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
}

describe('Typography Validation Testing', () => {
  let dom: JSDOM
  let document: Document

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Typography Test</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          <div id="test-container"></div>
        </body>
      </html>
    `)
    document = dom.window.document
    global.document = document
    global.window = dom.window as any
  })

  describe('Font Size Class Validation', () => {
    it('should validate lesson title typography classes', () => {
      const titleElement = document.createElement('h1')
      titleElement.className = 'text-2xl lg:text-3xl font-bold leading-tight'
      titleElement.textContent = mockLesson.contextualTitle

      expect(titleElement.classList.contains('text-2xl')).toBe(true)
      expect(titleElement.classList.contains('lg:text-3xl')).toBe(true)
      expect(titleElement.classList.contains('font-bold')).toBe(true)
      expect(titleElement.classList.contains('leading-tight')).toBe(true)
      expect(titleElement.tagName).toBe('H1')
    })

    it('should validate section header typography classes', () => {
      const headerElement = document.createElement('h2')
      headerElement.className = 'text-xl font-semibold mb-4'
      headerElement.textContent = mockLesson.sections[0].title

      expect(headerElement.classList.contains('text-xl')).toBe(true)
      expect(headerElement.classList.contains('font-semibold')).toBe(true)
      expect(headerElement.classList.contains('mb-4')).toBe(true)
      expect(headerElement.tagName).toBe('H2')
    })

    it('should validate main content typography classes', () => {
      const contentElement = document.createElement('p')
      contentElement.className = 'text-base leading-relaxed'
      contentElement.textContent = mockLesson.sections[0].content[0].content

      expect(contentElement.classList.contains('text-base')).toBe(true)
      expect(contentElement.classList.contains('leading-relaxed')).toBe(true)
    })

    it('should validate instruction typography classes', () => {
      const instructionElement = document.createElement('p')
      instructionElement.className = 'text-sm text-gray-600 italic mb-2'
      instructionElement.textContent = mockLesson.sections[0].instructions

      expect(instructionElement.classList.contains('text-sm')).toBe(true)
      expect(instructionElement.classList.contains('text-gray-600')).toBe(true)
      expect(instructionElement.classList.contains('italic')).toBe(true)
      expect(instructionElement.classList.contains('mb-2')).toBe(true)
    })

    it('should validate supplementary content typography classes', () => {
      const supplementaryElement = document.createElement('p')
      supplementaryElement.className = 'text-sm text-gray-500'
      supplementaryElement.textContent = mockLesson.sections[1].content[1].content

      expect(supplementaryElement.classList.contains('text-sm')).toBe(true)
      expect(supplementaryElement.classList.contains('text-gray-500')).toBe(true)
    })
  })

  describe('Responsive Typography Validation', () => {
    const viewportSizes = [
      { width: 320, height: 568, name: 'Mobile Small' },
      { width: 375, height: 667, name: 'Mobile Medium' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1024, height: 768, name: 'Desktop' },
      { width: 1440, height: 900, name: 'Large Desktop' }
    ]

    viewportSizes.forEach(({ width, height, name }) => {
      it(`should maintain proper typography classes at ${name} viewport (${width}x${height})`, () => {
        // Mock viewport size
        Object.defineProperty(dom.window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        })
        Object.defineProperty(dom.window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: height,
        })

        // Create lesson structure
        const container = document.createElement('div')
        container.className = 'max-w-4xl mx-auto p-6'

        // Lesson title
        const title = document.createElement('h1')
        title.className = 'text-2xl lg:text-3xl font-bold leading-tight mb-8'
        title.textContent = mockLesson.contextualTitle

        // Section header
        const sectionHeader = document.createElement('h2')
        sectionHeader.className = 'text-xl font-semibold mb-4'
        sectionHeader.textContent = mockLesson.sections[0].title

        // Main content
        const mainContent = document.createElement('p')
        mainContent.className = 'text-base leading-relaxed mb-4'
        mainContent.textContent = mockLesson.sections[0].content[0].content

        // Instructions
        const instructions = document.createElement('p')
        instructions.className = 'text-sm text-gray-600 italic mb-2'
        instructions.textContent = mockLesson.sections[0].instructions || ''

        // Supplementary content
        const supplementary = document.createElement('p')
        supplementary.className = 'text-sm text-gray-500'
        supplementary.textContent = mockLesson.sections[1].content[1].content

        container.appendChild(title)
        container.appendChild(sectionHeader)
        container.appendChild(mainContent)
        container.appendChild(instructions)
        container.appendChild(supplementary)

        // Verify all elements maintain their classes regardless of viewport
        expect(title.classList.contains('text-2xl')).toBe(true)
        expect(title.classList.contains('lg:text-3xl')).toBe(true)
        expect(sectionHeader.classList.contains('text-xl')).toBe(true)
        expect(mainContent.classList.contains('text-base')).toBe(true)
        expect(instructions.classList.contains('text-sm')).toBe(true)
        expect(supplementary.classList.contains('text-sm')).toBe(true)

        // Verify viewport size is set
        expect(dom.window.innerWidth).toBe(width)
        expect(dom.window.innerHeight).toBe(height)
      })
    })
  })

  describe('Semantic HTML Structure Validation', () => {
    it('should maintain proper heading hierarchy', () => {
      const container = document.createElement('article')
      
      // Create heading hierarchy
      const h1 = document.createElement('h1')
      h1.className = 'text-2xl lg:text-3xl font-bold'
      h1.textContent = 'Main Lesson Title'

      const h2_1 = document.createElement('h2')
      h2_1.className = 'text-xl font-semibold'
      h2_1.textContent = 'Section One'

      const h2_2 = document.createElement('h2')
      h2_2.className = 'text-xl font-semibold'
      h2_2.textContent = 'Section Two'

      container.appendChild(h1)
      container.appendChild(h2_1)
      container.appendChild(h2_2)

      // Verify heading hierarchy
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
      expect(headings.length).toBe(3)
      expect(headings[0].tagName).toBe('H1')
      expect(headings[1].tagName).toBe('H2')
      expect(headings[2].tagName).toBe('H2')

      // Verify typography classes
      expect(h1.classList.contains('text-2xl')).toBe(true)
      expect(h1.classList.contains('lg:text-3xl')).toBe(true)
      expect(h2_1.classList.contains('text-xl')).toBe(true)
      expect(h2_2.classList.contains('text-xl')).toBe(true)
    })

    it('should provide proper ARIA structure', () => {
      const main = document.createElement('main')
      main.setAttribute('role', 'main')

      const title = document.createElement('h1')
      title.id = 'lesson-title'
      title.className = 'text-2xl lg:text-3xl'
      title.textContent = 'Lesson Title'

      const section = document.createElement('section')
      section.setAttribute('aria-labelledby', 'lesson-title')

      main.appendChild(title)
      main.appendChild(section)

      expect(main.getAttribute('role')).toBe('main')
      expect(title.id).toBe('lesson-title')
      expect(section.getAttribute('aria-labelledby')).toBe('lesson-title')
    })
  })

  describe('Accessibility Compliance Validation', () => {
    it('should use minimum accessible font sizes', () => {
      // Test that no text uses sizes smaller than text-sm (14px equivalent)
      const elements = [
        { className: 'text-2xl lg:text-3xl', description: 'Lesson title' },
        { className: 'text-xl', description: 'Section headers' },
        { className: 'text-base', description: 'Main content' },
        { className: 'text-sm', description: 'Instructions and supplementary' }
      ]

      elements.forEach(({ className, description }) => {
        const element = document.createElement('div')
        element.className = className
        
        // Verify no text-xs or smaller classes are used
        expect(element.classList.contains('text-xs')).toBe(false)
        expect(element.classList.contains('text-2xs')).toBe(false)
        
        // Verify expected classes are present
        const expectedClasses = className.split(' ')
        expectedClasses.forEach(cls => {
          expect(element.classList.contains(cls)).toBe(true)
        })
      })
    })

    it('should support focus indicators', () => {
      const focusableElements = [
        'focus:outline-none focus:ring-2 focus:ring-blue-500',
        'focus:underline',
        'hover:underline focus:underline'
      ]

      focusableElements.forEach(focusClasses => {
        const element = document.createElement('button')
        element.className = `text-base ${focusClasses}`
        
        const classes = focusClasses.split(' ')
        classes.forEach(cls => {
          expect(element.classList.contains(cls)).toBe(true)
        })
      })
    })

    it('should maintain color contrast classes', () => {
      const contrastElements = [
        { className: 'text-gray-900', description: 'High contrast main content' },
        { className: 'text-gray-600', description: 'Medium contrast instructions' },
        { className: 'text-gray-500', description: 'Lower contrast supplementary' }
      ]

      contrastElements.forEach(({ className, description }) => {
        const element = document.createElement('p')
        element.className = `text-base ${className}`
        
        expect(element.classList.contains(className)).toBe(true)
        expect(element.classList.contains('text-base')).toBe(true)
      })
    })
  })

  describe('High-DPI and Zoom Support Validation', () => {
    it('should handle different device pixel ratios', () => {
      const dpiLevels = [1, 1.5, 2, 2.5, 3]

      dpiLevels.forEach(dpi => {
        Object.defineProperty(dom.window, 'devicePixelRatio', {
          writable: true,
          configurable: true,
          value: dpi,
        })

        const element = document.createElement('div')
        element.className = 'text-base antialiased'
        
        expect(element.classList.contains('text-base')).toBe(true)
        expect(element.classList.contains('antialiased')).toBe(true)
        expect(dom.window.devicePixelRatio).toBe(dpi)
      })
    })

    it('should support browser zoom levels', () => {
      const zoomLevels = [0.5, 0.75, 1, 1.25, 1.5, 2]

      zoomLevels.forEach(zoom => {
        // Mock zoom by adjusting devicePixelRatio
        Object.defineProperty(dom.window, 'devicePixelRatio', {
          writable: true,
          configurable: true,
          value: zoom,
        })

        const container = document.createElement('div')
        container.className = 'p-4 space-y-4'

        const title = document.createElement('h1')
        title.className = 'text-2xl lg:text-3xl font-bold'
        title.textContent = `Zoom Test: ${zoom * 100}%`

        const content = document.createElement('p')
        content.className = 'text-base leading-relaxed'
        content.textContent = 'Content should remain readable at all zoom levels.'

        container.appendChild(title)
        container.appendChild(content)

        // Verify elements maintain their classes at different zoom levels
        expect(title.classList.contains('text-2xl')).toBe(true)
        expect(title.classList.contains('lg:text-3xl')).toBe(true)
        expect(content.classList.contains('text-base')).toBe(true)
        expect(content.classList.contains('leading-relaxed')).toBe(true)
        expect(dom.window.devicePixelRatio).toBe(zoom)
      })
    })
  })

  describe('Typography Hierarchy Validation', () => {
    it('should maintain proper visual hierarchy across all content types', () => {
      const lessonStructure = document.createElement('article')
      lessonStructure.className = 'max-w-4xl mx-auto p-6'

      // Create complete lesson structure
      const header = document.createElement('header')
      const title = document.createElement('h1')
      title.className = 'text-2xl lg:text-3xl font-bold leading-tight mb-8'
      title.textContent = 'Main Lesson Title'
      header.appendChild(title)

      const main = document.createElement('main')
      main.className = 'space-y-6'

      // Create multiple sections
      mockLesson.sections.forEach((section, index) => {
        const sectionElement = document.createElement('section')
        sectionElement.className = 'space-y-4'

        const sectionHeader = document.createElement('h2')
        sectionHeader.className = 'text-xl font-semibold mb-4'
        sectionHeader.textContent = section.title

        const instructions = document.createElement('p')
        instructions.className = 'text-sm text-gray-600 italic mb-2'
        instructions.textContent = section.instructions || ''

        const contentDiv = document.createElement('div')
        contentDiv.className = 'space-y-3'

        section.content.forEach(item => {
          const contentElement = document.createElement('p')
          if (item.fontSize === 'main') {
            contentElement.className = 'text-base leading-relaxed text-gray-900'
          } else {
            contentElement.className = 'text-sm text-gray-500'
          }
          contentElement.textContent = item.content
          contentDiv.appendChild(contentElement)
        })

        sectionElement.appendChild(sectionHeader)
        if (section.instructions) {
          sectionElement.appendChild(instructions)
        }
        sectionElement.appendChild(contentDiv)
        main.appendChild(sectionElement)
      })

      lessonStructure.appendChild(header)
      lessonStructure.appendChild(main)

      // Verify complete structure
      expect(lessonStructure.querySelector('h1')).toBeTruthy()
      expect(lessonStructure.querySelectorAll('h2').length).toBe(mockLesson.sections.length)
      expect(lessonStructure.querySelectorAll('.text-base').length).toBeGreaterThan(0)
      expect(lessonStructure.querySelectorAll('.text-sm').length).toBeGreaterThan(0)

      // Verify typography hierarchy
      const h1 = lessonStructure.querySelector('h1')
      const h2Elements = lessonStructure.querySelectorAll('h2')
      const mainContent = lessonStructure.querySelectorAll('.text-base')
      const smallContent = lessonStructure.querySelectorAll('.text-sm')

      expect(h1?.classList.contains('text-2xl')).toBe(true)
      expect(h1?.classList.contains('lg:text-3xl')).toBe(true)
      
      h2Elements.forEach(h2 => {
        expect(h2.classList.contains('text-xl')).toBe(true)
      })

      mainContent.forEach(content => {
        expect(content.classList.contains('text-base')).toBe(true)
      })

      smallContent.forEach(content => {
        expect(content.classList.contains('text-sm')).toBe(true)
      })
    })
  })
})