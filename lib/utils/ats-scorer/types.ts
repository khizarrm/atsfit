// Type definitions for the enhanced ATS scoring system

export interface KeywordMatch {
  keyword: string;
  matchType: 'exact' | 'partial' | 'semantic';
  score: number;
  section?: string;
  context?: string;
}

export interface SectionInfo {
  name: string;
  content: string;
  multiplier: number;
  priority: number;
}

export interface CategoryScores {
  technical: number;
  softSkill: number;
  qualification: number;
  jobFunction: number;
  other: number;
}

export interface ScoringWeights {
  exactMatch: number;
  partialMatch: number;
  semanticMatch: number;
  categoryWeights: CategoryScores;
  sectionMultipliers: Record<string, number>;
  bonusScores: Record<string, number>;
}

export interface EnhancedAtsScoreResult {
  score: number; // 0-100
  totalKeywords: number;
  matchedKeywords: KeywordMatch[];
  missingKeywords: string[];
  partialMatches: KeywordMatch[];
  recommendations: string[];
  breakdown: {
    exactMatches: number;
    partialMatches: number;
    semanticMatches: number;
    sectionBonuses: number;
    categoryBonuses: number;
  };
  keywordDensity: number;
  sectionsDetected: string[];
}

export type KeywordCategory = 'technical' | 'softSkill' | 'qualification' | 'jobFunction' | 'other';

export interface NormalizedKeyword {
  original: string;
  normalized: string;
  category: KeywordCategory;
  variations: string[];
  baseScore: number;
}