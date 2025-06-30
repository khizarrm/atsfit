"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { ArrowLeft, Save, Eye, EyeOff, User, FileText, CheckCircle, AlertCircle, Download, Copy } from "lucide-react"
import { Resume } from "@/lib/database/resume-operations"
import { useAuth } from "@/contexts/auth-context"
import { getUserResume, saveUserResume, validateResumeContent } from "@/lib/database/resume-operations"
import { SharedHeader } from "@/components/shared-header"
import { convertMarkdownToPDF, PDFGenerationResult } from "@/lib/pdf-converter"
import { PDFGenerationProgress } from "@/lib/types/pdf"

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
  const [resumeContent, setResumeContent] = useState("")
  const [showPreview, setShowPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalContent, setOriginalContent] = useState("")
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [pdfProgress, setPdfProgress] = useState<PDFGenerationProgress | null>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Load user's existing resume
  useEffect(() => {
    if (user) {
      loadUserResume()
    }
  }, [user])

  const loadUserResume = async () => {
    try {
      setIsLoading(true)
      
      if (!user) {
        setIsLoading(false)
        return
      }

      const result = await getUserResume(user.id)
      console.log('getUserResume result:', result)

      if (result.success && result.data) {
        setResumeContent(result.data.resume_md)
        setOriginalContent(result.data.resume_md)
      } else {
        // No existing resume, set template
        const template = `# YOUR NAME

phone • email • website • github

---

### EDUCATION

#### University Name, City, State
*Degree Title* | Month Year - Month Year | GPA: X.X/4.0  
**Relevant Coursework:** Course 1, Course 2, Course 3

---

### EXPERIENCE

#### Job Title - Company Name
*Month Year - Month Year*
- Achievement or responsibility here
- Another achievement with metrics
- Third point about impact

---

### SKILLS

**Programming Languages:** Language1, Language2, Language3  
**Frameworks:** Framework1, Framework2  
**Tools:** Tool1, Tool2, Tool3`
        
        setResumeContent(template)
        setOriginalContent("")
      }
    } catch (error) {
      console.error('Error loading resume:', error)
      showMessage('error', 'Failed to load resume')
    } finally {
      setIsLoading(false)
    }
  }

  const handleContentChange = (value: string) => {
    setResumeContent(value)
    setHasChanges(value !== originalContent)
    // Clear any existing messages when user starts typing
    if (message) {
      setMessage(null)
    }
  }

  const handleSave = async () => {
    if (!user || !resumeContent.trim()) {
      showMessage('error', 'Please enter resume content')
      return
    }

    // Validate content first
    const validation = validateResumeContent(resumeContent)
    if (!validation.valid) {
      showMessage('error', validation.error || 'Invalid resume content')
      return
    }

    try {
      setIsSaving(true)
      
      const result = await saveUserResume(user.id, resumeContent)
      console.log('saveUserResume result:', result)

      if (result.success) {
        setOriginalContent(resumeContent)
        setHasChanges(false)
        showMessage('success', 'Resume saved successfully!')
        
        // Refresh the resume in auth context so dashboard gets updated data
        await refreshResume()
      } else {
        showMessage('error', result.error || 'Failed to save resume')
      }
    } catch (error) {
      console.error('Error saving resume:', error)
      console.error('Error details:', error)
      showMessage('error', `Failed to save resume: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleDownload = async () => {
    if (!resumeContent.trim()) {
      showMessage('error', 'No resume content to download')
      return
    }
    
    try {
      setIsGeneratingPDF(true)
      setPdfError(null)
      setPdfProgress(null)
      
      const progressCallback = (progress: PDFGenerationProgress) => {
        setPdfProgress(progress)
      }
      
      const result: PDFGenerationResult = await convertMarkdownToPDF(
        resumeContent,
        'resume.pdf',
        { format: 'letter', quality: 0.95 },
        progressCallback
      )
      
      if (!result.success) {
        throw result.error || new Error('PDF generation failed')
      }
      
      console.log(`PDF generated successfully using ${result.method} method`)
      
    } catch (error) {
      console.error('PDF generation failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setPdfError(errorMessage)
      
      // Fallback to markdown download
      setTimeout(() => {
        const blob = new Blob([resumeContent], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "resume.md"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 2000) // Give user time to see error
      
    } finally {
      setIsGeneratingPDF(false)
      // Clear progress after a short delay
      setTimeout(() => {
        setPdfProgress(null)
        setPdfError(null)
      }, 3000)
    }
  }

  const handleCopy = async () => {
    if (!resumeContent.trim()) {
      showMessage('error', 'No resume content to copy')
      return
    }
    
    await navigator.clipboard.writeText(resumeContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center"
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="min-h-screen flex flex-col"
    >
      <SharedHeader
        title="Profile"
        leftContent={
          <div className="flex items-center space-x-4 w-48">
            <Button onClick={onBack} variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        }
        rightContent={
          <div className="flex items-center space-x-4 w-48 justify-end">
            <Button
              onClick={() => setShowPreview(!showPreview)}
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
            >
              {showPreview ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {showPreview ? "Hide Preview" : "Show Preview"}
            </Button>
          </div>
        }
        user={user}
      />

      {/* Main Content */}
      <div className="flex-1 p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#00FFAA] to-[#00DD99] rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-black" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Manage Your Resume</h2>
            <p className="text-gray-400 text-sm">Edit your resume markdown and preview the formatted output</p>
          </div>

          {/* Message Display */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-4 p-3 rounded-xl flex items-center space-x-3 ${
                message.type === 'success' 
                  ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="text-sm">{message.text}</span>
            </motion.div>
          )}

          {/* Editor Layout */}
          <div className={`grid gap-6 ${showPreview ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {/* Editor Section */}
            <motion.div
              layout
              className="bg-white/3 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="border-b border-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-[#00FFAA]" />
                    <h3 className="text-white font-semibold">Resume Editor</h3>
                  </div>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || !hasChanges}
                    className={`font-semibold px-4 py-2 text-sm rounded-xl transition-all duration-300 ${
                      hasChanges && !isSaving
                        ? "bg-gradient-to-r from-[#00FFAA] to-[#00DD99] hover:from-[#00DD99] hover:to-[#00FFAA] text-black hover:scale-105"
                        : "bg-gray-700 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                          className="w-3 h-3 border-2 border-black border-t-transparent rounded-full mr-2"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-3 w-3" />
                        {hasChanges ? "Save Changes" : "Saved"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="p-4">
                <Textarea
                  value={resumeContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Enter your resume in markdown format..."
                  className="min-h-[500px] bg-black/20 border-white/20 text-white placeholder:text-gray-500 focus:border-[#00FFAA] focus:ring-[#00FFAA] font-mono text-sm leading-relaxed resize-none"
                />
                <p className="text-gray-500 text-xs mt-2">
                  Use markdown formatting. Follow the structure: # Name, contact info, --- dividers, ### sections
                </p>
              </div>
            </motion.div>

            {/* Preview Section */}
            {showPreview && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                layout
                className="bg-white/3 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl"
              >
                <div className="border-b border-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Eye className="w-4 h-4 text-[#00FFAA]" />
                      <h3 className="text-white font-semibold">Live Preview</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={handleCopy}
                        size="sm"
                        className="bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 text-white hover:shadow-[0_0_20px_rgba(0,255,170,0.3)] text-xs px-3 py-1"
                      >
                        <Copy className="mr-1 h-3 w-3" />
                        {copied ? "Copied!" : "Copy"}
                      </Button>
                      <Button
                        onClick={handleDownload}
                        disabled={isGeneratingPDF}
                        size="sm"
                        className="bg-gradient-to-r from-[#00FFAA] to-[#00DD99] hover:from-[#00DD99] hover:to-[#00FFAA] text-black hover:shadow-[0_0_20px_rgba(0,255,170,0.3)] disabled:opacity-50 disabled:hover:scale-100 text-xs px-3 py-1"
                      >
                        {isGeneratingPDF ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                              className="w-3 h-3 border-2 border-black border-t-transparent rounded-full mr-1"
                            />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Download className="mr-1 h-3 w-3" />
                            PDF
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Progress indicator */}
                  {isGeneratingPDF && pdfProgress && (
                    <div className="mt-3">
                      <div className="bg-white/10 rounded-full h-1 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-[#00FFAA] to-[#00DD99]"
                          initial={{ width: 0 }}
                          animate={{ width: `${pdfProgress.progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {pdfProgress.message} ({Math.round(pdfProgress.progress)}%)
                      </p>
                    </div>
                  )}
                  
                  {/* Error message */}
                  {pdfError && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-400 mt-2"
                    >
                      PDF failed: {pdfError}. Downloading markdown instead...
                    </motion.div>
                  )}
                </div>
                
                <div className="p-4">
                  <div 
                    className="bg-white rounded-xl p-3 min-h-[500px] overflow-auto"
                    style={{ 
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      fontSize: '10px',
                      lineHeight: '1.2',
                      color: '#111'
                    }}
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdownPreview(resumeContent)
                    }}
                  />
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

// Simple markdown to HTML converter for preview
function renderMarkdownPreview(markdown: string): string {
  if (!markdown) return '<p class="text-gray-400">Start typing to see preview...</p>'
  
  const lines = markdown.split('\n')
  let isFirstContactLine = false
  
  return lines
    .map((line, index) => {
      // Headers
      if (line.startsWith('# ')) {
        isFirstContactLine = true // Next non-empty line should be contact info
        return `<h1 style="font-size: 1.4em; text-transform: uppercase; text-align: center; letter-spacing: 0.02em; border-bottom: 1px solid #999; padding-bottom: 0.05rem; margin-bottom: 0.05rem; font-weight: 700; color: #111;">${line.slice(2)}</h1>`
      }
      
      // Contact info line (first line after name that contains contact details)
      if (isFirstContactLine && line.trim() && (line.includes('•') || line.includes('@') || line.includes('github'))) {
        isFirstContactLine = false
        return `<p style="text-align: center; margin-bottom: 0.1rem; font-size: 0.85em; color: #333; line-height: 1.2;">${line}</p>`
      }
      
      if (line.startsWith('### ')) {
        return `<h3 style="font-size: 0.95em; color: #222; margin-top: 0.3rem; margin-bottom: 0.1rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em;">${line.slice(4)}</h3>`
      }
      if (line.startsWith('#### ')) {
        return `<h4 style="font-size: 0.85em; font-weight: 600; color: #333; margin-bottom: 0.05rem; margin-top: 0.1rem;">${line.slice(5)}</h4>`
      }
      
      // Horizontal rule
      if (line.trim() === '---') {
        return '<hr style="border: none; border-top: 1px solid #ccc; margin: 0.5rem 0 0.2rem; clear: both;" />'
      }
      
      // Bullets
      if (line.startsWith('- ')) {
        return `<ul style="margin: 0 0 0.05rem 0; padding-left: 0.7rem;"><li style="margin-bottom: 0.02rem; line-height: 1.1; font-size: 0.85em;">${line.slice(2)}</li></ul>`
      }
      
      // Bold and italic - ensure ** bold works properly
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 700; color: #111;">$1</strong>')
      line = line.replace(/\*(.*?)\*/g, '<em style="font-style: italic; color: #333;">$1</em>')
      
      // Links
      line = line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #111; text-decoration: underline;">$1</a>')
      
      // Empty lines
      if (line.trim() === '') {
        return '<div style="margin: 0.05rem 0;"></div>'
      }
      
      // Regular paragraphs - make more compact
      return `<p style="margin-bottom: 0.05rem; line-height: 1.2; font-size: 0.85em; color: #333;">${line}</p>`
    })
    .join('')
}