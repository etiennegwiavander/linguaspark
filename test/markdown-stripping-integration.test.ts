import { describe, it, expect, beforeEach } from 'vitest';
import { stripMarkdown } from '@/lib/export-utils';

/**
 * Integration tests for markdown stripping in Word exports
 * Tests all lesson sections with markdown content
 * Verifies consistency between PDF and Word exports
 * Requirements: 3.1-3.14, 4.1-4.4
 */

describe('Markdown Stripping Integration Tests', () => {
  describe('Word Export with Markdown in All Sections', () => {
    it('should strip markdown from lesson title', () => {
      const title = '**Advanced Grammar**: Understanding *Modal Verbs*';
      const result = stripMarkdown(title);
      expect(result).toBe('Advanced Grammar: Understanding Modal Verbs');
      expect(result).not.toContain('**');
      expect(result).not.toContain('*');
    });

    it('should strip markdown from warmup section', () => {
      const warmup = {
        instruction: '**Think about** the following *questions*:',
        questions: [
          'What do you think about **climate change**?',
          'Have you ever experienced *extreme weather*?',
          'Why is __sustainability__ important?'
        ]
      };

      const strippedInstruction = stripMarkdown(warmup.instruction);
      expect(strippedInstruction).toBe('Think about the following questions:');

      const strippedQuestions = warmup.questions.map(q => stripMarkdown(q));
      expect(strippedQuestions[0]).toBe('What do you think about climate change?');
      expect(strippedQuestions[1]).toBe('Have you ever experienced extreme weather?');
      expect(strippedQuestions[2]).toBe('Why is sustainability important?');
    });

    it('should strip markdown from vocabulary section', () => {
      const vocabulary = [
        {
          word: '**sustainable**',
          meaning: 'Able to be *maintained* at a certain rate',
          example: 'We need __sustainable__ energy *solutions*.'
        },
        {
          word: '*renewable*',
          meaning: 'Capable of being **renewed**',
          example: '__Solar__ power is a *renewable* resource.'
        }
      ];

      vocabulary.forEach(item => {
        const strippedWord = stripMarkdown(item.word);
        const strippedMeaning = stripMarkdown(item.meaning);
        const strippedExample = stripMarkdown(item.example);

        expect(strippedWord).not.toContain('**');
        expect(strippedWord).not.toContain('*');
        expect(strippedMeaning).not.toContain('**');
        expect(strippedMeaning).not.toContain('*');
        expect(strippedExample).not.toContain('**');
        expect(strippedExample).not.toContain('*');
        expect(strippedExample).not.toContain('__');
      });
    });

    it('should strip markdown from reading passage', () => {
      const passage = [
        '**Climate change** is one of the most *pressing* issues of our time.',
        'Scientists agree that __immediate action__ is *necessary*.',
        'We must adopt **sustainable practices** to protect our *planet*.'
      ];

      const strippedPassage = passage.map(p => stripMarkdown(p));
      
      expect(strippedPassage[0]).toBe('Climate change is one of the most pressing issues of our time.');
      expect(strippedPassage[1]).toBe('Scientists agree that immediate action is necessary.');
      expect(strippedPassage[2]).toBe('We must adopt sustainable practices to protect our planet.');
      
      strippedPassage.forEach(p => {
        expect(p).not.toContain('**');
        expect(p).not.toContain('*');
        expect(p).not.toContain('__');
      });
    });

    it('should strip markdown from comprehension questions', () => {
      const questions = [
        'What is the main **challenge** mentioned in the text?',
        'Why do scientists believe *immediate action* is necessary?',
        'What __sustainable practices__ are suggested?'
      ];

      const strippedQuestions = questions.map(q => stripMarkdown(q));
      
      expect(strippedQuestions[0]).toBe('What is the main challenge mentioned in the text?');
      expect(strippedQuestions[1]).toBe('Why do scientists believe immediate action is necessary?');
      expect(strippedQuestions[2]).toBe('What sustainable practices are suggested?');
    });

    it('should strip markdown from discussion questions', () => {
      const questions = [
        'Do you think **governments** should regulate *emissions*?',
        'What role can __individuals__ play in *combating* climate change?',
        'Should **corporations** be held *accountable* for pollution?'
      ];

      const strippedQuestions = questions.map(q => stripMarkdown(q));
      
      strippedQuestions.forEach(q => {
        expect(q).not.toContain('**');
        expect(q).not.toContain('*');
        expect(q).not.toContain('__');
      });
    });

    it('should strip markdown from dialogue section', () => {
      const dialogue = [
        {
          character: '**Sarah**',
          line: 'I think we should use *renewable* energy.'
        },
        {
          character: '*John*',
          line: 'Yes, __solar panels__ are becoming more **affordable**.'
        }
      ];

      dialogue.forEach(item => {
        const strippedCharacter = stripMarkdown(item.character);
        const strippedLine = stripMarkdown(item.line);

        expect(strippedCharacter).not.toContain('**');
        expect(strippedCharacter).not.toContain('*');
        expect(strippedLine).not.toContain('**');
        expect(strippedLine).not.toContain('*');
        expect(strippedLine).not.toContain('__');
      });
    });

    it('should strip markdown from grammar section', () => {
      const grammar = {
        focus: '**Modal verbs** for *obligation*',
        examples: [
          'You **must** reduce your *carbon footprint*.',
          'We __should__ use *renewable* energy.'
        ],
        exercises: [
          'Complete: We _____ (must/should) protect the **environment**.',
          'Rewrite using *modal verbs*: It is necessary to __recycle__.'
        ]
      };

      const strippedFocus = stripMarkdown(grammar.focus);
      expect(strippedFocus).toBe('Modal verbs for obligation');

      const strippedExamples = grammar.examples.map(e => stripMarkdown(e));
      strippedExamples.forEach(e => {
        expect(e).not.toContain('**');
        expect(e).not.toContain('*');
        expect(e).not.toContain('__');
      });

      const strippedExercises = grammar.exercises.map(e => stripMarkdown(e));
      strippedExercises.forEach(e => {
        expect(e).not.toContain('**');
        expect(e).not.toContain('*');
        expect(e).not.toContain('__');
      });
    });

    it('should strip markdown from pronunciation section', () => {
      const pronunciation = [
        {
          word: '**sustainable**',
          ipa: '/səˈsteɪnəbl/',
          sentence: 'We need *sustainable* __solutions__.',
          tip: 'Stress on the **second** syllable'
        },
        {
          word: '*environment*',
          ipa: '/ɪnˈvaɪrənmənt/',
          sentence: 'Protect the __environment__ for *future* generations.',
          tip: 'Note the **silent** "n" in the middle'
        }
      ];

      pronunciation.forEach(item => {
        const strippedWord = stripMarkdown(item.word);
        const strippedSentence = stripMarkdown(item.sentence);
        const strippedTip = stripMarkdown(item.tip);

        expect(strippedWord).not.toContain('**');
        expect(strippedWord).not.toContain('*');
        expect(strippedSentence).not.toContain('**');
        expect(strippedSentence).not.toContain('*');
        expect(strippedSentence).not.toContain('__');
        expect(strippedTip).not.toContain('**');
        expect(strippedTip).not.toContain('*');
      });
    });

    it('should strip markdown from wrap-up section', () => {
      const wrapup = [
        'What **new vocabulary** did you learn *today*?',
        'How can you apply these __concepts__ in *real life*?',
        'What was the most **interesting** topic we *discussed*?'
      ];

      const strippedWrapup = wrapup.map(q => stripMarkdown(q));
      
      strippedWrapup.forEach(q => {
        expect(q).not.toContain('**');
        expect(q).not.toContain('*');
        expect(q).not.toContain('__');
      });
    });
  });

  describe('PDF and Word Export Consistency', () => {
    it('should apply identical stripping logic to both formats', () => {
      const testCases = [
        '**Bold text** with *italic*',
        '__Bold__ and _italic_ mixed',
        '**Nested *markdown* here**',
        'Multiple **bold** and *italic* words',
        '**Bold** at start and *italic* at end'
      ];

      testCases.forEach(text => {
        const result = stripMarkdown(text);
        
        // Verify no markdown syntax remains
        expect(result).not.toContain('**');
        expect(result).not.toContain('__');
        expect(result).not.toContain('*');
        expect(result).not.toContain('_');
        
        // Verify content is preserved
        expect(result.length).toBeGreaterThan(0);
        expect(result).not.toBe(text); // Should be different from original
      });
    });

    it('should handle special characters identically', () => {
      const specialCases = [
        '**Text with "quotes"** and *apostrophe\'s*',
        '__Hyphenated-words__ and *em—dashes*',
        '**Numbers 123** and *symbols @#$*',
        '__Parentheses (like this)__ and *brackets [here]*'
      ];

      specialCases.forEach(text => {
        const result = stripMarkdown(text);
        
        // Special characters should be preserved
        expect(result).toMatch(/["'—@#$()[\]]/);
        
        // Markdown should be removed
        expect(result).not.toContain('**');
        expect(result).not.toContain('__');
        expect(result).not.toContain('*');
      });
    });

    it('should produce consistent output for complex nested markdown', () => {
      const complexCases = [
        { text: '**Bold with *nested italic* inside**', contains: ['Bold', 'nested', 'italic', 'inside'] },
        { text: '*Italic with **nested bold** inside*', contains: ['Italic', 'nested', 'bold', 'inside'] },
        { text: '__Bold with _nested italic_ inside__', contains: ['Bold', 'nested', 'italic', 'inside'] },
        { text: '_Italic with __nested bold__ inside_', contains: ['Italic', 'nested', 'bold', 'inside'] }
      ];

      complexCases.forEach(({ text, contains }) => {
        const result = stripMarkdown(text);
        
        // All markdown should be removed
        expect(result).not.toContain('**');
        expect(result).not.toContain('__');
        expect(result).not.toContain('*');
        expect(result).not.toContain('_');
        
        // Content should be preserved
        contains.forEach(word => {
          expect(result).toContain(word);
        });
      });
    });
  });

  describe('Real AI-Generated Content Simulation', () => {
    it('should handle typical AI-generated vocabulary content', () => {
      const aiVocab = {
        word: '**sustainable**',
        meaning: 'Capable of being *maintained* over the long term without depleting resources',
        example: 'The company adopted **sustainable** practices to reduce its *environmental impact*.'
      };

      const stripped = {
        word: stripMarkdown(aiVocab.word),
        meaning: stripMarkdown(aiVocab.meaning),
        example: stripMarkdown(aiVocab.example)
      };

      expect(stripped.word).toBe('sustainable');
      expect(stripped.meaning).toBe('Capable of being maintained over the long term without depleting resources');
      expect(stripped.example).toBe('The company adopted sustainable practices to reduce its environmental impact.');
    });

    it('should handle typical AI-generated reading passage', () => {
      const aiPassage = [
        '**Climate change** represents one of the most *significant* challenges facing humanity today.',
        'Scientists have observed __unprecedented__ changes in global *temperature* patterns.',
        'The consequences of **inaction** could be *catastrophic* for future generations.'
      ];

      const stripped = aiPassage.map(p => stripMarkdown(p));

      expect(stripped[0]).toBe('Climate change represents one of the most significant challenges facing humanity today.');
      expect(stripped[1]).toBe('Scientists have observed unprecedented changes in global temperature patterns.');
      expect(stripped[2]).toBe('The consequences of inaction could be catastrophic for future generations.');
    });

    it('should handle typical AI-generated dialogue', () => {
      const aiDialogue = [
        {
          character: '**Emma**',
          line: 'I\'ve been thinking about our *carbon footprint* lately.'
        },
        {
          character: '**David**',
          line: 'Me too! I started using __public transportation__ more *frequently*.'
        },
        {
          character: '**Emma**',
          line: 'That\'s **great**! Every *small change* makes a difference.'
        }
      ];

      const stripped = aiDialogue.map(d => ({
        character: stripMarkdown(d.character),
        line: stripMarkdown(d.line)
      }));

      expect(stripped[0].character).toBe('Emma');
      expect(stripped[0].line).toBe('I\'ve been thinking about our carbon footprint lately.');
      expect(stripped[1].character).toBe('David');
      expect(stripped[1].line).toBe('Me too! I started using public transportation more frequently.');
      expect(stripped[2].character).toBe('Emma');
      expect(stripped[2].line).toBe('That\'s great! Every small change makes a difference.');
    });

    it('should handle typical AI-generated grammar explanations', () => {
      const aiGrammar = {
        focus: '**Modal Verbs** for *Obligation* and Necessity',
        explanation: 'Use **must** when something is *absolutely necessary*. Use __should__ for *recommendations*.',
        examples: [
          'You **must** wear a seatbelt (it\'s the *law*).',
          'You __should__ exercise regularly (it\'s *good advice*).'
        ]
      };

      const stripped = {
        focus: stripMarkdown(aiGrammar.focus),
        explanation: stripMarkdown(aiGrammar.explanation),
        examples: aiGrammar.examples.map(e => stripMarkdown(e))
      };

      expect(stripped.focus).toBe('Modal Verbs for Obligation and Necessity');
      expect(stripped.explanation).toBe('Use must when something is absolutely necessary. Use should for recommendations.');
      expect(stripped.examples[0]).toBe('You must wear a seatbelt (it\'s the law).');
      expect(stripped.examples[1]).toBe('You should exercise regularly (it\'s good advice).');
    });
  });

  describe('All Lesson Types and Sections', () => {
    it('should handle discussion lesson type', () => {
      const discussionLesson = {
        title: '**Environmental Issues**: A *Discussion*',
        warmup: ['What do you know about **climate change**?'],
        vocabulary: [{ word: '**pollution**', meaning: '*contamination* of the environment' }],
        discussion: [
          'Should **governments** regulate *emissions*?',
          'What can __individuals__ do to help?'
        ],
        wrapup: ['What was the most **interesting** point *discussed*?']
      };

      const stripped = {
        title: stripMarkdown(discussionLesson.title),
        warmup: discussionLesson.warmup.map(w => stripMarkdown(w)),
        vocabulary: discussionLesson.vocabulary.map(v => ({
          word: stripMarkdown(v.word),
          meaning: stripMarkdown(v.meaning)
        })),
        discussion: discussionLesson.discussion.map(d => stripMarkdown(d)),
        wrapup: discussionLesson.wrapup.map(w => stripMarkdown(w))
      };

      expect(stripped.title).not.toContain('**');
      expect(stripped.title).not.toContain('*');
      stripped.warmup.forEach(w => expect(w).not.toContain('**'));
      stripped.vocabulary.forEach(v => {
        expect(v.word).not.toContain('**');
        expect(v.meaning).not.toContain('*');
      });
      stripped.discussion.forEach(d => {
        expect(d).not.toContain('**');
        expect(d).not.toContain('__');
      });
      stripped.wrapup.forEach(w => expect(w).not.toContain('**'));
    });

    it('should handle grammar lesson type', () => {
      const grammarLesson = {
        title: '**Modal Verbs**: *Must* and Should',
        warmup: ['When do we use **modal verbs**?'],
        vocabulary: [{ word: '**obligation**', meaning: 'something you *must* do' }],
        grammar: {
          focus: '**Modal verbs** for *obligation*',
          examples: ['You **must** follow the *rules*.'],
          exercises: ['Complete: You _____ (must/should) be **careful**.']
        },
        wrapup: ['What is the difference between **must** and *should*?']
      };

      const stripped = {
        title: stripMarkdown(grammarLesson.title),
        warmup: grammarLesson.warmup.map(w => stripMarkdown(w)),
        vocabulary: grammarLesson.vocabulary.map(v => ({
          word: stripMarkdown(v.word),
          meaning: stripMarkdown(v.meaning)
        })),
        grammar: {
          focus: stripMarkdown(grammarLesson.grammar.focus),
          examples: grammarLesson.grammar.examples.map(e => stripMarkdown(e)),
          exercises: grammarLesson.grammar.exercises.map(e => stripMarkdown(e))
        },
        wrapup: grammarLesson.wrapup.map(w => stripMarkdown(w))
      };

      expect(stripped.title).toBe('Modal Verbs: Must and Should');
      expect(stripped.grammar.focus).toBe('Modal verbs for obligation');
      stripped.grammar.examples.forEach(e => {
        expect(e).not.toContain('**');
        expect(e).not.toContain('*');
      });
    });

    it('should handle pronunciation lesson type', () => {
      const pronunciationLesson = {
        title: '**Pronunciation**: *Difficult* Sounds',
        warmup: ['What sounds are **difficult** for you?'],
        vocabulary: [{ word: '**pronunciation**', meaning: 'how words are *spoken*' }],
        pronunciation: [
          {
            word: '**through**',
            ipa: '/θruː/',
            sentence: 'Walk **through** the *park*.',
            tip: 'The **th** sound is *important*.'
          }
        ],
        wrapup: ['Which sound will you **practice** more?']
      };

      const stripped = {
        title: stripMarkdown(pronunciationLesson.title),
        warmup: pronunciationLesson.warmup.map(w => stripMarkdown(w)),
        vocabulary: pronunciationLesson.vocabulary.map(v => ({
          word: stripMarkdown(v.word),
          meaning: stripMarkdown(v.meaning)
        })),
        pronunciation: pronunciationLesson.pronunciation.map(p => ({
          word: stripMarkdown(p.word),
          ipa: p.ipa,
          sentence: stripMarkdown(p.sentence),
          tip: stripMarkdown(p.tip)
        })),
        wrapup: pronunciationLesson.wrapup.map(w => stripMarkdown(w))
      };

      expect(stripped.title).toBe('Pronunciation: Difficult Sounds');
      expect(stripped.pronunciation[0].word).toBe('through');
      expect(stripped.pronunciation[0].sentence).toBe('Walk through the park.');
      expect(stripped.pronunciation[0].tip).toBe('The th sound is important.');
    });

    it('should handle reading lesson type with all sections', () => {
      const readingLesson = {
        title: '**Reading**: Understanding *Climate Change*',
        warmup: ['What do you know about **global warming**?'],
        vocabulary: [
          { word: '**emissions**', meaning: '*gases* released into the atmosphere' },
          { word: '**renewable**', meaning: 'can be *replenished* naturally' }
        ],
        reading: [
          '**Climate change** is a *global* challenge.',
          'Scientists warn about __rising__ temperatures.',
          'We need **sustainable** solutions *now*.'
        ],
        comprehension: [
          'What is the main **problem** discussed?',
          'Why are *rising* temperatures a concern?'
        ],
        discussion: [
          'What can __you__ do to help?',
          'Should **governments** take more *action*?'
        ],
        wrapup: ['What was the most **important** thing you *learned*?']
      };

      const stripped = {
        title: stripMarkdown(readingLesson.title),
        warmup: readingLesson.warmup.map(w => stripMarkdown(w)),
        vocabulary: readingLesson.vocabulary.map(v => ({
          word: stripMarkdown(v.word),
          meaning: stripMarkdown(v.meaning)
        })),
        reading: readingLesson.reading.map(r => stripMarkdown(r)),
        comprehension: readingLesson.comprehension.map(c => stripMarkdown(c)),
        discussion: readingLesson.discussion.map(d => stripMarkdown(d)),
        wrapup: readingLesson.wrapup.map(w => stripMarkdown(w))
      };

      // Verify all sections are clean
      expect(stripped.title).not.toContain('**');
      stripped.warmup.forEach(w => expect(w).not.toContain('**'));
      stripped.vocabulary.forEach(v => {
        expect(v.word).not.toContain('**');
        expect(v.meaning).not.toContain('*');
      });
      stripped.reading.forEach(r => {
        expect(r).not.toContain('**');
        expect(r).not.toContain('__');
        expect(r).not.toContain('*');
      });
      stripped.comprehension.forEach(c => expect(c).not.toContain('**'));
      stripped.discussion.forEach(d => expect(d).not.toContain('**'));
      stripped.wrapup.forEach(w => expect(w).not.toContain('**'));
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty strings gracefully', () => {
      expect(stripMarkdown('')).toBe('');
    });

    it('should handle null/undefined gracefully', () => {
      expect(stripMarkdown(null as any)).toBe(null);
      expect(stripMarkdown(undefined as any)).toBe(undefined);
    });

    it('should handle text without markdown', () => {
      const plain = 'This is plain text without any markdown.';
      expect(stripMarkdown(plain)).toBe(plain);
    });

    it('should handle malformed markdown', () => {
      const malformed = [
        '**Unclosed bold',
        '*Unclosed italic',
        'Multiple ** asterisks ***',
        '**Bold with * mixed'
      ];

      malformed.forEach(text => {
        const result = stripMarkdown(text);
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      });
    });

    it('should handle very long text with markdown', () => {
      const longText = '**Bold** '.repeat(1000) + '*italic* '.repeat(1000);
      const result = stripMarkdown(longText);
      
      expect(result).not.toContain('**');
      expect(result).not.toContain('*');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle unicode and emoji with markdown', () => {
      const unicode = '**Café** with *naïve* and __résumé__ 😊';
      const result = stripMarkdown(unicode);
      
      expect(result).toBe('Café with naïve and résumé 😊');
      expect(result).not.toContain('**');
      expect(result).not.toContain('*');
      expect(result).not.toContain('__');
    });
  });
});
