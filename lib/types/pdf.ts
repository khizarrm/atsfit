export interface PDFGenerationOptions {
  filename?: string
  format?: 'letter' | 'a4'
  orientation?: 'portrait' | 'landscape'
  quality?: number
  margins?: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

export interface PDFGenerationProgress {
  stage: 'converting' | 'rendering' | 'generating' | 'complete'
  progress: number
  message: string
}

export type PDFGenerationMethod = 'canvas' | 'direct' | 'ats-friendly'

export interface PDFGenerationResult {
  success: boolean
  method: PDFGenerationMethod
  filename: string
  size?: number
  error?: PDFGenerationError
}

export class PDFGenerationError extends Error {
  constructor(
    message: string,
    public readonly code: PDFErrorCode,
    public readonly method: PDFGenerationMethod,
    public readonly originalError?: Error
  ) {
    super(message)
    this.name = 'PDFGenerationError'
  }
}

export type PDFErrorCode = 
  | 'INVALID_INPUT'
  | 'MARKDOWN_PARSE_ERROR'
  | 'DOM_CREATION_ERROR'
  | 'CANVAS_RENDER_ERROR'
  | 'PDF_GENERATION_ERROR'
  | 'FONT_LOAD_ERROR'
  | 'MEMORY_ERROR'
  | 'UNKNOWN_ERROR'

export interface PDFProgressCallback {
  (progress: PDFGenerationProgress): void
}

export interface ResumeStyles {
  fontFamily: string
  fontSize: string
  lineHeight: string
  colors: {
    primary: string
    secondary: string
    text: string
    border: string
    background: string
  }
  spacing: {
    margin: string
    padding: string
    sectionGap: string
  }
}