import pytest
import io
from app.parsers import parse_resume_file, extract_text_from_pdf, extract_text_from_txt, calculate_sha256, evaluate_resume_quality
from app.matching import calculate_deterministic_scores, generate_why_not_10, rule_based_candidate_extraction, rule_based_job_extraction
from app.database.session import SessionLocal, Base, engine
from app.models.domain import Project, Job, Candidate, MatchScore
from app.schemas.domain import ProjectCreate, JobCreate
from app.services import create_project, create_and_analyze_job, seed_demo_data, export_screening_csv, compare_candidates_service
from app.llm.client import llm_client

@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 1. PARSING & TEXT EXTRACTION TESTS ---
def test_txt_extraction():
    content = "John Doe\nEmail: john@example.com\nSkills: Python, FastAPI, PostgreSQL".encode("utf-8")
    extracted = extract_text_from_txt(content)
    assert "John Doe" in extracted
    assert "john@example.com" in extracted

def test_empty_txt_rejection():
    with pytest.raises(ValueError, match="empty"):
        extract_text_from_txt(b"   ")

def test_empty_pdf_rejection():
    with pytest.raises(ValueError, match="empty"):
        extract_text_from_pdf(b"")

def test_malformed_pdf_rejection():
    with pytest.raises(ValueError, match="Unable to extract text"):
        extract_text_from_pdf(b"%PDF-1.4 Invalid Corrupted Content Header")

def test_unsupported_file_extension_rejection():
    with pytest.raises(ValueError, match="Unsupported file format"):
        parse_resume_file("resume.docx", b"Some word document bytes")

# --- 2. FILE HANDLING & HASH TESTS ---
def test_sha256_hash_consistency():
    content = b"Candidate resume string for SHA-256 testing"
    h1 = calculate_sha256(content)
    h2 = calculate_sha256(content)
    assert len(h1) == 64
    assert h1 == h2

def test_sha256_different_files_different_hashes():
    h1 = calculate_sha256(b"Resume Content Version A")
    h2 = calculate_sha256(b"Resume Content Version B")
    assert h1 != h2

# --- 3. RESUME QUALITY INDEX TESTS ---
def test_resume_quality_complete_resume():
    sample = """
    ALEX RIVERA
    Email: alex@example.com | Phone: (555) 019-2831 | San Francisco, CA
    
    SUMMARY
    Senior Backend Software Engineer with 5 years experience in Python and PostgreSQL.
    
    WORK EXPERIENCE
    Senior Developer | Tech Corp | 2021 - Present
    - Built RESTful microservices using FastAPI and Docker containers.
    
    EDUCATION
    B.S. in Computer Science | UC Berkeley (2020)
    
    SKILLS
    Python, FastAPI, PostgreSQL, Docker, AWS, Git
    """
    score, label, factors = evaluate_resume_quality(sample)
    assert score >= 7.5
    assert label in ["Excellent", "Good"]

def test_resume_quality_missing_contact_info():
    sample = """
    Software Developer Background
    Built various web apps and backend services using Node.js and SQL.
    Worked on software engineering teams.
    """
    score, label, factors = evaluate_resume_quality(sample)
    assert score < 7.0
    assert any("contact" in f.lower() for f in factors)

def test_resume_quality_very_short_resume():
    sample = "Alex Rivera - Software Engineer - Python Developer"
    score, label, factors = evaluate_resume_quality(sample)
    assert score <= 5.0
    assert label in ["Needs Review", "Poor"]

# --- 4. DETERMINISTIC SCORING MATHEMATICS TESTS ---
def test_deterministic_scoring_exact_math():
    cand_data = {
        "skills": ["Python", "FastAPI", "PostgreSQL", "Docker"],
        "total_years_experience": 4.0,
        "education": [{"degree": "B.S. Computer Science"}],
        "projects": [{"title": "Cloud API", "description": "FastAPI microservices"}],
        "certifications": [{"name": "AWS Certified"}]
    }

    job_data = {
        "required_skills": ["Python", "FastAPI", "PostgreSQL", "Docker"],
        "preferred_skills": ["AWS", "Kubernetes"],
        "required_experience_years": 3.0,
        "education_requirements": ["B.S. Computer Science"],
        "certifications": ["AWS Certified"]
    }

    weights = {"skills": 0.35, "experience": 0.20, "semantic_fit": 0.20, "projects": 0.15, "education": 0.05, "certifications": 0.05}
    raw_text = "Python FastAPI PostgreSQL Docker AWS B.S. Computer Science 4 years experience"

    comp_scores, matched, partial, missing = calculate_deterministic_scores(
        candidate_data=cand_data,
        job_data=job_data,
        semantic_fit_raw=9.0,
        weights=weights,
        raw_resume_text=raw_text
    )

    # Check bounds
    assert 1.0 <= comp_scores.final_score <= 10.0
    assert comp_scores.skills >= 8.0
    assert comp_scores.experience >= 9.0

def test_scoring_weights_sum_normalization():
    weights = {"skills": 0.35, "experience": 0.20, "semantic_fit": 0.20, "projects": 0.15, "education": 0.05, "certifications": 0.05}
    total = sum(weights.values())
    assert round(total, 2) == 1.00

