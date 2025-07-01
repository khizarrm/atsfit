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
        return `<h1 style="font-size: 1.4em; text-transform: uppercase; text-align: center; letter-spacing: 0.02em; border-bottom: 1px solid #999; padding-bottom: 0.05rem; margin-bottom: 0.05rem; font-weight: 700; color: #111;">${line.slice(2)}</h1>`
      }
      
      // Contact info line (first line after name that contains contact details)
      if (isFirstContactLine && line.trim() && (line.includes('•') || line.includes('@') || line.includes('github'))) {
        isFirstContactLine = false
        return `<p style="text-align: center; margin-bottom: 0.1rem; font-size: 0.85em; color: #333; line-height: 1.2;">${line}</p>`
      }
      
      if (line.startsWith('### ')) {
        return `<h3 style="font-size: 0.95em; color: #222; margin-top: 0.3rem; margin-bottom: 0.1rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em;">${line.slice(4)}</h3>`
      }
      if (line.startsWith('#### ')) {
        return `<h4 style="font-size: 0.85em; font-weight: 600; color: #333; margin-bottom: 0.05rem; margin-top: 0.1rem;">${line.slice(5)}</h4>`
      }
      
      // Horizontal rule
      if (line.trim() === '---') {
        return '<hr style="border: none; border-top: 1px solid #ccc; margin: 0.5rem 0 0.2rem; clear: both;" />'
      }
      
      // Bullets
      if (line.startsWith('- ')) {
        return `<ul style="margin: 0 0 0.05rem 0; padding-left: 0.7rem;"><li style="margin-bottom: 0.02rem; line-height: 1.1; font-size: 0.85em;">${line.slice(2)}</li></ul>`
      }
      
      // Bold and italic - ensure ** bold works properly
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 700; color: #111;">$1</strong>')
      line = line.replace(/\*(.*?)\*/g, '<em style="font-style: italic; color: #333;">$1</em>')
      
      // Links
      line = line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #111; text-decoration: underline;">$1</a>')
      
      // Empty lines
      if (line.trim() === '') {
        return '<div style="margin: 0.05rem 0;"></div>'
      }
      
      // Regular paragraphs - make more compact
      return `<p style="margin-bottom: 0.05rem; line-height: 1.2; font-size: 0.85em; color: #333;">${line}</p>`
    })
    .join('')
}

/**
 * Container styling for preview - matches the profile view preview exactly
 */
export const PREVIEW_CONTAINER_STYLES = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: '10px',
  lineHeight: '1.2',
  color: '#111',
  backgroundColor: '#ffffff',
  padding: '20px',
  minHeight: '400px',
  width: '100%',
  maxWidth: '800px'
} as const