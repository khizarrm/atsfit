"use client"

import React, { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, FileText, Check, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { convertResumeToMarkdown } from "@/lib/api"

interface PDFUploadProps {
  onFileProcessed: (content: string) => void
  isProcessing?: boolean
  error?: string | null
}

export function PDFUpload({ onFileProcessed, isProcessing = false, error = null }: PDFUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [processingStage, setProcessingStage] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const pdfFile = files.find(file => file.type === "application/pdf")
    
    if (pdfFile) {
      setSelectedFile(pdfFile)
      processFile(pdfFile)
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === "application/pdf") {
      setSelectedFile(file)
      processFile(file)
    }
  }, [])

  const processFile = async (file: File) => {
    try {
      setProcessingStage("Extracting text from PDF...")
      
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/process-pdf", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to extract text from PDF")
      }

      const { text } = await response.json()

      setProcessingStage("Converting to markdown format...")
      const markdownContent = await convertResumeToMarkdown(text)
      
      onFileProcessed(markdownContent)
    } catch (error) {
      console.error("Error processing PDF:", error)
      // Handle error in parent component
      onFileProcessed("")
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const removeFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <motion.div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
          transition-all duration-300 hover:scale-[1.02]
          ${isDragOver 
            ? "border-[#00FFAA] bg-[#00FFAA]/5 shadow-[0_0_20px_rgba(0,255,170,0.2)]" 
            : "border-white/20 hover:border-[#00FFAA]/50 bg-white/5"
          }
          ${isProcessing ? "pointer-events-none opacity-75" : ""}
        `}
        whileHover={{ scale: isProcessing ? 1 : 1.02 }}
        whileTap={{ scale: isProcessing ? 1 : 0.98 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isProcessing}
        />

        <AnimatePresence mode="wait">
          {selectedFile && !isProcessing ? (
            <motion.div
              key="file-selected"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-center space-x-3">
                <div className="w-12 h-12 bg-[#00FFAA]/20 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-[#00FFAA]" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">{selectedFile.name}</p>
                  <p className="text-gray-400 text-sm">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile()
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-red-400"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center justify-center text-[#00FFAA]">
                <Check className="w-5 h-5 mr-2" />
                <span className="text-sm">Ready to process</span>
              </div>
            </motion.div>
          ) : isProcessing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-center space-x-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="w-8 h-8 border-2 border-[#00FFAA] border-t-transparent rounded-full"
                />
                <div className="text-center">
                  <p className="text-white font-medium">Processing your resume...</p>
                  <p className="text-gray-400 text-sm">{processingStage}</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="upload-prompt"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-[#00FFAA] to-[#00DD99] rounded-full flex items-center justify-center mx-auto">
                <Upload className="w-8 h-8 text-black" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Upload Your Resume
                </h3>
                <p className="text-gray-300 mb-1">
                  Drag and drop your PDF resume here, or click to browse
                </p>
                <p className="text-gray-400 text-sm">
                  We'll automatically extract and format it for you
                </p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <div className="flex items-center justify-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-400 text-sm font-medium">PDF files only</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/30 rounded-xl p-3"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}