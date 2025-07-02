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
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      // If no resume found, return success with null data
      if (error.code === 'PGRST116') {
        return {
          data: null,
          success: true
        }
      }
      
      console.error('Error fetching user resume:', error)
      return {
        error: 'Failed to fetch resume',
        success: false
      }
    }

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
 * Save or update user's resume
 */
export async function saveUserResume(userId: string, resumeMd: string, isNewUser: boolean = false): Promise<ResumeOperationResult> {
  try {
    console.log('saveUserResume called with userId:', userId, 'resumeMd length:', resumeMd.length, 'isNewUser:', isNewUser)
    
    // Validate input
    if (!userId || !resumeMd.trim()) {
      console.log('Validation failed: missing userId or resumeMd')
      return {
        error: 'User ID and resume content are required',
        success: false
      }
    }

    let data, error

    if (isNewUser) {
      // For new users (resume setup), always insert
      console.log('Creating new resume for new user:', userId)
      console.log('About to call supabase insert...')
      
      try {
        const result = await Promise.race([
          supabase
            .from('resumes')
            .insert({
              user_id: userId,
              resume_md: resumeMd
            })
            .select(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database operation timeout')), 10000)
          )
        ])
        
        console.log('Insert operation completed:', result)
        
        if (result.data && result.data.length > 0) {
          data = result.data[0]
          error = result.error
        } else {
          data = null
          error = result.error || new Error('No data returned from insert')
        }
      } catch (timeoutError) {
        console.error('Database operation timed out or failed:', timeoutError)
        error = timeoutError
        data = null
      }
    } else {
      // For existing users (profile view), update existing resume
      console.log('Updating existing resume for user:', userId)
      const result = await supabase
        .from('resumes')
        .update({
          resume_md: resumeMd,
          created_at: new Date().toISOString() // Update timestamp
        })
        .eq('user_id', userId)
        .select()
        .single()
      
      data = result.data
      error = result.error
    }

    console.log('Save result:', { data, error })

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