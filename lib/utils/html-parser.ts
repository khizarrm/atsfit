/**
 * HTML Parser for extracting styled content from preview HTML
 * Maps HTML elements to PDF formatting instructions
 */

export interface ParsedElement {
  type: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'li' | 'hr' | 'strong' | 'em' | 'text'
  content: string
  styles: {
    fontSize: number
    fontWeight: 'normal' | 'bold'
    fontStyle: 'normal' | 'italic'
    textAlign: 'left' | 'center' | 'right'
    color: string
    marginTop: number
    marginBottom: number
    marginLeft: number
  }
  isContactInfo?: boolean
  isBulletPoint?: boolean
}

export interface ParsedDocument {
  elements: ParsedElement[]
  metadata: {
    totalElements: number
    hasStructure: boolean
  }
}

/**
 * Parse HTML from preview renderer into structured elements with styling
 */
export function parsePreviewHTML(htmlContent: string): ParsedDocument {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')
  const elements: ParsedElement[] = []
  
  // Helper to extract numeric value from CSS
  const extractNumber = (value: string): number => {
    const match = value.match(/[\d.]+/)
    return match ? parseFloat(match[0]) : 0
  }
  
  // Helper to convert em/rem to points (much smaller values to match preview)
  const convertToPoints = (value: string, baseSize: number = 10): number => {
    if (value.includes('em')) {
      return extractNumber(value) * baseSize * 0.3 // Reduce spacing significantly
    }
    if (value.includes('rem')) {
      return extractNumber(value) * baseSize * 0.3 // Reduce spacing significantly  
    }
    if (value.includes('px')) {
      return extractNumber(value) * 0.75 // px to pt conversion
    }
    return extractNumber(value) * 0.3 // Reduce all spacing
  }
  
  // Parse inline styles from style attribute
  const parseInlineStyles = (styleAttr: string) => {
    const styles: any = {}
    if (!styleAttr) return styles
    
    styleAttr.split(';').forEach(rule => {
      const [property, value] = rule.split(':').map(s => s.trim())
      if (property && value) {
        styles[property] = value
      }
    })
    return styles
  }
  
  // Process each element in the document
  const processElement = (element: Element, parentType?: string): void => {
    const tagName = element.tagName.toLowerCase()
    const textContent = element.textContent?.trim() || ''
    const styleAttr = element.getAttribute('style') || ''
    const inlineStyles = parseInlineStyles(styleAttr)
    
    // Skip empty elements except HR, and skip UL elements (process LI directly)
    if ((!textContent && tagName !== 'hr') || tagName === 'ul') return
    
    let parsedElement: ParsedElement | null = null
    
    switch (tagName) {
      case 'h1':
        parsedElement = {
          type: 'h1',
          content: textContent,
          styles: {
            fontSize: 14, // Fixed size to match preview better
            fontWeight: 'bold',
            fontStyle: 'normal',
            textAlign: 'center',
            color: inlineStyles['color'] || '#111',
            marginTop: 0,
            marginBottom: 2,
            marginLeft: 0
          }
        }
        break
        
      case 'h3':
        parsedElement = {
          type: 'h3',
          content: textContent,
          styles: {
            fontSize: 10, // Smaller to match preview
            fontWeight: 'bold',
            fontStyle: 'normal',
            textAlign: 'left',
            color: inlineStyles['color'] || '#222',
            marginTop: 4,
            marginBottom: 1,
            marginLeft: 0
          }
        }
        break
        
      case 'h4':
        parsedElement = {
          type: 'h4',
          content: textContent,
          styles: {
            fontSize: 9, // Small to match preview
            fontWeight: 'bold',
            fontStyle: 'normal',
            textAlign: 'left',
            color: inlineStyles['color'] || '#333',
            marginTop: 2,
            marginBottom: 1,
            marginLeft: 0
          }
        }
        break
        
      case 'p':
        const isContactInfo = inlineStyles['text-align'] === 'center' && 
          (textContent.includes('•') || textContent.includes('@') || textContent.includes('github'))
        
        parsedElement = {
          type: 'p',
          content: textContent,
          styles: {
            fontSize: 8.5, // Small to match preview
            fontWeight: 'normal',
            fontStyle: 'normal',
            textAlign: inlineStyles['text-align'] === 'center' ? 'center' : 'left',
            color: inlineStyles['color'] || '#333',
            marginTop: 0.5,
            marginBottom: 0.5,
            marginLeft: 0
          },
          isContactInfo
        }
        break
        
      case 'li':
        parsedElement = {
          type: 'li',
          content: textContent,
          styles: {
            fontSize: 8.5, // Small to match preview
            fontWeight: 'normal',
            fontStyle: 'normal',
            textAlign: 'left',
            color: inlineStyles['color'] || '#333',
            marginTop: 0.2,
            marginBottom: 0.2,
            marginLeft: 15 // Space for bullet
          },
          isBulletPoint: true
        }
        break
        
      case 'hr':
        parsedElement = {
          type: 'hr',
          content: '',
          styles: {
            fontSize: 0,
            fontWeight: 'normal',
            fontStyle: 'normal',
            textAlign: 'left',
            color: '#ccc',
            marginTop: convertToPoints('0.5rem', 10),
            marginBottom: convertToPoints('0.2rem', 10),
            marginLeft: 0
          }
        }
        break
        
      default:
        // Handle text nodes and other elements
        if (textContent) {
          parsedElement = {
            type: 'text',
            content: textContent,
            styles: {
              fontSize: convertToPoints('0.85em', 10),
              fontWeight: 'normal',
              fontStyle: 'normal',
              textAlign: 'left',
              color: '#333',
              marginTop: 1,
              marginBottom: 1,
              marginLeft: 0
            }
          }
        }
    }
    
    if (parsedElement) {
      elements.push(parsedElement)
    }
    
    // Only process child elements if this wasn't a content element
    // Avoid processing children of LI, P, H1, H3, H4 to prevent duplicates
    if (!['li', 'p', 'h1', 'h3', 'h4'].includes(tagName)) {
      for (const child of element.children) {
        processElement(child, tagName)
      }
    }
  }
  
  // Process all top-level elements
  const body = doc.body || doc
  for (const child of body.children) {
    processElement(child)
  }
  
  return {
    elements,
    metadata: {
      totalElements: elements.length,
      hasStructure: elements.some(el => ['h1', 'h3', 'h4'].includes(el.type))
    }
  }
}

/**
 * Helper to extract font family preference for PDF rendering
 */
export function extractFontFamily(htmlContent: string): string {
  if (htmlContent.includes('Georgia')) return 'Georgia'
  if (htmlContent.includes('Times')) return 'Times'
  if (htmlContent.includes('Arial')) return 'Arial'
  if (htmlContent.includes('Helvetica')) return 'Helvetica'
  return 'Times' // Default fallback
}