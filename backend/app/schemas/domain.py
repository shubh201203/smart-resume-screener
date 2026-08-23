from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Generic, TypeVar, Dict, Any
from datetime import datetime

T = TypeVar("T")

# API Standard Response Pattern
class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None

class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    error: Optional[ErrorDetail] = None

# --- Candidate Profile Extraction Schemas ---
class ExperienceItem(BaseModel):
    company: str = ""
    role: str = ""
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    duration_months: int = 0
    responsibilities: List[str] = Field(default_factory=list)
    technologies: List[str] = Field(default_factory=list)

class EducationItem(BaseModel):
    degree: str = ""
    field: str = ""
    institution: str = ""
    graduation_year: Optional[str] = None

class ProjectItem(BaseModel):
    title: str = ""
    description: str = ""
    technologies: List[str] = Field(default_factory=list)

class CertificationItem(BaseModel):
    name: str = ""
    issuer: Optional[str] = None
    year: Optional[str] = None

class CandidateContact(BaseModel):
    name: str = "Unknown Candidate"
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None

class CandidateProfileSchema(BaseModel):
    candidate: CandidateContact = Field(default_factory=CandidateContact)
    summary: str = ""
    skills: List[str] = Field(default_factory=list)
    technical_skills: List[str] = Field(default_factory=list)
    soft_skills: List[str] = Field(default_factory=list)
    education: List[EducationItem] = Field(default_factory=list)
    experience: List[ExperienceItem] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    certifications: List[CertificationItem] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)
    total_years_experience: float = 0.0

# --- Job Requirements Extraction Schema ---
class JobProfileSchema(BaseModel):
    job_title: str = ""
    seniority: str = ""
    required_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    required_experience_years: float = 0.0
    education_requirements: List[str] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    responsibilities: List[str] = Field(default_factory=list)
    technologies: List[str] = Field(default_factory=list)
    soft_skills: List[str] = Field(default_factory=list)

# --- Matching & Evidence Schemas ---
class SkillMatchItem(BaseModel):
    skill: str
    status: str  # matched, partial, missing
    confidence: float = 1.0
    evidence: str = ""
    type: str = "required"  # required or preferred

class ComponentScores(BaseModel):
    skills: float
    experience: float
    semantic_fit: float
    projects: float
    education: float
    certifications: float
    final_score: float

class MatchResultSchema(BaseModel):
    overall_score: float
    component_scores: ComponentScores
    recommendation: str  # Strong Match, Consider, Low Match
    confidence: str      # High, Medium, Low
    summary: str
    strengths: List[str] = Field(default_factory=list)
    concerns: List[str] = Field(default_factory=list)
    why_not_10: List[str] = Field(default_factory=list)
    matched_skills: List[SkillMatchItem] = Field(default_factory=list)
    partial_matches: List[Dict[str, Any]] = Field(default_factory=list)
    missing_skills: List[Dict[str, Any]] = Field(default_factory=list)
    evidence: Dict[str, Any] = Field(default_factory=dict)
    ai_justification: str = ""
    scoring_version: str = "1.0"
    engine_type: str = "LLM_HYBRID"
    model_name: str = ""

# --- API Request & Response Models ---
class ProjectCreate(BaseModel):
    title: str
    department: Optional[str] = None
    scoring_weights: Optional[Dict[str, float]] = None

class JobCreate(BaseModel):
    project_id: str
    title: str
    raw_description: str

class RecruiterNoteCreate(BaseModel):
    note_text: str

class CandidateStatusUpdate(BaseModel):
    action_status: str # SHORTLISTED, REJECTED, UNDER_REVIEW, PENDING

class ComparisonRequest(BaseModel):
    candidate_ids: List[str] = Field(..., max_length=3)
