from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.models.domain import Candidate, MatchScore, Project
from app.llm import llm_client, LLMError

async def compare_candidates_service(db: Session, candidate_ids: List[str]) -> Dict[str, Any]:
    if len(candidate_ids) > 3:
        raise ValueError("Comparison is limited to a maximum of 3 candidates.")

    candidates = db.query(Candidate).filter(Candidate.id.in_(candidate_ids)).all()
    if not candidates:
        raise ValueError("No valid candidates found for comparison.")

    compared_list = []
    candidates_summary_lines = []
    job_title = "Target Job Role"

    for cand in candidates:
        if cand.project and cand.project.job:
            job_title = cand.project.job.title

        match = cand.match_score
        cand_dict = {
            "id": cand.id,
            "name": cand.name,
            "email": cand.email,
            "total_years_experience": cand.total_years_experience,
            "overall_score": match.overall_score if match else 0.0,
            "recommendation": match.recommendation if match else "N/A",
            "component_scores": match.component_scores if match else {},
            "matched_skills": [m.get("skill") for m in (match.matched_skills or [])] if match else [],
            "missing_skills": [m.get("skill") for m in (match.missing_skills or [])] if match else [],
            "strengths": match.strengths if match else [],
            "why_not_10": match.why_not_10 if match else []
        }
        compared_list.append(cand_dict)

        cand_summary = f"- {cand.name}: Score {cand_dict['overall_score']}/10, Recommendation: {cand_dict['recommendation']}, Experience: {cand.total_years_experience} yrs. Matched skills: {', '.join(cand_dict['matched_skills'][:3])}."
        candidates_summary_lines.append(cand_summary)

    summary_text = ""
    if llm_client.is_configured:
        try:
            summary_text = await llm_client.compare_candidates(
                job_title=job_title,
                candidates_summary="\n".join(candidates_summary_lines)
            )
        except LLMError:
            summary_text = generate_rule_comparison_summary(compared_list)
    else:
        summary_text = generate_rule_comparison_summary(compared_list)

    return {
        "job_title": job_title,
        "candidates": compared_list,
        "comparison_summary": summary_text
    }

def generate_rule_comparison_summary(candidates: List[Dict[str, Any]]) -> str:
    """Deterministic fallback comparison summary."""
    sorted_cand = sorted(candidates, key=lambda x: x["overall_score"], reverse=True)
    top = sorted_cand[0]
    
    if len(candidates) == 1:
        return f"{top['name']} is evaluated with a match score of {top['overall_score']}/10 ({top['recommendation']})."

    second = sorted_cand[1]
    return f"{top['name']} demonstrates the highest overall match score ({top['overall_score']}/10) driven by strong technical skill coverage. {second['name']} ({second['overall_score']}/10) offers complementary background, but {top['name']} is recommended for strongest immediate job fit."
