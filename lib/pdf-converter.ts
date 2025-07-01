import MarkdownIt from 'markdown-it'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

import { 
  PDFGenerationOptions,
  PDFGenerationResult,
  PDFGenerationError,
  PDFProgressCallback,
  PDFGenerationProgress,
  ResumeStyles
} from './types/pdf'
import { generateResumeCSS, generateATSFriendlyCSS, DEFAULT_RESUME_STYLES, ATS_FRIENDLY_STYLES } from './styles/resume-styles'
import { renderMarkdownPreview, PREVIEW_CONTAINER_STYLES } from './utils/preview-renderer'
import { parsePreviewHTML, extractFontFamily } from './utils/html-parser'
import { StyledPDFRenderer } from './utils/styled-pdf-renderer'
import {
  validateMarkdownInput,
  validateFilename,
  createStyledContainer,
  cleanupDOMElements,
  validateCanvasDimensions,
  hasCanvasContent,
  calculatePDFDimensions,
  createErrorWithContext
} from './utils/pdf-utils'

class PDFConverter {
  private progressCallback?: PDFProgressCallback
  private abortController?: AbortController

  constructor(progressCallback?: PDFProgressCallback) {
    this.progressCallback = progressCallback
  }

  private updateProgress(progress: PDFGenerationProgress): void {
    this.progressCallback?.(progress)
  }

  private checkAborted(): void {
    if (this.abortController?.signal.aborted) {
      throw new PDFGenerationError('PDF generation was aborted', 'UNKNOWN_ERROR', 'canvas')
    }
  }

  async generatePDF(
    markdownContent: string,
    options: PDFGenerationOptions = {},
    abortSignal?: AbortSignal
  ): Promise<PDFGenerationResult> {
    const startTime = Date.now()
    
    try {
      // Setup abort handling
      if (abortSignal) {
        this.abortController = new AbortController()
        abortSignal.addEventListener('abort', () => {
          this.abortController?.abort()
        })
      }

      this.updateProgress({
        stage: 'converting',
        progress: 0,
        message: 'Starting PDF generation...'
      })

      // Validate inputs
      validateMarkdownInput(markdownContent)
      const filename = validateFilename(options.filename || 'optimized-resume.pdf')
      
      this.checkAborted()

      // Try preview-styled method first (matches preview exactly), then fallback to other methods
      let result: PDFGenerationResult
      
      try {
        // Try enhanced text-based method first (ATS-friendly, matches preview)
        result = await this.generateTextBasedPreview(markdownContent, filename, options)
      } catch (previewError) {
        console.warn('Text-based preview method failed, trying canvas method:', previewError)
        try {
          // Try canvas method with default styling
          result = await this.generateWithCanvas(markdownContent, filename, options)
        } catch (canvasError) {
          console.warn('Canvas method failed, trying ATS method:', canvasError)
          try {
            result = await this.generateATSFriendly(markdownContent, filename, options)
          } catch (atsError) {
            console.warn('ATS method failed, trying direct method:', atsError)
            result = await this.generateWithDirect(markdownContent, filename, options)
          }
        }
      }

      const duration = Date.now() - startTime
      console.log(`PDF generation completed in ${duration}ms using ${result.method} method`)

      this.updateProgress({
        stage: 'complete',
        progress: 100,
        message: `PDF generated successfully (${duration}ms)`
      })

      return result

    } catch (error) {
      const pdfError = error instanceof PDFGenerationError 
        ? error 
        : createErrorWithContext(error, 'UNKNOWN_ERROR', 'canvas', 'PDF generation failed')
      
      console.error('PDF generation failed:', pdfError)
      
      return {
        success: false,
        method: 'canvas',
        filename: options.filename || 'optimized-resume.pdf',
        error: pdfError
      }
    }
  }

