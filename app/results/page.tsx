"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useState, useEffect, Suspense, lazy } from "react"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { ResultsView } from "@/components/results-view"

interface User {
  id: string
  email: string
  name: string
}

const BackgroundGlow = lazy(() => import('@/components/BackgroundGlow'))


function ResultsPageContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resultsData, setResultsData] = useState<{
    optimizedResume: string
    initialAtsScore: number
    finalAtsScore: number
    missingKeywordsCount: number
  } | null>(null)

  useEffect(() => {
    if (!authLoading) {
      const isPreValidated = searchParams.get('validated') === 'true'
      if (isPreValidated) {
        // Skip validation, parse immediately for pre-validated data
        parseValidatedParams()
      } else {
        // Full validation (fallback for direct access)
        parseAndValidateParams()
      }
    }
  }, [authLoading, searchParams])

  const parseValidatedParams = () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get query parameters (minimal validation for pre-validated data)
      const resumeKey = searchParams.get('resumeKey')
      const initial = searchParams.get('initial')
      const final = searchParams.get('final')
      const missing = searchParams.get('missing')

      if (!resumeKey || !initial || !final || !missing) {
        // Fallback to full validation if parameters are missing
        parseAndValidateParams()
        return
      }

      // Get resume from sessionStorage
      const storedResume = sessionStorage.getItem(resumeKey)
      if (!storedResume) {
        // Fallback to full validation if resume not found in storage
        parseAndValidateParams()
        return
      }

      // Simplified parsing for pre-validated data
      const initialScore = parseFloat(initial)
      const finalScore = parseFloat(final)
      const missingKeywords = parseInt(missing, 10)

      // Set validated data immediately
      setResultsData({
        optimizedResume: storedResume,
        initialAtsScore: initialScore,
        finalAtsScore: finalScore,
        missingKeywordsCount: missingKeywords
      })
      
      // Clean up the sessionStorage after successful loading
      sessionStorage.removeItem(resumeKey)
      
      setIsLoading(false)
      
    } catch (error) {
      console.error('Error parsing pre-validated params:', error)
      // Fallback to full validation
      parseAndValidateParams()
    }
  }

  const parseAndValidateParams = () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get query parameters
      const resume = searchParams.get('resume')
      const initial = searchParams.get('initial')
      const final = searchParams.get('final')
      const missing = searchParams.get('missing')

      // Validate required parameters
      if (!resume) {
        throw new Error('Resume content is missing')
      }
      if (!initial || !final || !missing) {
        throw new Error('Score data is missing')
      }

      // Parse and validate scores
      const initialScore = parseFloat(initial)
      const finalScore = parseFloat(final)
      const missingKeywords = parseInt(missing, 10)

      if (isNaN(initialScore) || isNaN(finalScore) || isNaN(missingKeywords)) {
        throw new Error('Invalid score data provided')
      }

      if (initialScore < 0 || initialScore > 100 || finalScore < 0 || finalScore > 100) {
        throw new Error('Scores must be between 0 and 100')
      }

      if (missingKeywords < 0) {
        throw new Error('Missing keywords count cannot be negative')
      }

      // Decode resume content
      let decodedResume: string
      try {
        // First replace + with spaces (URL form encoding), then decode
        const urlFormDecoded = resume.replace(/\+/g, ' ')
        decodedResume = decodeURIComponent(urlFormDecoded)
      } catch (decodeError) {
        console.error('Decode error:', decodeError)
        console.error('Resume parameter:', resume)
        // Try alternative decoding methods
        try {
          // Sometimes the content might be double-encoded
          const urlFormDecoded = resume.replace(/\+/g, ' ')
          decodedResume = decodeURIComponent(decodeURIComponent(urlFormDecoded))
        } catch {
          // If all else fails, use manual replacement
          decodedResume = resume.replace(/\+/g, ' ')
                               .replace(/%0A/g, '\n')
                               .replace(/%23/g, '#')
                               .replace(/%3A/g, ':')
                               .replace(/%2F/g, '/')
                               .replace(/%2C/g, ',')
                               .replace(/%28/g, '(')
                               .replace(/%29/g, ')')
                               .replace(/%E2%80%93/g, '–')
                               .replace(/%E2%89%88/g, '≈')
                               .replace(/%40/g, '@')
                               .replace(/%7C/g, '|')
        }
      }

      if (!decodedResume.trim()) {
        throw new Error('Resume content is empty')
      }

      // Set validated data
      setResultsData({
        optimizedResume: decodedResume,
        initialAtsScore: initialScore,
        finalAtsScore: finalScore,
        missingKeywordsCount: missingKeywords
      })

    } catch (error) {
      console.error('Error parsing results parameters:', error)
      setError(error instanceof Error ? error.message : 'Invalid results data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToDashboard = () => {
    router.push("/")
  }

  const handleGoToProfile = () => {
    router.push("/profile")
  }

  const handleSignUp = () => {
    router.push("/")
  }

  const handleNextJob = (jobUrl: string) => {
    // Store job URL in session storage for dashboard to pick up
    if (jobUrl) {
      sessionStorage.setItem('nextJobUrl', jobUrl)
    }
    router.push("/")
  }

  // Show loading while auth is checking or params are parsing
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-black relative text-white">
        <BackgroundGlow />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="w-8 h-8 border-2 border-[#00FFAA] border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-gray-400">Loading results...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error || !resultsData) {
    return (
      <div className="min-h-screen bg-black relative text-white">
        <BackgroundGlow />
        <div className="min-h-screen flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md mx-auto p-8"
          >
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Invalid Results Data</h2>
            <p className="text-gray-400 mb-6">
              {error || 'The results data appears to be invalid or corrupted.'}
            </p>
            <Button
              onClick={handleBackToDashboard}
              className="bg-gradient-to-r from-[#00FFAA] to-[#00DD99] hover:from-[#00DD99] hover:to-[#00FFAA] text-black font-semibold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  // Map auth user to expected User interface
  const mappedUser: User | null = user ? {
    id: user.id,
    email: user.email!,
    name: user.user_metadata?.full_name || user.email!,
  } : null

  // Determine if user is in trial mode (no user logged in)
  const isTrialMode = !user

  return (
    <div className="min-h-screen bg-black relative text-white">
      <BackgroundGlow />
      <ResultsView
        optimizedResume={resultsData.optimizedResume}
        onBack={handleBackToDashboard}
        onSignUp={handleSignUp}
        onNextJob={handleNextJob}
        onGoToProfile={handleGoToProfile}
        isTrialMode={isTrialMode}
        user={mappedUser}
        initialAtsScore={resultsData.initialAtsScore}
        finalAtsScore={resultsData.finalAtsScore}
        missingKeywordsCount={resultsData.missingKeywordsCount}
      />
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black relative text-white">
        <BackgroundGlow />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="w-8 h-8 border-2 border-[#00FFAA] border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-gray-400">Loading results...</p>
          </div>
        </div>
      </div>
    }>
      <ResultsPageContent />
    </Suspense>
  )
}