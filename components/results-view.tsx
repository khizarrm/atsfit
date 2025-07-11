"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect, useRef } from "react"
import { Download, Copy, ArrowLeft, Eye, EyeOff, Crown, Lock, Sparkles, User, Info } from "lucide-react"
import { generatePDF } from "@/lib/api"
import { SharedHeader } from "@/components/shared-header"
import { renderMarkdownPreview } from "@/lib/utils/preview-renderer"
import { generatePDFCSS, PREVIEW_CONTAINER_STYLES } from "@/lib/utils/preview-renderer"

interface User {
  id: string
  email: string
  name: string
}

interface ResultsViewProps {
  optimizedResume: string
  onBack: () => void
  onSignUp: () => void
  onNextJob: (jobUrl: string) => void
  onGoToProfile: () => void
  isTrialMode: boolean
  user: User | null
  initialAtsScore?: number
  finalAtsScore?: number
  missingKeywordsCount?: number
  summary?: string
}

export function ResultsView({ optimizedResume, onBack, onSignUp, onNextJob, onGoToProfile, isTrialMode, user, initialAtsScore, finalAtsScore, missingKeywordsCount, summary }: ResultsViewProps) {
  console.log("ResultsView props - initialAtsScore:", initialAtsScore, "finalAtsScore:", finalAtsScore)
  
  // Early validation to prevent rendering issues
  if (typeof optimizedResume !== 'string') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-400 text-center">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p>Invalid resume data received. Please try again.</p>
          <button onClick={onBack} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
            Go Back
          </button>
        </div>
      </div>
    )
  }
  
  const [copied, setCopied] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [calculatedFinalScore, setCalculatedFinalScore] = useState<number | null>(finalAtsScore || null)
  const [isCalculatingFinalScore, setIsCalculatingFinalScore] = useState(false)
  const hasCalculatedRef = useRef(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)

  // Use the final ATS score passed from the optimization process
  useEffect(() => {
    if (finalAtsScore !== undefined && !hasCalculatedRef.current) {
      hasCalculatedRef.current = true
      setCalculatedFinalScore(finalAtsScore)
      setIsCalculatingFinalScore(false)
    }
  }, [finalAtsScore])


  const handleCopy = async () => {
    if (isTrialMode) {
      onSignUp()
      return
    }
    await navigator.clipboard.writeText(optimizedResume)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpenFullA4 = () => {
    if (!optimizedResume.trim()) {
      return
    }
    
    const html = renderMarkdownPreview(optimizedResume)
    const css = generatePDFCSS(PREVIEW_CONTAINER_STYLES)
    
    const fullHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Optimized Resume - Full A4 View</title>
        <style>${css}</style>
      </head>
      <body>
        <div class="resume-container">
          ${html}
        </div>
      </body>
      </html>
    `
    
    const blob = new Blob([fullHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    
    // Clean up the URL after a short delay
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const handleDownload = async () => {
    
    if (!optimizedResume.trim()) {
      return
    }
    
    try {
      setIsGeneratingPDF(true)
      setPdfError(null)
      
      const result = await generatePDF(optimizedResume, {
        format: 'letter',
        filename: 'new-resume.pdf'
      })
      
      if (!result.success) {
        throw new Error(result.error || 'PDF generation failed')
      }
      
      console.log('PDF generated successfully')
      
    } catch (error) {
      console.error('PDF generation failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setPdfError(errorMessage)
      
      // Fallback to markdown download
      setTimeout(() => {
        const blob = new Blob([optimizedResume], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "optimized-resume.md"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 2000) // Give user time to see error
      
    } finally {
      setIsGeneratingPDF(false)
      // Clear progress after a short delay
      setTimeout(() => {
        setPdfError(null)
      }, 3000)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="min-h-screen flex flex-col"
    >
      <SharedHeader
        leftContent={
          <div className="flex items-center space-x-4 w-48"> {/* Fixed width for centering */}
            <Button onClick={onBack} variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {isTrialMode ? "Back to Get Started" : "Back to Dashboard"}
            </Button>
          </div>
        }
        rightContent={
          isTrialMode ? (
            <div className="flex items-center space-x-4 w-48 justify-end"> {/* Fixed width for centering */}
              <Button
                onClick={onSignUp}
                className="bg-gradient-to-r from-[#00FFAA] to-[#00DD99] hover:from-[#00DD99] hover:to-[#00FFAA] text-black font-semibold px-4 py-2 text-sm rounded-xl transition-all duration-300 hover:scale-105"
              >
                <Crown className="mr-1 h-4 w-4" />
                Upgrade Now
              </Button>
            </div>
          ) : undefined
        }
        onGoToProfile={onGoToProfile}
        onSignUp={onSignUp}
        user={user}
      />

      {/* Main Content */}
      <div className="flex-1 p-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="max-w-7xl mx-auto"
        >
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-4">Your Optimized Resume</h2>
            <p className="text-gray-400 text-lg">AI-enhanced resume tailored for maximum ATS compatibility</p>
            {isTrialMode && (
              <div className="mt-4 inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-2">
                <Lock className="w-4 h-4 text-amber-500" />
                <span className="text-amber-400 font-medium text-sm">Trial Preview - Sign up to download and copy</span>
              </div>
            )}
          </div>

          {/* Summary Card - Full Width */}
          {summary && (
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                {/* Subtle animated background */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-[#00FFAA]/5 via-transparent to-[#00DD99]/5"
                  animate={{
                    opacity: [0.3, 0.5, 0.3]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                
                <div className="relative z-10">
                  <div className="flex items-center mb-4">
                    <h3 className="text-xl font-semibold text-white">Summary of Changes</h3>
                  </div>
                  
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-300 leading-relaxed text-base whitespace-pre-line">
                      {summary}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Modern Layout - Responsive Grid */}
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-4">
            
            {/* Left Column: Stats Cards */}
            <div className="lg:col-span-1 space-y-4">
              
              {/* ATS Score Improvement Card */}
              <motion.div
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-[#00FFAA]/10 via-[#00DD99]/5 to-[#00FFAA]/10 border border-[#00FFAA]/30 rounded-xl p-5 backdrop-blur-xl relative overflow-hidden"
              >
                {/* Animated Background Glow */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-[#00FFAA]/5 to-[#00DD99]/5 rounded-2xl"
                  animate={{
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                
                <div className="relative z-10">
                  <h3 className="text-white font-semibold mb-5 text-base flex items-center">
                    <Sparkles className="w-4 h-4 mr-2 text-[#00FFAA]" />
                    ATS Score Impact
                  </h3>
                  
                  <div className="space-y-5">
                    {/* Before Score Circle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center ${
                            typeof initialAtsScore === 'number' 
                              ? initialAtsScore >= 70 
                                ? 'bg-green-500/20 border-green-400/60' 
                                : initialAtsScore >= 40 
                                  ? 'bg-yellow-500/20 border-yellow-400/60' 
                                  : 'bg-red-500/20 border-red-400/60'
                              : 'bg-gray-500/20 border-gray-400/30'
                          }`}>
                            <span className={`font-bold text-sm ${
                              typeof initialAtsScore === 'number' 
                                ? initialAtsScore >= 70 
                                  ? 'text-green-300' 
                                  : initialAtsScore >= 40 
                                    ? 'text-yellow-300' 
                                    : 'text-red-300'
                                : 'text-gray-300'
                            }`}>
                              {typeof initialAtsScore === 'number' ? Math.round(initialAtsScore) : '--'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm font-medium">Before</div>
                          <div className="text-gray-500 text-xs">Original resume</div>
                        </div>
                      </div>
                    </div>

                    {/* Animated Arrow */}
                    <div className="flex items-center justify-center py-2">
                      <motion.div 
                        className="flex flex-col items-center"
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <motion.div 
                          className="text-2xl text-[#00FFAA] mb-1"
                          animate={{ 
                            textShadow: [
                              "0 0 0px rgba(0,255,170,0)",
                              "0 0 10px rgba(0,255,170,0.8)",
                              "0 0 0px rgba(0,255,170,0)"
                            ]
                          }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                          ↓
                        </motion.div>
                        <div className="text-[#00FFAA] text-xs font-medium">AI Enhanced</div>
                      </motion.div>
                    </div>

                    {/* After Score Circle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          {isCalculatingFinalScore ? (
                            <motion.div 
                              className="w-11 h-11 rounded-full bg-[#00FFAA]/10 border-2 border-[#00FFAA]/50 flex items-center justify-center"
                              animate={{ 
                                borderColor: ["rgba(0,255,170,0.3)", "rgba(0,255,170,0.8)", "rgba(0,255,170,0.3)"],
                                boxShadow: [
                                  "0 0 0px rgba(0,255,170,0)",
                                  "0 0 15px rgba(0,255,170,0.4)",
                                  "0 0 0px rgba(0,255,170,0)"
                                ]
                              }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            >
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-3 h-3 border-2 border-[#00FFAA] border-t-transparent rounded-full"
                              />
                            </motion.div>
                          ) : calculatedFinalScore ? (
                            <motion.div 
                              className="w-11 h-11 rounded-full bg-gradient-to-br from-[#00FFAA]/20 to-[#00DD99]/20 border-2 border-[#00FFAA] flex items-center justify-center relative"
                              animate={{ 
                                boxShadow: [
                                  "0 0 0px rgba(0,255,170,0)",
                                  "0 0 20px rgba(0,255,170,0.6)",
                                  "0 0 0px rgba(0,255,170,0)"
                                ],
                                scale: [1, 1.05, 1]
                              }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                              <span className="text-[#00FFAA] font-bold text-sm">
                                {calculatedFinalScore}
                              </span>
                              <motion.div
                                className="absolute inset-0 rounded-full border-2 border-[#00FFAA]/30"
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                              />
                            </motion.div>
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-gray-500/20 border-2 border-gray-400/30 flex items-center justify-center">
                              <span className="text-gray-400 font-bold text-sm">--</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">After</div>
                          <div className="text-gray-400 text-xs">AI optimized</div>
                        </div>
                      </div>
                    </div>

                    {/* Improvement Badge */}
                    {calculatedFinalScore && initialAtsScore && (
                      <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                        className="text-center pt-4 border-t border-[#00FFAA]/20"
                      >
                        <motion.div 
                          className="bg-gradient-to-r from-[#00FFAA]/20 to-[#00DD99]/20 border border-[#00FFAA]/50 rounded-full px-4 py-2 inline-flex items-center space-x-2"
                          animate={{ 
                            boxShadow: [
                              "0 0 0px rgba(0,255,170,0)",
                              "0 0 25px rgba(0,255,170,0.4)",
                              "0 0 0px rgba(0,255,170,0)"
                            ]
                          }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          >
                            🚀
                          </motion.div>
                          <span className="text-[#00FFAA] font-bold text-sm">
                            +{Math.round(calculatedFinalScore - initialAtsScore)} points
                          </span>
                        </motion.div>
                        <p className="text-gray-400 text-xs mt-2">
                          {calculatedFinalScore >= 80 
                            ? "Excellent improvement!" 
                            : calculatedFinalScore >= 60 
                              ? "Great progress!" 
                              : "Good start!"
                          }
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Keywords Enhanced Card */}
              <motion.div
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-white/5 border border-white/20 rounded-xl p-5 backdrop-blur-xl"
              >
                <h3 className="text-white font-semibold mb-4 text-base flex items-center">
                  <Eye className="w-4 h-4 mr-2 text-[#00FFAA]" />
                  Enhanced Keywords
                </h3>
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#00FFAA] mb-2">
                      {missingKeywordsCount ? `${missingKeywordsCount}${missingKeywordsCount >= 10 ? '+' : ''}` : '--'}
                    </div>
                    <div className="text-gray-400 text-sm">Keywords Added</div>
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    Strategically integrated throughout your resume
                  </div>
                </div>
              </motion.div>

              {/* Optimization Status Card */}
              <motion.div
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="bg-white/5 border border-white/20 rounded-xl p-5 backdrop-blur-xl"
              >
                <h3 className="text-white font-semibold mb-4 text-base flex items-center">
                  <Crown className="w-4 h-4 mr-2 text-[#00FFAA]" />
                  Status
                </h3>
                <div className="text-center">
                  <div className="inline-flex items-center space-x-2 bg-[#00FFAA]/10 border border-[#00FFAA]/30 rounded-full px-4 py-2">
                    <div className="w-2 h-2 bg-[#00FFAA] rounded-full animate-pulse" />
                    <span className="text-[#00FFAA] font-medium text-sm">
                      {isTrialMode ? "Trial Complete" : "Optimized"}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mt-4">
                    {calculatedFinalScore && calculatedFinalScore >= 80 
                      ? "Excellent ATS compatibility" 
                      : calculatedFinalScore && calculatedFinalScore >= 60 
                        ? "Good ATS performance" 
                        : "Optimization complete"
                    }
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Middle Column: Resume Content - Main Focus */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-white/3 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl h-full"
              >
                <div className="p-6 border-b border-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-semibold text-lg">
                        {showPreview ? "Resume Preview" : "Optimized Resume Content"}
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">
                        {showPreview ? "How your resume will look when printed" : "AI-enhanced with strategic keyword placement"}
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowPreview(!showPreview)}
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/10 hover:text-white"
                    >
                      {showPreview ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                      {showPreview ? "Show Markdown" : "Show Preview"}
                    </Button>
                  </div>
                </div>
                <div className="p-6">
                  {showPreview ? (
                    <div 
                      className="bg-white rounded-xl p-4 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                      style={{ 
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        fontSize: '14px',
                        lineHeight: '1.2',
                        color: '#111'
                      }}
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdownPreview(optimizedResume)
                      }}
                    />
                  ) : (
                    <div className="bg-black/20 rounded-2xl p-6 font-mono text-sm leading-relaxed text-gray-300 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                      <pre className="whitespace-pre-wrap">{optimizedResume}</pre>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Right Column: Actions & Export */}
            <div className="lg:col-span-1 space-y-4">
              
              {/* Export Options Card */}
              <motion.div
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-white/5 border border-white/20 rounded-xl p-5 backdrop-blur-xl"
              >
                <h3 className="text-white font-semibold mb-4 text-base flex items-center">
                  <Download className="w-4 h-4 mr-2 text-[#00FFAA]" />
                  Export Options
                </h3>
                <div className="space-y-3">
                  <Button
                    onClick={handleDownload}
                    disabled={isGeneratingPDF}
                    className={`w-full font-semibold py-3 rounded-lg hover:scale-105 transition-all duration-300 ${
                      isTrialMode
                        ? "bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600"
                        : "bg-gradient-to-r from-[#00FFAA] to-[#00DD99] hover:from-[#00DD99] hover:to-[#00FFAA] text-black hover:shadow-[0_0_30px_rgba(0,255,170,0.3)] disabled:opacity-50 disabled:hover:scale-100"
                    }`}
                  >
                    {isGeneratingPDF ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                          className="w-4 h-4 border-2 border-black border-t-transparent rounded-full mr-2 inline-block"
                        />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4 inline" />
                        {"Download PDF"}
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleCopy}
                    className={`w-full font-semibold py-3 rounded-lg hover:scale-105 transition-all duration-300 ${
                      isTrialMode
                        ? "bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 text-gray-300"
                        : "bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 text-white hover:shadow-[0_0_30px_rgba(0,255,170,0.3)]"
                    }`}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    {isTrialMode ? "Upgrade to Copy" : copied ? "Copied!" : "Copy Text"}
                  </Button>
                  
                  <Button
                    onClick={handleOpenFullA4}
                    className="w-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 text-white hover:shadow-[0_0_30px_rgba(0,255,170,0.3)] font-semibold py-3 rounded-lg hover:scale-105 transition-all duration-300"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Full A4 View
                  </Button>
                  
                  {/* Progress indicator */}
                  {isGeneratingPDF && (
                    <div className="mt-4">
                      <div className="bg-white/10 rounded-full h-2 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-[#00FFAA] to-[#00DD99]"
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1 text-center">
                        Generating PDF...
                      </p>
                    </div>
                  )}
                  
                  {/* Error message */}
                  {pdfError && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-400 text-center"
                    >
                      PDF failed: {pdfError}. Downloading markdown instead...
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Pro Tips Card */}
              <motion.div
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-5 backdrop-blur-xl"
              >
                <h3 className="text-white font-semibold mb-4 text-base flex items-center">
                  <Info className="w-4 h-4 mr-2 text-blue-400" />
                  Tips
                </h3>
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                    <p>Proofread this or put into ChatGPT before applying</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                    <p>Customize further for specific roles</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                    <p>Test with different job descriptions</p>
                  </div>
                </div>
              </motion.div>

              {/* Go Again Button */}
              <motion.div
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-center"
              >
                <Button
                  onClick={onBack}
                  variant="outline"
                  className="w-full bg-transparent border-2 border-white/30 text-white hover:bg-white/10 hover:border-[#00FFAA]/50 hover:text-white font-semibold py-4 text-lg rounded-xl hover:scale-105 transition-all duration-300"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Optimize Another Resume
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Success Message */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center mt-8"
          >
            <div className="inline-flex items-center space-x-2 bg-[#00FFAA]/10 border border-[#00FFAA]/30 rounded-full px-6 py-3">
              <div className="w-2 h-2 bg-[#00FFAA] rounded-full animate-pulse" />
              <span className="text-[#00FFAA] font-medium">
                {isTrialMode ? "Trial optimization complete!" : "Resume optimized successfully!"}
              </span>
            </div>
          </motion.div>


          {/* Trial Upgrade CTA */}
          {isTrialMode && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center mt-8"
            >
              <div className="bg-gradient-to-r from-[#00FFAA]/10 to-[#00DD99]/10 border border-[#00FFAA]/30 rounded-2xl p-6 max-w-md mx-auto">
                <Crown className="w-8 h-8 text-[#00FFAA] mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">Unlock Full Features</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Sign up to download, save multiple resumes, and access advanced optimization features
                </p>
                <Button
                  onClick={onSignUp}
                  className="bg-gradient-to-r from-[#00FFAA] to-[#00DD99] hover:from-[#00DD99] hover:to-[#00FFAA] text-black font-bold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105"
                >
                  Get Started Free
                </Button>
              </div>
            </motion.div>
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