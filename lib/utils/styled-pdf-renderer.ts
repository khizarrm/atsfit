/**
 * Enhanced jsPDF text-based renderer that creates ATS-friendly PDFs
 * with styling that matches the preview exactly
 */

import jsPDF from 'jspdf'
import { ParsedDocument, ParsedElement } from './html-parser'

export interface PDFRenderOptions {
  format: 'letter' | 'a4'
  orientation: 'portrait' | 'landscape'
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
  fontFamily: string
}

export class StyledPDFRenderer {
  private pdf: jsPDF
  private currentY: number
  private pageWidth: number
  private pageHeight: number
  private margins: PDFRenderOptions['margins']
  private fontFamily: string
  
  constructor(options: PDFRenderOptions) {
    this.pdf = new jsPDF({
      orientation: options.orientation,
      unit: 'pt',
      format: options.format
    })
    
    this.margins = options.margins
    this.fontFamily = options.fontFamily
    this.currentY = this.margins.top
    
    // Get page dimensions in points
    const pageSize = this.pdf.internal.pageSize
    this.pageWidth = pageSize.getWidth()
    this.pageHeight = pageSize.getHeight()
    
    // Set default font
    this.setFont('normal', 'normal')
  }
  
  /**
   * Render parsed document to PDF
   */
  async renderDocument(parsedDoc: ParsedDocument): Promise<void> {
    for (const element of parsedDoc.elements) {
      await this.renderElement(element)
    }
  }
  
  /**
   * Render individual element with styling
   */
  private async renderElement(element: ParsedElement): Promise<void> {
    // Check if we need a new page
    if (this.needsNewPage(element)) {
      this.addNewPage()
    }
    
    // Apply spacing before element
    this.currentY += element.styles.marginTop
    
    switch (element.type) {
      case 'h1':
        await this.renderHeader1(element)
        break
      case 'h3':
        await this.renderHeader3(element)
        break
      case 'h4':
        await this.renderHeader4(element)
        break
      case 'p':
        await this.renderParagraph(element)
        break
      case 'li':
        await this.renderListItem(element)
        break
      case 'hr':
        await this.renderHorizontalRule(element)
        break
      default:
        await this.renderText(element)
    }
    
    // Apply spacing after element
    this.currentY += element.styles.marginBottom
  }
  
  /**
   * Render H1 header (name)
   */
  private async renderHeader1(element: ParsedElement): Promise<void> {
    this.setFont('bold', 'normal')
    this.pdf.setFontSize(element.styles.fontSize)
    this.pdf.setTextColor(element.styles.color)
    
    const textWidth = this.pdf.getTextWidth(element.content)
    const x = element.styles.textAlign === 'center' 
      ? (this.pageWidth - textWidth) / 2 
      : this.margins.left
    
    this.pdf.text(element.content, x, this.currentY)
    
    // Add underline for headers
    if (element.styles.textAlign === 'center') {
      const lineY = this.currentY + 2
      const lineStartX = (this.pageWidth - textWidth) / 2
      const lineEndX = lineStartX + textWidth
      this.pdf.setDrawColor('#999')
      this.pdf.setLineWidth(0.5)
      this.pdf.line(lineStartX, lineY, lineEndX, lineY)
    }
    
    this.currentY += element.styles.fontSize + 2
  }
  
  /**
   * Render H3 section header
   */
  private async renderHeader3(element: ParsedElement): Promise<void> {
    this.setFont('bold', 'normal')
    this.pdf.setFontSize(element.styles.fontSize)
    this.pdf.setTextColor(element.styles.color)
    
    const x = this.margins.left + element.styles.marginLeft
    this.pdf.text(element.content.toUpperCase(), x, this.currentY)
    
    this.currentY += element.styles.fontSize + 1
  }
  
  /**
   * Render H4 sub-header
   */
  private async renderHeader4(element: ParsedElement): Promise<void> {
    this.setFont('bold', 'normal')
    this.pdf.setFontSize(element.styles.fontSize)
    this.pdf.setTextColor(element.styles.color)
    
    const x = this.margins.left + element.styles.marginLeft
    this.pdf.text(element.content, x, this.currentY)
    
    this.currentY += element.styles.fontSize + 1
  }
  
