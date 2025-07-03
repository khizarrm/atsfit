"use client"

import type React from "react"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { Send, Check, ArrowLeft, Crown, Type, Sparkles, Copy, ExternalLink, AlertCircle, Clock, Shield } from "lucide-react"
import { useTrial } from "@/contexts/trial-context"

interface TryItViewProps {
  onJobSubmit: (description: string, resumeText: string) => void
  onBack: () => void
  onSignUp: () => void
  isTrialMode: boolean
}

export function TryItView({ onJobSubmit, onBack, onSignUp, isTrialMode }: TryItViewProps) {
  const [jobDescription, setJobDescription] = useState("")
  const [resumeText, setResumeText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState<'resume' | 'job'>('resume')
  const [showChatGPTPrompt, setShowChatGPTPrompt] = useState(false)
  const [showMarkdownPrompt, setShowMarkdownPrompt] = useState(false)
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [copiedMarkdownPrompt, setCopiedMarkdownPrompt] = useState(false)
  
  // Trial context for attempt tracking
  const { attemptsRemaining, hasAttemptsRemaining, getAttemptDisplayText, makeAttempt } = useTrial()

  const handleResumeNext = () => {
    if (resumeText.trim()) {
      setCurrentStep('job')
    }
  }

  const handleBack = () => {
    if (currentStep === 'job') {
      setCurrentStep('resume')
    } else {
      onBack()
    }
  }

  const handleSubmit = async () => {
    if (!jobDescription.trim() || !resumeText.trim()) return
    
    // Check if user can make an attempt
    if (!hasAttemptsRemaining) {
      return // Don't proceed if no attempts left
    }

    // Increment attempt counter
    const attemptMade = makeAttempt()
    if (!attemptMade) {
      return // Failed to make attempt
    }

    setIsSubmitting(true)
    setTimeout(() => {
      onJobSubmit(jobDescription, resumeText)
    }, 500)
  }

  // ChatGPT prompt for resume optimization
  const optimizationPrompt = `I need help optimizing my resume for this job posting. Here's my current resume:

[PASTE YOUR RESUME HERE]

And here's the job description I'm targeting:

${jobDescription || '[PASTE JOB DESCRIPTION HERE]'}

Please:
1. Analyze the job requirements and extract key skills/keywords
2. Review my resume and identify what's missing
3. Suggest specific improvements to better match the job
4. Rewrite relevant sections to include important keywords naturally
5. Provide a final optimized version

Focus on ATS optimization while keeping the content truthful and relevant to my experience.`

  // ChatGPT prompt for markdown conversion
  const markdownPrompt = `Convert the following resume text exactly as written into Markdown format.

Instructions:

Do not rephrase, rewrite, or edit any content. Do not change the format of the writing. 

Use # (H1) only for my name at the top.

Use ### (H3) for section headings (like EXPERIENCE, EDUCATION, SKILLS, PROJECTS).

Use #### (H4) for company or project titles.

Keep bullet points, line breaks, and formatting exactly as in my input. Do not add bullet points for project/experience titles, only for detailed points regarding an experience or project. 

Output it as plain text so I can easily copy and paste it.

Your only task is to strictly convert my resume to Markdown, preserving all content exactly.

Bold small categories and project names, eg. Frameworks, Technologies. 

Italicize company names, but bold the names of positions. 

Underline quantifiable metrics. 

Format bullet points with a '-'

When returning, ensure you do not modify any content whatsoever. 

Resume follows below:
___________________________________________________________`

  const copyOptimizationPrompt = async () => {
    try {
      await navigator.clipboard.writeText(optimizationPrompt)
      setCopiedPrompt(true)
      setTimeout(() => setCopiedPrompt(false), 2000)
    } catch (err) {
      console.error('Failed to copy optimization prompt:', err)
    }
  }

  const copyMarkdownPromptToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(markdownPrompt)
      setCopiedMarkdownPrompt(true)
      setTimeout(() => setCopiedMarkdownPrompt(false), 2000)
    } catch (err) {
      console.error('Failed to copy markdown prompt:', err)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="min-h-screen flex flex-col"
    >
      {/* Top Navigation */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between p-6 bg-white/3 backdrop-blur-xl border-b border-white/5"
      >
        <div className="flex items-center w-48">
          <Button onClick={handleBack} variant="ghost" className="text-white hover:bg-white/10">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {currentStep === 'job' ? 'Back to Resume' : 'Back to Home'}
          </Button>
        </div>
        
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#00FFAA] to-[#00CC88] bg-clip-text text-transparent">
          ATSFit
        </h1>
        
        <div className="flex items-center space-x-3 w-48 justify-end">
          {/* Trial Attempts Counter */}
          <div className="flex items-center space-x-2 bg-white/10 border border-white/20 rounded-xl px-3 py-2 whitespace-nowrap">
            <Clock className="w-4 h-4 text-[#00FFAA]" />
            <span className="text-white text-sm font-medium whitespace-nowrap">{getAttemptDisplayText()}</span>
          </div>
          
          <Button
            onClick={onSignUp}
            className="bg-gradient-to-r from-[#00FFAA] to-[#00DD99] hover:from-[#00DD99] hover:to-[#00FFAA] text-black font-semibold px-4 py-2 text-sm rounded-xl transition-all duration-300 hover:scale-105"
          >
            <Crown className="mr-1 h-4 w-4" />
            Sign Up
          </Button>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-4xl space-y-8"
        >
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-4">Try ATSFit</h2>
            <p className="text-gray-400 text-lg">
              {currentStep === 'resume' 
                ? 'Paste your resume to get started with AI optimization'
                : 'Now paste the job description you\'re targeting'
              }
            </p>
            {isTrialMode && (
              <div className="mt-4 space-y-2">
                <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  <span className="text-amber-400 font-medium text-sm">Trial Mode</span>
                </div>
                
                {/* Trial limit warning */}
                {!hasAttemptsRemaining && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center space-x-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-2"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 font-medium text-sm">Trial limit reached - Create an account to continue</span>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {currentStep === 'resume' ? (
            /* Resume Paste Card */
            <div className="bg-white/3 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">Step 1: Your Resume</h3>
                <p className="text-gray-400">Paste your resume content in markdown format</p>
              </div>

              {/* Markdown Conversion Helper - Always Visible */}
              <div className="mb-6 bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <ExternalLink className="w-4 h-4 text-[#00FFAA]" />
                    <h4 className="text-white font-medium text-sm">Need to convert from Word/PDF?</h4>
                  </div>
                  <Button
                    onClick={copyMarkdownPromptToClipboard}
                    size="sm"
                    className="bg-gradient-to-r from-[#00FFAA] to-[#00DD99] hover:from-[#00DD99] hover:to-[#00FFAA] text-black font-semibold text-xs px-3 py-1"
                  >
                    {copiedMarkdownPrompt ? (
                      <>
                        <Check className="mr-1 h-3 w-3" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 h-3 w-3" />
                        Copy ChatGPT Prompt
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="bg-black/20 border border-white/10 rounded-lg p-3 max-h-32 overflow-y-auto mb-3">
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap leading-tight">{markdownPrompt}</pre>
                </div>
                
                <div className="flex items-start space-x-2 text-xs">
                  <div className="w-4 h-4 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-400 text-xs font-bold">!</span>
                  </div>
                  <p className="text-gray-400">
                    Copy prompt → Go to ChatGPT → Paste prompt → Add your resume text → Get markdown output
                  </p>
                </div>
              </div>

              <div className="relative">
                <Textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder={`# Your Name

## Experience

### Software Engineer | Company Name
- Achievement 1
- Achievement 2

## Education

### Degree | University Name

## Skills

- Skill 1
- Skill 2`}
                  className="min-h-[300px] bg-white/5 border-white/20 text-white placeholder:text-gray-500 text-sm leading-relaxed resize-none focus:border-[#00FFAA] focus:ring-[#00FFAA] rounded-2xl"
                />

                <motion.div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  animate={{
                    boxShadow:
                      resumeText.length > 0
                        ? "0 0 0 1px rgba(0,255,170,0.3), 0 0 20px rgba(0,255,170,0.1)"
                        : "0 0 0 1px transparent",
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {resumeText.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center space-x-2 text-sm text-[#00FFAA]"
                >
                  <Check className="w-4 h-4" />
                  <span>Resume added ({resumeText.length} characters)</span>
                </motion.div>
              )}

              <div className="flex justify-center mt-6">
                <Button
                  onClick={handleResumeNext}
                  disabled={!resumeText.trim()}
                  className="bg-gradient-to-r from-[#00FFAA] to-[#00DD99] hover:from-[#00DD99] hover:to-[#00FFAA] text-black font-bold px-8 py-3 text-lg rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                  <Type className="mr-2 h-5 w-5" />
                  Continue to Job Description
                </Button>
              </div>
            </div>
          ) : null}


          {currentStep === 'job' ? (
            /* Job Description Card */
            <div className="bg-white/3 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">Step 2: Job Description</h3>
                <p className="text-gray-400">Paste the job description you're targeting</p>
              </div>

              <div className="relative">
                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  className="min-h-[200px] bg-white/5 border-white/20 text-white placeholder:text-gray-500 text-lg leading-relaxed resize-none focus:border-[#00FFAA] focus:ring-[#00FFAA] rounded-2xl"
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

              {jobDescription.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center space-x-2 text-sm text-[#00FFAA]"
                >
                  <Check className="w-4 h-4" />
                  <span>Job description added ({jobDescription.length} characters)</span>
                </motion.div>
              )}
            </div>
          ) : null}

          {/* Submit Button - only show when on job description step */}
          {currentStep === 'job' && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <Button
                  onClick={handleSubmit}
                  disabled={!jobDescription.trim() || !resumeText.trim() || isSubmitting || !hasAttemptsRemaining}
                  className="bg-gradient-to-r from-[#00FFAA] to-[#00DD99] hover:from-[#00DD99] hover:to-[#00FFAA] text-black font-bold px-12 py-4 text-lg rounded-xl hover:scale-105 transition-all duration-300 hover:shadow-[#00FFAA] shadow-[0_0_20px_rgba(0,255,170,0.2)] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="w-5 h-5 border-2 border-black border-t-transparent rounded-full mr-2"
                    />
                  ) : !hasAttemptsRemaining ? (
                    <AlertCircle className="mr-2 h-5 w-5" />
                  ) : (
                    <Sparkles className="mr-2 h-5 w-5" />
                  )}
                  {isSubmitting 
                    ? "Optimizing..." 
                    : !hasAttemptsRemaining 
                      ? "Trial Limit Reached" 
                      : "Optimize My Resume"
                  }
                </Button>
              </div>
              
              {/* Trial exhausted state */}
              {!hasAttemptsRemaining && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center"
                >
                  <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
                  <h4 className="text-white font-semibold mb-2">Trial Limit Reached</h4>
                  <p className="text-gray-400 text-sm mb-4">
                    You've used all 3 free attempts. Create an account to get unlimited access!
                  </p>
                  <Button
                    onClick={onSignUp}
                    className="bg-gradient-to-r from-[#00FFAA] to-[#00DD99] hover:from-[#00DD99] hover:to-[#00FFAA] text-black font-semibold px-6 py-2 rounded-xl transition-all duration-300 hover:scale-105"
                  >
                    <Crown className="mr-2 h-4 w-4" />
                    Create Free Account
                  </Button>
                </motion.div>
              )}

              {/* ChatGPT Alternative Section */}
              <div className="bg-white/3 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <ExternalLink className="w-5 h-5 text-[#00FFAA]" />
                    <h4 className="text-white font-medium">Try with ChatGPT</h4>
                  </div>
                  <Button
                    onClick={() => setShowChatGPTPrompt(!showChatGPTPrompt)}
                    variant="ghost"
                    size="sm"
                    className="text-[#00FFAA] hover:bg-[#00FFAA]/10"
                  >
                    {showChatGPTPrompt ? 'Hide' : 'Show'} Prompt
                  </Button>
                </div>
                
                <p className="text-gray-400 text-sm mb-3">
                  Want to try optimization with ChatGPT? Copy our expert prompt below.
                </p>

                {showChatGPTPrompt && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 max-h-40 overflow-y-auto">
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap">{optimizationPrompt}</pre>
                    </div>
                    
                    <Button
                      onClick={copyOptimizationPrompt}
                      className="w-full bg-white/5 border border-white/20 hover:bg-white/10 text-white"
                    >
                      {copiedPrompt ? (
                        <>
                          <Check className="mr-2 h-4 w-4 text-[#00FFAA]" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Prompt
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {currentStep === 'job' && jobDescription.trim() && resumeText.trim() && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <div className="inline-flex items-center space-x-2 bg-[#00FFAA]/10 border border-[#00FFAA]/30 rounded-full px-4 py-2">
                <div className="w-2 h-2 bg-[#00FFAA] rounded-full animate-pulse" />
                <span className="text-[#00FFAA] font-medium text-sm">Ready to optimize!</span>
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
