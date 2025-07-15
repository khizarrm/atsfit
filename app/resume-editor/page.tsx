"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect, useMemo, Suspense, lazy } from "react"
import { Check, Edit, Eye, User, Info } from "lucide-react"
import { useAuth, getCachedUserData } from "@/contexts/auth-context"
import { saveUserResume } from "@/lib/database/resume-operations"
import { validateResumeContent } from "@/lib/database/resume-operations"
import { SharedHeader } from "@/components/shared-header"
import { useRouter } from "next/navigation"
import { renderMarkdownPreview } from "@/lib/utils/preview-renderer"

const BackgroundGlow = lazy(() => import('@/components/BackgroundGlow'))

export default function ResumeEditorPage() {
  const router = useRouter()
  const { user, resumeMd, cacheUserData } = useAuth()
  const [resumeContent, setResumeContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  const renderedMarkdown = useMemo(() => renderMarkdownPreview(resumeContent), [resumeContent])

  useEffect(() => {
    const cachedData = getCachedUserData()
    if (cachedData && cachedData.user) {
      console.log("📦 Resume editor: Using cached user data")
      if (cachedData.resumeMd) {
        setResumeContent(cachedData.resumeMd)
      }
      return
    }

    if (user) {
      console.log("🔄 Resume editor: Using auth context user")
      if (resumeMd) {
        setResumeContent(resumeMd)
      }
      return
    }

    console.log("🚫 Resume editor: No user found, redirecting to login")
    router.push("/login")
  }, [user, resumeMd, router])

  const handleSave = async () => {
    if (!user) {
      setError("You must be logged in to save your resume")
      return
    }

    if (!resumeContent.trim()) {
      setError("Please enter your resume content")
      return
    }

    const validation = validateResumeContent(resumeContent)
    if (!validation.valid) {
      setError(validation.error || "Invalid resume content")
      return
    }

    try {
      setIsSaving(true)
      setError("")

      const result = await saveUserResume(user.id, resumeContent)
      
      if (result.success) {
        // Cache user and resume together in one operation
        cacheUserData(user, resumeContent)
        router.push("/dashboard")
      } else {
        setError(result.error || "Failed to save resume")
      }
    } catch (error) {
      console.error("Error saving resume:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Simple fallback background while BackgroundGlow loads
   */
  function BackgroundFallback() {
    return (
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Static central radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,170,0.15)_0%,rgba(0,255,170,0.08)_25%,rgba(0,255,170,0.03)_50%,transparent_70%)]" />
      </div>
    )
  }

  // Show loading if user is not loaded yet
  if (!user) {
    return (
      <div className="min-h-screen bg-black relative text-white flex items-center justify-center">
        <Suspense fallback={<BackgroundFallback />}>
          <BackgroundGlow />
        </Suspense>
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="w-6 h-6 border-2 border-[#00FFAA] border-t-transparent rounded-full mx-auto mb-3"
          />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative text-white">
      <Suspense fallback={<BackgroundFallback />}>
        <BackgroundGlow />
      </Suspense>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="min-h-screen flex flex-col"
      >
        <SharedHeader
          onGoToProfile={() => router.push("/profile")}
          onSignUp={() => router.push("/login")}
          user={user}
        />

        {/* Main Content */}
        <div className="flex-1 p-8 flex flex-col">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-7xl mx-auto flex-1 flex flex-col"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-center mb-4">
                  <User className="w-8 h-8 text-[#00FFAA] mr-3" />
                  <h2 className="text-4xl font-bold text-white">Edit Your Resume</h2>
                </div>
                <p className="text-gray-300 text-xl mb-2">
                  Fine-tune your resume with live preview
                </p>
                <div className="flex items-center justify-center space-x-2 text-blue-400">
                  <Info className="w-4 h-4" />
                  <p className="text-sm">This is most used for computer science resumes</p>
                </div>
              </motion.div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-6 max-w-7xl mx-auto">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Editor and Preview - Flexible height */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/3 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl flex-1 flex flex-col"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
                {/* Left: Editor */}
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2 mb-4">
                    <Edit className="w-5 h-5 text-[#00FFAA]" />
                    <h3 className="text-white font-semibold text-lg">Edit Resume (Markdown)</h3>
                  </div>
                  <div className="flex-1 min-h-0">
                    <Textarea
                      value={resumeContent}
                      onChange={(e) => setResumeContent(e.target.value)}
                      placeholder="Your resume content will appear here..."
                      className="h-full bg-white/5 border-white/20 text-white placeholder:text-gray-500 text-sm leading-relaxed resize-none focus:border-[#00FFAA] focus:ring-[#00FFAA] rounded-2xl font-mono"
                    />
                  </div>
                </div>

                {/* Right: Preview */}
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2 mb-4">
                    <Eye className="w-5 h-5 text-[#00FFAA]" />
                    <h3 className="text-white font-semibold text-lg">Preview</h3>
                  </div>
                  <div className="flex-1 min-h-0 bg-white/5 border border-white/20 rounded-2xl p-6 overflow-y-auto">
                    <div 
                      className="bg-white rounded-xl p-4 h-full overflow-auto"
                      style={{ 
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        fontSize: '14px',
                        lineHeight: '1.2',
                        color: '#111'
                      }}
                      dangerouslySetInnerHTML={{
                        __html: renderedMarkdown
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Save Button */}
            <div className="mt-8 flex justify-center">
              <Button
                onClick={handleSave}
                disabled={!resumeContent.trim() || isSaving}
                className="bg-gradient-to-r from-[#00FFAA] to-[#00DD99] hover:from-[#00DD99] hover:to-[#00FFAA] text-black font-bold px-8 py-3 text-lg rounded-xl hover:scale-105 transition-all duration-300 hover:shadow-[0_0_40px_rgba(0,255,170,0.4)] shadow-[0_0_20px_rgba(0,255,170,0.2)] disabled:opacity-50 disabled:hover:scale-100"
              >
                {isSaving ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="w-5 h-5 border-2 border-black border-t-transparent rounded-full mr-2"
                  />
                ) : (
                  <Check className="mr-2 h-5 w-5" />
                )}
                {isSaving ? "Saving..." : "Save & Continue"}
              </Button>
            </div>
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
    </div>
  )
}