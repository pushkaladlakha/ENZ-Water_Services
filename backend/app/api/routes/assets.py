import json
from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.schemas.gis import PipeAssetSchema, FittingAssetSchema
from backend.app.repositories.network_repository import network_repository
from backend.app.services.auth_service import get_current_user_optional
from backend.app.db.models.user import AppUser

router = APIRouter(prefix="/assets", tags=["Network Infrastructure Assets"])

@router.get("", response_model=List[Dict[str, Any]])
def list_network_assets(
    category: Optional[str] = Query(None, description="Asset category: reticulation_main, service_pipe, raw_dam, treatment_plant, service_reservoir, isolation_valve"),
    zone_id: Optional[str] = Query(None, description="Filter by parent water supply zone ID"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: Optional[AppUser] = Depends(get_current_user_optional)
):
    """
    Retrieve filterable network assets (dams, treatment plants, reservoirs, watermains, valves).
    Technical telemetry (CCTV condition score, invert depth, engineer notes) is filtered for public users.
    """
    is_staff = current_user and current_user.role in ["official", "admin"]
    assets = network_repository.get_assets(db, category=category, zone_id=zone_id, limit=limit, offset=offset)

    results = []
    for a in assets:
        geom = json.loads(a.geom_geojson) if a.geom_geojson else None
        item = {
            "compkey": a.compkey,
            "assetCategory": a.asset_category,
            "assetName": a.asset_name,
            "operationalStatus": a.operational_status,
            "nominalDiameterMm": a.nominal_diameter_mm,
            "material": a.material,
            "parentZoneId": a.parent_zone_id,
            "geometry": geom,
        }

        if a.storage_capacity_ml is not None:
            item["storageCapacityML"] = a.storage_capacity_ml
        if a.treatment_technology:
            item["treatmentTechnology"] = a.treatment_technology

        # Role-based telemetry redaction
        if is_staff:
            item["pressureClass"] = a.pressure_class
            item["installationYear"] = a.installation_year
            item["invertDepthM"] = a.invert_depth_m
            item["cctvConditionScore"] = a.cctv_condition_score
            item["lineLengthM"] = a.line_length_m
            item["engineerNotes"] = a.engineer_notes
        else:
            item["cctvConditionScore"] = None
            item["invertDepthM"] = None
            item["engineerNotes"] = None

        results.append(item)

    return results

@router.get("/{compkey}", response_model=Dict[str, Any])
def get_network_asset_by_compkey(
    compkey: int,
    db: Session = Depends(get_db),
    current_user: Optional[AppUser] = Depends(get_current_user_optional)
):
    """Retrieve detailed infrastructure asset by Watercare COMPKEY."""
    a = network_repository.get_asset_by_compkey(db, compkey)
    if not a:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset with COMPKEY {compkey} not found"
        )

    is_staff = current_user and current_user.role in ["official", "admin"]
    geom = json.loads(a.geom_geojson) if a.geom_geojson else None

    result = {
        "compkey": a.compkey,
        "assetCategory": a.asset_category,
        "assetName": a.asset_name,
        "operationalStatus": a.operational_status,
        "nominalDiameterMm": a.nominal_diameter_mm,
        "material": a.material,
        "parentZoneId": a.parent_zone_id,
        "geometry": geom,
        "storageCapacityML": a.storage_capacity_ml,
        "treatmentTechnology": a.treatment_technology,
    }

    if is_staff:
        result["pressureClass"] = a.pressure_class
        result["installationYear"] = a.installation_year
        result["invertDepthM"] = a.invert_depth_m
        result["cctvConditionScore"] = a.cctv_condition_score
        result["lineLengthM"] = a.line_length_m
        result["engineerNotes"] = a.engineer_notes

    return result
