"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect, Suspense, lazy } from "react"
import { Check, Upload, FileText, User, File } from "lucide-react"
import { useAuth, getCachedUserData } from "@/contexts/auth-context"
import { saveUserResume, validateResumeContent } from "@/lib/database/resume-operations"
import { SharedHeader } from "@/components/shared-header"
import { useRouter } from "next/navigation"
import { convertResumeToMarkdown } from "@/lib/api"
// PDF.js will be imported dynamically to avoid SSR issues

const BackgroundGlow = lazy(() => import('@/components/BackgroundGlow'))


export default function ResumeSetupPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [resumeContent, setResumeContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [isExtracting, setIsExtracting] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [rawText, setRawText] = useState("")

  // Check authentication with localStorage-first approach
  useEffect(() => {
    // First: Check localStorage for instant auth verification
    const cachedData = getCachedUserData()
    if (cachedData && cachedData.user) {
      console.log("📦 Resume setup: Using cached user data")
      return // User is authenticated via cache
    }

    // Fallback: Use auth context
    if (user) {
      console.log("🔄 Resume setup: Using auth context user")
      return // User is authenticated via auth context
    }

    // No user found - redirect to login
    console.log("🚫 Resume setup: No user found, redirecting to login")
    router.push("/login")
  }, [user, router])

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      // Dynamically import PDF.js only when needed (client-side)
      const pdfjsLib = await import('pdfjs-dist')
      
      // Try local worker first, fallback to disabling worker if it fails
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
      } catch (workerError) {
        console.warn('Worker setup failed, falling back to main thread:', workerError)
        // Disable worker as fallback (will be slower but should work)
        pdfjsLib.GlobalWorkerOptions.workerSrc = ''
      }
      
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      let fullText = ''

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        const pageText = textContent.items
          .filter((item): item is any => 'str' in item)
          .map(item => item.str)
          .join(' ')
        fullText += pageText + '\n'
      }

      return fullText.trim()
    } catch (error) {
      console.error('Error extracting text from PDF:', error)
      throw new Error('Failed to extract text from PDF')
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file')
      return
    }

    setSelectedFile(file)
    setError('')
    setIsExtracting(true)

    try {
      // Step 1: Extract text from PDF
      const extractedText = await extractTextFromPDF(file)
      setRawText(extractedText)
      setIsExtracting(false)
      setIsConverting(true)

      // Step 2: Convert to markdown using OpenAI
      const markdownContent = await convertResumeToMarkdown(extractedText)
      setResumeContent(markdownContent)
    } catch (error) {
      setError('Failed to process PDF. Please try again.')
      console.error('PDF processing error:', error)
    } finally {
      setIsExtracting(false)
      setIsConverting(false)
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
    console.log("🔍 AUTH DEBUG: in setup", {
      user
    })
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
                  <h2 className="text-4xl font-bold text-white">Upload Your Resume</h2>
                </div>
                <p className="text-gray-300 text-xl mb-2">
                  Upload your PDF resume and we'll convert it to markdown automatically
                </p>
                <p className="text-gray-400">We'll extract text and format it properly for you</p>
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

              {/* PDF Upload Area */}
              <div className="bg-white/5 border border-white/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-[#00FFAA] to-[#00DD99] rounded-lg flex items-center justify-center">
                      <File className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Upload PDF Resume</h3>
                      <p className="text-gray-400 text-sm">Select your PDF file to extract text automatically</p>
                    </div>
                  </div>
                </div>
                
                {/* File Input */}
                <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-[#00FFAA]/50 transition-colors">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label htmlFor="pdf-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-16 h-16 bg-[#00FFAA]/20 rounded-full flex items-center justify-center">
                        <Upload className="w-8 h-8 text-[#00FFAA]" />
                      </div>
                      <div>
                        <p className="text-white font-medium mb-1">
                          {selectedFile ? selectedFile.name : "Click to upload PDF"}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {selectedFile ? "File selected" : "or drag and drop your resume here"}
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
                
                {(isExtracting || isConverting) && (
                  <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        className="w-5 h-5 border-2 border-[#00FFAA] border-t-transparent rounded-full"
                      />
                      <p className="text-[#00FFAA] text-sm">
                        {isExtracting ? "Extracting text from PDF..." : "Converting to markdown..."}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Resume Content Area */}
              {resumeContent && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="space-y-3">
                    <label className="text-white font-medium flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-[#00FFAA]" />
                      <span>Markdown Resume (You can edit this)</span>
                    </label>
                    <Textarea
                      value={resumeContent}
                      onChange={(e) => setResumeContent(e.target.value)}
                      placeholder="Markdown resume will appear here..."
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
              )}

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