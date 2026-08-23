# SmartResume AI — Smart Resume Screener & Recruitment Intelligence Platform

A production-quality **AI-powered Resume Screener & Recruitment Intelligence Platform** built with FastAPI, SQLite/PostgreSQL, React 19, Vite, TypeScript, and Tailwind CSS.

---

## 🎯 1. Problem & Solution

### The Problem
Traditional ATS platforms rely on simple string keyword matching (e.g., rejecting a candidate who wrote "RESTful APIs in Express" for a job requiring "Node.js backend experience"). Furthermore, opaque AI scoring creates "black-box" decisions without explainability, while recruiters spend hours manually reading through hundreds of resumes.

### The Solution: SmartResume AI
SmartResume AI solves this by introducing a **Hybrid AI Architecture**:
- **Semantic Understanding**: Uses LLMs to recognize technological equivalence and contextual experience.
- **Evidence-Based Matching**: Extracts exact quote snippets from resume text for every match, partial overlap, or gap.
- **Deterministic Math Scoring**: Replaces opaque AI outputs with an explicit, configurable weighted formula ($1.0\text{--}10.0$).
- **Explainable Recommendations**: Answers **"WHY NOT 10/10?"** for every candidate with transparent score deduction bullet points.

---

## 🏗️ 2. Architecture & Pipeline

```
                       ┌─────────────────────────┐
                       |   Resume (PDF / TXT)    |
                       └────────────┬────────────┘
                                    │
                       ┌────────────┴────────────┐
                       │  SHA-256 Hash Check &   │
                       │  Resume Quality Index   │
                       └────────────┬────────────┘
                                    │
                       ┌────────────┴────────────┐
                       │   Text Extraction &     │
                       │ Contact Info Sanitizer  │
                       └────────────┬────────────┘
                                    │
                       ┌────────────┴────────────┐
                       │  Structured Extraction  │
                       │ (Candidate & Job JSON)  │
                       └────────────┬────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌────────────────────┐                             ┌────────────────────┐
│ LLM Semantic Engine│                             │ Rule-Based Engine  │
│ (Evidence & Fit)   │                             │ (TF-IDF Fallback)  │
└──────────┬─────────┘                             └─────────┬──────────┘
           │                                                 │
           └────────────────────────┬────────────────────────┘
                                    │
                       ┌────────────┴────────────┐
                       │  Deterministic Weighted │
                       │  Scoring Engine (1-10)  │
                       └────────────┬────────────┘
                                    │
                       ┌────────────┴────────────┐
                       │ Recommendation (Match / │
                       │  Consider / Low Match)  │
                       └────────────┬────────────┘
                                    │
                       ┌────────────┴────────────┐
                       │   Recruiter SaaS Dashboard│
                       │(Comparison, Analytics,  │
                       │      CSV Export)        │
                       └─────────────────────────┘
```

---

## 🧮 3. Deterministic Scoring Formula

The final candidate match score ($1.0\text{--}10.0$) is calculated mathematically using configurable component weights:

$$\text{Final Score} = 0.35 \times S_{\text{skills}} + 0.20 \times S_{\text{exp}} + 0.20 \times S_{\text{semantic}} + 0.15 \times S_{\text{projects}} + 0.05 \times S_{\text{edu}} + 0.05 \times S_{\text{cert}}$$

### Component Breakdowns:
1. **Skills Match Coverage ($S_{\text{skills}}$ — 35%)**:
   $$\text{Skills Score} = \frac{\text{Matched Required} \times 1.0 + \text{Matched Preferred} \times 0.5}{\text{Total Required} \times 1.0 + \text{Total Preferred} \times 0.5} \times 10.0$$
2. **Experience Alignment ($S_{\text{exp}}$ — 20%)**:
   - $\text{Candidate Exp} \ge \text{Required Exp}$: $9.0 + 0.5 \times (\text{Ratio} - 1.0)$ up to $10.0$.
   - $\text{Candidate Exp} < \text{Required Exp}$: $\max(2.0, \frac{\text{Candidate Exp}}{\text{Required Exp}} \times 9.0)$.
3. **Semantic Job Fit ($S_{\text{semantic}}$ — 20%)**: Contextual technology alignment evaluated via LLM assessment or TF-IDF cosine similarity score in Fallback mode.
4. **Project Relevance ($S_{\text{projects}}$ — 15%)**: Overlap between candidate project descriptions and target technology stack.
5. **Education Fit ($S_{\text{edu}}$ — 5%)**: Alignment with target degree requirements.
6. **Certifications Fit ($S_{\text{cert}}$ — 5%)**: Alignment with target certification requirements.

---

## 🚦 4. Recommendation Thresholds

- **Strong Match**: Overall Score $\ge 8.0$
- **Consider**: $6.0 \le \text{Overall Score} < 8.0$
- **Low Match**: Overall Score $< 6.0$

---

## 🛠️ 5. Tech Stack

- **Frontend**: React 19, Vite 8, TypeScript, Tailwind CSS, Lucide Icons, Recharts.
- **Backend**: Python 3.11, FastAPI, Pydantic v2, SQLAlchemy ORM, PyPDF, Scikit-Learn (TF-IDF), Pytest.
- **Database**: SQLite (Zero-config development) / PostgreSQL compatible (`DATABASE_URL`).
- **AI Integration**: OpenAI / OpenRouter HTTP Chat Completions abstraction layer.

---

## 🚀 6. Installation & Quick Start

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Start Backend Server
```bash
cd smart-resume-screener/backend
python -m uvicorn app.main:app --reload --port 8000
```
Backend will start on `http://127.0.0.1:8000`.

### 3. Start Frontend Dev Server
```bash
cd smart-resume-screener/frontend
npm run dev
```
Frontend will open on `http://localhost:5173`.

### 4. Run Pytest Suite (20 Automated Tests)
```bash
cd smart-resume-screener/backend
python -m pytest
```

---

## 🎬 7. 2-Minute Evaluator Demo Flow

1. Open `http://localhost:5173` to view the **SmartResume AI Landing Page**.
2. Click **"TRY DEMO"** or **"START SCREENING"**.
3. Clicking **"TRY DEMO"** automatically calls `/api/demo/load`, seeding a **"Software Engineer — Backend (Cloud Services)"** project with 5 dynamic candidates.
4. View the **AI-Extracted Job Analysis** displaying `REQUIRED` vs `PREFERRED` tagged skills.
5. Inspect the candidate ranking table sorted by overall match score ($1.0\text{--}10.0$).
6. Select 2-3 candidates using the checkboxes and click **"Compare (3/3)"** for side-by-side comparative metrics.
7. Click **"Inspect"** on a candidate to view radial score breakdown, extracted evidence snippets, and the **"WHY NOT 10/10?"** panel.
8. Click **"Skill Analytics"** in the top navigation to view skill coverage heatmaps.
9. Click **"Export CSV"** to download the candidate report.

---

## 🛡️ 8. Ethics, Fairness & Disclaimers

> **AI Decision-Support Disclaimer**: AI recommendations generated by SmartResume AI are decision-support signals intended to assist recruiters and should not replace human hiring judgment. Protected personal characteristics (gender, race, age, religion, photos, marital status) are excluded from scoring models.
