// Type definitions for public lesson library feature

// Lesson category taxonomy for public lessons
export type LessonCategory = 
  | 'general-english'
  | 'business'
  | 'travel'
  | 'academic'
  | 'conversation'
  | 'grammar'
  | 'vocabulary'
  | 'pronunciation'
  | 'culture';

// CEFR proficiency levels
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

// Lesson type classification
export type LessonType = 'discussion' | 'grammar' | 'travel' | 'business' | 'pronunciation';

// Main public lesson interface
export interface PublicLesson {
  id: string;
  created_at: string;
  updated_at: string;
  creator_id: string | null;
  title: string;
  content: LessonContent;
  source_url: string | null;
  source_title: string | null;
  banner_image_url: string | null;
  category: LessonCategory;
  cefr_level: CEFRLevel;
  lesson_type: LessonType;
  tags: string[];
  estimated_duration_minutes: number | null;
}

// Lesson content structure (reused from existing lesson system)
export interface LessonContent {
  title: string;
  warmup: WarmupSection;
  vocabulary?: VocabularySection;
  grammar?: GrammarSection;
  reading?: ReadingSection;
  discussion?: DiscussionSection;
  pronunciation?: PronunciationSection;
  wrapup: WrapupSection;
  metadata: LessonMetadata;
}

// Lesson section interfaces
export interface WarmupSection {
  questions: string[];
}

export interface VocabularySection {
  words: VocabularyWord[];
  instructions?: string;
}

export interface VocabularyWord {
  word: string;
  definition: string;
  example: string;
  pronunciation?: string;
}

export interface GrammarSection {
  focus: string;
  explanation: string;
  examples: string[];
  practice?: string[];
}

export interface ReadingSection {
  passage: string;
  comprehension_questions?: string[];
}

export interface DiscussionSection {
  topics: string[];
  questions: string[];
}

export interface PronunciationSection {
  focus: string;
  words: PronunciationWord[];
  practice?: string[];
}

export interface PronunciationWord {
  word: string;
  pronunciation: string;
  tips?: string;
}

export interface WrapupSection {
  summary: string;
  homework?: string[];
}

export interface LessonMetadata {
  cefr_level: CEFRLevel;
  lesson_type: LessonType;
  source_url?: string;
  source_title?: string;
  banner_image_url?: string;
}

// Filters for querying public lessons
export interface PublicLessonFilters {
  category?: LessonCategory;
  cefr_level?: CEFRLevel;
  lesson_type?: LessonType;
  search?: string;
}

// Metadata for creating public lessons
export interface PublicLessonMetadata {
  category: LessonCategory;
  tags?: string[];
  estimated_duration_minutes?: number;
}

// Admin statistics interface
export interface AdminStats {
  total_lessons: number;
  lessons_by_category: Record<LessonCategory, number>;
  lessons_by_level: Record<CEFRLevel, number>;
  recent_lessons: PublicLesson[];
  my_lessons_count: number;
}

// Pagination response interface
export interface PublicLessonListResponse {
  lessons: PublicLesson[];
  nextCursor?: string;
  total?: number;
}

// API response types
export interface PublicLessonResponse {
  success: boolean;
  lesson?: PublicLesson;
  error?: string;
}

export interface PublicLessonCreateResponse {
  success: boolean;
  lesson_id?: string;
  error?: string;
}

export interface AdminStatsResponse {
  success: boolean;
  stats?: AdminStats;
  error?: string;
}
