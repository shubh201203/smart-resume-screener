import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Text, JSON, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.database.session import Base

class PipelineState(str, enum.Enum):
    UPLOADED = "UPLOADED"
    TEXT_EXTRACTED = "TEXT_EXTRACTED"
    PROFILE_EXTRACTED = "PROFILE_EXTRACTED"
    JOB_ANALYZED = "JOB_ANALYZED"
    MATCHING = "MATCHING"
    SCORED = "SCORED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class CandidateStatus(str, enum.Enum):
    PENDING = "PENDING"
    SHORTLISTED = "SHORTLISTED"
    REJECTED = "REJECTED"
    UNDER_REVIEW = "UNDER_REVIEW"

class Project(Base):
    __tablename__ = "screening_projects"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    department = Column(String, nullable=True)
    scoring_weights = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("Job", back_populates="project", uselist=False, cascade="all, delete-orphan")
    resumes = relationship("Resume", back_populates="project", cascade="all, delete-orphan")
    candidates = relationship("Candidate", back_populates="project", cascade="all, delete-orphan")

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("screening_projects.id"), nullable=False)
    title = Column(String, nullable=False)
    raw_description = Column(Text, nullable=False)
    parsed_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="job")

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("screening_projects.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_hash = Column(String, nullable=False, index=True)
    file_size = Column(Integer, nullable=False)
    raw_text = Column(Text, nullable=False)
    quality_score = Column(Float, nullable=False, default=8.0)
    quality_label = Column(String, nullable=False, default="Good")
    quality_factors = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="resumes")
    candidate = relationship("Candidate", back_populates="resume", uselist=False, cascade="all, delete-orphan")

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("screening_projects.id"), nullable=False)
    resume_id = Column(String, ForeignKey("resumes.id"), nullable=False)
    
    name = Column(String, nullable=False, default="Unknown Candidate")
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    location = Column(String, nullable=True)
    summary = Column(Text, nullable=True)
    total_years_experience = Column(Float, default=0.0)
    
    pipeline_state = Column(String, default=PipelineState.UPLOADED.value)
    action_status = Column(String, default=CandidateStatus.PENDING.value)
    
    extracted_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="candidates")
    resume = relationship("Resume", back_populates="candidate")
    match_score = relationship("MatchScore", back_populates="candidate", uselist=False, cascade="all, delete-orphan")
    notes = relationship("RecruiterNote", back_populates="candidate", cascade="all, delete-orphan")

class MatchScore(Base):
    __tablename__ = "match_scores"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    candidate_id = Column(String, ForeignKey("candidates.id"), nullable=False)
    project_id = Column(String, ForeignKey("screening_projects.id"), nullable=False)
    
    overall_score = Column(Float, nullable=False)
    component_scores = Column(JSON, nullable=False)  # {skills: float, experience: float, ...}
    recommendation = Column(String, nullable=False)  # Strong Match / Consider / Low Match
    confidence = Column(String, nullable=False, default="High")  # High / Medium / Low
    
    matched_skills = Column(JSON, nullable=True)    # [{skill, evidence, confidence}]
    partial_matches = Column(JSON, nullable=True)   # [{skill, candidate_skill, evidence}]
    missing_skills = Column(JSON, nullable=True)   # [{skill, type: required/preferred}]
    
    evidence = Column(JSON, nullable=True)          # Detailed evidence by category
    strengths = Column(JSON, nullable=True)
    concerns = Column(JSON, nullable=True)
    why_not_10 = Column(JSON, nullable=True)        # Bullet points explaining score reduction
    
    ai_justification = Column(Text, nullable=True)
    scoring_version = Column(String, default="1.0")
    engine_type = Column(String, default="LLM_HYBRID") # LLM_HYBRID or RULE_FALLBACK
    model_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    candidate = relationship("Candidate", back_populates="match_score")

class RecruiterNote(Base):
    __tablename__ = "recruiter_notes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    candidate_id = Column(String, ForeignKey("candidates.id"), nullable=False)
    note_text = Column(Text, nullable=False)
    author = Column(String, default="Recruiter")
    created_at = Column(DateTime, default=datetime.utcnow)

    candidate = relationship("Candidate", back_populates="notes")