  /**
   * Render paragraph
   */
  private async renderParagraph(element: ParsedElement): Promise<void> {
    this.setFont(element.styles.fontWeight, element.styles.fontStyle)
    this.pdf.setFontSize(element.styles.fontSize)
    this.pdf.setTextColor(element.styles.color)
    
    const maxWidth = this.pageWidth - this.margins.left - this.margins.right - element.styles.marginLeft
    const lines = this.pdf.splitTextToSize(element.content, maxWidth)
    
    for (const line of lines) {
      if (this.needsNewPage()) {
        this.addNewPage()
      }
      
      let x = this.margins.left + element.styles.marginLeft
      
      // Center align for contact info
      if (element.styles.textAlign === 'center') {
        const textWidth = this.pdf.getTextWidth(line)
        x = (this.pageWidth - textWidth) / 2
      }
      
      this.pdf.text(line, x, this.currentY)
      this.currentY += element.styles.fontSize * 1.1 // Tighter line height to match preview
    }
  }
  
  /**
   * Render list item with bullet
   */
  private async renderListItem(element: ParsedElement): Promise<void> {
    this.setFont(element.styles.fontWeight, element.styles.fontStyle)
    this.pdf.setFontSize(element.styles.fontSize)
    this.pdf.setTextColor(element.styles.color)
    
    const bulletX = this.margins.left + element.styles.marginLeft
    const textX = bulletX + 10 // Space after bullet
    const maxWidth = this.pageWidth - textX - this.margins.right
    
    // Render bullet
    this.pdf.text('•', bulletX, this.currentY)
    
    // Render text with wrapping
    const lines = this.pdf.splitTextToSize(element.content, maxWidth)
    
    for (let i = 0; i < lines.length; i++) {
      if (this.needsNewPage()) {
        this.addNewPage()
      }
      
      this.pdf.text(lines[i], textX, this.currentY)
      this.currentY += element.styles.fontSize * 1.1 // Tighter spacing
    }
  }
  
  /**
   * Render horizontal rule
   */
  private async renderHorizontalRule(element: ParsedElement): Promise<void> {
    const lineY = this.currentY
    const startX = this.margins.left
    const endX = this.pageWidth - this.margins.right
    
    this.pdf.setDrawColor(element.styles.color)
    this.pdf.setLineWidth(0.5)
    this.pdf.line(startX, lineY, endX, lineY)
    
    this.currentY += 5 // Small space after line
  }
  
  /**
   * Render regular text
   */
  private async renderText(element: ParsedElement): Promise<void> {
    this.setFont(element.styles.fontWeight, element.styles.fontStyle)
    this.pdf.setFontSize(element.styles.fontSize)
    this.pdf.setTextColor(element.styles.color)
    
    const x = this.margins.left + element.styles.marginLeft
    const maxWidth = this.pageWidth - this.margins.left - this.margins.right - element.styles.marginLeft
    const lines = this.pdf.splitTextToSize(element.content, maxWidth)
    
    for (const line of lines) {
      if (this.needsNewPage()) {
        this.addNewPage()
      }
      
      this.pdf.text(line, x, this.currentY)
      this.currentY += element.styles.fontSize * 1.1 // Tighter spacing
    }
  }
  
  /**
   * Set font with fallback handling
   */
  private setFont(weight: string, style: string): void {
    try {
      // Use Times (closest to Georgia) for better preview matching
      let fontName = 'times'
      
      // Map weight and style to jsPDF format
      let fontStyle = 'normal'
      if (weight === 'bold' && style === 'italic') {
        fontStyle = 'bolditalic'
      } else if (weight === 'bold') {
        fontStyle = 'bold'
      } else if (style === 'italic') {
        fontStyle = 'italic'
      }
      
      this.pdf.setFont(fontName, fontStyle)
    } catch (error) {
      // Fallback to default font
      this.pdf.setFont('times', 'normal')
    }
  }
  
  /**
   * Check if element needs a new page
   */
  private needsNewPage(element?: ParsedElement): boolean {
    const bottomMargin = this.pageHeight - this.margins.bottom
    const estimatedHeight = element ? element.styles.fontSize * 2 : 20
    
    return this.currentY + estimatedHeight > bottomMargin
  }
  
  /**
   * Add new page and reset position
   */
  private addNewPage(): void {
    this.pdf.addPage()
    this.currentY = this.margins.top
  }
  
  /**
   * Save the PDF
   */
  save(filename: string): void {
    this.pdf.save(filename)
  }
  
  /**
   * Get PDF as blob for further processing
   */
  getBlob(): Blob {
    return this.pdf.output('blob')
  }
}