import { 
  KeywordMatch, 
  SectionInfo, 
  EnhancedAtsScoreResult, 
  ScoringWeights,
  CategoryScores 
} from './types';
import { 
  getKeywordCategory, 
  isNoiseWord,
  PROGRAMMING_LANGUAGES,
  AI_ML_TECHNOLOGIES,
  CLOUD_PLATFORMS
} from './keyword-database';

export class ScoringEngine {
  private readonly weights: ScoringWeights;

  constructor() {
    this.weights = {
      exactMatch: 1.0,
      partialMatch: 0.5,
      semanticMatch: 0.7,
      categoryWeights: {
        technical: 10,      // Highest priority for ATS
        softSkill: 6,       // Medium-high priority
        qualification: 8,   // High priority
        jobFunction: 5,     // Medium priority
        other: 2           // Low priority
      },
      sectionMultipliers: {
        'technical skills': 1.6,
        'technical requirements': 1.6,
        'requirements': 1.5,
        'qualifications': 1.5,
        'skills': 1.4,
        'must have': 1.7,
        'required skills': 1.6,
        'experience': 1.3,
        'responsibilities': 1.2,
        'general': 1.0
      },
      bonusScores: {
        programming_language: 3,
        ai_ml: 4,
        cloud: 3,
        framework: 2,
        database: 2,
        devops: 3,
        security: 2
      }
    };
  }

