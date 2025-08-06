"use client"

import { motion } from "framer-motion"
import { useState, useEffect, Suspense, lazy } from "react"
import { Check, Upload, FileText, User, File } from "lucide-react"
import { useAuth, getCachedUserData } from "@/contexts/auth-context"
import { saveUserResume } from "@/lib/database/resume-operations"
import { validateResumeContent } from "@/lib/database/resume-operations"
import { SharedHeader } from "@/components/shared-header"
import { useRouter } from "next/navigation"
import { convertResumeToMarkdown } from "@/lib/api"

const BackgroundGlow = lazy(() => import('@/components/BackgroundGlow'))


export default function ResumeSetupPage() {
  const router = useRouter()
  const { user, cacheUserData } = useAuth()
  const [resumeContent, setResumeContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [isFormatting, setIsFormatting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [rawText, setRawText] = useState("")

  useEffect(() => {
    const cachedData = getCachedUserData()
    if (cachedData && cachedData.user) {
      console.log("📦 Resume setup: Using cached user data")
      return // User is authenticated via cache
    }

    if (user) {
      console.log("🔄 Resume setup: Using auth context user")
      return // User is authenticated via auth context
    }

    console.log("🚫 Resume setup: No user found, redirecting to login")
    router.push("/login")
  }, [user, router])

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const pdfjsLib = await import('pdfjs-dist')
      
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
      } catch (workerError) {
        console.warn('Worker setup failed, falling back to main thread:', workerError)
        pdfjsLib.GlobalWorkerOptions.workerSrc = ''
      }
      
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      let fullText = ''

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        
        // Sort items by position (top to bottom, left to right)
        const sortedItems = textContent.items
          .filter((item): item is any => 'str' in item && 'transform' in item)
          .sort((a, b) => {
            const yDiff = b.transform[5] - a.transform[5] // Y coordinate (higher Y = higher on page)
            if (Math.abs(yDiff) > 5) return yDiff > 0 ? 1 : -1 // Different lines
            return a.transform[4] - b.transform[4] // Same line, sort by X coordinate
          })

        let pageText = ''
        let lastY = null
        let lastX = null
        
        for (const item of sortedItems) {
          const currentY = item.transform[5]
          const currentX = item.transform[4]
          const text = item.str
          
          if (lastY !== null) {
            // Check for line break (significant Y difference)
            if (Math.abs(currentY - lastY) > 5) {
              pageText += '\n'
            } else if (lastX !== null) {
              // Same line - check for spacing
              const xDiff = currentX - lastX
              if (xDiff > item.width * 0.3) { // Add space if gap is larger than 30% of character width
                pageText += ' '
              }
            }
          }
          
          pageText += text
          lastY = currentY
          lastX = currentX + (item.width || 0)
        }
        
        fullText += pageText + '\n\n' // Double newline between pages
        console.log("The full text from the pdf is: " fullText)
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
    setIsFormatting(true)

    try {
      const extractedText = await extractTextFromPDF(file)
      setRawText(extractedText)

      const markdownContent = await convertResumeToMarkdown(extractedText)
      setResumeContent(markdownContent)
      
      // Cache the resume content for the editor page
      cacheUserData(user, markdownContent)
      
      // Navigate to the editor page after successful conversion
      router.push('/resume-editor')
    } catch (error) {
      setError('Failed to process PDF. Please try again.')
      console.error('PDF processing error:', error)
    } finally {
      setIsFormatting(false)
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
                
                {isFormatting && (
                  <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        className="w-5 h-5 border-2 border-[#00FFAA] border-t-transparent rounded-full"
                      />
                      <p className="text-[#00FFAA] text-sm">
                        Formatting your resume...
                      </p>
                    </div>
                  </div>
                )}
              </div>


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
