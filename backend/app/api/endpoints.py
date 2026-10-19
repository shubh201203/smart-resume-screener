from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from app.database.session import get_db
from app.models.domain import Project, Job, Resume, Candidate, MatchScore, RecruiterNote
from app.schemas.domain import (
    APIResponse, ErrorDetail, ProjectCreate, JobCreate, RecruiterNoteCreate,
    CandidateStatusUpdate, ComparisonRequest, ProjectWeightsUpdate
)
from app.services import (
    create_project, create_and_analyze_job, upload_and_process_resume,
    run_screening_for_project, get_project_analytics, compare_candidates_service,
    seed_demo_data, export_screening_csv
)

router = APIRouter()

# --- PROJECTS & JOBS ---
@router.post("/projects", response_model=APIResponse[Dict[str, Any]])
def api_create_project(data: ProjectCreate, db: Session = Depends(get_db)):
    project = create_project(db, data)
    return APIResponse(data={"id": project.id, "title": project.title, "department": project.department})

@router.get("/projects", response_model=APIResponse[List[Dict[str, Any]]])
def api_list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    result = []
    for p in projects:
        cand_count = db.query(Candidate).filter(Candidate.project_id == p.id).count()
        result.append({
            "id": p.id,
            "title": p.title,
            "department": p.department,
            "candidate_count": cand_count,
            "has_job": bool(p.job),
            "created_at": p.created_at.isoformat()
        })
    return APIResponse(data=result)

@router.get("/projects/{project_id}", response_model=APIResponse[Dict[str, Any]])
def api_get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    candidates = db.query(Candidate).filter(Candidate.project_id == project_id).all()
    cand_list = []

    for c in candidates:
        m = c.match_score
        cand_list.append({
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "location": c.location,
            "total_years_experience": c.total_years_experience,
            "pipeline_state": c.pipeline_state,
            "action_status": c.action_status,
            "overall_score": m.overall_score if m else None,
            "recommendation": m.recommendation if m else "Pending",
            "confidence": m.confidence if m else "N/A",
            "resume_quality": c.resume.quality_label if c.resume else "N/A",
            "matched_skills": [ms.get("skill") for ms in (m.matched_skills or [])] if m else [],
            "missing_skills": [ms.get("skill") for ms in (m.missing_skills or [])] if m else []
        })

    job_data = None
    if project.job:
        job_data = {
            "id": project.job.id,
            "title": project.job.title,
            "raw_description": project.job.raw_description,
            "parsed": project.job.parsed_data
        }

    return APIResponse(data={
        "id": project.id,
        "title": project.title,
        "department": project.department,
        "scoring_weights": project.scoring_weights,
        "created_at": project.created_at.isoformat(),
        "job": job_data,
        "candidates": cand_list
    })

