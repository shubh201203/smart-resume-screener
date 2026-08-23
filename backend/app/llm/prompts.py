RESUME_EXTRACTION_PROMPT = """
You are an expert AI Resume Extraction Engine.
Your task is to parse the candidate resume text provided below and extract structured JSON matching the EXACT schema.

CRITICAL FAIRNESS & SAFETY DIRECTIVES:
1. Do NOT extract or include protected personal characteristics such as gender, race, age, religion, nationality, marital status, photo descriptions, or political affiliations.
2. Do NOT invent or hallucinate missing information. If a field or detail is not present in the resume, return empty lists [] or empty strings "".
3. Accurately calculate or estimate total_years_experience based on listed work experience date ranges.

JSON OUTPUT SCHEMA REQUIREMENTS:
Respond ONLY with a valid JSON object matching this structure:
{
  "candidate": {
    "name": "Candidate Full Name or Unknown Candidate",
    "email": "email@example.com or null",
    "phone": "phone or null",
    "location": "City, Country or null"
  },
  "summary": "Brief 2-3 sentence executive summary of background",
  "skills": ["Skill1", "Skill2"],
  "technical_skills": ["Tech1", "Tech2"],
  "soft_skills": ["SoftSkill1"],
  "education": [
    {
      "degree": "B.S. Computer Science",
      "field": "Computer Science",
      "institution": "University Name",
      "graduation_year": "2022"
    }
  ],
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "start_date": "2020",
      "end_date": "Present",
      "duration_months": 36,
      "responsibilities": ["Responsibility 1", "Key achievement"],
      "technologies": ["Tech Used"]
    }
  ],
  "projects": [
    {
      "title": "Project Title",
      "description": "Project description",
      "technologies": ["Tech Used"]
    }
  ],
  "certifications": [
    {
      "name": "AWS Certified Solutions Architect",
      "issuer": "Amazon Web Services",
      "year": "2023"
    }
  ],
  "languages": ["English"],
  "achievements": ["Achievement 1"],
  "total_years_experience": 3.5
}

RESUME TEXT:
\"\"\"
{resume_text}
\"\"\"
"""

JOB_EXTRACTION_PROMPT = """
You are an expert AI Recruitment Job Description Parser.
Your task is to extract structured requirements from the Job Description below.

CRITICAL INSTRUCTIONS:
1. Clearly distinguish REQUIRED skills (must-haves) vs PREFERRED skills (nice-to-haves).
2. Extract required minimum years of experience (float).
3. Do NOT hallucinate. Extract only explicit or strongly implied requirements.

JSON OUTPUT SCHEMA REQUIREMENTS:
Respond ONLY with a valid JSON object matching this structure:
{
  "job_title": "Role Title",
  "seniority": "Junior / Mid-Level / Senior / Lead",
  "required_skills": ["Must Have Skill 1", "Must Have Skill 2"],
  "preferred_skills": ["Nice Have Skill 1"],
  "required_experience_years": 3.0,
  "education_requirements": ["B.S. in Computer Science or related field"],
  "certifications": ["AWS Certification"],
  "responsibilities": ["Responsibility 1"],
  "technologies": ["Python", "FastAPI", "PostgreSQL", "Docker"],
  "soft_skills": ["Communication", "Teamwork"]
}

JOB DESCRIPTION TEXT:
\"\"\"
{job_text}
\"\"\"
"""

SEMANTIC_MATCHING_PROMPT = """
You are an AI Recruitment Matching & Evidence Extraction Engine.
You must analyze the structured Candidate Profile against the target Job Requirements and perform semantic evidence evaluation.

SEMANTIC REASONING DIRECTIVES:
1. Recognize semantic equivalence and related technologies. For example:
   - "Built RESTful APIs in Express and MongoDB" IS a meaningful match for "Experience developing backend services with Node.js".
   - "Predictive modeling with scikit-learn" IS a meaningful match for "Experience in Machine Learning with Python".
2. Extract concrete EVIDENCE snippets from the candidate profile for every match, partial match, or gap.
3. Assess semantic job fit score (0.0 to 10.0) based on contextual technology alignment.

JSON OUTPUT SCHEMA REQUIREMENTS:
Respond ONLY with a valid JSON object:
{
  "semantic_fit_score": 8.5,
  "confidence": "High",
  "matched_skills": [
    {
      "skill": "Node.js",
      "status": "matched",
      "confidence": 0.95,
      "evidence": "Built RESTful APIs using Express and MongoDB at Company X",
      "type": "required"
    }
  ],
  "partial_matches": [
    {
      "skill": "AWS",
      "candidate_skill": "Google Cloud Platform",
      "evidence": "Deployed cloud microservices on GCP Kubernetes Engine",
      "type": "preferred"
    }
  ],
  "missing_skills": [
    {
      "skill": "Kubernetes",
      "type": "required"
    }
  ],
  "strengths": [
    "Strong backend API development background in Node.js and Express",
    "Exceeds minimum experience requirement (4 years vs 3 required)"
  ],
  "concerns": [
    "AWS cloud experience not explicitly demonstrated (uses GCP instead)"
  ],
  "ai_justification": "Candidate displays strong semantic alignment for backend development with 4 years experience building REST APIs. Demonstrates solid GCP cloud knowledge, though role specifies AWS."
}

JOB REQUIREMENTS:
{job_json}

CANDIDATE PROFILE:
{candidate_json}
"""

CANDIDATE_COMPARISON_PROMPT = """
You are an AI Recruitment Advisory Assistant.
Compare the following candidate profiles against the job description and summarize key trade-offs in 3-4 recruiter-friendly sentences.

JOB TITLE: {job_title}
CANDIDATE PROFILES & SCORES:
{candidates_summary}

Provide a concise, neutral comparison summary explaining why candidate A is recommended over B/C, highlighting technical alignment vs experience depth.
Respond ONLY with a JSON object:
{
  "comparison_summary": "Concise comparison narrative..."
}
"""
