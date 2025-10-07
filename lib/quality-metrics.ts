/**
 * Quality Metrics Tracker
 * 
 * Tracks quality metrics for each lesson section during generation
 */

export interface SectionMetrics {
  sectionName: string
  validationScore: number
  attemptCount: number
  generationTimeMs: number
  issueCount: number
  warningCount: number
  regenerated: boolean
}

export interface LessonQualityMetrics {
  overallScore: number
  sections: SectionMetrics[]
  totalGenerationTimeMs: number
  totalRegenerations: number
  timestamp: string
}

export class QualityMetricsTracker {
  private metrics: Map<string, SectionMetrics> = new Map()
  private startTime: number = Date.now()

  /**
   * Record metrics for a section
   */
  recordSection(
    sectionName: string,
    validationScore: number,
    attemptCount: number,
    generationTimeMs: number,
    issueCount: number,
    warningCount: number
  ): void {
    this.metrics.set(sectionName, {
      sectionName,
      validationScore,
      attemptCount,
      generationTimeMs,
      issueCount,
      warningCount,
      regenerated: attemptCount > 1
    })

    console.log(`📊 Quality metrics for ${sectionName}:`, {
      score: validationScore,
      attempts: attemptCount,
      time: `${generationTimeMs}ms`,
      issues: issueCount,
      warnings: warningCount
    })
  }

  /**
   * Get metrics for a specific section
   */
  getSectionMetrics(sectionName: string): SectionMetrics | undefined {
    return this.metrics.get(sectionName)
  }

  /**
   * Get all section metrics
   */
  getAllMetrics(): SectionMetrics[] {
    return Array.from(this.metrics.values())
  }

  /**
   * Calculate overall lesson quality score
   */
  calculateOverallScore(): number {
    const sections = this.getAllMetrics()
    if (sections.length === 0) return 0

    const totalScore = sections.reduce((sum, section) => sum + section.validationScore, 0)
    return Math.round(totalScore / sections.length)
  }

  /**
   * Get total regeneration count
   */
  getTotalRegenerations(): number {
    return this.getAllMetrics().filter(s => s.regenerated).length
  }

  /**
   * Get complete lesson quality report
   */
  getQualityReport(): LessonQualityMetrics {
    const sections = this.getAllMetrics()
    const totalTime = Date.now() - this.startTime

    return {
      overallScore: this.calculateOverallScore(),
      sections,
      totalGenerationTimeMs: totalTime,
      totalRegenerations: this.getTotalRegenerations(),
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Log quality summary
   */
  logSummary(): void {
    const report = this.getQualityReport()
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 LESSON QUALITY REPORT')
    console.log('='.repeat(60))
    console.log(`Overall Quality Score: ${report.overallScore}/100`)
    console.log(`Total Generation Time: ${(report.totalGenerationTimeMs / 1000).toFixed(2)}s`)
    console.log(`Total Regenerations: ${report.totalRegenerations}`)
    console.log('\nSection Breakdown:')
    
    report.sections.forEach(section => {
      const status = section.regenerated ? '🔄' : '✅'
      console.log(`  ${status} ${section.sectionName}: ${section.validationScore}/100 (${section.attemptCount} attempts, ${section.issueCount} issues, ${section.warningCount} warnings)`)
    })
    
    console.log('='.repeat(60) + '\n')
  }

  /**
   * Reset metrics for new lesson generation
   */
  reset(): void {
    this.metrics.clear()
    this.startTime = Date.now()
  }
}

// Export singleton instance
export const qualityMetricsTracker = new QualityMetricsTracker()
