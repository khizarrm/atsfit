/**
 * Shared markdown to HTML converter for resume preview
 * Used by both preview components and PDF generation to ensure consistency
 */

export function renderMarkdownPreview(markdown: string): string {
  if (!markdown) return '<p style="color: #666; text-align: center; margin-top: 2rem;">No content to preview</p>'
  
  const lines = markdown.split('\n')
  let isFirstContactLine = false
  
  return lines
    .map((line) => {
      // Headers
      if (line.startsWith('# ')) {
        isFirstContactLine = true // Next non-empty line should be contact info
        return `<h1 style="font-size: 1.8em; text-align: center; margin-bottom: 0.1rem; font-weight: 700; color: #111;">${line.slice(2)}</h1>`
      }
      
      // Contact info line (first line after name that contains contact details)
      if (isFirstContactLine && line.trim() && (line.includes('•') || line.includes('@') || line.includes('github'))) {
        isFirstContactLine = false
        return `<p style="text-align: center; margin-bottom: 0.15rem; font-size: 1em; color: #333; line-height: 1.3;">${line}</p>`
      }
      
      if (line.startsWith('### ')) {
        return `<h3 style="font-size: 1.2em; color: #222; margin-top: 0.25rem; margin-bottom: 0.1rem; font-weight: 600; border-bottom: 1px solid #888; padding-bottom: 0.05rem;">${line.slice(4)}</h3>`
      }
      if (line.startsWith('#### ')) {
        let h4Content = line.slice(5)
        // Process bold, italic, and underline in H4
        h4Content = h4Content.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 700; color: #333;">$1</strong>')
        h4Content = h4Content.replace(/\*(.*?)\*/g, '<em style="font-style: italic; color: #333;">$1</em>')
        h4Content = h4Content.replace(/_(.*?)_/g, '<u style="text-decoration: underline; color: #333;">$1</u>')
        return `<h4 style="font-size: 1.1em; font-weight: 400; color: #333; margin-bottom: 0.05rem; margin-top: 0.08rem;">${h4Content}</h4>`
      }
      
      // Horizontal rule
      if (line.trim() === '---') {
        return '<hr style="border: none; border-top: 1px solid #ccc; margin: 0.2rem 0; clear: both;" />'
      }
      
      // Bullets
      if (line.startsWith('- ')) {
        let bulletContent = line.slice(2)
        // Process bold, italic, and underline in bullets
        bulletContent = bulletContent.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 700; color: #111;">$1</strong>')
        bulletContent = bulletContent.replace(/\*(.*?)\*/g, '<em style="font-style: italic; color: #333;">$1</em>')
        bulletContent = bulletContent.replace(/_(.*?)_/g, '<u style="text-decoration: underline; color: #333;">$1</u>')
        return `<div style="margin: 0 0 0.01rem 1.2rem; position: relative;"><span style="position: absolute; left: -1rem; color: #111; font-weight: bold;">•</span><span style="line-height: 1.3; font-size: 1em; color: #333;">${bulletContent}</span></div>`
      }
      
      // Bold, italic, and underline - ensure formatting works properly
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 700; color: #111;">$1</strong>')
      line = line.replace(/\*(.*?)\*/g, '<em style="font-style: italic; color: #333;">$1</em>')
      line = line.replace(/_(.*?)_/g, '<u style="text-decoration: underline; color: #333;">$1</u>')
      
      // Links
      line = line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #111; text-decoration: underline;">$1</a>')
      
      // Empty lines
      if (line.trim() === '') {
        return '<div style="margin: 0.05rem 0;"></div>'
      }
      
      // Regular paragraphs
      return `<p style="margin: 0 0 0.01rem 0; line-height: 1.2; font-size: 1em; color: #333;">${line}</p>`
    })
    .join('')
}

/**
 * Container styling for preview - matches the profile view preview exactly
 */
export const PREVIEW_CONTAINER_STYLES = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: '12px',
  lineHeight: '1.4',
  color: '#111',
  backgroundColor: '#ffffff',
  padding: '20px',
  minHeight: '400px',
  width: '100%',
  maxWidth: '800px'
} as const

/**
 * Generate CSS for PDF that matches the preview styling exactly
 */
export function generatePDFCSS(containerStyles = PREVIEW_CONTAINER_STYLES): string {
  return `
    body {
      font-family: ${containerStyles.fontFamily};
      font-size: ${containerStyles.fontSize};
      line-height: ${containerStyles.lineHeight};
      color: ${containerStyles.color};
      background-color: ${containerStyles.backgroundColor};
      padding: ${containerStyles.padding};
      margin: 0;
      max-width: ${containerStyles.maxWidth};
      margin: 0 auto;
    }

    h1 {
      font-size: 1.8em;
      text-align: center;
      margin-bottom: 0.1rem;
      font-weight: 700;
      color: #111;
    }

    h3 {
      font-size: 1.2em;
      color: #222;
      margin-top: 0.25rem;
      margin-bottom: 0.1rem;
      font-weight: 600;
      border-bottom: 1px solid #888;
      padding-bottom: 0.05rem;
    }

    h4 {
      font-size: 1.1em;
      font-weight: 400;
      color: #333;
      margin-bottom: 0.05rem;
      margin-top: 0.08rem;
    }

    p {
      margin: 0 0 0.01rem 0;
      line-height: 1.2;
      font-size: 1em;
      color: #333;
    }

    h1 + p {
      text-align: center;
      margin-bottom: 0.15rem;
      font-size: 1em;
      color: #333;
      line-height: 1.3;
    }

    .bullet-point {
      margin: 0 0 0.01rem 1.2rem;
      position: relative;
    }
    
    .bullet-point::before {
      content: "\u2022";
      position: absolute;
      left: -1rem;
      color: #111;
      font-weight: bold;
    }
    
    .bullet-content {
      line-height: 1.3;
      font-size: 1em;
      color: #333;
    }

    hr {
      border: none;
      border-top: 1px solid #ccc;
      margin: 0.2rem 0;
      clear: both;
    }

    strong {
      font-weight: 700;
      color: #111;
    }

    em {
      font-style: italic;
      color: #333;
    }

    u {
      text-decoration: underline;
      color: #333;
    }

    a {
      color: #111;
      text-decoration: underline;
    }

    @media print {
      body {
        margin: 0;
        padding: 20px;
      }
      
      * {
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }
    }
  `;
}