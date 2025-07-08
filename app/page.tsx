"use client"

import { useState, useEffect, useCallback, Suspense, lazy } from "react"
import { motion, AnimatePresence } from "framer-motion"

// Views
import { DashboardView } from "@/components/dashboard-view"
import { ResumeSetupView } from "@/components/resume-setup-view"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import LoginPage from "@/app/login/page"

// Lazy load BackgroundGlow for better performance
const BackgroundGlow = lazy(() => import('./BackgroundGlow'))

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type AppState =
  | "login"
  | "dashboard"
  | "profile"
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
 * Simple fallback background while BackgroundGlow loads
 */
function BackgroundFallback() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Static central radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,170,0.15)_0%,rgba(0,255,170,0.08)_25%,rgba(0,255,170,0.03)_50%,transparent_70%)]" />
    </div>
  )
}

export default function ATSFitApp() {
  /* ------------------------------- State --------------------------------- */
  const [currentState, setCurrentState] = useState<AppState>("login")
  const [user, setUser] = useState<User | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false)
  const router = useRouter()

  /* ----------------------------- Lifecycle ------------------------------ */
  // No state restoration - always start fresh for predictable behavior

  // Handle auth state changes using AuthContext data
  const { user: authUser, loading: authLoading, hasResume } = useAuth()
  
  useEffect(() => {
    console.log("🔍 AUTH DEBUG:", {
      authUser: authUser ? { id: authUser.id, email: authUser.email } : null,
      authLoading,
      hasResume,
      hasInitialized,
      currentState
    })

    // Initialize immediately if we have auth data, regardless of loading state
    if (authUser && !hasInitialized) {
      const userData = {
        id: authUser.id,
        email: authUser.email!,
        name: authUser.user_metadata?.full_name || authUser.email!,
      }
      setUser(userData)
      
      // Check AuthContext for resume data to route appropriately
      if (hasResume) {
        console.log("✅ Resume found, going to dashboard")
        setCurrentState("dashboard")
      } else {
        console.log("❌ No resume found, redirecting to setup")
        setCurrentState("resume-setup")
      }
      setHasInitialized(true)
    } else if (!authUser && !authLoading && !hasInitialized) {
      // Only set login state if we're definitely not loading and have no user
      console.log("🚫 No auth user, staying on login page")
      setUser(null)
      setCurrentState("login")
      setHasInitialized(true)
    }
  }, [authUser, authLoading, hasResume, hasInitialized, currentState])

  // No state persistence - let users navigate naturally without memory

  /* ------------------------------ Handlers ------------------------------ */
  const goTo = useCallback((state: AppState) => setCurrentState(state), [])


  /* ---------------------------- View Factory ---------------------------- */
  const renderView = () => {
    switch (currentState) {
      case "login":
        return <LoginPage />
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
            onSignUp={() => goTo("login")}
            onGoToProfile={() => router.push("/profile")}
            user={user}
          />
        )
      default:
        return null
    }
  }

  /* ------------------------------ Render ------------------------------- */
  
  // Only show loading if we haven't initialized AND we don't have cached user data
  if (authLoading && !hasInitialized && !authUser) {
    return (
      <div className="min-h-screen bg-black relative text-white flex items-center justify-center">
        <Suspense fallback={<BackgroundFallback />}>
          <BackgroundGlow />
        </Suspense>
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="w-6 h-6 border-2 border-[#00FFAA] border-t-transparent rounded-full mx-auto mb-3"
          />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-black relative text-white">
      <Suspense fallback={<BackgroundFallback />}>
        <BackgroundGlow />
      </Suspense>
      <AnimatePresence mode="sync">{renderView()}</AnimatePresence>
    </div>
  )
}
