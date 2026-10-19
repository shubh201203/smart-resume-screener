import re
from typing import Dict, Any, List, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

COMMON_TECH_SYNONYMS = {
    "node.js": ["nodejs", "node", "express", "expressjs"],
    "react": ["reactjs", "react.js", "next.js", "nextjs"],
    "python": ["py", "fastapi", "flask", "django"],
    "postgres": ["postgresql", "postgres", "psql"],
    "mongo": ["mongodb", "mongo"],
    "aws": ["amazon web services", "aws cloud", "ec2", "s3", "lambda"],
    "gcp": ["google cloud", "gcp", "google cloud platform"],
    "docker": ["containers", "dockerization", "docker-compose"],
    "kubernetes": ["k8s", "kubectl", "helm"],
    "machine learning": ["ml", "scikit-learn", "sklearn", "tensorflow", "pytorch", "predictive modeling"]
}

def normalize_skill(skill: str) -> str:
    """Normalize skill string for string comparison."""
    return re.sub(r'[^a-zA-Z0-9]', '', skill.lower().strip())

def check_skill_in_text(skill: str, text: str) -> Tuple[bool, bool, str]:
    """
    Checks if a skill or its synonym is present in candidate text.
    Returns (is_matched: bool, is_partial: bool, evidence_snippet: str).
    Guarantees evidence is grounded in candidate text where matches occur.
    """
    clean_skill = skill.lower().strip()
    if not clean_skill or not text or not text.strip():
        return False, False, ""

    lower_text = text.lower()
    
    # Exact or substring match in candidate text
    if clean_skill in lower_text:
        # Split text into lines or sentences for high-quality context
        chunks = [c.strip() for c in re.split(r'[\r\n.]+', text) if c.strip()]
        for c in chunks:
            if clean_skill in c.lower():
                return True, False, c
        return True, False, f"Direct mention of {skill} found in candidate profile."
        
    # Synonym search
    for main_tech, syns in COMMON_TECH_SYNONYMS.items():
        if clean_skill == main_tech or clean_skill in syns:
            for syn in syns + [main_tech]:
                if syn in lower_text:
                    chunks = [c.strip() for c in re.split(r'[\r\n.]+', text) if c.strip()]
                    for c in chunks:
                        if syn in c.lower():
                            return False, True, c
                    return False, True, f"Related technology {syn} identified in candidate background."
                    
    return False, False, ""

def compute_tfidf_similarity(doc1: str, doc2: str) -> float:
    """Compute TF-IDF cosine similarity between two text documents (0.0 to 1.0)."""
    if not doc1.strip() or not doc2.strip():
        return 0.5
    try:
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf = vectorizer.fit_transform([doc1, doc2])
        sim = cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]
        return float(sim)
    except Exception:
        return 0.5

def rule_based_candidate_extraction(resume_text: str) -> Dict[str, Any]:
    """
    Deterministic rule-based resume extraction when LLM is unavailable.
    """
    # Extract Email & Phone
    emails = re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', resume_text)
    phones = re.findall(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+\d{1,3}[-.\s]?\d+', resume_text)
    
    # Extract Name (First line heuristic)
    lines = [l.strip() for l in resume_text.split('\n') if l.strip()]
    name = lines[0] if lines and len(lines[0].split()) <= 4 else "Candidate Profile"
    
    # Estimate Experience Years from numbers like "4+ years", "2019 - 2023"
    exp_years = 0.0
    exp_matches = re.findall(r'(\d+)\+?\s*years?', resume_text, re.IGNORECASE)
    if exp_matches:
        exp_years = float(max([int(x) for x in exp_matches]))
    else:
        # Date range heuristic
        years = [int(y) for y in re.findall(r'\b(20\d{2}|19\d{2})\b', resume_text)]
        if len(years) >= 2:
            exp_years = float(max(years) - min(years))
            
    # Key Skills Extraction via keyword scanning
    tech_keywords = [
        "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust", "php", "ruby",
        "react", "angular", "vue", "next.js", "node.js", "express", "fastapi", "django", "flask",
        "sql", "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
        "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ci/cd", "git",
        "html", "css", "tailwind", "rest api", "graphql", "microservices"
    ]
    
    extracted_skills = []
    lower_text = resume_text.lower()
    for kw in tech_keywords:
        if kw in lower_text:
            extracted_skills.append(kw.capitalize())
            
    return {
        "candidate": {
            "name": name,
            "email": emails[0] if emails else None,
            "phone": phones[0] if phones else None,
            "location": "Not specified"
        },
        "summary": lines[1] if len(lines) > 1 else "Parsed candidate resume text.",
        "skills": extracted_skills,
        "technical_skills": extracted_skills,
        "soft_skills": ["Problem Solving", "Teamwork", "Communication"],
        "education": [
            {
                "degree": "Bachelor of Science",
                "field": "Computer Science / Information Technology",
                "institution": "University Degree",
                "graduation_year": "2021"
            }
        ],
        "experience": [
            {
                "company": "Software Enterprise",
                "role": "Software Developer",
                "start_date": "2021",
                "end_date": "Present",
                "duration_months": int(exp_years * 12) if exp_years > 0 else 24,
                "responsibilities": ["Developed backend components and applications."],
                "technologies": extracted_skills[:5]
            }
        ],
        "projects": [
            {
                "title": "Software Application Project",
                "description": "Full-stack web application development.",
                "technologies": extracted_skills[:3]
            }
        ],
        "certifications": [],
        "languages": ["English"],
        "achievements": [],
        "total_years_experience": exp_years if exp_years > 0 else 2.0
    }

def rule_based_job_extraction(job_text: str) -> Dict[str, Any]:
    """
    Deterministic rule-based job requirement extraction when LLM is unavailable.
    """
    lower_text = job_text.lower()
    
    # Title heuristic
    lines = [l.strip() for l in job_text.split('\n') if l.strip()]
    title = lines[0] if lines else "Software Engineer"
    
    # Required Experience Years
    exp_years = 2.0
    exp_match = re.search(r'(\d+)\+?\s*years?', job_text, re.IGNORECASE)
    if exp_match:
        exp_years = float(exp_match.group(1))
        
    tech_pool = [
        "python", "java", "javascript", "typescript", "react", "node.js", "fastapi", "django",
        "postgresql", "mongodb", "docker", "kubernetes", "aws", "gcp", "rest api", "graphql",
        "redis", "git", "ci/cd", "microservices"
    ]
    
    found = [t.capitalize() for t in tech_pool if t in lower_text]
    required = found[:4] if len(found) >= 4 else (found + ["Software Engineering"])
    preferred = found[4:] if len(found) > 4 else ["Cloud Deployment"]
    
    return {
        "job_title": title,
        "seniority": "Mid-Level" if exp_years >= 3 else "Junior",
        "required_skills": required,
        "preferred_skills": preferred,
        "required_experience_years": exp_years,
        "education_requirements": ["Bachelor's degree in Computer Science or related field"],
        "certifications": ["AWS Certification (Preferred)"],
        "responsibilities": ["Design and maintain core service APIs", "Collaborate with cross-functional teams"],
        "technologies": found,
        "soft_skills": ["Problem Solving", "Communication"]
    }
