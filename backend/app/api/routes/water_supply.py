from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from backend.app.db.session import get_db
from backend.app.schemas.water_supply import WaterSupplyResolveRequest, WaterSupplyResolutionResponse
from backend.app.services.water_supply_service import water_supply_service
from backend.app.services.auth_service import get_current_user_optional
from backend.app.db.models.user import AppUser

router = APIRouter(prefix="/water-supply", tags=["Water Supply Resolution"])

@router.post("/resolve", response_model=WaterSupplyResolutionResponse)
def resolve_water_supply(
    req: WaterSupplyResolveRequest,
    db: Session = Depends(get_db),
    current_user: Optional[AppUser] = Depends(get_current_user_optional)
):
    """
    Resolve an address, cadastral parcel ID, or coordinate pair to its authoritative
    drinking water supply zone, supply scheme, operator, compliance grading,
    and infrastructure lineage (source dam, treatment plant, reservoir, mains).
    """
    user_id = current_user.id if current_user else None
    return water_supply_service.resolve_water_supply(db, req, user_id=user_id)
