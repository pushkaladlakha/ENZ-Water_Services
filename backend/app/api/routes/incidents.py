from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException, status, Response
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.schemas.incident import (
    IncidentCreateRequest,
    IncidentUpdateRequest,
    IncidentResponse,
)
from backend.app.services.incident_service import incident_service
from backend.app.services.auth_service import require_official_or_admin
from backend.app.db.models.user import AppUser

router = APIRouter(prefix="/incidents", tags=["Water Incident Complaints"])

@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def submit_incident_complaint(
    req: IncidentCreateRequest,
    db: Session = Depends(get_db)
):
    """
    Log a citizen drinking water contamination, quality, or network defect complaint.
    Automatically generates an official reference ID (e.g. NZ-DW-2026-XXXX).
    """
    return incident_service.create_incident(db, req)

@router.get("", response_model=List[IncidentResponse])
def list_incident_complaints(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status: Submitted, Under Investigation, Sampling Dispatched, Resolved"),
    zone_id: Optional[str] = Query(None, description="Filter by supply zone ID"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Retrieve registered incident complaints."""
    return incident_service.get_incidents(db, status=status_filter, zone_id=zone_id, limit=limit, offset=offset)

@router.get("/export")
def export_incidents_csv(
    db: Session = Depends(get_db),
    current_user: AppUser = Depends(require_official_or_admin)
):
    """
    Export registered incident reports to CSV format (Excel compatible).
    Restricted to Authorized Officials and Administrators under statutory data protection rules.
    Includes affected citizen residential addresses, supply zones,
    associated treatment plants/dams, problems, descriptions, and contact details.
    """
    csv_content = incident_service.generate_incidents_csv(db)
    timestamp = datetime.now().strftime("%Y-%m-%d")
    filename = f"taumata_arowai_incidents_{timestamp}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident_complaint(incident_id: str, db: Session = Depends(get_db)):
    """Retrieve an individual incident complaint by reference ID."""
    inc = incident_service.get_incident(db, incident_id)
    if not inc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident report '{incident_id}' not found"
        )
    return inc

@router.patch("/{incident_id}", response_model=IncidentResponse)
def update_incident_status(
    incident_id: str,
    updates: IncidentUpdateRequest,
    db: Session = Depends(get_db),
    current_user: AppUser = Depends(require_official_or_admin)
):
    """
    Update investigation status and compliance officer notes for a water incident.
    Restricted to Authorized Officials and Administrators.
    """
    updated = incident_service.update_incident(db, incident_id, updates)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident report '{incident_id}' not found"
        )
    return updated