  private async generateATSFriendly(
    markdownContent: string,
    filename: string,
    options: PDFGenerationOptions
  ): Promise<PDFGenerationResult> {
    try {
      this.updateProgress({
        stage: 'converting',
        progress: 20,
        message: 'Creating ATS-friendly PDF...'
      })

      const pdf = new jsPDF({
        orientation: options.orientation || 'portrait',
        unit: 'in',
        format: options.format || 'letter'
      })

      // Convert markdown to structured text
      const md = new MarkdownIt({ html: true })
      const htmlContent = md.render(markdownContent)
      
      this.checkAborted()

      // Parse HTML to extract structured content
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = htmlContent
      
      this.updateProgress({
        stage: 'generating',
        progress: 60,
        message: 'Formatting structured text...'
      })

      // Generate structured PDF with proper formatting
      await this.createStructuredPDF(pdf, tempDiv, filename)

      return {
        success: true,
        method: 'ats-friendly' as const,
        filename,
        size: htmlContent.length
      }

    } catch (error) {
      throw createErrorWithContext(error, 'PDF_GENERATION_ERROR', 'canvas', 'ATS-friendly PDF generation failed')
    }
  }

  private async createStructuredPDF(pdf: any, contentDiv: HTMLElement, filename: string): Promise<void> {
    let yPosition = 0.8
    const pageWidth = 6.5  // Reduced from 7.5 to prevent text going off page
    const marginLeft = 1
    const marginRight = 1

    // Helper function to add a horizontal line divider
    const addDivider = () => {
      yPosition += 0.05
      if (yPosition > 10) {
        pdf.addPage()
        yPosition = 0.8
      }
      
      pdf.setDrawColor(0, 0, 0)
      pdf.setLineWidth(0.01)
      pdf.line(marginLeft, yPosition, marginLeft + pageWidth, yPosition)
      yPosition += 0.08
    }

    // Helper function to add text with proper formatting
    const addText = (text: string, fontSize: number, fontStyle: string = 'normal', align: string = 'left', extraSpaceBefore: number = 0, extraSpaceAfter: number = 0) => {
      yPosition += extraSpaceBefore
      
      if (yPosition > 10) {
        pdf.addPage()
        yPosition = 0.8
      }
      
      pdf.setFont('helvetica', fontStyle)
      pdf.setFontSize(fontSize)
      
      const lines = pdf.splitTextToSize(text.trim(), pageWidth)
      lines.forEach((line: string, index: number) => {
        if (yPosition > 10) {
          pdf.addPage()
          yPosition = 0.8
        }
        
        if (align === 'center') {
          const textWidth = pdf.getStringUnitWidth(line) * fontSize / 72
          const x = (8.5 - textWidth) / 2
          pdf.text(line, x, yPosition)
        } else {
          pdf.text(line, marginLeft, yPosition)
        }
        yPosition += fontSize * 0.014  // Slightly increased line height
      })
      
      yPosition += extraSpaceAfter
    }

    // Track processed elements to avoid duplicates
    const processedElements = new Set<Element>()

    // Process each element
    const processElement = (element: Element) => {
      if (processedElements.has(element)) return
      processedElements.add(element)
      
      const tagName = element.tagName?.toLowerCase()
      const text = element.textContent?.trim() || ''
      
      if (!text) return

      switch (tagName) {
        case 'h1':
          addText(text, 15, 'bold', 'center', 0, 0.15)
          break
        case 'h2':
          addText(text, 12, 'bold', 'left', 0.25, 0.02)
          addDivider()
          yPosition += 0.08
          break
        case 'h3':
          addText(text, 11, 'bold', 'left', 0.15, 0.08)
          break
        case 'h4':
          addText(text, 10, 'bold', 'left', 0.12, 0.05)
          break
        case 'p':
          if (element.previousElementSibling?.tagName === 'H1') {
            // Contact info after name
            addText(text, 10, 'normal', 'center', 0, 0.25)
          } else {
            addText(text, 10, 'normal', 'left', 0.05, 0.08)
          }
          break
        case 'li':
          addText(`• ${text}`, 10, 'normal', 'left', 0.02, 0.06)
          break
        case 'ul':
        case 'ol':
          // Add small space before lists
          yPosition += 0.05
          break
        default:
          // Only process leaf elements with text
          if (text && element.children.length === 0 && !['ul', 'ol'].includes(element.parentElement?.tagName?.toLowerCase() || '')) {
            addText(text, 10, 'normal', 'left', 0.05, 0.08)
          }
      }
    }

    // Process elements in document order, prioritizing structure
    const walkElements = (parent: Element) => {
      for (const child of parent.children) {
        const tagName = child.tagName.toLowerCase()
        
        // Process structural elements immediately
        if (['h1', 'h2', 'h3', 'h4', 'p', 'ul', 'ol'].includes(tagName)) {
          processElement(child)
          
          // For lists, process their items
          if (['ul', 'ol'].includes(tagName)) {
            for (const li of child.querySelectorAll('li')) {
              processElement(li)
            }
          }
        } else {
          // Continue walking for non-structural elements
          walkElements(child)
        }
      }
    }
    
    walkElements(contentDiv)
    pdf.save(filename)
  }

