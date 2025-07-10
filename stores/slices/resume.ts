import { StateCreator } from 'zustand'
import { getResume, saveResume, validateResumeContent, getDefaultResumeTemplate } from '@/lib/database/resume-service'
import { ResumeState, ResumeActions, ResumeVersion } from '../types'

export type ResumeSlice = ResumeState & { actions: ResumeActions }

const initialState: ResumeState = {
  content: '',
  originalContent: '',
  versions: [],
  loading: 'idle',
  error: null,
  isDirty: false,
  lastSaved: null,
  retryCount: 0,
  isGeneratingPDF: false,
  pdfProgress: 0,
  pdfStage: '',
  keywords: [],
  keywordsLoading: false,
  keywordsError: null,
}

export const createResumeSlice: StateCreator<ResumeSlice, [["zustand/immer", never]], [], ResumeSlice> = (set, get) => ({
  ...initialState,
  
  actions: {
    updateContent: (content: string) => {
      set((state) => {
        state.content = content
        state.isDirty = content !== state.originalContent
        // Clear error on user input
        if (state.error) {
          state.error = null
        }
      })
    },

    saveResume: async (userId?: string) => {
      const { content, retryCount } = get()
      
      if (!userId) {
        set((state) => {
          state.error = 'No user ID provided'
        })
        return
      }

      return get().actions.handleSaveResume(userId, retryCount)
    },

    resetToOriginal: () => {
      set((state) => {
        state.content = state.originalContent
        state.isDirty = false
        state.error = null
      })
    },

    retry: async (userId?: string) => {
      const { loading } = get()
      if (loading === 'error' && userId) {
        await get().actions.loadResume(userId, 0) // Reset retry count
      }
    },

    addVersion: (content: string, isAutoSave = false) => {
      set((state) => {
        const newVersion: ResumeVersion = {
          id: Date.now().toString(),
          content,
          timestamp: new Date(),
          isAutoSave,
        }
        state.versions.unshift(newVersion)
        // Keep only last 10 versions
        if (state.versions.length > 10) {
          state.versions = state.versions.slice(0, 10)
        }
      })
    },

    restoreVersion: (versionId: string) => {
      const { versions } = get()
      const version = versions.find(v => v.id === versionId)
      if (version) {
        set((state) => {
          state.content = version.content
          state.isDirty = version.content !== state.originalContent
        })
      }
    },

    clearError: () => {
      set((state) => {
        state.error = null
      })
    },

    updateKeywords: (keywords: string[]) => {
      set((state) => {
        state.keywords = keywords
      })
    },

    setKeywordsLoading: (loading: boolean) => {
      set((state) => {
        state.keywordsLoading = loading
      })
    },

    setKeywordsError: (error: string | null) => {
      set((state) => {
        state.keywordsError = error
      })
    },

    // Internal helper methods
    loadResume: async (userId: string, retryCount = 0) => {
      const MAX_RETRIES = 3
      const RETRY_DELAYS = [1000, 2000, 4000] // Exponential backoff

      set((state) => {
        state.loading = 'loading'
        state.error = null
        state.retryCount = retryCount
      })

      try {
        const result = await getResume(userId)

        if (result.success) {
          const content = result.data?.resume_md || getDefaultResumeTemplate()
          const originalContent = result.data?.resume_md || ''
          
          set((state) => {
            state.content = content
            state.originalContent = originalContent
            state.loading = 'success'
            state.error = null
            state.isDirty = false
            state.lastSaved = result.data?.created_at ? new Date(result.data.created_at) : null
            state.retryCount = 0
          })
        } else {
          throw new Error(result.error || 'Failed to load resume')
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        
        // Auto-retry logic
        if (retryCount < MAX_RETRIES) {
          console.log(`Resume load failed (attempt ${retryCount + 1}/${MAX_RETRIES + 1}), retrying in ${RETRY_DELAYS[retryCount]}ms...`)
          await get().actions.sleep(RETRY_DELAYS[retryCount])
          return get().actions.loadResume(userId, retryCount + 1)
        }

        // Max retries exceeded
        set((state) => {
          state.loading = 'error'
          state.error = `Failed to load resume after ${MAX_RETRIES + 1} attempts: ${errorMessage}`
          state.retryCount = retryCount
        })
      }
    },

    handleSaveResume: async (userId: string, retryCount = 0) => {
      const MAX_RETRIES = 3
      const RETRY_DELAYS = [1000, 2000, 4000] // Exponential backoff
      const { content } = get()

      set((state) => {
        state.loading = 'loading'
        state.error = null
        state.retryCount = retryCount
      })

      try {
        // Validate content first
        const validation = validateResumeContent(content)
        if (!validation.valid) {
          set((state) => {
            state.loading = 'error'
            state.error = validation.error || 'Invalid resume content'
          })
          return
        }

        const result = await saveResume(userId, content)

        if (result.success) {
          // Add version before updating original content
          get().actions.addVersion(content, false)
          
          set((state) => {
            state.originalContent = content
            state.loading = 'success'
            state.error = null
            state.isDirty = false
            state.lastSaved = new Date()
            state.retryCount = 0
          })
        } else {
          throw new Error(result.error || 'Failed to save resume')
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        
        // Auto-retry logic
        if (retryCount < MAX_RETRIES) {
          console.log(`Resume save failed (attempt ${retryCount + 1}/${MAX_RETRIES + 1}), retrying in ${RETRY_DELAYS[retryCount]}ms...`)
          await get().actions.sleep(RETRY_DELAYS[retryCount])
          return get().actions.handleSaveResume(userId, retryCount + 1)
        }

        // Max retries exceeded
        set((state) => {
          state.loading = 'error'
          state.error = `Failed to save resume after ${MAX_RETRIES + 1} attempts: ${errorMessage}`
          state.retryCount = retryCount
        })
      }
    },

    initializeResume: async (userId: string) => {
      if (userId) {
        await get().actions.loadResume(userId)
      }
    },

    // PDF generation methods
    setPDFGenerating: (isGenerating: boolean) => {
      set((state) => {
        state.isGeneratingPDF = isGenerating
        if (!isGenerating) {
          state.pdfProgress = 0
          state.pdfStage = ''
        }
      })
    },

    setPDFProgress: (progress: number, stage: string) => {
      set((state) => {
        state.pdfProgress = progress
        state.pdfStage = stage
      })
    },

    sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  },
})