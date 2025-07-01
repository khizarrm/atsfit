"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { X, Brain, Sparkles, Zap } from "lucide-react"
import { AtsScoreResponse } from "@/lib/api"
import { useState, useEffect, useRef } from "react"

interface LoadingProgressProps {
  progress: number // 0-100 (actual progress from API calls)
  currentStep: string
  onCancel: () => void
  atsScoreData?: AtsScoreResponse | null
  atsLoading?: boolean
  annotationLoading?: boolean
}

export function LoadingProgress({ progress, currentStep, onCancel }: LoadingProgressProps) {
  // Smooth display progress that animates toward actual progress
  const [displayProgress, setDisplayProgress] = useState(0)
  const [currentPhase, setCurrentPhase] = useState(0)
  const animationRef = useRef<number | null>(null)
  const lastProgressRef = useRef(0)

  // Define phases based on actual API progress checkpoints
  const phases = [
    {
      name: "Analyzing Resume",
      description: "Understanding your resume structure and matching keywords",
      icon: Brain,
      progressRange: [0, 50], // 0% → 50% (covers annotateResume call)
      subSteps: [
        "Parsing resume content...",
        "Identifying key sections...", 
        "Analyzing current keywords...",
        "Mapping job requirements...",
        "Processing with AI..."
      ]
    },
    {
      name: "AI Optimization", 
      description: "Intelligently rewriting your resume for maximum impact",
      icon: Sparkles,
      progressRange: [50, 90], // 50% → 90% (covers rewriteResume call)
      subSteps: [
        "Generating optimization strategy...",
        "Enhancing bullet points...",
        "Improving keyword placement...",
        "Restructuring content...",
        "Applying ATS best practices...",
        "Finalizing optimizations..."
      ]
    },
    {
      name: "Finalizing",
      description: "Calculating final scores and preparing results", 
      icon: Zap,
      progressRange: [90, 100], // 90% → 100% (covers final ATS calculation)
      subSteps: [
        "Calculating final ATS score...",
        "Quality assurance check...",
        "Preparing optimized resume..."
      ]
    }
  ]

  // Determine current phase based on actual progress
  useEffect(() => {
    let newPhase = 0
    for (let i = 0; i < phases.length; i++) {
      const [start, end] = phases[i].progressRange
      if (progress >= start && progress < end) {
        newPhase = i
        break
      } else if (progress >= end) {
        newPhase = Math.min(i + 1, phases.length - 1)
      }
    }
    setCurrentPhase(newPhase)
  }, [progress])

  // Smooth animation toward actual progress
  useEffect(() => {
    const animateProgress = () => {
      setDisplayProgress(current => {
        const diff = progress - current
        
        // If we're close enough or going backwards, snap to target
        if (Math.abs(diff) < 0.5 || progress < current) {
          return progress
        }
        
        // Smooth interpolation - faster when far, slower when close
        const speed = Math.max(0.3, Math.abs(diff) * 0.02)
        const newProgress = current + (diff > 0 ? speed : -speed)
        
        // Continue animation if not close enough
        if (Math.abs(progress - newProgress) > 0.5) {
          animationRef.current = requestAnimationFrame(animateProgress)
        }
        
        return newProgress
      })
    }

    // Start animation if progress changed significantly
    if (Math.abs(progress - lastProgressRef.current) > 0.5) {
      lastProgressRef.current = progress
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      animationRef.current = requestAnimationFrame(animateProgress)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [progress])

  // Get current sub-step based on progress within current phase
  const getCurrentSubStep = () => {
    const phase = phases[currentPhase]
    if (!phase) return ""
    
    const [start, end] = phase.progressRange
    const phaseProgress = Math.max(0, Math.min(1, (displayProgress - start) / (end - start)))
    const subStepIndex = Math.floor(phaseProgress * phase.subSteps.length)
    return phase.subSteps[Math.min(subStepIndex, phase.subSteps.length - 1)]
  }

  const currentPhaseData = phases[currentPhase]
  const CurrentIcon = currentPhaseData?.icon || Brain

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white/3 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl text-center max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="mb-8">
        <motion.div
          className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#00FFAA]/20 to-[#00DD99]/20 border-2 border-[#00FFAA]/50 rounded-2xl flex items-center justify-center"
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
        
        <h2 className="text-3xl font-bold text-white mb-2">
          {currentPhaseData?.name || "AI Optimization"}
        </h2>
        <p className="text-gray-300 text-lg mb-4">
          {currentPhaseData?.description || "Processing your resume..."}
        </p>
        
        {/* Current sub-step with smooth transitions */}
        <motion.p 
          key={getCurrentSubStep()}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[#00FFAA] text-sm font-medium h-5"
        >
          {getCurrentSubStep()}
        </motion.p>
      </div>

      {/* Main Progress Bar */}
      <div className="mb-8">
        <div className="relative w-full h-6 bg-white/10 rounded-full overflow-hidden border border-white/20 mb-4">
          {/* Animated Progress Fill */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-[#00FFAA] to-[#00DD99] rounded-full"
            animate={{ 
              width: `${displayProgress}%`,
              boxShadow: [
                "0 0 15px rgba(0,255,170,0.3)",
                "0 0 25px rgba(0,255,170,0.5)", 
                "0 0 15px rgba(0,255,170,0.3)"
              ]
            }}
            transition={{ 
              width: { duration: 0.3, ease: "easeOut" },
              boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          />

          {/* Shimmer Effect */}
          <motion.div
            className="absolute top-0 h-full w-20 opacity-60"
            style={{
              background: `linear-gradient(90deg, 
                transparent 0%, 
                rgba(255,255,255,0.2) 20%, 
                rgba(255,255,255,0.6) 40%, 
                rgba(255,255,255,0.8) 50%, 
                rgba(255,255,255,0.6) 60%, 
                rgba(255,255,255,0.2) 80%, 
                transparent 100%)`,
              filter: 'blur(0.5px)'
            }}
            animate={{
              x: displayProgress > 5 ? [`-80px`, `calc(${displayProgress}% - 40px)`] : `-80px`,
              opacity: displayProgress > 5 ? [0.4, 0.8, 0.4] : 0
            }}
            transition={{
              x: { 
                duration: 1.5,
                ease: "easeInOut",
                repeat: Infinity
              },
              opacity: { 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }
            }}
          />

          {/* Progress Glow */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-[#00FFAA] to-[#00DD99] rounded-full opacity-20 blur-sm"
            animate={{ width: `${displayProgress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>

        {/* Progress Percentage */}
        <motion.div 
          className="flex items-center justify-center space-x-4"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-[#00FFAA] font-mono text-2xl font-bold">
            {Math.round(displayProgress)}%
          </span>
          <div className="text-gray-400 text-sm">
            {currentStep || (displayProgress < 50 ? "Analyzing..." : 
             displayProgress < 90 ? "Optimizing..." : 
             displayProgress < 100 ? "Finalizing..." : "Complete!")}
          </div>
        </motion.div>
      </div>

      {/* Phase Progress Indicators */}
      <div className="mb-8">
        <div className="flex justify-center items-center space-x-8">
          {phases.map((phase, index) => {
            const PhaseIcon = phase.icon
            const [start, end] = phase.progressRange
            const isActive = index === currentPhase
            const isComplete = displayProgress >= end
            
            return (
              <div key={index} className="flex flex-col items-center">
                <motion.div
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center mb-2 relative ${
                    isComplete 
                      ? "bg-[#00FFAA] border-[#00FFAA] text-black" 
                      : isActive 
                        ? "border-[#00FFAA] text-[#00FFAA] bg-[#00FFAA]/10" 
                        : "border-white/20 text-white/40 bg-white/5"
                  }`}
                  animate={isActive ? {
                    boxShadow: [
                      "0 0 0 rgba(0,255,170,0)",
                      "0 0 20px rgba(0,255,170,0.4)",
                      "0 0 0 rgba(0,255,170,0)"
                    ]
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <PhaseIcon className="w-5 h-5" />
                  
                  {/* Active phase progress ring */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 border-2 border-[#00FFAA]/30 rounded-full"
                      animate={{ 
                        scale: [1, 1.15, 1],
                        opacity: [0.6, 0.2, 0.6]
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                </motion.div>
                
                <span className={`text-xs font-medium ${
                  isComplete 
                    ? "text-[#00FFAA]" 
                    : isActive 
                      ? "text-[#00FFAA]" 
                      : "text-white/40"
                }`}>
                  {phase.name.split(' ')[0]}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Current Status */}
      <div className="mb-6">
        <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
          <motion.div 
            className="w-2 h-2 bg-[#00FFAA] rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="text-gray-300 text-sm">
            {displayProgress < 20 ? "Starting analysis..." :
             displayProgress < 50 ? "AI is analyzing your resume..." :
             displayProgress < 70 ? "Analysis complete, starting optimization..." :
             displayProgress < 90 ? "AI is optimizing your resume..." :
             displayProgress < 100 ? "Calculating final scores..." : "Optimization complete!"}
          </span>
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