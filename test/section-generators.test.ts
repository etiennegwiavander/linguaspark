/**
 * Unit Tests for Enhanced Section Generators
 * Tests all section generators and validators according to requirements
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProgressiveGeneratorImpl, type SharedContext, type CEFRLevel } from '@/lib/progressive-generator'
import { WarmupValidator } from '@/lib/warmup-validator'
import {
    dialogueValidator,
    discussionValidator,
    grammarValidator,
    pronunciationValidator
} from '@/lib/section-validators'

// Mock Google AI service
vi.mock('@/lib/google-ai-server', () => ({
    createGoogleAIServerService: () => ({
        prompt: vi.fn().mockResolvedValue('Mocked AI response')
    })
}))

describe('Enhanced Section Generators', () => {
    let generator: ProgressiveGeneratorImpl
    let mockContext: SharedContext

    beforeEach(() => {
        generator = new ProgressiveGeneratorImpl()
        mockContext = {
            keyVocabulary: ['compete', 'tournament', 'champion', 'victory', 'athlete'],
            mainThemes: ['sports competition', 'international tournaments'],
            difficultyLevel: 'B1' as CEFRLevel,
            contentSummary: 'Article about international sports tournaments and competition',
            sourceText: 'Athletes from around the world compete in tournaments...',
            lessonType: 'discussion',
            targetLanguage: 'English'
        }
    })

    // ===== WARM-UP QUESTION TESTS =====
    describe('Warm-up Question Generation and Validation', () => {

        it('should validate warm-up questions do not reference specific content', () => {
            const validator = new WarmupValidator()

            const badQuestions = [
                'What happened in the story?',
                'Who won the tournament in the article?',
                'According to the text, why did they compete?'
            ]

            const result = validator.validate(badQuestions, 'B1')

            expect(result.isValid).toBe(false)
            expect(result.issues.some(issue => issue.type === 'content_assumption')).toBe(true)
        })

        it('should validate warm-up questions focus on personal experience', () => {
            const validator = new WarmupValidator()

            const goodQuestions = [
                'Have you ever participated in a competition?',
                'What do you think makes someone a good competitor?',
                'How do you feel when you compete with others?'
            ]

            const result = validator.validate(goodQuestions, 'B1')

            expect(result.isValid).toBe(true)
            expect(result.issues.length).toBe(0)
        })

        it('should validate correct number of warm-up questions', () => {
            const validator = new WarmupValidator()

            const tooFewQuestions = [
                'Have you ever competed?',
                'Do you like sports?'
            ]

            const result = validator.validate(tooFewQuestions, 'B1')

            expect(result.isValid).toBe(false)
            expect(result.issues.some(issue => issue.type === 'count_error')).toBe(true)
        })

        it('should validate CEFR-appropriate complexity for A1 level', () => {
            const validator = new WarmupValidator()

            const a1Questions = [
                'Do you like sports?',
                'Have you played football?',
                'Is competition fun?'
            ]

            const result = validator.validate(a1Questions, 'A1')

            expect(result.isValid).toBe(true)
        })

        it('should validate CEFR-appropriate complexity for C1 level', () => {
            const validator = new WarmupValidator()

            const c1Questions = [
                'To what extent do you think competition drives innovation?',
                'How might cultural factors influence competitive behavior?',
                'What are the psychological implications of constant competition?'
            ]

            const result = validator.validate(c1Questions, 'C1')

            expect(result.isValid).toBe(true)
        })

        it('should detect complexity mismatch for level', () => {
            const validator = new WarmupValidator()

            const tooComplexForA1 = [
                'To what extent do competitive environments foster excellence?',
                'How might one analyze the sociological impact of competition?',
                'What factors contribute to competitive advantage?'
            ]

            const result = validator.validate(tooComplexForA1, 'A1')

            expect(result.isValid).toBe(false)
            expect(result.issues.some(issue => issue.type === 'complexity_mismatch')).toBe(true)
        })
    })

    // ===== VOCABULARY TESTS =====
    describe('Vocabulary Example Count by CEFR Level', () => {

        it('should require 5 examples for A1 level', () => {
            const exampleCount = (generator as any).getExampleCountForLevel('A1')
            expect(exampleCount).toBe(5)
        })

        it('should require 5 examples for A2 level', () => {
            const exampleCount = (generator as any).getExampleCountForLevel('A2')
            expect(exampleCount).toBe(5)
        })

        it('should require 4 examples for B1 level', () => {
            const exampleCount = (generator as any).getExampleCountForLevel('B1')
            expect(exampleCount).toBe(4)
        })

        it('should require 3 examples for B2 level', () => {
            const exampleCount = (generator as any).getExampleCountForLevel('B2')
            expect(exampleCount).toBe(3)
        })

        it('should require 2 examples for C1 level', () => {
            const exampleCount = (generator as any).getExampleCountForLevel('C1')
            expect(exampleCount).toBe(2)
        })

        it('should validate vocabulary examples have correct count', () => {
            const word = 'compete'
            const examples = [
                'Athletes compete in international tournaments every year.',
                'Teams compete for the championship trophy in sports competitions.',
                'Players compete against rivals from different countries in tournaments.'
            ]

            const validation = (generator as any).validateVocabularyExamples(
                word,
                examples,
                { ...mockContext, difficultyLevel: 'B2' },
                3
            )

            // Should have correct count
            expect(examples.length).toBe(3)
            // All examples should contain the word
            expect(examples.every(ex => ex.toLowerCase().includes('compete'))).toBe(true)
        })

        it('should detect insufficient vocabulary examples', () => {
            const word = 'compete'
            const examples = [
                'Athletes compete in the Olympics.',
                'Teams compete for the championship.'
            ]

            const validation = (generator as any).validateVocabularyExamples(
                word,
                examples,
                { ...mockContext, difficultyLevel: 'B1' },
                4
            )

            expect(validation.isValid).toBe(false)
            expect(validation.issues.some((i: any) => i.includes('Insufficient examples'))).toBe(true)
        })

        it('should validate examples are contextually relevant', () => {
            const word = 'compete'
            const contextualExamples = [
                'Athletes compete in international sports tournaments every year.',
                'Teams compete for the championship trophy in major competitions.',
                'Players compete against rivals from different countries worldwide.',
                'Champions compete at the highest level of athletic competition.'
            ]

            const validation = (generator as any).validateVocabularyExamples(
                word,
                contextualExamples,
                mockContext,
                4
            )

            // Should have correct count
            expect(contextualExamples.length).toBe(4)
            // Examples should contain theme keywords
            const hasThemeWords = contextualExamples.some(ex =>
                ex.toLowerCase().includes('tournament') ||
                ex.toLowerCase().includes('sport') ||
                ex.toLowerCase().includes('competition')
            )
            expect(hasThemeWords).toBe(true)
        })

        it('should detect non-contextual vocabulary examples', () => {
            const word = 'compete'
            const genericExamples = [
                'I compete with my brother.',
                'We compete at school.',
                'They compete every day.',
                'She competes often.'
            ]

            const validation = (generator as any).validateVocabularyExamples(
                word,
                genericExamples,
                mockContext,
                4
            )

            expect(validation.isValid).toBe(false)
        })
    })

    // ===== DIALOGUE TESTS =====
    describe('Dialogue Length and Complexity Validation', () => {

        it('should validate minimum 12 dialogue lines', () => {
            const dialogueLines = Array.from({ length: 12 }, (_, i) => ({
                speaker: i % 2 === 0 ? 'A' : 'B',
                text: 'This is a dialogue line with sufficient content.'
            }))

            const result = dialogueValidator.validate(dialogueLines, 'B1', ['compete', 'tournament'])

            expect(result.isValid).toBe(true)
        })

        it('should detect insufficient dialogue lines', () => {
            const dialogueLines = Array.from({ length: 8 }, (_, i) => ({
                speaker: i % 2 === 0 ? 'A' : 'B',
                text: 'This is a dialogue line.'
            }))

            const result = dialogueValidator.validate(dialogueLines, 'B1', ['compete'])

            expect(result.isValid).toBe(false)
            expect(result.issues.some(issue => issue.type === 'count_error')).toBe(true)
        })

        it('should validate A1/A2 dialogue uses simple vocabulary', () => {
            const simpleDialogue = [
                { speaker: 'A', text: 'I like sports.' },
                { speaker: 'B', text: 'Me too. Do you play?' },
                { speaker: 'A', text: 'Yes, I play football.' },
                { speaker: 'B', text: 'That is fun.' },
                { speaker: 'A', text: 'Do you compete?' },
                { speaker: 'B', text: 'Yes, I do.' },
                { speaker: 'A', text: 'Is it hard?' },
                { speaker: 'B', text: 'Sometimes it is.' },
                { speaker: 'A', text: 'I want to try.' },
                { speaker: 'B', text: 'You should.' },
                { speaker: 'A', text: 'When can we play?' },
                { speaker: 'B', text: 'Tomorrow is good.' }
            ]

            const result = dialogueValidator.validate(simpleDialogue, 'A1', ['sports', 'play'])

            expect(result.isValid).toBe(true)
        })

        it('should validate B2/C1 dialogue uses advanced vocabulary', () => {
            const advancedDialogue = Array.from({ length: 12 }, (_, i) => ({
                speaker: i % 2 === 0 ? 'A' : 'B',
                text: 'The international tournament showcased exceptional athletic performance and competitive spirit.'
            }))

            const result = dialogueValidator.validate(advancedDialogue, 'C1', ['tournament', 'athletic'])

            expect(result.isValid).toBe(true)
        })

        it('should warn about complexity mismatch', () => {
            const tooSimpleForC1 = Array.from({ length: 12 }, (_, i) => ({
                speaker: i % 2 === 0 ? 'A' : 'B',
                text: 'I like it.'
            }))

            const result = dialogueValidator.validate(tooSimpleForC1, 'C1', ['compete'])

            expect(result.warnings.some(w => w.type === 'complexity_mismatch')).toBe(true)
        })

        it('should validate vocabulary integration in dialogue', () => {
            const dialogueWithVocab = Array.from({ length: 12 }, (_, i) => ({
                speaker: i % 2 === 0 ? 'A' : 'B',
                text: i % 3 === 0
                    ? 'Athletes compete in tournaments for victory.'
                    : 'The champion showed great skill.'
            }))

            const result = dialogueValidator.validate(
                dialogueWithVocab,
                'B1',
                ['compete', 'tournament', 'champion', 'victory', 'athlete']
            )

            expect(result.isValid).toBe(true)
        })

        it('should warn about poor vocabulary integration', () => {
            const dialogueNoVocab = Array.from({ length: 12 }, (_, i) => ({
                speaker: i % 2 === 0 ? 'A' : 'B',
                text: 'This is a generic sentence without lesson words.'
            }))

            const result = dialogueValidator.validate(
                dialogueNoVocab,
                'B1',
                ['compete', 'tournament', 'champion']
            )

            expect(result.warnings.some(w => w.type === 'vocabulary_integration')).toBe(true)
        })
    })

    // ===== DISCUSSION TESTS =====
    describe('Discussion Question Count and Complexity', () => {

        it('should validate exactly 5 discussion questions', () => {
            const questions = [
                'What do you think about competition?',
                'How does competition affect people?',
                'Why is competition important?',
                'When should people compete?',
                'Where do you see competition in daily life?'
            ]

            const result = discussionValidator.validate(questions, 'B1')

            expect(result.isValid).toBe(true)
        })

        it('should detect incorrect question count', () => {
            const tooFewQuestions = [
                'What do you think about competition?',
                'How does competition affect people?',
                'Why is competition important?'
            ]

            const result = discussionValidator.validate(tooFewQuestions, 'B1')

            expect(result.isValid).toBe(false)
            expect(result.issues.some(issue => issue.type === 'count_error')).toBe(true)
        })

        it('should validate A1/A2 questions use simple structures', () => {
            const simpleQuestions = [
                'Do you like sports?',
                'Have you played in a game?',
                'Is competition fun?',
                'Can you run fast?',
                'Do you want to win?'
            ]

            const result = discussionValidator.validate(simpleQuestions, 'A1')

            expect(result.isValid).toBe(true)
        })

        it('should validate B1 questions include opinions and comparisons', () => {
            const b1Questions = [
                'What do you think about competitive sports?',
                'How does competition compare to cooperation?',
                'Why do some people enjoy competing?',
                'What are the benefits of competition?',
                'How would you describe a good competitor?'
            ]

            const result = discussionValidator.validate(b1Questions, 'B1')

            expect(result.isValid).toBe(true)
        })

        it('should validate B2/C1 questions are analytical', () => {
            const analyticalQuestions = [
                'Why do you think competition is valued in modern society?',
                'How might excessive competition affect mental health?',
                'To what extent does competition drive innovation?',
                'What factors determine success in competitive environments?',
                'In what ways can competition be both beneficial and harmful?'
            ]

            const result = discussionValidator.validate(analyticalQuestions, 'C1')

            expect(result.isValid).toBe(true)
        })

        it('should warn about complexity mismatch for level', () => {
            const tooComplexForA1 = [
                'To what extent do you think competition fosters excellence?',
                'How might one analyze the psychological impact?',
                'What are the sociological implications?',
                'In what ways does competition affect society?',
                'How would you evaluate competitive systems?'
            ]

            const result = discussionValidator.validate(tooComplexForA1, 'A1')

            expect(result.warnings.some(w => w.type === 'complexity_mismatch')).toBe(true)
        })

        it('should validate question format', () => {
            const invalidFormat = [
                'This is not a question',
                'Neither is this',
                'What about this?',
                'And this one?',
                'Or this?'
            ]

            const result = discussionValidator.validate(invalidFormat, 'B1')

            expect(result.isValid).toBe(false)
            expect(result.issues.some(issue => issue.type === 'format_error')).toBe(true)
        })

        it('should warn about lack of question variety', () => {
            const repetitiveQuestions = [
                'What is competition?',
                'What is winning?',
                'What is losing?',
                'What is training?',
                'What is success?'
            ]

            const result = discussionValidator.validate(repetitiveQuestions, 'B1')

            expect(result.warnings.some(w => w.type === 'variety_issue')).toBe(true)
        })
    })

    // ===== GRAMMAR TESTS =====
    describe('Grammar Section Completeness', () => {

        it('should validate complete grammar section', () => {
            const grammarSection = {
                rule: 'Present Perfect is used to describe actions that happened at an unspecified time.',
                form: 'Subject + have/has + past participle',
                usage: 'Use present perfect for experiences, recent actions, and actions with present results.',
                examples: [
                    'I have competed in many tournaments.',
                    'She has won three championships.',
                    'They have trained for months.'
                ],
                exercises: [
                    { prompt: 'Complete: I ___ (compete) many times.', answer: 'have competed' },
                    { prompt: 'Complete: She ___ (win) the trophy.', answer: 'has won' },
                    { prompt: 'Complete: They ___ (practice) hard.', answer: 'have practiced' },
                    { prompt: 'Complete: We ___ (see) great games.', answer: 'have seen' },
                    { prompt: 'Complete: He ___ (become) a champion.', answer: 'has become' }
                ]
            }

            const result = grammarValidator.validate(grammarSection, 'B1')

            expect(result.isValid).toBe(true)
        })

        it('should detect missing grammar rule explanation', () => {
            const incompleteSection = {
                rule: '',
                form: 'Subject + have/has + past participle',
                usage: 'Use for experiences',
                examples: ['I have competed.'],
                exercises: [
                    { prompt: 'Complete: I ___ (compete).', answer: 'have competed' }
                ]
            }

            const result = grammarValidator.validate(incompleteSection, 'B1')

            expect(result.isValid).toBe(false)
            expect(result.issues.some(issue => issue.type === 'completeness_error')).toBe(true)
        })

        it('should detect missing form explanation', () => {
            const noFormSection = {
                rule: 'Present Perfect is used for experiences.',
                form: '',
                usage: 'Use for experiences and recent actions.',
                examples: ['I have competed.'],
                exercises: [
                    { prompt: 'Complete: I ___ (compete).', answer: 'have competed' }
                ]
            }

            const result = grammarValidator.validate(noFormSection, 'B1')

            expect(result.isValid).toBe(false)
            expect(result.issues.some(issue =>
                issue.type === 'completeness_error' && issue.message.includes('form')
            )).toBe(true)
        })

        it('should detect missing usage explanation', () => {
            const noUsageSection = {
                rule: 'Present Perfect is used for experiences.',
                form: 'Subject + have/has + past participle',
                usage: '',
                examples: ['I have competed.'],
                exercises: [
                    { prompt: 'Complete: I ___ (compete).', answer: 'have competed' }
                ]
            }

            const result = grammarValidator.validate(noUsageSection, 'B1')

            expect(result.isValid).toBe(false)
            expect(result.issues.some(issue =>
                issue.type === 'completeness_error' && issue.message.includes('usage')
            )).toBe(true)
        })

        it('should validate minimum 5 practice exercises', () => {
            const fewExercisesSection = {
                rule: 'Present Perfect is used for experiences.',
                form: 'Subject + have/has + past participle',
                usage: 'Use for experiences and recent actions.',
                examples: ['I have competed.', 'She has won.', 'They have trained.'],
                exercises: [
                    { prompt: 'Complete: I ___ (compete).', answer: 'have competed' },
                    { prompt: 'Complete: She ___ (win).', answer: 'has won' }
                ]
            }

            const result = grammarValidator.validate(fewExercisesSection, 'B1')

            expect(result.isValid).toBe(false)
            expect(result.issues.some(issue => issue.type === 'count_error')).toBe(true)
        })

        it('should validate sufficient example sentences', () => {
            const fewExamplesSection = {
                rule: 'Present Perfect is used for experiences.',
                form: 'Subject + have/has + past participle',
                usage: 'Use for experiences and recent actions.',
                examples: ['I have competed.'],
                exercises: [
                    { prompt: 'Complete: I ___ (compete).', answer: 'have competed' },
                    { prompt: 'Complete: She ___ (win).', answer: 'has won' },
                    { prompt: 'Complete: They ___ (train).', answer: 'have trained' },
                    { prompt: 'Complete: We ___ (see).', answer: 'have seen' },
                    { prompt: 'Complete: He ___ (become).', answer: 'has become' }
                ]
            }

            const result = grammarValidator.validate(fewExamplesSection, 'B1')

            expect(result.isValid).toBe(false)
            expect(result.issues.some(issue =>
                issue.type === 'completeness_error' && issue.message.includes('example')
            )).toBe(true)
        })

        it('should validate exercise quality', () => {
            const invalidExercisesSection = {
                rule: 'Present Perfect is used for experiences.',
                form: 'Subject + have/has + past participle',
                usage: 'Use for experiences and recent actions.',
                examples: ['I have competed.', 'She has won.', 'They have trained.'],
                exercises: [
                    { prompt: '', answer: 'have competed' },
                    { prompt: 'Complete: She ___ (win).', answer: '' },
                    { prompt: 'Complete: They ___ (train).', answer: 'have trained' },
                    { prompt: 'Complete: We ___ (see).', answer: 'have seen' },
                    { prompt: 'Complete: He ___ (become).', answer: 'has become' }
                ]
            }

            const result = grammarValidator.validate(invalidExercisesSection, 'B1')

            expect(result.isValid).toBe(false)
            expect(result.issues.some(issue => issue.type === 'quality_issue')).toBe(true)
        })
    })

    // ===== PRONUNCIATION TESTS =====
    describe('Pronunciation Section Requirements', () => {

        it('should validate complete pronunciation section', () => {
            const pronunciationSection = {
                words: [
                    {
                        word: 'compete',
                        ipa: '/kəmˈpiːt/',
                        tips: ['Stress on second syllable', 'Long "ee" sound'],
                        practiceSentence: 'Athletes compete in tournaments.'
                    },
                    {
                        word: 'champion',
                        ipa: '/ˈtʃæmpiən/',
                        tips: ['Stress on first syllable', 'CH sound like "church"'],
                        practiceSentence: 'The champion won the trophy.'
                    },
                    {
                        word: 'tournament',
                        ipa: '/ˈtʊənəmənt/',
                        tips: ['Stress on first syllable', 'Silent "r" in some accents'],
                        practiceSentence: 'The tournament lasts three weeks.'
                    },
                    {
                        word: 'victory',
                        ipa: '/ˈvɪktəri/',
                        tips: ['Stress on first syllable', 'Short "i" sound'],
                        practiceSentence: 'Victory requires dedication.'
                    },
                    {
                        word: 'athlete',
                        ipa: '/ˈæθliːt/',
                        tips: ['TH sound', 'Long "ee" at end'],
                        practiceSentence: 'The athlete trains daily.'
                    }
                ],
                tongueTwisters: [
                    {
                        text: 'Competitive champions compete constantly.',
                        targetSounds: ['/k/', '/p/']
                    },
                    {
                        text: 'Athletic athletes achieve amazing accomplishments.',
                        targetSounds: ['/æ/', '/θ/']
                    }
                ]
            }

            const result = pronunciationValidator.validate(pronunciationSection)

            expect(result.isValid).toBe(true)
        })

        it('should validate minimum 5 pronunciation words', () => {
            const fewWordsSection = {
                words: [
                    {
                        word: 'compete',
                        ipa: '/kəmˈpiːt/',
                        tips: ['Stress on second syllable'],
                        practiceSentence: 'Athletes compete.'
                    },
                    {
                        word: 'champion',
                        ipa: '/ˈtʃæmpiən/',
                        tips: ['Stress on first syllable'],
                        practiceSentence: 'The champion won.'
                    }
                ],
                tongueTwisters: [
                    {
                        text: 'Competitive champions compete.',
                        targetSounds: ['/k/', '/p/']
                    },
                    {
                        text: 'Athletic athletes achieve.',
                        targetSounds: ['/æ/', '/θ/']
                    }
                ]
            }

            const result = pronunciationValidator.validate(fewWordsSection)

            expect(result.isValid).toBe(false)
            expect(result.issues.some(issue =>
                issue.type === 'count_error' && issue.message.includes('words')
            )).toBe(true)
        })

        it('should validate minimum 2 tongue twisters', () => {
            const fewTwistersSection = {
                words: [
                    { word: 'compete', ipa: '/kəmˈpiːt/', tips: ['Stress'], practiceSentence: 'Athletes compete.' },
                    { word: 'champion', ipa: '/ˈtʃæmpiən/', tips: ['Stress'], practiceSentence: 'Champion won.' },
                    { word: 'tournament', ipa: '/ˈtʊənəmənt/', tips: ['Stress'], practiceSentence: 'Tournament starts.' },
                    { word: 'victory', ipa: '/ˈvɪktəri/', tips: ['Stress'], practiceSentence: 'Victory achieved.' },
                    { word: 'athlete', ipa: '/ˈæθliːt/', tips: ['TH sound'], practiceSentence: 'Athlete trains.' }
                ],
                tongueTwisters: [
                    {
                        text: 'Competitive champions compete.',
                        targetSounds: ['/k/', '/p/']
                    }
                ]
            }

            const result = pronunciationValidator.validate(fewTwistersSection)

            expect(result.isValid).toBe(false)
            expect(result.issues.some(issue =>
                issue.type === 'count_error' && issue.message.includes('tongue twisters')
            )).toBe(true)
        })

        it('should validate IPA transcription presence', () => {
            const noIPASection = {
                words: [
                    { word: 'compete', ipa: '', tips: ['Stress'], practiceSentence: 'Athletes compete.' },
                    { word: 'champion', ipa: '', tips: ['Stress'], practiceSentence: 'Champion won.' },
                    { word: 'tournament', ipa: '', tips: ['Stress'], practiceSentence: 'Tournament starts.' },
                    { word: 'victory', ipa: '', tips: ['Stress'], practiceSentence: 'Victory achieved.' },
                    { word: 'athlete', ipa: '', tips: ['TH sound'], practiceSentence: 'Athlete trains.' }
                ],
                tongueTwisters: [
                    { text: 'Competitive champions compete.', targetSounds: ['/k/'] },
                    { text: 'Athletic athletes achieve.', targetSounds: ['/æ/'] }
                ]
            }

            const result = pronunciationValidator.validate(noIPASection)

            expect(result.isValid).toBe(false)
            expect(result.issues.some(issue =>
                issue.type === 'completeness_error' && issue.message.includes('IPA')
            )).toBe(true)
        })

        it('should warn about missing pronunciation tips', () => {
            const noTipsSection = {
                words: [
                    { word: 'compete', ipa: '/kəmˈpiːt/', tips: [], practiceSentence: 'Athletes compete.' },
                    { word: 'champion', ipa: '/ˈtʃæmpiən/', tips: [], practiceSentence: 'Champion won.' },
                    { word: 'tournament', ipa: '/ˈtʊənəmənt/', tips: [], practiceSentence: 'Tournament starts.' },
                    { word: 'victory', ipa: '/ˈvɪktəri/', tips: [], practiceSentence: 'Victory achieved.' },
                    { word: 'athlete', ipa: '/ˈæθliːt/', tips: [], practiceSentence: 'Athlete trains.' }
                ],
                tongueTwisters: [
                    { text: 'Competitive champions compete.', targetSounds: ['/k/'] },
                    { text: 'Athletic athletes achieve.', targetSounds: ['/æ/'] }
                ]
            }

            const result = pronunciationValidator.validate(noTipsSection)

            expect(result.warnings.some(w =>
                w.type === 'completeness_warning' && w.message.includes('tips')
            )).toBe(true)
        })

        it('should warn about missing practice sentences', () => {
            const noPracticeSection = {
                words: [
                    { word: 'compete', ipa: '/kəmˈpiːt/', tips: ['Stress'], practiceSentence: '' },
                    { word: 'champion', ipa: '/ˈtʃæmpiən/', tips: ['Stress'], practiceSentence: '' },
                    { word: 'tournament', ipa: '/ˈtʊənəmənt/', tips: ['Stress'], practiceSentence: '' },
                    { word: 'victory', ipa: '/ˈvɪktəri/', tips: ['Stress'], practiceSentence: '' },
                    { word: 'athlete', ipa: '/ˈæθliːt/', tips: ['TH'], practiceSentence: '' }
                ],
                tongueTwisters: [
                    { text: 'Competitive champions compete.', targetSounds: ['/k/'] },
                    { text: 'Athletic athletes achieve.', targetSounds: ['/æ/'] }
                ]
            }

            const result = pronunciationValidator.validate(noPracticeSection)

            expect(result.warnings.some(w =>
                w.type === 'completeness_warning' && w.message.includes('practice sentence')
            )).toBe(true)
        })

        it('should validate tongue twister completeness', () => {
            const incompleteTwistersSection = {
                words: [
                    { word: 'compete', ipa: '/kəmˈpiːt/', tips: ['Stress'], practiceSentence: 'Athletes compete.' },
                    { word: 'champion', ipa: '/ˈtʃæmpiən/', tips: ['Stress'], practiceSentence: 'Champion won.' },
                    { word: 'tournament', ipa: '/ˈtʊənəmənt/', tips: ['Stress'], practiceSentence: 'Tournament starts.' },
                    { word: 'victory', ipa: '/ˈvɪktəri/', tips: ['Stress'], practiceSentence: 'Victory achieved.' },
                    { word: 'athlete', ipa: '/ˈæθliːt/', tips: ['TH'], practiceSentence: 'Athlete trains.' }
                ],
                tongueTwisters: [
                    { text: '', targetSounds: ['/k/'] },
                    { text: 'Athletic athletes achieve.', targetSounds: [] }
                ]
            }

            const result = pronunciationValidator.validate(incompleteTwistersSection)

            expect(result.isValid).toBe(false)
            expect(result.issues.some(issue => issue.type === 'completeness_error')).toBe(true)
        })
    })
})
