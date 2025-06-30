import { PDFGenerationError, PDFProgressCallback, PDFGenerationProgress } from '../types/pdf'

export function validateMarkdownInput(markdown: string): void {
  if (!markdown || typeof markdown !== 'string') {
    throw new PDFGenerationError(
      'Invalid markdown input: must be a non-empty string',
      'INVALID_INPUT',
      'canvas'
    )
  }

  if (markdown.trim().length === 0) {
    throw new PDFGenerationError(
      'Invalid markdown input: cannot be empty',
      'INVALID_INPUT',
      'canvas'
    )
  }

  if (markdown.length > 100000) { // 100KB limit
    throw new PDFGenerationError(
      'Markdown content too large (max 100KB)',
      'INVALID_INPUT',
      'canvas'
    )
  }
}

export function validateFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'optimized-resume.pdf'
  }

  // Sanitize filename
  const sanitized = filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')

  // Ensure .pdf extension
  if (!sanitized.toLowerCase().endsWith('.pdf')) {
    return `${sanitized}.pdf`
  }

  return sanitized
}

export async function waitForFonts(): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await Promise.race([
        document.fonts.ready,
        new Promise(resolve => setTimeout(resolve, 3000)) // 3s timeout
      ])
    } catch (error) {
      console.warn('Font loading failed or timed out:', error)
    }
  }
}

export async function createStyledContainer(
  htmlContent: string,
  cssContent: string,
  progressCallback?: PDFProgressCallback
): Promise<HTMLElement> {
  progressCallback?.({
    stage: 'rendering',
    progress: 20,
    message: 'Creating styled container...'
  })

  // Create container with better positioning
  const container = document.createElement('div')
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: -9999px;
    width: 8.5in;
    height: auto;
    background: white;
    z-index: -1;
    visibility: hidden;
    pointer-events: none;
    overflow: visible;
    font-display: swap;
  `

  // Add content
  container.innerHTML = `<div class="pdf-content">${htmlContent}</div>`
  
  // Add styles to document head
  const styleId = `pdf-temp-styles-${Date.now()}`
  const styleElement = document.createElement('style')
  styleElement.id = styleId
  styleElement.textContent = cssContent
  document.head.appendChild(styleElement)

  // Add to DOM
  document.body.appendChild(container)

  // Wait for layout and fonts
  await new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve)
    })
  })

  await waitForFonts()

  progressCallback?.({
    stage: 'rendering',
    progress: 40,
    message: 'Container styled and ready...'
  })

  return container
}

export function cleanupDOMElements(
  container: HTMLElement | null,
  styleId: string
): void {
  try {
    // Remove container
    if (container && document.body.contains(container)) {
      document.body.removeChild(container)
    }

    // Remove styles
    const styleElement = document.getElementById(styleId)
    if (styleElement && document.head.contains(styleElement)) {
      document.head.removeChild(styleElement)
    }
  } catch (error) {
    console.warn('Cleanup failed:', error)
  }
}

export function validateCanvasDimensions(canvas: HTMLCanvasElement): void {
  if (!canvas || canvas.width === 0 || canvas.height === 0) {
    throw new PDFGenerationError(
      'Canvas has invalid dimensions',
      'CANVAS_RENDER_ERROR',
      'canvas'
    )
  }

  if (canvas.width > 8000 || canvas.height > 12000) {
    throw new PDFGenerationError(
      'Canvas dimensions too large (performance limit)',
      'CANVAS_RENDER_ERROR',
      'canvas'
    )
  }
}

export function hasCanvasContent(canvas: HTMLCanvasElement): boolean {
  try {
    const ctx = canvas.getContext('2d')
    if (!ctx) return false

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // Check if there are non-white, non-transparent pixels
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1] 
      const b = data[i + 2]
      const a = data[i + 3]

      // If pixel is not white (255,255,255) and not transparent
      if (!(r === 255 && g === 255 && b === 255) && a > 0) {
        return true
      }
    }

    return false
  } catch (error) {
    console.warn('Canvas content validation failed:', error)
    return true // Assume content exists if validation fails
  }
}

export function calculatePDFDimensions(canvas: HTMLCanvasElement) {
  const pageWidth = 8.5 // inches
  const pageHeight = 11 // inches
  const imgWidth = pageWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  return {
    pageWidth,
    pageHeight,
    imgWidth,
    imgHeight,
    pagesNeeded: Math.ceil(imgHeight / pageHeight)
  }
}

export function createErrorWithContext(
  error: unknown,
  code: PDFGenerationError['code'],
  method: PDFGenerationError['method'],
  context: string
): PDFGenerationError {
  const message = error instanceof Error ? error.message : String(error)
  return new PDFGenerationError(
    `${context}: ${message}`,
    code,
    method,
    error instanceof Error ? error : undefined
  )
}