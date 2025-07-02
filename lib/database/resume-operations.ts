import { supabase } from '@/lib/supabase'

export interface Resume {
  id: string
  user_id: string
  resume_md: string
  created_at: string
}

export interface ResumeOperationResult {
  data?: Resume | null
  error?: string
  success: boolean
}

/**
 * Get user's current resume from database
 */
export async function getUserResume(userId: string): Promise<ResumeOperationResult> {
  try {
    console.log('Fetching resume for user:', userId)
    
    // Use maybeSingle() instead of single() to avoid hanging on 0 rows
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    console.log('Resume query result:', { data, error })

    if (error) {
      console.error('Error fetching user resume:', error)
      return {
        error: 'Failed to fetch resume',
        success: false
      }
    }

    // data will be null if no resume found, which is fine
    return {
      data,
      success: true
    }
  } catch (error) {
    console.error('Unexpected error fetching user resume:', error)
    return {
      error: 'An unexpected error occurred',
      success: false
    }
  }
}

/**
 * Save or update user's resume using upsert
 */
export async function saveUserResume(userId: string, resumeMd: string): Promise<ResumeOperationResult> {
  try {
    console.log('saveUserResume called with userId:', userId, 'resumeMd length:', resumeMd.length)
    
    // Validate input
    if (!userId || !resumeMd.trim()) {
      console.log('Validation failed: missing userId or resumeMd')
      return {
        error: 'User ID and resume content are required',
        success: false
      }
    }

    console.log('userId:', userId, 'typeof:', typeof userId)

    // Use upsert to insert or update based on unique user_id constraint
    const { data, error } = await supabase
      .from('resumes')
      .upsert({
        user_id: userId,
        resume_md: resumeMd,
        created_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select();

    console.log('Upsert result:', { data, error })

    if (error) {
      console.error('Error saving user resume:', error)
      return {
        error: 'Failed to save resume',
        success: false
      }
    }

    return {
      data,
      success: true
    }
  } catch (error) {
    console.error('Unexpected error saving user resume:', error)
    return {
      error: 'An unexpected error occurred while saving',
      success: false
    }
  }
}

/**
 * Delete user's resume
 */
export async function deleteUserResume(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting user resume:', error)
      return {
        error: 'Failed to delete resume',
        success: false
      }
    }

    return {
      success: true
    }
  } catch (error) {
    console.error('Unexpected error deleting user resume:', error)
    return {
      error: 'An unexpected error occurred while deleting',
      success: false
    }
  }
}

/**
 * Validate resume markdown content
 */
export function validateResumeContent(resumeMd: string): { valid: boolean; error?: string } {
  if (!resumeMd || !resumeMd.trim()) {
    return {
      valid: false,
      error: 'Resume content cannot be empty'
    }
  }

  if (resumeMd.length > 50000) { // 50KB limit
    return {
      valid: false,
      error: 'Resume content is too large (max 50KB)'
    }
  }

  // Check for basic markdown structure (should have at least one heading)
  if (!resumeMd.includes('#')) {
    return {
      valid: false,
      error: 'Resume should include at least one heading (use # for your name)'
    }
  }

  return { valid: true }
}