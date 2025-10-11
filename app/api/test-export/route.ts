import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  // Test lesson data that matches the expected structure
  const testLessonData = {
    lessonTitle: "Test Discussion Lesson",
    lessonType: "discussion",
    studentLevel: "B1",
    targetLanguage: "english",
    sections: {
      warmup: ["What is your favorite hobby?", "How do you spend your free time?"],
      vocabulary: [
        { 
          word: "hobby", 
          meaning: "an activity done for pleasure", 
          example: "Reading is my favorite hobby." 
        },
        { 
          word: "leisure", 
          meaning: "free time", 
          example: "I enjoy leisure activities on weekends." 
        }
      ],
      reading: "This is a sample reading passage about hobbies and leisure activities. It provides context for vocabulary and discussion topics.",
      comprehension: ["What is the main topic of the passage?", "Why are hobbies important for people?"],
      discussion: ["Do you think hobbies are important for mental health?", "How do hobbies help people relax and unwind?"],
      grammar: {
        focus: "Present Simple for habits and routines",
        examples: ["I play tennis every week.", "She reads books in her free time."],
        exercise: ["Complete: I ___ (play) football on Sundays.", "Transform to negative: He watches TV."]
      },
      pronunciation: {
        word: "hobby",
        ipa: "/ˈhɒbi/",
        practice: "The 'h' sound is aspirated at the beginning of the word."
      },
      wrapup: ["What new hobby would you like to try?", "How will you practice your English this week?"]
    }
  }

  const enabledSections = {
    warmup: true,
    vocabulary: true,
    reading: true,
    comprehension: true,
    discussion: true,
    grammar: true,
    pronunciation: true,
    wrapup: true
  }

  return NextResponse.json({
    success: true,
    testData: testLessonData,
    enabledSections: enabledSections,
    message: "Test data for export functionality"
  })
}