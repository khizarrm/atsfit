import re
from typing import Dict, List, Tuple
from keyword_databases import SECTION_HEADERS

class JobSectionParser:
    """Parse job postings into relevant sections for targeted keyword extraction"""
    
    def __init__(self):
        # Sections we want to extract keywords from (high priority)
        self.relevant_sections = {
            'responsibilities', 'requirements', 'qualifications', 'skills', 'experience',
            'duties', 'tasks', 'role', 'position', 'job description', 'what you will do',
            'what we are looking for', 'must have', 'nice to have', 'preferred',
            'technical requirements', 'technical skills', 'soft skills', 'education',
            'certifications', 'about the role', 'key responsibilities', 'required skills',
            'desired skills', 'minimum qualifications', 'preferred qualifications',
            'core competencies', 'essential skills', 'technical competencies',
            'ai-centric abilities', 'abilities', 'position responsibilities'
        }
        
        # Sections to ignore (noise)
        self.ignore_sections = {
            'benefits', 'compensation', 'salary', 'perks', 'company', 'about us',
            'our company', 'our mission', 'our values', 'culture', 'diversity',
            'equal opportunity', 'privacy', 'legal', 'disclaimer', 'notice',
            'travel', 'location', 'office', 'work environment', 'what we offer',
            'why join us', 'employee benefits', 'health insurance', 'dental',
            'vision', '401k', 'retirement', 'vacation', 'pto', 'holidays',
            'applicant privacy notice', 'employment candidate privacy notice'
        }
    
    def parse_sections(self, text: str) -> Dict[str, str]:
        """Parse job posting text into sections"""
        sections = {}
        current_section = 'general'
        current_content = []
        
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Check if this line is a section header
            section_name = self._identify_section_header(line)
            
            if section_name:
                # Save previous section
                if current_content:
                    sections[current_section] = '\n'.join(current_content)
                
                # Start new section
                current_section = section_name
                current_content = []
            else:
                # Add content to current section
                current_content.append(line)
        
        # Save last section
        if current_content:
            sections[current_section] = '\n'.join(current_content)
        
        return sections
    
    def _identify_section_header(self, line: str) -> str:
        """Identify if a line is a section header and return normalized section name"""
        line_lower = line.lower().strip()
        
        # Remove common formatting characters
        clean_line = re.sub(r'[^\w\s]', '', line_lower).strip()
        
        # Check for exact matches first
        if clean_line in self.relevant_sections:
            return clean_line
        
        if clean_line in self.ignore_sections:
            return f'ignore_{clean_line}'
        
        # Check for partial matches with key section terms
        section_keywords = {
            'responsibilities': ['responsibilities', 'duties', 'role', 'what you will do'],
            'requirements': ['requirements', 'qualifications', 'must have', 'what we are looking for'],
            'skills': ['skills', 'competencies', 'abilities', 'technical requirements'],
            'experience': ['experience', 'background'],
            'education': ['education', 'degree', 'certification'],
            'benefits': ['benefits', 'compensation', 'salary', 'what we offer', 'perks'],
            'company': ['about us', 'our company', 'our mission', 'culture']
        }
        
        for section, keywords in section_keywords.items():
            for keyword in keywords:
                if keyword in clean_line:
                    if section in ['benefits', 'company']:
                        return f'ignore_{section}'
                    return section
        
        # Check if it looks like a header (short line, potentially all caps, etc.)
        if len(line.split()) <= 5 and (line.isupper() or ':' in line):
            # If it contains relevant keywords, treat as relevant section
            for keyword in self.relevant_sections:
                if keyword in clean_line:
                    return keyword
            
            # If it contains ignore keywords, mark as ignore
            for keyword in self.ignore_sections:
                if keyword in clean_line:
                    return f'ignore_{keyword}'
        
        return None
    
    def get_relevant_content(self, sections: Dict[str, str]) -> str:
        """Extract only relevant sections for keyword extraction"""
        relevant_content = []
        
        for section_name, content in sections.items():
            # Skip ignored sections
            if section_name.startswith('ignore_'):
                continue
            
            # Include relevant sections and general content
            if section_name in self.relevant_sections or section_name == 'general':
                relevant_content.append(content)
        
        return '\n'.join(relevant_content)
    
    def get_section_priority(self, section_name: str) -> int:
        """Get priority score for a section (higher = more important for ATS)"""
        high_priority = {
            'requirements', 'qualifications', 'skills', 'technical requirements',
            'technical skills', 'required skills', 'must have', 'minimum qualifications'
        }
        
        medium_priority = {
            'responsibilities', 'duties', 'experience', 'preferred', 'nice to have',
            'desired skills', 'preferred qualifications', 'abilities'
        }
        
        if section_name in high_priority:
            return 3
        elif section_name in medium_priority:
            return 2
        elif not section_name.startswith('ignore_'):
            return 1
        else:
            return 0
    
    def extract_bullet_points(self, text: str) -> List[str]:
        """Extract bullet points and numbered lists from text"""
        bullet_points = []
        
        # Split by lines and look for bullet patterns
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Check for various bullet point patterns
            bullet_patterns = [
                r'^[-•*]\s+',  # - • * bullets
                r'^\d+\.\s+',  # numbered lists
                r'^[a-zA-Z]\.\s+',  # lettered lists
                r'^\([a-zA-Z0-9]+\)\s+',  # (1) (a) style
                r'^\s*○\s+',  # hollow bullets
                r'^\s*■\s+',  # square bullets
            ]
            
            for pattern in bullet_patterns:
                if re.match(pattern, line):
                    # Remove the bullet/number and add to list
                    clean_point = re.sub(pattern, '', line).strip()
                    if clean_point and len(clean_point) > 10:  # Filter out very short points
                        bullet_points.append(clean_point)
                    break
        
        return bullet_points
    
    def is_noise_section(self, section_name: str) -> bool:
        """Check if a section should be ignored for keyword extraction"""
        return section_name.startswith('ignore_') or section_name.lower() in self.ignore_sections