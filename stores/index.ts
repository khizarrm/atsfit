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
      storage: {
        getItem: (name) => {
          try {
            const item = sessionStorage.getItem(name)
            return item ? JSON.parse(item) : null
          } catch (error) {
            console.error('Error reading from sessionStorage:', error)
            return null
          }
        },
        setItem: (name, value) => {
          try {
            sessionStorage.setItem(name, JSON.stringify(value))
          } catch (error) {
            console.error('Error writing to sessionStorage:', error)
          }
        },
        removeItem: (name) => {
          try {
            sessionStorage.removeItem(name)
          } catch (error) {
            console.error('Error removing from sessionStorage:', error)
          }
        },
      },
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        resumeMd: state.resumeMd,
        hasResume: state.hasResume,
      }),
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
      storage: {
        getItem: (name) => {
          try {
            const item = localStorage.getItem(name)
            return item ? JSON.parse(item) : null
          } catch (error) {
            console.error('Error reading from localStorage:', error)
            return null
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value))
          } catch (error) {
            console.error('Error writing to localStorage:', error)
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name)
          } catch (error) {
            console.error('Error removing from localStorage:', error)
          }
        },
      },
      partialize: (state) => ({
        content: state.content,
        originalContent: state.originalContent,
        versions: state.versions,
        lastSaved: state.lastSaved,
      }),
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
      storage: {
        getItem: (name) => {
          try {
            const item = localStorage.getItem(name)
            return item ? JSON.parse(item) : null
          } catch (error) {
            console.error('Error reading from localStorage:', error)
            return null
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value))
          } catch (error) {
            console.error('Error writing to localStorage:', error)
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name)
          } catch (error) {
            console.error('Error removing from localStorage:', error)
          }
        },
      },
      partialize: (state) => ({
        theme: state.theme,
      }),
    }
  )
)

// Store initialization
export const initializeStore = async () => {
  const authStore = useAuthStore.getState()
  const resumeStore = useResumeStore.getState()
  
  // Initialize auth
  await authStore.actions.initializeAuth()
  
  // Set up auth state listener
  const subscription = authStore.actions.setupAuthListener()
  
  // Initialize resume if user is authenticated
  const user = authStore.user
  if (user) {
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