import re

def load_resume(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read().lower()

def count_keyword_hits(resume_text, keywords):
    hits = 0
    matched_keywords = []
    for kw in keywords:
        # Check for whole word match, case-insensitive
        pattern = r'\b' + re.escape(kw.lower()) + r'\b'
        if re.search(pattern, resume_text):
            hits += 1
            matched_keywords.append(kw)
    return hits, matched_keywords

def calculate_score(hits, total):
    return round((hits / total) * 100, 2)

def score_resume(resume_text: str, keywords: list) -> dict:
    """
    Score resume against provided keywords for ATS analysis.
    
    Args:
        resume_text (str): The resume text content
        keywords (list): List of keywords to match against
    
    Returns:
        dict: ATS score analysis with matched/missing keywords
    """
    # Convert resume to lowercase for matching
    resume_lower = resume_text.lower()
    
    # Count keyword hits
    hits, matched_keywords = count_keyword_hits(resume_lower, keywords)
    score = calculate_score(hits, len(keywords))
    
    # Find missing keywords
    missing_keywords = [kw for kw in keywords if kw.lower() not in [mk.lower() for mk in matched_keywords]]
    
    return {
        "ats_score": score,
        "total_keywords": len(keywords),
        "matched_keywords": matched_keywords,
        "matched_count": hits,
        "missing_keywords": missing_keywords,
        "missing_count": len(missing_keywords)
    }

def main():
    # Example keyword list
    keywords = [
        "python", "data analysis", "machine learning",
        "sql", "pandas", "communication", "leadership",
        "project management", "aws", "deep learning"
    ]

    resume_text = load_resume('resume.txt')
    result = score_resume(resume_text, keywords)

    print("\n--- ATS Analysis ---")
    print(f"ATS Score: {result['ats_score']}%")
    print(f"Total Keywords: {result['total_keywords']}")
    print(f"Matched Keywords ({result['matched_count']}): {result['matched_keywords']}")
    print(f"Missing Keywords ({result['missing_count']}): {result['missing_keywords']}")

if __name__ == "__main__":
    main()
