-- Insert a Test Lesson
-- Run this in Supabase SQL Editor after replacing YOUR_USER_ID

-- First, check your user ID
SELECT id, email FROM auth.users;

-- Then, ensure you have a tutor profile (replace YOUR_USER_ID with actual ID from above)
INSERT INTO tutors (id, email)
VALUES (
    'YOUR_USER_ID',  -- Replace with your actual user ID
    'your-email@example.com'  -- Replace with your actual email
)
ON CONFLICT (id) DO NOTHING;

-- Insert a test lesson (replace YOUR_USER_ID)
INSERT INTO lessons (
    tutor_id,
    title,
    lesson_type,
    student_level,
    target_language,
    source_url,
    source_text,
    lesson_data
)
VALUES (
    'YOUR_USER_ID',  -- Replace with your actual user ID
    'Test Lesson - Introduction to English',
    'discussion',
    'B1',
    'english',
    'https://example.com/test-article',
    'This is a test article about learning English. It contains various topics for discussion.',
    '{
        "lessonTitle": "Test Lesson - Introduction to English",
        "lessonType": "discussion",
        "studentLevel": "B1",
        "targetLanguage": "english",
        "sections": {
            "warmup": [
                "What is your favorite way to learn English?",
                "Have you ever used online resources to study?",
                "What challenges do you face when learning a new language?"
            ],
            "vocabulary": [
                {
                    "word": "fluent",
                    "meaning": "able to speak a language easily and accurately",
                    "example": "She is fluent in three languages."
                },
                {
                    "word": "practice",
                    "meaning": "to do something regularly to improve your skill",
                    "example": "You need to practice speaking every day."
                }
            ],
            "reading": "Learning a new language can be challenging but rewarding. Many students find that **practice** is the key to becoming **fluent**. There are many resources available online to help you improve your skills.",
            "comprehension": [
                "What is the key to becoming fluent in a language?",
                "What resources are mentioned in the passage?",
                "Why is learning a new language described as rewarding?"
            ],
            "discussion": [
                "Do you agree that practice is the most important factor in language learning?",
                "What online resources have you found most helpful?",
                "How do you stay motivated when learning becomes difficult?"
            ],
            "grammar": {
                "focus": "Present Perfect Tense",
                "examples": [
                    "I have studied English for five years.",
                    "She has visited many countries.",
                    "They have never tried sushi before."
                ],
                "exercise": [
                    "Complete: I ___ (learn) many new words this week.",
                    "Complete: He ___ (not finish) his homework yet.",
                    "Complete: ___ you ever ___ (travel) abroad?"
                ]
            },
            "pronunciation": {
                "word": "fluent",
                "ipa": "/ˈfluːənt/",
                "practice": "Break it down: FLU-ent. The stress is on the first syllable."
            },
            "wrapup": [
                "What was the most interesting thing you learned today?",
                "How will you practice what we discussed?",
                "What topic would you like to explore in our next lesson?"
            ]
        }
    }'::jsonb
);

-- Verify the lesson was inserted
SELECT 
    id,
    tutor_id,
    title,
    lesson_type,
    student_level,
    created_at
FROM lessons
WHERE tutor_id = 'YOUR_USER_ID'  -- Replace with your actual user ID
ORDER BY created_at DESC
LIMIT 1;
