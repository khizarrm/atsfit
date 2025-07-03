"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { X, Brain, Sparkles, Zap, CheckCircle, ArrowRight } from "lucide-react"
import { AtsScoreResponse } from "@/lib/api"

export interface ResultsData {
  resume: string
  initialScore: number
  finalScore: number
  missingKeywords: number
}

interface LoadingProgressProps {
  progress: number // 0-120 (extended for post-completion phase)
  currentStep: string
  onCancel: () => void
  
  // New props for post-completion phase
  optimizationComplete?: boolean
  resultsData?: ResultsData
  onResultsReady?: (data: ResultsData) => void // Called when ready to navigate
  error?: string | null
  
  // Existing props
  atsScoreData?: AtsScoreResponse | null
  atsLoading?: boolean
  annotationLoading?: boolean
}

export function LoadingProgress({ 
  progress, 
  currentStep, 
  onCancel, 
  optimizationComplete,
  resultsData,
  onResultsReady,
  error
}: LoadingProgressProps) {
  // Get appropriate icon and message based on progress
  const getStatusInfo = () => {
    if (progress < 50) {
      return {
        icon: Brain,
        phase: "Analyzing Resume",
        message: "AI is analyzing your resume and matching keywords..."
      }
    } else if (progress < 90) {
      return {
        icon: Sparkles,
        phase: "AI Optimization",
        message: "AI is optimizing your resume for maximum impact..."
      }
    } else if (progress < 100) {
      return {
        icon: Zap,
        phase: "Finalizing",
        message: "Calculating final scores and preparing results..."
      }
    } else if (progress < 120) {
      return {
        icon: CheckCircle,
        phase: "Preparing Results",
        message: "Preparing your optimized resume for display..."
      }
    } else {
      return {
        icon: ArrowRight,
        phase: "Ready!",
        message: "Taking you to your results..."
      }
    }
  }

  const { icon: CurrentIcon, phase, message } = getStatusInfo()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white/3 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl text-center max-w-2xl mx-auto"
    >
      {/* Icon */}
      <motion.div
        className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-[#00FFAA]/20 to-[#00DD99]/20 border-2 border-[#00FFAA]/50 rounded-2xl flex items-center justify-center"
        animate={{
          boxShadow: [
            "0 0 0px rgba(0,255,170,0)",
            "0 0 30px rgba(0,255,170,0.4)", 
            "0 0 0px rgba(0,255,170,0)"
          ]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <CurrentIcon className="w-8 h-8 text-[#00FFAA]" />
      </motion.div>
      
      {/* Phase Title */}
      <h2 className="text-3xl font-bold text-white mb-4">
        {phase}
      </h2>
      
      {/* Status Message */}
      <p className="text-gray-300 text-lg mb-6">
        {message}
      </p>
      
      {/* Current Step */}
      {currentStep && (
        <motion.p 
          key={currentStep}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[#00FFAA] text-sm font-medium mb-8"
        >
          {currentStep}
        </motion.p>
      )}

      {/* Progress Indicator */}
      <div className="mb-8">
        {progress >= 100 ? (
          // Post-completion progress bar
          <div className="w-full max-w-md mx-auto">
            <div className="mb-4 w-full bg-white/10 rounded-full h-2">
              <motion.div
                className="h-full bg-gradient-to-r from-[#00FFAA] to-[#00DD99] rounded-full"
                animate={{ width: `${Math.min(((progress - 100) / 20) * 100, 100)}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
              <span>{Math.round(progress)}% Complete</span>
            </div>
          </div>
        ) : (
          // Original animated dots for < 100%
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
        )}
      </div>

      {/* Error Handling */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
        >
          <p className="text-red-400 text-sm mb-3">{error}</p>
          <Button 
            onClick={onCancel}
            className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/50"
          >
            Try Again
          </Button>
        </motion.div>
      )}

      {/* Cancel Button - Hide after optimization complete unless there's an error */}
      {(!optimizationComplete || error) && (
        <Button
          onClick={onCancel}
          variant="outline"
          className="bg-white/5 border-white/20 text-gray-300 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all duration-300"
        >
          <X className="w-4 h-4 mr-2" />
          {progress >= 100 ? "Cancel" : "Cancel Optimization"}
        </Button>
      )}
    </motion.div>
  )
}