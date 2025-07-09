import { StateCreator } from 'zustand'
import { PersistOptions, persist } from 'zustand/middleware'

interface PersistConfig {
  name: string
  storage: 'localStorage' | 'sessionStorage'
  partialize?: (state: any) => any
  onRehydrateStorage?: (state: any) => void
}

export const createPersistMiddleware = <T>(
  config: PersistConfig
) => {
  const storage = config.storage === 'localStorage' ? localStorage : sessionStorage
  
  const persistOptions: PersistOptions<T> = {
    name: config.name,
    storage: {
      getItem: (name) => {
        try {
          const item = storage.getItem(name)
          return item ? JSON.parse(item) : null
        } catch (error) {
          console.error(`Error reading from ${config.storage}:`, error)
          return null
        }
      },
      setItem: (name, value) => {
        try {
          storage.setItem(name, JSON.stringify(value))
        } catch (error) {
          console.error(`Error writing to ${config.storage}:`, error)
        }
      },
      removeItem: (name) => {
        try {
          storage.removeItem(name)
        } catch (error) {
          console.error(`Error removing from ${config.storage}:`, error)
        }
      },
    },
    partialize: config.partialize,
    onRehydrateStorage: () => (state) => {
      if (config.onRehydrateStorage) {
        config.onRehydrateStorage(state)
      }
    },
  }

  return persist(persistOptions)
}

export const authPersistConfig: PersistConfig = {
  name: 'atsfit-auth',
  storage: 'sessionStorage',
  partialize: (state: any) => ({
    user: state.user,
    session: state.session,
    resumeMd: state.resumeMd,
    hasResume: state.hasResume,
  }),
}

export const resumePersistConfig: PersistConfig = {
  name: 'atsfit-resume',
  storage: 'localStorage',
  partialize: (state: any) => ({
    content: state.content,
    originalContent: state.originalContent,
    versions: state.versions,
    lastSaved: state.lastSaved,
  }),
}

export const uiPersistConfig: PersistConfig = {
  name: 'atsfit-ui',
  storage: 'localStorage',
  partialize: (state: any) => ({
    theme: state.theme,
  }),
}