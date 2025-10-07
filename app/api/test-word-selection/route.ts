import { NextResponse } from 'next/server'

// Simplified test that directly tests the word selection algorithm
export async function POST(request: Request) {
  try {
    const { vocabulary } = await request.json()

    if (!vocabulary || !Array.isArray(vocabulary)) {
      return NextResponse.json(
        { error: 'Missing required field: vocabulary (array of words)' },
        { status: 400 }
      )
    }

    console.log('🧪 Testing word selection algorithm...')
    console.log('Input vocabulary:', vocabulary)

    // Replicate the selectChallengingWords logic
    const scoredWords = vocabulary.map(word => {
      let score = 0
      const wordLower = word.toLowerCase()
      const challengingSounds: string[] = []
      
      // Base score: Longer words
      score += Math.min(word.length, 12)
      
      // Consonant digraphs and difficult consonant sounds
      const consonantPatterns = [
        { pattern: /th/gi, sound: '/θ/ or /ð/', weight: 5 },
        { pattern: /ch/gi, sound: '/tʃ/', weight: 4 },
        { pattern: /sh/gi, sound: '/ʃ/', weight: 4 },
        { pattern: /ph/gi, sound: '/f/', weight: 3 },
        { pattern: /gh/gi, sound: '/g/ or /f/', weight: 4 },
        { pattern: /ng/gi, sound: '/ŋ/', weight: 3 },
        { pattern: /wh/gi, sound: '/w/ or /hw/', weight: 3 },
        { pattern: /[^aeiou]r/gi, sound: '/r/', weight: 4 },
      ]
      
      consonantPatterns.forEach(({ pattern, sound, weight }) => {
        const matches = wordLower.match(pattern)
        if (matches) {
          score += weight * matches.length
          challengingSounds.push(sound)
        }
      })
      
      // Complex vowel combinations
      const vowelPatterns = [
        { pattern: /ough|augh/gi, sound: '/ɔː/ or /ʌf/', weight: 5 },
        { pattern: /eau/gi, sound: '/oʊ/', weight: 4 },
        { pattern: /ou/gi, sound: '/aʊ/ or /uː/', weight: 3 },
        { pattern: /oo/gi, sound: '/uː/ or /ʊ/', weight: 3 },
        { pattern: /ea/gi, sound: '/iː/ or /e/', weight: 3 },
        { pattern: /au|aw/gi, sound: '/ɔː/', weight: 3 },
        { pattern: /oi|oy/gi, sound: '/ɔɪ/', weight: 3 },
      ]
      
      vowelPatterns.forEach(({ pattern, sound, weight }) => {
        const matches = wordLower.match(pattern)
        if (matches) {
          score += weight * matches.length
          challengingSounds.push(sound)
        }
      })
      
      // Silent letters
      const silentLetterPatterns = [
        { pattern: /\bkn/gi, sound: 'silent k', weight: 5 },
        { pattern: /\bgn/gi, sound: 'silent g', weight: 5 },
        { pattern: /\bwr/gi, sound: 'silent w', weight: 5 },
        { pattern: /mb$/gi, sound: 'silent b', weight: 4 },
        { pattern: /lm$/gi, sound: 'silent l', weight: 4 },
        { pattern: /lk$/gi, sound: 'silent l', weight: 4 },
      ]
      
      silentLetterPatterns.forEach(({ pattern, sound, weight }) => {
        if (pattern.test(wordLower)) {
          score += weight
          challengingSounds.push(sound)
        }
      })
      
      // Consonant clusters
      const clusterMatches = wordLower.match(/[^aeiou]{3,}/gi)
      if (clusterMatches) {
        score += 3 * clusterMatches.length
        challengingSounds.push('consonant cluster')
      }
      
      return { 
        word, 
        score, 
        challengingSounds: [...new Set(challengingSounds)] 
      }
    })
    
    // Sort by score
    const sortedWords = scoredWords.sort((a, b) => b.score - a.score)
    
    // Select top 5 with diversity
    const selectedWords: typeof scoredWords = []
    const selectedSounds = new Set<string>()
    
    for (const item of sortedWords) {
      if (selectedWords.length >= 5) break
      
      const newSounds = item.challengingSounds.filter(s => !selectedSounds.has(s))
      
      if (newSounds.length > 0 || selectedWords.length < 3) {
        selectedWords.push(item)
        item.challengingSounds.forEach(s => selectedSounds.add(s))
      }
    }
    
    // Fill remaining slots
    if (selectedWords.length < 5) {
      for (const item of sortedWords) {
        if (selectedWords.length >= 5) break
        if (!selectedWords.find(w => w.word === item.word)) {
          selectedWords.push(item)
        }
      }
    }

    return NextResponse.json({
      success: true,
      allWords: sortedWords,
      selectedWords: selectedWords,
      uniqueSounds: Array.from(selectedSounds),
      summary: {
        totalWords: vocabulary.length,
        selectedCount: selectedWords.length,
        uniqueSoundsCount: selectedSounds.size,
        averageScore: selectedWords.reduce((sum, w) => sum + w.score, 0) / selectedWords.length
      }
    })

  } catch (error) {
    console.error('❌ Test failed:', error)
    return NextResponse.json(
      { 
        error: 'Test failed', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
