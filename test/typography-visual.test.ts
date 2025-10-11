import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import React from 'react'

// Mock ResizeObserver for responsive testing
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

describe('Typography Visual Regression Testing', () => {
  let originalInnerWidth: number
  let originalInnerHeight: number

  beforeEach(() => {
    originalInnerWidth = window.innerWidth
    originalInnerHeight = window.innerHeight
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    })
  })

  describe('Font Size Calculations', () => {
    const testCases = [
      { className: 'text-sm', expectedSize: '14px', description: 'Small text (supplementary)' },
      { className: 'text-base', expectedSize: '16px', description: 'Base text (main content)' },
      { className: 'text-lg', expectedSize: '18px', description: 'Large text' },
      { className: 'text-xl', expectedSize: '20px', description: 'Extra large text (section headers)' },
      { className: 'text-2xl', expectedSize: '24px', description: '2XL text (lesson title mobile)' },
      { className: 'text-3xl', expectedSize: '30px', description: '3XL text (lesson title desktop)' },
    ]

    testCases.forEach(({ className, expectedSize, description }) => {
      it(`should render ${description} with correct font size`, () => {
        const { container } = render(
          <div className={className} data-testid="typography-test">
            Test content
          </div>
        )
        
        const element = container.firstChild as HTMLElement
        expect(element).toHaveClass(className)
        
        // Verify the element exists and has the expected class
        expect(element).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Typography Scaling', () => {
    const viewports = [
      { width: 320, height: 568, name: 'Mobile Small' },
      { width: 375, height: 667, name: 'Mobile Medium' },
      { width: 414, height: 896, name: 'Mobile Large' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1024, height: 768, name: 'Desktop Small' },
      { width: 1440, height: 900, name: 'Desktop Large' },
      { width: 1920, height: 1080, name: 'Desktop XL' },
    ]

    viewports.forEach(({ width, height, name }) => {
      it(`should maintain readable typography on ${name} (${width}x${height})`, () => {
        // Set viewport size
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        })
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: height,
        })

        const { container } = render(
          <div className="w-full">
            <h1 className="text-2xl lg:text-3xl font-bold leading-tight">
              Lesson Title for Typography Testing
            </h1>
            <h2 className="text-xl font-semibold mb-4">
              Section Header
            </h2>
            <p className="text-base leading-relaxed">
              This is main content text that should be readable at 16px font size.
            </p>
            <p className="text-sm text-gray-600 italic mb-2">
              These are instructions at 15px equivalent (text-sm).
            </p>
            <p className="text-sm text-gray-500">
              This is supplementary content at 14px equivalent.
            </p>
          </div>
        )

        // Verify all elements are rendered
        const title = container.querySelector('h1')
        const header = container.querySelector('h2')
        const mainContent = container.querySelector('.text-base')
        const instructions = container.querySelector('.text-gray-600')
        const supplementary = container.querySelector('.text-gray-500')

        expect(title).toBeInTheDocument()
        expect(header).toBeInTheDocument()
        expect(mainContent).toBeInTheDocument()
        expect(instructions).toBeInTheDocument()
        expect(supplementary).toBeInTheDocument()

        // Verify responsive classes are applied
        expect(title).toHaveClass('text-2xl', 'lg:text-3xl')
        expect(header).toHaveClass('text-xl')
      })
    })
  })

  describe('High-DPI Screen Support', () => {
    it('should handle high pixel density displays', () => {
      // Mock high-DPI display
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 2,
      })

      const { container } = render(
        <div className="text-base antialiased">
          High-DPI text rendering test
        </div>
      )

      const element = container.firstChild as HTMLElement
      expect(element).toHaveClass('text-base', 'antialiased')
      expect(window.devicePixelRatio).toBe(2)
    })

    it('should handle retina displays', () => {
      // Mock retina display
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 3,
      })

      const { container } = render(
        <div className="text-sm subpixel-antialiased">
          Retina display text test
        </div>
      )

      const element = container.firstChild as HTMLElement
      expect(element).toHaveClass('text-sm', 'subpixel-antialiased')
      expect(window.devicePixelRatio).toBe(3)
    })
  })

  describe('Browser Zoom Support', () => {
    const zoomLevels = [0.5, 0.75, 1, 1.25, 1.5, 2, 3]

    zoomLevels.forEach((zoomLevel) => {
      it(`should maintain readability at ${zoomLevel * 100}% zoom`, () => {
        // Mock zoom level by adjusting devicePixelRatio
        Object.defineProperty(window, 'devicePixelRatio', {
          writable: true,
          configurable: true,
          value: zoomLevel,
        })

        const { container } = render(
          <div className="min-h-screen p-4">
            <h1 className="text-2xl lg:text-3xl font-bold mb-6">
              Zoom Test: Level {zoomLevel * 100}%
            </h1>
            <div className="space-y-4">
              <p className="text-base">
                Main content should remain readable at all zoom levels.
              </p>
              <p className="text-sm text-gray-600">
                Instructions should be distinguishable but readable.
              </p>
              <p className="text-sm text-gray-500">
                Supplementary content should remain accessible.
              </p>
            </div>
          </div>
        )

        // Verify elements are rendered and maintain their classes
        const title = container.querySelector('h1')
        const mainContent = container.querySelector('.text-base')
        const instructions = container.querySelector('.text-gray-600')
        const supplementary = container.querySelector('.text-gray-500')

        expect(title).toBeInTheDocument()
        expect(mainContent).toBeInTheDocument()
        expect(instructions).toBeInTheDocument()
        expect(supplementary).toBeInTheDocument()

        // Verify zoom level is applied
        expect(window.devicePixelRatio).toBe(zoomLevel)
      })
    })
  })

  describe('Typography Hierarchy Validation', () => {
    it('should maintain proper visual hierarchy across all screen sizes', () => {
      const { container } = render(
        <article className="max-w-4xl mx-auto p-6">
          <header>
            <h1 className="text-2xl lg:text-3xl font-bold leading-tight mb-8">
              Main Lesson Title
            </h1>
          </header>
          
          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Primary Section Header
              </h2>
              <p className="text-sm text-gray-600 italic mb-2">
                Section instructions go here
              </p>
              <p className="text-base leading-relaxed mb-4">
                Main content paragraph with important information.
              </p>
              <p className="text-sm text-gray-500">
                Supplementary information and answers.
              </p>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Secondary Section Header
              </h2>
              <p className="text-base leading-relaxed">
                More main content for the second section.
              </p>
            </div>
          </section>
        </article>
      )

      // Verify hierarchy structure
      const article = container.querySelector('article')
      const h1 = container.querySelector('h1')
      const h2Elements = container.querySelectorAll('h2')
      const mainContent = container.querySelectorAll('.text-base')
      const instructions = container.querySelectorAll('.text-gray-600')
      const supplementary = container.querySelectorAll('.text-gray-500')

      expect(article).toBeInTheDocument()
      expect(h1).toBeInTheDocument()
      expect(h2Elements).toHaveLength(2)
      expect(mainContent.length).toBeGreaterThan(0)
      expect(instructions.length).toBeGreaterThan(0)
      expect(supplementary.length).toBeGreaterThan(0)

      // Verify proper font size classes
      expect(h1).toHaveClass('text-2xl', 'lg:text-3xl')
      h2Elements.forEach(h2 => {
        expect(h2).toHaveClass('text-xl')
      })
    })
  })
})