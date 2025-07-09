"use client"

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, File, X, Loader2, FileText, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FileUploadProps {
  onFileProcessed: (markdown: string) => void
  onError: (error: string) => void
  disabled?: boolean
}

export function FileUpload({ onFileProcessed, onError, disabled = false }: FileUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [processingStep, setProcessingStep] = useState<'upload' | 'extract' | 'convert' | 'complete'>('upload')

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled || acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    
    // Validate file type
    if (!file.type.includes('pdf') && !file.name.endsWith('.pdf') && 
        !file.type.includes('word') && !file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
      onError('Please upload a PDF or Word document')
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      onError('File size must be less than 10MB')
      return
    }

    setUploadedFile(file)
    setIsProcessing(true)
    setProcessingStep('extract')

    try {
      // Step 1: Extract text from file
      const formData = new FormData()
      formData.append('file', file)
      
      const extractResponse = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData,
      })

      if (!extractResponse.ok) {
        throw new Error('Failed to extract text from file')
      }

      const extractData = await extractResponse.json()
      
      if (!extractData.success) {
        throw new Error(extractData.error || 'Text extraction failed')
      }

      setProcessingStep('convert')

      // Step 2: Convert extracted text to markdown
      const convertResponse = await fetch('/api/convert-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          extractedText: extractData.text
        }),
      })

      if (!convertResponse.ok) {
        throw new Error('Failed to convert resume to markdown')
      }

      const convertData = await convertResponse.json()
      
      if (!convertData.success) {
        throw new Error(convertData.error || 'Resume conversion failed')
      }

      setProcessingStep('complete')
      onFileProcessed(convertData.markdown)
      
    } catch (error) {
      console.error('File processing error:', error)
      onError(error instanceof Error ? error.message : 'Failed to process file')
    } finally {
      setIsProcessing(false)
      setProcessingStep('upload')
    }
  }, [onFileProcessed, onError, disabled])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
    },
    maxFiles: 1,
    disabled: disabled || isProcessing,
  })

  const clearFile = () => {
    setUploadedFile(null)
    setProcessingStep('upload')
  }

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'extract':
        return <FileText className="w-4 h-4" />
      case 'convert':
        return <Loader2 className="w-4 h-4 animate-spin" />
      case 'complete':
        return <FileText className="w-4 h-4 text-green-500" />
      default:
        return <Upload className="w-4 h-4" />
    }
  }

  const getStepText = (step: string) => {
    switch (step) {
      case 'extract':
        return 'Extracting text from document...'
      case 'convert':
        return 'Converting to markdown format...'
      case 'complete':
        return 'Processing complete!'
      default:
        return 'Upload your resume'
    }
  }

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!uploadedFile ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div
              {...getRootProps()}
              className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? 'border-[#00FFAA] bg-[#00FFAA]/5 scale-105'
                  : disabled || isProcessing
                  ? 'border-gray-600 bg-gray-900/50 cursor-not-allowed'
                  : 'border-gray-600 hover:border-[#00FFAA] hover:bg-[#00FFAA]/5'
              }`}
            >
              <input {...getInputProps()} />
              
              <motion.div
                animate={{ 
                  scale: isDragActive ? 1.1 : 1,
                  rotateZ: isDragActive ? 5 : 0
                }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center space-y-4"
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isDragActive ? 'bg-[#00FFAA]/20' : 'bg-gray-800'
                }`}>
                  <Upload className={`w-8 h-8 ${
                    isDragActive ? 'text-[#00FFAA]' : 'text-gray-400'
                  }`} />
                </div>
                
                <div>
                  <p className="text-lg font-semibold text-white mb-2">
                    {isDragActive ? 'Drop your resume here' : 'Upload your resume'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Drag & drop or click to select a PDF or Word document
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    Supported formats: PDF, DOC, DOCX (Max 10MB)
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="border border-gray-600 rounded-xl p-6 bg-gray-900/50"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#00FFAA]/20 rounded-lg flex items-center justify-center">
                  <File className="w-5 h-5 text-[#00FFAA]" />
                </div>
                <div>
                  <p className="text-white font-medium truncate max-w-xs">
                    {uploadedFile.name}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {(uploadedFile.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
              </div>
              
              {!isProcessing && (
                <Button
                  onClick={clearFile}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {isProcessing && (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  {getStepIcon(processingStep)}
                  <span className="text-gray-300 text-sm">
                    {getStepText(processingStep)}
                  </span>
                </div>
                
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-[#00FFAA] to-[#00DD99] h-2 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ 
                      width: processingStep === 'extract' ? '33%' : 
                             processingStep === 'convert' ? '66%' : 
                             processingStep === 'complete' ? '100%' : '0%'
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}