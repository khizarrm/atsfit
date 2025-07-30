// Enhanced ATS Scorer - Main Interface
// Replaces the basic ats-scorer.ts with sophisticated scoring system

import { SectionParser } from './section-parser';
import { MatchingEngine } from './matching-engine';
import { ScoringEngine } from './scoring-engine';
import { EnhancedAtsScoreResult } from './types';

export class EnhancedAtsScorer {
  private sectionParser: SectionParser;
  private matchingEngine: MatchingEngine;
  private scoringEngine: ScoringEngine;

  constructor() {
    this.sectionParser = new SectionParser();
    this.matchingEngine = new MatchingEngine();
    this.scoringEngine = new ScoringEngine();
  }

  /**
   * Calculate comprehensive ATS score with advanced matching and scoring (with timeout protection)
   */
  public async calculateScore(resumeText: string, keywords: string[]): Promise<EnhancedAtsScoreResult> {
    if (!resumeText || !keywords || keywords.length === 0) {
      return this.createEmptyResult(keywords);
    }

    const controller = new AbortController();
    const TIMEOUT_MS = 5000; // 5 second timeout
    
    // Set up timeout with AbortController
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, TIMEOUT_MS);

    try {
      // Parse resume into sections (with length limits)
      const limitedResumeText = resumeText.substring(0, 10000); // Max 10k chars
      const sections = await this.sectionParser.parseSections(limitedResumeText, { signal: controller.signal });

      // Check if operation was aborted
      if (controller.signal.aborted) {
        throw new Error('ATS scoring timeout during section parsing');
      }

      // Find keyword matches with intelligent matching
      const matches = await this.matchingEngine.findMatches(limitedResumeText, keywords, sections, { signal: controller.signal });

      // Check if operation was aborted
      if (controller.signal.aborted) {
        throw new Error('ATS scoring timeout during matching');
      }

      // Calculate final score with multi-dimensional algorithm
      const result = await this.scoringEngine.calculateScore(limitedResumeText, keywords, sections, matches, { signal: controller.signal });

      return result;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('ATS scoring timeout:', error);
        return this.createErrorResult(keywords, new Error('ATS scoring timeout - resume too complex'));
      }
      console.error('Error in enhanced ATS scoring:', error);
      return this.createErrorResult(keywords, error);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private createEmptyResult(keywords: string[]): EnhancedAtsScoreResult {
    return {
      score: 0,
      totalKeywords: keywords?.length || 0,
      matchedKeywords: [],
      missingKeywords: keywords || [],
      partialMatches: [],
      recommendations: ["Please provide both resume content and keywords"],
      breakdown: {
        exactMatches: 0,
        partialMatches: 0,
        semanticMatches: 0,
        sectionBonuses: 0,
        categoryBonuses: 0
      },
      keywordDensity: 0,
      sectionsDetected: []
    };
  }

  private createErrorResult(keywords: string[], error: any): EnhancedAtsScoreResult {
    return {
      score: 0,
      totalKeywords: keywords?.length || 0,
      matchedKeywords: [],
      missingKeywords: keywords || [],
      partialMatches: [],
      recommendations: [`Error calculating score: ${error?.message || 'Unknown error'}`],
      breakdown: {
        exactMatches: 0,
        partialMatches: 0,
        semanticMatches: 0,
        sectionBonuses: 0,
        categoryBonuses: 0
      },
      keywordDensity: 0,
      sectionsDetected: []
    };
  }
}

// Main function for backward compatibility with existing code
export async function calculateEnhancedAtsScore(resumeText: string, keywords: string[]): Promise<EnhancedAtsScoreResult> {
  const scorer = new EnhancedAtsScorer();
  return await scorer.calculateScore(resumeText, keywords);
}

// Legacy interface for backward compatibility
export interface AtsScoreResult {
  score: number;
  totalKeywords: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  partialMatches: string[];
  recommendations: string[];
}

// Legacy function that converts enhanced result to simple format
export async function calculateAtsScore(resumeText: string, keywords: string[]): Promise<AtsScoreResult> {
  const enhancedResult = await calculateEnhancedAtsScore(resumeText, keywords);
  
  return {
    score: enhancedResult.score,
    totalKeywords: enhancedResult.totalKeywords,
    matchedKeywords: enhancedResult.matchedKeywords.map(m => m.keyword),
    missingKeywords: enhancedResult.missingKeywords,
    partialMatches: enhancedResult.partialMatches.map(m => m.keyword),
    recommendations: enhancedResult.recommendations
  };
}

// Export types for external use
export type { EnhancedAtsScoreResult, KeywordMatch, SectionInfo } from './types';

// Export individual components for advanced usage
export { SectionParser } from './section-parser';
export { MatchingEngine } from './matching-engine';
export { ScoringEngine } from './scoring-engine';
export * from './keyword-database';