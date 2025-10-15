// Avatar utility for dialogue sections
export interface Avatar {
  name: string
  image: string
  role: 'student' | 'tutor'
}

// Available avatars for dialogue sections
export const AVAILABLE_AVATARS: Avatar[] = [
  { name: 'Bethy', image: '/avatars/Bethy.png', role: 'student' },
  { name: 'Fausta', image: '/avatars/Fausta.png', role: 'student' },
  { name: 'Nailah', image: '/avatars/Nailah.png', role: 'student' },
  { name: 'Peggy', image: '/avatars/Peggy.png', role: 'student' },
  { name: 'Sam', image: '/avatars/Sam.png', role: 'student' },
  { name: 'Asher', image: '/avatars/Asher.png', role: 'tutor' },
  { name: 'Edmond', image: '/avatars/Edmond.png', role: 'tutor' },
  { name: 'Etienne', image: '/avatars/Etienne.png', role: 'tutor' },
  { name: 'John', image: '/avatars/John.png', role: 'tutor' },
  { name: 'Jose', image: '/avatars/Jose.png', role: 'tutor' },
]

// Get persistent avatars for dialogue (one student, one tutor)
// Uses lesson ID and section name to ensure same avatars persist across refreshes
// Different sections get different avatars but remain consistent for that section
export function getDialogueAvatars(lessonId?: string, sectionName?: string): { student: Avatar; tutor: Avatar } {
  const students = AVAILABLE_AVATARS.filter(avatar => avatar.role === 'student')
  const tutors = AVAILABLE_AVATARS.filter(avatar => avatar.role === 'tutor')

  // Create a base seed from lesson ID
  const baseSeed = lessonId || 'default-lesson'

  // Simple but effective hash function
  const hashCode = (str: string): number => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  // Get base hash from lesson ID
  const baseHash = hashCode(baseSeed)

  // Add section-specific offsets to ensure different selections
  let sectionOffset = 0
  if (sectionName === 'dialoguePractice') {
    sectionOffset = 0
  } else if (sectionName === 'dialogueFillGap') {
    sectionOffset = 7 // Prime number to ensure different distribution
  } else {
    sectionOffset = 3 // Default offset for other sections
  }

  // Calculate indices with section offset
  const studentIndex = (baseHash + sectionOffset) % students.length
  const tutorIndex = (baseHash + sectionOffset + 11) % tutors.length // Another prime offset

  const selectedAvatars = {
    student: students[studentIndex],
    tutor: tutors[tutorIndex]
  }

  // Debug logging for development (uncomment if needed)
  // console.log(`🎭 Avatar Selection for ${sectionName}:`, {
  //   lessonId, sectionName, baseHash, sectionOffset,
  //   selectedStudent: selectedAvatars.student.name,
  //   selectedTutor: selectedAvatars.tutor.name
  // })

  return selectedAvatars
}

// Get avatar by name
export function getAvatarByName(name: string): Avatar | undefined {
  return AVAILABLE_AVATARS.find(avatar =>
    avatar.name.toLowerCase() === name.toLowerCase()
  )
}

// Replace generic character names with avatar names in dialogue
export function enhanceDialogueWithAvatars(
  dialogue: Array<{ character: string; line: string; isGap?: boolean }>,
  lessonId?: string,
  sectionName?: string
): Array<{ character: string; line: string; isGap?: boolean; avatar?: Avatar }> {
  const avatars = getDialogueAvatars(lessonId, sectionName)

  return dialogue.map(item => {
    let avatar: Avatar | undefined
    let character = item.character

    // Replace generic names with avatar names
    if (item.character.toLowerCase().includes('student') || item.character.toLowerCase().includes('learner')) {
      character = avatars.student.name
      avatar = avatars.student
    } else if (item.character.toLowerCase().includes('tutor') || item.character.toLowerCase().includes('teacher') || item.character.toLowerCase().includes('instructor')) {
      character = avatars.tutor.name
      avatar = avatars.tutor
    }

    return {
      ...item,
      character,
      avatar
    }
  })
}