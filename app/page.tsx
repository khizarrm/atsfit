"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LoginView } from "@/components/login-view"
import { TryItView } from "@/components/try-it-view"
import { UploadView } from "@/components/upload-view"
import { DashboardView } from "@/components/dashboard-view"
import ThinkingView from "@/components/thinking-view"
import { ResultsView } from "@/components/results-view"
import { ProfileView } from "@/components/profile-view"
import { supabase } from "@/lib/supabase"

type AppState = "login" | "tryit" | "upload" | "dashboard" | "thinking" | "results" | "profile"

// Mock auth state - replace with real Supabase auth later
interface User {
  id: string
  email: string
  name: string
}

export default function ATSFitApp() {
  const [currentState, setCurrentState] = useState<AppState>("login")
  const [user, setUser] = useState<User | null>(null) // This will be Supabase user
  const [isTrialMode, setIsTrialMode] = useState(false)
  const [uploadedText, setUploadedText] = useState<string | null>(null)
  const [jobDescription, setJobDescription] = useState("")
  const [optimizedResume, setOptimizedResume] = useState("")
  const [initialAtsScore, setInitialAtsScore] = useState<number | undefined>()
  const [finalAtsScore, setFinalAtsScore] = useState<number | undefined>()
  const [nextJobUrl, setNextJobUrl] = useState("")
  
  // Use ref to track current state without adding to useEffect dependencies
  const currentStateRef = useRef(currentState)
  currentStateRef.current = currentState

  useEffect(() => {
    const savedState = localStorage.getItem("ATSFitAppState")
    if (savedState && savedState !== "login" && savedState !== "tryit") {
      setCurrentState(savedState as AppState)
    }
  }, [])

  const handleLogin = async () => {
    // Auth is now handled by the auth context and useEffect listener
    // The login modal will handle the actual authentication
    // State changes will be managed by the auth state listener
  }

  const handleTryIt = () => {
    setIsTrialMode(true)
    setUser(null) // No user in trial mode
    setCurrentState("tryit")
  }

  const handleBackToLogin = () => {
    // Reset trial state when going back
    setIsTrialMode(false)
    setUser(null)
    setUploadedText(null)
    setJobDescription("")
    setOptimizedResume("")
    setCurrentState("login")
  }

  const handleTextSubmit = (text: string) => {
    setUploadedText(text)
  }

  const handleConfirmUpload = () => {
    if (user) {
      setCurrentState("dashboard")
    } else {
      // This shouldn't happen in trial mode, but safety check
      setCurrentState("login")
    }
  }

  const handleJobSubmit = (description: string) => {
    setJobDescription(description)
    // Don't switch to thinking view anymore
  }

  const handleAnalysisComplete = (result: string, initialScore?: number, finalScore?: number) => {
    // Validate result before setting state
    if (typeof result !== 'string') {
      console.error('Invalid result type received:', typeof result)
      return
    }
    
    if (result.length === 0) {
      console.error('Empty result received')
      return
    }
    
    setOptimizedResume(result)
    setInitialAtsScore(initialScore)
    setFinalAtsScore(finalScore)
    setNextJobUrl("") // Clear the next job URL after completion
    setCurrentState("results")
  }

  const handleBackToDashboard = () => {
    if (user) {
      setCurrentState("dashboard")
    } else {
      // In trial mode, go back to try-it view
      setCurrentState("tryit")
    }
  }

  const handleGoToProfile = () => {
    setCurrentState("profile")
  }

  const handleBackFromProfile = () => {
    setCurrentState("dashboard")
  }

  const handleNextJob = (jobUrl: string) => {
    // Set the next job URL and go back to dashboard for optimization
    setNextJobUrl(jobUrl)
    setJobDescription("") // Clear previous job description
    setCurrentState("dashboard")
  }

  const handleSignUpFromTrial = () => {
    // Convert trial user to full user
    // TODO: Implement Supabase signup with trial data preservation
    handleLogin()
  }

  const handleSignUpFromDashboard = () => {
    setCurrentState("login")
  }

  // Supabase auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentStateValue = currentStateRef.current
      
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.full_name || session.user.email!
        })
        setIsTrialMode(false)
        setCurrentState((prev) => {
          // Only redirect to dashboard from login/tryit states
          // Don't interfere with other states like results, profile, etc.
          if (prev === "login" || prev === "tryit") {
            return "dashboard"
          }
          return prev
        })
      } else {
        setUser(null)
        
        // Don't redirect to login during trial mode or if user is in results/profile states
        // Only redirect on explicit sign out or initial load
        if (!isTrialMode && currentStateValue !== "results" && currentStateValue !== "profile" && event !== 'TOKEN_REFRESHED') {
          setCurrentState("login")
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [isTrialMode])


  useEffect(() => {
    if (currentState !== "login" && currentState !== "tryit") {
      localStorage.setItem("ATSFitAppState", currentState)
    }
}, [currentState])

  return (
    <div className="min-h-screen bg-black relative">
      {/* Powerful Green Glow Streams */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Central radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,170,0.15)_0%,rgba(0,255,170,0.08)_25%,rgba(0,255,170,0.03)_50%,transparent_70%)]" />

        {/* Animated flowing streams */}
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(ellipse_800px_400px_at_20%_30%, rgba(0,255,170,0.1), transparent)",
              "radial-gradient(ellipse_800px_400px_at_80%_70%, rgba(0,255,170,0.1), transparent)",
              "radial-gradient(ellipse_800px_400px_at_40%_80%, rgba(0,255,170,0.1), transparent)",
              "radial-gradient(ellipse_800px_400px_at_60%_20%, rgba(0,255,170,0.1), transparent)",
              "radial-gradient(ellipse_800px_400px_at_20%_30%, rgba(0,255,170,0.1), transparent)",
            ],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />

        {/* Pulsing edge glows */}
        <motion.div
          className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#00FFAA] to-transparent opacity-30"
          animate={{
            opacity: [0.2, 0.6, 0.2],
            scaleX: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="absolute bottom-0 right-0 w-full h-px bg-gradient-to-l from-transparent via-[#00FFAA] to-transparent opacity-30"
          animate={{
            opacity: [0.2, 0.6, 0.2],
            scaleX: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 1.5,
          }}
        />

        {/* Corner accent glows */}
        <motion.div
          className="absolute top-0 left-0 w-96 h-96 bg-[radial-gradient(circle,rgba(0,255,170,0.08),transparent_70%)]"
          animate={{
            opacity: [0.3, 0.7, 0.3],
            scale: [0.8, 1.1, 0.8],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="absolute bottom-0 right-0 w-96 h-96 bg-[radial-gradient(circle,rgba(0,255,170,0.08),transparent_70%)]"
          animate={{
            opacity: [0.3, 0.7, 0.3],
            scale: [0.8, 1.1, 0.8],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </div>

      <AnimatePresence mode="wait">
        {currentState === "login" && <LoginView key="login" onLogin={handleLogin} onTryIt={handleTryIt} />}
        {currentState === "tryit" && (
          <TryItView
            key="tryit"
            onJobSubmit={handleJobSubmit}
            onBack={handleBackToLogin}
            onSignUp={handleSignUpFromTrial}
            isTrialMode={isTrialMode}
          />
        )}
        {currentState === "upload" && (
          <UploadView
            key="upload"
            onTextSubmit={handleTextSubmit}
            onConfirm={handleConfirmUpload}
            uploadedText={uploadedText}
          />
        )}
        {currentState === "dashboard" && (
          <DashboardView 
            key="dashboard" 
            onJobSubmit={handleJobSubmit} 
            onAnalysisComplete={handleAnalysisComplete}
            onSignUp={handleSignUpFromDashboard} 
            onGoToProfile={handleGoToProfile}
            user={user}
          />
        )}
        {currentState === "results" && (
          <ResultsView
            key="results"
            optimizedResume={optimizedResume}
            onBack={handleBackToDashboard}
            onSignUp={handleSignUpFromTrial}
            onNextJob={handleNextJob}
            onGoToProfile={handleGoToProfile}
            isTrialMode={isTrialMode}
            user={user}
            initialAtsScore={initialAtsScore}
            finalAtsScore={finalAtsScore}
          />
        )}
        {currentState === "profile" && (
          <ProfileView
            key="profile"
            onBack={handleBackFromProfile}
            user={user}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
