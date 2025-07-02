export interface AtsScoreResult {
  score: number; // 0-100
  totalKeywords: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  partialMatches: string[];
  recommendations: string[];
}

export function calculateAtsScore(resumeMd: string, keywords: string[]): AtsScoreResult {
  if (!resumeMd || !keywords || keywords.length === 0) {
    return {
      score: 0,
      totalKeywords: 0,
      matchedKeywords: [],
      missingKeywords: keywords || [],
      partialMatches: [],
      recommendations: ["Please provide both resume content and keywords"]
    };
  }

  // Normalize resume text for better matching
  const resumeText = resumeMd.toLowerCase();
  
  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];
  const partialMatches: string[] = [];

  // Check each keyword against the resume
  keywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase();
    
    // Exact match (full keyword appears in resume)
    if (resumeText.includes(keywordLower)) {
      matchedKeywords.push(keyword);
    }
    // Partial match (check for word variations)
    else if (checkPartialMatch(resumeText, keywordLower)) {
      partialMatches.push(keyword);
    }
    // No match
    else {
      missingKeywords.push(keyword);
    }
  });

  // Calculate base score
  const exactMatchWeight = 1.0;
  const partialMatchWeight = 0.5;
  
  const exactMatchScore = matchedKeywords.length * exactMatchWeight;
  const partialMatchScore = partialMatches.length * partialMatchWeight;
  const totalPossibleScore = keywords.length * exactMatchWeight;
  
  let baseScore = ((exactMatchScore + partialMatchScore) / totalPossibleScore) * 100;
  
  // Apply bonus factors
  let bonusMultiplier = 1.0;
  
  // Bonus for having a good keyword density (not too sparse, not keyword stuffed)
  const keywordDensity = (matchedKeywords.length + partialMatches.length) / resumeText.split(' ').length;
  if (keywordDensity >= 0.01 && keywordDensity <= 0.05) { // 1-5% keyword density is ideal
    bonusMultiplier += 0.1;
  }
  
  // Bonus for having keywords in important sections (if detectable)
  const hasSkillsSection = /skills?|technical|technologies|tools/i.test(resumeMd);
  const hasExperienceSection = /experience|work|employment|professional/i.test(resumeMd);
  
  if (hasSkillsSection) bonusMultiplier += 0.05;
  if (hasExperienceSection) bonusMultiplier += 0.05;
  
  // Apply bonus and cap at 100
  const finalScore = Math.min(baseScore * bonusMultiplier, 100);
  
  // Generate recommendations
  const recommendations = generateRecommendations({
    matchedKeywords,
    missingKeywords,
    partialMatches,
    score: finalScore,
    hasSkillsSection,
    hasExperienceSection
  });

  const result: AtsScoreResult = {
    score: Math.round(finalScore),
    totalKeywords: keywords.length,
    matchedKeywords,
    missingKeywords,
    partialMatches,
    recommendations
  };

  return result;
}

function checkPartialMatch(resumeText: string, keyword: string): boolean {
  // Check for common variations and related terms
  const variations = generateKeywordVariations(keyword);
  
  return variations.some(variation => resumeText.includes(variation));
}

function generateKeywordVariations(keyword: string): string[] {
  const variations: string[] = [keyword];
  
  // Add common variations
  const commonVariations: Record<string, string[]> = {
    'javascript': ['js', 'node.js', 'nodejs'],
    'typescript': ['ts'],
    'python': ['py'],
    'react': ['reactjs', 'react.js'],
    'angular': ['angularjs', 'angular.js'],
    'vue': ['vuejs', 'vue.js'],
    'aws': ['amazon web services'],
    'gcp': ['google cloud platform'],
    'azure': ['microsoft azure'],
    'postgresql': ['postgres'],
    'mongodb': ['mongo'],
    'mysql': ['my sql'],
    'docker': ['containerization'],
    'kubernetes': ['k8s'],
    'jenkins': ['ci/cd'],
    'git': ['version control'],
    'agile': ['scrum'],
    'machine learning': ['ml', 'artificial intelligence', 'ai'],
    'artificial intelligence': ['ai', 'machine learning', 'ml'],
    'devops': ['dev ops'],
    'rest api': ['restful', 'api'],
    'graphql': ['graph ql'],
    'sql': ['database'],
    'nosql': ['no sql']
  };

  const keywordLower = keyword.toLowerCase();
  if (commonVariations[keywordLower]) {
    variations.push(...commonVariations[keywordLower]);
  }

  // Add plural/singular variations
  if (keyword.endsWith('s')) {
    variations.push(keyword.slice(0, -1)); // Remove 's'
  } else {
    variations.push(keyword + 's'); // Add 's'
  }

  return variations;
}

function generateRecommendations(data: {
  matchedKeywords: string[];
  missingKeywords: string[];
  partialMatches: string[];
  score: number;
  hasSkillsSection: boolean;
  hasExperienceSection: boolean;
}): string[] {
  const recommendations: string[] = [];

  if (data.score < 30) {
    recommendations.push("Your resume needs significant improvement to match this job posting");
  } else if (data.score < 60) {
    recommendations.push("Your resume has potential but needs optimization for better ATS performance");
  } else if (data.score < 80) {
    recommendations.push("Good foundation! A few tweaks will significantly improve your ATS score");
  } else {
    recommendations.push("Excellent! Your resume is well-optimized for ATS systems");
  }

  if (data.missingKeywords.length > 0) {
    recommendations.push(`Add these important keywords: ${data.missingKeywords.slice(0, 5).join(", ")}`);
  }

  if (data.partialMatches.length > 0) {
    recommendations.push(`Consider using exact terms: ${data.partialMatches.slice(0, 3).join(", ")}`);
  }

  if (!data.hasSkillsSection) {
    recommendations.push("Add a dedicated 'Skills' or 'Technical Skills' section");
  }

  if (!data.hasExperienceSection) {
    recommendations.push("Ensure your work experience section uses relevant keywords");
  }

  if (data.matchedKeywords.length > 0) {
    recommendations.push(`Great job including: ${data.matchedKeywords.slice(0, 3).join(", ")}`);
  }

  return recommendations;
}