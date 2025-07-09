"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect, Suspense, lazy } from "react"
import { Check, Copy, FileText, User } from "lucide-react"
import { useAuth } from "@/stores/hooks/useAuth"
import { saveUserResume, validateResumeContent } from "@/lib/database/resume-operations"
import { SharedHeader } from "@/components/shared-header"
import { useRouter } from "next/navigation"

// Lazy load BackgroundGlow for better performance
const BackgroundGlow = lazy(() => import('../BackgroundGlow'))

export default function ResumeSetupPage() {
  const router = useRouter()
  const { user, updateResumeCache } = useAuth()
  const [resumeContent, setResumeContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/login")
    }
  }, [user, router])

  const chatGPTPrompt = 
`Convert the following resume text exactly as written into Markdown format.

Instructions:

Do not rephrase, rewrite, or edit any content. Do not change the format of the writing. 

Use # (H1) only for my name at the top.

Use ### (H3) for section headings (like EXPERIENCE, EDUCATION, SKILLS, PROJECTS).

Use #### (H4) for company or project titles.

Keep bullet points, line breaks, and formatting exactly as in my input. Do not add bullet points for project/experience titles, only for detailed points regarding an experience or project. 

Bold small categories and project names, eg. Frameworks, Technologies. 

Italicize company names, but bold the names of positions. 

Underline quantifiable metrics. 

Format bullet points with a '-'

When returning, ensure you do not modify any content whatsoever. 

Do not add a newline for job titiles and company names: keep both on the same line, with title bolded and company name italicized.

When addings links, add them appropriately as follows [text](url)

Ensure all contact info text below the header is seperated with spaces using '$|$' in markdown
** NOTE: For contact info, ensure there are only 3 pieces. If more, remove the least relevant one. **

Only add urls where neccesary, never in random places

Output it as plain text so I can easily copy and paste it.

Resume follows below:
___________________________________________________________`

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(chatGPTPrompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy prompt:", error)
    }
  }

  const handleSave = async () => {
    if (!user) {
      setError("You must be logged in to save your resume")
      return
    }

    if (!resumeContent.trim()) {
      setError("Please enter your resume content or use the template")
      return
    }

    // Validate content
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
        // Instantly update the cached resume content for smooth UX
        updateResumeCache(resumeContent)
        // Navigate to dashboard - updateResumeCache already handles hasResume correctly
        router.push("/")
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
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-4xl"
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
                  <h2 className="text-4xl font-bold text-white">Welcome! Let's set up your resume</h2>
                </div>
                <p className="text-gray-300 text-xl mb-2">
                  Generate your resume with ChatGPT and get started with AI-powered optimization
                </p>
                <p className="text-gray-400 mb-3">I know I could've gotten ChatGPT to do this but this is cheaper and saves me work so bear with me.</p>
                <p className="text-gray-400">Copy the prompt below followed by your resume, paste it into ChatGPT, then paste the result here</p>
              </motion.div>
            </div>

            {/* Upload Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/3 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl space-y-6"
            >
              {/* Error Display */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* ChatGPT Prompt Card */}
              <div className="bg-white/5 border border-white/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-[#00FFAA] to-[#00DD99] rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">ChatGPT Resume Prompt</h3>
                      <p className="text-gray-400 text-sm">Copy this prompt and paste it into ChatGPT</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleCopyPrompt}
                    size="sm"
                    className="bg-gradient-to-r from-[#00FFAA] to-[#00DD99] hover:from-[#00DD99] hover:to-[#00FFAA] text-black font-semibold"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    {copied ? "Copied!" : "Copy Prompt"}
                  </Button>
                </div>
                
                <div className="bg-black/20 border border-white/10 rounded-lg p-4 font-mono text-sm text-gray-300 max-h-48 overflow-y-auto">
                  <pre className="whitespace-pre-wrap">{chatGPTPrompt}</pre>
                </div>
                
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-400 text-xs font-bold">!</span>
                    </div>
                    <div>
                      <h4 className="text-blue-400 font-medium text-sm mb-1">How to use:</h4>
                      <ol className="text-gray-400 text-sm space-y-1">
                        <li>1. Click "Copy Prompt" above</li>
                        <li>2. Go to ChatGPT and paste the prompt</li>
                        <li>3. Paste in your resume afterwards</li>
                        <li>4. Place the output below</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resume Content Area */}
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="space-y-3">
                  <label className="text-white font-medium flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-[#00FFAA]" />
                    <span>Paste ChatGPT's Markdown Response Here</span>
                  </label>
                  <Textarea
                    value={resumeContent}
                    onChange={(e) => setResumeContent(e.target.value)}
                    placeholder="Paste the markdown resume content from ChatGPT here..."
                    className="min-h-[400px] bg-white/5 border-white/20 text-white placeholder:text-gray-500 text-sm leading-relaxed resize-none focus:border-[#00FFAA] focus:ring-[#00FFAA] rounded-2xl"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={handleSave}
                    disabled={!resumeContent.trim() || isSaving}
                    className="flex-1 bg-gradient-to-r from-[#00FFAA] to-[#00DD99] hover:from-[#00DD99] hover:to-[#00FFAA] text-black font-bold px-6 py-3 text-lg rounded-xl hover:scale-105 transition-all duration-300 hover:shadow-[0_0_40px_rgba(0,255,170,0.4)] shadow-[0_0_20px_rgba(0,255,170,0.2)] disabled:opacity-50 disabled:hover:scale-100"
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

            </motion.div>

            {/* What's Next */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center mt-8"
            >
              <h4 className="text-white font-medium mb-4">What's next?</h4>
              <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-[#00FFAA]/20 rounded-full flex items-center justify-center text-[#00FFAA] text-xs font-bold">1</div>
                  <span>Set up your resume</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-[#00FFAA]/20 rounded-full flex items-center justify-center text-[#00FFAA] text-xs font-bold">2</div>
                  <span>Paste job descriptions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-[#00FFAA]/20 rounded-full flex items-center justify-center text-[#00FFAA] text-xs font-bold">3</div>
                  <span>Get optimized resumes</span>
                </div>
              </div>
            </motion.div>
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