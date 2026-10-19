from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

def normalize_database_url(url: str) -> str:
    """
    Normalizes database connection URLs.
    Ensures PostgreSQL URLs explicitly use the installed psycopg2 driver (postgresql+psycopg2://),
    handling 'postgres://', 'postgresql://', and 'postgresql+psycopg://' (Psycopg 3) variants.
    Preserves SQLite and other explicit driver URLs.
    """
    if not url:
        return "sqlite:///./resume_screener.db"
    trimmed = url.strip()
    if trimmed.startswith("postgres://"):
        return trimmed.replace("postgres://", "postgresql+psycopg2://", 1)
    if trimmed.startswith("postgresql+psycopg://"):
        return trimmed.replace("postgresql+psycopg://", "postgresql+psycopg2://", 1)
    if trimmed.startswith("postgresql://"):
        return trimmed.replace("postgresql://", "postgresql+psycopg2://", 1)
    return trimmed

# Database connection configuration & URL normalization for PostgreSQL/Neon
db_url = normalize_database_url(settings.DATABASE_URL)

engine_kwargs: dict = {"echo": False}
if db_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Production PostgreSQL (Neon / Render) resilient connection pool settings
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300

engine = create_engine(
    db_url,
    **engine_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
