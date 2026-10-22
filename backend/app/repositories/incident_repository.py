from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.db.models.incident import WaterIncident
from backend.app.schemas.incident import IncidentCreateRequest, IncidentResponse

class IncidentRepository:
    def create_incident(self, db: Session, ref_id: str, data: IncidentCreateRequest) -> WaterIncident:
        lat = data.coordinates[0] if data.coordinates and len(data.coordinates) >= 2 else None
        lng = data.coordinates[1] if data.coordinates and len(data.coordinates) >= 2 else None
        
        incident = WaterIncident(
            id=ref_id,
            category=data.category,
            category_label=data.categoryLabel or data.category.replace("_", " ").title(),
            severity=data.severity,
            address=data.address.strip(),
            latitude=lat,
            longitude=lng,
            supply_zone_id=data.supplyZoneId,
            supply_scheme_name=data.supplySchemeName,
            description=data.description.strip(),
            observed_at=data.observedAt or "",
            water_supply_type=data.waterSupplyType,
            boil_water_advised=data.boilWaterAdvised,
            reporter_name="Anonymous Citizen" if data.isAnonymous else data.reporterName.strip(),
            reporter_email="anonymous@taumataarowai.govt.nz" if data.isAnonymous else data.reporterEmail.strip(),
            reporter_phone=None if data.isAnonymous else data.reporterPhone,
            is_anonymous=data.isAnonymous,
            status="Submitted",
        )
        db.add(incident)
        db.commit()
        db.refresh(incident)
        return incident

    def get_incidents(
        self,
        db: Session,
        status: Optional[str] = None,
        zone_id: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[WaterIncident]:
        q = db.query(WaterIncident).order_by(WaterIncident.created_at.desc())
        if status:
            q = q.filter(WaterIncident.status == status.strip())
        if zone_id:
            q = q.filter(WaterIncident.supply_zone_id == zone_id.strip())
        return q.offset(offset).limit(limit).all()

    def get_incident_by_id(self, db: Session, incident_id: str) -> Optional[WaterIncident]:
        return db.query(WaterIncident).filter(WaterIncident.id == incident_id.strip()).first()

    def update_incident(self, db: Session, incident: WaterIncident, updates: dict) -> WaterIncident:
        for k, v in updates.items():
            if v is not None and hasattr(incident, k):
                setattr(incident, k, v)
        db.commit()
        db.refresh(incident)
        return incident

incident_repository = IncidentRepository()
