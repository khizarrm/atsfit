"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { Send, Info, Sparkles, ChevronDown } from "lucide-react"
import { annotateResume, rewriteResume, AtsScoreResponse, extractKeywordsFromJobDescription } from "@/lib/api"
import { calculateAtsScore, AtsScoreResult } from "@/lib/utils/ats-scorer"
import { useAuth } from "@/contexts/auth-context"
import { LoadingProgress } from "@/components/LoadingProgress"
import { type ResultsData } from "@/lib/utils/results-validation"
import { SharedHeader } from "@/components/shared-header"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface DashboardViewProps {
  onSignUp: () => void
  onGoToProfile: () => void
  user: any | null
}

export function DashboardView({ onSignUp, onGoToProfile, user }: DashboardViewProps) {
  const { resumeMd } = useAuth()
  const [jobDescription, setJobDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [buttonText] = useState("Start AI Optimization")
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [apiCheckpoints, setApiCheckpoints] = useState({ step1: false, step2: false, step3: false })
  const [atsScoreData] = useState<AtsScoreResponse | null>(null)
  const [initialAtsScore] = useState<number | null>(null)
  const [annotationData, setAnnotationData] = useState<any>(null)
  const [atsLoading, setAtsLoading] = useState(false)
  const [annotationLoading, setAnnotationLoading] = useState(false)
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordsLoading, setKeywordsLoading] = useState(false)
  const [keywordsError, setKeywordsError] = useState("")
  const [currentAtsResult, setCurrentAtsResult] = useState<AtsScoreResult | null>(null)
  const [userNotes, setUserNotes] = useState("")
  
  // Post-completion state
  const [optimizationComplete, setOptimizationComplete] = useState(false)
  const [resultsData, setResultsData] = useState<ResultsData | null>(null)
  const [preValidationError, setPreValidationError] = useState<string | null>(null)
  
  // Results display state
  const [showResults, setShowResults] = useState(false)
  const [optimizationResults, setOptimizationResults] = useState<{
    optimizedResume: string
    initialAtsScore: number
    finalAtsScore: number
    missingKeywordsCount: number
  } | null>(null)
  const [editingKeywordIndex, setEditingKeywordIndex] = useState<number | null>(null)
  const [editingKeywordValue, setEditingKeywordValue] = useState("")
  const [storedInitialAtsScore, setStoredInitialAtsScore] = useState<number | null>(null)
  const [progressInterval, setProgressInterval] = useState<NodeJS.Timeout | null>(null)
  const [isHowToOpen, setIsHowToOpen] = useState(false)

  const updateProgressSmooth = (targetProgress: number) => {
    // Clear any existing progress animation
    if (progressInterval) {
      clearInterval(progressInterval)
      setProgressInterval(null)
    }
    
    // Smooth animation to target progress
    const currentProgress = progress
    const steps = Math.abs(targetProgress - currentProgress)
    const stepSize = (targetProgress - currentProgress) / Math.max(steps / 2, 1)
    
    let step = 0
    const interval = setInterval(() => {
      step++
      const newProgress = currentProgress + (stepSize * step)
      
      if ((stepSize > 0 && newProgress >= targetProgress) || (stepSize < 0 && newProgress <= targetProgress)) {
        setProgress(targetProgress)
        clearInterval(interval)
        setProgressInterval(null)
      } else {
        setProgress(newProgress)
      }
    }, 50) // Smooth 50ms intervals
    
    setProgressInterval(interval)
  }

  // Post-completion handler for seamless transition
  const handlePostCompletion = async (data: ResultsData) => {
    try {
      setOptimizationComplete(true)
      setResultsData(data)
      setPreValidationError(null)
      
      // Simple progress simulation since we're not doing URL validation anymore
      setCurrentStep("Finalizing results...")
      updateProgressSmooth(110)
      
      // Small delay for visual continuity, then show results
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

  const handleSubmit = async () => {
    if (!jobDescription.trim()) return

    if (!resumeMd) {
      setError("Please upload your resume first.")
      return
    }

    // Create new AbortController for this optimization session
    const controller = new AbortController()
    setAbortController(controller)
    
    setIsSubmitting(true)
    setError("")
    setProgress(0)
    setApiCheckpoints({ step1: false, step2: false, step3: false })
    
    try {
      // Store the initial ATS score for before/after comparison
      const initialScore = currentAtsResult?.score || null
      setStoredInitialAtsScore(initialScore)
      
      // Capture missing keywords count for results display
      const missingKeywords = currentAtsResult?.missingKeywords || keywords
      const missingKeywordsCount = missingKeywords.length
      
      // Log the data we're working with
      console.log("Job Description:", jobDescription)
      console.log("Using Keywords:", keywords)
      console.log("User Notes:", userNotes)
      console.log("Initial ATS Score:", initialScore)
      console.log("Current ATS Result:", currentAtsResult)
      console.log("Missing Keywords Count:", missingKeywordsCount)
      
      // Step 1: Annotate Resume
      setCurrentStep("Analyzing resume and matching keywords...")
      updateProgressSmooth(20)
      
      // Use only missing keywords for annotation
      const annotateResult = await annotateResume(
        resumeMd,
        jobDescription,
        missingKeywords,
        userNotes.trim() || "The user didn't provide any notes, ignore this"
      )
      console.log("Annotated Resume: ", annotateResult)
      setAnnotationData(annotateResult)
      
      // Complete step 1
      updateProgressSmooth(50)
      setApiCheckpoints(prev => ({ ...prev, step1: true }))
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Step 2: Rewrite Resume
      setCurrentStep("Optimizing resume structure...")
      updateProgressSmooth(70)
      
      console.log("Passing in:", annotateResult["annotated_resume"], userNotes.trim() )
      const rewriteResult = await rewriteResume(annotateResult["annotated_resume"], userNotes.trim())
      
      // Calculate final ATS score with the new optimized resume
      setCurrentStep("Calculating final ATS score...")
      updateProgressSmooth(90)
      
      let finalAtsScore: number | undefined = undefined
      const optimizedResume = rewriteResult.optimized_resume || rewriteResult

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
      setApiCheckpoints(prev => ({ ...prev, step2: true }))
      setCurrentStep("Optimization complete!")
      
      // Start post-completion phase
      await handlePostCompletion({
        resume: optimizedResume,
        initialScore: initialScore ?? 0,
        finalScore: finalAtsScore ?? 0,
        missingKeywords: missingKeywordsCount
      })
      
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Handle cancellation
        setError("Optimization cancelled.")
        setCurrentStep("Cancelled")
        setProgress(0)
      } else {
        console.error("Error during optimization:", err)
        setError("Failed to complete optimization. Please try again.")
        setCurrentStep("Error occurred")
      }
    } finally {
      setIsSubmitting(false)
      setAbortController(null)
    }
  }

  const handleCancel = () => {
    if (abortController) {
      abortController.abort()
      setCurrentStep("Cancelling...")
      setProgress(0)
      
      // Clear any ongoing progress animation
      if (progressInterval) {
        clearInterval(progressInterval)
        setProgressInterval(null)
      }
      
      // Give a brief moment to show cancellation, then reset
      setTimeout(() => {
        setIsSubmitting(false)
        setCurrentStep("")
        setError("")
        setAbortController(null)
        setApiCheckpoints({ step1: false, step2: false, step3: false })
        setAtsLoading(false)
        setAnnotationLoading(false)
      }, 800)
    }
  }


  const handleRemoveKeyword = (indexToRemove: number) => {
    const updatedKeywords = keywords.filter((_, index) => index !== indexToRemove)
    setKeywords(updatedKeywords)
    
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
      setKeywords(updatedKeywords)
      
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


  // Extract keywords when job description changes (with debouncing)
  useEffect(() => {
    if (!jobDescription.trim()) {
      setKeywords([])
      setKeywordsError("")
      setCurrentAtsResult(null)
      return
    }

    const timeoutId = setTimeout(async () => {
      setKeywordsLoading(true)
      setKeywordsError("")
      
      try {
        const extractedKeywords = await extractKeywordsFromJobDescription(jobDescription.trim())
        setKeywords(extractedKeywords)
        
        // Calculate ATS score immediately after keywords are extracted
        if (resumeMd && extractedKeywords.length > 0) {
          console.log("Calculating ATS score with extracted keywords...")
          const atsResult = calculateAtsScore(resumeMd, extractedKeywords)
          setCurrentAtsResult(atsResult)
          console.log("ATS Score calculated:", atsResult.score)
        } else {
          setCurrentAtsResult(null)
        }
      } catch (error) {
        console.error("Keyword extraction failed:", error)
        setKeywordsError("Failed to extract keywords. Please try again.")
        setKeywords([])
        setCurrentAtsResult(null)
      } finally {
        setKeywordsLoading(false)
      }
    }, 1000) // 1 second debounce

    return () => clearTimeout(timeoutId)
  }, [jobDescription, resumeMd])

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressInterval) {
        clearInterval(progressInterval)
      }
    }
  }, [progressInterval])


  // Circular progress component for ATS score
  const AtsScoreCircle = ({ score }: { score: number }) => {
    const circumference = 2 * Math.PI * 45 // radius = 45
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (score / 100) * circumference
    
    // Color based on score
    const getScoreColor = (score: number) => {
      if (score >= 80) return "#00FFAA" // Green
      if (score >= 60) return "#FFD700" // Yellow
      if (score >= 40) return "#FFA500" // Orange
      return "#FF4444" // Red
    }

    const scoreColor = getScoreColor(score)

    return (
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg
          className="transform -rotate-90 w-24 h-24"
          width="96"
          height="96"
        >
          {/* Background circle */}
          <circle
            cx="48"
            cy="48"
            r="45"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="6"
            fill="none"
          />
          {/* Progress circle */}
          <motion.circle
            cx="48"
            cy="48"
            r="45"
            stroke={scoreColor}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span 
            className="text-2xl font-bold"
            style={{ color: scoreColor }}
          >
            {score}
          </span>
          <span className="text-xs text-gray-400 font-medium">ATS</span>
        </div>
      </div>
    )
  }

  // Handle back navigation from results
  const handleBackFromResults = () => {
    setShowResults(false)
    setOptimizationResults(null)
    setOptimizationComplete(false)
    setProgress(0)
    setCurrentStep("")
  }

  // Handle next job from results
  const handleNextJob = (jobUrl: string) => {
    if (jobUrl) {
      sessionStorage.setItem('nextJobUrl', jobUrl)
    }
    handleBackFromResults()
  }

  // Map user to expected interface for ResultsView
  const mappedUser = user ? {
    id: user.id,
    email: user.email!,
    name: user.user_metadata?.full_name || user.email!,
  } : null


  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="min-h-screen flex flex-col"
    >
      <SharedHeader
        showSettingsButton={true}
        onGoToProfile={onGoToProfile}
        onSignUp={onSignUp}
        user={user}
      />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
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
              progress={progress}
              currentStep={currentStep}
              onCancel={handleCancel}
              optimizationComplete={optimizationComplete}
              resultsData={resultsData ?? undefined}
              error={preValidationError}
              atsScoreData={atsScoreData}
              atsLoading={atsLoading}
              annotationLoading={annotationLoading}
            />
          ) : (
            <div className="bg-white/3 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl space-y-6">
            {/* Error Display */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}



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
  )
}
