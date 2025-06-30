import spacy
import re
from typing import List, Dict, Tuple
from section_parser import JobSectionParser
from keyword_scorer import KeywordScorer
from keyword_databases import (
    is_technical_term, is_soft_skill, is_qualification, is_noise_word,
    get_keyword_category, ALL_TECHNICAL_TERMS, SOFT_SKILLS,
    PROGRAMMING_LANGUAGES, AI_ML_TECHNOLOGIES
)

class SmartKeywordExtractor:
    """Advanced keyword extractor optimized for ATS resume optimization"""
    
    def __init__(self):
        self.nlp = spacy.load("en_core_web_sm")
        self.section_parser = JobSectionParser()
        self.scorer = KeywordScorer()
    
    def extract_keywords(self, text: str, min_score: float = 3.0) -> Dict[str, List[Tuple[str, float]]]:
        """Extract and categorize keywords with relevance scoring"""
        
        # Parse text into sections
        sections = self.section_parser.parse_sections(text)
        
        # Extract keywords from each relevant section
        all_keywords = []
        
        for section_name, content in sections.items():
            if self.section_parser.is_noise_section(section_name):
                continue
            
            section_keywords = self._extract_from_section(content, section_name)
            all_keywords.extend(section_keywords)
        
        # Deduplicate and score keywords
        unique_keywords = self._deduplicate_keywords(all_keywords)
        
        # Filter by minimum score
        filtered_keywords = self.scorer.filter_by_threshold(unique_keywords, min_score)
        
        # Categorize and rank keywords
        categorized = self.scorer.categorize_scored_keywords(filtered_keywords)
        
        return categorized
    
    def _extract_from_section(self, text: str, section_name: str) -> List[Tuple[str, float, str]]:
        """Extract keywords from a specific section with context"""
        keywords = []
        context = {'section': section_name}
        
        # Process with spaCy
        doc = self.nlp(text)
        
        # Extract different types of terms
        
        # 1. Technical terms and named entities
        keywords.extend(self._extract_technical_terms(doc, context))
        
        # 2. Skill-related noun phrases
        keywords.extend(self._extract_skill_phrases(doc, context))
        
        # 3. Pattern-based extraction (e.g., "3+ years", "Bachelor's degree")
        keywords.extend(self._extract_pattern_terms(text, context))
        
        # 4. Individual important tokens
        keywords.extend(self._extract_important_tokens(doc, context))
        
        return keywords
    
    def _extract_technical_terms(self, doc, context: Dict) -> List[Tuple[str, float, str]]:
        """Extract technical terms and technologies"""
        keywords = []
        
        # Named entities that might be technologies
        for ent in doc.ents:
            if ent.label_ in ['ORG', 'PRODUCT', 'GPE']:  # Organizations, products, places
                term = ent.text.strip().lower()
                if is_technical_term(term) or term in PROGRAMMING_LANGUAGES:
                    normalized = self.scorer.normalize_keyword(term)
                    score = self.scorer.score_keyword(normalized, context)
                    keywords.append((normalized, score, context.get('section', 'general')))
        
        # Look for technical terms in noun chunks
        for chunk in doc.noun_chunks:
            text = chunk.text.strip().lower()
            
            # Split compound terms and check each part
            parts = re.split(r'[/,&\s]+', text)
            for part in parts:
                part = part.strip()
                if len(part) > 1 and is_technical_term(part):
                    normalized = self.scorer.normalize_keyword(part)
                    score = self.scorer.score_keyword(normalized, context)
                    keywords.append((normalized, score, context.get('section', 'general')))
        
        return keywords
    
    def _extract_skill_phrases(self, doc, context: Dict) -> List[Tuple[str, float, str]]:
        """Extract skill-related phrases and competencies"""
        keywords = []
        
        for chunk in doc.noun_chunks:
            text = chunk.text.strip().lower()
            
            # Skip very long phrases and noise
            if len(text.split()) > 4 or is_noise_word(text):
                continue
            
            # Check if it's a skill or qualification
            if is_soft_skill(text) or is_qualification(text):
                normalized = self.scorer.normalize_keyword(text)
                score = self.scorer.score_keyword(normalized, context)
                keywords.append((normalized, score, context.get('section', 'general')))
            
            # Look for skill patterns like "problem solving", "team leadership"
            skill_patterns = [
                r'\b(\w+\s+(?:skills?|abilities?|experience|knowledge))\b',
                r'\b(problem[\s-]solving|decision[\s-]making|critical[\s-]thinking)\b',
                r'\b(\w+\s+(?:management|leadership|development|engineering))\b'
            ]
            
            for pattern in skill_patterns:
                matches = re.findall(pattern, text, re.IGNORECASE)
                for match in matches:
                    if isinstance(match, tuple):
                        match = match[0] if match[0] else match[1]
                    
                    normalized = self.scorer.normalize_keyword(match.strip())
                    if len(normalized) > 3 and not is_noise_word(normalized):
                        score = self.scorer.score_keyword(normalized, context)
                        keywords.append((normalized, score, context.get('section', 'general')))
        
        return keywords
    
    def _extract_pattern_terms(self, text: str, context: Dict) -> List[Tuple[str, float, str]]:
        """Extract terms using regex patterns"""
        keywords = []
        
        patterns = [
            # Experience patterns: "3+ years", "5-7 years"
            (r'\b(\d+[\+\-\s]*(?:to|\-)\s*\d*\s*years?)\b', 'experience'),
            
            # Degree patterns: "Bachelor's", "Master's", "PhD"
            (r'\b(bachelor\'?s?|master\'?s?|phd|doctorate|associate\'?s?)\s*(?:degree)?\b', 'education'),
            
            # Certification patterns
            (r'\b(certified|certification)\s+(\w+(?:\s+\w+)*)\b', 'certification'),
            
            # GPA patterns
            (r'\b(gpa|g\.p\.a\.?)\s*(\d+\.?\d*)\b', 'qualification'),
            
            # Programming language versions: "Python 3", "Java 8"
            (r'\b(python|java|javascript|typescript|c\+\+|c#)\s*(\d+(?:\.\d+)?)\b', 'technical'),
            
            # Framework versions: "React 18", "Angular 15"
            (r'\b(react|angular|vue|node\.?js)\s*(\d+(?:\.\d+)?)\b', 'technical'),
            
            # Technical compound terms
            (r'\b(ci/cd\s+pipelines?)\b', 'technical'),
            (r'\b(amazon\s+web\s+services)\b', 'technical'),
            (r'\b(full\s+stack)\b', 'technical'),
            (r'\b(unit\s+testing)\b', 'technical'),
            (r'\b(test\s+automation)\b', 'technical'),
            (r'\b(code\s+review)\b', 'technical'),
            (r'\b(microservice\s+architecture)\b', 'technical'),
            (r'\b(serverless\s+computing)\b', 'technical'),
            (r'\b(prompt\s+engineering)\b', 'technical'),
            (r'\b(root\s+cause\s+analysis)\b', 'technical'),
            (r'\b(software\s+development)\b', 'technical'),
            (r'\b(web\s+applications?)\b', 'technical'),
            (r'\b(saas\s+environment)\b', 'technical'),
            (r'\b(ai[\s\-]assisted\s+\w+)\b', 'technical'),
            (r'\b(genai\s+tools?)\b', 'technical'),
            (r'\b(cross[\s\-]functional)\b', 'soft_skill'),
            
            # Skills phrases
            (r'\b(problem[\s\-]solving)\b', 'soft_skill'),
            (r'\b(team\s+leadership)\b', 'soft_skill'),
            (r'\b(project\s+management)\b', 'soft_skill'),
        ]
        
        for pattern, category in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                full_match = match.group(0).strip().lower()
                normalized = self.scorer.normalize_keyword(full_match)
                
                if len(normalized) > 2 and not is_noise_word(normalized):
                    score = self.scorer.score_keyword(normalized, context)
                    keywords.append((normalized, score, context.get('section', 'general')))
        
        return keywords
    
    def _extract_important_tokens(self, doc, context: Dict) -> List[Tuple[str, float, str]]:
        """Extract individual important tokens"""
        keywords = []
        
        for token in doc:
            if token.is_stop or token.is_punct or token.is_space:
                continue
            
            text = token.text.strip().lower()
            
            # Skip very short or very long tokens
            if len(text) <= 2 or len(text) > 30:
                continue
            
            # Check if it's a known technical term, skill, or qualification
            if (is_technical_term(text) or is_soft_skill(text) or 
                is_qualification(text) or text in PROGRAMMING_LANGUAGES or
                text in AI_ML_TECHNOLOGIES):
                
                normalized = self.scorer.normalize_keyword(text)
                score = self.scorer.score_keyword(normalized, context)
                keywords.append((normalized, score, context.get('section', 'general')))
        
        return keywords
    
    def _deduplicate_keywords(self, keywords: List[Tuple[str, float, str]]) -> List[Tuple[str, float]]:
        """Remove duplicates and combine scores"""
        keyword_scores = {}
        
        for keyword, score, section in keywords:
            if keyword in keyword_scores:
                # Take the maximum score for duplicates
                keyword_scores[keyword] = max(keyword_scores[keyword], score)
            else:
                keyword_scores[keyword] = score
        
        return [(kw, score) for kw, score in keyword_scores.items()]

