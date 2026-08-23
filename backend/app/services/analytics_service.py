from sqlalchemy.orm import Session
from typing import Dict, Any, List
from collections import Counter
from app.models.domain import Project, Candidate, MatchScore, PipelineState

def get_project_analytics(db: Session, project_id: str) -> Dict[str, Any]:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return {}

    candidates = db.query(Candidate).filter(Candidate.project_id == project_id).all()
    total_candidates = len(candidates)
    
    completed_candidates = [c for c in candidates if c.pipeline_state == PipelineState.COMPLETED.value]
    screened_count = len(completed_candidates)

    match_scores = db.query(MatchScore).filter(MatchScore.project_id == project_id).all()

    if not match_scores:
        return {
            "total_candidates": total_candidates,
            "screened_count": screened_count,
            "strong_matches_count": 0,
            "average_score": 0.0,
            "median_score": 0.0,
            "processing_success_rate": 100.0,
            "score_distribution": [
                {"range": "8.0 - 10.0 (Strong)", "count": 0},
                {"range": "6.0 - 7.9 (Consider)", "count": 0},
                {"range": "1.0 - 5.9 (Low)", "count": 0}
            ],
            "recommendation_breakdown": {"Strong Match": 0, "Consider": 0, "Low Match": 0},
            "top_required_skills": [],
            "candidate_skill_coverage": [],
            "common_missing_gaps": []
        }

    scores = [m.overall_score for m in match_scores]
    avg_score = round(sum(scores) / len(scores), 1)
    
    sorted_scores = sorted(scores)
    n = len(sorted_scores)
    median_score = sorted_scores[n // 2] if n % 2 != 0 else round((sorted_scores[n // 2 - 1] + sorted_scores[n // 2]) / 2, 1)

    strong_count = len([s for s in scores if s >= 8.0])
    consider_count = len([s for s in scores if 6.0 <= s < 8.0])
    low_count = len([s for s in scores if s < 6.0])

    score_distribution = [
        {"range": "8.0 - 10.0 (Strong)", "count": strong_count},
        {"range": "6.0 - 7.9 (Consider)", "count": consider_count},
        {"range": "1.0 - 5.9 (Low)", "count": low_count}
    ]

    # Skill coverage & gap analytics
    job_req_skills = project.job.parsed_data.get("required_skills", []) if project.job and project.job.parsed_data else []
    
    matched_skill_counter = Counter()
    missing_skill_counter = Counter()

    for m in match_scores:
        if m.matched_skills:
            for ms in m.matched_skills:
                matched_skill_counter[ms.get("skill", "")] += 1
        if m.missing_skills:
            for ms in m.missing_skills:
                missing_skill_counter[ms.get("skill", "")] += 1

    candidate_skill_coverage = []
    if screened_count > 0:
        for skill in job_req_skills:
            count = matched_skill_counter.get(skill, 0)
            cov_pct = round((count / screened_count) * 100, 1)
            candidate_skill_coverage.append({"skill": skill, "coverage_pct": cov_pct, "count": count})

    common_missing_gaps = [
        {"skill": skill, "gap_count": count}
        for skill, count in missing_skill_counter.most_common(5) if skill
    ]

    return {
        "total_candidates": total_candidates,
        "screened_count": screened_count,
        "strong_matches_count": strong_count,
        "average_score": avg_score,
        "median_score": median_score,
        "processing_success_rate": 100.0,
        "score_distribution": score_distribution,
        "recommendation_breakdown": {
            "Strong Match": strong_count,
            "Consider": consider_count,
            "Low Match": low_count
        },
        "top_required_skills": job_req_skills,
        "candidate_skill_coverage": candidate_skill_coverage,
        "common_missing_gaps": common_missing_gaps
    }