  public calculateScore(
    resumeText: string,
    keywords: string[],
    sections: SectionInfo[],
    matches: KeywordMatch[]
  ): EnhancedAtsScoreResult {
    if (!resumeText || !keywords || keywords.length === 0) {
      return this.createEmptyResult(keywords);
    }

    // Categorize matches
    const exactMatches = matches.filter(m => m.matchType === 'exact');
    const partialMatches = matches.filter(m => m.matchType === 'partial');
    const semanticMatches = matches.filter(m => m.matchType === 'semantic');

    // Calculate base scores
    const exactScore = this.calculateCategoryScore(exactMatches, this.weights.exactMatch);
    const partialScore = this.calculateCategoryScore(partialMatches, this.weights.partialMatch);
    const semanticScore = this.calculateCategoryScore(semanticMatches, this.weights.semanticMatch);

    const baseScore = exactScore + partialScore + semanticScore;

    // Calculate bonuses
    const sectionBonus = this.calculateSectionBonus(matches, sections);
    const categoryBonus = this.calculateCategoryBonus(matches);
    const densityBonus = this.calculateDensityBonus(resumeText, matches);
    const lengthBonus = this.calculateLengthBonus(matches);

    // Calculate total possible score
    const totalPossibleScore = keywords.length * this.weights.categoryWeights.technical * this.weights.exactMatch;

    // Calculate percentage score
    let finalScore = ((baseScore + sectionBonus + categoryBonus) / totalPossibleScore) * 100;
    
    // Apply density and length bonuses
    finalScore = finalScore * (1 + densityBonus + lengthBonus);

    // Cap at 100
    finalScore = Math.min(finalScore, 100);

    // Get missing keywords
    const matchedKeywordSet = new Set(matches.map(m => m.keyword.toLowerCase()));
    const missingKeywords = keywords.filter(k => !matchedKeywordSet.has(k.toLowerCase()));

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      score: finalScore,
      exactMatches,
      partialMatches,
      semanticMatches,
      missingKeywords,
      sections,
      keywordDensity: this.calculateKeywordDensity(resumeText, matches)
    });

    return {
      score: Math.round(finalScore),
      totalKeywords: keywords.length,
      matchedKeywords: [...exactMatches, ...semanticMatches],
      missingKeywords,
      partialMatches,
      recommendations,
      breakdown: {
        exactMatches: exactScore,
        partialMatches: partialScore,
        semanticMatches: semanticScore,
        sectionBonuses: sectionBonus,
        categoryBonuses: categoryBonus
      },
      keywordDensity: this.calculateKeywordDensity(resumeText, matches),
      sectionsDetected: sections.map(s => s.name)
    };
  }

  private calculateCategoryScore(matches: KeywordMatch[], matchWeight: number): number {
    return matches.reduce((total, match) => {
      const category = getKeywordCategory(match.keyword);
      const categoryWeight = this.weights.categoryWeights[category] || this.weights.categoryWeights.other;
      return total + (categoryWeight * matchWeight);
    }, 0);
  }

  private calculateSectionBonus(matches: KeywordMatch[], sections: SectionInfo[]): number {
    let bonus = 0;
    
    matches.forEach(match => {
      if (match.section) {
        const section = sections.find(s => s.name === match.section);
        if (section) {
          const baseScore = this.getKeywordBaseScore(match.keyword);
          bonus += baseScore * (section.multiplier - 1.0); // Only count the bonus portion
        }
      }
    });

    return bonus;
  }

  private calculateCategoryBonus(matches: KeywordMatch[]): number {
    let bonus = 0;

    matches.forEach(match => {
      const keyword = match.keyword.toLowerCase();
      
      // Programming language bonus
      if (PROGRAMMING_LANGUAGES.has(keyword)) {
        bonus += this.weights.bonusScores.programming_language;
      }
      
      // AI/ML technology bonus
      if (AI_ML_TECHNOLOGIES.has(keyword)) {
        bonus += this.weights.bonusScores.ai_ml;
      }
      
      // Cloud platform bonus  
      if (CLOUD_PLATFORMS.has(keyword)) {
        bonus += this.weights.bonusScores.cloud;
      }
      
      // Framework/library patterns
      const frameworkIndicators = ['js', 'react', 'angular', 'vue', 'django', 'flask', 'spring'];
      if (frameworkIndicators.some(indicator => keyword.includes(indicator))) {
        bonus += this.weights.bonusScores.framework;
      }
      
      // Database indicators
      const dbIndicators = ['sql', 'database', 'db', 'mongo', 'redis', 'elastic'];
      if (dbIndicators.some(indicator => keyword.includes(indicator))) {
        bonus += this.weights.bonusScores.database;
      }
      
      // DevOps indicators
      const devopsIndicators = ['docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd'];
      if (devopsIndicators.some(indicator => keyword.includes(indicator))) {
        bonus += this.weights.bonusScores.devops;
      }
      
      // Security indicators
      const securityIndicators = ['security', 'auth', 'ssl', 'encryption', 'firewall'];
      if (securityIndicators.some(indicator => keyword.includes(indicator))) {
        bonus += this.weights.bonusScores.security;
      }
    });

    return bonus;
  }

  private calculateDensityBonus(resumeText: string, matches: KeywordMatch[]): number {
    const keywordDensity = this.calculateKeywordDensity(resumeText, matches);
    
    // Ideal keyword density is 1-5%
    if (keywordDensity >= 0.01 && keywordDensity <= 0.05) {
      return 0.1; // 10% bonus
    }
    // Acceptable density is 0.5-7%
    if (keywordDensity >= 0.005 && keywordDensity <= 0.07) {
      return 0.05; // 5% bonus
    }
    
    return 0;
  }

  private calculateLengthBonus(matches: KeywordMatch[]): number {
    let bonus = 0;
    
    matches.forEach(match => {
      const length = match.keyword.length;
      if (length >= 3 && length <= 20) {
        bonus += 0.5; // Small bonus for reasonable length terms
      } else if (length >= 21 && length <= 30) {
        bonus += 0.2; // Smaller bonus for longer terms
      }
    });

    return bonus / 100; // Convert to percentage bonus
  }

  private calculateKeywordDensity(resumeText: string, matches: KeywordMatch[]): number {
    const totalWords = resumeText.toLowerCase().split(/\s+/).length;
    if (totalWords === 0) return 0;
    
    const uniqueMatches = new Set(matches.map(m => m.keyword.toLowerCase()));
    return uniqueMatches.size / totalWords;
  }

  private getKeywordBaseScore(keyword: string): number {
    const category = getKeywordCategory(keyword);
    return this.weights.categoryWeights[category] || this.weights.categoryWeights.other;
  }

  private generateRecommendations(data: {
    score: number;
    exactMatches: KeywordMatch[];
    partialMatches: KeywordMatch[];
    semanticMatches: KeywordMatch[];
    missingKeywords: string[];
    sections: SectionInfo[];
    keywordDensity: number;
  }): string[] {
    const recommendations: string[] = [];

    // Score-based recommendations
    if (data.score < 30) {
      recommendations.push("Your resume needs significant improvement to match this job posting");
    } else if (data.score < 60) {
      recommendations.push("Your resume has potential but needs optimization for better ATS performance");
    } else if (data.score < 80) {
      recommendations.push("Good foundation! A few tweaks will significantly improve your ATS score");
    } else {
      recommendations.push("Excellent! Your resume is well-optimized for ATS systems");
    }

    // Missing keywords recommendations
    if (data.missingKeywords.length > 0) {
      const topMissing = data.missingKeywords
        .filter(k => !isNoiseWord(k))
        .slice(0, 5);
      if (topMissing.length > 0) {
        recommendations.push(`Add these important keywords: ${topMissing.join(", ")}`);
      }
    }

    // Partial matches recommendations
    if (data.partialMatches.length > 0) {
      const topPartial = data.partialMatches.slice(0, 3).map(m => m.keyword);
      recommendations.push(`Consider using exact terms: ${topPartial.join(", ")}`);
    }

    // Section-based recommendations
    const hasSkillsSection = data.sections.some(s => 
      s.name.includes('skill') || s.name.includes('technical')
    );
    const hasExperienceSection = data.sections.some(s => 
      s.name.includes('experience') || s.name.includes('work')
    );

    if (!hasSkillsSection) {
      recommendations.push("Add a dedicated 'Skills' or 'Technical Skills' section");
    }

    if (!hasExperienceSection) {
      recommendations.push("Ensure your work experience section uses relevant keywords");
    }

    // Density recommendations
    if (data.keywordDensity < 0.005) {
      recommendations.push("Your resume could benefit from more relevant keywords");
    } else if (data.keywordDensity > 0.07) {
      recommendations.push("Avoid keyword stuffing - use keywords naturally in context");
    }

    // Positive reinforcement
    if (data.exactMatches.length > 0) {
      const topMatches = data.exactMatches.slice(0, 3).map(m => m.keyword);
      recommendations.push(`Great job including: ${topMatches.join(", ")}`);
    }

    return recommendations;
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
}