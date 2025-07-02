"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"

// Views
import { LoginView } from "@/components/login-view"
import { TryItView } from "@/components/try-it-view"
import { UploadView } from "@/components/upload-view"
import { DashboardView } from "@/components/dashboard-view"
import { ResultsView } from "@/components/results-view"
import { ProfileView } from "@/components/profile-view"

import { supabase } from "@/lib/supabase"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type AppState =
  | "login"
  | "tryit"
  | "upload"
  | "dashboard"
  | "results"
  | "profile"

interface User {
  id: string
  email: string
  name: string
}

/* -------------------------------------------------------------------------- */
/*                              Helper Components                             */
/* -------------------------------------------------------------------------- */

/**
 * Animated neon‑green background used across the app.
 */
function BackgroundGlow() {
  return (
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
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Pulsing edge glows */}
      <motion.div
        className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#00FFAA] to-transparent opacity-30"
        animate={{ opacity: [0.2, 0.6, 0.2], scaleX: [0.8, 1.2, 0.8] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute bottom-0 right-0 w-full h-px bg-gradient-to-l from-transparent via-[#00FFAA] to-transparent opacity-30"
        animate={{ opacity: [0.2, 0.6, 0.2], scaleX: [0.8, 1.2, 0.8] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />

      {/* Corner accent glows */}
      <motion.div
        className="absolute top-0 left-0 w-96 h-96 bg-[radial-gradient(circle,rgba(0,255,170,0.08),transparent_70%)]"
        animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.8, 1.1, 0.8] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-96 h-96 bg-[radial-gradient(circle,rgba(0,255,170,0.08),transparent_70%)]"
        animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.8, 1.1, 0.8] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                Main App                                    */
/* -------------------------------------------------------------------------- */

export default function ATSFitApp() {
  /* ------------------------------- State --------------------------------- */
  const [currentState, setCurrentState] = useState<AppState>("login")
  const [user, setUser] = useState<User | null>(null)
  const [isTrialMode, setIsTrialMode] = useState(false)

  // Resume optimisation data
  const [uploadedText, setUploadedText] = useState<string | null>(null)
  const [jobDescription, setJobDescription] = useState("")
  const [optimizedResume, setOptimizedResume] = useState("")
  const [initialAtsScore, setInitialAtsScore] = useState<number | undefined>()
  const [finalAtsScore, setFinalAtsScore] = useState<number | undefined>()
  const [missingKeywordsCount, setMissingKeywordsCount] = useState<number | undefined>()
  const [nextJobUrl, setNextJobUrl] = useState("")

  // Avoid stale closures inside the auth listener
  const currentStateRef = useRef(currentState)
  currentStateRef.current = currentState

  /* ----------------------------- Lifecycle ------------------------------ */
  // Restore last screen (except auth screens) on refresh
  useEffect(() => {
    const savedState = localStorage.getItem("ATSFitAppState") as AppState | null
    if (savedState && savedState !== "login" && savedState !== "tryit") {
      setCurrentState(savedState)
    }
  }, [])

  // Supabase auth listener
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const prev = currentStateRef.current
      console.log("Auth event", event, "state ref was", prev)

      if (session?.user) {
        // Logged in
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.full_name || session.user.email!,
        })
        setIsTrialMode(false)
        setCurrentState((state) => (state === "login" || state === "tryit" ? "dashboard" : state))
      } else {
        // Logged out
        setUser(null)
        if (!isTrialMode && !["results", "profile"].includes(prev) && event !== "TOKEN_REFRESHED") {
          setCurrentState("login")
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [isTrialMode])

  // Persist navigation state (except auth screens)
  useEffect(() => {
    if (!["login", "tryit"].includes(currentState)) {
      localStorage.setItem("ATSFitAppState", currentState)
    }
  }, [currentState])

  /* ------------------------------ Handlers ------------------------------ */
  const goTo = useCallback((state: AppState) => setCurrentState(state), [])

  const handleTryIt = useCallback(() => {
    setIsTrialMode(true)
    setUser(null)
    goTo("tryit")
  }, [goTo])

  const handleBackToLogin = useCallback(() => {
    setIsTrialMode(false)
    setUser(null)
    setUploadedText(null)
    setJobDescription("")
    setOptimizedResume("")
    goTo("login")
  }, [goTo])

  const handleTextSubmit = useCallback((text: string) => setUploadedText(text), [])

  const handleConfirmUpload = useCallback(() => {
    user ? goTo("dashboard") : goTo("login")
  }, [user, goTo])

  const handleJobSubmit = useCallback((description: string) => setJobDescription(description), [])

  const handleAnalysisComplete = useCallback(
    (result: string, initialScore?: number, finalScore?: number, missingKeywordsCount?: number) => {
      if (!result) return console.error("Empty result received")
      console.log("Analysis Complete - Initial Score:", initialScore, "Final Score:", finalScore, "Missing Keywords:", missingKeywordsCount)
      setOptimizedResume(result)
      setInitialAtsScore(initialScore)
      setFinalAtsScore(finalScore)
      setMissingKeywordsCount(missingKeywordsCount)
      setNextJobUrl("")
      goTo("results")
    },
    [goTo]
  )

  const handleBackToDashboard = useCallback(() => {
    user ? goTo("dashboard") : goTo("tryit")
  }, [user, goTo])

  const handleNextJob = useCallback(
    (jobUrl: string) => {
      setNextJobUrl(jobUrl)
      setJobDescription("")
      goTo("dashboard")
    },
    [goTo]
  )

  const handleSignUp = useCallback(() => goTo("login"), [goTo])

  /* ---------------------------- View Factory ---------------------------- */
  const renderView = () => {
    switch (currentState) {
      case "login":
        return <LoginView onLogin={() => {}} onTryIt={handleTryIt} />
      case "tryit":
        return (
          <TryItView
            onJobSubmit={handleJobSubmit}
            onBack={handleBackToLogin}
            onSignUp={handleSignUp}
            isTrialMode={isTrialMode}
          />
        )
      case "upload":
        return (
          <UploadView
            onTextSubmit={handleTextSubmit}
            onConfirm={handleConfirmUpload}
            uploadedText={uploadedText}
          />
        )
      case "dashboard":
        return (
          <DashboardView
            onJobSubmit={handleJobSubmit}
            onAnalysisComplete={handleAnalysisComplete}
            onSignUp={handleSignUp}
            onGoToProfile={() => goTo("profile")}
            user={user}
          />
        )
      case "results":
        return (
          <ResultsView
            optimizedResume={optimizedResume}
            onBack={handleBackToDashboard}
            onSignUp={handleSignUp}
            onNextJob={handleNextJob}
            onGoToProfile={() => goTo("profile")}
            isTrialMode={isTrialMode}
            user={user}
            initialAtsScore={initialAtsScore}
            finalAtsScore={finalAtsScore}
            missingKeywordsCount={missingKeywordsCount}
          />
        )
      case "profile":
        return <ProfileView onBack={() => goTo("dashboard")} user={user} />
      default:
        return null
    }
  }

  /* ------------------------------ Render ------------------------------- */
  return (
    <div className="min-h-screen bg-black relative text-white">
      <BackgroundGlow />
      <AnimatePresence mode="sync">{renderView()}</AnimatePresence>
    </div>
  )
}
