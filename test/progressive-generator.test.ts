import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProgressiveGeneratorImpl, type SharedContext, type LessonSection, type GeneratedSection, type CEFRLevel } from '../lib/progressive-generator'

// Mock the Google AI service
const mockPrompt = vi.fn()
vi.mock('../lib/google-ai-server', () => ({
    createGoogleAIServerService: () => ({
        prompt: mockPrompt
    })
}))

describe('ProgressiveGenerator', () => {
    let generator: ProgressiveGeneratorImpl

    beforeEach(() => {
        generator = new ProgressiveGeneratorImpl()
        
        // Reset all mocks
        vi.clearAllMocks()
    })

    describe('buildSharedContext', () => {
        it('should build shared context with AI-extracted data', async () => {
            // Mock AI responses
            mockPrompt
                .mockResolvedValueOnce('technology\ninnovation\ndigital\ncomputer\nsoftware\ninternet') // vocabulary
                .mockResolvedValueOnce('technology\ninnovation\ndigital transformation') // themes
                .mockResolvedValueOnce('This text discusses modern technology and its impact on society.') // summary

            const sourceText = 'Technology has revolutionized how we communicate and work in the digital age.'
            const context = await generator.buildSharedContext(sourceText, 'discussion', 'B1', 'English')

            expect(context).toEqual({
                keyVocabulary: ['technology', 'innovation', 'digital', 'computer', 'software', 'internet'],
                mainThemes: ['technology', 'innovation', 'digital transformation'],
                difficultyLevel: 'B1',
                contentSummary: 'This text discusses modern technology and its impact on society.',
                sourceText: sourceText.substring(0, 1000),
                lessonType: 'discussion',
                targetLanguage: 'English'
            })
        })

        it('should use fallback methods when AI extraction fails', async () => {
            // Mock AI failures
            mockPrompt.mockRejectedValue(new Error('API Error'))

            const sourceText = 'Business communication requires professional skills and effective strategies.'
            const context = await generator.buildSharedContext(sourceText, 'business', 'A2', 'English')

            expect(context.keyVocabulary).toEqual(expect.arrayContaining(['business', 'requires', 'professional', 'skills']))
            expect(context.mainThemes).toEqual(expect.arrayContaining(['business']))
            expect(context.difficultyLevel).toBe('A2')
            expect(context.lessonType).toBe('business')
        })
    })

    describe('generateSection', () => {
        let sharedContext: SharedContext

        beforeEach(() => {
            sharedContext = {
                keyVocabulary: ['technology', 'innovation', 'digital'],
                mainThemes: ['technology', 'innovation'],
                difficultyLevel: 'B1' as CEFRLevel,
                contentSummary: 'Technology discussion content',
                sourceText: 'Sample source text about technology',
                lessonType: 'discussion',
                targetLanguage: 'English'
            }
        })

        it('should generate warmup section', async () => {
            mockPrompt.mockResolvedValueOnce(
                'What do you think about modern technology?\nHow has technology changed your life?\nWhat are the benefits of digital innovation?'
            )

            const section: LessonSection = { name: 'warmup', priority: 1, dependencies: [] }
            const result = await generator.generateSection(section, sharedContext, [])

            expect(result.sectionName).toBe('warmup')
            expect(result.content).toEqual([
                'Have the following conversations or discussions with your tutor before reading the text:',
                'What do you think about modern technology?',
                'How has technology changed your life?',
                'What are the benefits of digital innovation?'
            ])
        })

        it('should generate vocabulary section', async () => {
            mockPrompt
                .mockResolvedValueOnce('Modern computing systems and devices') // definition for technology
                .mockResolvedValueOnce('Technology helps us communicate better.') // example for technology
                .mockResolvedValueOnce('New ideas and creative solutions') // definition for innovation
                .mockResolvedValueOnce('Innovation drives business success.') // example for innovation

            const section: LessonSection = { name: 'vocabulary', priority: 2, dependencies: [] }
            const result = await generator.generateSection(section, sharedContext, [])

            expect(result.sectionName).toBe('vocabulary')
            expect(result.content).toEqual([
                {
                    word: 'INSTRUCTION',
                    meaning: 'Study the following words with your tutor before reading the text:',
                    example: ''
                },
                {
                    word: 'Technology',
                    meaning: 'Modern computing systems and devices',
                    example: 'Technology helps us communicate better.'
                },
                {
                    word: 'Innovation',
                    meaning: 'New ideas and creative solutions',
                    example: 'Innovation drives business success.'
                }
            ])
        })

        it('should generate reading section', async () => {
            mockPrompt.mockResolvedValueOnce(
                'Technology has changed how we work and communicate. Digital innovation helps businesses grow and succeed.'
            )

            const section: LessonSection = { name: 'reading', priority: 3, dependencies: ['vocabulary'] }
            const result = await generator.generateSection(section, sharedContext, [])

            expect(result.sectionName).toBe('reading')
            expect(result.content).toContain('Read the following text carefully')
            expect(result.content).toContain('Technology has changed how we work')
        })

        it('should generate comprehension section', async () => {
            mockPrompt.mockResolvedValueOnce(
                'What is the main topic of the text?\nHow does technology help businesses?\nWhat are the benefits mentioned?\nWhy is innovation important?\nWhat examples are given?'
            )

            const section: LessonSection = { name: 'comprehension', priority: 4, dependencies: ['reading'] }
            const result = await generator.generateSection(section, sharedContext, [])

            expect(result.sectionName).toBe('comprehension')
            expect(result.content).toEqual([
                'After reading the text, answer these comprehension questions:',
                'What is the main topic of the text?',
                'How does technology help businesses?',
                'What are the benefits mentioned?',
                'Why is innovation important?',
                'What examples are given?'
            ])
        })

        it('should generate discussion section', async () => {
            mockPrompt.mockResolvedValueOnce(
                'How do you use technology in your daily life?\nWhat are the advantages and disadvantages of digital innovation?\nHow might technology change in the future?'
            )

            const section: LessonSection = { name: 'discussion', priority: 5, dependencies: ['comprehension'] }
            const result = await generator.generateSection(section, sharedContext, [])

            expect(result.sectionName).toBe('discussion')
            expect(result.content).toEqual([
                'Discuss these questions with your tutor to explore the topic in depth:',
                'How do you use technology in your daily life?',
                'What are the advantages and disadvantages of digital innovation?',
                'How might technology change in the future?'
            ])
        })

        it('should generate grammar section', async () => {
            mockPrompt.mockResolvedValueOnce(JSON.stringify({
                focus: 'Present Perfect Tense',
                examples: [
                    'Technology has changed our lives.',
                    'We have seen many innovations.',
                    'Digital tools have improved efficiency.'
                ],
                exercise: [
                    'Complete: Technology _____ (transform) business.',
                    'Complete: We _____ (develop) new solutions.',
                    'Complete: Innovation _____ (create) opportunities.'
                ]
            }))

            const section: LessonSection = { name: 'grammar', priority: 6, dependencies: [] }
            const result = await generator.generateSection(section, sharedContext, [])

            expect(result.sectionName).toBe('grammar')
            expect(result.content.focus).toBe('Present Perfect Tense')
            expect(result.content.examples).toHaveLength(3)
            expect(result.content.exercise).toHaveLength(3)
        })

        it('should generate pronunciation section', async () => {
            mockPrompt.mockResolvedValueOnce(JSON.stringify({
                word: 'technology',
                ipa: '/tekˈnɒlədʒi/',
                practice: 'Break it down: tech-no-lo-gy. Stress on the second syllable: tech-NO-lo-gy.'
            }))

            const section: LessonSection = { name: 'pronunciation', priority: 7, dependencies: [] }
            const result = await generator.generateSection(section, sharedContext, [])

            expect(result.sectionName).toBe('pronunciation')
            expect(result.content.word).toBe('technology')
            expect(result.content.ipa).toBe('/tekˈnɒlədʒi/')
            expect(result.content.practice).toContain('tech-NO-lo-gy')
        })

        it('should generate wrapup section', async () => {
            mockPrompt.mockResolvedValueOnce(
                'What did you learn about technology today?\nHow will you apply this knowledge?\nWhat questions do you still have?'
            )

            const section: LessonSection = { name: 'wrapup', priority: 8, dependencies: [] }
            const result = await generator.generateSection(section, sharedContext, [])

            expect(result.sectionName).toBe('wrapup')
            expect(result.content).toEqual([
                'Reflect on your learning by discussing these wrap-up questions:',
                'What did you learn about technology today?',
                'How will you apply this knowledge?',
                'What questions do you still have?'
            ])
        })

        it('should throw error for unknown section', async () => {
            const section: LessonSection = { name: 'unknown', priority: 1, dependencies: [] }

            await expect(generator.generateSection(section, sharedContext, []))
                .rejects.toThrow('Unknown section: unknown')
        })
    })

    describe('updateContext', () => {
        let sharedContext: SharedContext

        beforeEach(() => {
            sharedContext = {
                keyVocabulary: ['technology', 'innovation'],
                mainThemes: ['technology'],
                difficultyLevel: 'B1' as CEFRLevel,
                contentSummary: 'Technology discussion',
                sourceText: 'Sample text',
                lessonType: 'discussion',
                targetLanguage: 'English'
            }
        })

        it('should update context with vocabulary section', () => {
            const vocabularySection: GeneratedSection = {
                sectionName: 'vocabulary',
                content: [
                    { word: 'INSTRUCTION', meaning: 'Study these words', example: '' },
                    { word: 'digital', meaning: 'Electronic technology', example: 'Digital tools are useful.' },
                    { word: 'software', meaning: 'Computer programs', example: 'Software helps us work.' }
                ],
                tokensUsed: 100,
                generationStrategy: 'progressive'
            }

            const updatedContext = generator.updateContext(sharedContext, vocabularySection)

            expect(updatedContext.keyVocabulary).toEqual(
                expect.arrayContaining(['technology', 'innovation', 'digital', 'software'])
            )
        })

        it('should update context with reading section', () => {
            const readingSection: GeneratedSection = {
                sectionName: 'reading',
                content: 'This text discusses business communication and professional development.',
                tokensUsed: 150,
                generationStrategy: 'progressive'
            }

            const updatedContext = generator.updateContext(sharedContext, readingSection)

            expect(updatedContext.mainThemes).toEqual(
                expect.arrayContaining(['technology', 'business'])
            )
        })

        it('should not modify context for other sections', () => {
            const discussionSection: GeneratedSection = {
                sectionName: 'discussion',
                content: ['Question 1?', 'Question 2?'],
                tokensUsed: 80,
                generationStrategy: 'progressive'
            }

            const updatedContext = generator.updateContext(sharedContext, discussionSection)

            expect(updatedContext).toEqual(sharedContext)
        })
    })

    describe('error handling', () => {
        let sharedContext: SharedContext

        beforeEach(() => {
            sharedContext = {
                keyVocabulary: ['test'],
                mainThemes: ['testing'],
                difficultyLevel: 'B1' as CEFRLevel,
                contentSummary: 'Test content',
                sourceText: 'Test text',
                lessonType: 'test',
                targetLanguage: 'English'
            }
        })

        it('should handle AI service failures gracefully', async () => {
            mockPrompt.mockRejectedValue(new Error('API Error'))

            // The function should use fallbacks instead of throwing, so it should resolve
            const context = await generator.buildSharedContext('test text', 'discussion', 'B1', 'English')
            
            expect(context.keyVocabulary).toBeDefined()
            expect(context.mainThemes).toBeDefined()
            expect(context.difficultyLevel).toBe('B1')
            expect(context.lessonType).toBe('discussion')
        })

        it('should handle section generation failures', async () => {
            mockPrompt.mockRejectedValue(new Error('Generation failed'))

            const section: LessonSection = { name: 'warmup', priority: 1, dependencies: [] }

            await expect(generator.generateSection(section, sharedContext, []))
                .rejects.toThrow('Failed to generate warmup section')
        })

        it('should use fallback for grammar section when JSON parsing fails', async () => {
            mockPrompt.mockResolvedValueOnce('Invalid JSON response')

            const section: LessonSection = { name: 'grammar', priority: 1, dependencies: [] }
            const result = await generator.generateSection(section, sharedContext, [])

            expect(result.content.focus).toBe('Present Simple Tense')
            expect(result.content.examples).toHaveLength(3)
            expect(result.content.exercise).toHaveLength(3)
        })

        it('should use fallback for pronunciation section when JSON parsing fails', async () => {
            mockPrompt.mockResolvedValueOnce('Invalid JSON response')

            const section: LessonSection = { name: 'pronunciation', priority: 1, dependencies: [] }
            const result = await generator.generateSection(section, sharedContext, [])

            expect(result.content.word).toBe('test')
            expect(result.content.ipa).toBe('/kəˌmjuːnɪˈkeɪʃən/')
            expect(result.content.practice).toContain('com-mu-ni-ca-tion')
        })
    })

    describe('fallback methods', () => {
        it('should extract vocabulary using fallback method', async () => {
            mockPrompt.mockRejectedValue(new Error('API Error'))

            const sourceText = 'Business communication requires professional development and effective strategies for success.'
            const context = await generator.buildSharedContext(sourceText, 'business', 'B2', 'English')

            expect(context.keyVocabulary).toEqual(
                expect.arrayContaining(['business', 'requires', 'professional', 'development'])
            )
        })

        it('should extract themes using fallback method', async () => {
            mockPrompt.mockRejectedValue(new Error('API Error'))

            const sourceText = 'The company uses advanced technology and computer systems for business operations.'
            const context = await generator.buildSharedContext(sourceText, 'business', 'B2', 'English')

            expect(context.mainThemes).toEqual(
                expect.arrayContaining(['business', 'technology'])
            )
        })

        it('should use default themes when no patterns match', async () => {
            mockPrompt.mockRejectedValue(new Error('API Error'))

            const sourceText = 'Random text without specific themes or patterns.'
            const context = await generator.buildSharedContext(sourceText, 'general', 'A1', 'English')

            expect(context.mainThemes).toEqual(['general topic', 'communication', 'daily life'])
        })
    })
})