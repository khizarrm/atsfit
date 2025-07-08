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
      // Fetch both profile and resume content in parallel for better UX
      const [profileResult, resumeResult] = await Promise.all([
        getUserProfile(),
        supabase
          .from('resumes')
          .select('resume_md')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      ])

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
      setHasResume(false)
      setResumeMd(null)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        // Fetch both user profile and resume content for caching
        fetchUserDataOnAuth(session.user.id).finally(() => setLoading(false))
      } else {
        setHasResume(false)
        setResumeMd(null)
        setLoading(false)
      }
    }).catch((error) => {
      console.error('Auth session error:', error)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        // On sign in, cache both profile and resume data
        fetchUserDataOnAuth(session.user.id).finally(() => setLoading(false))
      } else {
        // On sign out, clear all cached data
        setHasResume(false)
        setResumeMd(null)
        setLoading(false)
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