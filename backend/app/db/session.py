import logging
from pathlib import Path
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from backend.app.core.config import settings, DEFAULT_DB_PATH

logger = logging.getLogger(__name__)

def build_engine():
    # If explicitly SQLite, use SQLite directly
    if settings.DATABASE_URL.startswith("sqlite"):
        db_file_str = settings.DATABASE_URL.replace("sqlite:///", "")
        db_path = Path(db_file_str)
        db_path.parent.mkdir(parents=True, exist_ok=True)
        return create_engine(
            settings.DATABASE_URL,
            connect_args={"check_same_thread": False}
        )

    # If PostgreSQL specified in .env, attempt to connect
    try:
        pg_engine = create_engine(
            settings.DATABASE_URL,
            pool_pre_ping=True
        )
        # Test connection immediately
        with pg_engine.connect() as conn:
            pass
        logger.info("[✓] Successfully connected to PostgreSQL / PostGIS database.")
        return pg_engine
    except Exception as e:
        logger.warning(
            f"[!] PostgreSQL at DATABASE_URL is not currently active ({e}). "
            f"Seamlessly using standalone SQLite spatial database at {DEFAULT_DB_PATH}."
        )
        DEFAULT_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        return create_engine(
            f"sqlite:///{DEFAULT_DB_PATH.as_posix()}",
            connect_args={"check_same_thread": False}
        )

engine = build_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    """Dependency to retrieve database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
