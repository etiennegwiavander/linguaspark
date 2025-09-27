import { getSupabaseClient } from "./supabase"

export interface LessonData {
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
    const user = await supabase.auth.getUser()

    if (!user.data.user) throw new Error("No authenticated user")

    const { data, error } = await supabase
      .from("lessons")
      .insert({
        ...lessonData,
        tutor_id: user.data.user.id,
      })
      .select()
      .single()

    if (error) throw error
    return data as Lesson
  },

  async getLessons(limit = 20, offset = 0) {
    const supabase = getSupabaseClient()
    const user = await supabase.auth.getUser()

    if (!user.data.user) throw new Error("No authenticated user")

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
      .eq("tutor_id", user.data.user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data as (Lesson & { students?: Student })[]
  },

  async getLesson(id: string) {
    const supabase = getSupabaseClient()
    const user = await supabase.auth.getUser()

    if (!user.data.user) throw new Error("No authenticated user")

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
      .eq("tutor_id", user.data.user.id)
      .single()

    if (error) throw error
    return data as Lesson & { students?: Student }
  },

  async updateLesson(id: string, updates: Partial<Lesson>) {
    const supabase = getSupabaseClient()
    const user = await supabase.auth.getUser()

    if (!user.data.user) throw new Error("No authenticated user")

    const { data, error } = await supabase
      .from("lessons")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tutor_id", user.data.user.id)
      .select()
      .single()

    if (error) throw error
    return data as Lesson
  },

  async deleteLesson(id: string) {
    const supabase = getSupabaseClient()
    const user = await supabase.auth.getUser()

    if (!user.data.user) throw new Error("No authenticated user")

    const { error } = await supabase.from("lessons").delete().eq("id", id).eq("tutor_id", user.data.user.id)

    if (error) throw error
  },

  async getStudents() {
    const supabase = getSupabaseClient()
    const user = await supabase.auth.getUser()

    if (!user.data.user) throw new Error("No authenticated user")

    const { data, error } = await supabase.from("students").select("*").eq("tutor_id", user.data.user.id).order("name")

    if (error) throw error
    return data as Student[]
  },

  async createStudent(student: {
    name: string
    level: string
    target_language: string
  }) {
    const supabase = getSupabaseClient()
    const user = await supabase.auth.getUser()

    if (!user.data.user) throw new Error("No authenticated user")

    const { data, error } = await supabase
      .from("students")
      .insert({
        ...student,
        tutor_id: user.data.user.id,
      })
      .select()
      .single()

    if (error) throw error
    return data as Student
  },
}
