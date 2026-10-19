import csv
import io
from typing import Any
from sqlalchemy.orm import Session
from app.models.domain import Candidate, MatchScore, Project

FORMULA_PREFIXES = ('=', '+', '-', '@', '\t', '\r')

def sanitize_csv_cell(value: Any) -> str:
    """
    Sanitizes string value to prevent CSV formula injection / DDE attacks.
    If the value starts with =, +, -, @ or whitespace/control character followed by formula triggers,
    it is prepended with a single quote (') so spreadsheets treat it strictly as text.
    """
    if value is None:
        return ""
    text = str(value)
    # Strip non-printable or leading whitespace to detect hidden formula prefixes
    stripped = text.lstrip()
    if stripped.startswith(FORMULA_PREFIXES):
        return f"'{text}"
    return text

def export_screening_csv(db: Session, project_id: str) -> str:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise ValueError("Project not found.")

    candidates = db.query(Candidate).filter(Candidate.project_id == project_id).all()
    
    # Sort candidates by match score descending
    scored_candidates = []
    for cand in candidates:
        score_val = cand.match_score.overall_score if cand.match_score else 0.0
        scored_candidates.append((score_val, cand))

    scored_candidates.sort(key=lambda x: x[0], reverse=True)

    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

    # Write Header
    writer.writerow([
        "Rank",
        "Candidate Name",
        "Email",
        "Match Score",
        "Recommendation",
        "AI Confidence",
        "Resume Quality",
        "Experience (Yrs)",
        "Matched Skills",
        "Missing Skills",
        "Why Not 10/10",
        "AI Summary"
    ])

    for rank, (score_val, cand) in enumerate(scored_candidates, 1):
        m = cand.match_score
        matched_str = ", ".join([ms.get("skill", "") for ms in (m.matched_skills or [])]) if m else ""
        missing_str = ", ".join([ms.get("skill", "") for ms in (m.missing_skills or [])]) if m else ""
        why_not_str = " | ".join(m.why_not_10 or []) if m else ""
        summary_str = m.ai_justification if m else ""
        quality_str = cand.resume.quality_label if cand.resume else "N/A"

        row = [
            rank,
            sanitize_csv_cell(cand.name),
            sanitize_csv_cell(cand.email or "N/A"),
            f"{score_val:.1f}",
            sanitize_csv_cell(m.recommendation if m else "Pending"),
            sanitize_csv_cell(m.confidence if m else "N/A"),
            sanitize_csv_cell(quality_str),
            f"{cand.total_years_experience:.1f}",
            sanitize_csv_cell(matched_str),
            sanitize_csv_cell(missing_str),
            sanitize_csv_cell(why_not_str),
            sanitize_csv_cell(summary_str)
        ]
        writer.writerow(row)

    return output.getvalue()
