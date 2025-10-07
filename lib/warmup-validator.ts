import type { CEFRLevel } from './progressive-generator'

/**
 * Validation result for warm-up questions
 */
export interface WarmupValidationResult {
  isValid: boolean
  issues: ValidationIssue[]
  warnings: ValidationIssue[]
  score: number // 0-100 quality score
}

/**
 * Individual validation issue
 */
export interface ValidationIssue {
  type: 'content_assumption' | 'complexity_mismatch' | 'format_error' | 'count_error' | 'quality_issue'
  severity: 'error' | 'warning'
  message: string
  questionIndex?: number
  suggestion?: string
}

/**
 * Warm-up question validator
 * Validates that warm-up questions meet pedagogical requirements
 */
export class WarmupValidator {
  private readonly REQUIRED_QUESTION_COUNT = 3
  private readonly MIN_QUESTION_LENGTH = 10
  private readonly MAX_QUESTION_LENGTH = 200

  /**
   * Validate warm-up questions against all quality criteria
   */
  validate(questions: string[], cefrLevel: CEFRLevel, context?: { mainThemes?: string[] }): WarmupValidationResult {
    const issues: ValidationIssue[] = []
    const warnings: ValidationIssue[] = []

    // 1. Validate question count
    this.validateQuestionCount(questions, issues)

    // 2. Validate question format
    this.validateQuestionFormat(questions, issues, warnings)

    // 3. Validate no content assumptions
    this.validateNoContentAssumptions(questions, issues, warnings)

    // 4. Validate CEFR level appropriateness
    this.validateCEFRComplexity(questions, cefrLevel, issues, warnings)

    // 5. Validate pedagogical quality
    this.validatePedagogicalQuality(questions, issues, warnings)

    // Calculate quality score
    const score = this.calculateQualityScore(issues, warnings, questions.length)

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      score
    }
  }

  /**
   * Validate that we have the correct number of questions
   */
  private validateQuestionCount(questions: string[], issues: ValidationIssue[]): void {
    if (questions.length < this.REQUIRED_QUESTION_COUNT) {
      issues.push({
        type: 'count_error',
        severity: 'error',
        message: `Insufficient questions: expected ${this.REQUIRED_QUESTION_COUNT}, got ${questions.length}`,
        suggestion: 'Generate more questions to meet the requirement'
      })
    } else if (questions.length > this.REQUIRED_QUESTION_COUNT) {
      issues.push({
        type: 'count_error',
        severity: 'error',
        message: `Too many questions: expected ${this.REQUIRED_QUESTION_COUNT}, got ${questions.length}`,
        suggestion: 'Remove extra questions to meet the requirement'
      })
    }
  }

  /**
   * Validate question format (length, punctuation, structure)
   */
  private validateQuestionFormat(questions: string[], issues: ValidationIssue[], warnings: ValidationIssue[]): void {
    questions.forEach((question, index) => {
      // Check length
      if (question.length < this.MIN_QUESTION_LENGTH) {
        issues.push({
          type: 'format_error',
          severity: 'error',
          message: `Question ${index + 1} is too short (${question.length} characters)`,
          questionIndex: index,
          suggestion: 'Questions should be at least 10 characters long'
        })
      }

      if (question.length > this.MAX_QUESTION_LENGTH) {
        warnings.push({
          type: 'format_error',
          severity: 'warning',
          message: `Question ${index + 1} is very long (${question.length} characters)`,
          questionIndex: index,
          suggestion: 'Consider simplifying the question'
        })
      }

      // Check for question mark
      if (!question.endsWith('?')) {
        issues.push({
          type: 'format_error',
          severity: 'error',
          message: `Question ${index + 1} doesn't end with a question mark`,
          questionIndex: index,
          suggestion: 'Add a question mark at the end'
        })
      }

      // Check for question words
      const questionWords = ['what', 'when', 'where', 'who', 'why', 'how', 'do', 'does', 'did', 'have', 'has', 'is', 'are', 'can', 'could', 'would', 'should', 'will']
      const startsWithQuestionWord = questionWords.some(word => 
        question.toLowerCase().startsWith(word + ' ')
      )

      if (!startsWithQuestionWord) {
        warnings.push({
          type: 'format_error',
          severity: 'warning',
          message: `Question ${index + 1} doesn't start with a typical question word`,
          questionIndex: index,
          suggestion: 'Consider starting with What, How, Why, etc.'
        })
      }

      // Check for empty or whitespace-only content
      if (question.trim().length === 0) {
        issues.push({
          type: 'format_error',
          severity: 'error',
          message: `Question ${index + 1} is empty`,
          questionIndex: index,
          suggestion: 'Provide a valid question'
        })
      }
    })
  }

  /**
   * Validate that questions don't reference specific content details
   */
  private validateNoContentAssumptions(questions: string[], issues: ValidationIssue[], warnings: ValidationIssue[]): void {
    // Patterns that indicate content assumptions
    const contentAssumptionPatterns = [
      { pattern: /what happened/i, message: 'References specific events' },
      { pattern: /in the (text|story|article|passage|reading)/i, message: 'References the text directly' },
      { pattern: /according to (the )?(text|story|article|author)/i, message: 'References the text/author' },
      { pattern: /the author (said|wrote|mentioned|stated|explained)/i, message: 'References author statements' },
      { pattern: /do you remember/i, message: 'Assumes prior knowledge of content' },
      { pattern: /what did .+ do/i, message: 'References specific actions' },
      { pattern: /why did .+ happen/i, message: 'References specific events' },
      { pattern: /when did/i, message: 'References specific timing' },
      { pattern: /who (was|were|did)/i, message: 'References specific people' },
      { pattern: /which (person|character|event)/i, message: 'References specific content elements' },
      { pattern: /the (story|text|article|passage) (says|mentions|describes|tells)/i, message: 'References text content' },
      { pattern: /in this (story|text|article)/i, message: 'References the text' },
      { pattern: /from the (story|text|article)/i, message: 'References the text' }
    ]

    questions.forEach((question, index) => {
      for (const { pattern, message } of contentAssumptionPatterns) {
        if (pattern.test(question)) {
          issues.push({
            type: 'content_assumption',
            severity: 'error',
            message: `Question ${index + 1} assumes content knowledge: ${message}`,
            questionIndex: index,
            suggestion: 'Rephrase to focus on personal experience or general knowledge'
          })
          break // Only report first match per question
        }
      }

      // Check for proper names (potential content-specific references)
      const words = question.split(' ')
      const suspiciousCapitalizedWords = words.filter(word => 
        /^[A-Z][a-z]+$/.test(word) && 
        !this.isCommonQuestionWord(word) &&
        !this.isCommonNoun(word)
      )

      if (suspiciousCapitalizedWords.length > 0) {
        warnings.push({
          type: 'content_assumption',
          severity: 'warning',
          message: `Question ${index + 1} may contain proper names: ${suspiciousCapitalizedWords.join(', ')}`,
          questionIndex: index,
          suggestion: 'Verify these are not content-specific names'
        })
      }

      // Check for specific dates or numbers that might reference content
      if (/\b(19|20)\d{2}\b/.test(question)) {
        warnings.push({
          type: 'content_assumption',
          severity: 'warning',
          message: `Question ${index + 1} contains a specific year`,
          questionIndex: index,
          suggestion: 'Avoid referencing specific dates unless asking about general knowledge'
        })
      }
    })
  }

  /**
   * Validate CEFR level appropriateness
   */
  private validateCEFRComplexity(questions: string[], cefrLevel: CEFRLevel, issues: ValidationIssue[], warnings: ValidationIssue[]): void {
    const complexity = this.assessQuestionComplexity(questions)
    const expectedComplexity = this.getExpectedComplexity(cefrLevel)

    if (!expectedComplexity.includes(complexity)) {
      issues.push({
        type: 'complexity_mismatch',
        severity: 'error',
        message: `Questions are ${complexity} but ${cefrLevel} requires ${expectedComplexity.join(' or ')}`,
        suggestion: `Adjust question complexity to match ${cefrLevel} level`
      })
    }

    // Check vocabulary complexity
    questions.forEach((question, index) => {
      const vocabularyLevel = this.assessVocabularyLevel(question)
      
      if (vocabularyLevel === 'too_simple' && ['B2', 'C1'].includes(cefrLevel)) {
        warnings.push({
          type: 'complexity_mismatch',
          severity: 'warning',
          message: `Question ${index + 1} uses very simple vocabulary for ${cefrLevel} level`,
          questionIndex: index,
          suggestion: 'Consider using more sophisticated vocabulary'
        })
      }

      if (vocabularyLevel === 'too_complex' && ['A1', 'A2'].includes(cefrLevel)) {
        warnings.push({
          type: 'complexity_mismatch',
          severity: 'warning',
          message: `Question ${index + 1} may use vocabulary too advanced for ${cefrLevel} level`,
          questionIndex: index,
          suggestion: 'Simplify vocabulary for beginner level'
        })
      }
    })

    // Check sentence structure complexity
    questions.forEach((question, index) => {
      const structureComplexity = this.assessSentenceStructure(question)
      
      if (structureComplexity === 'complex' && ['A1', 'A2'].includes(cefrLevel)) {
        warnings.push({
          type: 'complexity_mismatch',
          severity: 'warning',
          message: `Question ${index + 1} has complex sentence structure for ${cefrLevel} level`,
          questionIndex: index,
          suggestion: 'Use simpler sentence structures'
        })
      }

      if (structureComplexity === 'simple' && cefrLevel === 'C1') {
        warnings.push({
          type: 'complexity_mismatch',
          severity: 'warning',
          message: `Question ${index + 1} has simple structure for ${cefrLevel} level`,
          questionIndex: index,
          suggestion: 'Consider using more sophisticated structures'
        })
      }
    })
  }

  /**
   * Validate pedagogical quality (activates prior knowledge, builds interest)
   */
  private validatePedagogicalQuality(questions: string[], issues: ValidationIssue[], warnings: ValidationIssue[]): void {
    // Check for personal experience focus
    const personalExperiencePatterns = [
      /have you (ever)?/i,
      /do you (think|believe|feel)/i,
      /what (is|are) your/i,
      /in your (opinion|experience)/i,
      /how do you/i
    ]

    let personalQuestionCount = 0
    questions.forEach((question, index) => {
      const hasPersonalFocus = personalExperiencePatterns.some(pattern => pattern.test(question))
      if (hasPersonalFocus) {
        personalQuestionCount++
      }
    })

    if (personalQuestionCount === 0) {
      warnings.push({
        type: 'quality_issue',
        severity: 'warning',
        message: 'No questions focus on personal experience',
        suggestion: 'Include questions that ask about student experiences or opinions'
      })
    }

    // Check for variety in question types
    const questionStarters = questions.map(q => {
      const firstWord = q.trim().split(' ')[0].toLowerCase()
      return firstWord
    })

    const uniqueStarters = new Set(questionStarters)
    if (uniqueStarters.size === 1 && questions.length > 1) {
      warnings.push({
        type: 'quality_issue',
        severity: 'warning',
        message: 'All questions start with the same word',
        suggestion: 'Vary question types for better engagement'
      })
    }

    // Check for yes/no questions (should have some open-ended)
    const yesNoPatterns = [
      /^do you/i,
      /^have you/i,
      /^is (it|there)/i,
      /^are (you|there)/i,
      /^can you/i,
      /^would you/i
    ]

    let yesNoCount = 0
    questions.forEach(question => {
      if (yesNoPatterns.some(pattern => pattern.test(question))) {
        yesNoCount++
      }
    })

    if (yesNoCount === questions.length) {
      warnings.push({
        type: 'quality_issue',
        severity: 'warning',
        message: 'All questions appear to be yes/no questions',
        suggestion: 'Include open-ended questions (What, How, Why) for deeper discussion'
      })
    }
  }

  /**
   * Assess overall question complexity
   */
  private assessQuestionComplexity(questions: string[]): 'simple' | 'intermediate' | 'advanced' {
    const allText = questions.join(' ').toLowerCase()
    
    // Advanced indicators
    const advancedPatterns = [
      /hypothetically/i,
      /in what ways/i,
      /to what extent/i,
      /how might/i,
      /what factors/i,
      /analyze/i,
      /evaluate/i,
      /compare and contrast/i,
      /what implications/i,
      /how would you assess/i
    ]
    
    // Intermediate indicators
    const intermediatePatterns = [
      /why do you think/i,
      /what would/i,
      /how could/i,
      /in your opinion/i,
      /do you believe/i,
      /what are the (advantages|disadvantages)/i,
      /how does .+ affect/i
    ]

    const advancedCount = advancedPatterns.filter(pattern => pattern.test(allText)).length
    const intermediateCount = intermediatePatterns.filter(pattern => pattern.test(allText)).length

    if (advancedCount >= 2) return 'advanced'
    if (advancedCount >= 1 || intermediateCount >= 2) return 'intermediate'
    return 'simple'
  }

  /**
   * Get expected complexity for CEFR level
   */
  private getExpectedComplexity(level: CEFRLevel): ('simple' | 'intermediate' | 'advanced')[] {
    const levelComplexityMap: Record<CEFRLevel, ('simple' | 'intermediate' | 'advanced')[]> = {
      'A1': ['simple'],
      'A2': ['simple'],
      'B1': ['simple', 'intermediate'],
      'B2': ['intermediate', 'advanced'],
      'C1': ['advanced', 'intermediate']
    }

    return levelComplexityMap[level]
  }

  /**
   * Assess vocabulary level in a question
   */
  private assessVocabularyLevel(question: string): 'too_simple' | 'appropriate' | 'too_complex' {
    const words = question.toLowerCase().split(/\s+/)
    
    // Very simple words
    const verySimpleWords = ['you', 'your', 'have', 'do', 'what', 'how', 'is', 'are', 'the', 'a', 'an', 'like', 'want', 'go', 'see', 'get']
    const simpleWordCount = words.filter(w => verySimpleWords.includes(w)).length
    const simpleRatio = simpleWordCount / words.length

    // Complex words (longer, less common)
    const complexWords = words.filter(w => w.length > 10 || /tion|sion|ment|ness|ity/.test(w))
    const complexRatio = complexWords.length / words.length

    if (simpleRatio > 0.8) return 'too_simple'
    if (complexRatio > 0.3) return 'too_complex'
    return 'appropriate'
  }

  /**
   * Assess sentence structure complexity
   */
  private assessSentenceStructure(question: string): 'simple' | 'moderate' | 'complex' {
    // Count clauses (rough estimate based on conjunctions and commas)
    const clauseIndicators = question.match(/,|and|but|or|because|although|if|when|while|which|that/gi)
    const clauseCount = clauseIndicators ? clauseIndicators.length + 1 : 1

    // Count words
    const wordCount = question.split(/\s+/).length

    if (clauseCount >= 3 || wordCount > 20) return 'complex'
    if (clauseCount === 2 || wordCount > 12) return 'moderate'
    return 'simple'
  }

  /**
   * Check if word is a common question word
   */
  private isCommonQuestionWord(word: string): boolean {
    const questionWords = ['What', 'When', 'Where', 'Who', 'Why', 'How', 'Do', 'Does', 'Did', 'Have', 'Has', 'Is', 'Are', 'Can', 'Could', 'Would', 'Should', 'Will', 'Which']
    return questionWords.includes(word)
  }

  /**
   * Check if word is a common noun that's typically capitalized
   */
  private isCommonNoun(word: string): boolean {
    const commonNouns = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    return commonNouns.includes(word)
  }

  /**
   * Calculate overall quality score
   */
  private calculateQualityScore(issues: ValidationIssue[], warnings: ValidationIssue[], questionCount: number): number {
    let score = 100

    // Deduct points for errors
    score -= issues.length * 20

    // Deduct points for warnings
    score -= warnings.length * 5

    // Bonus for correct question count
    if (questionCount === this.REQUIRED_QUESTION_COUNT) {
      score += 10
    }

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score))
  }
}