  private async generateTextBasedPreview(
    markdownContent: string,
    filename: string,
    options: PDFGenerationOptions
  ): Promise<PDFGenerationResult> {
    try {
      this.updateProgress({
        stage: 'converting',
        progress: 10,
        message: 'Converting markdown to structured content...'
      })

      // Convert markdown using same renderer as preview
      const htmlContent = renderMarkdownPreview(markdownContent)
      
      this.checkAborted()

      this.updateProgress({
        stage: 'styling',
        progress: 30,
        message: 'Parsing HTML structure and styles...'
      })

      // Parse HTML to extract structured content with styling
      const parsedDoc = parsePreviewHTML(htmlContent)
      const fontFamily = extractFontFamily(htmlContent)
      
      this.checkAborted()

      this.updateProgress({
        stage: 'generating',
        progress: 60,
        message: 'Generating text-based PDF...'
      })

      // Create PDF with extracted styling
      const pdfRenderer = new StyledPDFRenderer({
        format: options.format || 'letter',
        orientation: options.orientation || 'portrait',
        margins: {
          top: 30, // Smaller margins to match preview
          right: 30,
          bottom: 30,
          left: 30
        },
        fontFamily
      })

      // Render document
      await pdfRenderer.renderDocument(parsedDoc)
      
      this.checkAborted()

      this.updateProgress({
        stage: 'complete',
        progress: 90,
        message: 'Saving PDF...'
      })

      // Save the PDF
      pdfRenderer.save(filename)

      return {
        success: true,
        method: 'text-based-preview',
        filename,
        size: parsedDoc.elements.length * 50 // Approximate size
      }

    } catch (error) {
      throw createErrorWithContext(error, 'PDF_GENERATION_ERROR', 'text-based-preview', 'Text-based preview PDF generation failed')
    }
  }


  private async generateWithCanvas(
    markdownContent: string,
    filename: string,
    options: PDFGenerationOptions
  ): Promise<PDFGenerationResult> {
    let container: HTMLElement | null = null
    let styleId = ''

    try {
      this.updateProgress({
        stage: 'converting',
        progress: 10,
        message: 'Converting markdown to HTML...'
      })

      // Convert markdown to HTML
      const md = new MarkdownIt({ html: true })
      const htmlContent = md.render(markdownContent)
      
      this.checkAborted()

      // Generate CSS
      const styles: ResumeStyles = DEFAULT_RESUME_STYLES
      const cssContent = generateResumeCSS(styles)

      // Create styled container
      container = await createStyledContainer(htmlContent, cssContent, this.progressCallback)
      styleId = `pdf-temp-styles-${Date.now()}`
      
      this.checkAborted()

      this.updateProgress({
        stage: 'rendering',
        progress: 60,
        message: 'Rendering to canvas...'
      })

      // Render with html2canvas
      const canvas = await this.renderToCanvas(container)
      
      this.checkAborted()

      this.updateProgress({
        stage: 'generating',
        progress: 80,
        message: 'Generating PDF...'
      })

      // Generate PDF from canvas
      await this.createPDFFromCanvas(canvas, filename, options)

      return {
        success: true,
        method: 'canvas',
        filename,
        size: canvas.width * canvas.height * 4 // Approximate size in bytes
      }

    } catch (error) {
      throw createErrorWithContext(error, 'CANVAS_RENDER_ERROR', 'canvas', 'Canvas generation failed')
    } finally {
      cleanupDOMElements(container, styleId)
    }
  }

