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

    // Try to update first
    console.log('Attempting to update existing resume for user:', userId)
    const { data: updateData, error: updateError, count } = await supabase
      .from('resumes')
      .update({ 
        resume_md: resumeMd,
        created_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()

    console.log('Update attempt result:', { updateData, updateError, count })

    let result
    
    // If no rows were updated, create a new resume
    if (updateData && updateData.length === 0) {
      console.log('No existing resume found, creating new one...')
      const { data: insertData, error: insertError } = await supabase
        .from('resumes')
        .insert({
          user_id: userId,
          resume_md: resumeMd
        })
        .select()
        .single()

      console.log('Insert result:', { insertData, insertError })
      result = { data: insertData, error: insertError }
    } else {
      result = { data: updateData?.[0] || null, error: updateError }
    }

    if (result.error) {
      console.error('Error saving user resume:', result.error)
      return {
        error: 'Failed to save resume',
        success: false
      }
    }

    return {
      data: result.data,
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