"use client"

import { useEffect, Suspense, lazy } from "react"
import { motion } from "framer-motion"

// Views
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import LoginPage from "@/app/login/page"

// Lazy load BackgroundGlow for better performance
const BackgroundGlow = lazy(() => import('./BackgroundGlow'))

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type AppState = "login"

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
  const router = useRouter()
  const pathname = usePathname()

  /* ----------------------------- Lifecycle ------------------------------ */
  // Handle auth state changes using AuthContext data
  const { user: authUser, loading: authLoading, hasResume } = useAuth()
  
  useEffect(() => {
    console.log("🔍 AUTH DEBUG:", {
      authUser: authUser ? { id: authUser.id, email: authUser.email } : null,
      authLoading,
      hasResume,
      pathname
    })

    // Wait for auth to finish loading before making decisions
    if (authLoading) return

    // Only redirect if we're on the root path to avoid redirect loops
    if (pathname !== "/") return

    if (authUser) {
      // Check AuthContext for resume data to route appropriately
      if (hasResume) {
        console.log("✅ Resume found, redirecting to dashboard")
        router.push("/dashboard")
      } else {
        console.log("❌ No resume found, redirecting to setup")
        router.push("/resume-setup")
      }
    } else {
      // No auth user, stay on login page
      console.log("🚫 No auth user, staying on login page")
    }
  }, [authUser, authLoading, hasResume, router, pathname])

  // Show login page for unauthenticated users
  const renderView = () => {
    return <LoginPage />
  }

  /* ------------------------------ Render ------------------------------- */
  
  // Only show loading if auth is still loading
  if (authLoading) {
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
      {renderView()}
    </div>
  )
}
