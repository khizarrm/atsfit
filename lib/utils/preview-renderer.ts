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
      // Store original line for processing
      let processedLine = line
      
      // Headers
      if (line.startsWith('# ')) {
        isFirstContactLine = true // Next non-empty line should be contact info
        return `<h1 style="font-size: 1.8em; text-align: center; margin-bottom: 0.1rem; font-weight: 700; color: #111;">${line.slice(2)}</h1>`
      }
      
      // Horizontal rule
      if (line.trim() === '---') {
        return '<hr style="border: none; border-top: 1px solid #ccc; margin: 0.2rem 0; clear: both;" />'
      }
      
      // Empty lines
      if (line.trim() === '') {
        return '<div style="margin: 0.05rem 0;"></div>'
      }
      
      // Process formatting and links for ALL non-header, non-rule lines
      if (!line.startsWith('# ') && line.trim() !== '---' && line.trim() !== '') {
        // Handle ### and #### headers specially but still process their content
        if (line.startsWith('### ')) {
          processedLine = line.slice(4)
        } else if (line.startsWith('#### ')) {
          processedLine = line.slice(5)
        } else if (line.startsWith('- ')) {
          processedLine = line.slice(2)
        }
        
        // Apply formatting to the processed content
        processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 700; color: #111;">$1</strong>')
        processedLine = processedLine.replace(/\*(.*?)\*/g, '<em style="font-style: italic; color: #333;">$1</em>')
        processedLine = processedLine.replace(/_(.*?)_/g, '<u style="text-decoration: underline; color: #333;">$1</u>')
        
        // Handle spacing delimiter $|$ - convert to proper spacing
        processedLine = processedLine.replace(/\s*\$\|\$\s*/g, ' &nbsp;&nbsp;|&nbsp;&nbsp; ')
        
        // Process markdown links first - this handles [text](url) format
        processedLine = processedLine.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #111; text-decoration: underline;" target="_blank" rel="noopener noreferrer">$1</a>')
        
        // Then handle any remaining plain URLs that aren't already wrapped in <a> tags
        const parts = processedLine.split(/(<a[^>]*>.*?<\/a>)/g)
        processedLine = parts.map(part => {
          // Skip parts that are already <a> tags
          if (part.startsWith('<a') && part.endsWith('</a>')) {
            return part
          }
          
          // Process plain URLs in the remaining text
          let processed = part
          // Email addresses (process first to avoid conflicts)
          processed = processed.replace(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g, '<a href="mailto:$1" style="color: #111; text-decoration: underline;">$1</a>')
          // Full URLs with protocol
          processed = processed.replace(/(https?:\/\/[^\s<>]+)/g, '<a href="$1" style="color: #111; text-decoration: underline;" target="_blank" rel="noopener noreferrer">$1</a>')
          // Domain paths (like github.com/username) - but avoid already processed emails
          processed = processed.replace(/\b((?:www\.)?[a-zA-Z0-9.-]+\.(?:com|org|net|edu|gov|io|co|in|uk|ca)(?:\/[^\s<>]*)?)\b(?![^<]*<\/a>)/g, '<a href="https://$1" style="color: #111; text-decoration: underline;" target="_blank" rel="noopener noreferrer">$1</a>')
          
          return processed
        }).join('')
      }
      
      // Now apply the appropriate HTML structure based on line type
      
      // Contact info line (first line after name that contains contact details)
      if (isFirstContactLine && line.trim() && (line.includes('•') || line.includes('@') || line.includes('github') || line.includes('linkedin'))) {
        isFirstContactLine = false
        return `<p style="text-align: center; margin-bottom: 0.15rem; font-size: 0.9em; color: #333; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">${processedLine}</p>`
      }
      
      if (line.startsWith('### ')) {
        return `<h3 style="font-size: 1.2em; color: #222; margin-top: 0.25rem; margin-bottom: 0.1rem; font-weight: 600; border-bottom: 1px solid #888; padding-bottom: 0.05rem;">${processedLine}</h3>`
      }
      if (line.startsWith('#### ')) {
        return `<h4 style="font-size: 1.1em; font-weight: 400; color: #333; margin-bottom: 0.05rem; margin-top: 0.08rem;">${processedLine}</h4>`
      }
      
      // Bullets
      if (line.startsWith('- ')) {
        return `<div style="margin: 0 0 0.01rem 1.2rem; position: relative;"><span style="position: absolute; left: -1rem; color: #111; font-weight: bold;">•</span><span style="line-height: 1.3; font-size: 1em; color: #333;">${processedLine}</span></div>`
      }
      
      // Regular paragraphs
      return `<p style="margin: 0 0 0.01rem 0; line-height: 1.2; font-size: 1em; color: #333;">${processedLine}</p>`
    })
    .join('')
}

/**
 * Container styling for preview - matches the profile view preview exactly
 */
export const PREVIEW_CONTAINER_STYLES = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: '14px',
  lineHeight: '1.2',
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