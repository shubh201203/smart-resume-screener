# SmartResume AI — AI-Powered Resume Screener & Recruitment Intelligence Platform

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![SQLAlchemy](https://img.shields.io/badge/ORM-SQLAlchemy_2.0-D71F00?style=flat)](https://www.sqlalchemy.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_|_SQLite-4169E1?style=flat&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Pytest](https://img.shields.io/badge/Tests-29%20Passed-brightgreen?style=flat&logo=pytest&logoColor=white)](https://docs.pytest.org/)
[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-success?style=flat&logo=vercel&logoColor=white)](https://smart-resume-screener-pi.vercel.app/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> A full-stack, data-driven recruitment intelligence platform combining hybrid AI parsing, deterministic math-based candidate scoring, direct textual evidence extraction, and recruiter analytics.

**Live Demo:** [https://smart-resume-screener-pi.vercel.app/](https://smart-resume-screener-pi.vercel.app/)  
**Backend API:** [https://smart-resume-screener-qlag.onrender.com/health](https://smart-resume-screener-qlag.onrender.com/health)  
**Repository:** [https://github.com/shubh201203/smart-resume-screener](https://github.com/shubh201203/smart-resume-screener)  
**Developer:** [Shubh Sharma](https://github.com/shubh201203) | [Portfolio](https://shubh201203.github.io/portfolio/) | [LinkedIn](https://www.linkedin.com/in/shubh-sharma-2067981b5)  
**Target Roles:** Data Analyst Intern · Python Developer Intern · AI/ML Intern

---

## 🎯 1. Overview & Problem Statement

### The Problem
Traditional Applicant Tracking Systems (ATS) and early AI screening tools suffer from two major failure modes:
1. **Keyword Rigidity:** Conventional keyword filters reject qualified applicants who describe skills with synonymy or contextual phrasing (e.g., rejecting an applicant experienced in "building high-throughput REST APIs with Express & MongoDB" for a job requiring "Node.js backend engineering").
2. **Black-Box AI Hallucinations:** Generative AI solutions often produce opaque 1–10 scores without transparent justification or grounded evidence, inventing qualifications or penalizing candidates without recruiter auditability.

### The Solution: SmartResume AI
SmartResume AI implements an **auditable, evidence-grounded screening pipeline**:
- **Semantic Understanding:** Recognizes technology equivalence and contextual experience depth without keyword gaming.
- **Direct Evidence Quotation:** Matches skills against verbatim resume text snippets—every matched skill or gap cites textual evidence from the uploaded document.
- **Deterministic Math Scoring:** The LLM does **not** pick the final score. A transparent, strictly normalized weighted formula calculates match scores on a continuous scale ($1.0\text{--}10.0$).
- **"WHY NOT 10/10?" Diagnostic Feedback:** Explicitly identifies what candidate credentials were missing or partially met to explain score reductions.
- **Recruiter Workflow Suite:** Provides side-by-side multi-candidate comparison, interactive project scoring weight adjustments, visual skill coverage analytics, and sanitized CSV exports.

---

## 🏗️ 2. Architecture & Pipeline

```mermaid
flowchart TD
    A["Resume Upload (PDF / TXT)"] --> B["SHA-256 Deduplication & Size Check (10MB)"]
    B --> C["In-Memory Text Extraction & Resume Quality Index"]
    C --> D["Structured Entity Extraction (JSON)"]
    D --> E{"LLM Configured?"}
    E -- Yes --> F["LLM Semantic Extraction & Evidence Grounding"]
    E -- No / Fallback --> G["Rule-Based Extraction & TF-IDF Cosine Similarity"]
    F --> H["Deterministic Weighted Math Engine (1.0 - 10.0)"]
    G --> H
    H --> I["Diagnostic 'Why Not 10/10?' & Recommendation"]
    I --> J["Recruiter SaaS Dashboard (Ranking, Compare, Analytics, CSV Export)"]
```

### Architectural Highlights
- **Decoupled Client-Server Layout:** React 19 Single-Page Application communicating via RESTful JSON endpoints with a high-performance Python FastAPI backend.
- **In-Memory File Processing:** Uploaded resume files are parsed in-memory, computing SHA-256 hashes for deduplication and saving raw text directly to relational storage. No files depend on local ephemeral disk.
- **Dual Database Compatibility:** Native zero-configuration SQLite for rapid local development, alongside automated normalization for Neon Serverless PostgreSQL (`postgresql+psycopg2://`) with connection pooling (`pool_pre_ping=True`, `pool_recycle=300`) in production.
- **Fail-Open Fallback Engine:** Operates autonomously with zero external API dependencies using Scikit-Learn TF-IDF cosine similarity and regex-based extraction if an LLM API key is not configured or rate-limited.

---

## 🧮 3. Deterministic Scoring Methodology

Scores are computed mathematically via normalized component weights ($\sum w_i = 1.0$), mapping to an absolute range of $1.0\text{--}10.0$:

$$\text{Final Score} = w_{\text{skills}} S_{\text{skills}} + w_{\text{exp}} S_{\text{exp}} + w_{\text{semantic}} S_{\text{semantic}} + w_{\text{projects}} S_{\text{projects}} + w_{\text{edu}} S_{\text{edu}} + w_{\text{cert}} S_{\text{cert}}$$

### Default Component Breakdown

| Component | Default Weight | Scoring Method |
| :--- | :---: | :--- |
| **Skills Match Coverage ($S_{\text{skills}}$)** | **35%** | $$\frac{\text{Matched Required} \times 1.0 + \text{Matched Preferred} \times 0.5}{\text{Total Required} \times 1.0 + \text{Total Preferred} \times 0.5} \times 10.0$$ |
| **Experience Alignment ($S_{\text{exp}}$)** | **20%** | Ratio of candidate years of experience to job requirement with non-linear scaling ($2.0\text{--}10.0$). |
| **Semantic Fit ($S_{\text{semantic}}$)** | **20%** | Contextual alignment via LLM evaluation or Scikit-Learn TF-IDF cosine similarity. |
| **Project Relevance ($S_{\text{projects}}$)** | **15%** | Overlap between candidate project portfolio and target tech stack. |
| **Education Fit ($S_{\text{edu}}$)** | **5%** | Alignment with target degree (B.S., M.S., Ph.D.) or practical equivalence. |
| **Certifications Fit ($S_{\text{cert}}$)** | **5%** | Verification of relevant professional certifications. |

> **Dynamic Normalization:** Recruiters can adjust weights directly via the dashboard (`PUT /api/projects/{id}/weights`). The backend automatically normalizes submitted weights ($w_i' = \frac{w_i}{\sum w_k}$) and triggers live candidate score recalculation across the project.

---

## ⚡ 4. Key Features

- **Document Parsing & Quality Guardrails:** Ingests `.pdf` and `.txt` files with strict 10MB limits, directory traversal sanitization, and SHA-256 hash deduplication. Automatically computes a Resume Quality Index (evaluating contact completeness, formatting structure, and text density).
- **Explainable Match Inspector:** Detailed candidate profile view displaying radial score wheels, categorized skill matches (`REQUIRED` vs `PREFERRED`), verbatim extracted text quotes, and explicit missing skill gaps.
- **"WHY NOT 10/10?" Diagnostics:** Human-readable explanations outlining exact reasons for score deductions (e.g., missing specific preferred technologies, experience duration below senior threshold).
- **Candidate Comparison:** Select up to 3 candidates simultaneously for side-by-side trade-off analysis comparing scores, experience, matched skills, and recommendations.
- **Recruiter Workflow & Notes:** Update candidate lifecycle statuses (`SHORTLISTED`, `CONSIDER`, `REJECTED`, `UNDER_REVIEW`) and persist timestamped recruiter interview notes.
- **Skill Coverage Analytics:** Visual bar charts aggregating required and preferred skill penetration across the candidate pool to identify common cohort gaps.
- **Sanitized CSV Export:** Exports candidate screening reports with RFC-4180 compliance and **CSV Formula Injection protection** (prepends `'` to cells starting with `=`, `+`, `-`, `@`, `\t`, `\r`).
- **Idempotent Demo Mode:** One-click demo seeder that creates a standardized "Senior Backend Software Engineer" benchmark project with 5 dynamically scored candidates.

---

## 🛠️ 5. Technology Stack

### Frontend
- **Framework:** React 19 with Vite 8
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 4 with `@tailwindcss/vite`
- **Visualization:** Recharts (Radial bars, bar charts, distribution trends)
- **Icons:** Lucide React

### Backend
- **Runtime:** Python 3.11
- **API Framework:** FastAPI (Asynchronous ASGI endpoints)
- **Validation & Serialization:** Pydantic v2
- **ORM & Database Layer:** SQLAlchemy 2.0 with connection pooling
- **Database Engine:** SQLite (Local) / PostgreSQL via `psycopg2-binary` (Production)
- **Document Extraction:** PyPDF + UTF-8 Text Handlers
- **NLP / ML Fallback:** Scikit-Learn (TF-IDF Vectorizer & Cosine Similarity) + NumPy
- **Testing:** Pytest & Pytest-Asyncio (29 automated unit and integration tests)

---

## 🔄 6. Application Workflow

```text
1. Create Project ──────> Define hiring role and department
         │
         ▼
2. Analyze Job ─────────> Paste Job Description (extracts Required vs Preferred skills)
         │
         ▼
3. Ingest Resumes ──────> Batch upload PDF/TXT (deduplicated via SHA-256)
         │
         ▼
4. Screen & Score ──────> Hybrid LLM / TF-IDF extraction + deterministic math scoring
         │
         ▼
5. Inspect & Compare ───> Review evidence quotes, "Why Not 10/10?", and side-by-side comparison
         │
         ▼
6. Recruiter Actions ───> Shortlist/Reject candidates, write interview notes, export CSV
```

---

## 💻 7. Local Installation & Setup

### Prerequisites
- **Python:** 3.10 or 3.11 installed (`python --version`)
- **Node.js:** 18+ and npm installed (`node -v`, `npm -v`)
- **Git:** Installed and configured

### 1. Clone Repository
```bash
git clone https://github.com/shubh201203/smart-resume-screener.git
cd smart-resume-screener
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
# Windows (PowerShell):
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux / macOS (Bash):
# python3 -m venv venv
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Copy environment variables
cp .env.example .env
```

### 3. Frontend Setup
```bash
# Open a new terminal and navigate to frontend directory
cd smart-resume-screener/frontend

# Install node dependencies
npm install

# (Optional) Copy environment variables
cp .env.example .env
```

---

## ⚙️ 8. Environment Variables

### Backend Configuration (`backend/.env`)
```env
# Database connection:
# SQLite (Local default): sqlite:///./resume_screener.db
# Neon PostgreSQL (Production): postgresql://user:password@ep-service.neon.tech/neondb?sslmode=require
DATABASE_URL=sqlite:///./resume_screener.db

# Server Binding (Render automatically injects PORT)
HOST=0.0.0.0
PORT=8000

# CORS Allowed Origins (comma-separated list of allowed origins)
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000

# Optional: LLM Configuration (OpenAI or OpenRouter API key)
# Leave empty to run autonomously on built-in TF-IDF / rule-based fallback engine
LLM_API_KEY=
LLM_MODEL_NAME=gpt-4o-mini
LLM_BASE_URL=https://api.openai.com/v1
```

### Frontend Configuration (`frontend/.env`)
```env
# Leave empty for local development (Vite automatically proxies /api to http://localhost:8000)
# Set to your deployed Render URL for production builds
VITE_API_BASE_URL=
```

---

## 🚀 9. Running the Application

### Start Backend Service
```bash
cd smart-resume-screener/backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Documentation (Swagger UI): `http://127.0.0.1:8000/docs`
- Health Check: `http://127.0.0.1:8000/health`

### Start Frontend Application
```bash
cd smart-resume-screener/frontend
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 🧪 10. Automated Testing & Verification

SmartResume AI includes an automated **Pytest** test suite covering text extraction, SHA-256 deduplication, resume quality checks, deterministic math weighting, dynamic weight updates, CSV formula sanitization, health endpoints, and database driver normalization.

```bash
cd smart-resume-screener/backend
python -m pytest -v
```

### Verified Test Results (29/29 Passed)
```text
tests/test_screener.py::test_txt_extraction PASSED
tests/test_screener.py::test_empty_txt_rejection PASSED
tests/test_screener.py::test_empty_pdf_rejection PASSED
tests/test_screener.py::test_malformed_pdf_rejection PASSED
tests/test_screener.py::test_unsupported_file_extension_rejection PASSED
tests/test_screener.py::test_sha256_hash_consistency PASSED
tests/test_screener.py::test_sha256_different_files_different_hashes PASSED
tests/test_screener.py::test_resume_quality_complete_resume PASSED
tests/test_screener.py::test_resume_quality_missing_contact_info PASSED
tests/test_screener.py::test_resume_quality_very_short_text PASSED
tests/test_screener.py::test_deterministic_scoring_math_exact PASSED
tests/test_screener.py::test_weights_normalization PASSED
tests/test_screener.py::test_negative_and_zero_weights_fallback PASSED
tests/test_screener.py::test_why_not_10_missing_skills_flagged PASSED
tests/test_screener.py::test_rule_based_job_extraction PASSED
tests/test_screener.py::test_rule_based_candidate_extraction PASSED
tests/test_screener.py::test_evidence_quote_verification PASSED
tests/test_screener.py::test_llm_client_fallback_when_unconfigured PASSED
tests/test_screener.py::test_create_project_and_job_service PASSED
tests/test_screener.py::test_compare_candidates_service PASSED
tests/test_screener.py::test_csv_formula_injection_defense PASSED
tests/test_screener.py::test_csv_export_content_and_headers PASSED
tests/test_screener.py::test_demo_seeding_idempotence PASSED
tests/test_screener.py::test_update_project_weights_api PASSED
tests/test_screener.py::test_health_check_endpoint PASSED
tests/test_screener.py::test_database_url_postgres_normalization PASSED
tests/test_screener.py::test_cors_origins_configuration PASSED

======================== 29 passed in 6.27s ========================
```

---

## ☁️ 11. Production Deployment

The project is structured and deployed on a zero-cost, serverless architecture:
- **Live Frontend:** [https://smart-resume-screener-pi.vercel.app/](https://smart-resume-screener-pi.vercel.app/) deployed on [Vercel](https://vercel.com/) (Root: `frontend`, Build: `npm run build`, Rewrites via `frontend/vercel.json`)
- **Backend API:** [https://smart-resume-screener-qlag.onrender.com/health](https://smart-resume-screener-qlag.onrender.com/health) deployed on [Render](https://render.com/) (Root: `backend`, Build: `pip install -r requirements.txt`, Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, Configured via `render.yaml`)
- **Database:** Serverless PostgreSQL on [Neon](https://neon.tech/) with TLS and resilient connection pooling (`pool_pre_ping=True`, `pool_recycle=300`)

Detailed step-by-step instructions with environment variable references are documented in [DEPLOYMENT.md](file:///C:/Users/shubh/Downloads/smart-resume-screener/DEPLOYMENT.md).

---

## 📡 12. REST API Reference

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/` or `/health` | `GET` | Health check endpoint returning service status and versions |
| `/api/projects` | `GET` | List all screening projects with candidate counts |
| `/api/projects` | `POST` | Create a new screening project |
| `/api/projects/{id}` | `GET` | Retrieve project details, job data, and candidate ranking |
| `/api/projects/{id}/weights` | `PUT` | Persist custom scoring weights and trigger candidate score recalculation |
| `/api/jobs` | `POST` | Parse and persist a job description with required and preferred skills |
| `/api/resumes/upload` | `POST` | Multi-file resume upload (`multipart/form-data`) with deduplication |
| `/api/screening/{id}/run` | `POST` | Execute scoring pipeline across uploaded project candidates |
| `/api/candidates/{id}` | `GET` | Detailed candidate inspection (scores, evidence snippets, gaps) |
| `/api/candidates/{id}/status` | `POST` | Update candidate status (`SHORTLISTED`, `CONSIDER`, `REJECTED`, etc.) |
| `/api/candidates/{id}/notes` | `POST` | Append timestamped recruiter interview notes |
| `/api/candidates/compare` | `POST` | Compare 2–3 candidates side-by-side with trade-off analysis |
| `/api/analytics/{id}` | `GET` | Aggregate skill penetration and cohort missing skill analysis |
| `/api/export/{id}/csv` | `GET` | Download sanitized CSV screening report (formula injection protected) |
| `/api/demo/load` | `POST` | Idempotently seed calibrated demo project with 5 candidate profiles |

---

## 🔒 13. Security Considerations & System Limitations

### Security Hardening
- **CSV Formula Injection Mitigation:** Neutralizes formula execution vectors (`=`, `+`, `-`, `@`, `\t`, `\r`) in spreadsheets by prepending single quotes to export cells.
- **Upload Filename Sanitization:** Strips directory traversal sequences (`../`, `..\`) and control characters prior to database recording.
- **Safe CORS Configuration:** Whitelists specific frontend origins through environment variables, preventing wildcard access with credentials.
- **Memory-Safe File Handling:** Parses document streams in memory without writing temporary files to local disk.

### Responsible AI & Ethical Boundaries
- **Human-in-the-Loop:** Designed strictly as a **decision-support tool** for human recruiters; not intended for automated hiring or rejection without human review.
- **Protected Attribute Exclusion:** Evaluates only documented professional competencies, project evidence, and verified educational credentials. Scoring explicitly excludes age, gender, race, photos, marital status, and personal identifiers.
- **Single-User Architecture:** Multi-tenant authorization and Role-Based Access Control (RBAC) are omitted from the current version.

---

## 👨‍💻 14. Author & Contact

**Shubh Sharma**  
- **GitHub:** [@shubh201203](https://github.com/shubh201203)  
- **Portfolio:** [https://shubh201203.github.io/portfolio/](https://shubh201203.github.io/portfolio/)  
- **LinkedIn:** [https://www.linkedin.com/in/shubh-sharma-2067981b5](https://www.linkedin.com/in/shubh-sharma-2067981b5)  
- **Project Repository:** [https://github.com/shubh201203/smart-resume-screener](https://github.com/shubh201203/smart-resume-screener)