def test_perfect_candidate_score():
    cand = {
        "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS", "Kubernetes"],
        "total_years_experience": 5.0,
        "education": [{"degree": "B.S. Computer Science"}],
        "projects": [{"title": "Cloud Microservice", "description": "Python FastAPI PostgreSQL Docker AWS"}],
        "certifications": [{"name": "AWS Certified"}]
    }
    job = {
        "required_skills": ["Python", "FastAPI", "PostgreSQL"],
        "preferred_skills": ["Docker", "AWS"],
        "required_experience_years": 3.0,
        "education_requirements": ["Computer Science"],
        "certifications": ["AWS Certified"]
    }
    comp_scores, _, _, _ = calculate_deterministic_scores(cand, job, 10.0, {"skills": 0.35, "experience": 0.20, "semantic_fit": 0.20, "projects": 0.15, "education": 0.05, "certifications": 0.05}, "Python FastAPI PostgreSQL Docker AWS 5 years")
    assert comp_scores.final_score >= 9.0

def test_zero_match_candidate_score():
    cand = {"skills": ["Graphic Design", "Photoshop"], "total_years_experience": 0.5}
    job = {"required_skills": ["C++", "Assembly", "RTOS"], "required_experience_years": 5.0}
    comp_scores, _, _, missing = calculate_deterministic_scores(cand, job, 2.0, {"skills": 0.35, "experience": 0.20, "semantic_fit": 0.20, "projects": 0.15, "education": 0.05, "certifications": 0.05}, "Graphic Design Photoshop 0.5 years")
    assert comp_scores.final_score <= 5.0

# --- 5. EXPLAINABILITY & WHY NOT 10 TESTS ---
def test_why_not_10_generator_insights():
    comp_scores, _, _, missing = calculate_deterministic_scores(
        candidate_data={"skills": ["Python"], "total_years_experience": 1.5},
        job_data={"required_skills": ["Python", "AWS", "Kubernetes"], "required_experience_years": 4.0},
        semantic_fit_raw=5.0,
        weights={"skills": 0.35, "experience": 0.20, "semantic_fit": 0.20, "projects": 0.15, "education": 0.05, "certifications": 0.05},
        raw_resume_text="Python 1.5 years experience"
    )
    why_not = generate_why_not_10(comp_scores, {"total_years_experience": 1.5}, {"required_experience_years": 4.0}, missing)
    assert len(why_not) > 0
    assert any("experience" in w.lower() or "required" in w.lower() for w in why_not)

# --- 6. FALLBACK ENGINE TESTS ---
def test_rule_fallback_extraction():
    sample = "Alex Rivera\nEmail: alex@example.com\nWorked 4 years building Python APIs and PostgreSQL databases."
    cand = rule_based_candidate_extraction(sample)
    assert cand["candidate"]["name"] == "Alex Rivera"
    assert cand["candidate"]["email"] == "alex@example.com"
    assert cand["total_years_experience"] >= 3.0

# --- 7. LLM RESILIENCE TESTS ---
def test_llm_json_cleaning_markdown_wrapped():
    raw_response = """
    Here is the requested extraction:
    ```json
    {
      "candidate": {
        "name": "Jane Doe",
        "email": "jane@example.com"
      },
      "skills": ["Python", "FastAPI"]
    }
    ```
    """
    cleaned = llm_client._clean_and_parse_json(raw_response)
    assert cleaned["candidate"]["name"] == "Jane Doe"
    assert "FastAPI" in cleaned["skills"]

# --- 8. DATABASE PERSISTENCE TESTS ---
def test_db_persistence_across_separate_sessions():
    # Session 1: Create project & job
    db1 = SessionLocal()
    proj = Project(title="Persistence Test Project", department="QA")
    db1.add(proj)
    db1.commit()
    proj_id = proj.id
    db1.close()

    # Session 2: Re-open DB and verify project exists
    db2 = SessionLocal()
    queried_proj = db2.query(Project).filter(Project.id == proj_id).first()
    assert queried_proj is not None
    assert queried_proj.title == "Persistence Test Project"
    db2.close()

# --- 9. API & END-TO-END DEMO TESTS ---
@pytest.mark.asyncio
async def test_demo_load_and_csv_export(db_session):
    result = await seed_demo_data(db_session)
    assert result["candidates_created"] == 5
    assert result["project_id"] is not None

    csv_output = export_screening_csv(db_session, result["project_id"])
    assert "Rank" in csv_output
    assert "Alex Rivera" in csv_output

@pytest.mark.asyncio
async def test_candidate_comparison(db_session):
    result = await seed_demo_data(db_session)
    proj_id = result["project_id"]
    
    candidates = db_session.query(Candidate).filter(Candidate.project_id == proj_id).limit(2).all()
    cids = [c.id for c in candidates]
    
    comp_result = await compare_candidates_service(db_session, cids)
    assert comp_result["job_title"] is not None
    assert len(comp_result["candidates"]) == 2
    assert len(comp_result["comparison_summary"]) > 10
