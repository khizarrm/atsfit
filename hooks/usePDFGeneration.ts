import { useState, useCallback } from 'react'
import { generatePDF, type PDFGenerationOptions } from '@/lib/api'

export interface PDFState {
  isGenerating: boolean
  progress: number
  stage: string
  error: string | null
  lastGenerated: Date | null
}

export interface PDFActions {
  generatePDF: (content: string, options?: PDFGenerationOptions) => Promise<boolean>
  reset: () => void
}

/**
 * Hook for managing PDF generation with the backend API
 */
export function usePDFGeneration(): [PDFState, PDFActions] {
  const [state, setState] = useState<PDFState>({
    isGenerating: false,
    progress: 0,
    stage: '',
    error: null,
    lastGenerated: null
  })

  const generatePDFFunc = useCallback(async (
    content: string, 
    options: PDFGenerationOptions = {}
  ): Promise<boolean> => {
    if (!content.trim()) {
      setState(prev => ({
        ...prev,
        error: 'No content to generate PDF from'
      }))
      return false
    }

    setState(prev => ({
      ...prev,
      isGenerating: true,
      progress: 10,
      stage: 'Preparing...',
      error: null
    }))

    try {
      setState(prev => ({
        ...prev,
        progress: 50,
        stage: 'Generating PDF...'
      }))

      const result = await generatePDF(content, options)

      if (result.success) {
        setState(prev => ({
          ...prev,
          isGenerating: false,
          progress: 100,
          stage: 'Complete!',
          error: null,
          lastGenerated: new Date()
        }))
        
        // Clear success state after delay
        setTimeout(() => {
          setState(prev => ({
            ...prev,
            progress: 0,
            stage: ''
          }))
        }, 2000)

        return true
      } else {
        setState(prev => ({
          ...prev,
          isGenerating: false,
          progress: 0,
          stage: '',
          error: result.error || 'PDF generation failed'
        }))
        return false
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState(prev => ({
        ...prev,
        isGenerating: false,
        progress: 0,
        stage: '',
        error: errorMessage
      }))
      return false
    }
  }, [])

  const reset = useCallback(() => {
    setState({
      isGenerating: false,
      progress: 0,
      stage: '',
      error: null,
      lastGenerated: null
    })
  }, [])

  const actions: PDFActions = {
    generatePDF: generatePDFFunc,
    reset
  }

  return [state, actions]
}