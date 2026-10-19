import math
from typing import Dict, Any, List, Tuple, Optional
from app.core.config import settings
from app.schemas.domain import MatchResultSchema, ComponentScores, SkillMatchItem
from app.llm.client import llm_client, LLMError
from app.matching.fallback import (
    check_skill_in_text,
    compute_tfidf_similarity,
    rule_based_candidate_extraction,
    rule_based_job_extraction
)

DEFAULT_WEIGHTS = {
    "skills": 0.35,
    "experience": 0.20,
    "semantic_fit": 0.20,
    "projects": 0.15,
    "education": 0.05,
    "certifications": 0.05,
}

def normalize_and_validate_weights(weights: Optional[Dict[str, Any]]) -> Dict[str, float]:
    """
    Validates and normalizes weights so their sum is strictly 1.0.
    Handles missing keys, non-numeric values, negative values, and non-finite floats.
    Falls back safely to DEFAULT_WEIGHTS.
    """
    if not isinstance(weights, dict):
        return dict(DEFAULT_WEIGHTS)

    cleaned: Dict[str, float] = {}
    for key, default_val in DEFAULT_WEIGHTS.items():
        raw_val = weights.get(key)
        try:
            val = float(raw_val)
            if math.isnan(val) or math.isinf(val) or val < 0.0:
                val = 0.0
        except (TypeError, ValueError):
            val = default_val
        cleaned[key] = val

    total = sum(cleaned.values())
    if total <= 1e-6:
        return dict(DEFAULT_WEIGHTS)

    return {k: v / total for k, v in cleaned.items()}

