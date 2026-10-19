import uuid
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.domain import Project, Job, Resume, Candidate, MatchScore, PipelineState, CandidateStatus
from app.parsers import calculate_sha256, evaluate_resume_quality
from app.matching import process_candidate_matching, rule_based_job_extraction, rule_based_candidate_extraction

DEMO_JOB_DESCRIPTION = """
Senior Backend Software Engineer — Cloud Services

About the Role:
We are seeking an experienced Backend Software Engineer to design, scale, and maintain high-performance cloud backend services and API architectures.

Key Responsibilities:
- Design, build, and deploy resilient RESTful APIs using Python (FastAPI/Django) or Node.js.
- Architect scalable database schemas with PostgreSQL and Redis caching layers.
- Package and orchestrate microservices using Docker and Kubernetes.
- Deploy and monitor cloud infrastructure on AWS (EC2, S3, ECS, Lambda).
- Collaborate with frontend engineers, product managers, and DevOps teams.

Requirements & Qualifications:
- Required Skills: Python, FastAPI, Node.js, PostgreSQL, REST APIs, Docker.
- Preferred Skills: AWS, Kubernetes, Redis, CI/CD pipelines.
- Minimum 3+ years of professional backend software development experience.
- Bachelor's degree in Computer Science, Software Engineering, or equivalent practical experience.
- Strong problem-solving abilities, clean code standards, and automated unit testing habits.
"""

DEMO_RESUMES = [
    {
        "filename": "Alex_Rivera_Backend_Resume.txt",
        "name": "Alex Rivera",
        "email": "alex.rivera@example.com",
        "phone": "+1 (555) 234-5678",
        "location": "San Francisco, CA",
        "text": """
ALEX RIVERA
Email: alex.rivera@example.com | Phone: +1 (555) 234-5678 | San Francisco, CA

SUMMARY
Senior Backend Software Engineer with 5 years of experience building high-throughput cloud APIs, microservices, and PostgreSQL database systems.

SKILLS
Technical Skills: Python, FastAPI, Node.js, Express, PostgreSQL, Redis, Docker, Kubernetes, AWS, REST APIs, Git, CI/CD.
Soft Skills: Technical Leadership, Problem Solving, Code Review.

WORK EXPERIENCE
Senior Backend Engineer | CloudScale Inc. | 2022 - Present (2.5 years)
- Designed and maintained core backend APIs using Python, FastAPI, Node.js, and PostgreSQL handling 50M daily requests.
- Containerized microservices using Docker and orchestrated deployments on AWS ECS, Redis, and Kubernetes.
- Integrated Redis caching layer reducing API response latency by 45%.

Software Engineer | TechFlow Systems | 2019 - 2022 (3.0 years)
- Developed RESTful APIs in Python and Node.js with PostgreSQL databases and Docker microservices.
- Managed AWS S3 file storage pipelines and implemented automated CI/CD unit testing.

EDUCATION
B.S. in Computer Science | University of California, Berkeley (2019)

PROJECTS
Cloud API Gateway Service
- Designed scalable REST APIs using FastAPI, Docker, and AWS EC2 with PostgreSQL and Redis caching.

CERTIFICATIONS
AWS Certified Solutions Architect (2023)
        """
    },
    {
        "filename": "Priya_Sharma_Resume.txt",
        "name": "Priya Sharma",
        "email": "priya.sharma@example.com",
        "phone": "+1 (555) 876-5432",
        "location": "Austin, TX",
        "text": """
PRIYA SHARMA
Email: priya.sharma@example.com | Phone: +1 (555) 876-5432 | Austin, TX

SUMMARY
Backend Software Engineer with 4 years of experience specializing in Python API development, FastAPI, PostgreSQL optimization, and Docker microservices.

SKILLS
Technical Skills: Python, FastAPI, Django, Node.js, PostgreSQL, MySQL, REST APIs, Docker, Git, Unit Testing, Redis.
Soft Skills: Team Collaboration, Agile Development.

WORK EXPERIENCE
Backend Developer | DataPulse Corp | 2020 - Present (4.0 years)
- Built enterprise RESTful microservices using Python, FastAPI, and PostgreSQL.
- Authored complex SQL query optimizations and migrations with Redis caching.
- Packaged applications into Docker containers for internal deployment pipelines.

PROJECTS
Data Ingestion Pipeline
- Developed high-throughput REST APIs with Python, FastAPI, Node.js, and PostgreSQL.

EDUCATION
B.S. in Computer Engineering | University of Texas at Austin (2020)
        """
    },
    {
        "filename": "Marcus_Chen_Resume.txt",
        "name": "Marcus Chen",
        "email": "marcus.chen@example.com",
        "phone": "+1 (555) 345-6789",
        "location": "Seattle, WA",
        "text": """
MARCUS CHEN
Email: marcus.chen@example.com | Phone: +1 (555) 345-6789 | Seattle, WA

SUMMARY
Software Engineer with 3 years of experience in Java and Node.js backend development, REST APIs, and relational databases.

SKILLS
Technical Skills: Java, Spring Boot, Node.js, PostgreSQL, REST APIs, Git, JavaScript, Python.
Soft Skills: Adaptability, Team Communication.

WORK EXPERIENCE
Software Engineer | Apex Solutions | 2021 - Present (3.0 years)
- Developed REST APIs using Java Spring Boot, Node.js, and PostgreSQL databases.
- Collaborated with frontend engineering teams on web features using Python and REST APIs.

PROJECTS
E-Commerce Checkout API
- Developed REST APIs with Java and PostgreSQL database models.

EDUCATION
B.S. in Information Technology | Washington State University (2021)
        """
    },
    {
        "filename": "Elena_Rostova_Resume.txt",
        "name": "Elena Rostova",
        "email": "elena.rostova@example.com",
        "phone": "+1 (555) 456-7890",
        "location": "Boston, MA",
        "text": """
ELENA ROSTOVA
Email: elena.rostova@example.com | Phone: +1 (555) 456-7890 | Boston, MA

SUMMARY
Systems & Software Engineer with 3 years experience developing C++ and Python automation services, REST APIs, and PostgreSQL database integrations.

SKILLS
Technical Skills: Python, C++, PostgreSQL, REST APIs, Linux, Git.
Soft Skills: Engineering Architecture, Problem Solving.

WORK EXPERIENCE
Systems Software Engineer | SensorTech Labs | 2021 - Present (3.0 years)
- Developed backend data processing scripts in Python and C++.
- Maintained SQL queries and database schemas in PostgreSQL and REST APIs.

EDUCATION
B.S. in Computer Engineering | Northeastern University (2021)
        """
    },
    {
        "filename": "David_Miller_Resume.txt",
        "name": "David Miller",
        "email": "david.miller@example.com",
        "phone": "+1 (555) 901-2345",
        "location": "Chicago, IL",
        "text": """
DAVID MILLER
Email: david.miller@example.com | Phone: +1 (555) 901-2345 | Chicago, IL

SUMMARY
Junior Web UI Designer & Frontend Developer with 1.0 year of visual design experience.

SKILLS
Technical Skills: HTML5, CSS3, Figma, Tailwind CSS, Adobe Photoshop.
Soft Skills: Creativity, Design Thinking.

WORK EXPERIENCE
Junior Web UI Designer | Creative Web Studio | 2023 - Present (1.0 year)
- Built responsive website UI landing pages using HTML and CSS.
- Designed wireframes and mockups in Figma.

EDUCATION
B.A. in Graphic Design & Web Media | Columbia College (2023)
        """
    }
]

