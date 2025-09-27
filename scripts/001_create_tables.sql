-- Create tutors table
CREATE TABLE IF NOT EXISTS tutors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1')),
  target_language TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  lesson_type TEXT NOT NULL CHECK (lesson_type IN ('discussion', 'grammar', 'travel', 'business', 'pronunciation')),
  student_level TEXT NOT NULL CHECK (student_level IN ('A1', 'A2', 'B1', 'B2', 'C1')),
  target_language TEXT NOT NULL,
  source_url TEXT,
  source_text TEXT,
  lesson_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lesson_exports table
CREATE TABLE IF NOT EXISTS lesson_exports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL CHECK (export_type IN ('pdf', 'word')),
  file_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_exports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tutors
CREATE POLICY "Tutors can view own profile" ON tutors
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Tutors can update own profile" ON tutors
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Create RLS policies for students
CREATE POLICY "Tutors can view own students" ON students
  FOR SELECT USING (tutor_id = auth.uid());

CREATE POLICY "Tutors can insert own students" ON students
  FOR INSERT WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Tutors can update own students" ON students
  FOR UPDATE USING (tutor_id = auth.uid());

CREATE POLICY "Tutors can delete own students" ON students
  FOR DELETE USING (tutor_id = auth.uid());

-- Create RLS policies for lessons
CREATE POLICY "Tutors can view own lessons" ON lessons
  FOR SELECT USING (tutor_id = auth.uid());

CREATE POLICY "Tutors can insert own lessons" ON lessons
  FOR INSERT WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Tutors can update own lessons" ON lessons
  FOR UPDATE USING (tutor_id = auth.uid());

CREATE POLICY "Tutors can delete own lessons" ON lessons
  FOR DELETE USING (tutor_id = auth.uid());

-- Create RLS policies for lesson_exports
CREATE POLICY "Tutors can view own lesson exports" ON lesson_exports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lessons 
      WHERE lessons.id = lesson_exports.lesson_id 
      AND lessons.tutor_id = auth.uid()
    )
  );

CREATE POLICY "Tutors can insert own lesson exports" ON lesson_exports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons 
      WHERE lessons.id = lesson_exports.lesson_id 
      AND lessons.tutor_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_tutor_id ON students(tutor_id);
CREATE INDEX IF NOT EXISTS idx_lessons_tutor_id ON lessons(tutor_id);
CREATE INDEX IF NOT EXISTS idx_lessons_student_id ON lessons(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_exports_lesson_id ON lesson_exports(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lessons_created_at ON lessons(created_at DESC);
