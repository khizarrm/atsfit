import { User, Session } from '@supabase/supabase-js'

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface BaseState {
  loading: LoadingState
  error: string | null
}

export interface AuthState extends BaseState {
  user: User | null
  session: Session | null
  resumeMd: string | null
  hasResume: boolean
}

export interface AuthActions {
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>
  signUp: (email: string, password: string) => Promise<{ data: any; error: any }>
  signOut: () => Promise<{ error: any }>
  refreshResume: () => Promise<void>
  refreshUserProfile: () => Promise<void>
  updateResumeCache: (newResumeContent: string) => void
  clearError: () => void
  // Internal methods
  fetchUserProfile: () => Promise<void>
  fetchUserResume: (userId: string) => Promise<void>
  fetchUserData: (userId: string, forceRefresh?: boolean) => Promise<void>
  initializeAuth: () => Promise<void>
  setupAuthListener: () => any
  cacheUserData: (user: any, resumeMd: string | null) => void
  getCachedUserData: () => any
  clearAuthCache: () => void
}

export interface ResumeVersion {
  id: string
  content: string
  timestamp: Date
  isAutoSave: boolean
}

export interface ResumeState extends BaseState {
  content: string
  originalContent: string
  versions: ResumeVersion[]
  isDirty: boolean
  lastSaved: Date | null
  retryCount: number
  isGeneratingPDF: boolean
  pdfProgress: number
  pdfStage: string
  keywords: string[]
  keywordsLoading: boolean
  keywordsError: string | null
}

export interface ResumeActions {
  updateContent: (content: string) => void
  saveResume: (userId?: string) => Promise<void>
  resetToOriginal: () => void
  retry: (userId?: string) => Promise<void>
  addVersion: (content: string, isAutoSave?: boolean) => void
  restoreVersion: (versionId: string) => void
  clearError: () => void
  updateKeywords: (keywords: string[]) => void
  setKeywordsLoading: (loading: boolean) => void
  setKeywordsError: (error: string | null) => void
  // Internal methods
  loadResume: (userId: string, retryCount?: number) => Promise<void>
  handleSaveResume: (userId: string, retryCount?: number) => Promise<void>
  initializeResume: (userId: string) => Promise<void>
  setPDFGenerating: (isGenerating: boolean) => void
  setPDFProgress: (progress: number, stage: string) => void
  sleep: (ms: number) => Promise<void>
}

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success' | 'warning'
  duration?: number
}

export interface UIState {
  theme: 'light' | 'dark' | 'system'
  isMobile: boolean
  toasts: Toast[]
  modals: {
    isSignUpOpen: boolean
    isProfileOpen: boolean
    isResultsOpen: boolean
  }
  navigation: {
    currentPage: string
    previousPage: string | null
  }
  progress: {
    isVisible: boolean
    value: number
    message: string
  }
}

export interface UIActions {
  setTheme: (theme: UIState['theme']) => void
  setIsMobile: (isMobile: boolean) => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
  openModal: (modal: keyof UIState['modals']) => void
  closeModal: (modal: keyof UIState['modals']) => void
  setCurrentPage: (page: string) => void
  showProgress: (value: number, message?: string) => void
  hideProgress: () => void
  // Utility methods
  showSuccess: (message: string, title?: string) => void
  showError: (message: string, title?: string) => void
  showWarning: (message: string, title?: string) => void
  showInfo: (message: string, title?: string) => void
}

export interface RootState {
  auth: AuthState & { actions: AuthActions }
  resume: ResumeState & { actions: ResumeActions }
  ui: UIState & { actions: UIActions }
}

export interface StoreSlice<T> {
  (...args: any[]): T
}

export interface MiddlewareConfig {
  name: string
  version: number
  enableDevtools: boolean
  enableLogger: boolean
  persistence: {
    enabled: boolean
    key: string
    storage: 'localStorage' | 'sessionStorage'
    partialize?: (state: any) => any
  }
}