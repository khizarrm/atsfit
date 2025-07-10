"use client"

import { useEffect, Suspense, lazy } from "react"
import { motion } from "framer-motion"
import { useRouter, usePathname } from "next/navigation"
import { getCachedUserData } from "@/contexts/auth-context"
import LoginPage from "@/app/login/page"

const BackgroundGlow = lazy(() => import('@/components/BackgroundGlow'))

type AppState = "login"

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

  useEffect(() => {
    if (pathname !== "/") return

    const cachedData = getCachedUserData()
    if (cachedData && cachedData.user) {
      console.log("📦 User found in cache, routing based on resume status")
      const userHasResume = !!cachedData.resumeMd?.trim()
      
      if (userHasResume) {
        console.log("✅ Resume found, redirecting to dashboard")
        router.push("/dashboard")
      } else {
        console.log("❌ No resume found, redirecting to setup")
        router.push("/resume-setup")
      }
    } else {
      console.log("🚫 No user in cache, staying on login page")
    }
  }, [router, pathname])

  const renderView = () => {
    return <LoginPage />
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
