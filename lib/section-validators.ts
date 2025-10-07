/**
 * Section Validators
 * 
 * Comprehensive validation for all lesson sections to ensure quality standards
 */

import type { CEFRLevel } from './progressive-generator'

export interface ValidationResult {
  isValid: boolean
  issues: ValidationIssue[]
  warnings: ValidationIssue[]
  score: number // 0-100 quality score
}

export interface ValidationIssue {
  type: string
  severity: 'error' | 'warning'
  message: string
  itemIndex?: number
  suggestion?: string
}

/**
 * Dialogue Section Validator
 */
export class DialogueValidator {
  private readonly MIN_DIALOGUE_LINES = 12

  validate(
    dialogueLines: Array<{ speaker: string; text: string }>,
    cefrLevel: CEFRLevel,
    vocabularyWords: string[]
  ): ValidationResult {
    const issues: ValidationIssue[] = []
    const warnings: ValidationIssue[] = []

    // Validate line count
    if (dialogueLines.length < this.MIN_DIALOGUE_LINES) {
      issues.push({
        type: 'count_error',
        severity: 'error',
        message: `Insufficient dialogue lines: expected at least ${this.MIN_DIALOGUE_LINES}, got ${dialogueLines.length}`,
        suggestion: 'Generate more dialogue lines'
      })
    }

    // Validate complexity matches CEFR level
    this.validateComplexity(dialogueLines, cefrLevel, issues, warnings)

    // Validate vocabulary integration
    this.validateVocabularyIntegration(dialogueLines, vocabularyWords, warnings)

    // Validate natural flow
    this.validateNaturalFlow(dialogueLines, warnings)

    const score = this.calculateScore(issues, warnings, dialogueLines.length)

    return { isValid: issues.length === 0, issues, warnings, score }
  }


  private validateComplexity(
    lines: Array<{ speaker: string; text: string }>,
    cefrLevel: CEFRLevel,
    issues: ValidationIssue[],
    warnings: ValidationIssue[]
  ): void {
    const complexityRanges: Record<CEFRLevel, { minWords: number; maxWords: number }> = {
      'A1': { minWords: 3, maxWords: 8 },
      'A2': { minWords: 5, maxWords: 12 },
      'B1': { minWords: 8, maxWords: 15 },
      'B2': { minWords: 10, maxWords: 20 },
      'C1': { minWords: 12, maxWords: 25 }
    }

    const range = complexityRanges[cefrLevel]
    
    lines.forEach((line, index) => {
      const wordCount = line.text.split(/\s+/).length
      
      if (wordCount < range.minWords) {
        warnings.push({
          type: 'complexity_mismatch',
          severity: 'warning',
          message: `Line ${index + 1} too short for ${cefrLevel} (${wordCount} words)`,
          itemIndex: index,
          suggestion: `Lines should be ${range.minWords}-${range.maxWords} words`
        })
      }
    })
  }

  private validateVocabularyIntegration(
    lines: Array<{ speaker: string; text: string }>,
    vocabularyWords: string[],
    warnings: ValidationIssue[]
  ): void {
    const allText = lines.map(l => l.text.toLowerCase()).join(' ')
    const usedVocab = vocabularyWords.filter(word => 
      allText.includes(word.toLowerCase())
    )

    if (usedVocab.length < Math.min(3, vocabularyWords.length)) {
      warnings.push({
        type: 'vocabulary_integration',
        severity: 'warning',
        message: `Only ${usedVocab.length} vocabulary words used in dialogue`,
        suggestion: 'Integrate more lesson vocabulary into dialogue'
      })
    }
  }

