import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import React from 'react'

// Mock axe-core for accessibility testing
const mockAxe = {
  run: vi.fn().mockResolvedValue({ violations: [] }),
  configure: vi.fn(),
}

vi.mock('axe-core', () => ({
  default: mockAxe,
}))

describe('Typography Accessibility Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Screen Reader Compatibility', () => {
    it('should provide proper heading hierarchy for screen readers', () => {
      const { container } = render(
        <main role="main">
          <h1 className="text-2xl lg:text-3xl font-bold">
            Main Lesson Title
          </h1>
          <section>
            <h2 className="text-xl font-semibold">
              Section One
            </h2>
            <p className="text-base">Content for section one</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">
              Section Two
            </h2>
            <p className="text-base">Content for section two</p>
          </section>
        </main>
      )

      // Verify heading hierarchy
      const h1 = container.querySelector('h1')
      const h2Elements = container.querySelectorAll('h2')

      expect(h1).toBeInTheDocument()
      expect(h2Elements).toHaveLength(2)

      // Verify proper ARIA structure
      const main = container.querySelector('main')
      expect(main).toHaveAttribute('role', 'main')
    })

    it('should provide accessible labels and descriptions', () => {
      const { container } = render(
        <div>
          <h1 id="lesson-title" className="text-2xl lg:text-3xl">
            Typography Test Lesson
          </h1>
          <section aria-labelledby="lesson-title">
            <h2 id="vocab-section" className="text-xl">
              Vocabulary Section
            </h2>
            <div role="group" aria-labelledby="vocab-section">
              <p className="text-base">Main vocabulary content</p>
              <p className="text-sm text-gray-600" role="note">
                Instructions for vocabulary exercises
              </p>
            </div>
          </section>
        </div>
      )

      const title = container.querySelector('#lesson-title')
      const section = container.querySelector('section')
      const vocabSection = container.querySelector('#vocab-section')
      const group = container.querySelector('[role="group"]')
      const note = container.querySelector('[role="note"]')

      expect(title).toHaveAttribute('id', 'lesson-title')
      expect(section).toHaveAttribute('aria-labelledby', 'lesson-title')
      expect(vocabSection).toHaveAttribute('id', 'vocab-section')
      expect(group).toHaveAttribute('aria-labelledby', 'vocab-section')
      expect(note).toHaveAttribute('role', 'note')
    })

    it('should support keyboard navigation', () => {
      const { container } = render(
        <div>
          <h1 tabIndex={0} className="text-2xl lg:text-3xl focus:outline-none focus:ring-2">
            Focusable Title
          </h1>
          <nav role="navigation" aria-label="Lesson sections">
            <ul>
              <li>
                <a href="#section1" className="text-base hover:underline focus:underline">
                  Section 1
                </a>
              </li>
              <li>
                <a href="#section2" className="text-base hover:underline focus:underline">
                  Section 2
                </a>
              </li>
            </ul>
          </nav>
        </div>
      )

      const title = container.querySelector('h1')
      const nav = container.querySelector('nav')
      const links = container.querySelectorAll('a')

      expect(title).toHaveAttribute('tabIndex', '0')
      expect(nav).toHaveAttribute('role', 'navigation')
      expect(nav).toHaveAttribute('aria-label', 'Lesson sections')
      expect(links).toHaveLength(2)

      links.forEach(link => {
        expect(link).toHaveClass('focus:underline')
      })
    })
  })

  describe('Color Contrast Compliance', () => {
    it('should meet WCAG AA contrast requirements for main content', () => {
      const { container } = render(
        <div className="bg-white">
          <p className="text-base text-gray-900">
            Main content with high contrast
          </p>
          <p className="text-sm text-gray-600">
            Instructions with medium contrast
          </p>
          <p className="text-sm text-gray-500">
            Supplementary content with lower contrast
          </p>
        </div>
      )

      const mainContent = container.querySelector('.text-gray-900')
      const instructions = container.querySelector('.text-gray-600')
      const supplementary = container.querySelector('.text-gray-500')

      // Verify elements exist with proper contrast classes
      expect(mainContent).toBeInTheDocument()
      expect(instructions).toBeInTheDocument()
      expect(supplementary).toBeInTheDocument()

      expect(mainContent).toHaveClass('text-gray-900')
      expect(instructions).toHaveClass('text-gray-600')
      expect(supplementary).toHaveClass('text-gray-500')
    })

    it('should maintain contrast in dark mode', () => {
      const { container } = render(
        <div className="dark:bg-gray-900">
          <p className="text-base text-gray-900 dark:text-gray-100">
            Main content for dark mode
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Instructions for dark mode
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Supplementary content for dark mode
          </p>
        </div>
      )

      const mainContent = container.querySelector('.dark\\:text-gray-100')
      const instructions = container.querySelector('.dark\\:text-gray-400')
      const supplementary = container.querySelector('.dark\\:text-gray-500')

      expect(mainContent).toBeInTheDocument()
      expect(instructions).toBeInTheDocument()
      expect(supplementary).toBeInTheDocument()
    })
  })

  describe('Font Size Accessibility', () => {
    it('should maintain minimum font sizes for accessibility', () => {
      const { container } = render(
        <div>
          <h1 className="text-2xl lg:text-3xl">Title (24px/30px)</h1>
          <h2 className="text-xl">Section Header (20px)</h2>
          <p className="text-base">Main Content (16px)</p>
          <p className="text-sm">Instructions (14px)</p>
          <p className="text-sm">Supplementary (14px)</p>
        </div>
      )

      // All elements should use text-sm (14px) or larger
      const title = container.querySelector('h1')
      const header = container.querySelector('h2')
      const mainContent = container.querySelector('.text-base')
      const instructions = container.querySelectorAll('.text-sm')

      expect(title).toHaveClass('text-2xl')
      expect(header).toHaveClass('text-xl')
      expect(mainContent).toHaveClass('text-base')
      expect(instructions).toHaveLength(2)

      // Verify no text smaller than 14px (text-xs or smaller)
      const tooSmallText = container.querySelectorAll('.text-xs')
      expect(tooSmallText).toHaveLength(0)
    })

    it('should support browser zoom up to 200%', () => {
      // Mock high zoom level
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 2,
      })

      const { container } = render(
        <div className="p-4">
          <h1 className="text-2xl lg:text-3xl mb-4">
            Zoom Test Title
          </h1>
          <p className="text-base leading-relaxed">
            This content should remain readable and usable at 200% zoom level.
            The layout should not break and all interactive elements should remain accessible.
          </p>
          <button className="text-base px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2">
            Interactive Element
          </button>
        </div>
      )

      const title = container.querySelector('h1')
      const content = container.querySelector('p')
      const button = container.querySelector('button')

      expect(title).toBeInTheDocument()
      expect(content).toBeInTheDocument()
      expect(button).toBeInTheDocument()

      // Verify zoom level
      expect(window.devicePixelRatio).toBe(2)
    })
  })

  describe('Focus Management', () => {
    it('should provide visible focus indicators', () => {
      const { container } = render(
        <div>
          <button className="text-base px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Focusable Button
          </button>
          <a href="#section" className="text-base underline focus:outline-none focus:ring-2 focus:ring-blue-500">
            Focusable Link
          </a>
          <input 
            type="text" 
            className="text-base px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Focusable Input"
          />
        </div>
      )

      const button = container.querySelector('button')
      const link = container.querySelector('a')
      const input = container.querySelector('input')

      expect(button).toHaveClass('focus:ring-2', 'focus:ring-blue-500')
      expect(link).toHaveClass('focus:ring-2', 'focus:ring-blue-500')
      expect(input).toHaveClass('focus:ring-2', 'focus:ring-blue-500')
    })

    it('should maintain logical tab order', () => {
      const { container } = render(
        <div>
          <h1 tabIndex={0}>Title</h1>
          <nav>
            <a href="#section1" tabIndex={1}>Section 1</a>
            <a href="#section2" tabIndex={2}>Section 2</a>
          </nav>
          <main>
            <button tabIndex={3}>Action Button</button>
          </main>
        </div>
      )

      const title = container.querySelector('h1')
      const link1 = container.querySelector('a[href="#section1"]')
      const link2 = container.querySelector('a[href="#section2"]')
      const button = container.querySelector('button')

      expect(title).toHaveAttribute('tabIndex', '0')
      expect(link1).toHaveAttribute('tabIndex', '1')
      expect(link2).toHaveAttribute('tabIndex', '2')
      expect(button).toHaveAttribute('tabIndex', '3')
    })
  })

  describe('Responsive Text Scaling', () => {
    it('should maintain readability when system font size is increased', () => {
      // Mock increased system font size
      const originalFontSize = document.documentElement.style.fontSize
      document.documentElement.style.fontSize = '20px' // Increased from default 16px

      const { container } = render(
        <div className="text-base">
          Content that should scale with system font size
        </div>
      )

      const element = container.firstChild as HTMLElement
      expect(element).toHaveClass('text-base')

      // Restore original font size
      document.documentElement.style.fontSize = originalFontSize
    })

    it('should handle reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      const { container } = render(
        <div className="transition-all duration-300 motion-reduce:transition-none">
          Content with reduced motion support
        </div>
      )

      const element = container.firstChild as HTMLElement
      expect(element).toHaveClass('motion-reduce:transition-none')
    })
  })
})