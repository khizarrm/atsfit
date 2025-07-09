import { useAuthStore } from '../index'
import { authSelectors } from '../utils/selectors'

export interface AuthContextType {
  user: any | null
  session: any | null
  loading: boolean
  resumeMd: string | null
  signUp: (email: string, password: string) => Promise<{ data: any; error: any }>
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>
  signOut: () => Promise<{ error: any }>
  refreshResume: () => Promise<void>
  hasResume: boolean
  refreshUserProfile: () => Promise<void>
  updateResumeCache: (newResumeContent: string) => void
}

export function useAuth(): AuthContextType {
  const user = useAuthStore(state => state.user)
  const session = useAuthStore(state => state.session)
  const loading = useAuthStore(state => state.loading === 'loading')
  const resumeMd = useAuthStore(state => state.resumeMd)
  const hasResume = useAuthStore(state => state.hasResume)
  
  const signUp = useAuthStore(state => state.actions.signUp)
  const signIn = useAuthStore(state => state.actions.signIn)
  const signOut = useAuthStore(state => state.actions.signOut)
  const refreshResume = useAuthStore(state => state.actions.refreshResume)
  const refreshUserProfile = useAuthStore(state => state.actions.refreshUserProfile)
  const updateResumeCache = useAuthStore(state => state.actions.updateResumeCache)

  return {
    user,
    session,
    loading,
    resumeMd,
    signUp,
    signIn,
    signOut,
    refreshResume,
    hasResume,
    refreshUserProfile,
    updateResumeCache,
  }
}