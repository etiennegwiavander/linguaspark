import { getSupabaseClient } from "./supabase"

export interface LessonData {
  lessonTitle: string
  lessonType: string
  studentLevel: string
  targetLanguage: string
  sections: {
    warmup: string[]
    vocabulary: Array<{ word: string; meaning: string; example: string }>
    reading: string
    comprehension: string[]
    discussion: string[]
    grammar: {
      focus: string
      examples: string[]
      exercise: string[]
    }
    pronunciation: {
      word: string
      ipa: string
      practice: string
    }
    wrapup: string[]
  }
}

export interface Lesson {
  id: string
  title: string
  lesson_type: string
  student_level: string
  target_language: string
  source_url?: string
  source_text?: string
  lesson_data: LessonData
  created_at: string
  updated_at: string
  student_id?: string
}

export interface Student {
  id: string
  name: string
  level: string
  target_language: string
  created_at: string
}

export const lessonService = {
  async saveLesson(lessonData: {
    title: string
    lesson_type: string
    student_level: string
    target_language: string
    source_url?: string
    source_text?: string
    lesson_data: LessonData
    student_id?: string
  }) {
    const supabase = getSupabaseClient()
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError) {
      console.error('[LessonService] Auth error:', authError)
      throw new Error(`Authentication error: ${authError.message}`)
    }

    if (!session?.user) {
      console.error('[LessonService] No authenticated user')
      throw new Error("No authenticated user")
    }

    const user = session.user

    console.log('[LessonService] Saving lesson for user:', user.id)
    console.log('[LessonService] Lesson data:', {
      title: lessonData.title,
      lesson_type: lessonData.lesson_type,
      student_level: lessonData.student_level,
      target_language: lessonData.target_language,
    })

    // First, ensure tutor profile exists
    const { data: tutorProfile, error: tutorError } = await supabase
      .from("tutors")
      .select("id")
      .eq("id", user.id)
      .single()

    if (tutorError && tutorError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[LessonService] Error checking tutor profile:', tutorError)
    }

    if (!tutorProfile) {
      console.log('[LessonService] Tutor profile not found, creating one...')
      const { error: createTutorError } = await supabase
        .from("tutors")
        .insert({
          id: user.id,
          email: user.email || '',
        })

      if (createTutorError) {
        console.error('[LessonService] Failed to create tutor profile:', createTutorError)
        throw new Error(`Failed to create tutor profile: ${createTutorError.message}`)
      }
      console.log('[LessonService] ✅ Tutor profile created')
    }

    const { data, error } = await supabase
      .from("lessons")
      .insert({
        ...lessonData,
        tutor_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('[LessonService] Failed to insert lesson:', error)
      throw new Error(`Failed to save lesson: ${error.message}`)
    }

    console.log('[LessonService] ✅ Lesson saved successfully:', data.id)
    return data as Lesson
  },

  async getLessons(limit = 20, offset = 0) {
    console.log('[LessonService] getLessons called with limit:', limit, 'offset:', offset)
    
    const supabase = getSupabaseClient()
    
    // Use getSession() instead of getUser() - it's more reliable and doesn't hang
    console.log('[LessonService] Getting session...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('[LessonService] Session obtained:', session?.user?.email || 'NO SESSION')

    if (sessionError) {
      console.error('[LessonService] Session error:', sessionError)
      throw new Error(`Authentication error: ${sessionError.message}`)
    }

    if (!session?.user) {
      console.error('[LessonService] No authenticated session')
      throw new Error("No authenticated user")
    }

    const user = session.user
    console.log('[LessonService] Fetching lessons for user:', user.id)

    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("tutor_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[LessonService] Error fetching lessons:', error)
      console.error('[LessonService] Error code:', error.code)
      console.error('[LessonService] Error message:', error.message)
      console.error('[LessonService] Error details:', error.details)
      throw new Error(`Failed to fetch lessons: ${error.message}`)
    }

    console.log('[LessonService] Successfully fetched', data?.length || 0, 'lessons')
    if (data && data.length > 0) {
      console.log('[LessonService] First lesson ID:', data[0].id)
    }

    return data as (Lesson & { students?: Student })[]
  },

  async getLesson(id: string) {
    const supabase = getSupabaseClient()
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session?.user) throw new Error("No authenticated user")
    const user = session.user

    const { data, error } = await supabase
      .from("lessons")
      .select(`
        *,
        students (
          id,
          name,
          level,
          target_language
        )
      `)
      .eq("id", id)
      .eq("tutor_id", user.id)
      .single()

    if (error) throw error
    return data as Lesson & { students?: Student }
  },

  async updateLesson(id: string, updates: Partial<Lesson>) {
    const supabase = getSupabaseClient()
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session?.user) throw new Error("No authenticated user")
    const user = session.user

    const { data, error } = await supabase
      .from("lessons")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tutor_id", user.id)
      .select()
      .single()

    if (error) throw error
    return data as Lesson
  },

  async deleteLesson(id: string) {
    const supabase = getSupabaseClient()
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session?.user) throw new Error("No authenticated user")
    const user = session.user

    const { error } = await supabase.from("lessons").delete().eq("id", id).eq("tutor_id", user.id)

    if (error) throw error
  },

  async getStudents() {
    const supabase = getSupabaseClient()
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session?.user) throw new Error("No authenticated user")
    const user = session.user

    const { data, error } = await supabase.from("students").select("*").eq("tutor_id", user.id).order("name")

    if (error) throw error
    return data as Student[]
  },

  async createStudent(student: {
    name: string
    level: string
    target_language: string
  }) {
    const supabase = getSupabaseClient()
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session?.user) throw new Error("No authenticated user")
    const user = session.user

    const { data, error } = await supabase
      .from("students")
      .insert({
        ...student,
        tutor_id: user.id,
      })
      .select()
      .single()

    if (error) throw error
    return data as Student
  },
}
