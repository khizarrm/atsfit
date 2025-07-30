import { SectionInfo } from './types';

// Section patterns and their priority multipliers (from Python backend)
const SECTION_PATTERNS = {
  // High priority technical sections
  'technical skills': { multiplier: 1.6, priority: 10 },
  'technical requirements': { multiplier: 1.6, priority: 10 },
  'technical competencies': { multiplier: 1.6, priority: 10 },
  'skills': { multiplier: 1.4, priority: 9 },
  'core competencies': { multiplier: 1.4, priority: 9 },
  'essential skills': { multiplier: 1.4, priority: 9 },
  
  // High priority requirement sections
  'requirements': { multiplier: 1.5, priority: 8 },
  'qualifications': { multiplier: 1.5, priority: 8 },
  'required skills': { multiplier: 1.6, priority: 8 },
  'minimum qualifications': { multiplier: 1.5, priority: 8 },
  'preferred qualifications': { multiplier: 1.3, priority: 7 },
  'must have': { multiplier: 1.7, priority: 10 },
  'desired skills': { multiplier: 1.3, priority: 7 },
  
  // Experience and responsibilities
  'experience': { multiplier: 1.3, priority: 6 },
  'responsibilities': { multiplier: 1.2, priority: 5 },
  'duties': { multiplier: 1.2, priority: 5 },
  'key responsibilities': { multiplier: 1.2, priority: 5 },
  'position responsibilities': { multiplier: 1.2, priority: 5 },
  
  // Role description sections
  'about the role': { multiplier: 1.1, priority: 4 },
  'role': { multiplier: 1.1, priority: 4 },
  'position': { multiplier: 1.1, priority: 4 },
  'job description': { multiplier: 1.1, priority: 4 },
  'what you will do': { multiplier: 1.1, priority: 4 },
  'what we are looking for': { multiplier: 1.2, priority: 5 },
  
  // Education and certifications
  'education': { multiplier: 1.2, priority: 6 },
  'certifications': { multiplier: 1.3, priority: 7 },
  
  // Soft skills (lower priority)
  'soft skills': { multiplier: 1.1, priority: 3 },
  'abilities': { multiplier: 1.1, priority: 3 },
  'ai-centric abilities': { multiplier: 1.4, priority: 8 }, // Special case for AI roles
  
  // Nice to have (lower priority)
  'nice to have': { multiplier: 1.1, priority: 3 },
  'preferred': { multiplier: 1.1, priority: 3 },
  
  // General sections
  'tasks': { multiplier: 1.0, priority: 2 },
  'general': { multiplier: 1.0, priority: 1 }
};

// Sections to ignore (noise)
const IGNORE_SECTIONS = new Set([
  'benefits', 'compensation', 'salary', 'perks', 'company', 'about us',
  'our company', 'our mission', 'our values', 'culture', 'diversity',
  'equal opportunity', 'privacy', 'legal', 'disclaimer', 'notice',
  'travel', 'location', 'office', 'work environment', 'what we offer',
  'why join us', 'employee benefits', 'health insurance', 'dental',
  'vision', '401k', 'retirement', 'vacation', 'pto', 'holidays',
  'applicant privacy notice', 'employment candidate privacy notice',
  'how to apply', 'application process', 'contact', 'contact us'
]);

export class SectionParser {
  private sectionPatterns: Map<RegExp, { name: string; multiplier: number; priority: number }>;

  constructor() {
    this.sectionPatterns = new Map();
    this.initializeSectionPatterns();
  }

