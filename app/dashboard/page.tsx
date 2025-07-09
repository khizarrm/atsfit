"use client"

import { useEffect, Suspense, lazy } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/stores/hooks/useAuth"
import { DashboardView } from "@/components/dashboard-view"
import { motion } from "framer-motion"

// Lazy load BackgroundGlow for better performance
const BackgroundGlow = lazy(() => import('../BackgroundGlow'))

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

export default function DashboardPage() {
  const { user: authUser, loading: authLoading, hasResume } = useAuth()
  const router = useRouter()

  // Authentication guard - redirect if not authenticated or no resume
  useEffect(() => {
    if (authLoading) return

    if (!authUser) {
      console.log("🚫 No auth user, redirecting to login")
      router.push("/")
      return
    }

    if (!hasResume) {
      console.log("❌ No resume found, redirecting to setup")
      router.push("/resume-setup")
      return
    }

    console.log("✅ User authenticated with resume, showing dashboard")
  }, [authUser, authLoading, hasResume, router])

  // Show loading screen while checking authentication
  if (authLoading || !authUser || !hasResume) {
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

  // Map user data for DashboardView
  const mappedUser = {
    id: authUser.id,
    email: authUser.email!,
    name: authUser.user_metadata?.full_name || authUser.email!,
  }

  return (
    <div className="min-h-screen bg-black relative text-white">
      <Suspense fallback={<BackgroundFallback />}>
        <BackgroundGlow />
      </Suspense>
      
      <DashboardView
        onSignUp={() => router.push("/")}
        onGoToProfile={() => router.push("/profile")}
        user={mappedUser}
      />
    </div>
  )
}