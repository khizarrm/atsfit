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
import { generatePDF } from "@/lib/api"
import { renderMarkdownPreview } from "@/lib/utils/preview-renderer"

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
  const [showPreview, setShowPreview] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalContent, setOriginalContent] = useState("")
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const chatGPTPrompt = 

`Convert the following resume text exactly as written into Markdown format.

Instructions:

Do not rephrase, rewrite, or edit any content. Do not change the format of the writing. 

Use # (H1) only for my name at the top.

Use ### (H3) for section headings (like EXPERIENCE, EDUCATION, SKILLS, PROJECTS).

Use #### (H4) for company or project titles.

Keep bullet points, line breaks, and formatting exactly as in my input. Do not add bullet points for project/experience titles, only for detailed points regarding an experience or project. 

Output it as plain text so I can easily copy and paste it.

Your only task is to strictly convert my resume to Markdown, preserving all content exactly.

Bold small categories and project names, eg. Frameworks, Technologies. 

Italicize company names, but bold the names of positions. 

Underline quantifiable metrics. 

Format bullet points with a '-'

When returning, ensure you do not modify any content whatsoever. 

Resume follows below:
___________________________________________________________`

  // Load user's existing resume
  useEffect(() => {
    if (user) {
      loadUserResume()
    }
  }, [])

  const loadUserResume = async () => {
    try {
      setIsLoading(true)
      
      if (!user) {
        setIsLoading(false)
        return
      }

      // Add timeout to prevent stuck loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), 10000)
      )
      
      const result = await Promise.race([
        getUserResume(user.id),
        timeoutPromise
      ]) as any
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
      
      const result = await generatePDF(resumeContent, {
        format: 'letter',
        filename: 'resume.pdf'
      })
      
      if (!result.success) {
        throw new Error(result.error || 'PDF generation failed')
      }
      
      console.log('PDF generated successfully')
      
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
        setPdfError(null)
      }, 3000)
    }
  }

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(chatGPTPrompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy prompt:", error)
    }
  }

  const handleOpenFullA4 = () => {
    if (!resumeContent.trim()) {
      showMessage('error', 'No resume content to preview')
      return
    }
    
    const html = renderMarkdownPreview(resumeContent)
    const css = `
      body {
        font-family: 'Georgia, "Times New Roman", serif';
        font-size: 14px;
        line-height: 1.2;
        color: #111;
        background-color: white;
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
        min-height: 100vh;
      }
      
      .resume-container {
        background: white;
        width: 8.5in;
        min-height: 11in;
        padding: 0.5in;
        margin: 0;
      }
      
      @media print {
        body {
          background-color: white;
          padding: 0;
          margin: 0;
        }
        
        .resume-container {
          width: 100%;
          min-height: auto;
          padding: 0.5in;
          margin: 0;
          box-shadow: none;
          border-radius: 0;
        }
      }
      
      h1 { font-size: 1.8em; text-align: center; margin-bottom: 0.1rem; font-weight: 700; color: #111; }
      h3 { font-size: 1.2em; color: #222; margin-top: 0.25rem; margin-bottom: 0.1rem; font-weight: 600; border-bottom: 1px solid #888; padding-bottom: 0.05rem; }
      h4 { font-size: 1.1em; font-weight: 400; color: #333; margin-bottom: 0.05rem; margin-top: 0.08rem; }
      p { margin: 0 0 0.01rem 0; line-height: 1.2; font-size: 1em; color: #333; }
      h1 + p { text-align: center; margin-bottom: 0.15rem; font-size: 1em; color: #333; line-height: 1.3; }
      .bullet-point { margin: 0 0 0.01rem 1.2rem; position: relative; }
      .bullet-point::before { content: "\u2022"; position: absolute; left: -1rem; color: #111; font-weight: bold; }
      .bullet-content { line-height: 1.3; font-size: 1em; color: #333; }
      hr { border: none; border-top: 1px solid #ccc; margin: 0.2rem 0; clear: both; }
      strong { font-weight: 700; color: #111; }
      em { font-style: italic; color: #333; }
      u { text-decoration: underline; color: #333; }
      a { color: #111; text-decoration: underline; }
    `
    
    const fullHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resume - Full A4 View</title>
        <style>${css}</style>
      </head>
      <body>
        <div class="resume-container">
          ${html}
        </div>
      </body>
      </html>
    `
    
    const blob = new Blob([fullHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    
    // Clean up the URL after a short delay
    setTimeout(() => URL.revokeObjectURL(url), 1000)
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
        onGoToProfile={() => {}} // Current page is profile, so no navigation needed
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
            <div className="flex items-center justify-center space-x-4">
              <p className="text-gray-400 text-sm">Edit your resume markdown and preview the formatted output</p>
              <Button
                onClick={() => setShowPreview(!showPreview)}
                variant="outline"
                size="sm"
                className="bg-black/40 backdrop-blur-md border-[#00FFAA]/50 text-[#00FFAA] hover:bg-[#00FFAA]/20 hover:border-[#00FFAA] hover:shadow-[0_0_10px_rgba(0,255,170,0.3)] transition-all duration-300"
              >
                {showPreview ? <EyeOff className="mr-2 h-3 w-3" /> : <Eye className="mr-2 h-3 w-3" />}
                {showPreview ? "Hide Preview" : "Show Preview"}
              </Button>
              <Button
                onClick={handleOpenFullA4}
                variant="outline"
                size="sm"
                className="bg-black/40 backdrop-blur-md border-[#00FFAA]/50 text-[#00FFAA] hover:bg-[#00FFAA]/20 hover:border-[#00FFAA] hover:shadow-[0_0_10px_rgba(0,255,170,0.3)] transition-all duration-300"
              >
                <Eye className="mr-2 h-3 w-3" />
                Full A4 View
              </Button>
            </div>
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
                  {isGeneratingPDF && (
                    <div className="mt-3">
                      <div className="bg-white/10 rounded-full h-1 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-[#00FFAA] to-[#00DD99]"
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Generating PDF...
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
                    className="bg-white rounded-xl p-4 min-h-[500px] overflow-auto"
                    style={{ 
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      fontSize: '14px',
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

          {/* ChatGPT Prompt Card */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-white/3 backdrop-blur-xl border border-white/5 rounded-2xl p-6 mt-6 shadow-2xl"
          >
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
                      <li>4. Place the output in the editor above</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}