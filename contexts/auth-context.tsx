"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  resumeMd: string | null
  signUp: (email: string, password: string) => Promise<{ data: any; error: any }>
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>
  signOut: () => Promise<{ error: any }>
  hasResume: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [resumeMd, setResumeMd] = useState<string | null>(null)
  const [hasResume, setHasResume] = useState(false)

  const CACHE_KEYS = {
    AUTH_STATE: 'atsfit_auth_state',
    USER_PROFILE: 'atsfit_user_profile',
    RESUME_MD: 'atsfit_resume_md'
  }

  const cacheUserData = (user: User | null, resumeMd: string | null) => {
    try {
      const cacheData = {
        user,
        resumeMd,
        timestamp: Date.now()
      }
      console.log("CACHE DATA BEING STORED:", { userEmail: user?.email, resumeLength: resumeMd?.length })
      localStorage.setItem(CACHE_KEYS.AUTH_STATE, JSON.stringify(cacheData))
    } catch (error) {
      console.error('Error caching user data:', error)
    }
  }
  
  const getCachedUserData = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEYS.AUTH_STATE)
      if (!cached) return null
      
      const data = JSON.parse(cached)
      const isExpired = Date.now() - data.timestamp > 24 * 60 * 60 * 1000 // 24 hours
      
      if (isExpired) {
        localStorage.removeItem(CACHE_KEYS.AUTH_STATE)
        return null
      }
      
      return data
    } catch (error) {
      console.error('Error reading cached user data:', error)
      return null
    }
  }

  const clearAuthCache = () => {
    try {
      localStorage.removeItem(CACHE_KEYS.AUTH_STATE)
      localStorage.removeItem(CACHE_KEYS.USER_PROFILE)
      localStorage.removeItem(CACHE_KEYS.RESUME_MD)
    } catch (error) {
      console.error('Error clearing auth cache:', error)
    }
  }


  const getUserResume = async (userId: string, forceRefresh = false, userToCache?: User) => {
    try {
      const cachedData = getCachedUserData()
      if (!forceRefresh && cachedData && cachedData.user?.id === userId) {
        setResumeMd(cachedData.resumeMd)
        setHasResume(!!cachedData.resumeMd?.trim())
        return
      }
      const { data, error } = await supabase
        .from('resumes')
        .select('resume_md')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('Error fetching resume:', error)
        setResumeMd(null)
        setHasResume(false)
        // Still cache user even if resume fetch fails
        const userToUse = userToCache || user
        cacheUserData(userToUse, null)
      } else {
        const resumeContent = data?.resume_md || null
        setResumeMd(resumeContent)
        setHasResume(!!resumeContent?.trim())
        
        // Cache user with resume content  
        const userToUse = userToCache || user
        console.log("CACHING USER WITH RESUME:", userToUse?.email, "resume length:", resumeContent?.length)
        cacheUserData(userToUse, resumeContent)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      setHasResume(false)
      setResumeMd(null)
    }
  }

  useEffect(() => {
    // Check for cached user data first for instant loading
    const cachedData = getCachedUserData()
    if (cachedData) {
      setUser(cachedData.user)
      setResumeMd(cachedData.resumeMd)
      setHasResume(!!cachedData.resumeMd?.trim())
      setLoading(false)
      return
    }

    // Get current session if no cache
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        getUserResume(session.user.id).finally(() => {
          setLoading(false)
        })
      } else {
        setHasResume(false)
        setResumeMd(null)
        setLoading(false)
        clearAuthCache()
      }
    }).catch((error) => {
      console.error('Auth session error:', error)
      setHasResume(false)
      setResumeMd(null)
      setLoading(false)
      clearAuthCache()
    })

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        const cachedData = getCachedUserData()
        if (cachedData && cachedData.user?.id === session.user.id) {
          setResumeMd(cachedData.resumeMd)
          setHasResume(!!cachedData.resumeMd?.trim())
          setLoading(false)
        } else {
          getUserResume(session.user.id).finally(() => {
            setLoading(false)
          })
        }
      } else {
        setHasResume(false)
        setResumeMd(null)
        setLoading(false)
        clearAuthCache()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    const result = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (result.data.session && result.data.user) {
      setSession(result.data.session)
      setUser(result.data.user)
      setHasResume(false)
      setResumeMd(null)
      setLoading(false)
      cacheUserData(result.data.user, null)
    }
    
    return result
  }

  const signIn = async (email: string, password: string) => {
    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    // Manually update auth context state on successful login
    if (result.data.session && result.data.user) {
      setSession(result.data.session)
      setUser(result.data.user)
      
      // Get resume data for this user
      const hasResumeFromMetadata = result.data.user.user_metadata?.has_resume || false
      setHasResume(hasResumeFromMetadata)

      // First get the resume content (getUserResume handles caching internally)
      await getUserResume(result.data.user.id, true, result.data.user) // pass the actual user data
      console.log("USER RESUME FETCHED AND CACHED")
      setLoading(false)
    }
    
    return result
  }

  const signOut = async () => {
    const result = await supabase.auth.signOut()
    
    // Manually clear auth context state on signout
    setSession(null)
    setUser(null)
    setHasResume(false)
    setResumeMd(null)
    setLoading(false)
    clearAuthCache()
    
    return result
  }


  const value = {
    user,
    session,
    loading,
    resumeMd,
    signUp,
    signIn,
    signOut,
    hasResume,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function getCachedUserData() {
  try {
    const cached = localStorage.getItem('atsfit_auth_state')
    if (!cached) return null
    
    const data = JSON.parse(cached)
    const isExpired = Date.now() - data.timestamp > 24 * 60 * 60 * 1000 // 24 hours
    
    if (isExpired) {
      localStorage.removeItem('atsfit_auth_state')
      return null
    }
    
    console.log("RETRIEVED CACHED DATA:", { userEmail: data.user?.email, resumeLength: data.resumeMd?.length })
    return data
  } catch (error) {
    console.error('Error reading cached user data:', error)
    return null
  }
}

export function updateCachedResume(resumeMd: string) {
  try {
    const cached = localStorage.getItem('atsfit_auth_state')
    if (!cached) return false
    
    const data = JSON.parse(cached)
    data.resumeMd = resumeMd
    data.timestamp = Date.now()
    
    localStorage.setItem('atsfit_auth_state', JSON.stringify(data))
    return true
  } catch (error) {
    console.error('Error updating cached resume:', error)
    return false
  }
}
