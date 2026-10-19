# Production Deployment Guide: SmartResume AI

This guide details the step-by-step production deployment for **SmartResume AI** across:
- **Database:** [Neon PostgreSQL](https://neon.tech/) (Serverless Postgres)
- **Backend:** [Render](https://render.com/) (FastAPI Web Service)
- **Frontend:** [Vercel](https://vercel.com/) (React 19 + Vite SPA)

---

## Architecture Overview

```mermaid
flowchart LR
    A["User Browser"] --> B["Vercel Frontend\n(React 19 + Vite SPA)"]
    B -- "HTTPS API Requests\n(VITE_API_BASE_URL)" --> C["Render Backend\n(FastAPI on 0.0.0.0:$PORT)"]
    C -- "PostgreSQL connection\n(sslmode=require)" --> D["Neon Serverless PostgreSQL\n(Tables auto-created on startup)"]
```

---

## Step 1: Set Up Neon PostgreSQL

1. **Sign Up / Log In**: Navigate to [neon.tech](https://neon.tech/) and create a free account.
2. **Create a Project**:
   - Project Name: `smart-resume-screener` (or preferred name)
   - Postgres Version: 16 (default)
   - Region: Choose a region close to your Render deployment region (e.g., `US East (Ohio / N. Virginia)`).
3. **Get Connection String**:
   - From your Neon Dashboard, find the **Connection Details** widget.
   - Choose **PostgreSQL** or **SQLAlchemy** from the dropdown.
   - Ensure **Pooled connection** or direct connection string with `sslmode=require` is selected.
   - Format:
     ```text
     postgresql://username:password@ep-xxxx-xxxx-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
   - *Note*: If Neon supplies a URL starting with `postgres://`, the backend automatically normalizes it to `postgresql://`.

---

## Step 2: Deploy Backend to Render

### Option A: Render Dashboard (Recommended)

1. **Sign Up / Log In**: Go to [render.com](https://render.com/).
2. **New Web Service**: Click **New +** > **Web Service**.
3. **Connect Repository**:
   - Link your GitHub repository: `https://github.com/shubh201203/smart-resume-screener`
4. **Configure Service Settings**:
   | Setting | Value |
   | :--- | :--- |
   | **Name** | `smart-resume-screener-api` |
   | **Region** | Choose region close to your Neon database (e.g., `Ohio (US East)`) |
   | **Branch** | `main` |
   | **Root Directory** | `backend` |
   | **Runtime** | `Python 3` |
   | **Build Command** | `pip install -r requirements.txt` |
   | **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
   | **Plan Type** | Free (or Starter) |

5. **Advanced Settings**:
   - **Health Check Path**: `/health` (or `/api/health`)

6. **Environment Variables**:
   Under **Environment Variables**, add:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `PYTHON_VERSION` | `3.11.9` | Matches Python version |
   | `DATABASE_URL` | `postgresql://...` | Connection string copied from Neon |
   | `CORS_ORIGINS` | `https://your-frontend.vercel.app,http://localhost:5173` | Allowed frontend domains (update with your actual Vercel URL after Step 3) |
   | `LLM_API_KEY` | *(Optional)* | Your OpenAI / OpenRouter API Key |
   | `LLM_MODEL_NAME` | `gpt-4o-mini` | Default LLM model |
   | `LLM_BASE_URL` | `https://api.openai.com/v1` | OpenAI / OpenRouter endpoint |

7. **Deploy**:
   - Click **Create Web Service**.
   - Watch the build and deployment logs.
   - When deployed, copy your Render web service URL (e.g., `https://smart-resume-screener-api.onrender.com`).

### Option B: Deploy with Render Blueprint (`render.yaml`)
A ready-to-use `render.yaml` specification is included in the root directory. In Render, select **Blueprints** > **New Blueprint Instance** and connect the repository.

---

## Step 3: Deploy Frontend to Vercel

1. **Sign Up / Log In**: Go to [vercel.com](https://vercel.com/).
2. **Add New Project**: Click **Add New...** > **Project**.
3. **Import Git Repository**:
   - Select `shubh201203/smart-resume-screener`.
4. **Configure Project Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select `frontend`.
   - **Build and Output Settings**:
     - Build Command: `npm run build`
     - Output Directory: `dist`
     - Install Command: `npm install`
5. **Environment Variables**:
   Under **Environment Variables**, add:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://smart-resume-screener-api.onrender.com` | URL of your deployed Render backend |

6. **Deploy**:
   - Click **Deploy**.
   - Vercel will install dependencies, execute `tsc -b && vite build`, and publish the production bundle.
   - Once deployed, copy your Vercel deployment URL (e.g., `https://smart-resume-screener.vercel.app`).

---

## Step 4: Finalize CORS on Render

Once your Vercel frontend is live:
1. Return to the [Render Dashboard](https://dashboard.render.com).
2. Go to your backend service > **Environment**.
3. Update `CORS_ORIGINS` to include your production Vercel URL:
   ```text
   https://smart-resume-screener.vercel.app,http://localhost:5173
   ```
4. Click **Save Changes** (Render will automatically re-deploy with updated CORS).

---

## Step 5: Verification & End-to-End Checklist

### 1. Verify Backend Health Check
```bash
curl https://smart-resume-screener-api.onrender.com/health
```
Expected response:
```json
{
  "status": "healthy",
  "service": "Smart Resume Screener",
  "version": "1.0.0",
  "scoring_version": "1.0",
  "llm_configured": false
}
```

### 2. Verify Database Schema Creation
When the FastAPI backend starts up, `Base.metadata.create_all(bind=engine)` automatically creates all relational tables (`projects`, `jobs`, `resumes`, `candidates`, `match_scores`, `recruiter_notes`) in your Neon PostgreSQL database.

### 3. Verify Frontend Application
1. Open your Vercel URL in your browser.
2. Click **"TRY DEMO"** or **"Load Demo Data"**.
   - Verifies backend connectivity, database seeding, dynamic scoring, and ranking.
3. Test candidate inspection:
   - Click **"Inspect"** on Alex Rivera.
   - Check score wheel, evidence snippets, and "WHY NOT 10/10?".
4. Test scoring weights:
   - Click **"Scoring Weights"** > Adjust sliders > **"Save & Re-Score"**.
   - Verify candidates re-score and re-rank live.
5. Test candidate comparison:
   - Select 2–3 candidates and click **"Compare (3/3)"**.
6. Test CSV Export:
   - Click **"Export CSV"** to download the sanitized candidate report.
7. Test custom resume upload:
   - Create a new project, enter a job description, and upload a `.pdf` or `.txt` resume.

---

## Local Development vs. Production Summary

| Parameter | Local Development | Production |
| :--- | :--- | :--- |
| **Backend Host & Port** | `127.0.0.1:8000` | Render assigns `$PORT`, binds `0.0.0.0` |
| **Database** | SQLite (`sqlite:///./resume_screener.db`) | Neon PostgreSQL (`postgresql://...`) |
| **Frontend API Target** | Vite Proxy (`/api` -> `http://localhost:8000`) | Direct via `VITE_API_BASE_URL` |
| **CORS Origins** | `http://localhost:5173` | Production Vercel domain |
| **File Storage** | In-Memory parse + Database text & metadata | In-Memory parse + Database text & metadata |
