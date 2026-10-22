import json
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.db.models.scheme import WaterSupplyScheme
from backend.app.db.models.asset import WaterNetworkAsset
from backend.app.schemas.gis import WaterSupplySchemeSchema, PipeAssetSchema, FittingAssetSchema

class NetworkRepository:
    def get_scheme_by_id(self, db: Session, supply_id: str) -> Optional[WaterSupplySchemeSchema]:
        s = db.query(WaterSupplyScheme).filter(WaterSupplyScheme.supply_id == supply_id.strip()).first()
        if not s:
            return None
        return WaterSupplySchemeSchema(
            supplyId=s.supply_id,
            supplyName=s.supply_name,
            supplierName=s.supplier_name,
            region=s.region,
            complianceStatus=s.compliance_status,
            sourceWaterType=s.source_water_type,
            registeredPopulation=s.registered_population,
            primaryTreatmentPlant=s.primary_treatment_plant,
        )

    def get_assets(
        self,
        db: Session,
        category: Optional[str] = None,
        zone_id: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[WaterNetworkAsset]:
        q = db.query(WaterNetworkAsset)
        if category:
            q = q.filter(WaterNetworkAsset.asset_category == category.strip())
        if zone_id:
            q = q.filter(WaterNetworkAsset.parent_zone_id == zone_id.strip())
        return q.offset(offset).limit(limit).all()

    def get_asset_by_compkey(self, db: Session, compkey: int) -> Optional[WaterNetworkAsset]:
        return db.query(WaterNetworkAsset).filter(WaterNetworkAsset.compkey == compkey).first()

network_repository = NetworkRepository()
