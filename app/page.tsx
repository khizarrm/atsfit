"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"

// Views
import { LoginView } from "@/components/login-view"
import { DashboardView } from "@/components/dashboard-view"
import { ResumeSetupView } from "@/components/resume-setup-view"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { ResultsView } from "@/components/results-view"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type AppState =
  | "login"
  | "dashboard"
  | "profile"
  | "results"
  | "resume-setup"

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
  const router = useRouter()

  /* ----------------------------- Lifecycle ------------------------------ */
  // No state restoration - always start fresh for predictable behavior

  // Handle auth state changes using AuthContext data
  const { user: authUser, loading: authLoading, hasResume } = useAuth()
  
  useEffect(() => {
    if (!authLoading) {
      if (authUser) {
        // User is logged in - use AuthContext user data
        const userData = {
          id: authUser.id,
          email: authUser.email!,
          name: authUser.user_metadata?.full_name || authUser.email!,
        }
        setUser(userData)
        
        // Check AuthContext for resume data to route appropriately
        if (hasResume) {
          console.log("Resume found, going to dashboard")
          setCurrentState("dashboard")
        } else {
          console.log("No resume found, redirecting to setup")
          setCurrentState("resume-setup")
        }
      } else {
        // User is logged out
        setUser(null)
        setCurrentState("login")
      }
    }
  }, [authUser, authLoading, hasResume])

  // No state persistence - let users navigate naturally without memory

  /* ------------------------------ Handlers ------------------------------ */
  const goTo = useCallback((state: AppState) => setCurrentState(state), [])

  const handleLogin = useCallback((user: User) => {
    setUser(user)
    setCurrentState("dashboard")
  }, [])

  /* ---------------------------- View Factory ---------------------------- */
  const renderView = () => {
    switch (currentState) {
      case "login":
        return <LoginView onLogin={handleLogin} />
      case "resume-setup":
        return (
          <ResumeSetupView
            onComplete={() => goTo("dashboard")}
            onSkip={() => goTo("dashboard")}
            user={user}
          />
        )
      case "dashboard":
        return (
          <DashboardView
            onGoToProfile={() => router.push("/profile")}
            onGoToResults={() => goTo("results")}
            user={user}
          />
        )
      case "results":
        return (
          <ResultsView
            onBack={() => goTo("dashboard")}
            user={user}
          />
        )
      default:
        return null
    }
  }

  /* ------------------------------ Render ------------------------------- */
  
  // Show loading screen while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black relative text-white flex items-center justify-center">
        <BackgroundGlow />
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="w-8 h-8 border-2 border-[#00FFAA] border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-400">Initializing...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-black relative text-white">
      <BackgroundGlow />
      <AnimatePresence mode="sync">{renderView()}</AnimatePresence>
    </div>
  )
}
