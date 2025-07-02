import { supabase } from '@/lib/supabase'

export interface Resume {
  id: string
  user_id: string
  resume_md: string
  created_at: string
}

export interface ResumeResult {
  data?: Resume | null
  error?: string
  success: boolean
}

/**
 * Get user's resume (assumes one resume per user)
 */
export async function getResume(userId: string): Promise<ResumeResult> {
  try {
    console.log('Fetching resume for user:', userId)
    
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      // No resume found is not an error
      if (error.code === 'PGRST116') {
        console.log('No resume found for user')
        return { data: null, success: true }
      }
      
      console.error('Database error fetching resume:', error)
      return { 
        error: 'Failed to load resume from database', 
        success: false 
      }
    }

    console.log('Resume loaded successfully')
    return { data, success: true }
    
  } catch (error) {
    console.error('Unexpected error fetching resume:', error)
    return { 
      error: 'An unexpected error occurred while loading resume', 
      success: false 
    }
  }
}

/**
 * Save user's resume (upsert - insert or update)
 */
export async function saveResume(userId: string, content: string): Promise<ResumeResult> {
  try {
    console.log('Saving resume for user:', userId, 'content length:', content.length)
    
    // Validate inputs
    if (!userId || !content.trim()) {
      return {
        error: 'User ID and resume content are required',
        success: false
      }
    }

    // Use upsert to handle both insert and update
    const { data, error } = await supabase
      .from('resumes')
      .upsert({
        user_id: userId,
        resume_md: content.trim()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Database error saving resume:', error)
      return {
        error: 'Failed to save resume to database',
        success: false
      }
    }

    console.log('Resume saved successfully')
    return { data, success: true }
    
  } catch (error) {
    console.error('Unexpected error saving resume:', error)
    return {
      error: 'An unexpected error occurred while saving resume',
      success: false
    }
  }
}

/**
 * Validate resume content
 */
export function validateResumeContent(content: string): { valid: boolean; error?: string } {
  if (!content || !content.trim()) {
    return {
      valid: false,
      error: 'Resume content cannot be empty'
    }
  }

  if (content.length > 50000) { // 50KB limit
    return {
      valid: false,
      error: 'Resume content is too large (max 50KB)'
    }
  }

  // Check for basic markdown structure (should have at least one heading)
  if (!content.includes('#')) {
    return {
      valid: false,
      error: 'Resume should include at least one heading (use # for your name)'
    }
  }

  return { valid: true }
}

/**
 * Get default resume template
 */
export function getDefaultResumeTemplate(): string {
  return `# YOUR NAME

phone • email • website • github

---

### EDUCATION

#### University Name, City, State
*Degree Title* | Month Year - Month Year | GPA: X.X/4.0  
**Relevant Coursework:** Course 1, Course 2, Course 3

---

### EXPERIENCE

#### Job Title - Company Name
*Month Year - Month Year*
- Achievement or responsibility here
- Another achievement with metrics
- Third point about impact

---

### SKILLS

**Programming Languages:** Language1, Language2, Language3  
**Frameworks:** Framework1, Framework2  
**Tools:** Tool1, Tool2, Tool3`
}