def calculate_deterministic_scores(
    candidate_data: Dict[str, Any],
    job_data: Dict[str, Any],
    semantic_fit_raw: float,
    weights: Dict[str, float],
    raw_resume_text: str
) -> Tuple[ComponentScores, List[SkillMatchItem], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Computes component scores (1-10) and deterministic weighted final score.
    Returns (ComponentScores, matched_skills, partial_matches, missing_skills).
    """
    normalized_weights = normalize_and_validate_weights(weights)
    w_skills = normalized_weights["skills"]
    w_exp = normalized_weights["experience"]
    w_semantic = normalized_weights["semantic_fit"]
    w_projects = normalized_weights["projects"]
    w_edu = normalized_weights["education"]
    w_cert = normalized_weights["certifications"]

    # Combine all candidate text for evidence scanning
    skills_list = candidate_data.get("skills", []) if isinstance(candidate_data, dict) else []
    candidate_text_corpus = (raw_resume_text or "") + " " + " ".join(skills_list)
    for exp in (candidate_data.get("experience", []) if isinstance(candidate_data, dict) else []):
        if isinstance(exp, dict):
            resps = exp.get("responsibilities", [])
            techs = exp.get("technologies", [])
            candidate_text_corpus += " " + " ".join(resps if isinstance(resps, list) else []) + " " + " ".join(techs if isinstance(techs, list) else [])

    required_skills = job_data.get("required_skills", [])
    preferred_skills = job_data.get("preferred_skills", [])
    
    matched_skills: List[SkillMatchItem] = []
    partial_matches: List[Dict[str, Any]] = []
    missing_skills: List[Dict[str, Any]] = []

    req_matches = 0
    pref_matches = 0

    # 1. Skills Matching
    for skill in required_skills:
        is_matched, is_partial, evidence = check_skill_in_text(skill, candidate_text_corpus)
        if is_matched:
            req_matches += 1
            matched_skills.append(SkillMatchItem(
                skill=skill,
                status="matched",
                confidence=0.95,
                evidence=evidence or f"Demonstrated competency in {skill}.",
                type="required"
            ))
        elif is_partial:
            req_matches += 0.5
            partial_matches.append({
                "skill": skill,
                "candidate_skill": "Related technology",
                "evidence": evidence or f"Demonstrated related experience for {skill}.",
                "type": "required"
            })
        else:
            missing_skills.append({"skill": skill, "type": "required"})

    for skill in preferred_skills:
        is_matched, is_partial, evidence = check_skill_in_text(skill, candidate_text_corpus)
        if is_matched:
            pref_matches += 1
            matched_skills.append(SkillMatchItem(
                skill=skill,
                status="matched",
                confidence=0.90,
                evidence=evidence or f"Demonstrated preferred skill {skill}.",
                type="preferred"
            ))
        elif is_partial:
            pref_matches += 0.5
            partial_matches.append({
                "skill": skill,
                "candidate_skill": "Related technology",
                "evidence": evidence or f"Demonstrated related experience for {skill}.",
                "type": "preferred"
            })
        else:
            missing_skills.append({"skill": skill, "type": "preferred"})

    # Skills Score Math (1-10)
    total_skill_points_possible = (len(required_skills) * 1.0) + (len(preferred_skills) * 0.5)
    earned_skill_points = (req_matches * 1.0) + (pref_matches * 0.5)

    if total_skill_points_possible > 0:
        skills_score = min(10.0, max(1.0, (earned_skill_points / total_skill_points_possible) * 10.0))
    else:
        skills_score = 7.5

    # 2. Experience Score Math (1-10)
    cand_exp = candidate_data.get("total_years_experience", 0.0)
    req_exp = job_data.get("required_experience_years", 0.0)

    if req_exp <= 0:
        exp_score = 9.0
    elif cand_exp >= req_exp:
        # Full score with minor bonus for additional experience up to 10.0
        ratio = cand_exp / req_exp
        exp_score = min(10.0, 9.0 + (ratio - 1.0) * 0.5)
    else:
        # Partial score proportional to experience ratio
        exp_score = max(2.0, (cand_exp / req_exp) * 9.0)

    # 3. Semantic Fit Score (1-10)
    semantic_fit = min(10.0, max(1.0, float(semantic_fit_raw)))

    # 4. Project/Relevance Score (1-10)
    cand_projects = candidate_data.get("projects", [])
    if cand_projects:
        proj_text = " ".join([p.get("title", "") + " " + p.get("description", "") for p in cand_projects])
        job_tech = " ".join(job_data.get("technologies", []))
        proj_sim = compute_tfidf_similarity(proj_text, job_tech)
        projects_score = min(10.0, max(3.0, proj_sim * 10.0 + 4.0))
    else:
        projects_score = 6.0 if cand_exp >= req_exp else 4.0

    # 5. Education Score (1-10)
    education_list = candidate_data.get("education", [])
    edu_reqs = job_data.get("education_requirements", [])
    if not edu_reqs:
        edu_score = 9.0
    elif education_list:
        edu_text = " ".join([e.get("degree", "") + " " + e.get("field", "") for e in education_list]).lower()
        if any(req.lower() in edu_text for req in ["computer science", "engineering", "software", "information technology"]):
            edu_score = 10.0
        elif any(d in edu_text for d in ["bachelor", "master", "b.s", "m.s", "ph.d", "degree"]):
            edu_score = 8.5
        else:
            edu_score = 7.0
    else:
        edu_score = 5.0

    # 6. Certification Score (1-10)
    cand_certs = candidate_data.get("certifications", [])
    job_certs = job_data.get("certifications", [])
    if not job_certs:
        cert_score = 9.0
    elif cand_certs:
        cert_score = 10.0
    else:
        cert_score = 6.0

    # Final Weighted Math Calculation
    final_score_raw = (
        (w_skills * skills_score) +
        (w_exp * exp_score) +
        (w_semantic * semantic_fit) +
        (w_projects * projects_score) +
        (w_edu * edu_score) +
        (w_cert * cert_score)
    )

    final_score = round(min(10.0, max(1.0, final_score_raw)), 1)

    component_scores = ComponentScores(
        skills=round(skills_score, 1),
        experience=round(exp_score, 1),
        semantic_fit=round(semantic_fit, 1),
        projects=round(projects_score, 1),
        education=round(edu_score, 1),
        certifications=round(cert_score, 1),
        final_score=final_score
    )

    return component_scores, matched_skills, partial_matches, missing_skills

def generate_why_not_10(
    component_scores: ComponentScores,
    candidate_data: Dict[str, Any],
    job_data: Dict[str, Any],
    missing_skills: List[Dict[str, Any]]
) -> List[str]:
    """Generates concise, evidence-based bullet points explaining score reduction."""
    reasons = []

    # Check missing required skills
    req_missing = [m["skill"] for m in missing_skills if m.get("type") == "required"]
    if req_missing:
        reasons.append(f"Required technology absent: {', '.join(req_missing[:2])} not demonstrated in resume.")

    # Check missing preferred skills
    pref_missing = [m["skill"] for m in missing_skills if m.get("type") == "preferred"]
    if pref_missing and len(reasons) < 3:
        reasons.append(f"Preferred technology missing: {', '.join(pref_missing[:2])} absent from candidate profile.")

    # Check experience shortfall
    req_exp = job_data.get("required_experience_years", 0.0)
    cand_exp = candidate_data.get("total_years_experience", 0.0)
    if req_exp > 0 and cand_exp < req_exp:
        reasons.append(f"Experience gap: Required {req_exp}+ years, but candidate demonstrates approx {cand_exp} years.")

    # Check certifications
    job_certs = job_data.get("certifications", [])
    cand_certs = candidate_data.get("certifications", [])
    if job_certs and not cand_certs and len(reasons) < 4:
        reasons.append(f"Certification fit: Target role lists preferred certifications ({job_certs[0]}) absent on profile.")

    if not reasons and component_scores.final_score < 10.0:
        reasons.append("Minor evidence gaps in domain project alignment preventing a perfect score.")

    return reasons[:4]

async def process_candidate_matching(
    candidate_data: Dict[str, Any],
    job_data: Dict[str, Any],
    raw_resume_text: str,
    weights: Optional[Dict[str, float]] = None
) -> MatchResultSchema:
    """
    Full candidate matching pipeline (LLM Semantic evaluation + Deterministic math).
    Falls back gracefully to TF-IDF rule engine if LLM is offline/unconfigured.
    """
    scoring_weights = weights or settings.DEFAULT_WEIGHTS
    engine_type = "LLM_HYBRID"
    model_name = settings.LLM_MODEL_NAME if llm_client.is_configured else "Rule-Engine Fallback"

    semantic_fit = 7.5
    strengths = []
    concerns = []
    justification = ""

    if llm_client.is_configured:
        try:
            llm_result = await llm_client.analyze_semantic_match(job_data, candidate_data)
            semantic_fit = float(llm_result.get("semantic_fit_score", 7.5))
            strengths = llm_result.get("strengths", [])
            concerns = llm_result.get("concerns", [])
            justification = llm_result.get("ai_justification", "")
        except LLMError:
            engine_type = "RULE_FALLBACK"
            model_name = "Rule-Engine Fallback"
    else:
        engine_type = "RULE_FALLBACK"
        model_name = "Rule-Engine Fallback"

    if engine_type == "RULE_FALLBACK":
        # Calculate TF-IDF similarity between job description and resume
        cand_corpus = raw_resume_text
        job_corpus = " ".join(job_data.get("required_skills", [])) + " " + " ".join(job_data.get("technologies", []))
        sim = compute_tfidf_similarity(cand_corpus, job_corpus)
        semantic_fit = round(min(10.0, max(2.0, sim * 10.0 + 3.0)), 1)

    # Run Deterministic Scoring Engine Math
    comp_scores, matched_skills, partial_matches, missing_skills = calculate_deterministic_scores(
        candidate_data=candidate_data,
        job_data=job_data,
        semantic_fit_raw=semantic_fit,
        weights=scoring_weights,
        raw_resume_text=raw_resume_text
    )

    # Generate "Why Not 10/10?" analysis
    why_not_10 = generate_why_not_10(comp_scores, candidate_data, job_data, missing_skills)

    # Determine Recommendation
    final_score = comp_scores.final_score
    if final_score >= settings.STRONG_MATCH_THRESHOLD:
        recommendation = "Strong Match"
    elif final_score >= settings.CONSIDER_THRESHOLD:
        recommendation = "Consider"
    else:
        recommendation = "Low Match"

    # Confidence calculation based on evidence density
    confidence = "High" if len(matched_skills) >= 2 or engine_type == "LLM_HYBRID" else "Medium"

    if not strengths:
        strengths = [f"Matched key requirements: {m.skill}" for m in matched_skills[:3]]
    if not concerns and missing_skills:
        concerns = [f"Missing required skill: {m['skill']}" for m in missing_skills[:2]]

    if not justification:
        if engine_type == "RULE_FALLBACK":
            justification = f"Rule-based fallback analysis: Candidate scored {final_score}/10 based on skill coverage ({len(matched_skills)} matched) and experience comparison."
        else:
            justification = f"Candidate achieves a {final_score}/10 match based on strong alignment with key technical skills and relevant background experience."

    return MatchResultSchema(
        overall_score=final_score,
        component_scores=comp_scores,
        recommendation=recommendation,
        confidence=confidence,
        summary=justification,
        strengths=strengths,
        concerns=concerns,
        why_not_10=why_not_10,
        matched_skills=matched_skills,
        partial_matches=partial_matches,
        missing_skills=missing_skills,
        evidence={
            "matched_skills_count": len(matched_skills),
            "missing_skills_count": len(missing_skills),
            "partial_matches_count": len(partial_matches)
        },
        ai_justification=justification,
        scoring_version=settings.SCORING_VERSION,
        engine_type=engine_type,
        model_name=model_name
    )
