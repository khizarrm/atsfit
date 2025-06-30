"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { AtsScoreResponse } from "@/lib/api"

interface LoadingProgressProps {
  progress: number // 0-100
  currentStep: string
  onCancel: () => void
  atsScoreData?: AtsScoreResponse | null
  atsLoading?: boolean
  annotationLoading?: boolean
}

export function LoadingProgress({ progress, currentStep, onCancel, atsScoreData, atsLoading = false, annotationLoading = false }: LoadingProgressProps) {
  console.log('LoadingProgress atsScoreData:', atsScoreData)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white/3 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl text-center"
    >
        
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">AI Optimization in Progress</h2>
          <p className="text-gray-300 text-lg">{currentStep}</p>
        </div>


        {/* Progress Bar Container */}
        <div className="mb-8">
          <div className="relative w-full h-4 bg-white/10 rounded-full overflow-hidden border border-white/20">
            
            {/* Progress Bar Background with Glow */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-[#00FFAA] to-[#00CC88] rounded-full"
              style={{
                background: `linear-gradient(90deg, 
                  rgba(0,255,170,0.8) 0%, 
                  rgba(0,255,170,0.9) 50%, 
                  rgba(0,204,136,0.8) 100%)`
              }}
              initial={{ width: "0%" }}
              animate={{ 
                width: `${progress}%`,
                boxShadow: [
                  "0 0 20px rgba(0,255,170,0.3)",
                  "0 0 30px rgba(0,255,170,0.5)",
                  "0 0 20px rgba(0,255,170,0.3)"
                ]
              }}
              transition={{ 
                width: { duration: 0.8, ease: "easeOut" },
                boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
            />

            {/* Moving White Light */}
            <motion.div
              className="absolute top-0 h-full w-12 opacity-80"
              style={{
                background: `linear-gradient(90deg, 
                  transparent 0%, 
                  rgba(255,255,255,0.3) 20%, 
                  rgba(255,255,255,0.8) 40%, 
                  rgba(255,255,255,1) 50%, 
                  rgba(255,255,255,0.8) 60%, 
                  rgba(255,255,255,0.3) 80%, 
                  transparent 100%)`,
                filter: 'blur(1px)'
              }}
              animate={{
                x: progress > 5 ? [`-48px`, `calc(${progress}% - 24px)`] : `-48px`,
                opacity: progress > 5 ? [0.6, 1, 0.6] : 0
              }}
              transition={{
                x: { 
                  duration: Math.max(0.8, 2.5 - (progress / 40)), // Speed increases significantly near completion
                  ease: "easeInOut"
                },
                opacity: { 
                  duration: 1.2, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }
              }}
            />

            {/* Additional Glow Effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-[#00FFAA] to-[#00CC88] rounded-full opacity-30 blur-md"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>

          {/* Progress Percentage */}
          <div className="mt-4">
            <motion.span 
              className="text-[#00FFAA] font-mono text-lg font-semibold"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              {Math.round(progress)}%
            </motion.span>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="mb-8">
          <div className="flex justify-center items-center space-x-4 text-sm">
            <StepIndicator 
              label="Analyze" 
              isActive={progress >= 0 && progress < 50} 
              isComplete={progress >= 50} 
            />
            <div className="w-8 h-px bg-white/20"></div>
            <StepIndicator 
              label="Optimize" 
              isActive={progress >= 50 && progress < 100} 
              isComplete={progress >= 100} 
            />
          </div>
        </div>

        {/* Cancel Button */}
        <Button
          onClick={onCancel}
          variant="outline"
          className="bg-white/5 border-white/20 text-gray-300 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all duration-300"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel Optimization
        </Button>
    </motion.div>
  )
}

interface StepIndicatorProps {
  label: string
  isActive: boolean
  isComplete: boolean
}

function StepIndicator({ label, isActive, isComplete }: StepIndicatorProps) {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mb-2 ${
          isComplete 
            ? "bg-[#00FFAA] border-[#00FFAA] text-black" 
            : isActive 
            ? "border-[#00FFAA] text-[#00FFAA]" 
            : "border-white/20 text-white/40"
        }`}
        animate={isActive ? {
          boxShadow: [
            "0 0 0 rgba(0,255,170,0)",
            "0 0 10px rgba(0,255,170,0.5)",
            "0 0 0 rgba(0,255,170,0)"
          ]
        } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {isComplete ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-2 h-2 bg-black rounded-full"
          />
        ) : (
          <motion.div
            className="w-2 h-2 bg-current rounded-full"
            animate={isActive ? { scale: [0.8, 1.2, 0.8] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </motion.div>
      <span className={`text-xs ${
        isComplete 
          ? "text-[#00FFAA]" 
          : isActive 
          ? "text-[#00FFAA]" 
          : "text-white/40"
      }`}>
        {label}
      </span>
    </div>
  )
}