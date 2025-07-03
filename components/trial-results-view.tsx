"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Crown, Copy, Check, AlertTriangle, Sparkles, Download, Share, ExternalLink } from "lucide-react"
import { useState } from "react"
import { useTrial } from "@/contexts/trial-context"

interface TrialResultsViewProps {
  optimizedResume: string
  onBack: () => void
  onSignUp: () => void
  initialAtsScore?: number
  finalAtsScore?: number
  missingKeywordsCount?: number
}

export function TrialResultsView({
  optimizedResume,
  onBack,
  onSignUp,
  initialAtsScore = 0,
  finalAtsScore = 0,
  missingKeywordsCount = 0
}: TrialResultsViewProps) {
  const [copiedResume, setCopiedResume] = useState(false)
  const { attemptsRemaining, getAttemptDisplayText, hasAttemptsRemaining } = useTrial()

  const copyResumeToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(optimizedResume)
      setCopiedResume(true)
      setTimeout(() => setCopiedResume(false), 2000)
    } catch (err) {
      console.error('Failed to copy resume:', err)
    }
  }

  const scoreImprovement = finalAtsScore - initialAtsScore
  const improvementPercentage = initialAtsScore > 0 ? ((scoreImprovement / initialAtsScore) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="min-h-screen flex flex-col"
    >
      {/* Header */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between p-6 bg-white/3 backdrop-blur-xl border-b border-white/5"
      >
        <div className="flex items-center w-48">
          <Button onClick={onBack} variant="ghost" className="text-white hover:bg-white/10">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Try It
          </Button>
        </div>
        
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#00FFAA] to-[#00CC88] bg-clip-text text-transparent">
          ATSFit
        </h1>
        
        <div className="flex items-center space-x-3 w-48 justify-end">
          {/* Trial Status */}
          <div className="flex items-center space-x-2 bg-white/10 border border-white/20 rounded-xl px-3 py-2">
            <span className="text-white text-sm font-medium">{getAttemptDisplayText()}</span>
          </div>
          
          <Button
            onClick={onSignUp}
            className="bg-gradient-to-r from-[#00FFAA] to-[#00DD99] hover:from-[#00DD99] hover:to-[#00FFAA] text-black font-semibold px-4 py-2 text-sm rounded-xl transition-all duration-300 hover:scale-105"
          >
            <Crown className="mr-1 h-4 w-4" />
            Upgrade to Pro
          </Button>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Results Header */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-8"
          >
            <h2 className="text-4xl font-bold text-white mb-4">🎉 Optimization Complete!</h2>
            <p className="text-gray-300 text-xl">
              Your resume has been optimized for better ATS compatibility
            </p>
          </motion.div>

          {/* ATS Score Improvement */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            {/* Initial Score */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
              <div className="text-gray-400 text-sm mb-2">Initial ATS Score</div>
              <div className="text-3xl font-bold text-white">{initialAtsScore}%</div>
            </div>

            {/* Improvement Arrow */}
            <div className="flex items-center justify-center">
              <div className="bg-gradient-to-r from-[#00FFAA] to-[#00DD99] rounded-xl p-4">
                <div className="text-black text-center">
                  <div className="text-sm font-medium">Improved by</div>
                  <div className="text-2xl font-bold">+{scoreImprovement}%</div>
                </div>
              </div>
            </div>

            {/* Final Score */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
              <div className="text-gray-400 text-sm mb-2">Final ATS Score</div>
              <div className="text-3xl font-bold text-[#00FFAA]">{finalAtsScore}%</div>
            </div>
          </motion.div>

          {/* Resume Display */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white/3 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Your Optimized Resume</h3>
              <Button
                onClick={copyResumeToClipboard}
                variant="outline"
                className="bg-white/5 border-white/20 text-white hover:bg-white/10"
              >
                {copiedResume ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-[#00FFAA]" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Resume
                  </>
                )}
              </Button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 max-h-96 overflow-y-auto">
              <pre className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                {optimizedResume}
              </pre>
            </div>
          </motion.div>

          {/* Trial Limitations Notice */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-6 mb-8"
          >
            <div className="flex items-start space-x-4">
              <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h4 className="text-amber-300 font-semibold mb-2">Trial Version Limitations</h4>
                <ul className="text-amber-200 text-sm space-y-1">
                  <li>• No save/export options</li>
                  <li>• No revision history</li>
                  <li>• No advanced customization features</li>
                  <li>• Limited to {hasAttemptsRemaining ? attemptsRemaining : 0} more attempts</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Upgrade CTA */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="bg-gradient-to-r from-[#00FFAA]/10 to-[#00DD99]/10 border border-[#00FFAA]/30 rounded-3xl p-8 text-center"
          >
            <Sparkles className="w-12 h-12 text-[#00FFAA] mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-4">Get Full Access</h3>
            <p className="text-gray-300 text-lg mb-6">
              Unlock unlimited optimizations, save/export features, and advanced customization
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-[#00FFAA] font-semibold mb-2">Unlimited Optimizations</div>
                <div className="text-gray-400 text-sm">No more attempt limits</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-[#00FFAA] font-semibold mb-2">Save & Export</div>
                <div className="text-gray-400 text-sm">PDF export, revision history</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-[#00FFAA] font-semibold mb-2">Advanced Features</div>
                <div className="text-gray-400 text-sm">Custom templates, analytics</div>
              </div>
            </div>

            <Button
              onClick={onSignUp}
              className="bg-gradient-to-r from-[#00FFAA] to-[#00DD99] hover:from-[#00DD99] hover:to-[#00FFAA] text-black font-bold px-8 py-4 text-lg rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(0,255,170,0.4)]"
            >
              <Crown className="mr-2 h-5 w-5" />
              Create Free Account
            </Button>
            
            <p className="text-gray-400 text-sm mt-4">
              No credit card required • Takes 30 seconds
            </p>
          </motion.div>

          {/* Continue Trial Button */}
          {hasAttemptsRemaining && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center mt-6"
            >
              <Button
                onClick={onBack}
                variant="outline"
                className="bg-white/5 border-white/20 text-white hover:bg-white/10"
              >
                Continue Trial ({attemptsRemaining} attempts left)
              </Button>
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