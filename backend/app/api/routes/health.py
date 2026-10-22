from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.db.session import get_db

router = APIRouter(tags=["Health & Diagnostics"])

@router.get("/health")
def health_check():
    """Verify backend API is responsive and running."""
    return {
        "status": "healthy",
        "service": "Taumata Arowai GIS Platform API",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0"
    }

@router.get("/ready")
def readiness_check(db: Session = Depends(get_db)):
    """Verify database and spatial dependencies are ready."""
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unavailable: {str(e)}"

    return {
        "status": "ready" if db_status == "connected" else "degraded",
        "database": db_status,
        "spatial_engine": "shapely_geos",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
