import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { createAuthSlice, AuthSlice } from './slices/auth'
import { createResumeSlice, ResumeSlice } from './slices/resume'
import { createUISlice, UISlice } from './slices/ui'

export interface RootStore {
  auth: AuthSlice
  resume: ResumeSlice
  ui: UISlice
}

// Create a shared storage utility
const createStorage = () => ({
  getItem: (name: string) => {
    try {
      if (typeof window === 'undefined') return null
      const item = localStorage.getItem(name)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return null
    }
  },
  setItem: (name: string, value: any) => {
    try {
      if (typeof window === 'undefined') return
      localStorage.setItem(name, JSON.stringify(value))
    } catch (error) {
      console.error('Error writing to localStorage:', error)
    }
  },
  removeItem: (name: string) => {
    try {
      if (typeof window === 'undefined') return
      localStorage.removeItem(name)
    } catch (error) {
      console.error('Error removing from localStorage:', error)
    }
  },
})

// Individual store hooks for better performance
export const useAuthStore = create<AuthSlice>()(
  persist(
    immer(
      devtools(
        createAuthSlice,
        { name: 'Auth Store' }
      )
    ),
    {
      name: 'atsfit-auth',
      storage: createStorage(),
    }
  )
)

export const useResumeStore = create<ResumeSlice>()(
  persist(
    immer(
      devtools(
        createResumeSlice,
        { name: 'Resume Store' }
      )
    ),
    {
      name: 'atsfit-resume',
      storage: createStorage(),
    }
  )
)

export const useUIStore = create<UISlice>()(
  persist(
    immer(
      devtools(
        createUISlice,
        { name: 'UI Store' }
      )
    ),
    {
      name: 'atsfit-ui',
      storage: createStorage(),
    }
  )
)

// Store initialization
export const initializeStore = async () => {
  const authStore = useAuthStore.getState()
  const resumeStore = useResumeStore.getState()
  
  console.log('Store debug:', {
    authStore: !!authStore,
    authActions: !!authStore?.actions,
    resumeStore: !!resumeStore,
    resumeActions: !!resumeStore?.actions,
    initializeResumeExists: !!resumeStore?.actions?.initializeResume,
    updateKeywordsExists: !!resumeStore?.actions?.updateKeywords
  })
  
  // Initialize auth
  await authStore.actions.initializeAuth()
  
  // Set up auth state listener
  const subscription = authStore.actions.setupAuthListener()
  
  // Initialize resume if user is authenticated
  const user = authStore.user
  if (user && resumeStore?.actions?.initializeResume) {
    await resumeStore.actions.initializeResume(user.id)
  }
  
  return () => {
    subscription.unsubscribe()
  }
}

// Selectors for individual stores
export const selectAuth = () => useAuthStore.getState()
export const selectResume = () => useResumeStore.getState()
export const selectUI = () => useUIStore.getState()

// Re-export types
export type { AuthSlice, ResumeSlice, UISlice }
export type { AuthState, ResumeState, UIState } from './types'
export { authSelectors, resumeSelectors, uiSelectors } from './utils/selectors'