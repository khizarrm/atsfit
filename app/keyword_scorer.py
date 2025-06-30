import re
from typing import Dict, List, Tuple
from keyword_databases import (
    is_technical_term, is_soft_skill, is_qualification, is_noise_word,
    get_keyword_category, ALL_TECHNICAL_TERMS, SOFT_SKILLS,
    PROGRAMMING_LANGUAGES, AI_ML_TECHNOLOGIES, CLOUD_PLATFORMS
)

class KeywordScorer:
    """Score and rank keywords based on ATS relevance and importance"""
    
    def __init__(self):
        # Base scores for different categories
        self.category_scores = {
            'technical': 10,      # Highest priority for ATS
            'soft_skill': 6,      # Medium-high priority
            'qualification': 8,   # High priority
            'job_function': 5,    # Medium priority
            'other': 2           # Low priority
        }
        
        # Bonus scores for specific high-value terms
        self.bonus_scores = {
            'programming_language': 3,
            'ai_ml': 4,
            'cloud': 3,
            'framework': 2,
            'database': 2,
            'devops': 3,
            'security': 2
        }
        
        # Section priority multipliers
        self.section_multipliers = {
            'requirements': 1.5,
            'qualifications': 1.5,
            'skills': 1.4,
            'technical requirements': 1.6,
            'technical skills': 1.6,
            'must have': 1.7,
            'required skills': 1.6,
            'responsibilities': 1.2,
            'experience': 1.3,
            'general': 1.0
        }
    
    def score_keyword(self, keyword: str, context: Dict = None) -> float:
        """Calculate relevance score for a keyword"""
        if not keyword or len(keyword.strip()) < 2:
            return 0.0
        
        keyword_clean = keyword.lower().strip()
        
        # Filter out noise words
        if is_noise_word(keyword_clean):
            return 0.0
        
        # Base score from category
        category = get_keyword_category(keyword_clean)
        base_score = self.category_scores.get(category, 2)
        
        # Apply bonus scores
        bonus = self._calculate_bonus_score(keyword_clean)
        
        # Apply context multipliers
        context_multiplier = self._get_context_multiplier(context)
        
        # Apply frequency penalty (common words get lower scores)
        frequency_penalty = self._get_frequency_penalty(keyword_clean)
        
        # Apply length bonus (reasonable length terms get bonus)
        length_bonus = self._get_length_bonus(keyword_clean)
        
        final_score = (base_score + bonus) * context_multiplier * frequency_penalty + length_bonus
        
        return round(final_score, 2)
    
    def _calculate_bonus_score(self, keyword: str) -> float:
        """Calculate bonus score based on specific term types"""
        bonus = 0.0
        
        # Programming language bonus
        if keyword in PROGRAMMING_LANGUAGES:
            bonus += self.bonus_scores['programming_language']
        
        # AI/ML technology bonus
        if keyword in AI_ML_TECHNOLOGIES:
            bonus += self.bonus_scores['ai_ml']
        
        # Cloud platform bonus
        if keyword in CLOUD_PLATFORMS:
            bonus += self.bonus_scores['cloud']
        
        # Framework/library patterns
        framework_indicators = ['js', 'react', 'angular', 'vue', 'django', 'flask', 'spring']
        if any(indicator in keyword for indicator in framework_indicators):
            bonus += self.bonus_scores['framework']
        
        # Database indicators
        db_indicators = ['sql', 'database', 'db', 'mongo', 'redis', 'elastic']
        if any(indicator in keyword for indicator in db_indicators):
            bonus += self.bonus_scores['database']
        
        # DevOps indicators
        devops_indicators = ['docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd']
        if any(indicator in keyword for indicator in devops_indicators):
            bonus += self.bonus_scores['devops']
        
        # Security indicators
        security_indicators = ['security', 'auth', 'ssl', 'encryption', 'firewall']
        if any(indicator in keyword for indicator in security_indicators):
            bonus += self.bonus_scores['security']
        
        return bonus
    
    def _get_context_multiplier(self, context: Dict) -> float:
        """Get multiplier based on where the keyword was found"""
        if not context:
            return 1.0
        
        section = context.get('section', 'general')
        return self.section_multipliers.get(section, 1.0)
    
    def _get_frequency_penalty(self, keyword: str) -> float:
        """Apply penalty for overly common terms"""
        # Very common terms that should be de-prioritized
        common_terms = {
            'experience', 'ability', 'knowledge', 'skills', 'work', 'team',
            'development', 'software', 'technology', 'system', 'application',
            'solution', 'project', 'business', 'technical', 'professional'
        }
        
        if keyword in common_terms:
            return 0.7  # 30% penalty
        
        # Single character or very short terms
        if len(keyword) <= 2:
            return 0.3
        
        return 1.0
    
    def _get_length_bonus(self, keyword: str) -> float:
        """Apply small bonus for reasonable length terms"""
        length = len(keyword)
        
        if 3 <= length <= 20:  # Sweet spot for technical terms
            return 0.5
        elif 21 <= length <= 30:  # Longer but still reasonable
            return 0.2
        else:  # Too short or too long
            return 0.0
    
    def rank_keywords(self, keywords: List[Tuple[str, float]]) -> List[Tuple[str, float]]:
        """Sort keywords by score in descending order"""
        return sorted(keywords, key=lambda x: x[1], reverse=True)
    
    def filter_by_threshold(self, keywords: List[Tuple[str, float]], min_score: float = 3.0) -> List[Tuple[str, float]]:
        """Filter keywords below a minimum score threshold"""
        return [(kw, score) for kw, score in keywords if score >= min_score]
    
    def categorize_scored_keywords(self, keywords: List[Tuple[str, float]]) -> Dict[str, List[Tuple[str, float]]]:
        """Group keywords by category with their scores"""
        categorized = {
            'technical': [],
            'soft_skill': [],
            'qualification': [],
            'job_function': [],
            'other': []
        }
        
        for keyword, score in keywords:
            category = get_keyword_category(keyword.lower())
            categorized[category].append((keyword, score))
        
        # Sort each category by score
        for category in categorized:
            categorized[category] = self.rank_keywords(categorized[category])
        
        return categorized
    
    def get_top_keywords(self, keywords: List[Tuple[str, float]], n: int = 20) -> List[Tuple[str, float]]:
        """Get top N keywords by score"""
        ranked = self.rank_keywords(keywords)
        return ranked[:n]
    
    def calculate_keyword_density(self, keyword: str, text: str) -> float:
        """Calculate how often a keyword appears in the text (as percentage)"""
        if not keyword or not text:
            return 0.0
        
        text_lower = text.lower()
        keyword_lower = keyword.lower()
        
        # Count occurrences
        count = text_lower.count(keyword_lower)
        
        # Count total words
        total_words = len(text_lower.split())
        
        if total_words == 0:
            return 0.0
        
        return (count / total_words) * 100
    
    def is_acronym(self, term: str) -> bool:
        """Check if a term is likely an acronym"""
        return len(term) <= 5 and term.isupper() and term.isalpha()
    
    def normalize_keyword(self, keyword: str) -> str:
        """Normalize keyword for consistency"""
        # Remove extra whitespace
        normalized = ' '.join(keyword.split())
        
        # Handle common variations
        replacements = {
            'javascript': 'javascript',
            'js': 'javascript',
            'typescript': 'typescript',
            'ts': 'typescript',
            'nodejs': 'node.js',
            'node js': 'node.js',
            'reactjs': 'react',
            'react js': 'react',
            'aws': 'aws',
            'amazon web services': 'aws',
            'ci cd': 'ci/cd',
            'cicd': 'ci/cd',
            'machine learning': 'machine learning',
            'ml': 'machine learning',
            'artificial intelligence': 'artificial intelligence',
            'ai': 'artificial intelligence'
        }
        
        normalized_lower = normalized.lower()
        for old, new in replacements.items():
            if normalized_lower == old:
                return new
        
        return normalized