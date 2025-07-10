"use client"

import { useEffect, Suspense, lazy, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth, getCachedUserData } from "@/contexts/auth-context"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Info, Sparkles, ChevronDown } from "lucide-react"
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
      {/* Static central radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,170,0.15)_0%,rgba(0,255,170,0.08)_25%,rgba(0,255,170,0.03)_50%,transparent_70%)]" />
    </div>
  )
}

export default function DashboardPage() {
  const { user: authUser, loading: authLoading, hasResume } = useAuth()
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  
  // Resume data from localStorage
  const [resumeMd, setResumeMd] = useState<string | null>(null)
  
  // Form data
  const [jobDescription, setJobDescription] = useState("")
  const [userNotes, setUserNotes] = useState("")
  
  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [keywordsLoading, setKeywordsLoading] = useState(false)
  const [atsLoading, setAtsLoading] = useState(false)
  const [annotationLoading, setAnnotationLoading] = useState(false)
  
  // Process control
  const [currentStep, setCurrentStep] = useState("")
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [progressInterval, setProgressInterval] = useState<NodeJS.Timeout | null>(null)
  
  // API data
  const [annotationData, setAnnotationData] = useState<any>(null)
  const [currentAtsResult, setCurrentAtsResult] = useState<AtsScoreResult | null>(null)
  
  // Results data
  const [optimizationComplete, setOptimizationComplete] = useState(false)
  const [resultsData, setResultsData] = useState<ResultsData | null>(null)
  const [optimizationResults, setOptimizationResults] = useState<{
    optimizedResume: string
    initialAtsScore: number
    finalAtsScore: number
    missingKeywordsCount: number
  } | null>(null)
  const [showResults, setShowResults] = useState(false)
  
  // ATS score data
  const [initialAtsScore, setInitialAtsScore] = useState<number | null>(null)
  const [storedInitialAtsScore, setStoredInitialAtsScore] = useState<number | null>(null)
  
  // Checkpoint tracking
  const [apiCheckpoints, setApiCheckpoints] = useState({ step1: false, step2: false, step3: false })
  
  // UI state
  const [buttonText] = useState("Start AI Optimization")
  const [preValidationError, setPreValidationError] = useState<string | null>(null)
  const [editingKeywordIndex, setEditingKeywordIndex] = useState<number | null>(null)
  const [editingKeywordValue, setEditingKeywordValue] = useState("")
  const [isHowToOpen, setIsHowToOpen] = useState(false)
  
  // Keywords data (localStorage-based)
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordsError, setKeywordsError] = useState<string | null>(null)
  
  // Progress state (replaces UI store)
  const [progress, setProgress] = useState({ value: 0, visible: false })

  // Authentication guard with localStorage-first approach
  useEffect(() => {
    // First: Check localStorage for instant auth verification
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
    setIsCheckingAuth(false)
    console.log("✅ Auth context user with resume, showing dashboard")
  }, [authUser, authLoading, hasResume, router])

  // Progress management functions (replacing UI store)
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
    // You can add toast notification here if needed
  }

  const showSuccess = (message: string) => {
    console.log(message)
    // You can add toast notification here if needed
  }

  const updateProgressSmooth = (targetProgress: number) => {
    // Clear any existing progress animation
    if (progressInterval) {
      clearInterval(progressInterval)
      setProgressInterval(null)
    }
    
    // Smooth animation to target progress
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
    }, 50) // Smooth 50ms intervals
    
    setProgressInterval(interval)
  }

  // Keyword management functions
  const updateKeywords = (newKeywords: string[]) => {
    setKeywords(newKeywords)
    // Optionally cache in localStorage
    try {
      localStorage.setItem('atsfit_keywords', JSON.stringify(newKeywords))
    } catch (error) {
      console.error('Error caching keywords:', error)
    }
  }

  const handleRemoveKeyword = (indexToRemove: number) => {
    const updatedKeywords = keywords.filter((_, index) => index !== indexToRemove)
    updateKeywords(updatedKeywords)
    
    // Recalculate ATS score with updated keywords
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
      
      // Recalculate ATS score with updated keywords
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

  // Post-completion handler
  const handlePostCompletion = async (data: ResultsData) => {
    try {
      setOptimizationComplete(true)
      setResultsData(data)
      setPreValidationError(null)
      
      setCurrentStep("Finalizing results...")
      updateProgressSmooth(110)
      
      setTimeout(() => {
        setOptimizationResults({
          optimizedResume: data.resume,
          initialAtsScore: data.initialScore,
          finalAtsScore: data.finalScore,
          missingKeywordsCount: data.missingKeywords
        })
        setShowResults(true)
        setIsSubmitting(false)
      }, 800)
      
    } catch (error) {
      console.error('Post-completion failed:', error)
      setPreValidationError(error instanceof Error ? error.message : 'Failed to show results')
      setOptimizationComplete(false)
    }
  }

  // Navigation handlers
  const handleBackFromResults = () => {
    setShowResults(false)
    setOptimizationResults(null)
    setOptimizationComplete(false)
    hideProgress()
  }

  const handleNextJob = (jobUrl?: string) => {
    // Handle next job logic if needed
    console.log('Next job:', jobUrl)
  }

  // Cancel handler
  const handleCancel = () => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
    }
    setIsSubmitting(false)
    hideProgress()
    setCurrentStep("")
  }

  // Main submit handler
  const handleSubmit = async () => {
    if (!jobDescription.trim()) return

    if (!resumeMd) {
      setPreValidationError("Please upload your resume first.")
      return
    }

    // Set up abort controller
    const controller = new AbortController()
    setAbortController(controller)
    
    try {
      setIsSubmitting(true)
      setOptimizationComplete(false)
      setResultsData(null)
      setPreValidationError(null)
      setApiCheckpoints({ step1: false, step2: false, step3: false })
      
      // Store the initial ATS score for before/after comparison (from currentAtsResult)
      const initialScore = currentAtsResult?.score || null
      setStoredInitialAtsScore(initialScore)
      
      // Capture missing keywords for annotation (use missing keywords specifically)
      const missingKeywords = currentAtsResult?.missingKeywords || keywords
      const missingKeywordsCount = missingKeywords.length
      
      console.log("🎯 Starting optimization with:")
      console.log("Initial ATS Score:", initialScore)
      console.log("Missing Keywords:", missingKeywords)
      console.log("Missing Keywords Count:", missingKeywordsCount)
      
      // Step 1: Annotate Resume (using missing keywords)
      setCurrentStep("Analyzing resume and matching keywords...")
      updateProgressSmooth(20)
      
      const annotationResponse = await annotateResume(
        resumeMd,
        jobDescription,
        missingKeywords, // Use missing keywords specifically
        userNotes.trim() || "The user didn't provide any notes, ignore this"
      )
      
      setAnnotationData(annotationResponse)
      setApiCheckpoints(prev => ({ ...prev, step1: true }))
      updateProgressSmooth(50)
      
      // Step 2: Rewrite resume
      setCurrentStep("Optimizing resume structure...")
      setAnnotationLoading(true)
      
      const rewriteResponse = await rewriteResume(
        annotationResponse["annotated_resume"], 
        userNotes.trim()
      )
      
      setAnnotationLoading(false)
      setApiCheckpoints(prev => ({ ...prev, step2: true }))
      updateProgressSmooth(70)
      
      // Step 3: Calculate final ATS score
      setCurrentStep("Calculating final ATS score...")
      updateProgressSmooth(90)
      
      let finalAtsScore: number | undefined = undefined
      const optimizedResume = rewriteResponse.optimized_resume || rewriteResponse

      // Validate optimizedResume is a string
      if (typeof optimizedResume !== 'string') {
        throw new Error("Invalid resume format received from API")
      }
      
      if (optimizedResume && keywords.length > 0) {
        const finalAtsResult = calculateAtsScore(optimizedResume, keywords)
        finalAtsScore = finalAtsResult.score
      }
      
      // Complete optimization
      updateProgressSmooth(100)
      setApiCheckpoints(prev => ({ ...prev, step3: true }))
      setCurrentStep("Optimization complete!")
      
      // Prepare results data using original pattern
      const resultsData: ResultsData = {
        resume: optimizedResume,
        initialScore: initialScore ?? 0,     // Use local variable, not state
        finalScore: finalAtsScore ?? 0,      // Calculated final score
        missingKeywords: missingKeywordsCount
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
      setPreValidationError(error.message || 'Optimization failed')
      setCurrentStep("Error occurred")
    } finally {
      setIsSubmitting(false)
      setAbortController(null)
    }
  }

  // ATS Score Circle Component
  const AtsScoreCircle = ({ score }: { score: number }) => {
    const circumference = 2 * Math.PI * 45
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (score / 100) * circumference
    
    const getScoreColor = (score: number) => {
      if (score >= 80) return "#00FFAA"
      if (score >= 60) return "#FFD700"
      return "#FF6B6B"
    }
    
    return (
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={getScoreColor(score)}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-white">{Math.round(score)}</span>
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
      } catch (error) {
        setKeywordsError('Failed to extract keywords')
        console.error('Keyword extraction error:', error)
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

  console.log("Our user: ", mappedUser)

  // Show results view if optimization is complete
  if (showResults && optimizationResults) {
    return (
      <div className="min-h-screen bg-black relative text-white">
        <Suspense fallback={<BackgroundFallback />}>
          <BackgroundGlow />
        </Suspense>
        <ResultsView
          optimizedResume={optimizationResults.optimizedResume}
          initialAtsScore={optimizationResults.initialAtsScore}
          finalAtsScore={optimizationResults.finalAtsScore}
          missingKeywordsCount={optimizationResults.missingKeywordsCount}
          onBack={handleBackFromResults}
          onSignUp={() => router.push("/")}
          onNextJob={handleNextJob}
          onGoToProfile={() => {router.push("/profile")}}
          isTrialMode={false}
          user={mappedUser}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative text-white">
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
        <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-4xl"
        >
          {/* Always Visible Header */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-4">Optimize your resume</h2>
            <p className="text-gray-300 text-xl mb-2">
              Get your resume optimized for ATS systems and significantly improve your match score.
            </p>
            
            {/* Additional Info Section */}
            <Collapsible open={isHowToOpen} onOpenChange={setIsHowToOpen}>
              <CollapsibleTrigger className="inline-flex items-center space-x-2 text-[#00FFAA] hover:text-[#00DD99] transition-colors duration-200 mt-4 mb-2">
                <span className="text-sm font-medium">Additional Info</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isHowToOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                      <span className="text-[#00FFAA] mb-2 block">Insert your job description</span>
                      <p className="text-gray-300">For best use and performance, add just the important stuff, not branding fluff. Focus on role requirements, skills, and qualifications. Use this only for specific jobs. If you're applying for a broad job, modify the keywords and provide instructions in the notes as necessary. You'll get faster responses with shorter, focused job descriptions.</p>
                    </div>
                    
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                      <span className="text-[#00FFAA] mb-2 block">Proofread keywords</span>
                      <p className="text-gray-300">Review the extracted keywords carefully. Click to remove irrelevant ones or hold to edit them. These keywords directly impact your ATS score.</p>
                    </div>
                    
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                      <span className="text-[#00FFAA] mb-2 block">Additional notes (optional)</span>
                      <p className="text-gray-300">Feel free to add anything useful. Cases can be removing a certain project, adding another one, specifying a certain aspect to focus on, or refining a certain section. When adding projects, be as specific as possible. The AI will be able to add its own points related to the job description if you aren't super specific, but better to be more accurate.</p>
                    </div>
                    
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                      <span className="text-[#00FFAA] mb-2 block">Limitations</span>
                      <p className="text-gray-300">The optimization will only work according to the info provided. If your resume only has React and you give a description with C++, you won't get a 100% resume score. To optimize for this, try adding a C++ project in the description.</p>
                    </div>
                    
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                      <span className="text-[#00FFAA] mb-2 block">If you need to modify your resume</span>
                      <p className="text-gray-300">Please go to <span className="text-[#00FFAA]">Profile → Manage My Resume</span>.</p>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>


          {/* Conditional Rendering: Form or Loading Progress */}
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
          ) : (
            <div className="bg-white/3 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl space-y-6">
            {/* Error Display handled by toasts */}



            {/* Job Description Textarea */}
            <div className="space-y-3">
              <label className="text-white font-medium flex items-center space-x-2">
                <Info className="w-4 h-4 text-[#00FFAA]" />
                <span>Job Description</span>
              </label>
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
                  className="min-h-[300px] bg-white/5 border-white/20 text-white placeholder:text-gray-500 text-lg leading-relaxed resize-none focus:border-[#00FFAA] focus:ring-[#00FFAA] rounded-2xl"
                />

                <motion.div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  animate={{
                    boxShadow:
                      jobDescription.length > 0
                        ? "0 0 0 1px rgba(0,255,170,0.3), 0 0 20px rgba(0,255,170,0.1)"
                        : "0 0 0 1px transparent",
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Keywords & ATS Score Section */}
            {(jobDescription.trim() || keywordsLoading || keywords.length > 0 || keywordsError) && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-white font-medium flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-[#00FFAA]" />
                    <span>Analysis Results</span>
                  </label>
                  <p className="text-gray-400 text-sm">
                    These keywords aren't always accurate. Click to remove or hold to edit a keyword.
                  </p>
                </div>
                
                {keywordsLoading && (
                  <div className="bg-white/5 border border-white/20 rounded-xl p-4">
                    <div className="flex items-center space-x-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        className="w-4 h-4 border-2 border-[#00FFAA] border-t-transparent rounded-full"
                      />
                      <span className="text-gray-300 text-sm">Extracting keywords and calculating ATS score...</span>
                    </div>
                  </div>
                )}

                {keywordsError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <p className="text-red-400 text-sm">{keywordsError}</p>
                  </div>
                )}

                {!keywordsLoading && !keywordsError && keywords.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Keywords Card (3/4 width) */}
                    <div className="lg:col-span-3">
                      <div className="bg-white/5 border border-white/20 rounded-xl p-4 h-full">
                        <h4 className="text-white font-medium text-sm mb-3">Extracted Keywords</h4>
                        <div className="flex flex-wrap gap-2">
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
                                    className="px-2 py-1 bg-white/10 border border-[#00FFAA]/50 rounded-full text-white text-sm font-medium outline-none focus:border-[#00FFAA] min-w-[60px] max-w-[120px]"
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
                                  className="px-3 py-1 bg-gradient-to-r from-[#00FFAA]/20 to-[#00DD99]/20 border border-[#00FFAA]/30 rounded-full text-white text-sm font-medium cursor-pointer transition-all duration-200 hover:from-red-500/30 hover:to-red-400/30 hover:border-red-400/50 hover:text-red-100 select-none inline-block"
                                >
                                  {keyword}
                                </motion.span>
                              )}
                            </motion.div>
                          ))}
                        </div>
                        <p className="text-gray-400 text-xs mt-3">
                          {keywords.length} keywords extracted • These will be used to optimize your resume
                        </p>
                      </div>
                    </div>

                    {/* ATS Score Card (1/4 width - Square) */}
                    <div className="lg:col-span-1">
                      <div className="bg-white/5 border border-white/20 rounded-xl p-4 h-full flex flex-col items-center justify-center text-center min-h-[140px]">
                        <h4 className="text-white font-medium text-sm mb-3">ATS Score</h4>
                        {currentAtsResult !== null ? (
                          <>
                            <AtsScoreCircle score={currentAtsResult.score} />
                            <p className="text-gray-400 text-xs mt-2">
                              {currentAtsResult.score >= 80 
                                ? "Excellent!" 
                                : currentAtsResult.score >= 60 
                                  ? "Good" 
                                  : currentAtsResult.score >= 40 
                                    ? "Needs work" 
                                    : "Poor match"
                              }
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="w-16 h-16 flex items-center justify-center bg-white/5 rounded-full border border-white/10 mb-2">
                              <span className="text-gray-400 text-xs">No Score</span>
                            </div>
                            <p className="text-gray-400 text-xs">Upload resume</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {!keywordsLoading && !keywordsError && keywords.length === 0 && jobDescription.trim() && (
                  <div className="bg-white/5 border border-white/20 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">No keywords extracted. Try adding more technical details to the job description.</p>
                  </div>
                )}
              </div>
            )}

            {/* Notes Section */}
            {keywords.length > 0 && !keywordsLoading && (
              <div className="space-y-3">
                <label className="text-white font-medium flex items-center space-x-2">
                  <Info className="w-4 h-4 text-[#00FFAA]" />
                  <span>Additional Notes (Optional)</span>
                </label>
                <div className="relative">
                  <Textarea
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    placeholder="Let the AI know anything important before optimizing...

Examples:
• Focus on leadership experience
• Emphasize remote work skills
• Highlight specific certifications
• Mention career transition context"
                    className="min-h-[120px] bg-white/5 border-white/20 text-white placeholder:text-gray-500 text-sm leading-relaxed resize-none focus:border-[#00FFAA] focus:ring-[#00FFAA] rounded-xl"
                  />
                  <motion.div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    animate={{
                      boxShadow:
                        userNotes.length > 0
                          ? "0 0 0 1px rgba(0,255,170,0.3), 0 0 20px rgba(0,255,170,0.1)"
                          : "0 0 0 1px transparent",
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-gray-400 text-xs">
                  This helps the AI understand your priorities and context for better optimization.
                </p>
              </div>
            )}

            <div className="flex justify-center mt-8">
              <Button
                onClick={handleSubmit}
                disabled={!jobDescription.trim() || isSubmitting || keywordsLoading || keywords.length === 0}
                className="bg-gradient-to-r from-[#00FFAA] to-[#00DD99] hover:from-[#00DD99] hover:to-[#00FFAA] text-black font-bold px-8 py-4 text-lg rounded-xl hover:scale-105 transition-all duration-300 hover:shadow-[0_0_40px_rgba(0,255,170,0.4)] shadow-[0_0_20px_rgba(0,255,170,0.2)] disabled:opacity-50 disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="w-5 h-5 border-2 border-black border-t-transparent rounded-full mr-2"
                  />
                ) : (
                  <Sparkles className="mr-2 h-5 w-5" />
                )}
                {isSubmitting ? buttonText : "Start Optimization"}
              </Button>
            </div>
          </div>
          )}
        </motion.div>
      </div>

        {/* Footer */}
        <motion.footer
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="text-center p-6 z-10"
        >
          <span className="text-gray-500 text-sm">Made by </span>
          <a
            href="https://khizarmalik.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-[#00FFAA] transition-colors duration-300 border-b border-gray-400 hover:border-[#00FFAA] pb-1 font-medium"
          >
            Khizar Malik
          </a>
        </motion.footer>
      </motion.div>
    </div>
  )
}