  private validateNaturalFlow(
    lines: Array<{ speaker: string; text: string }>,
    warnings: ValidationIssue[]
  ): void {
    // Check for speaker alternation
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].speaker === lines[i - 1].speaker) {
        warnings.push({
          type: 'flow_issue',
          severity: 'warning',
          message: `Same speaker has consecutive lines at position ${i}`,
          itemIndex: i,
          suggestion: 'Alternate speakers for natural conversation flow'
        })
        break // Only report once
      }
    }
  }

  private calculateScore(issues: ValidationIssue[], warnings: ValidationIssue[], lineCount: number): number {
    let score = 100
    score -= issues.length * 20
    score -= warnings.length * 5
    if (lineCount >= this.MIN_DIALOGUE_LINES) score += 10
    return Math.max(0, Math.min(100, score))
  }
}

/**
 * Discussion Questions Validator
 */
export class DiscussionValidator {
  private readonly REQUIRED_QUESTION_COUNT = 5

  validate(questions: string[], cefrLevel: CEFRLevel): ValidationResult {
    const issues: ValidationIssue[] = []
    const warnings: ValidationIssue[] = []

    // Validate question count
    if (questions.length !== this.REQUIRED_QUESTION_COUNT) {
      issues.push({
        type: 'count_error',
        severity: 'error',
        message: `Expected exactly ${this.REQUIRED_QUESTION_COUNT} questions, got ${questions.length}`,
        suggestion: `Generate exactly ${this.REQUIRED_QUESTION_COUNT} questions`
      })
    }

    // Validate question format
    questions.forEach((question, index) => {
      if (!question.endsWith('?')) {
        issues.push({
          type: 'format_error',
          severity: 'error',
          message: `Question ${index + 1} doesn't end with question mark`,
          itemIndex: index
        })
      }

      if (question.length < 10) {
        issues.push({
          type: 'format_error',
          severity: 'error',
          message: `Question ${index + 1} too short`,
          itemIndex: index
        })
      }
    })

    // Validate complexity matches CEFR level
    this.validateQuestionComplexity(questions, cefrLevel, issues, warnings)

    // Validate question variety
    this.validateQuestionVariety(questions, warnings)

    const score = this.calculateScore(issues, warnings, questions.length)

    return { isValid: issues.length === 0, issues, warnings, score }
  }

  private validateQuestionComplexity(
    questions: string[],
    cefrLevel: CEFRLevel,
    issues: ValidationIssue[],
    warnings: ValidationIssue[]
  ): void {
    const expectedTypes: Record<CEFRLevel, string[]> = {
      'A1': ['simple', 'factual'],
      'A2': ['simple', 'factual'],
      'B1': ['opinion', 'comparison'],
      'B2': ['analytical', 'evaluative'],
      'C1': ['analytical', 'evaluative', 'hypothetical']
    }

    const allText = questions.join(' ').toLowerCase()
    
    // Check for appropriate question types
    if (['B2', 'C1'].includes(cefrLevel)) {
      const hasAnalytical = /why do you think|what factors|how might|to what extent|in what ways/.test(allText)
      if (!hasAnalytical) {
        warnings.push({
          type: 'complexity_mismatch',
          severity: 'warning',
          message: `Questions lack analytical depth for ${cefrLevel} level`,
          suggestion: 'Include more analytical or evaluative questions'
        })
      }
    }

    if (['A1', 'A2'].includes(cefrLevel)) {
      const hasTooComplex = /hypothetically|analyze|evaluate|implications/.test(allText)
      if (hasTooComplex) {
        warnings.push({
          type: 'complexity_mismatch',
          severity: 'warning',
          message: `Questions may be too complex for ${cefrLevel} level`,
          suggestion: 'Use simpler question structures'
        })
      }
    }
  }

  private validateQuestionVariety(questions: string[], warnings: ValidationIssue[]): void {
    const starters = questions.map(q => q.trim().split(' ')[0].toLowerCase())
    const uniqueStarters = new Set(starters)

    if (uniqueStarters.size < 3) {
      warnings.push({
        type: 'variety_issue',
        severity: 'warning',
        message: 'Limited question variety',
        suggestion: 'Use different question types (What, Why, How, etc.)'
      })
    }
  }

