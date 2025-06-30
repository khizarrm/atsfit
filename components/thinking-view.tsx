"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { Brain } from "lucide-react"
import { fetchJobResearch, annotateResume, rewriteResume } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

interface ThinkingViewProps {
  onComplete: (result: string) => void
  jobDescription: string
}

export default function ThinkingView({ onComplete, jobDescription }: ThinkingViewProps) {
  const { resumeMd } = useAuth()
  const [currentText, setCurrentText] = useState("Starting analysis...")
  const [error, setError] = useState<string | null>(null)

  // Simple API execution with text updates
  useEffect(() => {
    const executeAPIs = async () => {
      if (!resumeMd) {
        setError("Resume not found. Please upload your resume first.")
        return
      }

      setError(null)
      
      try {
        // Step 1: Research (if job description contains URL) or use direct description
        let finalJobDescription = jobDescription
        if (jobDescription.includes("http")) {
          setCurrentText("Analyzing job description from URL...")
          const researchResult = await fetchJobResearch(jobDescription, resumeMd)
          finalJobDescription = researchResult
        }
        
        // Step 2: Annotate
        setCurrentText("Matching keywords and skills...")
        await annotateResume()
        
        // Step 3: Rewrite
        setCurrentText("Optimizing resume structure...")
        const rewriteResult = await rewriteResume()
        
        // Complete
        setCurrentText("Finalizing optimized resume...")
        setTimeout(() => {
          onComplete(rewriteResult.optimized_resume || rewriteResult)
        }, 500)
        
      } catch (error) {
        console.error("API Error:", error)
        setError(error instanceof Error ? error.message : "An error occurred during processing")
      }
    }

    executeAPIs()
  }, [jobDescription, resumeMd, onComplete])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex items-center justify-center min-h-screen p-8"
    >
      <div className="w-full max-w-2xl">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 shadow-2xl text-center">
          {/* Simple Brain Icon */}
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-[#00FFAA] to-[#00CC88] rounded-full flex items-center justify-center">
              <Brain className="w-10 h-10 text-black" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-8">AI Analysis in Progress</h2>

          {/* Error Display */}
          {error && (
            <div className="mb-8">
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <p className="text-red-400 text-center">{error}</p>
              </div>
            </div>
          )}

          {/* Simple Current Status */}
          {!error && (
            <div className="mb-8">
              <p className="text-xl text-[#00FFAA] font-mono">{currentText}</p>
            </div>
          )}

          {/* Simple Loading Indicator */}
          {!error && (
            <div className="flex justify-center">
              <div className="w-3 h-3 bg-[#00FFAA] rounded-full animate-pulse shadow-[0_0_10px_rgba(0,255,170,0.5)]"></div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
