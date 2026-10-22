import random
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.schemas.incident import (
    IncidentCreateRequest,
    IncidentUpdateRequest,
    IncidentResponse,
)
from backend.app.repositories.incident_repository import incident_repository

class IncidentService:
    def create_incident(self, db: Session, data: IncidentCreateRequest) -> IncidentResponse:
        current_year = datetime.now(timezone.utc).year
        rand_num = random.randint(1000, 9999)
        ref_id = f"NZ-DW-{current_year}-{rand_num}"

        incident = incident_repository.create_incident(db, ref_id, data)
        return self._to_response(incident)

    def get_incidents(
        self,
        db: Session,
        status: Optional[str] = None,
        zone_id: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[IncidentResponse]:
        incidents = incident_repository.get_incidents(db, status=status, zone_id=zone_id, limit=limit, offset=offset)
        return [self._to_response(inc) for inc in incidents]

    def get_incident(self, db: Session, incident_id: str) -> Optional[IncidentResponse]:
        inc = incident_repository.get_incident_by_id(db, incident_id)
        if not inc:
            return None
        return self._to_response(inc)

    def update_incident(self, db: Session, incident_id: str, updates: IncidentUpdateRequest) -> Optional[IncidentResponse]:
        inc = incident_repository.get_incident_by_id(db, incident_id)
        if not inc:
            return None
        
        update_dict = {}
        if updates.status is not None:
            update_dict["status"] = updates.status
        if updates.officerNotes is not None:
            update_dict["officer_notes"] = updates.officerNotes
        if updates.boilWaterAdvised is not None:
            update_dict["boil_water_advised"] = updates.boilWaterAdvised

        updated = incident_repository.update_incident(db, inc, update_dict)
        return self._to_response(updated)

    def generate_incidents_csv(self, db: Session) -> str:
        from backend.app.repositories.zone_repository import zone_repository
        incidents = incident_repository.get_incidents(db, limit=2000)

        headers = [
            'Incident ID',
            "Citizen's Residential Address",
            'Supply Zone ID',
            'Supply Zone Name',
            'Treatment Plant / Dam Associated',
            'Associated Treatment Plant',
            'Associated Source Dam',
            'Problem / Category',
            'Severity',
            'Incident Description',
            'Citizen Contact Name',
            'Citizen Contact Email',
            'Citizen Contact Phone',
            'Anonymous Submission',
            'Observed Date & Time',
            'Date Registered',
            'Investigation Status',
            'Boil Water Advised',
            'Officer Compliance Notes'
        ]

        def escape_cell(val) -> str:
            if val is None:
                return '""'
            s = str(val).strip().replace('"', '""')
            if s and s[0] in ('=', '+', '-', '@', '\t', '\r'):
                s = "'" + s
            return f'"{s}"'

        rows = []
        for inc in incidents:
            zone = zone_repository.get_zone_by_id(db, inc.supply_zone_id) if inc.supply_zone_id else None
            zone_name = zone.zoneName if zone else (inc.supply_scheme_name or "Kelston Supply Zone")
            zone_id = inc.supply_zone_id or (zone.zoneId if zone else "AKL-SZ-14")
            treatment_plant = "Huia Water Treatment Plant"
            source_dam = "Waitakere Ranges Native Catchment"
            if "Ardmore" in (inc.supply_scheme_name or ""):
                treatment_plant = "Ardmore Water Treatment Plant"
                source_dam = "Hunua Ranges (Mangatangi / Mangatawhiri)"
            infra_combined = f"{treatment_plant} / {source_dam}"

            rows.append([
                escape_cell(inc.id),
                escape_cell(inc.address),
                escape_cell(zone_id),
                escape_cell(zone_name),
                escape_cell(infra_combined),
                escape_cell(treatment_plant),
                escape_cell(source_dam),
                escape_cell(inc.category_label or inc.category),
                escape_cell(inc.severity.upper() if inc.severity else "STANDARD"),
                escape_cell(inc.description),
                escape_cell("Anonymous Citizen" if inc.is_anonymous else inc.reporter_name),
                escape_cell("N/A (Anonymous)" if inc.is_anonymous else (inc.reporter_email or "N/A")),
                escape_cell("N/A (Anonymous)" if inc.is_anonymous else (inc.reporter_phone or "Not provided")),
                escape_cell("Yes" if inc.is_anonymous else "No"),
                escape_cell(inc.observed_at),
                escape_cell(inc.created_at.isoformat() if inc.created_at else ""),
                escape_cell(inc.status),
                escape_cell("YES (Active Advisory)" if inc.boil_water_advised else "NO"),
                escape_cell(inc.officer_notes or "")
            ])

        return "\ufeff" + "\r\n".join([",".join(headers)] + [",".join(r) for r in rows])

    def _to_response(self, inc) -> IncidentResponse:
        coords = [inc.latitude, inc.longitude] if inc.latitude is not None and inc.longitude is not None else None
        return IncidentResponse(
            id=inc.id,
            category=inc.category,
            categoryLabel=inc.category_label,
            severity=inc.severity,
            address=inc.address,
            coordinates=coords,
            supplyZoneId=inc.supply_zone_id,
            supplySchemeName=inc.supply_scheme_name,
            description=inc.description,
            observedAt=inc.observed_at,
            waterSupplyType=inc.water_supply_type,
            boilWaterAdvised=inc.boil_water_advised,
            reporterName=inc.reporter_name,
            reporterEmail=inc.reporter_email,
            reporterPhone=inc.reporter_phone,
            isAnonymous=inc.is_anonymous,
            status=inc.status,
            createdAt=inc.created_at.isoformat() if inc.created_at else "",
            officerNotes=inc.officer_notes,
        )

incident_service = IncidentService()
