from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.schemas.gis import AucklandSupplyZoneSchema, BufferTierSchema
from backend.app.repositories.zone_repository import zone_repository
from backend.app.services.spatial_service import resolve_buffer_tier

router = APIRouter(prefix="/zones", tags=["Drinking Water Supply Zones"])

@router.get("", response_model=List[AucklandSupplyZoneSchema])
def list_supply_zones(
    limit: int = Query(50, ge=1, le=100, description="Page limit"),
    offset: int = Query(0, ge=0, description="Offset index"),
    db: Session = Depends(get_db)
):
    """Retrieve all authoritative Auckland Drinking Water Supply Zones (AklDizzy)."""
    return zone_repository.get_all_zones(db, limit=limit, offset=offset)

@router.get("/{zone_id}", response_model=AucklandSupplyZoneSchema)
def get_supply_zone(
    zone_id: str,
    db: Session = Depends(get_db)
):
    """Retrieve detailed spatial supply zone by unique identifier (e.g. AKL-SZ-14)."""
    zone = zone_repository.get_zone_by_id(db, zone_id)
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Supply zone '{zone_id}' not found in Taumata Arowai register"
        )
    return zone

@router.get("/{zone_id}/buffers", response_model=List[BufferTierSchema])
def get_zone_buffers(
    zone_id: str,
    db: Session = Depends(get_db)
):
    """Retrieve concentric buffer protection tiers (50m, 100m, 200m, 500m, 1500m) for a zone."""
    zone = zone_repository.get_zone_by_id(db, zone_id)
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Supply zone '{zone_id}' not found"
        )
    tiers = [50.0, 100.0, 200.0, 500.0, 1500.0]
    return [resolve_buffer_tier(t) for t in tiers]
