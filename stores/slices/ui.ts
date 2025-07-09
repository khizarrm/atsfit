import { StateCreator } from 'zustand'
import { UIState, UIActions, Toast } from '../types'

export type UISlice = UIState & { actions: UIActions }

const initialState: UIState = {
  theme: 'system',
  isMobile: false,
  toasts: [],
  modals: {
    isSignUpOpen: false,
    isProfileOpen: false,
    isResultsOpen: false,
  },
  navigation: {
    currentPage: '/',
    previousPage: null,
  },
  progress: {
    isVisible: false,
    value: 0,
    message: '',
  },
}

export const createUISlice = (set: any, get: any) => ({
  ...initialState,
  
  actions: {
    setTheme: (theme: UIState['theme']) => {
      set((state) => {
        state.theme = theme
      })
    },

    setIsMobile: (isMobile: boolean) => {
      set((state) => {
        state.isMobile = isMobile
      })
    },

    addToast: (toast: Omit<Toast, 'id'>) => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
      const newToast: Toast = {
        id,
        duration: 5000,
        variant: 'default',
        ...toast,
      }
      
      set((state) => {
        state.toasts.push(newToast)
      })

      // Auto-remove toast after duration
      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          get().actions.removeToast(id)
        }, newToast.duration)
      }
    },

    removeToast: (id: string) => {
      set((state) => {
        state.toasts = state.toasts.filter(toast => toast.id !== id)
      })
    },

    clearToasts: () => {
      set((state) => {
        state.toasts = []
      })
    },

    openModal: (modal: keyof UIState['modals']) => {
      set((state) => {
        state.modals[modal] = true
      })
    },

    closeModal: (modal: keyof UIState['modals']) => {
      set((state) => {
        state.modals[modal] = false
      })
    },

    setCurrentPage: (page: string) => {
      set((state) => {
        state.navigation.previousPage = state.navigation.currentPage
        state.navigation.currentPage = page
      })
    },

    showProgress: (value: number, message = '') => {
      set((state) => {
        state.progress.isVisible = true
        state.progress.value = value
        state.progress.message = message
      })
    },

    hideProgress: () => {
      set((state) => {
        state.progress.isVisible = false
        state.progress.value = 0
        state.progress.message = ''
      })
    },

    // Toast utility methods
    showSuccess: (message: string, title?: string) => {
      get().actions.addToast({
        title,
        description: message,
        variant: 'success',
      })
    },

    showError: (message: string, title?: string) => {
      get().actions.addToast({
        title,
        description: message,
        variant: 'destructive',
      })
    },

    showWarning: (message: string, title?: string) => {
      get().actions.addToast({
        title,
        description: message,
        variant: 'warning',
      })
    },

    showInfo: (message: string, title?: string) => {
      get().actions.addToast({
        title,
        description: message,
        variant: 'default',
      })
    },
  },
})