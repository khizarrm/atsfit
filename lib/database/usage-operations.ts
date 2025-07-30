import { supabase } from '@/lib/supabase'

export interface UsageStats {
  user_id: string
  total_runs: number
}

export interface UsageOperationResult {
  data?: UsageStats | null
  error?: string
  success: boolean
}

/**
 * Get user's current usage statistics
 */
export async function getUsageStats(userId: string): Promise<UsageOperationResult> {
  try {
    console.log('Fetching usage stats for user:', userId)
    
    const { data, error } = await supabase
      .from('usage_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    console.log('Usage stats query result:', { data, error })

    if (error) {
      console.error('Error fetching usage stats:', error)
      return {
        error: 'Failed to fetch usage statistics',
        success: false
      }
    }

    // If no record exists, return default stats
    if (!data) {
      return {
        data: {
          user_id: userId,
          total_runs: 0
        },
        success: true
      }
    }

    return {
      data,
      success: true
    }
  } catch (error) {
    console.error('Unexpected error fetching usage stats:', error)
    return {
      error: 'An unexpected error occurred while fetching usage statistics',
      success: false
    }
  }
}

/**
 * Increment user's usage count (creates record if doesn't exist)
 * Uses simple upsert pattern
 */
export async function incrementUsageCount(userId: string): Promise<UsageOperationResult> {
  try {
    console.log('Incrementing usage count for user:', userId)

    // Validate input
    if (!userId) {
      console.log('Validation failed: missing userId')
      return {
        error: 'User ID is required',
        success: false
      }
    }

    // First try to get existing record
    const { data: existingData, error: fetchError } = await supabase
      .from('usage_stats')
      .select('total_runs')
      .eq('user_id', userId)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching existing usage data:', fetchError)
      return {
        error: 'Failed to fetch existing usage data',
        success: false
      }
    }

    let newCount = 1
    if (existingData) {
      newCount = existingData.total_runs + 1
    }

    // Use upsert to either insert new record or update existing
    const { data, error } = await supabase
      .from('usage_stats')
      .upsert({
        user_id: userId,
        total_runs: newCount
      }, { onConflict: 'user_id' })
      .select()

    if (error) {
      console.error('Database upsert failed:', error)
      return {
        error: 'Failed to update usage statistics',
        success: false
      }
    }

    console.log('Usage count incremented successfully to:', newCount)
    
    return {
      data: data?.[0] || null,
      success: true
    }

  } catch (error) {
    console.error('Unexpected error incrementing usage count:', error)
    return {
      error: 'An unexpected error occurred while updating usage statistics',
      success: false
    }
  }
}


/**
 * Create initial usage record for a new user
 * This is mainly for initialization purposes
 */
export async function createUsageRecord(userId: string): Promise<UsageOperationResult> {
  try {
    console.log('Creating usage record for user:', userId)

    // Validate input
    if (!userId) {
      return {
        error: 'User ID is required',
        success: false
      }
    }

    const { data, error } = await supabase
      .from('usage_stats')
      .insert({
        user_id: userId,
        total_runs: 0
      })
      .select()

    if (error) {
      // If record already exists, that's fine - just fetch it
      if (error.code === '23505') { // unique constraint violation
        console.log('Usage record already exists, fetching existing record')
        return await getUsageStats(userId)
      }
      
      console.error('Database insert failed:', error)
      return {
        error: 'Failed to create usage record',
        success: false
      }
    }

    console.log('Usage record created successfully')
    
    return {
      data: data?.[0] || null,
      success: true
    }

  } catch (error) {
    console.error('Unexpected error creating usage record:', error)
    return {
      error: 'An unexpected error occurred while creating usage record',
      success: false
    }
  }
}

/**
 * Reset user's usage count (admin function)
 */
export async function resetUsageCount(userId: string): Promise<UsageOperationResult> {
  try {
    console.log('Resetting usage count for user:', userId)

    const { data, error } = await supabase
      .from('usage_stats')
      .update({ total_runs: 0 })
      .eq('user_id', userId)
      .select()

    if (error) {
      console.error('Database reset failed:', error)
      return {
        error: 'Failed to reset usage statistics',
        success: false
      }
    }

    return {
      data: data?.[0] || null,
      success: true
    }

  } catch (error) {
    console.error('Unexpected error resetting usage count:', error)
    return {
      error: 'An unexpected error occurred while resetting usage statistics',
      success: false
    }
  }
}

/**
 * Validate usage tracking operation
 */
export function validateUsageOperation(userId: string): { valid: boolean; error?: string } {
  if (!userId || !userId.trim()) {
    return {
      valid: false,
      error: 'User ID is required for usage tracking'
    }
  }

  // Basic UUID format validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(userId)) {
    return {
      valid: false,
      error: 'Invalid user ID format'
    }
  }

  return { valid: true }
}

/**
 * Log usage tracking events for monitoring
 */
export function logUsageEvent(event: 'increment' | 'fetch' | 'create' | 'reset', userId: string, success: boolean, error?: string) {
  const logData = {
    event,
    userId: userId.substring(0, 8) + '...', // Partial ID for privacy
    success,
    timestamp: new Date().toISOString(),
    error
  }
  
  console.log('Usage tracking event:', logData)
  
  // In production, you might want to send this to a monitoring service
  // like DataDog, Sentry, or CloudWatch
}