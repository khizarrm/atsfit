"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getUserProfile } from '@/lib/database/resume-operations'

interface AuthContextType {
  user: User | null
  session: Session | null
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

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [resumeMd, setResumeMd] = useState<string | null>(null)
  const [hasResume, setHasResume] = useState(false)

  // Cache keys for sessionStorage
  const CACHE_KEYS = {
    AUTH_STATE: 'atsfit_auth_state',
    USER_PROFILE: 'atsfit_user_profile',
    RESUME_MD: 'atsfit_resume_md'
  }

  // Helper functions for caching
  const cacheAuthState = (user: User | null, hasResume: boolean) => {
    try {
      const cacheData = {
        user,
        hasResume,
        timestamp: Date.now()
      }
      sessionStorage.setItem(CACHE_KEYS.AUTH_STATE, JSON.stringify(cacheData))
    } catch (error) {
      console.error('Error caching auth state:', error)
    }
  }

  const getCachedAuthState = () => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEYS.AUTH_STATE)
      if (cached) {
        const data = JSON.parse(cached)
        // Cache expires after 5 minutes
        if (Date.now() - data.timestamp < 5 * 60 * 1000) {
          return data
        }
      }
    } catch (error) {
      console.error('Error reading cached auth state:', error)
    }
    return null
  }

  const clearAuthCache = () => {
    try {
      sessionStorage.removeItem(CACHE_KEYS.AUTH_STATE)
      sessionStorage.removeItem(CACHE_KEYS.USER_PROFILE)
      sessionStorage.removeItem(CACHE_KEYS.RESUME_MD)
    } catch (error) {
      console.error('Error clearing auth cache:', error)
    }
  }

  const fetchUserProfile = async () => {
    try {
      const { has_resume, error } = await getUserProfile()
      
      if (error) {
        console.error('Error fetching user profile:', error)
        setHasResume(false)
        return
      }
      
      setHasResume(has_resume)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setHasResume(false)
    }
  }

  const fetchUserResume = async (userId: string) => {
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
        setResumeMd(null)
        return
      }

      setResumeMd(data?.resume_md || null)
    } catch (error) {
      console.error('Error fetching resume:', error)
      setResumeMd(null)
    }
  }

  const fetchUserDataOnAuth = async (userId: string) => {
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database operation timed out')), 10000) // 10 second timeout
      })

      // Fetch both profile and resume content in parallel for better UX
      const dataPromise = Promise.all([
        getUserProfile(),
        supabase
          .from('resumes')
          .select('resume_md')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      ])

      const [profileResult, resumeResult] = await Promise.race([
        dataPromise,
        timeoutPromise
      ]) as [any, any]

      // Update profile state
      if (profileResult.error) {
        console.error('Error fetching user profile:', profileResult.error)
        setHasResume(false)
      } else {
        setHasResume(profileResult.has_resume)
      }

      // Update resume content state
      if (resumeResult.error) {
        console.error('Error fetching resume:', resumeResult.error)
        setResumeMd(null)
      } else {
        setResumeMd(resumeResult.data?.resume_md || null)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      // Set fallback values to prevent app from breaking
      setHasResume(false)
      setResumeMd(null)
    }
  }

  useEffect(() => {
    // Try to load cached auth state first for immediate response
    const cachedAuth = getCachedAuthState()
    if (cachedAuth) {
      setUser(cachedAuth.user)
      setHasResume(cachedAuth.hasResume)
      // Still need to verify with server, but user sees immediate response
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Fetch both user profile and resume content for caching
        fetchUserDataOnAuth(session.user.id).finally(() => {
          setLoading(false)
          // Cache the auth state after successful fetch
          cacheAuthState(session.user, hasResume)
        })
      } else {
        // For anonymous users, immediately clear state and stop loading
        setHasResume(false)
        setResumeMd(null)
        setLoading(false)
        clearAuthCache()
      }
    }).catch((error) => {
      console.error('Auth session error:', error)
      // Set loading to false even on error to prevent infinite loading
      setHasResume(false)
      setResumeMd(null)
      setLoading(false)
      clearAuthCache()
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // On sign in, cache both profile and resume data
        setLoading(true) // Set loading only for authenticated users
        fetchUserDataOnAuth(session.user.id).finally(() => {
          setLoading(false)
          // Cache the updated auth state
          cacheAuthState(session.user, hasResume)
        })
      } else {
        // On sign out, clear all cached data immediately
        setHasResume(false)
        setResumeMd(null)
        setLoading(false)
        clearAuthCache()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    return await supabase.auth.signUp({
      email,
      password,
    })
  }

  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    })
  }

  const signOut = async () => {
    return await supabase.auth.signOut()
  }

  const refreshResume = async () => {
    if (user) {
      await fetchUserResume(user.id)
    }
  }

  const refreshUserProfile = async () => {
    await fetchUserProfile()
  }

  const updateResumeCache = (newResumeContent: string) => {
    // Instantly update the cached resume content for smooth UX
    setResumeMd(newResumeContent)
    // Also update hasResume if it was previously false
    if (!hasResume && newResumeContent.trim()) {
      setHasResume(true)
    }
  }

  const value = {
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}