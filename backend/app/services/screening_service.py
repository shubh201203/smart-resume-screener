import json
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.models.domain import Project, Job, Resume, Candidate, MatchScore, PipelineState, CandidateStatus
from app.schemas.domain import ProjectCreate, JobCreate, CandidateProfileSchema, JobProfileSchema
from app.parsers import parse_resume_file, calculate_sha256, evaluate_resume_quality
from app.llm import llm_client, LLMError
from app.matching import (
    process_candidate_matching,
    rule_based_candidate_extraction,
    rule_based_job_extraction
)

def create_project(db: Session, data: ProjectCreate) -> Project:
    project = Project(
        title=data.title,
        department=data.department or "Engineering",
        scoring_weights=data.scoring_weights
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

async def create_and_analyze_job(db: Session, data: JobCreate) -> Job:
    # 1. LLM or Rule Extraction of Job Description
    if llm_client.is_configured:
        try:
            parsed = await llm_client.extract_job_profile(data.raw_description)
        except LLMError:
            parsed = rule_based_job_extraction(data.raw_description)
    else:
        parsed = rule_based_job_extraction(data.raw_description)

    job = Job(
        project_id=data.project_id,
        title=data.title,
        raw_description=data.raw_description,
        parsed_data=parsed
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job

async def upload_and_process_resume(
    db: Session,
    project_id: str,
    filename: str,
    file_bytes: bytes
) -> Candidate:
    # 1. Sanitize filename & SHA-256 Hash Duplicate Check
    from app.parsers import sanitize_filename
    clean_filename = sanitize_filename(filename)

    file_hash = calculate_sha256(file_bytes)
    existing_resume = db.query(Resume).filter(
        Resume.project_id == project_id,
        Resume.file_hash == file_hash
    ).first()

    if existing_resume:
        raise ValueError(f"Duplicate resume detected. '{clean_filename}' has already been uploaded to this project.")

    # 2. Extract Plain Text
    raw_text = parse_resume_file(clean_filename, file_bytes)

    # 3. Resume Quality Check
    q_score, q_label, q_factors = evaluate_resume_quality(raw_text)

    resume = Resume(
        project_id=project_id,
        filename=clean_filename,
        file_hash=file_hash,
        file_size=len(file_bytes),
        raw_text=raw_text,
        quality_score=q_score,
        quality_label=q_label,
        quality_factors=q_factors
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    # 4. Create Initial Candidate with State tracking
    candidate = Candidate(
        project_id=project_id,
        resume_id=resume.id,
        pipeline_state=PipelineState.TEXT_EXTRACTED.value
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)

    # 5. Extract Candidate Profile Structure
    if llm_client.is_configured:
        try:
            cand_profile = await llm_client.extract_candidate_profile(raw_text)
        except LLMError:
            cand_profile = rule_based_candidate_extraction(raw_text)
    else:
        cand_profile = rule_based_candidate_extraction(raw_text)

    contact_info = cand_profile.get("candidate", {})
    candidate.name = contact_info.get("name") or "Unknown Candidate"
    candidate.email = contact_info.get("email")
    candidate.phone = contact_info.get("phone")
    candidate.location = contact_info.get("location")
    candidate.summary = cand_profile.get("summary")
    candidate.total_years_experience = float(cand_profile.get("total_years_experience", 0.0))
    candidate.extracted_data = cand_profile
    candidate.pipeline_state = PipelineState.PROFILE_EXTRACTED.value
    
    db.commit()
    db.refresh(candidate)
    return candidate

async def run_screening_for_project(db: Session, project_id: str) -> List[MatchScore]:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or not project.job:
        raise ValueError("Project or target job description not found.")

    job_data = project.job.parsed_data or {}
    candidates = db.query(Candidate).filter(Candidate.project_id == project_id).all()
    results = []

    for cand in candidates:
        cand.pipeline_state = PipelineState.MATCHING.value
        db.commit()

        raw_resume = cand.resume.raw_text if cand.resume else ""
        cand_data = cand.extracted_data or {}

        # Perform deterministic + LLM evidence matching
        match_result = await process_candidate_matching(
            candidate_data=cand_data,
            job_data=job_data,
            raw_resume_text=raw_resume,
            weights=project.scoring_weights
        )

        # Upsert match score
        existing_score = db.query(MatchScore).filter(MatchScore.candidate_id == cand.id).first()
        if existing_score:
            db.delete(existing_score)
            db.commit()

        db_score = MatchScore(
            candidate_id=cand.id,
            project_id=project_id,
            overall_score=match_result.overall_score,
            component_scores=match_result.component_scores.model_dump(),
            recommendation=match_result.recommendation,
            confidence=match_result.confidence,
            matched_skills=[m.model_dump() for m in match_result.matched_skills],
            partial_matches=match_result.partial_matches,
            missing_skills=match_result.missing_skills,
            evidence=match_result.evidence,
            strengths=match_result.strengths,
            concerns=match_result.concerns,
            why_not_10=match_result.why_not_10,
            ai_justification=match_result.ai_justification,
            scoring_version=match_result.scoring_version,
            engine_type=match_result.engine_type,
            model_name=match_result.model_name
        )
        db.add(db_score)
        
        cand.pipeline_state = PipelineState.COMPLETED.value
        db.commit()
        db.refresh(db_score)
        results.append(db_score)

    return results