  private async renderToCanvas(container: HTMLElement): Promise<HTMLCanvasElement> {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      x: 0,
      y: 0,
      width: container.offsetWidth,
      height: container.offsetHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: container.offsetWidth,
      windowHeight: container.offsetHeight,
      removeContainer: false,
      foreignObjectRendering: false,
      imageTimeout: 5000,
      logging: false,
      onclone: (_clonedDoc, element) => {
        if (element) {
          element.style.position = 'static'
          element.style.visibility = 'visible'
          element.style.opacity = '1'
        }
      }
    })

    validateCanvasDimensions(canvas)
    
    if (!hasCanvasContent(canvas)) {
      throw new PDFGenerationError(
        'Canvas appears to be empty - no content was captured',
        'CANVAS_RENDER_ERROR',
        'canvas'
      )
    }

    return canvas
  }

  private async createPDFFromCanvas(
    canvas: HTMLCanvasElement,
    filename: string,
    options: PDFGenerationOptions
  ): Promise<void> {
    const { imgWidth, imgHeight, pageHeight } = calculatePDFDimensions(canvas)
    
    const pdf = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'in',
      format: options.format || 'letter',
      compress: true
    })

    const imgData = canvas.toDataURL('image/png', options.quality || 0.95)
    
    let heightLeft = imgHeight
    let position = 0

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    pdf.save(filename)
  }

  private async generateWithDirect(
    markdownContent: string,
    filename: string,
    options: PDFGenerationOptions
  ): Promise<PDFGenerationResult> {
    try {
      this.updateProgress({
        stage: 'converting',
        progress: 20,
        message: 'Using direct PDF generation...'
      })

      const pdf = new jsPDF({
        orientation: options.orientation || 'portrait',
        unit: 'in',
        format: options.format || 'letter'
      })

      // Convert markdown to plain text
      const md = new MarkdownIt({ html: true })
      const htmlContent = md.render(markdownContent)
      
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = htmlContent
      const plainText = tempDiv.textContent || tempDiv.innerText || ''
      
      this.checkAborted()

      this.updateProgress({
        stage: 'generating',
        progress: 60,
        message: 'Generating text-based PDF...'
      })

      // Configure font and layout
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(12)
      
      const pageWidth = 7.5 // 8.5 - 1 inch margins
      const lines = pdf.splitTextToSize(plainText, pageWidth)
      
      const lineHeight = 0.2
      let y = 1
      
      lines.forEach((line: string) => {
        if (y > 10) {
          pdf.addPage()
          y = 1
        }
        pdf.text(line, 1, y)
        y += lineHeight
      })
      
      pdf.save(filename)

      return {
        success: true,
        method: 'direct',
        filename,
        size: plainText.length
      }

    } catch (error) {
      throw createErrorWithContext(error, 'PDF_GENERATION_ERROR', 'direct', 'Direct PDF generation failed')
    }
  }

  abort(): void {
    this.abortController?.abort()
  }
}

// Legacy function for backward compatibility (kept for potential future use)
// async function convertMarkdownToPDFDirect(markdownContent: string, filename: string): Promise<void> {
//   const converter = new PDFConverter()
//   await converter.generatePDF(markdownContent, { filename })
// }

export async function convertMarkdownToPDF(
  markdownContent: string,
  filename: string = 'optimized-resume.pdf',
  options: PDFGenerationOptions = {},
  progressCallback?: PDFProgressCallback,
  abortSignal?: AbortSignal
): Promise<PDFGenerationResult> {
  const converter = new PDFConverter(progressCallback)
  return converter.generatePDF(markdownContent, { ...options, filename }, abortSignal)
}

// Export the converter class for advanced usage
export { PDFConverter }

// Re-export types for convenience
export type { 
  PDFGenerationOptions,
  PDFGenerationResult,
  PDFGenerationError,
  PDFProgressCallback,
  PDFGenerationProgress
} from './types/pdf'

