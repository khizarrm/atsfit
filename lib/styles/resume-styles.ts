import { ResumeStyles } from '../types/pdf'

export const DEFAULT_RESUME_STYLES: ResumeStyles = {
  fontFamily: 'Georgia, "Helvetica Neue", Helvetica, Arial, sans-serif',
  fontSize: '14px',
  lineHeight: '1.4',
  colors: {
    primary: '#222',
    secondary: '#333',
    text: '#111',
    border: '#888',
    background: '#fff'
  },
  spacing: {
    margin: '0.5in',
    padding: '0.2rem',
    sectionGap: '0.4rem'
  }
}

export function generateResumeCSS(styles: ResumeStyles = DEFAULT_RESUME_STYLES): string {
  return `
/* ========== Core Document ========== */
.pdf-content {
  font-family: ${styles.fontFamily};
  font-size: ${styles.fontSize};
  line-height: ${styles.lineHeight};
  margin: ${styles.spacing.margin} auto;
  max-width: 6in;
  color: ${styles.colors.text};
  background: ${styles.colors.background};
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ========== Headings ========== */
.pdf-content h1, .pdf-content h2, .pdf-content h3, .pdf-content h4 {
  margin: 0 0 ${styles.spacing.padding} 0;
  line-height: 1.0;
  font-weight: bold;
  color: ${styles.colors.primary};
  page-break-after: avoid;
}

.pdf-content h1 {
  font-size: 1.8em;
  text-align: center;
  margin-bottom: 0.3rem;
  font-weight: bold;
}

.pdf-content h2 {
  font-size: 1.4em;
  color: ${styles.colors.secondary};
  margin-top: ${styles.spacing.sectionGap};
  margin-bottom: 0.2rem;
  font-weight: bold;
}

.pdf-content h3 {
  font-size: 1.2em;
  font-weight: 600;
  color: ${styles.colors.secondary};
  margin-bottom: 0.15rem;
  border-bottom: 1px solid ${styles.colors.border};
  padding-bottom: 0.1rem;
}

.pdf-content h4 {
  font-size: 1.1em;
  font-weight: 500;
  color: ${styles.colors.secondary};
  margin-bottom: 0.1rem;
}

/* ========== Contact Line (Pure Markdown) ========== */
.pdf-content h1 + p {
  text-align: center;
  font-size: 1em;
  font-weight: 400;
  margin: 0.1rem 0 0.2rem 0;
  color: ${styles.colors.primary};
  line-height: 1.3;
  letter-spacing: 0.02em;
  border-bottom: 1px solid ${styles.colors.border};
  padding-bottom: 0.3rem;
}

.pdf-content h1 + p a {
  color: ${styles.colors.primary};
  text-decoration: none;
  font-weight: 400;
}

.pdf-content h1 + p a:hover {
  text-decoration: underline;
}

/* ========== Paragraphs & Lists ========== */
.pdf-content p, .pdf-content ul, .pdf-content ol {
  margin: 0 0 0.2rem 0;
  orphans: 3;
  widows: 3;
}

.pdf-content ul, .pdf-content ol {
  padding-left: 1.2rem;
  margin-bottom: 0.1rem;
}

.pdf-content li {
  margin-bottom: 0.1rem;
  page-break-inside: avoid;
  line-height: 1.4;
}

.pdf-content ul li::marker {
  content: "• ";
  font-weight: bold;
  color: ${styles.colors.primary};
  font-size: 1em;
}

/* ========== Horizontal Rules ========== */
.pdf-content hr {
  display: none;
}

/* ========== Bold and Italic ========== */
.pdf-content strong, .pdf-content b {
  font-weight: 600;
}

.pdf-content em, .pdf-content i {
  font-style: italic;
}

/* ========== Page-break Hygiene ========== */
.pdf-content .section, 
.pdf-content h2, 
.pdf-content h3 {
  page-break-inside: avoid;
}

.pdf-content hr {
  page-break-inside: avoid;
  page-break-after: avoid;
}

/* ========== Print optimizations ========== */
@media print {
  .pdf-content {
    margin: 0;
    max-width: none;
  }
  
  .pdf-content h1, .pdf-content h2, .pdf-content h3 {
    page-break-after: avoid;
  }
  
  .pdf-content p, .pdf-content li {
    orphans: 3;
    widows: 3;
  }
}

.pdf-content {
  color-adjust: exact;
  -webkit-print-color-adjust: exact;
}

.pdf-content a {
  color: inherit;
  text-decoration: underline;
}
`
}

export const ATS_FRIENDLY_STYLES: ResumeStyles = {
  fontFamily: 'Arial, sans-serif',
  fontSize: '13px',
  lineHeight: '1.3',
  colors: {
    primary: '#000000',
    secondary: '#000000',
    text: '#000000',
    border: '#000000',
    background: '#ffffff'
  },
  spacing: {
    margin: '0.5in',
    padding: '0.15rem',
    sectionGap: '0.3rem'
  }
}

export function generateATSFriendlyCSS(styles: ResumeStyles = ATS_FRIENDLY_STYLES): string {
  return `
/* ========== ATS-Friendly Simple Styles ========== */
.pdf-content {
  font-family: ${styles.fontFamily};
  font-size: ${styles.fontSize};
  line-height: ${styles.lineHeight};
  margin: ${styles.spacing.margin} auto;
  max-width: 7.5in;
  color: ${styles.colors.text};
  background: ${styles.colors.background};
}

.pdf-content h1 {
  font-size: 1.6em;
  text-align: center;
  margin: 0 0 0.3rem 0;
  font-weight: bold;
  color: ${styles.colors.primary};
}

.pdf-content h2 {
  font-size: 1.2em;
  margin: 0.4rem 0 0.15rem 0;
  font-weight: bold;
  color: ${styles.colors.primary};
}

.pdf-content h3 {
  font-size: 1.1em;
  margin: 0.3rem 0 0.1rem 0;
  font-weight: bold;
  color: ${styles.colors.primary};
  border-bottom: 1px solid #ccc;
  padding-bottom: 0.05rem;
}

.pdf-content h4 {
  font-size: 1em;
  margin: 0.2rem 0 0.1rem 0;
  font-weight: bold;
  color: ${styles.colors.primary};
}

.pdf-content p {
  margin: 0 0 0.15rem 0;
  line-height: ${styles.lineHeight};
}

.pdf-content ul, .pdf-content ol {
  margin: 0 0 0.15rem 0;
  padding-left: 1.2rem;
}

.pdf-content li {
  margin-bottom: 0.08rem;
  line-height: ${styles.lineHeight};
}

.pdf-content ul li::marker {
  content: "• ";
  font-weight: bold;
  color: ${styles.colors.primary};
}

.pdf-content strong, .pdf-content b {
  font-weight: bold;
}

.pdf-content em, .pdf-content i {
  font-style: italic;
}

.pdf-content a {
  color: ${styles.colors.text};
  text-decoration: none;
}

/* Contact info after h1 */
.pdf-content h1 + p {
  text-align: center;
  font-size: ${styles.fontSize};
  margin: 0.1rem 0 0.2rem 0;
  font-weight: normal;
  border-bottom: 1px solid #ccc;
  padding-bottom: 0.2rem;
}

/* Remove all decorative elements except section dividers */
.pdf-content hr {
  display: none;
}

/* Remove background colors and borders except section dividers */
.pdf-content * {
  background: transparent !important;
  box-shadow: none !important;
}
`
}