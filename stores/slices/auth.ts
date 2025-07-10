import { StateCreator } from 'zustand'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getUserProfile } from '@/lib/database/resume-operations'
import { AuthState, AuthActions } from '../types'

export type AuthSlice = AuthState & { actions: AuthActions }

const initialState: AuthState = {
  user: null,
  session: null,
  loading: 'idle',
  error: null,
  resumeMd: null,
  hasResume: false,
}

export const createAuthSlice: StateCreator<AuthSlice, [["zustand/immer", never]], [], AuthSlice> = (set, get) => ({
  ...initialState,
  
  actions: {
    signIn: async (email: string, password: string) => {
      set((state) => {
        state.loading = 'loading'
        state.error = null
      })
      
      try {
        const result = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (result.error) {
          set((state) => {
            state.loading = 'error'
            state.error = result.error.message
          })
        } else {
          set((state) => {
            state.loading = 'success'
            state.user = result.data.user
            state.session = result.data.session
          })
          
          // Fetch user data after successful sign in
          if (result.data.user) {
            await get().actions.fetchUserData(result.data.user.id)
          }
        }
        
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        set((state) => {
          state.loading = 'error'
          state.error = errorMessage
        })
        return { data: null, error: { message: errorMessage } }
      }
    },

    signUp: async (email: string, password: string) => {
      set((state) => {
        state.loading = 'loading'
        state.error = null
      })
      
      try {
        const result = await supabase.auth.signUp({
          email,
          password,
        })
        
        if (result.error) {
          set((state) => {
            state.loading = 'error'
            state.error = result.error.message
          })
        } else {
          set((state) => {
            state.loading = 'success'
            state.user = result.data.user
            state.session = result.data.session
          })
        }
        
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        set((state) => {
          state.loading = 'error'
          state.error = errorMessage
        })
        return { data: null, error: { message: errorMessage } }
      }
    },

    signOut: async () => {
      set((state) => {
        state.loading = 'loading'
        state.error = null
      })
      
      try {
        const result = await supabase.auth.signOut()
        
        if (result.error) {
          set((state) => {
            state.loading = 'error'
            state.error = result.error.message
          })
        } else {
          set((state) => {
            state.loading = 'success'
            state.user = null
            state.session = null
            state.resumeMd = null
            state.hasResume = false
          })
          
          // Clear cached data
          get().actions.clearAuthCache()
        }
        
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        set((state) => {
          state.loading = 'error'
          state.error = errorMessage
        })
        return { error: { message: errorMessage } }
      }
    },

    refreshResume: async () => {
      const { user } = get()
      if (user) {
        await get().actions.fetchUserResume(user.id)
      }
    },

    refreshUserProfile: async () => {
      await get().actions.fetchUserProfile()
    },

    updateResumeCache: (newResumeContent: string) => {
      set((state) => {
        state.resumeMd = newResumeContent
        state.hasResume = !!newResumeContent.trim()
      })
      
      const { user } = get()
      if (user) {
        get().actions.cacheUserData(user, newResumeContent)
      }
    },

    clearError: () => {
      set((state) => {
        state.error = null
      })
    },

    // Internal helper methods
    fetchUserProfile: async () => {
      try {
        const { has_resume, error } = await getUserProfile()
        
        if (error) {
          console.error('Error fetching user profile:', error)
          set((state) => {
            state.hasResume = false
          })
          return
        }
        
        set((state) => {
          state.hasResume = has_resume
        })
      } catch (error) {
        console.error('Error fetching user profile:', error)
        set((state) => {
          state.hasResume = false
        })
      }
    },

    fetchUserResume: async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('resumes')
          .select('resume_md')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error) {
          console.error('Error fetching resume:', error)
          set((state) => {
            state.resumeMd = null
          })
          return
        }

        set((state) => {
          state.resumeMd = data?.resume_md || null
        })
      } catch (error) {
        console.error('Error fetching resume:', error)
        set((state) => {
          state.resumeMd = null
        })
      }
    },

    fetchUserData: async (userId: string, forceRefresh = false) => {
      try {
        // Check if we have fresh cached data and don't need to hit the database
        const cachedData = get().actions.getCachedUserData()
        if (!forceRefresh && cachedData && cachedData.user?.id === userId) {
          // Use cached data immediately - no database calls needed!
          set((state) => {
            state.resumeMd = cachedData.resumeMd
            state.hasResume = !!cachedData.resumeMd?.trim()
          })
          return
        }

        // Only fetch from database if cache is stale or missing
        const { data, error } = await supabase
          .from('resumes')
          .select('resume_md')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error) {
          console.error('Error fetching resume:', error)
          set((state) => {
            state.resumeMd = null
            state.hasResume = false
          })
        } else {
          const resumeContent = data?.resume_md || null
          set((state) => {
            state.resumeMd = resumeContent
            state.hasResume = !!resumeContent?.trim()
          })
          
          // Cache the fresh data
          const { user } = get()
          if (user) {
            get().actions.cacheUserData(user, resumeContent)
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        set((state) => {
          state.hasResume = false
          state.resumeMd = null
        })
      }
    },

    initializeAuth: async () => {
      set((state) => {
        state.loading = 'loading'
      })
      
      try {
        // Try to load cached data first for immediate response
        const cachedData = get().actions.getCachedUserData()
        if (cachedData) {
          set((state) => {
            state.user = cachedData.user
            state.resumeMd = cachedData.resumeMd
            state.hasResume = !!cachedData.resumeMd?.trim()
          })
        }

        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          throw error
        }
        
        set((state) => {
          state.session = session
          state.user = session?.user ?? null
        })
        
        if (session?.user) {
          // Use cached data if available, only fetch from DB if needed
          await get().actions.fetchUserData(session.user.id)
        } else {
          // For anonymous users, immediately clear state
          set((state) => {
            state.hasResume = false
            state.resumeMd = null
          })
          get().actions.clearAuthCache()
        }
        
        set((state) => {
          state.loading = 'success'
        })
      } catch (error) {
        console.error('Auth initialization error:', error)
        set((state) => {
          state.loading = 'error'
          state.error = error instanceof Error ? error.message : 'Auth initialization failed'
          state.hasResume = false
          state.resumeMd = null
        })
        get().actions.clearAuthCache()
      }
    },

    setupAuthListener: () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        set((state) => {
          state.session = session
          state.user = session?.user ?? null
        })
        
        if (session?.user) {
          // On sign in, use cached data immediately if available
          const cachedData = get().actions.getCachedUserData()
          if (cachedData && cachedData.user?.id === session.user.id) {
            // Instant load with cached data
            set((state) => {
              state.resumeMd = cachedData.resumeMd
              state.hasResume = !!cachedData.resumeMd?.trim()
              state.loading = 'success'
            })
          } else {
            // No cache, fetch from database
            set((state) => {
              state.loading = 'loading'
            })
            await get().actions.fetchUserData(session.user.id)
            set((state) => {
              state.loading = 'success'
            })
          }
        } else {
          // On sign out, clear all cached data immediately
          set((state) => {
            state.hasResume = false
            state.resumeMd = null
            state.loading = 'success'
          })
          get().actions.clearAuthCache()
        }
      })
      
      return subscription
    },

    // Cache management methods
    cacheUserData: (user: User | null, resumeMd: string | null) => {
      try {
        const cacheData = {
          user,
          resumeMd,
          timestamp: Date.now()
        }
        sessionStorage.setItem('atsfit_auth_state', JSON.stringify(cacheData))
      } catch (error) {
        console.error('Error caching user data:', error)
      }
    },

    getCachedUserData: () => {
      try {
        const cached = sessionStorage.getItem('atsfit_auth_state')
        if (cached) {
          const data = JSON.parse(cached)
          // Cache expires after 30 minutes for better UX
          if (Date.now() - data.timestamp < 30 * 60 * 1000) {
            return data
          }
        }
      } catch (error) {
        console.error('Error reading cached user data:', error)
      }
      return null
    },

    clearAuthCache: () => {
      try {
        sessionStorage.removeItem('atsfit_auth_state')
        sessionStorage.removeItem('atsfit_user_profile')
        sessionStorage.removeItem('atsfit_resume_md')
      } catch (error) {
        console.error('Error clearing auth cache:', error)
      }
    },
  },
})