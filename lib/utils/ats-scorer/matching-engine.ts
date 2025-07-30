import { KeywordMatch, SectionInfo } from './types';
import { 
  generateKeywordVariations, 
  normalizeKeyword,
  isNoiseWord,
  getKeywordCategory
} from './keyword-database';

export class MatchingEngine {
  private stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
    'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'will', 'with'
  ]);

  /**
   * Find keyword matches in resume text with intelligent matching (optimized)
   */
  public findMatches(resumeText: string, keywords: string[], sections: SectionInfo[]): KeywordMatch[] {
    if (!resumeText || !keywords || keywords.length === 0) {
      return [];
    }

    const matches: KeywordMatch[] = [];
    const resumeLower = resumeText.toLowerCase();
    
    // Quick optimization: limit keywords to prevent freezing
    const limitedKeywords = keywords.slice(0, 30); // Max 30 keywords to prevent freeze
    
    // Simplified section mappings
    const sectionMappings = this.createSectionMappings(resumeText, sections);

    for (const keyword of limitedKeywords) {
      if (isNoiseWord(keyword)) continue;

      const normalizedKeyword = normalizeKeyword(keyword);
      
      // Fast exact match first
      if (resumeLower.includes(normalizedKeyword.toLowerCase())) {
        const position = resumeLower.indexOf(normalizedKeyword.toLowerCase());
        const section = this.findSectionForPosition(position, sectionMappings);
        
        matches.push({
          keyword,
          matchType: 'exact',
          score: this.calculateMatchScore(keyword, 'exact', section),
          section: section?.name,
          context: this.extractContext(resumeText, normalizedKeyword, position)
        });
        continue;
      }
      
      // Quick variations check
      const variations = generateKeywordVariations(normalizedKeyword);
      let found = false;
      
      for (const variation of variations.slice(0, 3)) { // Limit variations
        if (resumeLower.includes(variation.toLowerCase())) {
          const position = resumeLower.indexOf(variation.toLowerCase());
          const section = this.findSectionForPosition(position, sectionMappings);
          
          matches.push({
            keyword,
            matchType: 'partial',
            score: this.calculateMatchScore(keyword, 'partial', section),
            section: section?.name,
            context: this.extractContext(resumeText, variation, position)
          });
          found = true;
          break;
        }
      }
    }

    return this.deduplicateMatches(matches);
  }

  /**
   * Tokenize text into meaningful words and phrases (optimized for performance)
   */
  private tokenizeText(text: string): string[] {
    // Fast tokenization - just split and clean
    const words = text
      .toLowerCase()
      .replace(/[^\w\s\.\#\+\-\/]/g, ' ') // Keep technical chars
      .split(/\s+/)
      .filter(word => word.length > 0 && !this.stopWords.has(word));

    // Add only essential 2-word phrases (limited set)
    const phrases: string[] = [];
    for (let i = 0; i < Math.min(words.length - 1, 50); i++) { // Limit to first 50 words
      const phrase = `${words[i]} ${words[i + 1]}`;
      if (phrase.length < 30) { // Reasonable phrase length
        phrases.push(phrase);
      }
    }

    return [...words, ...phrases];
  }

  /**
   * Create mappings of text positions to sections (optimized)
   */
  private createSectionMappings(resumeText: string, sections: SectionInfo[]): Map<number, SectionInfo> {
    const mappings = new Map<number, SectionInfo>();
    
    // Simplified: just map section start positions, not every character
    sections.forEach(section => {
      const sectionStart = resumeText.toLowerCase().indexOf(section.content.toLowerCase().substring(0, 50));
      if (sectionStart !== -1) {
        mappings.set(sectionStart, section);
      }
    });

    return mappings;
  }

  /**
   * Find section for a given position (simplified)
   */
  private findSectionForPosition(position: number, sectionMappings: Map<number, SectionInfo>): SectionInfo | undefined {
    // Find the closest section before this position
    let closestSection: SectionInfo | undefined;
    let closestDistance = Infinity;
    
    for (const [sectionPos, section] of sectionMappings) {
      if (sectionPos <= position) {
        const distance = position - sectionPos;
        if (distance < closestDistance) {
          closestDistance = distance;
          closestSection = section;
        }
      }
    }
    
    return closestSection;
  }

  /**
   * Find exact matches including variations
   */
  private findExactMatch(
    keyword: string, 
    variations: string[], 
    resumeWords: Set<string>,
    resumeText: string,
    sectionMappings: Map<number, SectionInfo>
  ): KeywordMatch | null {
    
    // Check each variation
    for (const variation of variations) {
      if (resumeWords.has(variation.toLowerCase())) {
        const position = resumeText.toLowerCase().indexOf(variation.toLowerCase());
        const section = position !== -1 ? sectionMappings.get(position) : undefined;
        
        return {
          keyword,
          matchType: 'exact',
          score: this.calculateMatchScore(keyword, 'exact', section),
          section: section?.name,
          context: this.extractContext(resumeText, variation, position)
        };
      }
    }

    return null;
  }

  /**
   * Find partial matches with fuzzy matching
   */
  private findPartialMatch(
    keyword: string,
    variations: string[],
    resumeText: string,
    sectionMappings: Map<number, SectionInfo>
  ): KeywordMatch | null {
    
    const resumeLower = resumeText.toLowerCase();
    
    for (const variation of variations) {
      const variationLower = variation.toLowerCase();
      
      // Check for substring matches (but avoid false positives)
      if (resumeLower.includes(variationLower) && this.isValidPartialMatch(variationLower, resumeLower)) {
        const position = resumeLower.indexOf(variationLower);
        const section = sectionMappings.get(position);
        
        return {
          keyword,
          matchType: 'partial',
          score: this.calculateMatchScore(keyword, 'partial', section),
          section: section?.name,
          context: this.extractContext(resumeText, variation, position)
        };
      }
    }

    return null;
  }

  /**
   * Find semantic matches using related terms and patterns
   */
  private findSemanticMatch(
    keyword: string,
    resumeText: string,
    sectionMappings: Map<number, SectionInfo>
  ): KeywordMatch | null {
    
    const semanticMappings: Record<string, string[]> = {
      'javascript': ['js', 'ecmascript', 'frontend', 'web development'],
      'python': ['django', 'flask', 'data science', 'machine learning'],
      'react': ['jsx', 'frontend', 'spa', 'component'],
      'aws': ['cloud', 'ec2', 'lambda', 's3', 'amazon'],
      'docker': ['container', 'containerization', 'devops'],
      'kubernetes': ['k8s', 'orchestration', 'devops', 'container'],
      'agile': ['scrum', 'sprint', 'kanban', 'methodology'],
      'machine learning': ['ml', 'ai', 'data science', 'neural networks'],
      'database': ['sql', 'nosql', 'data storage', 'persistence'],
      'api': ['rest', 'graphql', 'endpoint', 'web service'],
      'testing': ['qa', 'unit test', 'integration test', 'automation']
    };

    const keywordLower = keyword.toLowerCase();
    const resumeLower = resumeText.toLowerCase();
    
    if (semanticMappings[keywordLower]) {
      for (const semanticTerm of semanticMappings[keywordLower]) {
        if (resumeLower.includes(semanticTerm)) {
          const position = resumeLower.indexOf(semanticTerm);
          const section = sectionMappings.get(position);
          
          return {
            keyword,
            matchType: 'semantic',
            score: this.calculateMatchScore(keyword, 'semantic', section),
            section: section?.name,
            context: this.extractContext(resumeText, semanticTerm, position)
          };
        }
      }
    }

    return null;
  }

  /**
   * Validate that a partial match is meaningful (not a false positive)
   */
  private isValidPartialMatch(keyword: string, resumeText: string): boolean {
    // Avoid matching very short keywords that could be substrings
    if (keyword.length < 3) return false;

    // Check if the match is at word boundaries
    const keywordRegex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (keywordRegex.test(resumeText)) return true;

    // For technical terms, allow partial matches if they're meaningful
    const technicalKeywords = ['javascript', 'typescript', 'postgresql', 'mongodb'];
    if (technicalKeywords.some(tech => keyword.includes(tech) || tech.includes(keyword))) {
      return true;
    }

    // Avoid false positives like "java" matching "javascript"
    const problematicPairs = [
      ['java', 'javascript'],
      ['script', 'javascript'], 
      ['type', 'typescript'],
      ['react', 'create-react-app']
    ];

    for (const [shorter, longer] of problematicPairs) {
      if (keyword === shorter && resumeText.includes(longer)) {
        // Check if it's actually the longer term
        const longerRegex = new RegExp(`\\b${longer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (longerRegex.test(resumeText)) {
          return false; // It's actually the longer term, not the shorter one
        }
      }
    }

    return true;
  }

  /**
   * Calculate match score based on type and context
   */
  private calculateMatchScore(
    keyword: string, 
    matchType: 'exact' | 'partial' | 'semantic',
    section?: SectionInfo
  ): number {
    const baseScores = {
      exact: 1.0,
      partial: 0.5,
      semantic: 0.7
    };

    let score = baseScores[matchType];
    
    // Apply category weighting
    const category = getKeywordCategory(keyword);
    const categoryMultipliers = {
      technical: 1.0,
      softSkill: 0.6,
      qualification: 0.8,
      jobFunction: 0.5,
      other: 0.2
    };
    
    score *= categoryMultipliers[category] || categoryMultipliers.other;
    
    // Apply section multiplier
    if (section) {
      score *= section.multiplier;
    }

    return score;
  }

  /**
   * Extract context around a match for debugging/display
   */
  private extractContext(text: string, term: string, position: number): string {
    if (position === -1) return '';
    
    const contextRadius = 50;
    const start = Math.max(0, position - contextRadius);
    const end = Math.min(text.length, position + term.length + contextRadius);
    
    return text.substring(start, end).trim();
  }

  /**
   * Remove duplicate matches, keeping the best one for each keyword
   */
  private deduplicateMatches(matches: KeywordMatch[]): KeywordMatch[] {
    const bestMatches = new Map<string, KeywordMatch>();
    
    matches.forEach(match => {
      const existing = bestMatches.get(match.keyword.toLowerCase());
      
      if (!existing || match.score > existing.score) {
        bestMatches.set(match.keyword.toLowerCase(), match);
      }
    });

    return Array.from(bestMatches.values());
  }
}