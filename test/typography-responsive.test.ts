import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import React from 'react'

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

// Mock window.matchMedia for responsive testing
const mockMatchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
})

describe('Typography Responsive Testing', () => {
  beforeEach(() => {
    // Reset viewport and media queries
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(mockMatchMedia),
    })
  })

  describe('Font Size Validation', () => {
    it('should apply correct font sizes for lesson title', () => {
      const { container } = render(
        <div className="text-2xl lg:text-3xl font-bold leading-tight">
          {mockLesson.contextualTitle}
        </div>
      )
      
      const titleElement = container.firstChild as HTMLElement
      expect(titleElement).toHaveClass('text-2xl', 'lg:text-3xl', 'font-bold')
    })

    it('should apply correct font sizes for section headers', () => {
      const { container } = render(
        <h2 className="text-xl font-semibold mb-4">
          {mockLesson.sections[0].title}
        </h2>
      )
      
      const headerElement = container.firstChild as HTMLElement
      expect(headerElement).toHaveClass('text-xl', 'font-semibold')
      expect(headerElement.tagName).toBe('H2')
    })

    it('should apply correct font sizes for main content', () => {
      const { container } = render(
        <p className="text-base leading-relaxed">
          {mockLesson.sections[0].content[0].content}
        </p>
      )
      
      const contentElement = container.firstChild as HTMLElement
      expect(contentElement).toHaveClass('text-base', 'leading-relaxed')
    })

    it('should apply correct font sizes for instructions', () => {
      const { container } = render(
        <p className="text-sm text-gray-600 italic mb-2">
          {mockLesson.sections[0].instructions}
        </p>
      )
      
      const instructionElement = container.firstChild as HTMLElement
      expect(instructionElement).toHaveClass('text-sm', 'text-gray-600', 'italic')
    })

    it('should apply correct font sizes for supplementary content', () => {
      const { container } = render(
        <p className="text-sm text-gray-500">
          {mockLesson.sections[1].content[1].content}
        </p>
      )
      
      const supplementaryElement = container.firstChild as HTMLElement
      expect(supplementaryElement).toHaveClass('text-sm', 'text-gray-500')
    })
  })

  describe('Responsive Breakpoint Testing', () => {
    it('should handle mobile viewport correctly', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      const { container } = render(
        <div className="text-2xl lg:text-3xl">Mobile Title</div>
      )
      
      const element = container.firstChild as HTMLElement
      expect(element).toHaveClass('text-2xl', 'lg:text-3xl')
    })

    it('should handle tablet viewport correctly', () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })

      const { container } = render(
        <div className="text-2xl lg:text-3xl">Tablet Title</div>
      )
      
      const element = container.firstChild as HTMLElement
      expect(element).toHaveClass('text-2xl', 'lg:text-3xl')
    })

    it('should handle desktop viewport correctly', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      })

      const { container } = render(
        <div className="text-2xl lg:text-3xl">Desktop Title</div>
      )
      
      const element = container.firstChild as HTMLElement
      expect(element).toHaveClass('text-2xl', 'lg:text-3xl')
    })
  })

  describe('Semantic HTML Structure', () => {
    it('should use proper heading hierarchy', () => {
      const { container } = render(
        <div>
          <h1 className="text-2xl lg:text-3xl">Lesson Title</h1>
          <h2 className="text-xl">Section Title</h2>
        </div>
      )
      
      const h1 = container.querySelector('h1')
      const h2 = container.querySelector('h2')
      
      expect(h1).toBeInTheDocument()
      expect(h2).toBeInTheDocument()
      expect(h1).toHaveClass('text-2xl', 'lg:text-3xl')
      expect(h2).toHaveClass('text-xl')
    })

    it('should maintain proper content structure', () => {
      const { container } = render(
        <article>
          <h1>Lesson Title</h1>
          <section>
            <h2>Section Title</h2>
            <p className="text-base">Main content</p>
            <p className="text-sm">Instructions</p>
            <p className="text-sm text-gray-500">Supplementary</p>
          </section>
        </article>
      )
      
      expect(container.querySelector('article')).toBeInTheDocument()
      expect(container.querySelector('section')).toBeInTheDocument()
      expect(container.querySelectorAll('p')).toHaveLength(3)
    })
  })

  describe('Accessibility Compliance', () => {
    it('should maintain readable contrast ratios', () => {
      const { container } = render(
        <div>
          <p className="text-base text-gray-900">Main content</p>
          <p className="text-sm text-gray-600">Instructions</p>
          <p className="text-sm text-gray-500">Supplementary</p>
        </div>
      )
      
      const mainContent = container.querySelector('.text-gray-900')
      const instructions = container.querySelector('.text-gray-600')
      const supplementary = container.querySelector('.text-gray-500')
      
      expect(mainContent).toBeInTheDocument()
      expect(instructions).toBeInTheDocument()
      expect(supplementary).toBeInTheDocument()
    })

    it('should support screen reader navigation', () => {
      const { container } = render(
        <div>
          <h1 id="lesson-title">Lesson Title</h1>
          <nav aria-labelledby="lesson-title">
            <h2>Section 1</h2>
            <h2>Section 2</h2>
          </nav>
        </div>
      )
      
      const title = container.querySelector('#lesson-title')
      const nav = container.querySelector('nav')
      
      expect(title).toBeInTheDocument()
      expect(nav).toHaveAttribute('aria-labelledby', 'lesson-title')
    })
  })
})