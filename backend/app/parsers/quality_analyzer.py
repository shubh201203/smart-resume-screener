import re
from typing import Dict, Any, List, Tuple

def evaluate_resume_quality(raw_text: str) -> Tuple[float, str, List[str]]:
    """
    Evaluates resume formatting, extractability, structure, and contact info.
    Returns (quality_score: float, quality_label: str, factors: List[str]).
    Quality score is kept separate from candidate job fit match score.
    """
    score = 10.0
    factors = []
    
    if not raw_text or len(raw_text.strip()) < 100:
        return 2.0, "Poor", ["Critical: Very low text content or unreadable PDF formatting."]
        
    word_count = len(raw_text.split())
    if word_count < 150:
        score -= 2.0
        factors.append("Low word count (under 150 words).")
    elif word_count > 2500:
        score -= 1.0
        factors.append("Unusually verbose resume (over 2,500 words).")
    else:
        factors.append("Good content density and word count.")
        
    # Check for contact information
    has_email = bool(re.search(r'[\w\.-]+@[\w\.-]+\.\w+', raw_text))
    has_phone = bool(re.search(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', raw_text)) or bool(re.search(r'\+\d{1,3}[-.\s]?\d+', raw_text))
    
    if has_email and has_phone:
        factors.append("Complete contact details (Email + Phone detected).")
    elif has_email or has_phone:
        score -= 1.0
        factors.append("Partial contact details (Only email or phone found).")
    else:
        score -= 2.5
        factors.append("Missing explicit contact information (Email/Phone not found).")
        
    # Check section headers
    lower_text = raw_text.lower()
    headers_found = 0
    expected_headers = ["experience", "work history", "education", "skills", "projects", "certifications", "summary"]
    for header in expected_headers:
        if header in lower_text:
            headers_found += 1
            
    if headers_found >= 4:
        factors.append(f"Well-structured resume ({headers_found} standard sections identified).")
    elif headers_found >= 2:
        score -= 1.5
        factors.append("Moderate structural organization (Some key section headers missing).")
    else:
        score -= 3.0
        factors.append("Weak section layout (Few or no standard section headers identified).")
        
    # Check for bullet points or lists
    bullet_count = len(re.findall(r'[\u2022\u2023\u25e6\u2043\u2219\-\*]', raw_text))
    if bullet_count >= 5:
        factors.append("Clean bullet-point layout.")
    else:
        score -= 0.5
        factors.append("Minimal bullet-point usage.")
        
    final_score = max(1.0, min(10.0, round(score, 1)))
    
    if final_score >= 8.5:
        label = "Excellent"
    elif final_score >= 7.0:
        label = "Good"
    elif final_score >= 5.0:
        label = "Needs Review"
    else:
        label = "Poor"
        
    return final_score, label, factors
