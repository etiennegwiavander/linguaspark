import { NextRequest, NextResponse } from 'next/server'
import { getDialogueAvatars, enhanceDialogueWithAvatars } from '@/lib/avatar-utils'

export async function GET(request: NextRequest) {
  try {
    const testLessonId = 'test-lesson-123'
    
    // Test both sections
    const dialoguePracticeAvatars = getDialogueAvatars(testLessonId, 'dialoguePractice')
    const dialogueFillGapAvatars = getDialogueAvatars(testLessonId, 'dialogueFillGap')
    
    // Test with sample dialogue
    const sampleDialogue = [
      { character: 'Student', line: 'Hello, I want to learn.' },
      { character: 'Tutor', line: 'Great! Let me help you.' }
    ]
    
    const enhancedPractice = enhanceDialogueWithAvatars(sampleDialogue, testLessonId, 'dialoguePractice')
    const enhancedFillGap = enhanceDialogueWithAvatars(sampleDialogue, testLessonId, 'dialogueFillGap')
    
    const result = {
      lessonId: testLessonId,
      rawAvatars: {
        dialoguePractice: {
          student: dialoguePracticeAvatars.student.name,
          tutor: dialoguePracticeAvatars.tutor.name
        },
        dialogueFillGap: {
          student: dialogueFillGapAvatars.student.name,
          tutor: dialogueFillGapAvatars.tutor.name
        }
      },
      enhancedDialogue: {
        dialoguePractice: enhancedPractice.map(item => ({
          character: item.character,
          avatar: item.avatar?.name
        })),
        dialogueFillGap: enhancedFillGap.map(item => ({
          character: item.character,
          avatar: item.avatar?.name
        }))
      },
      areDifferent: {
        students: dialoguePracticeAvatars.student.name !== dialogueFillGapAvatars.student.name,
        tutors: dialoguePracticeAvatars.tutor.name !== dialogueFillGapAvatars.tutor.name
      }
    }
    
    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Avatar test error:', error)
    return NextResponse.json(
      { success: false, error: 'Avatar test failed', details: error.message },
      { status: 500 }
    )
  }
}