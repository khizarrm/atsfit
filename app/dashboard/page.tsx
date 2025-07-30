"use client"

import { useEffect, Suspense, lazy, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth, getCachedUserData } from "@/contexts/auth-context"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Info, Sparkles, ChevronDown, ArrowRight, Target, FileText, Lightbulb, CheckCircle } from "lucide-react"
import { annotateResume, rewriteResume, AtsScoreResponse, extractKeywordsFromJobDescription } from "@/lib/api"
import { calculateAtsScore, AtsScoreResult } from "@/lib/utils/ats-scorer"
import { LoadingProgress } from "@/components/LoadingProgress"
import { ResultsView } from "@/components/results-view"
import { type ResultsData } from "@/lib/utils/results-validation"
import { SharedHeader } from "@/components/shared-header"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

// Lazy load BackgroundGlow for better performance
const BackgroundGlow = lazy(() => import('@/components/BackgroundGlow'))

function BackgroundFallback() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,170,0.15)_0%,rgba(0,255,170,0.08)_25%,rgba(0,255,170,0.03)_50%,transparent_70%)]" />
    </div>
  )
}

export default function DashboardPage() {
  const { user: authUser, loading: authLoading, hasResume, resumeMd: authResumeMd } = useAuth()
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [resumeMd, setResumeMd] = useState<string | null>(null)

  const [showTutorialBar, setShowTutorialBar] = useState(() => {
    // Check localStorage on initial load
    if (typeof window !== 'undefined') {
      const tutorialBarClosed = localStorage.getItem('tutorialBarClosed')
      return tutorialBarClosed !== 'true'
    }
    return true
  })

  const [jobDescription, setJobDescription] = useState("")
  const [userNotes, setUserNotes] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [keywordsLoading, setKeywordsLoading] = useState(false)
  const [atsLoading, setAtsLoading] = useState(false)
  const [annotationLoading, setAnnotationLoading] = useState(false)

  const [currentStep, setCurrentStep] = useState("")
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [progressInterval, setProgressInterval] = useState<NodeJS.Timeout | null>(null)

  const [currentAtsResult, setCurrentAtsResult] = useState<AtsScoreResult | null>(null)
  
  const [optimizationComplete, setOptimizationComplete] = useState(false)
  const [resultsData, setResultsData] = useState<ResultsData | null>(null)
  const [optimizationResults, setOptimizationResults] = useState<{
    optimizedResume: string
    initialAtsScore: number
    finalAtsScore: number
    missingKeywordsCount: number
    summary: string
  } | null>(null)

  const [showResults, setShowResults] = useState(false)

  const [storedInitialAtsScore, setStoredInitialAtsScore] = useState<number | null>(null)
  

  const [apiCheckpoints, setApiCheckpoints] = useState({ step1: false, step2: false, step3: false })
  
  // UI state
  const [buttonText] = useState("Start AI Optimization")
  const [preValidationError, setPreValidationError] = useState<string | null>(null)
  const [editingKeywordIndex, setEditingKeywordIndex] = useState<number | null>(null)
  const [editingKeywordValue, setEditingKeywordValue] = useState("")
  const [isHowToOpen, setIsHowToOpen] = useState(false)
  const [showHowToCard, setShowHowToCard] = useState(true)
  
  // Keywords data (localStorage-based)
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordsError, setKeywordsError] = useState<string | null>(null)
  
  // Progress state (replaces UI store)
  const [progress, setProgress] = useState({ value: 0, visible: false })

  useEffect(() => {
    const cachedData = getCachedUserData()
    if (cachedData && cachedData.user) {
      console.log("📦 Dashboard: Using cached user data")
      const userHasResume = !!cachedData.resumeMd?.trim()
      
      if (!userHasResume) {
        console.log("❌ No resume in cache, redirecting to setup")
        router.push("/resume-setup")
        return
      }
      
      setCurrentUser(cachedData.user)
      setResumeMd(cachedData.resumeMd)
      setIsCheckingAuth(false)
      console.log("✅ Cached user with resume, showing dashboard")
      return
    }

    // Fallback: Use auth context
    if (authLoading) return

    console.log("🔄 Dashboard: No cache, using auth context")
    if (!authUser) {
      console.log("🚫 No auth user, redirecting to login")
      router.push("/login")
      return
    }

    if (!hasResume) {
      console.log("❌ No resume in auth context, redirecting to setup")
      router.push("/resume-setup")
      return
    }

    setCurrentUser(authUser)
    setResumeMd(authResumeMd) // Set resume from auth context
    setIsCheckingAuth(false)
    console.log("✅ Auth context user with resume, showing dashboard")
  }, [authUser, authLoading, hasResume, authResumeMd, router])

  const showProgress = (value: number, step: string) => {
    setProgress({ value, visible: true })
    setCurrentStep(step)
  }

  const hideProgress = () => {
    setProgress({ value: 0, visible: false })
    setCurrentStep("")
  }

  const showError = (message: string) => {
    console.error(message)
  }

  const showSuccess = (message: string) => {
    console.log(message)
  }

  const updateProgressSmooth = (targetProgress: number) => {
    if (progressInterval) {
      clearInterval(progressInterval)
      setProgressInterval(null)
    }
    
    const currentProgress = progress.value
    const steps = Math.abs(targetProgress - currentProgress)
    const stepSize = (targetProgress - currentProgress) / Math.max(steps / 2, 1)
    
    let step = 0
    const interval = setInterval(() => {
      step++
      const newProgress = currentProgress + (stepSize * step)
      
      if ((stepSize > 0 && newProgress >= targetProgress) || (stepSize < 0 && newProgress <= targetProgress)) {
        showProgress(targetProgress, currentStep)
        clearInterval(interval)
        setProgressInterval(null)
      } else {
        showProgress(newProgress, currentStep)
      }
    }, 50) 
    
    setProgressInterval(interval)
  }

  // Keyword management functions
  const updateKeywords = (newKeywords: string[]) => {
    setKeywords(newKeywords)
  }

  const handleRemoveKeyword = (indexToRemove: number) => {
    const updatedKeywords = keywords.filter((_, index) => index !== indexToRemove)
    updateKeywords(updatedKeywords)
    
    if (resumeMd && updatedKeywords.length > 0) {
      const atsResult = calculateAtsScore(resumeMd, updatedKeywords)
      setCurrentAtsResult(atsResult)
      console.log("ATS Score recalculated after keyword removal:", atsResult.score)
    } else {
      setCurrentAtsResult(null)
    }
  }

  const handleStartEditKeyword = (index: number) => {
    setEditingKeywordIndex(index)
    setEditingKeywordValue(keywords[index])
  }

  const handleSaveKeyword = () => {
    if (editingKeywordIndex !== null && editingKeywordValue.trim()) {
      const updatedKeywords = [...keywords]
      updatedKeywords[editingKeywordIndex] = editingKeywordValue.trim()
      updateKeywords(updatedKeywords)
      
      if (resumeMd) {
        const atsResult = calculateAtsScore(resumeMd, updatedKeywords)
        setCurrentAtsResult(atsResult)
        console.log("ATS Score recalculated after keyword edit:", atsResult.score)
      }
    }
    setEditingKeywordIndex(null)
    setEditingKeywordValue("")
  }

  const handleCancelEdit = () => {
    setEditingKeywordIndex(null)
    setEditingKeywordValue("")
  }

  const handlePostCompletion = async (data: ResultsData) => {
    try {
      setResultsData(data)
      setPreValidationError(null)
      
      setCurrentStep("Finalizing results...")
      
      setOptimizationResults({
        optimizedResume: data.resume,
        initialAtsScore: data.initialScore,
        finalAtsScore: data.finalScore,
        missingKeywordsCount: data.missingKeywords,
        summary: data.summary || "no summary"
      })

      sessionStorage.setItem("resultsData", JSON.stringify(data)) 
      console.log("Going to results!!") 
      
      // Set optimization complete and stop submitting before navigation
      setOptimizationComplete(true)
      setIsSubmitting(false)
      
      // Small delay to ensure state updates are processed
      setTimeout(() => {
        router.push(`/results`)
      }, 100)
    } catch (error) {
      console.error('Post-completion failed:', error)
      setPreValidationError(error instanceof Error ? error.message : 'Failed to show results')
      setOptimizationComplete(false)
    }
  }


  const handleCancel = () => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
    }
    setIsSubmitting(false)
    hideProgress()
    setCurrentStep("")
  }

  const handleSubmit = async () => {
    if (!jobDescription.trim()) return

    if (!resumeMd) {
      setPreValidationError("Please upload your resume first.")
      return
    }

    const controller = new AbortController()
    setAbortController(controller)
    
    try {
      setIsSubmitting(true)
      setOptimizationComplete(false)
      setResultsData(null)
      setPreValidationError(null)
      setApiCheckpoints({ step1: false, step2: false, step3: false })
      
      const initialScore = currentAtsResult?.score || null
      setStoredInitialAtsScore(initialScore)
      
      const missingKeywords = currentAtsResult?.missingKeywords || keywords
      const missingKeywordsCount = missingKeywords.length
      
      setCurrentStep("Analyzing resume and matching keywords...")
      updateProgressSmooth(20)
      
      const annotationResponse = await annotateResume(
        resumeMd,
        jobDescription,
	missingKeywords,
        userNotes.trim() || "The user didn't provide any notes, ignore this"
      )
      
      setApiCheckpoints(prev => ({ ...prev, step1: true }))
      
      setCurrentStep("Optimizing resume structure...")
      setAnnotationLoading(true)
      
      //Step 2: Rewriting the resume 
      const rewriteResponse = await rewriteResume(
        annotationResponse["annotated_resume"], 
        userNotes.trim()
      )
      
      setAnnotationLoading(false)
      
      let finalAtsScore: number | undefined = undefined

      const optimizedResume = rewriteResponse.resume
      const summary = rewriteResponse.summary
      console.log("The summary is: ", summary)
      
      if (typeof optimizedResume !== 'string') {
        throw new Error("Invalid resume format received from API")
      }
      
      if (optimizedResume && keywords.length > 0) {
        const finalAtsResult = calculateAtsScore(optimizedResume, keywords)
        finalAtsScore = finalAtsResult.score
      }
      
      updateProgressSmooth(100)
      setApiCheckpoints(prev => ({ ...prev, step3: true }))
      setCurrentStep("Optimization complete!")
      
      const resultsData: ResultsData = {
        resume: optimizedResume,
        initialScore: initialScore ?? 0,     // Use local variable, not state
        finalScore: finalAtsScore ?? 0,      
        missingKeywords: missingKeywordsCount,
	      summary: summary || "No summary provided"
      }
      
      console.log("📊 Final Results Data:", resultsData)
      await handlePostCompletion(resultsData)
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted')
        setCurrentStep("Cancelled")
        return
      }
      
      console.error('Optimization failed:', error)
      
      // Handle different types of errors with specific messages
      let errorMessage = 'Optimization failed'
      
      if (error.message) {
        // Network errors (502, 503, etc.)
        if (error.message.includes('502') || error.message.includes('Bad Gateway')) {
          errorMessage = 'Server temporarily unavailable (502). Please try again in a moment.'
        } else if (error.message.includes('503') || error.message.includes('Service Unavailable')) {
          errorMessage = 'Service temporarily unavailable (503). Please try again in a moment.'
        } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
          errorMessage = 'Server error occurred (500). Please try again.'
        } else if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
          errorMessage = 'Rate limit exceeded (429). Please wait a moment and try again.'
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = 'Network connection failed. Please check your internet connection and try again.'
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.'
        } else {
          // Use the original error message for other errors
          errorMessage = error.message
        }
      }
      
      setPreValidationError(errorMessage)
      setCurrentStep("Error occurred")
    } finally {
      setIsSubmitting(false)
      setAbortController(null)
    }
  }

  const AtsScoreCircle = ({ score }: { score: number }) => {
    const circumference = 2 * Math.PI * 35
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (score / 100) * circumference
    
    const getScoreColor = (score: number) => {
      if (score >= 80) return "#00FFAA"
      if (score >= 60) return "#FFD700"
      return "#FF6B6B"
    }
    
    const getScoreGradient = (score: number) => {
      if (score >= 80) return "from-[#00FFAA] to-[#00DD99]"
      if (score >= 60) return "from-[#FFD700] to-[#FFA500]"
      return "from-[#FF6B6B] to-[#FF4757]"
    }
    
    return (
      <div className="relative w-20 h-20 sm:w-24 sm:h-24">
        <svg className="w-20 h-20 sm:w-24 sm:h-24 transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle with glow */}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <circle
            cx="50"
            cy="50"
            r="35"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="6"
          />
          
          <motion.circle
            cx="50"
            cy="50"
            r="35"
            fill="none"
            stroke={getScoreColor(score)}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            filter="url(#glow)"
          />
        </svg>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
              {Math.round(score)}
            </span>
            <div className="text-xs text-gray-400 mt-1">/100</div>
          </div>
        </div>
      </div>
    )
  }

  // Keyword extraction effect
  useEffect(() => {
    if (!jobDescription.trim()) {
      setKeywords([])
      return
    }

    const timeoutId = setTimeout(async () => {
      try {
        setKeywordsLoading(true)
        setKeywordsError(null)
        
        const response = await extractKeywordsFromJobDescription(jobDescription)
        updateKeywords(response)
        
        // Calculate ATS score if we have resume
        if (resumeMd) {
          setAtsLoading(true)
          const atsResult = calculateAtsScore(resumeMd, response)
          setCurrentAtsResult(atsResult)
          setAtsLoading(false)
        }
      } catch (error: any) {
        console.error('Keyword extraction error:', error)
        
        // Handle different types of errors with specific messages
        let errorMessage = 'Failed to extract keywords'
        
        if (error.message) {
          // Network errors (502, 503, etc.)
          if (error.message.includes('502') || error.message.includes('Bad Gateway')) {
            errorMessage = 'Server temporarily unavailable (502). Please try again in a moment.'
          } else if (error.message.includes('503') || error.message.includes('Service Unavailable')) {
            errorMessage = 'Service temporarily unavailable (503). Please try again in a moment.'
          } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
            errorMessage = 'Server error occurred (500). Please try again.'
          } else if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
            errorMessage = 'Rate limit exceeded (429). Please wait a moment and try again.'
          } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage = 'Network connection failed. Please check your internet connection and try again.'
          } else if (error.message.includes('timeout')) {
            errorMessage = 'Request timed out. Please try again.'
          } else {
            // Use the original error message for other errors
            errorMessage = error.message
          }
        }
        
        setKeywordsError(errorMessage)
      } finally {
        setKeywordsLoading(false)
      }
    }, 1000) // 1 second debounce

    return () => clearTimeout(timeoutId)
  }, [jobDescription, resumeMd])

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (progressInterval) {
        clearInterval(progressInterval)
      }
    }
  }, [progressInterval])

  // Reset optimization state when component unmounts or user navigates away
  useEffect(() => {
    return () => {
      // Reset optimization state to prevent lingering state issues
      setIsSubmitting(false)
      setOptimizationComplete(false)
      setResultsData(null)
      setOptimizationResults(null)
      setCurrentStep("")
      hideProgress()
    }
  }, [])

  // Show loading screen while checking authentication
  if (isCheckingAuth) {
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

  // Early return if user is not available
  if (!currentUser) {
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
          <p className="text-gray-400 text-sm">Redirecting...</p>
        </div>
      </div>
    )
  }

  // Map user data for DashboardView
  const mappedUser = {
    id: currentUser.id,
    email: currentUser.email!,
    name: currentUser.user_metadata?.full_name || currentUser.email!,
  }

  

  // Show results view if optimization is complete
    return (
    <div className="min-h-screen bg-black relative text-white flex flex-col">
      <Suspense fallback={<BackgroundFallback />}>
        <BackgroundGlow />
      </Suspense>
      
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="min-h-screen flex flex-col"
      >
        <SharedHeader
          onGoToProfile={() => {console.log("going to profile") , router.push("/profile")}}
          onSignUp={() => router.push("/")}
          user={mappedUser}
        />

        {/* Main Content */}
        <div className="flex-1 flex items-start justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-2xl lg:max-w-5xl xl:max-w-6xl"
        >
          {/* Enhanced Header Section */}
          <div className="text-center mb-8 sm:mb-10 lg:mb-12">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-3 sm:mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
            >
              Optimize Your Resume
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-300 text-sm sm:text-base lg:text-lg xl:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed"
            >
              Get your resume optimized for ATS systems and significantly improve your match score with AI-powered analysis.
            </motion.p>
            
            {/* Enhanced Tutorial Section */}
            {showTutorialBar && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-8 sm:mb-10"
              >
                <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 backdrop-blur-xl border border-blue-700/20 rounded-2xl p-4 sm:p-6 relative overflow-hidden">
                  {/* Animated background */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-800/10 to-indigo-800/10"
                    animate={{
                      opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  />
                  
                  <div className="relative z-10">
                    <Collapsible open={isHowToOpen} onOpenChange={setIsHowToOpen}>
                      <CollapsibleTrigger className="w-full flex items-center justify-between text-left group">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600/30 rounded-lg flex items-center justify-center">
                            <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300" />
                          </div>
                          <div>
                            <h3 className="text-blue-100 font-semibold text-sm sm:text-base">Quick Guide</h3>
                            <p className="text-blue-300/70 text-xs">5 steps to get the best results</p>
                          </div>
                        </div>
                        <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-blue-400 transition-transform duration-200 ${isHowToOpen ? 'rotate-180' : ''} group-hover:text-blue-300`} />
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                          {/* Step 1 */}
                          <div className="bg-blue-800/10 border border-blue-700/20 rounded-xl p-4">
                            <div className="flex items-start space-x-3">
                              <div className="w-6 h-6 bg-blue-600/40 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-blue-200 text-xs font-bold">1</span>
                              </div>
                              <div>
                                <h4 className="text-blue-200 font-medium text-sm mb-2">Add Job Description</h4>
                                <p className="text-blue-300/80 text-xs leading-relaxed">Focus on requirements, skills, and qualifications. Shorter, focused descriptions work better.</p>
                              </div>
                            </div>
                          </div>

                          {/* Step 2 */}
                          <div className="bg-blue-800/10 border border-blue-700/20 rounded-xl p-4">
                            <div className="flex items-start space-x-3">
                              <div className="w-6 h-6 bg-blue-600/40 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-blue-200 text-xs font-bold">2</span>
                              </div>
                              <div>
                                <h4 className="text-blue-200 font-medium text-sm mb-2">Review Keywords</h4>
                                <p className="text-blue-300/80 text-xs leading-relaxed">Click to remove irrelevant keywords or hold to edit them. These impact your ATS score.</p>
                              </div>
                            </div>
                          </div>

                          {/* Step 3 */}
                          <div className="bg-blue-800/10 border border-blue-700/20 rounded-xl p-4">
                            <div className="flex items-start space-x-3">
                              <div className="w-6 h-6 bg-blue-600/40 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-blue-200 text-xs font-bold">3</span>
                              </div>
                              <div>
                                <h4 className="text-blue-200 font-medium text-sm mb-2">Add Context</h4>
                                <p className="text-blue-300/80 text-xs leading-relaxed">Include relevant experience, projects, and skills that align with the role.</p>
                              </div>
                            </div>
                          </div>

                          {/* Step 4 */}
                          <div className="bg-blue-800/10 border border-blue-700/20 rounded-xl p-4">
                            <div className="flex items-start space-x-3">
                              <div className="w-6 h-6 bg-blue-600/40 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-blue-200 text-xs font-bold">4</span>
                              </div>
                              <div>
                                <h4 className="text-blue-200 font-medium text-sm mb-2">Ensure Alignment</h4>
                                <p className="text-blue-300/80 text-xs leading-relaxed">Your resume should be in the same field as the target role for best results.</p>
                              </div>
                            </div>
                          </div>

                          {/* Step 5 */}
                          <div className="bg-blue-800/10 border border-blue-700/20 rounded-xl p-4 md:col-span-2">
                            <div className="flex items-start space-x-3">
                              <div className="w-6 h-6 bg-blue-600/40 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-blue-200 text-xs font-bold">5</span>
                              </div>
                              <div>
                                <h4 className="text-blue-200 font-medium text-sm mb-2">Review Results</h4>
                                <p className="text-blue-300/80 text-xs leading-relaxed">Always proofread the optimized resume for accuracy before using it.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                          <div className="flex-1 bg-blue-800/20 border border-blue-700/30 rounded-xl p-4">
                            <p className="text-blue-200/80 text-sm">
                              <span className="text-blue-300 font-medium">Need to modify your resume?</span> Go to{' '}
                              <button 
                                onClick={() => router.push("/profile")}
                                className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors duration-200"
                              >
                                Profile → Manage My Resume
                              </button>
                            </p>
                          </div>
                          
                          <button 
                            onClick={() => {
                              setShowTutorialBar(false)
                              localStorage.setItem('tutorialBarClosed', 'true')
                            }}
                            className="px-4 py-2 bg-red-900/20 border border-red-700/30 rounded-xl text-red-400 hover:text-red-300 text-sm font-medium transition-colors duration-200"
                          >
                            Got it, close
                          </button>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </div>
              </motion.div>
            )}
          </div>


          {/* Conditional Rendering: Form, Loading Progress, or Redirecting */}
          {isSubmitting ? (
            <LoadingProgress 
              progress={progress.value}
              currentStep={currentStep}
              onCancel={handleCancel}
              optimizationComplete={optimizationComplete}
              resultsData={resultsData ?? undefined}
              error={preValidationError}
              atsLoading={atsLoading}
              annotationLoading={annotationLoading}
            />
          ) : optimizationComplete ? (
            // Show brief redirecting state
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/3 backdrop-blur-xl border border-white/5 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl text-center max-w-lg mx-auto"
            >
              <motion.div
                className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-[#00FFAA]/20 to-[#00DD99]/20 border-2 border-[#00FFAA]/50 rounded-xl flex items-center justify-center"
                animate={{
                  boxShadow: [
                    "0 0 0px rgba(0,255,170,0)",
                    "0 0 30px rgba(0,255,170,0.4)", 
                    "0 0 0px rgba(0,255,170,0)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7 text-[#00FFAA]" />
              </motion.div>
              
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 sm:mb-4">
                Optimization Complete!
              </h2>
              
              <p className="text-gray-300 text-sm sm:text-base lg:text-lg mb-4 sm:mb-6">
                Taking you to your results...
              </p>
              
              <motion.div 
                className="flex items-center justify-center space-x-2"
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <motion.div 
                  className="w-2 h-2 bg-[#00FFAA] rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div 
                  className="w-2 h-2 bg-[#00FFAA] rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                />
                <motion.div 
                  className="w-2 h-2 bg-[#00FFAA] rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                />
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 lg:p-10 shadow-2xl"
            >
              {/* Job Description Section */}
              <div className="space-y-4 sm:space-y-5">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#00FFAA]/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#00FFAA]" />
                  </div>
                  <div>
                    <label className="text-white font-semibold text-base sm:text-lg">Job Description</label>
                    <p className="text-gray-400 text-xs sm:text-sm">Paste the job posting you want to optimize for</p>
                  </div>
                </div>
                
                <div className="relative">
                  <Textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the full job description here...

Include:
• Job title and responsibilities
• Required skills and qualifications
• Experience requirements
• Company information"
                    className="min-h-[180px] sm:min-h-[220px] lg:min-h-[250px] bg-white/5 border-white/20 text-white placeholder:text-gray-500 text-sm sm:text-base leading-relaxed resize-none focus:border-[#00FFAA] focus:ring-[#00FFAA] rounded-xl focus:bg-white/8 transition-all duration-300"
                  />

                  <motion.div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    animate={{
                      boxShadow:
                        jobDescription.length > 0
                          ? "0 0 0 1px rgba(0,255,170,0.3), 0 0 30px rgba(0,255,170,0.1)"
                          : "0 0 0 1px transparent",
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Keywords & ATS Score Section */}
              {(jobDescription.trim() || keywordsLoading || keywords.length > 0 || keywordsError) && (
                <div className="space-y-4 sm:space-y-5 mt-8 sm:mt-10">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#00FFAA]/20 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#00FFAA]" />
                    </div>
                    <div>
                      <label className="text-white font-semibold text-base sm:text-lg">Analysis Results</label>
                      <p className="text-gray-400 text-xs sm:text-sm">
                        These keywords aren't always accurate. Click to remove or hold to edit a keyword.
                      </p>
                    </div>
                  </div>
                
                {keywordsLoading && (
                  <div className="bg-white/5 border border-white/20 rounded-xl p-4 sm:p-6">
                    <div className="flex items-center space-x-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        className="w-5 h-5 border-2 border-[#00FFAA] border-t-transparent rounded-full"
                      />
                      <span className="text-gray-300 text-sm">Extracting keywords and calculating ATS score...</span>
                    </div>
                  </div>
                )}

                {keywordsError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 sm:p-6">
                    <p className="text-red-400 text-sm">{keywordsError}</p>
                  </div>
                )}

                {!keywordsLoading && !keywordsError && keywords.length > 0 && (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Enhanced Grid Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
                      {/* Keywords Card */}
                      <div className="lg:col-span-3 order-2 lg:order-1">
                        <div className="bg-white/5 border border-white/20 rounded-xl p-4 sm:p-6 h-full">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-white font-semibold text-sm sm:text-base">Extracted Keywords</h4>
                            <span className="text-[#00FFAA] text-xs font-medium bg-[#00FFAA]/10 px-2 py-1 rounded-full">
                              {keywords.length} keywords
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 sm:gap-3">
                            {keywords.map((keyword, index) => (
                              <motion.div
                                key={index}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="relative"
                              >
                                {editingKeywordIndex === index ? (
                                  // Edit mode
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={editingKeywordValue}
                                      onChange={(e) => setEditingKeywordValue(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveKeyword()
                                        if (e.key === 'Escape') handleCancelEdit()
                                      }}
                                      onBlur={handleSaveKeyword}
                                      autoFocus
                                      className="px-3 py-1.5 bg-white/10 border border-[#00FFAA]/50 rounded-full text-white text-sm font-medium outline-none focus:border-[#00FFAA] min-w-[80px] max-w-[150px]"
                                    />
                                  </div>
                                ) : (
                                  // Display mode
                                  <motion.span
                                    whileHover={{ scale: 1.05 }}
                                    onMouseDown={() => {
                                      const timeoutId = setTimeout(() => {
                                        handleStartEditKeyword(index)
                                      }, 500) // 500ms hold
                                      
                                      const handleMouseUp = () => {
                                        clearTimeout(timeoutId)
                                        document.removeEventListener('mouseup', handleMouseUp)
                                      }
                                      
                                      document.addEventListener('mouseup', handleMouseUp)
                                    }}
                                    onClick={() => handleRemoveKeyword(index)}
                                    className={`px-3 py-1.5 rounded-full text-white text-sm font-medium cursor-pointer transition-all duration-200 hover:from-red-500/30 hover:to-red-400/30 hover:border-red-400/50 hover:text-red-100 select-none inline-block shadow-sm ${
                                      currentAtsResult?.missingKeywords?.includes(keyword)
                                        ? "bg-gradient-to-r from-yellow-500/20 to-yellow-400/20 border border-yellow-400/40"
                                        : "bg-gradient-to-r from-[#00FFAA]/20 to-[#00DD99]/20 border border-[#00FFAA]/30"
                                    }`}
                                  >
                                    {keyword}
                                  </motion.span>
                                )}
                              </motion.div>
                            ))}
                          </div>
                          <p className="text-gray-400 text-xs mt-4">
                            Click to remove • Hold to edit • These keywords will be used to optimize your resume
                          </p>
                        </div>
                      </div>

                      {/* Enhanced ATS Score Card */}
                      <div className="lg:col-span-1 order-1 lg:order-2">
                        <div className="bg-gradient-to-br from-white/5 to-white/3 border border-white/20 rounded-xl p-4 sm:p-6 h-full flex flex-col items-center justify-center text-center min-h-[140px] sm:min-h-[160px]">
                          <h4 className="text-white font-semibold text-sm mb-3">ATS Score</h4>
                          {currentAtsResult !== null ? (
                            <>
                              <div className="scale-90 sm:scale-100 mb-3">
                                <AtsScoreCircle score={currentAtsResult.score} />
                              </div>
                              <div className="space-y-1">
                                <p className="text-gray-300 text-sm font-medium">
                                  {currentAtsResult.score >= 80 
                                    ? "Excellent!" 
                                    : currentAtsResult.score >= 60 
                                      ? "Good" 
                                      : currentAtsResult.score >= 40 
                                        ? "Needs work" 
                                        : "Poor match"
                                  }
                                </p>
                                <p className="text-gray-400 text-xs">
                                  {currentAtsResult.score >= 80 
                                    ? "Great match for this role" 
                                    : currentAtsResult.score >= 60 
                                      ? "Good potential" 
                                      : currentAtsResult.score >= 40 
                                        ? "Room for improvement" 
                                        : "Needs significant optimization"
                                  }
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-white/5 rounded-full border border-white/10 mb-3">
                                <span className="text-gray-400 text-xs">No Score</span>
                              </div>
                              <p className="text-gray-400 text-xs">Upload resume to see score</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!keywordsLoading && !keywordsError && keywords.length === 0 && jobDescription.trim() && (
                  <div className="bg-white/5 border border-white/20 rounded-xl p-4 sm:p-6">
                    <p className="text-gray-400 text-sm">No keywords extracted. Try adding more technical details to the job description.</p>
                  </div>
                )}
              </div>
            )}

              {/* Notes Section */}
              {keywords.length > 0 && !keywordsLoading && (
                <div className="space-y-4 sm:space-y-5 mt-8 sm:mt-10">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#00FFAA]/20 rounded-lg flex items-center justify-center">
                      <Info className="w-4 h-4 sm:w-5 sm:h-5 text-[#00FFAA]" />
                    </div>
                    <div>
                      <label className="text-white font-semibold text-base sm:text-lg">Additional Instructions (Optional)</label>
                      <p className="text-gray-400 text-xs sm:text-sm">Help the AI understand your priorities and context</p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <Textarea
                      value={userNotes}
                      onChange={(e) => setUserNotes(e.target.value)}
                      placeholder="Some examples: 
• 'I once worked at X for Y months. We did a bunch of Z there, could you please add that in the experience section?'
• 'I made X project, here's the link: [link]. Add it to the projects section. I used React, ShadCn, and Supabase for backend.'
• 'Change the name of my Project X to Project Y, and add a point about how I used railway for the backend'

If you leave this blank, the AI will just optimize your resume based on the description."
                      className="min-h-[120px] sm:min-h-[140px] bg-white/5 border-white/20 text-white placeholder:text-gray-500 text-sm leading-relaxed resize-none focus:border-[#00FFAA] focus:ring-[#00FFAA] rounded-xl focus:bg-white/8 transition-all duration-300"
                    />
                    <motion.div
                      className="absolute inset-0 rounded-xl pointer-events-none"
                      animate={{
                        boxShadow:
                          userNotes.length > 0
                            ? "0 0 0 1px rgba(0,255,170,0.3), 0 0 30px rgba(0,255,170,0.1)"
                            : "0 0 0 1px transparent",
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              {/* Enhanced CTA Button */}
              <div className="flex justify-center mt-8 sm:mt-10">
                <Button
                  onClick={handleSubmit}
                  disabled={!jobDescription.trim() || isSubmitting || keywordsLoading || keywords.length === 0}
                  className="bg-gradient-to-r from-[#00FFAA] to-[#00DD99] hover:from-[#00DD99] hover:to-[#00FFAA] text-black font-bold px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg rounded-xl hover:scale-105 transition-all duration-300 hover:shadow-[0_0_50px_rgba(0,255,170,0.5)] shadow-[0_0_30px_rgba(0,255,170,0.3)] disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none w-full sm:w-auto min-w-[200px]"
                >
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-black border-t-transparent rounded-full mr-3"
                    />
                  ) : (
                    <Sparkles className="mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                  )}
                  {isSubmitting ? buttonText : "Start AI Optimization"}
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

        {/* Enhanced Footer */}
        <motion.footer
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="text-center p-4 sm:p-6 z-10 mt-auto border-t border-white/10 bg-gradient-to-r from-black/30 to-black/20 backdrop-blur-xl"
        >
          <div className="flex items-center justify-center space-x-2">
            <span className="text-gray-500 text-sm">Made by </span>
            <a
              href="https://khizarmalik.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#00FFAA] transition-all duration-300 border-b border-gray-400 hover:border-[#00FFAA] pb-1 font-medium text-sm hover:scale-105"
            >
              Khizar Malik
            </a>
          </div>
        </motion.footer>
      </motion.div>
    </div>
  )
}