  private initializeSectionPatterns(): void {
    // Create regex patterns for each section
    Object.entries(SECTION_PATTERNS).forEach(([sectionName, config]) => {
      // Create flexible regex patterns
      const patterns = [
        // Exact match with optional punctuation
        new RegExp(`^\\s*${this.escapeRegex(sectionName)}\\s*[:\\-]?\\s*$`, 'i'),
        // Match with "and" or "&"
        new RegExp(`^\\s*${this.escapeRegex(sectionName)}\\s*(?:and|&)\\s*\\w+\\s*[:\\-]?\\s*$`, 'i'),
        // Match as part of larger heading
        new RegExp(`^\\s*(?:key\\s+|required\\s+|essential\\s+)?${this.escapeRegex(sectionName)}(?:\\s*requirements?)?\\s*[:\\-]?\\s*$`, 'i')
      ];

      patterns.forEach(pattern => {
        this.sectionPatterns.set(pattern, {
          name: sectionName,
          multiplier: config.multiplier,
          priority: config.priority
        });
      });
    });
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  public parseSections(text: string): SectionInfo[] {
    const sections: SectionInfo[] = [];
    const lines = text.split('\n');
    
    let currentSection: SectionInfo = {
      name: 'general',
      content: '',
      multiplier: 1.0,
      priority: 1
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) continue;

      // Check if this line is a section header
      const sectionMatch = this.identifySectionHeader(line);
      
      if (sectionMatch && !IGNORE_SECTIONS.has(sectionMatch.name)) {
        // Save previous section if it has content
        if (currentSection.content.trim()) {
          sections.push({ ...currentSection });
        }

        // Start new section
        currentSection = {
          name: sectionMatch.name,
          content: '',
          multiplier: sectionMatch.multiplier,
          priority: sectionMatch.priority
        };
      } else if (!this.isLikelyNoise(line)) {
        // Add content to current section
        currentSection.content += (currentSection.content ? '\n' : '') + line;
      }
    }

    // Add the last section
    if (currentSection.content.trim()) {
      sections.push(currentSection);
    }

    // If no sections were identified, treat everything as general
    if (sections.length === 0) {
      sections.push({
        name: 'general',
        content: text,
        multiplier: 1.0,
        priority: 1
      });
    }

    return sections;
  }

  private identifySectionHeader(line: string): { name: string; multiplier: number; priority: number } | null {
    // Check against all section patterns
    for (const [pattern, config] of this.sectionPatterns) {
      if (pattern.test(line)) {
        return config;
      }
    }

    // Additional heuristics for section headers
    if (this.looksLikeSectionHeader(line)) {
      // Try to extract meaningful section name
      const cleanedLine = line.replace(/[:\-\*\#\•]+/g, '').trim().toLowerCase();
      
      // Check if it matches any known patterns loosely
      for (const [sectionName, config] of Object.entries(SECTION_PATTERNS)) {
        if (cleanedLine.includes(sectionName.replace(/\s+/g, '')) || 
            sectionName.includes(cleanedLine.replace(/\s+/g, ''))) {
          return {
            name: sectionName,
            multiplier: config.multiplier,
            priority: config.priority
          };
        }
      }

      // Default for unrecognized headers
      return {
        name: 'general',
        multiplier: 1.0,
        priority: 1
      };
    }

    return null;
  }

  private looksLikeSectionHeader(line: string): boolean {
    // Heuristics to identify section headers
    const trimmed = line.trim();
    
    // Short lines with special characters at the end
    if (trimmed.length < 50 && /[:\-\*\#\•]$/.test(trimmed)) {
      return true;
    }

    // All caps short lines
    if (trimmed.length < 30 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
      return true;
    }

    // Lines with markdown-style headers
    if (/^#+\s/.test(trimmed)) {
      return true;
    }

    // Lines that are bold in common formats
    if (/^\*\*.*\*\*$/.test(trimmed) || /^__.*__$/.test(trimmed)) {
      return true;
    }

    return false;
  }

  private isLikelyNoise(line: string): boolean {
    const trimmed = line.trim().toLowerCase();
    
    // Very short lines (likely formatting)
    if (trimmed.length < 3) return true;
    
    // Lines that are just punctuation or numbers
    if (/^[\d\s\-\*\#\•:\.\,\(\)]+$/.test(trimmed)) return true;
    
    // Common noise patterns
    const noisePatterns = [
      /^page \d+ of \d+$/,
      /^confidential$/,
      /^internal use only$/,
      /^draft$/,
      /^version \d+/,
      /^updated:/,
      /^effective date:/,
      /^\d{1,2}\/\d{1,2}\/\d{4}$/, // dates
      /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/, // emails
      /^https?:\/\//, // URLs
      /^www\./, // URLs without protocol
    ];

    return noisePatterns.some(pattern => pattern.test(trimmed));
  }

  public getSectionMultiplier(sectionName: string): number {
    const normalizedName = sectionName.toLowerCase();
    return SECTION_PATTERNS[normalizedName]?.multiplier || 1.0;
  }

  public getSectionPriority(sectionName: string): number {
    const normalizedName = sectionName.toLowerCase();
    return SECTION_PATTERNS[normalizedName]?.priority || 1;
  }

  public isNoiseSection(sectionName: string): boolean {
    return IGNORE_SECTIONS.has(sectionName.toLowerCase());
  }
}