"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { AlertCircle, CheckCircle } from "lucide-react"
import { SharedHeader } from "@/components/shared-header"
import { ProfileHeader } from "@/components/profile/ProfileHeader"
import { ResumeEditor } from "@/components/profile/ResumeEditor"
import { ResumePreview } from "@/components/profile/ResumePreview"
import { useResumeManager } from "@/hooks/useResumeManager"
import { useAuth } from "@/contexts/auth-context"

interface User {
  id: string
  email: string
  name: string
}

interface ProfileViewProps {
  onBack: () => void
  user: User | null
}

export function ProfileView({ onBack, user }: ProfileViewProps) {
  const { refreshResume } = useAuth()
  const [showPreview, setShowPreview] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Use the custom hook for resume management
  const [resumeState, resumeActions] = useResumeManager(user?.id || null)

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleSave = async () => {
    try {
      await resumeActions.saveResume()
      showMessage('success', 'Resume saved successfully!')
      
      // Refresh the resume in auth context so dashboard gets updated data
      await refreshResume()
    } catch (error) {
      // Error handling is managed by the hook
      console.error('Save operation failed:', error)
    }
  }

  const handleRetry = async () => {
    try {
      await resumeActions.retry()
    } catch (error) {
      console.error('Retry operation failed:', error)
    }
  }

  // Loading state
  if (resumeState.loadingState === 'loading') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center bg-black"
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="w-8 h-8 border-2 border-[#00FFAA] border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-400">Loading your resume...</p>
        </div>
      </motion.div>
    )
  }

  // Error state with retry option
  if (resumeState.loadingState === 'error' && !resumeState.content) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center bg-black"
      >
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Failed to Load Resume</h2>
          <p className="text-gray-400 mb-6">{resumeState.error}</p>
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full bg-gradient-to-r from-[#00FFAA] to-[#00DD99] hover:from-[#00DD99] hover:to-[#00FFAA] text-black font-semibold py-2 px-4 rounded-xl transition-all duration-300"
            >
              Try Again
            </button>
            <button
              onClick={onBack}
              className="w-full bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-xl transition-all duration-300"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="min-h-screen flex flex-col bg-black"
    >
      {/* Shared Header */}
      <SharedHeader
        onGoToProfile={() => {}} // Current page is profile
        onSignUp={() => {}}
        user={user}
      />

      {/* Main Content */}
      <div className="flex-1 p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-7xl mx-auto"
        >
          {/* Profile Header */}
          <ProfileHeader
            onBack={onBack}
            showPreview={showPreview}
            onTogglePreview={() => setShowPreview(!showPreview)}
            user={user}
          />

          {/* Global Message Display */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mb-6 p-4 rounded-xl flex items-center space-x-3 ${
                  message.type === 'success' 
                    ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">{message.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Editor Layout */}
          <div className={`grid gap-6 transition-all duration-300 ${
            showPreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
          }`}>
            {/* Resume Editor */}
            <ResumeEditor
              content={resumeState.content}
              loadingState={resumeState.loadingState}
              isDirty={resumeState.isDirty}
              lastSaved={resumeState.lastSaved}
              error={resumeState.error}
              retryCount={resumeState.retryCount}
              onContentChange={resumeActions.updateContent}
              onSave={handleSave}
              onRetry={handleRetry}
              onReset={resumeActions.resetToOriginal}
            />

            {/* Resume Preview */}
            <AnimatePresence>
              {showPreview && (
                <ResumePreview
                  content={resumeState.content}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}