  private calculateScore(issues: ValidationIssue[], warnings: ValidationIssue[], questionCount: number): number {
    let score = 100
    score -= issues.length * 20
    score -= warnings.length * 5
    if (questionCount === this.REQUIRED_QUESTION_COUNT) score += 10
    return Math.max(0, Math.min(100, score))
  }
}

/**
 * Grammar Section Validator
 */
export class GrammarValidator {
  private readonly MIN_EXERCISES = 5

  validate(
    grammarSection: {
      rule?: string
      form?: string
      usage?: string
      examples?: string[]
      exercises?: Array<{ prompt: string; answer: string }>
    },
    cefrLevel: CEFRLevel
  ): ValidationResult {
    const issues: ValidationIssue[] = []
    const warnings: ValidationIssue[] = []

    // Validate completeness
    if (!grammarSection.rule || grammarSection.rule.length < 10) {
      issues.push({
        type: 'completeness_error',
        severity: 'error',
        message: 'Grammar rule explanation missing or too short',
        suggestion: 'Provide clear explanation of the grammar rule'
      })
    }

    if (!grammarSection.form || grammarSection.form.length < 10) {
      issues.push({
        type: 'completeness_error',
        severity: 'error',
        message: 'Grammar form explanation missing or too short',
        suggestion: 'Explain the grammatical form'
      })
    }

    if (!grammarSection.usage || grammarSection.usage.length < 10) {
      issues.push({
        type: 'completeness_error',
        severity: 'error',
        message: 'Grammar usage explanation missing or too short',
        suggestion: 'Explain when and how to use this grammar'
      })
    }

    // Validate examples
    if (!grammarSection.examples || grammarSection.examples.length < 3) {
      issues.push({
        type: 'completeness_error',
        severity: 'error',
        message: 'Insufficient example sentences',
        suggestion: 'Provide at least 3 example sentences'
      })
    }

    // Validate exercises
    if (!grammarSection.exercises || grammarSection.exercises.length < this.MIN_EXERCISES) {
      issues.push({
        type: 'count_error',
        severity: 'error',
        message: `Insufficient exercises: expected at least ${this.MIN_EXERCISES}, got ${grammarSection.exercises?.length || 0}`,
        suggestion: `Provide at least ${this.MIN_EXERCISES} practice exercises`
      })
    }

    // Validate exercise quality
    if (grammarSection.exercises) {
      grammarSection.exercises.forEach((exercise, index) => {
        if (!exercise.prompt || exercise.prompt.length < 5) {
          issues.push({
            type: 'quality_issue',
            severity: 'error',
            message: `Exercise ${index + 1} has invalid prompt`,
            itemIndex: index
          })
        }
        if (!exercise.answer || exercise.answer.length < 1) {
          issues.push({
            type: 'quality_issue',
            severity: 'error',
            message: `Exercise ${index + 1} missing answer`,
            itemIndex: index
          })
        }
      })
    }

    const score = this.calculateScore(issues, warnings, grammarSection.exercises?.length || 0)

    return { isValid: issues.length === 0, issues, warnings, score }
  }

  private calculateScore(issues: ValidationIssue[], warnings: ValidationIssue[], exerciseCount: number): number {
    let score = 100
    score -= issues.length * 15
    score -= warnings.length * 5
    if (exerciseCount >= this.MIN_EXERCISES) score += 10
    return Math.max(0, Math.min(100, score))
  }
}

/**
 * Pronunciation Section Validator
 */
export class PronunciationValidator {
  private readonly MIN_WORDS = 5
  private readonly MIN_TONGUE_TWISTERS = 2

