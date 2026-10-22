from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.db.models.scheme import WaterSupplyScheme
from backend.app.schemas.gis import WaterSupplySchemeSchema
from backend.app.repositories.network_repository import network_repository

router = APIRouter(prefix="/networks", tags=["Water Schemes & Networks"])

@router.get("", response_model=List[WaterSupplySchemeSchema])
def list_water_schemes(db: Session = Depends(get_db)):
    """List registered drinking water supply schemes in Auckland region."""
    schemes = db.query(WaterSupplyScheme).all()
    return [
        WaterSupplySchemeSchema(
            supplyId=s.supply_id,
            supplyName=s.supply_name,
            supplierName=s.supplier_name,
            region=s.region,
            complianceStatus=s.compliance_status,
            sourceWaterType=s.source_water_type,
            registeredPopulation=s.registered_population,
            primaryTreatmentPlant=s.primary_treatment_plant,
        )
        for s in schemes
    ]

@router.get("/{network_id}", response_model=WaterSupplySchemeSchema)
def get_water_scheme(network_id: str, db: Session = Depends(get_db)):
    """Retrieve drinking water scheme details by supply identifier."""
    scheme = network_repository.get_scheme_by_id(db, network_id)
    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Water supply scheme '{network_id}' not found"
        )
    return scheme
