import { useResumeStore } from '../index'
import { resumeSelectors } from '../utils/selectors'

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

export function useResumeManager(userId: string | null): [ResumeState, ResumeActions] {
  const content = useResumeStore(state => state.content)
  const originalContent = useResumeStore(state => state.originalContent)
  const loading = useResumeStore(state => state.loading)
  const error = useResumeStore(state => state.error)
  const lastSaved = useResumeStore(state => state.lastSaved)
  const isDirty = useResumeStore(state => state.isDirty)
  const retryCount = useResumeStore(state => state.retryCount)
  
  const updateContent = useResumeStore(state => state.actions.updateContent)
  const saveResumeAction = useResumeStore(state => state.actions.saveResume)
  const resetToOriginal = useResumeStore(state => state.actions.resetToOriginal)
  const retryAction = useResumeStore(state => state.actions.retry)
  
  // Wrapper functions to handle userId parameter
  const saveResume = async () => {
    return await saveResumeAction(userId || undefined)
  }
  
  const retry = async () => {
    return await retryAction(userId || undefined)
  }

  // Map loading state to the expected format
  const loadingState: LoadingState = loading === 'loading' ? 'loading' : 
                                   loading === 'error' ? 'error' : 
                                   loading === 'success' ? 'ready' : 'ready'

  const state: ResumeState = {
    content,
    originalContent,
    loadingState,
    error,
    lastSaved,
    isDirty,
    retryCount,
  }

  const actions: ResumeActions = {
    updateContent,
    saveResume,
    resetToOriginal,
    retry,
  }

  return [state, actions]
}