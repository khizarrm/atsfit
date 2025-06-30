"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Check, Shield, Zap, Clock, Code, Type } from "lucide-react"
import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

interface UploadViewProps {
  onTextSubmit: (text: string) => void
  onConfirm: () => void
  uploadedText: string | null
}

export function UploadView({ onTextSubmit, onConfirm, uploadedText }: UploadViewProps) {
  const [pastedText, setPastedText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const { user: authUser } = useAuth()

  const handleDevSkip = () => {
    const mockText = "# John Doe\n\n## Experience\n\n### Software Engineer | TechCorp\n- Built scalable web applications\n- Led team of 5 developers"
    setPastedText(mockText)
  }

  const handleTextSubmit = async () => {
    if (!pastedText.trim()) return
    
    setIsSubmitting(true)
    setError("")

    try {
      // Store resume in Supabase
      const { error } = await supabase
        .from('resumes')
        .insert({
          user_id: authUser?.id || null,
          resume_md: pastedText.trim()
        })
        .select()

      console.log("Resume texthandling")
      if (error) {
        setError("Failed to save resume. Please try again.")
        console.error("Supabase error:", error)
      } else {
        onTextSubmit(pastedText.trim())
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Error:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="min-h-screen flex flex-col"
    >
      {/* Dev Skip Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="absolute top-4 right-4 z-20"
      >
        <Button
          onClick={handleDevSkip}
          variant="outline"
          size="sm"
          className="bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white text-xs"
        >
          <Code className="mr-1 h-3 w-3" />
          Dev Skip
        </Button>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Upload Your Resume</h2>
            <p className="text-gray-300 text-xl mb-2">
              Let our AI analyze and optimize your resume for maximum ATS compatibility
            </p>
            <p className="text-gray-400 text-lg">Paste your resume in markdown format below</p>
          </motion.div>

          {/* Info Cards */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          >
            <div className="bg-white/3 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center">
              <Shield className="w-6 h-6 text-[#00FFAA] mb-2 mx-auto" />
              <h3 className="text-white font-medium text-sm mb-1">Secure & Private</h3>
              <p className="text-gray-400 text-xs">Your resume is processed securely and never stored</p>
            </div>

            <div className="bg-white/3 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center">
              <Clock className="w-6 h-6 text-[#00FFAA] mb-2 mx-auto" />
              <h3 className="text-white font-medium text-sm mb-1">Lightning Fast</h3>
              <p className="text-gray-400 text-xs">Analysis completed in under 30 seconds</p>
            </div>

            <div className="bg-white/3 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center">
              <Zap className="w-6 h-6 text-[#00FFAA] mb-2 mx-auto" />
              <h3 className="text-white font-medium text-sm mb-1">AI-Powered</h3>
              <p className="text-gray-400 text-xs">Advanced algorithms for optimal results</p>
            </div>
          </motion.div>

          {/* Upload Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white/3 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl"
          >
            {!uploadedText ? (
              <div className="space-y-6">
                <div className="text-center">
                  <Type className="mx-auto h-16 w-16 text-[#00FFAA] mb-6" />
                  <h3 className="text-xl font-semibold text-white mb-2">Paste your resume content</h3>
                  <p className="text-gray-400 mb-6">Copy and paste your resume text in markdown format</p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}
                
                <Textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="# Your Name

## Experience

### Software Engineer | Company Name
- Achievement 1
- Achievement 2

## Education

### Degree | University Name

## Skills

- Skill 1
- Skill 2"
                  className="min-h-[300px] bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-[#00FFAA] focus:ring-[#00FFAA] resize-none"
                />
                
                <Button
                  onClick={handleTextSubmit}
                  disabled={!pastedText.trim() || isSubmitting}
                  className="w-full bg-gradient-to-r from-[#00FFAA] to-[#00DD99] hover:from-[#00DD99] hover:to-[#00FFAA] text-black font-semibold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="w-4 h-4 border-2 border-black border-t-transparent rounded-full mr-2"
                    />
                  ) : (
                    <Check className="mr-2 h-5 w-5" />
                  )}
                  {isSubmitting ? "Saving Resume..." : "Save & Continue"}
                </Button>

                {/* Paste Tips */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <h4 className="text-white font-medium mb-3">✨ Markdown Format Tips:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-400">
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-[#00FFAA] rounded-full mt-2 flex-shrink-0"></div>
                      <span># for main headings (name, sections)</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-[#00FFAA] rounded-full mt-2 flex-shrink-0"></div>
                      <span>## for section headers</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-[#00FFAA] rounded-full mt-2 flex-shrink-0"></div>
                      <span>### for job titles and roles</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-[#00FFAA] rounded-full mt-2 flex-shrink-0"></div>
                      <span>- for bullet points and lists</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <div className="bg-[#00FFAA]/10 border border-[#00FFAA]/30 rounded-2xl p-6 mb-6">
                  <Type className="mx-auto h-12 w-12 text-[#00FFAA] mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Resume Saved Successfully</h3>
                  <p className="text-gray-400 mb-4">{uploadedText?.length} characters • Stored in Database</p>

                  {/* Status */}
                  <div className="flex items-center justify-center space-x-2 text-sm text-[#00FFAA]">
                    <Check className="w-4 h-4" />
                    <span>Ready for optimization</span>
                  </div>
                </div>

                <Button
                  onClick={onConfirm}
                  className="bg-gradient-to-r from-[#00FFAA] to-[#00DD99] hover:from-[#00DD99] hover:to-[#00FFAA] text-black font-semibold px-8 py-3 rounded-xl hover:scale-105 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,170,0.3)]"
                >
                  <Check className="mr-2 h-5 w-5" />
                  Continue to Job Description
                </Button>

                <p className="text-gray-400 text-sm mt-4">Next: Paste the job description you're targeting</p>
              </motion.div>
            )}
          </motion.div>

          {/* What Happens Next */}
          {!uploadedText && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center mt-8"
            >
              <h4 className="text-white font-medium mb-4">🚀 What happens after upload?</h4>
              <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-[#00FFAA]/20 rounded-full flex items-center justify-center text-[#00FFAA] text-xs font-bold">
                    1
                  </div>
                  <span>Paste your current resume</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-[#00FFAA]/20 rounded-full flex items-center justify-center text-[#00FFAA] text-xs font-bold">
                    2
                  </div>
                  <span>Paste target job description</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-[#00FFAA]/20 rounded-full flex items-center justify-center text-[#00FFAA] text-xs font-bold">
                    3
                  </div>
                  <span>Get optimized resume instantly</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
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