DEMO_PROJECT_TITLE = "Software Engineer — Backend (Cloud Services)"

async def seed_demo_data(db: Session) -> Dict[str, Any]:
    """Generates complete presentation demo project with 5 dynamic candidates idempotently."""
    # 1. Clean up any existing demo project to avoid accumulating duplicate demo entries
    existing_demos = db.query(Project).filter(Project.title == DEMO_PROJECT_TITLE).all()
    for p in existing_demos:
        db.delete(p)
    db.commit()

    # 2. Create Demo Project
    project = Project(
        title=DEMO_PROJECT_TITLE,
        department="Engineering"
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    # 2. Extract & Save Job Description
    parsed_job = rule_based_job_extraction(DEMO_JOB_DESCRIPTION)
    job = Job(
        project_id=project.id,
        title="Software Engineer — Backend (Cloud Services)",
        raw_description=DEMO_JOB_DESCRIPTION,
        parsed_data=parsed_job
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    created_candidates = []

    # 3. Create Resumes & Run Screening Engine
    for demo_res in DEMO_RESUMES:
        raw_text = demo_res["text"].strip()
        file_bytes = raw_text.encode("utf-8")
        file_hash = calculate_sha256(file_bytes)
        q_score, q_label, q_factors = evaluate_resume_quality(raw_text)

        resume = Resume(
            project_id=project.id,
            filename=demo_res["filename"],
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

        parsed_cand = rule_based_candidate_extraction(raw_text)
        parsed_cand["candidate"]["name"] = demo_res["name"]
        parsed_cand["candidate"]["email"] = demo_res["email"]
        parsed_cand["candidate"]["phone"] = demo_res["phone"]
        parsed_cand["candidate"]["location"] = demo_res["location"]

        candidate = Candidate(
            project_id=project.id,
            resume_id=resume.id,
            name=demo_res["name"],
            email=demo_res["email"],
            phone=demo_res["phone"],
            location=demo_res["location"],
            summary=parsed_cand.get("summary"),
            total_years_experience=parsed_cand.get("total_years_experience", 0.0),
            extracted_data=parsed_cand,
            pipeline_state=PipelineState.MATCHING.value
        )
        db.add(candidate)
        db.commit()
        db.refresh(candidate)

        # Run Candidate Matching Math Engine dynamically
        match_result = await process_candidate_matching(
            candidate_data=parsed_cand,
            job_data=parsed_job,
            raw_resume_text=raw_text,
            weights=project.scoring_weights
        )

        db_score = MatchScore(
            candidate_id=candidate.id,
            project_id=project.id,
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

        candidate.pipeline_state = PipelineState.COMPLETED.value
        if match_result.overall_score >= 8.0:
            candidate.action_status = CandidateStatus.SHORTLISTED.value
        elif match_result.overall_score < 6.0:
            candidate.action_status = CandidateStatus.REJECTED.value

        db.commit()
        created_candidates.append(candidate.id)

    return {
        "project_id": project.id,
        "job_id": job.id,
        "candidates_created": len(created_candidates),
        "message": "Demo data successfully seeded with 5 dynamic candidate profiles!"
    }