def extract_keywords(text, min_length=3):
    """Legacy function for backward compatibility"""
    extractor = SmartKeywordExtractor()
    categorized = extractor.extract_keywords(text)
    
    # Flatten all categories and return just the keywords
    all_keywords = []
    for category, keywords in categorized.items():
        all_keywords.extend([kw for kw, score in keywords])
    
    return sorted(set(all_keywords))

def get_top_keywords(job_description: str, num_keywords: int = 20) -> list:
    """
    Extract top keywords from job description for ATS scoring.
    
    Args:
        job_description (str): The job description text
        num_keywords (int): Number of top keywords to return (default: 20)
    
    Returns:
        list: Array of top keywords as strings
    """
    extractor = SmartKeywordExtractor()
    categorized_keywords = extractor.extract_keywords(job_description, min_score=2.0)
    
    # Flatten all categories and collect all scored keywords
    all_scored = []
    for category, keywords in categorized_keywords.items():
        all_scored.extend(keywords)
    
    # Sort by score and get top keywords
    top_keywords = sorted(all_scored, key=lambda x: x[1], reverse=True)[:num_keywords]
    
    # Return just the keyword strings (not scores)
    return [keyword for keyword, score in top_keywords]

if __name__ == "__main__":
    job_description = """
WHAT YOU DO AT AMD CHANGES EVERYTHING

We care deeply about transforming lives with AMD technology to enrich our industry, our communities, and the world. Our mission is to build great products that accelerate next-generation computing experiences - the building blocks for the data center, artificial intelligence, PCs, gaming and embedded. Underpinning our mission is the AMD culture. We push the limits of innovation to solve the world’s most important challenges. We strive for execution excellence while being direct, humble, collaborative, and inclusive of diverse perspectives.

AMD together we advance_

An exciting internship opportunity to make an immediate contribution to AMD's next generation of technology innovations awaits you! We have a multifaceted, high-energy work environment filled with a diverse group of employees, and we provide outstanding opportunities for developing your career. During your internship, our programs provide the opportunity to collaborate with AMD leaders, receive one-on-one mentorship, attend amazing networking events, and much more. Being part of AMD means receiving hands-on experience that will give you a competitive edge. Together We Advance your career!

Job Details

Location: Markham, Ontario, Canada
Onsite/Hybrid: This role requires the student to work full time (37.5 hours a week), either in a hybrid or onsite work structure throughout the duration of the co-op/intern term.
Duration: 4-Months - September 2025 to December 2025


What You Will Be Doing

There are a wide variety of software engineering opportunities available such as application, kernel, graphics, AI development. As an AMD Software Engineer, you can expect to -

Collaborate with teams across the stack from user space, kernel, firmware and hardware
Work with globally recognized partner companies to build solutions to real end-user issues
Participate in code and design reviews to ensure we build efficient and quality code
Create differentiating software features, examples include: AMD Fluid Motion Frames, AMD FidelityFX Super Resolution, FreeSync, and more
Take high-performance & efficient computing to a new level with next-gen Ryzen/Radeon Graphics chips


Who We Are Looking For

You are currently enrolled in a Canada based University in a Bachelor's degree program majoring in Computer Engineering, Software Engineering, Software Development, Computer Science or related field.
AMD has multiple opportunities that requires different software skills. If you have ANY of the following skills, we encourage you to apply -
C/C++ programming and Object-Oriented Design
Frameworks like Qt, Javascript
Operating systems concepts (including memory management, multithreading, assembly, x86).
Computer graphics pipelines (Direct3D, OpenGL, OpenCL)
Computer architecture and/or firmware development
Version control tools such as Git/Github, Perforce
Additional Scripting Languages: Python, Windows PowerShell, Linux shell script, Perl, Java, UML
PC assembly and gaming ecosystem knowledge
 

Note: By submitting your application, you are indicating your interest in AMD intern positions. We are recruiting for multiple positions, and if your experience aligns with any of our intern opportunities, a recruiter will contact you.

Benefits offered are described: AMD benefits at a glance.

AMD does not accept unsolicited resumes from headhunters, recruitment agencies, or fee-based recruitment services. AMD and its subsidiaries are equal opportunity, inclusive employers and will consider all applicants without regard to age, ancestry, color, marital status, medical condition, mental or physical disability, national origin, race, religion, political and/or third-party affiliation, sex, pregnancy, sexual orientation, gender identity, military or veteran status, or any other characteristic protected by law. We encourage applications from all qualified candidates and will accommodate applicants’ needs under the respective laws throughout all stages of the recruitment and selection process.
    """

    # Test the new function
    print("=== TESTING get_top_keywords() FUNCTION ===\n")
    top_keywords = get_top_keywords(job_description)
    print(f"Top {len(top_keywords)} keywords:")
    for i, keyword in enumerate(top_keywords, 1):
        print(f"{i:2d}. {keyword}")
    
    print("\n" + "="*50)
    
    # Use the new improved extractor for detailed view
    extractor = SmartKeywordExtractor()
    categorized_keywords = extractor.extract_keywords(job_description, min_score=2.0)
    
    print("\n=== DETAILED ATS-OPTIMIZED KEYWORD EXTRACTION ===\n")
    
    for category, keywords in categorized_keywords.items():
        if keywords:  # Only show categories that have keywords
            category_names = {
                'technical': '🔧 TECHNICAL SKILLS',
                'soft_skill': '🤝 SOFT SKILLS', 
                'qualification': '🎓 QUALIFICATIONS',
                'job_function': '💼 JOB FUNCTIONS',
                'other': '📋 OTHER RELEVANT TERMS'
            }
            
            print(f"{category_names.get(category, category.upper())}:")
            for keyword, score in keywords[:15]:  # Show top 15 per category
                print(f"  • {keyword} (score: {score})")
            print()
    
    print("\n" + "="*50)
    print("RECOMMENDATION: Focus on incorporating these high-scoring")
    print("technical skills and qualifications into your resume.")
    print("="*50)
