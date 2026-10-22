from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.schemas.address import AddressSearchResponse, ParcelFeatureSchema
from backend.app.schemas.water_supply import WaterSupplyResolutionResponse, WaterSupplyResolveRequest
from backend.app.services.address_service import address_service
from backend.app.services.water_supply_service import water_supply_service
from backend.app.services.auth_service import get_current_user_optional
from backend.app.db.models.user import AppUser
from typing import Optional

router = APIRouter(prefix="/addresses", tags=["Addresses & Parcels"])

@router.get("/search", response_model=AddressSearchResponse)
def search_addresses(
    q: str = Query(..., min_length=1, description="Address, street name, lot, or suburb query"),
    limit: int = Query(10, ge=1, le=50, description="Max search results")
):
    """Search registered LINZ cadastral parcels and street addresses."""
    return address_service.search_addresses(query=q, limit=limit)

@router.get("/{address_id}", response_model=ParcelFeatureSchema)
def get_address_by_id(address_id: str):
    """Retrieve full cadastral parcel feature by ID."""
    parcel = address_service.get_parcel(address_id)
    if not parcel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cadastral parcel '{address_id}' not found in registry"
        )
    return parcel

@router.get("/{address_id}/water-supply", response_model=WaterSupplyResolutionResponse)
def get_address_water_supply(
    address_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[AppUser] = Depends(get_current_user_optional)
):
    """Retrieve verified water supply zone and infrastructure lineage for a known address."""
    user_id = current_user.id if current_user else None
    req = WaterSupplyResolveRequest(address_id=address_id)
    resp = water_supply_service.resolve_water_supply(db, req, user_id=user_id)
    if resp.status == "UNMAPPED_OUTSIDE_RETICULATION" and not resp.supplyZone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Address '{address_id}' sits outside registered municipal water supplies"
        )
    return resp
