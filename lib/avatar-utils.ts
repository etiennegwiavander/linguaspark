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

// Get random avatars for dialogue (one student, one tutor)
export function getDialogueAvatars(): { student: Avatar; tutor: Avatar } {
  const students = AVAILABLE_AVATARS.filter(avatar => avatar.role === 'student')
  const tutors = AVAILABLE_AVATARS.filter(avatar => avatar.role === 'tutor')
  
  const randomStudent = students[Math.floor(Math.random() * students.length)]
  const randomTutor = tutors[Math.floor(Math.random() * tutors.length)]
  
  return {
    student: randomStudent,
    tutor: randomTutor
  }
}

// Get avatar by name
export function getAvatarByName(name: string): Avatar | undefined {
  return AVAILABLE_AVATARS.find(avatar => 
    avatar.name.toLowerCase() === name.toLowerCase()
  )
}

// Replace generic character names with avatar names in dialogue
export function enhanceDialogueWithAvatars(dialogue: Array<{ character: string; line: string; isGap?: boolean }>): Array<{ character: string; line: string; isGap?: boolean; avatar?: Avatar }> {
  const avatars = getDialogueAvatars()
  
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