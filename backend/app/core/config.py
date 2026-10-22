from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
PROJECT_ROOT = BACKEND_DIR.parent
DEFAULT_DB_PATH = BACKEND_DIR / "app" / "db" / "data" / "water_services.db"

def get_public_data_dir() -> Path:
    candidates = [
        PROJECT_ROOT / "frontend" / "public" / "data",
        PROJECT_ROOT / "public" / "data",
        BACKEND_DIR / "public" / "data",
    ]
    for p in candidates:
        if p.exists():
            return p
    return PROJECT_ROOT / "frontend" / "public" / "data"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Taumata Arowai GIS Platform"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = f"sqlite:///{DEFAULT_DB_PATH.as_posix()}"
    
    # Security
    SECRET_KEY: str = "taumata-arowai-gis-secret-key-2026-safe-production-sign"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ]
    
    # Paths
    ROOT_DIR: Path = PROJECT_ROOT
    PUBLIC_DATA_DIR: Path = get_public_data_dir()
    
    model_config = SettingsConfigDict(
        env_file=str(PROJECT_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
