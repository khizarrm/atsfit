import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Eye, Download, Copy, AlertCircle } from "lucide-react"
import { useState } from "react"
import { renderMarkdownPreview } from "@/lib/utils/preview-renderer"
import { usePDFGeneration } from "@/hooks/usePDFGeneration"

interface ResumePreviewProps {
  content: string
  onDownloadPDF?: () => void
}

export function ResumePreview({ content, onDownloadPDF }: ResumePreviewProps) {
  const [copied, setCopied] = useState(false)
  const [pdfState, pdfActions] = usePDFGeneration()

  const handleCopy = async () => {
    if (!content.trim()) return
    
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy content:', error)
    }
  }

  const handleDownload = async () => {
    if (!content.trim()) return
    
    if (onDownloadPDF) {
      onDownloadPDF()
      return
    }

    // Use the API-based PDF generation
    const success = await pdfActions.generatePDF(content, {
      format: 'letter',
      filename: 'resume.pdf'
    })

    // If PDF generation fails, fallback to markdown download
    if (!success && pdfState.error) {
      console.log('PDF generation failed, falling back to markdown download')
      setTimeout(() => {
        const blob = new Blob([content], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "resume.md"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 2000) // Give user time to see error
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      layout
      className="bg-white/3 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl"
    >
      {/* Header */}
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
              disabled={!content.trim()}
              className="bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 text-white hover:shadow-[0_0_20px_rgba(0,255,170,0.3)] text-xs px-3 py-1 disabled:opacity-50"
            >
              <Copy className="mr-1 h-3 w-3" />
              {copied ? "Copied!" : "Copy"}
            </Button>
            
            <Button
              onClick={handleDownload}
              disabled={pdfState.isGenerating || !content.trim()}
              size="sm"
              className="bg-gradient-to-r from-[#00FFAA] to-[#00DD99] hover:from-[#00DD99] hover:to-[#00FFAA] text-black hover:shadow-[0_0_20px_rgba(0,255,170,0.3)] disabled:opacity-50 disabled:hover:scale-100 text-xs px-3 py-1"
            >
              {pdfState.isGenerating ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="w-3 h-3 border-2 border-black border-t-transparent rounded-full mr-1"
                  />
                  {pdfState.stage || 'Generating...'}
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
        {pdfState.isGenerating && pdfState.progress > 0 && (
          <div className="mt-3">
            <div className="bg-white/10 rounded-full h-1 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#00FFAA] to-[#00DD99]"
                initial={{ width: 0 }}
                animate={{ width: `${pdfState.progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {pdfState.stage} ({Math.round(pdfState.progress)}%)
            </p>
          </div>
        )}
        
        {/* Error message */}
        {pdfState.error && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 mt-3 flex items-start space-x-2"
          >
            <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-red-400 font-medium">PDF Generation Failed</p>
              <p className="text-xs text-red-300 mt-1">{pdfState.error}</p>
              <p className="text-xs text-red-300 mt-1">Downloading markdown file instead...</p>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Preview Content */}
      <div className="p-4">
        {content.trim() ? (
          <div 
            className="bg-white rounded-xl p-4 min-h-[500px] overflow-auto"
            style={{ 
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: '10px',
              lineHeight: '1.2',
              color: '#111'
            }}
            dangerouslySetInnerHTML={{
              __html: renderMarkdownPreview(content)
            }}
          />
        ) : (
          <div className="bg-white/5 rounded-xl p-4 min-h-[500px] flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Preview will appear here as you type</p>
              <p className="text-xs mt-1">Start by adding your name with # Your Name</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}