@router.put("/projects/{project_id}/weights", response_model=APIResponse[Dict[str, Any]])
async def api_update_project_weights(
    project_id: str,
    data: ProjectWeightsUpdate,
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    from app.matching.engine import normalize_and_validate_weights
    normalized = normalize_and_validate_weights(data.scoring_weights)

    # Persist updated weights
    project.scoring_weights = normalized
    db.commit()
    db.refresh(project)

    # If project has a job and candidates, re-screen to recalculate rankings with new weights
    recalculated_count = 0
    if project.job:
        candidates = db.query(Candidate).filter(Candidate.project_id == project_id).all()
        for cand in candidates:
            if cand.match_score:
                from app.matching import process_candidate_matching
                raw_text = cand.resume.raw_text if cand.resume else ""
                match_result = await process_candidate_matching(
                    candidate_data=cand.extracted_data or {},
                    job_data=project.job.parsed_data or {},
                    raw_resume_text=raw_text,
                    weights=normalized
                )
                cand.match_score.overall_score = match_result.overall_score
                cand.match_score.component_scores = match_result.component_scores.model_dump()
                cand.match_score.recommendation = match_result.recommendation
                cand.match_score.confidence = match_result.confidence
                cand.match_score.matched_skills = [m.model_dump() for m in match_result.matched_skills]
                cand.match_score.partial_matches = match_result.partial_matches
                cand.match_score.missing_skills = match_result.missing_skills
                cand.match_score.why_not_10 = match_result.why_not_10
                cand.match_score.ai_justification = match_result.ai_justification
                recalculated_count += 1
        db.commit()

    return APIResponse(data={
        "id": project.id,
        "scoring_weights": project.scoring_weights,
        "recalculated_candidates": recalculated_count,
        "message": "Scoring weights updated and rankings recalculated successfully."
    })

@router.post("/jobs", response_model=APIResponse[Dict[str, Any]])
async def api_create_job(data: JobCreate, db: Session = Depends(get_db)):
    try:
        job = await create_and_analyze_job(db, data)
        return APIResponse(data={
            "id": job.id,
            "project_id": job.project_id,
            "title": job.title,
            "parsed_data": job.parsed_data
        })
    except Exception as e:
        return APIResponse(success=False, error=ErrorDetail(code="JOB_PARSE_ERROR", message=str(e)))

# --- RESUMES & SCREENING ---
@router.post("/resumes/upload", response_model=APIResponse[List[Dict[str, Any]]])
async def api_upload_resumes(
    project_id: str = Form(...),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    results = []
    errors = []

    for file in files:
        try:
            content = await file.read()
            cand = await upload_and_process_resume(db, project_id, file.filename, content)
            results.append({
                "candidate_id": cand.id,
                "filename": file.filename,
                "name": cand.name,
                "status": cand.pipeline_state,
                "quality_label": cand.resume.quality_label if cand.resume else "Good"
            })
        except ValueError as ve:
            errors.append({"filename": file.filename, "error": str(ve)})
        except Exception as e:
            errors.append({"filename": file.filename, "error": f"Failed to parse resume: {str(e)}"})

    if not results and errors:
        return APIResponse(success=False, error=ErrorDetail(code="UPLOAD_FAILED", message=errors[0]["error"], details=errors))

    return APIResponse(data=results)

@router.post("/screening/{project_id}/run", response_model=APIResponse[Dict[str, Any]])
async def api_run_screening(project_id: str, db: Session = Depends(get_db)):
    try:
        results = await run_screening_for_project(db, project_id)
        return APIResponse(data={
            "screened_count": len(results),
            "message": f"Successfully screened and scored {len(results)} candidates."
        })
    except Exception as e:
        return APIResponse(success=False, error=ErrorDetail(code="SCREENING_FAILED", message=str(e)))

# --- CANDIDATES ---
@router.get("/candidates/{candidate_id}", response_model=APIResponse[Dict[str, Any]])
def api_get_candidate(candidate_id: str, db: Session = Depends(get_db)):
    cand = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    notes = db.query(RecruiterNote).filter(RecruiterNote.candidate_id == candidate_id).order_by(RecruiterNote.created_at.desc()).all()
    notes_list = [{"id": n.id, "note_text": n.note_text, "author": n.author, "created_at": n.created_at.isoformat()} for n in notes]

    match_data = None
    if cand.match_score:
        m = cand.match_score
        match_data = {
            "overall_score": m.overall_score,
            "component_scores": m.component_scores,
            "recommendation": m.recommendation,
            "confidence": m.confidence,
            "matched_skills": m.matched_skills,
            "partial_matches": m.partial_matches,
            "missing_skills": m.missing_skills,
            "evidence": m.evidence,
            "strengths": m.strengths,
            "concerns": m.concerns,
            "why_not_10": m.why_not_10,
            "ai_justification": m.ai_justification,
            "engine_type": m.engine_type,
            "model_name": m.model_name
        }

    resume_data = None
    if cand.resume:
        r = cand.resume
        resume_data = {
            "id": r.id,
            "filename": r.filename,
            "file_size": r.file_size,
            "quality_score": r.quality_score,
            "quality_label": r.quality_label,
            "quality_factors": r.quality_factors,
            "raw_text": r.raw_text
        }

    return APIResponse(data={
        "id": cand.id,
        "project_id": cand.project_id,
        "name": cand.name,
        "email": cand.email,
        "phone": cand.phone,
        "location": cand.location,
        "summary": cand.summary,
        "total_years_experience": cand.total_years_experience,
        "pipeline_state": cand.pipeline_state,
        "action_status": cand.action_status,
        "extracted_data": cand.extracted_data,
        "match_score": match_data,
        "resume": resume_data,
        "notes": notes_list
    })

@router.post("/candidates/{candidate_id}/status", response_model=APIResponse[Dict[str, Any]])
def api_update_candidate_status(candidate_id: str, data: CandidateStatusUpdate, db: Session = Depends(get_db)):
    cand = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    cand.action_status = data.action_status
    db.commit()
    return APIResponse(data={"id": cand.id, "action_status": cand.action_status})

@router.post("/candidates/{candidate_id}/notes", response_model=APIResponse[Dict[str, Any]])
def api_add_recruiter_note(candidate_id: str, data: RecruiterNoteCreate, db: Session = Depends(get_db)):
    cand = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    note = RecruiterNote(candidate_id=candidate_id, note_text=data.note_text)
    db.add(note)
    db.commit()
    db.refresh(note)

    return APIResponse(data={"id": note.id, "note_text": note.note_text, "created_at": note.created_at.isoformat()})

@router.post("/candidates/compare", response_model=APIResponse[Dict[str, Any]])
async def api_compare_candidates(data: ComparisonRequest, db: Session = Depends(get_db)):
    try:
        comp_result = await compare_candidates_service(db, data.candidate_ids)
        return APIResponse(data=comp_result)
    except ValueError as ve:
        return APIResponse(success=False, error=ErrorDetail(code="COMPARISON_ERROR", message=str(ve)))

# --- ANALYTICS & EXPORT ---
@router.get("/analytics/{project_id}", response_model=APIResponse[Dict[str, Any]])
def api_get_analytics(project_id: str, db: Session = Depends(get_db)):
    analytics = get_project_analytics(db, project_id)
    return APIResponse(data=analytics)

@router.get("/export/{project_id}/csv")
def api_export_csv(project_id: str, db: Session = Depends(get_db)):
    try:
        csv_content = export_screening_csv(db, project_id)
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=screening_results_{project_id[:8]}.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- DEMO DATA SEEDING ---
@router.post("/demo/load", response_model=APIResponse[Dict[str, Any]])
async def api_load_demo_data(db: Session = Depends(get_db)):
    try:
        result = await seed_demo_data(db)
        return APIResponse(data=result)
    except Exception as e:
        return APIResponse(success=False, error=ErrorDetail(code="DEMO_SEED_FAILED", message=str(e)))
