import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Dict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Resume Screener"
    VERSION: str = "1.0.0"
    SCORING_VERSION: str = "1.0"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./resume_screener.db")
    
    # LLM Settings (Abstraction layer)
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_MODEL_NAME: str = os.getenv("LLM_MODEL_NAME", "gpt-4o-mini")
    LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")
    
    # Scoring Default Weights (Sum to 1.0)
    DEFAULT_WEIGHTS: Dict[str, float] = {
        "skills": 0.35,
        "experience": 0.20,
        "semantic_fit": 0.20,
        "projects": 0.15,
        "education": 0.05,
        "certifications": 0.05
    }
    
    # Recommendation Thresholds
    STRONG_MATCH_THRESHOLD: float = 8.0
    CONSIDER_THRESHOLD: float = 6.0
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
