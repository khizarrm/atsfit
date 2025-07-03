"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { TrialManager } from '@/lib/utils/trial-manager'

interface TrialContextType {
  // Trial state
  attemptsRemaining: number
  currentAttempts: number
  maxAttempts: number
  hasAttemptsRemaining: boolean
  isTrialExpired: boolean
  
  // Trial actions
  makeAttempt: () => boolean
  resetTrial: () => void
  refreshTrialState: () => void
  
  // Display helpers
  getAttemptDisplayText: () => string
  canMakeAttempt: () => boolean
  
  // Session info
  sessionId: string
}

const TrialContext = createContext<TrialContextType | undefined>(undefined)

interface TrialProviderProps {
  children: ReactNode
}

export function TrialProvider({ children }: TrialProviderProps) {
  const [attemptsRemaining, setAttemptsRemaining] = useState(0)
  const [currentAttempts, setCurrentAttempts] = useState(0)
  const [maxAttempts, setMaxAttempts] = useState(0)
  const [sessionId, setSessionId] = useState('')
  const [isTrialExpired, setIsTrialExpired] = useState(false)

  // Initialize and refresh trial state
  const refreshTrialState = () => {
    setAttemptsRemaining(TrialManager.getRemainingAttempts())
    setCurrentAttempts(TrialManager.getCurrentAttempts())
    setMaxAttempts(TrialManager.getMaxAttempts())
    setIsTrialExpired(TrialManager.isTrialExpired())
    
    const session = TrialManager.getSession()
    setSessionId(session.sessionId)
  }

  // Initialize trial state on mount and when localStorage changes
  useEffect(() => {
    refreshTrialState()

    // Listen for localStorage changes (e.g., from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'atsfit_trial_session') {
        refreshTrialState()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Make an attempt and update state
  const makeAttempt = (): boolean => {
    const success = TrialManager.incrementAttempt()
    if (success) {
      refreshTrialState()
    }
    return success
  }

  // Reset trial and refresh state
  const resetTrial = () => {
    TrialManager.resetSession()
    refreshTrialState()
  }

  // Check if user can make an attempt
  const canMakeAttempt = (): boolean => {
    return TrialManager.canMakeAttempt()
  }

  // Get display text for attempts
  const getAttemptDisplayText = (): string => {
    return TrialManager.getAttemptDisplayText()
  }

  // Computed values
  const hasAttemptsRemaining = attemptsRemaining > 0 && !isTrialExpired

  const value: TrialContextType = {
    // State
    attemptsRemaining,
    currentAttempts,
    maxAttempts,
    hasAttemptsRemaining,
    isTrialExpired,
    sessionId,

    // Actions
    makeAttempt,
    resetTrial,
    refreshTrialState,

    // Helpers
    getAttemptDisplayText,
    canMakeAttempt,
  }

  return (
    <TrialContext.Provider value={value}>
      {children}
    </TrialContext.Provider>
  )
}

export function useTrial(): TrialContextType {
  const context = useContext(TrialContext)
  if (context === undefined) {
    throw new Error('useTrial must be used within a TrialProvider')
  }
  return context
}

// Hook for checking if we're in trial mode
export function useIsTrialMode(): boolean {
  const context = useContext(TrialContext)
  return context !== undefined
}