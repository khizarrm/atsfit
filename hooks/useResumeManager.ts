import { useState, useEffect, useCallback } from 'react'
import { getResume, saveResume, validateResumeContent, getDefaultResumeTemplate } from '@/lib/database/resume-service'
import type { Resume } from '@/lib/database/resume-service'

export type LoadingState = 'loading' | 'error' | 'ready' | 'saving'

export interface ResumeState {
  content: string
  originalContent: string
  loadingState: LoadingState
  error: string | null
  lastSaved: Date | null
  isDirty: boolean
  retryCount: number
}

export interface ResumeActions {
  updateContent: (content: string) => void
  saveResume: () => Promise<void>
  resetToOriginal: () => void
  retry: () => Promise<void>
}

/**
 * Hook for managing resume data with auto-retry functionality
 */
export function useResumeManager(userId: string | null): [ResumeState, ResumeActions] {
  const [state, setState] = useState<ResumeState>({
    content: '',
    originalContent: '',
    loadingState: 'loading',
    error: null,
    lastSaved: null,
    isDirty: false,
    retryCount: 0
  })

  // Auto-retry configuration
  const MAX_RETRIES = 3
  const RETRY_DELAYS = [1000, 2000, 4000] // Exponential backoff

  /**
   * Sleep utility for retry delays
   */
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  /**
   * Load resume with auto-retry
   */
  const loadResume = useCallback(async (retryCount = 0): Promise<void> => {
    if (!userId) {
      setState(prev => ({
        ...prev,
        loadingState: 'error',
        error: 'No user ID provided'
      }))
      return
    }

    try {
      setState(prev => ({
        ...prev,
        loadingState: 'loading',
        error: null,
        retryCount
      }))

      const result = await getResume(userId)

      if (result.success) {
        const content = result.data?.resume_md || getDefaultResumeTemplate()
        const originalContent = result.data?.resume_md || ''
        
        setState(prev => ({
          ...prev,
          content,
          originalContent,
          loadingState: 'ready',
          error: null,
          isDirty: false,
          lastSaved: result.data?.created_at ? new Date(result.data.created_at) : null,
          retryCount: 0
        }))
      } else {
        throw new Error(result.error || 'Failed to load resume')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      // Auto-retry logic
      if (retryCount < MAX_RETRIES) {
        console.log(`Resume load failed (attempt ${retryCount + 1}/${MAX_RETRIES + 1}), retrying in ${RETRY_DELAYS[retryCount]}ms...`)
        await sleep(RETRY_DELAYS[retryCount])
        return loadResume(retryCount + 1)
      }

      // Max retries exceeded
      setState(prev => ({
        ...prev,
        loadingState: 'error',
        error: `Failed to load resume after ${MAX_RETRIES + 1} attempts: ${errorMessage}`,
        retryCount
      }))
    }
  }, [userId])

  /**
   * Save resume with auto-retry
   */
  const handleSaveResume = useCallback(async (retryCount = 0): Promise<void> => {
    if (!userId) {
      setState(prev => ({ ...prev, error: 'No user ID provided' }))
      return
    }

    try {
      setState(prev => ({
        ...prev,
        loadingState: 'saving',
        error: null,
        retryCount
      }))

      // Validate content first
      const validation = validateResumeContent(state.content)
      if (!validation.valid) {
        setState(prev => ({
          ...prev,
          loadingState: 'error',
          error: validation.error || 'Invalid resume content'
        }))
        return
      }

      const result = await saveResume(userId, state.content)

      if (result.success) {
        setState(prev => ({
          ...prev,
          originalContent: prev.content,
          loadingState: 'ready',
          error: null,
          isDirty: false,
          lastSaved: new Date(),
          retryCount: 0
        }))
      } else {
        throw new Error(result.error || 'Failed to save resume')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      // Auto-retry logic
      if (retryCount < MAX_RETRIES) {
        console.log(`Resume save failed (attempt ${retryCount + 1}/${MAX_RETRIES + 1}), retrying in ${RETRY_DELAYS[retryCount]}ms...`)
        await sleep(RETRY_DELAYS[retryCount])
        return handleSaveResume(retryCount + 1)
      }

      // Max retries exceeded
      setState(prev => ({
        ...prev,
        loadingState: 'error',
        error: `Failed to save resume after ${MAX_RETRIES + 1} attempts: ${errorMessage}`,
        retryCount
      }))
    }
  }, [userId, state.content])

  /**
   * Update resume content
   */
  const updateContent = useCallback((content: string) => {
    setState(prev => ({
      ...prev,
      content,
      isDirty: content !== prev.originalContent,
      error: prev.loadingState === 'error' ? null : prev.error // Clear error on user input
    }))
  }, [])

  /**
   * Reset content to original
   */
  const resetToOriginal = useCallback(() => {
    setState(prev => ({
      ...prev,
      content: prev.originalContent,
      isDirty: false,
      error: null
    }))
  }, [])

  /**
   * Manual retry for failed operations
   */
  const retry = useCallback(async () => {
    if (state.loadingState === 'error') {
      await loadResume(0) // Reset retry count
    }
  }, [loadResume, state.loadingState])

  // Load resume on mount or user change
  useEffect(() => {
    if (userId) {
      loadResume()
    }
  }, [userId, loadResume])

  const actions: ResumeActions = {
    updateContent,
    saveResume: handleSaveResume,
    resetToOriginal,
    retry
  }

  return [state, actions]
}