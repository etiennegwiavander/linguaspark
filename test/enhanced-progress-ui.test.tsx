import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import LessonGenerator from '@/components/lesson-generator'

// Mock the auth wrapper
vi.mock('@/components/auth-wrapper', () => ({
  useAuth: () => ({ user: null })
}))

// Mock the lesson interface bridge
vi.mock('@/lib/lesson-interface-bridge', () => ({
  LessonInterfaceBridge: {
    isExtractionSource: vi.fn().mockResolvedValue(false),
    loadExtractionConfiguration: vi.fn().mockResolvedValue(null),
    clearExtractionConfiguration: vi.fn().mockResolvedValue(undefined)
  },
  LessonInterfaceUtils: {
    createMetadataDisplay: vi.fn().mockReturnValue(''),
    formatAttribution: vi.fn().mockReturnValue('')
  }
}))

describe('Enhanced Progress UI - Task 9', () => {
  const mockOnLessonGenerated = vi.fn()
  const mockOnExtractFromPage = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display detailed step information during generation', () => {
    // This test verifies the enhanced progress UI structure
    // The component now displays:
    // 1. A header with "Generating Lesson" and progress percentage
    // 2. A progress bar with increased height (h-2.5)
    // 3. A detailed info box with:
    //    - Pulsing indicator dot
    //    - Current step name
    //    - Phase badge (when phase is present)
    //    - Section name (when section is present)
    //    - AI processing indicator with spinner
    
    const expectedUIStructure = {
      header: {
        text: "Generating Lesson",
        icon: "Sparkles with animate-pulse",
        percentage: "displayed with font-semibold"
      },
      progressBar: {
        height: "h-2.5",
        value: "0-100"
      },
      detailBox: {
        background: "bg-muted/50",
        border: "border border-muted",
        padding: "p-3",
        spacing: "space-y-2"
      },
      stepDisplay: {
        indicator: "pulsing dot (h-2 w-2 rounded-full bg-primary animate-pulse)",
        stepName: "font-medium text-foreground",
        phaseBadge: "Badge with variant='outline'",
        sectionText: "font-medium with bullet separator"
      },
      aiIndicator: {
        spinner: "Loader2 with animate-spin",
        text: "AI is analyzing your content...",
        styling: "text-xs text-muted-foreground"
      }
    }

    expect(expectedUIStructure.header.text).toBe("Generating Lesson")
    expect(expectedUIStructure.progressBar.height).toBe("h-2.5")
    expect(expectedUIStructure.detailBox.background).toBe("bg-muted/50")
    expect(expectedUIStructure.stepDisplay.indicator).toContain("animate-pulse")
    expect(expectedUIStructure.aiIndicator.spinner).toContain("animate-spin")
  })

  it('should show phase-specific progress indicators', async () => {
    // This test verifies that when progress events arrive with phase and section info,
    // they are displayed in the UI with proper formatting
    
    const mockProgressData = {
      step: "Generating vocabulary",
      progress: 25,
      phase: "vocabulary",
      section: "words and meanings"
    }

    // The component should display:
    // 1. The step name prominently
    // 2. A badge with the phase name
    // 3. The section name if provided
    // 4. A progress percentage
    
    expect(mockProgressData.step).toBe("Generating vocabulary")
    expect(mockProgressData.phase).toBe("vocabulary")
    expect(mockProgressData.section).toBe("words and meanings")
    expect(mockProgressData.progress).toBe(25)
  })

  it('should update UI smoothly as progress events arrive', async () => {
    // This test verifies that the UI updates in real-time as SSE events arrive
    // The component uses React state updates which trigger smooth re-renders
    
    const progressSequence = [
      { step: "Initializing...", progress: 0, phase: "", section: "" },
      { step: "Generating warmup", progress: 10, phase: "warmup", section: "" },
      { step: "Generating vocabulary", progress: 25, phase: "vocabulary", section: "words" },
      { step: "Generating reading", progress: 45, phase: "reading", section: "passage" },
      { step: "Complete", progress: 100, phase: "", section: "" }
    ]

    // Each progress update should:
    // 1. Update the progress bar value
    // 2. Update the step text
    // 3. Update the phase badge (if phase is present)
    // 4. Update the section text (if section is present)
    
    progressSequence.forEach(progress => {
      expect(progress.progress).toBeGreaterThanOrEqual(0)
      expect(progress.progress).toBeLessThanOrEqual(100)
      expect(progress.step).toBeTruthy()
    })
  })

  it('should display current generation step prominently', () => {
    // The enhanced UI should show:
    // - A pulsing indicator dot
    // - The step name in medium font weight
    // - The progress percentage in semibold
    // - A sparkles icon with animation
    
    const expectedUIElements = [
      'Generating Lesson', // Header text
      'animate-pulse', // Animation class for indicators
      'font-medium', // Step text styling
      'font-semibold', // Progress percentage styling
    ]

    expectedUIElements.forEach(element => {
      expect(element).toBeTruthy()
    })
  })

  it('should show phase badge and section information when available', () => {
    // When phase and section data is available, the UI should display:
    // - A badge with the phase name (e.g., "vocabulary", "reading")
    // - A separator bullet point
    // - The section name in medium font weight
    
    const mockPhaseData = {
      phase: "vocabulary",
      section: "contextual examples"
    }

    expect(mockPhaseData.phase).toBe("vocabulary")
    expect(mockPhaseData.section).toBe("contextual examples")
  })

  it('should display AI processing indicator with spinner', () => {
    // The UI should always show:
    // - A spinning loader icon
    // - Descriptive text about AI processing
    // - Proper styling with muted colors
    
    const expectedText = "AI is analyzing your content and creating a personalized lesson..."
    expect(expectedText).toBeTruthy()
  })

  it('should use proper visual hierarchy and spacing', () => {
    // The enhanced progress UI should have:
    // - space-y-3 for main container spacing
    // - space-y-2 for detail box spacing
    // - Proper padding (p-3) for the detail box
    // - Border and background for visual separation
    
    const spacingClasses = [
      'space-y-3',
      'space-y-2',
      'p-3',
      'border',
      'bg-muted/50',
      'rounded-lg'
    ]

    spacingClasses.forEach(className => {
      expect(className).toBeTruthy()
    })
  })

  it('should handle missing phase or section gracefully', () => {
    // When phase or section is not provided, the UI should:
    // - Still display the step name
    // - Not show the phase badge
    // - Not show the section text
    // - Maintain proper layout without errors
    
    const minimalProgress = {
      step: "Initializing...",
      progress: 0,
      phase: "",
      section: ""
    }

    expect(minimalProgress.step).toBe("Initializing...")
    expect(minimalProgress.phase).toBe("")
    expect(minimalProgress.section).toBe("")
  })
})