  validate(
    pronunciationSection: {
      words?: Array<{ word: string; ipa: string; tips: string[]; practiceSentence: string }>
      tongueTwisters?: Array<{ text: string; targetSounds: string[] }>
    }
  ): ValidationResult {
    const issues: ValidationIssue[] = []
    const warnings: ValidationIssue[] = []

    // Validate word count
    if (!pronunciationSection.words || pronunciationSection.words.length < this.MIN_WORDS) {
      issues.push({
        type: 'count_error',
        severity: 'error',
        message: `Insufficient pronunciation words: expected at least ${this.MIN_WORDS}, got ${pronunciationSection.words?.length || 0}`,
        suggestion: `Include at least ${this.MIN_WORDS} challenging words`
      })
    }

    // Validate tongue twister count
    if (!pronunciationSection.tongueTwisters || pronunciationSection.tongueTwisters.length < this.MIN_TONGUE_TWISTERS) {
      issues.push({
        type: 'count_error',
        severity: 'error',
        message: `Insufficient tongue twisters: expected at least ${this.MIN_TONGUE_TWISTERS}, got ${pronunciationSection.tongueTwisters?.length || 0}`,
        suggestion: `Include at least ${this.MIN_TONGUE_TWISTERS} tongue twisters`
      })
    }

    // Validate word completeness
    if (pronunciationSection.words) {
      pronunciationSection.words.forEach((wordItem, index) => {
        if (!wordItem.word || wordItem.word.length < 2) {
          issues.push({
            type: 'completeness_error',
            severity: 'error',
            message: `Word ${index + 1} is invalid`,
            itemIndex: index
          })
        }

        if (!wordItem.ipa || wordItem.ipa.length < 2) {
          issues.push({
            type: 'completeness_error',
            severity: 'error',
            message: `Word ${index + 1} missing IPA transcription`,
            itemIndex: index,
            suggestion: 'Provide IPA transcription for pronunciation'
          })
        }

        if (!wordItem.tips || wordItem.tips.length === 0) {
          warnings.push({
            type: 'completeness_warning',
            severity: 'warning',
            message: `Word ${index + 1} missing pronunciation tips`,
            itemIndex: index,
            suggestion: 'Add pronunciation tips for difficult sounds'
          })
        }

        if (!wordItem.practiceSentence || wordItem.practiceSentence.length < 10) {
          warnings.push({
            type: 'completeness_warning',
            severity: 'warning',
            message: `Word ${index + 1} missing practice sentence`,
            itemIndex: index,
            suggestion: 'Provide practice sentence using the word'
          })
        }
      })
    }

    // Validate tongue twister completeness
    if (pronunciationSection.tongueTwisters) {
      pronunciationSection.tongueTwisters.forEach((twister, index) => {
        if (!twister.text || twister.text.length < 15) {
          issues.push({
            type: 'completeness_error',
            severity: 'error',
            message: `Tongue twister ${index + 1} too short or missing`,
            itemIndex: index
          })
        }

        if (!twister.targetSounds || twister.targetSounds.length === 0) {
          warnings.push({
            type: 'completeness_warning',
            severity: 'warning',
            message: `Tongue twister ${index + 1} missing target sounds`,
            itemIndex: index
          })
        }
      })
    }

    const score = this.calculateScore(
      issues,
      warnings,
      pronunciationSection.words?.length || 0,
      pronunciationSection.tongueTwisters?.length || 0
    )

    return { isValid: issues.length === 0, issues, warnings, score }
  }

  private calculateScore(
    issues: ValidationIssue[],
    warnings: ValidationIssue[],
    wordCount: number,
    twisterCount: number
  ): number {
    let score = 100
    score -= issues.length * 15
    score -= warnings.length * 5
    if (wordCount >= this.MIN_WORDS) score += 5
    if (twisterCount >= this.MIN_TONGUE_TWISTERS) score += 5
    return Math.max(0, Math.min(100, score))
  }
}

// Export validator instances
export const dialogueValidator = new DialogueValidator()
export const discussionValidator = new DiscussionValidator()
export const grammarValidator = new GrammarValidator()
export const pronunciationValidator = new PronunciationValidator()
