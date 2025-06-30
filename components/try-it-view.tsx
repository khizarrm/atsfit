"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { Send, Upload, FileText, Check, ArrowLeft, Code, Crown } from "lucide-react"

interface TryItViewProps {
  onJobSubmit: (description: string) => void
  onBack: () => void
  onSignUp: () => void
  isTrialMode: boolean
}

export function TryItView({ onJobSubmit, onBack, onSignUp, isTrialMode }: TryItViewProps) {
  const [jobDescription, setJobDescription] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === "application/pdf") {
      setUploadedFile(file)
    }
  }

  const handleDevSkip = () => {
    const mockFile = new File(["mock resume content"], "test-resume.pdf", {
      type: "application/pdf",
    })
    setUploadedFile(mockFile)
  }

  const handleSubmit = async () => {
    if (!jobDescription.trim() || !uploadedFile) return

    setIsSubmitting(true)
    setTimeout(() => {
      onJobSubmit(jobDescription)
    }, 500)
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
        <Button onClick={onBack} variant="ghost" className="text-white hover:bg-white/10">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#00FFAA] to-[#00CC88] bg-clip-text text-transparent">
          ATSFit
        </h1>
        <div className="flex items-center space-x-2">
          <Button
            onClick={onSignUp}
            className="bg-gradient-to-r from-[#00FFAA] to-[#00DD99] hover:from-[#00DD99] hover:to-[#00FFAA] text-black font-semibold px-4 py-2 text-sm rounded-xl transition-all duration-300 hover:scale-105"
          >
            <Crown className="mr-1 h-4 w-4" />
            Sign Up
          </Button>
          <Button
            onClick={handleDevSkip}
            variant="outline"
            size="sm"
            className="bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white text-xs"
          >
            <Code className="mr-1 h-3 w-3" />
            Dev Skip
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
              Paste a job description and upload your resume to see the magic happen
            </p>
            {isTrialMode && (
              <div className="mt-4 inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <span className="text-amber-400 font-medium text-sm">Trial Mode - Limited Features</span>
              </div>
            )}
          </div>

          {/* Job Description Card */}
          <div className="bg-white/3 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Step 1: Job Description</h3>
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

          {/* Resume Upload Card */}
          <div className="bg-white/3 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Step 2: Upload Resume</h3>
              <p className="text-gray-400">Upload your current resume (PDF format)</p>
            </div>

            {!uploadedFile ? (
              <div className="border-2 border-dashed border-white/20 hover:border-[#00FFAA]/50 rounded-2xl p-8 text-center transition-all duration-300">
                <Upload className="mx-auto h-12 w-12 text-[#00FFAA] mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">Drop your PDF here</h4>
                <p className="text-gray-400 mb-4">or click to browse files</p>
                <input type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" id="file-upload" />
                <label htmlFor="file-upload">
                  <Button className="bg-gradient-to-r from-[#00FFAA] to-[#00DD99] hover:from-[#00DD99] hover:to-[#00FFAA] text-black font-semibold px-6 py-3 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105">
                    Choose File
                  </Button>
                </label>
              </div>
            ) : (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#00FFAA]/10 border border-[#00FFAA]/30 rounded-2xl p-6"
              >
                <div className="flex items-center space-x-4">
                  <FileText className="h-8 w-8 text-[#00FFAA] flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-white font-semibold">{uploadedFile.name}</h4>
                    <p className="text-gray-400 text-sm">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • PDF Document
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-[#00FFAA]">
                    <Check className="w-4 h-4" />
                    <span>Ready</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleSubmit}
              disabled={!jobDescription.trim() || !uploadedFile || isSubmitting}
              className="bg-gradient-to-r from-[#00FFAA] to-[#00DD99] hover:from-[#00DD99] hover:to-[#00FFAA] text-black font-bold px-12 py-4 text-lg rounded-xl hover:scale-105 transition-all duration-300 hover:shadow-[0_0_40px_rgba(0,255,170,0.4)] shadow-[0_0_20px_rgba(0,255,170,0.2)] disabled:opacity-50 disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="w-5 h-5 border-2 border-black border-t-transparent rounded-full mr-2"
                />
              ) : (
                <Send className="mr-2 h-5 w-5" />
              )}
              {isSubmitting ? "Optimizing..." : "Optimize My Resume"}
            </Button>
          </div>

          {jobDescription.trim() && uploadedFile && (
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
