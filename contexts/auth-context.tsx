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
  const cacheUserData = (user: User | null, resumeMd: string | null) => {
    try {
      const cacheData = {
        user,
        resumeMd,
        timestamp: Date.now()
      }
      sessionStorage.setItem(CACHE_KEYS.AUTH_STATE, JSON.stringify(cacheData))
    } catch (error) {
      console.error('Error caching user data:', error)
    }
  }

  const getCachedUserData = () => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEYS.AUTH_STATE)
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

  const fetchUserDataOnAuth = async (userId: string, forceRefresh = false) => {
    try {
      // Check if we have fresh cached data and don't need to hit the database
      const cachedData = getCachedUserData()
      if (!forceRefresh && cachedData && cachedData.user?.id === userId) {
        // Use cached data immediately - no database calls needed!
        setResumeMd(cachedData.resumeMd)
        setHasResume(!!cachedData.resumeMd?.trim())
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
        setResumeMd(null)
        setHasResume(false)
      } else {
        const resumeContent = data?.resume_md || null
        setResumeMd(resumeContent)
        setHasResume(!!resumeContent?.trim())
        
        // Cache the fresh data
        cacheUserData(user, resumeContent)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      setHasResume(false)
      setResumeMd(null)
    }
  }

  useEffect(() => {
    // Try to load cached data first for immediate response
    const cachedData = getCachedUserData()
    if (cachedData) {
      setUser(cachedData.user)
      setResumeMd(cachedData.resumeMd)
      setHasResume(!!cachedData.resumeMd?.trim())
      // User sees immediate response with cached data
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Use cached data if available, only fetch from DB if needed
        fetchUserDataOnAuth(session.user.id).finally(() => {
          setLoading(false)
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
        // On sign in, use cached data immediately if available
        const cachedData = getCachedUserData()
        if (cachedData && cachedData.user?.id === session.user.id) {
          // Instant load with cached data
          setResumeMd(cachedData.resumeMd)
          setHasResume(!!cachedData.resumeMd?.trim())
          setLoading(false)
        } else {
          // No cache, fetch from database
          setLoading(true)
          fetchUserDataOnAuth(session.user.id).finally(() => {
            setLoading(false)
          })
        }
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
    // Also update hasResume based on content
    setHasResume(!!newResumeContent.trim())
    
    // Update the cache with new content
    if (user) {
      cacheUserData(user, newResumeContent)
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