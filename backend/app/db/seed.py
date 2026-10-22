import json
import logging
from pathlib import Path
from sqlalchemy.orm import Session
from backend.app.db.session import engine, Base, SessionLocal
from backend.app.db.models import (
    AppUser,
    WaterSupplyScheme,
    WaterSupplyZone,
    ZoneDemographic,
    SupplyZoneBuffer,
    WaterNetworkAsset,
    WaterIncident
)
from backend.app.core.security import hash_password
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

SCHEME_DEFINITIONS = [
    {
        "supply_id": "SUP-AKL-WEST-01",
        "supply_name": "Huia / Waitakere Western Water Supply Scheme",
        "supplier_name": "Watercare Services Limited",
        "region": "Auckland Region",
        "compliance_status": "Compliant",
        "source_water_type": "Waitakere Native Catchment Dams",
        "registered_population": 104350,
        "primary_treatment_plant": "Huia Water Treatment Plant",
    },
    {
        "supply_id": "SUP-AKL-WEST-02",
        "supply_name": "Waitakere Northern Scheme",
        "supplier_name": "Watercare Services Limited",
        "region": "Auckland Region",
        "compliance_status": "Compliant",
        "source_water_type": "Waitakere Dam & Swanson River Catchment",
        "registered_population": 62400,
        "primary_treatment_plant": "Waitakere Water Treatment Plant",
    },
    {
        "supply_id": "SUP-AKL-CENTRAL-01",
        "supply_name": "Central Isthmus Bulk Supply Scheme",
        "supplier_name": "Watercare Services Limited",
        "region": "Auckland Region",
        "compliance_status": "Compliant",
        "source_water_type": "Hunua Ranges Dams & Waitakere Shared Supply",
        "registered_population": 111300,
        "primary_treatment_plant": "Ardmore Water Treatment Plant & Huia WTP",
    },
    {
        "supply_id": "SUP-AKL-NORTH-01",
        "supply_name": "North Shore Southern Supply Scheme",
        "supplier_name": "Watercare Services Limited",
        "region": "Auckland Region",
        "compliance_status": "Compliant",
        "source_water_type": "Hunua Ranges & Waikato River Pipeline",
        "registered_population": 59300,
        "primary_treatment_plant": "Ardmore WTP & Waikato WTP",
    },
    {
        "supply_id": "SUP-AKL-NORTH-02",
        "supply_name": "North Shore Northern Scheme",
        "supplier_name": "Watercare Services Limited",
        "region": "Auckland Region",
        "compliance_status": "Compliant",
        "source_water_type": "Waikato River & Hunua Regional Reservoirs",
        "registered_population": 68100,
        "primary_treatment_plant": "Waikato Water Treatment Plant (Tuakau)",
    },
    {
        "supply_id": "SUP-AKL-SOUTH-01",
        "supply_name": "Southern Auckland Scheme",
        "supplier_name": "Watercare Services Limited",
        "region": "Auckland Region",
        "compliance_status": "Compliant",
        "source_water_type": "Mangatangi & Mangatawhiri Dams (Hunua Ranges)",
        "registered_population": 81200,
        "primary_treatment_plant": "Ardmore Water Treatment Plant",
    },
    {
        "supply_id": "SUP-AKL-SOUTH-02",
        "supply_name": "Hunua Foothills Scheme",
        "supplier_name": "Watercare Services Limited",
        "region": "Auckland Region",
        "compliance_status": "Compliant",
        "source_water_type": "Hays Creek Dam & Cosseys Dam",
        "registered_population": 43500,
        "primary_treatment_plant": "Ardmore Water Treatment Plant",
    },
    {
        "supply_id": "SUP-AKL-RURAL-01",
        "supply_name": "North West Rural Water Scheme",
        "supplier_name": "Watercare Services Limited",
        "region": "Auckland Region",
        "compliance_status": "Compliant",
        "source_water_type": "Kaipara Deep Aquifer Borefield & Spring Source",
        "registered_population": 6900,
        "primary_treatment_plant": "Helensville Water Treatment Plant",
    },
]

ZONE_TO_SCHEME_MAP = {
    "AKL-SZ-14": "SUP-AKL-WEST-01",
    "AKL-SZ-15": "SUP-AKL-WEST-01",
    "AKL-SZ-08": "SUP-AKL-WEST-02",
    "AKL-SZ-01": "SUP-AKL-CENTRAL-01",
    "AKL-SZ-02": "SUP-AKL-CENTRAL-01",
    "AKL-SZ-20": "SUP-AKL-NORTH-01",
    "AKL-SZ-24": "SUP-AKL-NORTH-02",
    "AKL-SZ-35": "SUP-AKL-SOUTH-01",
    "AKL-SZ-38": "SUP-AKL-SOUTH-02",
    "AKL-SZ-42": "SUP-AKL-RURAL-01",
}

KEY_ASSETS = [
    # Treatment Plants
    {
        "compkey": 100101,
        "asset_category": "treatment_plant",
        "asset_name": "Huia Water Treatment Plant",
        "operational_status": "Operational - in use",
        "treatment_technology": "Dissolved Air Flotation (DAF), Rapid Gravity Sand Filtration & Disinfection",
        "parent_zone_id": "AKL-SZ-14",
        "geom_geojson": json.dumps({"type": "Point", "coordinates": [174.6430, -36.9320]}),
    },
    {
        "compkey": 100102,
        "asset_category": "treatment_plant",
        "asset_name": "Ardmore Water Treatment Plant",
        "operational_status": "Operational - in use",
        "treatment_technology": "Coagulation, Clarification, Dual Media Sand Filtration & Disinfection",
        "parent_zone_id": "AKL-SZ-35",
        "geom_geojson": json.dumps({"type": "Point", "coordinates": [175.0210, -37.0420]}),
    },
    {
        "compkey": 100103,
        "asset_category": "treatment_plant",
        "asset_name": "Waitakere Water Treatment Plant",
        "operational_status": "Operational - in use",
        "treatment_technology": "Direct Filtration & UV Disinfection",
        "parent_zone_id": "AKL-SZ-08",
        "geom_geojson": json.dumps({"type": "Point", "coordinates": [174.5820, -36.8830]}),
    },
    {
        "compkey": 100104,
        "asset_category": "treatment_plant",
        "asset_name": "Waikato Water Treatment Plant (Tuakau)",
        "operational_status": "Operational - in use",
        "treatment_technology": "Advanced Membrane Filtration & Granular Carbon",
        "parent_zone_id": "AKL-SZ-24",
        "geom_geojson": json.dumps({"type": "Point", "coordinates": [174.9520, -37.2750]}),
    },
    {
        "compkey": 100105,
        "asset_category": "treatment_plant",
        "asset_name": "Helensville Water Treatment Plant",
        "operational_status": "Operational - in use",
        "treatment_technology": "Aeration, Green Sand Manganese Filtration & Disinfection",
        "parent_zone_id": "AKL-SZ-42",
        "geom_geojson": json.dumps({"type": "Point", "coordinates": [174.4550, -36.6850]}),
    },
    # Dams
    {
        "compkey": 200101,
        "asset_category": "raw_dam",
        "asset_name": "Waitakere Dam & Lower Nihotupu Dam",
        "operational_status": "Operational - in use",
        "storage_capacity_ml": 29800.0,
        "parent_zone_id": "AKL-SZ-14",
        "geom_geojson": json.dumps({"type": "Point", "coordinates": [174.5380, -36.9050]}),
    },
    {
        "compkey": 200102,
        "asset_category": "raw_dam",
        "asset_name": "Upper Nihotupu Dam & Lower Huia Dam",
        "operational_status": "Operational - in use",
        "storage_capacity_ml": 22500.0,
        "parent_zone_id": "AKL-SZ-15",
        "geom_geojson": json.dumps({"type": "Point", "coordinates": [174.5620, -36.9420]}),
    },
    {
        "compkey": 200103,
        "asset_category": "raw_dam",
        "asset_name": "Cosseys Dam & Upper Mangatangi Dam",
        "operational_status": "Operational - in use",
        "storage_capacity_ml": 52000.0,
        "parent_zone_id": "AKL-SZ-01",
        "geom_geojson": json.dumps({"type": "Point", "coordinates": [175.1200, -37.0850]}),
    },
    # Reservoirs
    {
        "compkey": 300101,
        "asset_category": "service_reservoir",
        "asset_name": "Titirangi High-Level Water Reservoir",
        "operational_status": "Operational - in use",
        "storage_capacity_ml": 45.0,
        "parent_zone_id": "AKL-SZ-14",
        "geom_geojson": json.dumps({"type": "Point", "coordinates": [174.6580, -36.9380]}),
    },
    {
        "compkey": 300102,
        "asset_category": "service_reservoir",
        "asset_name": "New Lynn Distribution Balancing Reservoir",
        "operational_status": "Operational - in use",
        "storage_capacity_ml": 32.0,
        "parent_zone_id": "AKL-SZ-15",
        "geom_geojson": json.dumps({"type": "Point", "coordinates": [174.6890, -36.9120]}),
    },
    {
        "compkey": 300103,
        "asset_category": "service_reservoir",
        "asset_name": "Khyber Pass Water Reservoir (Grafton)",
        "operational_status": "Operational - in use",
        "storage_capacity_ml": 40.0,
        "parent_zone_id": "AKL-SZ-01",
        "geom_geojson": json.dumps({"type": "Point", "coordinates": [174.7680, -36.8640]}),
    },
    # Verified Street Mains & Pipes
    {
        "compkey": 2017820,
        "asset_category": "reticulation_main",
        "asset_name": "Great North Road Reticulation Main",
        "operational_status": "Operational - in use",
        "nominal_diameter_mm": 150,
        "material": "Ductile Iron",
        "pressure_class": "PN16",
        "installation_year": 1988,
        "invert_depth_m": 1.25,
        "cctv_condition_score": 2,
        "line_length_m": 142.5,
        "parent_zone_id": "AKL-SZ-14",
        "engineer_notes": "Cathodic protection inspected 2024. Normal structural condition.",
        "geom_geojson": json.dumps({
            "type": "LineString",
            "coordinates": [[174.6791, -36.9108], [174.6806, -36.9094], [174.6818, -36.9082]]
        }),
    },
    {
        "compkey": 2017826,
        "asset_category": "service_pipe",
        "asset_name": "4015 Great North Rd Service Connection",
        "operational_status": "Operational - in use",
        "nominal_diameter_mm": 20,
        "material": "Polyethylene PE100",
        "pressure_class": "PN12",
        "installation_year": 2004,
        "invert_depth_m": 0.65,
        "cctv_condition_score": 1,
        "line_length_m": 12.8,
        "parent_zone_id": "AKL-SZ-14",
        "engineer_notes": "Standard residential Toby pit meter connection.",
        "geom_geojson": json.dumps({
            "type": "LineString",
            "coordinates": [[174.6806, -36.9094], [174.6807, -36.9095]]
        }),
    },
    {
        "compkey": 2017850,
        "asset_category": "reticulation_main",
        "asset_name": "Brandon Road Reticulation Main",
        "operational_status": "Operational - in use",
        "nominal_diameter_mm": 100,
        "material": "UPVC",
        "pressure_class": "Class C",
        "installation_year": 1995,
        "invert_depth_m": 1.10,
        "cctv_condition_score": 2,
        "line_length_m": 88.0,
        "parent_zone_id": "AKL-SZ-14",
        "geom_geojson": json.dumps({
            "type": "LineString",
            "coordinates": [[174.6780, -36.9115], [174.6795, -36.9128]]
        }),
    },
    # Valves
    {
        "compkey": 2017899,
        "asset_category": "isolation_valve",
        "asset_name": "VLV-10029 Sluice Gate Valve",
        "operational_status": "Operational - in use",
        "nominal_diameter_mm": 150,
        "parent_zone_id": "AKL-SZ-14",
        "geom_geojson": json.dumps({"type": "Point", "coordinates": [174.6805, -36.9096]}),
    },
]

def seed_database(db: Session) -> None:
    """Initialize database and seed baseline data idempotently."""
    Base.metadata.create_all(bind=engine)
    
    # 1. Seed Users
    seed_users(db)

    # 2. Seed Supply Schemes
    seed_schemes(db)

    # 3. Seed Water Supply Zones & Demographics
    seed_zones(db)

    # 4. Seed Physical Infrastructure Assets
    seed_assets(db)

    # 5. Seed Initial Complaints
    seed_incidents(db)

    db.commit()

def seed_users(db: Session) -> None:
    users = [
        {
            "id": "usr-official-01",
            "email": "official@taumataarowai.govt.nz",
            "password_hash": hash_password("OfficialWater#2026"),
            "full_name": "David Te Whata",
            "role": "official",
            "job_title": "Water Services Compliance Officer",
            "organization": "Taumata Arowai - Regulatory Operations",
        },
        {
            "id": "usr-admin-01",
            "email": "admin@taumataarowai.govt.nz",
            "password_hash": hash_password("ArowaiAdmin#2026"),
            "full_name": "Sarah MacLeod",
            "role": "admin",
            "job_title": "GIS Systems Administrator",
            "organization": "Taumata Arowai - National GIS Office",
        },
        {
            "id": "usr-citizen-01",
            "email": "citizen@nzwater.org.nz",
            "password_hash": hash_password("CitizenNZ#2026"),
            "full_name": "Auckland Resident",
            "role": "citizen",
            "job_title": "Registered Property Owner",
            "organization": "Public Resident",
        },
    ]
    for u in users:
        existing = db.query(AppUser).filter(AppUser.email == u["email"]).first()
        if not existing:
            db.add(AppUser(**u))

def seed_schemes(db: Session) -> None:
    for s in SCHEME_DEFINITIONS:
        existing = db.query(WaterSupplyScheme).filter(WaterSupplyScheme.supply_id == s["supply_id"]).first()
        if not existing:
            db.add(WaterSupplyScheme(**s))

def seed_zones(db: Session) -> None:
    geojson_candidates = [
        settings.PUBLIC_DATA_DIR / "akldizzy_zones.geojson",
        settings.PUBLIC_DATA_DIR / "auckland_supply_zones.geojson",
        settings.ROOT_DIR / "frontend" / "public" / "data" / "akldizzy_zones.geojson",
        settings.ROOT_DIR / "frontend" / "public" / "dataakldizzy_zones.geojson",
        settings.ROOT_DIR / "public" / "dataakldizzy_zones.geojson",
    ]
    geojson_path = None
    for p in geojson_candidates:
        if p.exists():
            geojson_path = p
            break
    
    if geojson_path and geojson_path.exists():
        try:
            with open(geojson_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            features = data.get("features", [])
            for idx, feat in enumerate(features):
                props = feat.get("properties", {})
                zone_name = str(props.get("zone", f"Zone {idx + 1}")).strip()
                zone_id = f"AKL-SZ-{idx + 1:02d}"
                
                # Check for known ID in map or match by name
                supply_id = ZONE_TO_SCHEME_MAP.get(zone_id, "SUP-AKL-WEST-01")
                
                # Calculate centroid
                geom = feat.get("geometry", {})
                coords = geom.get("coordinates", [])
                
                # Extract lat/lng
                lat, lng = -36.9125, 174.6780
                try:
                    all_points = []
                    def extract_pts(c):
                        if isinstance(c, list) and len(c) == 2 and isinstance(c[0], (int, float)):
                            all_points.append(c)
                        elif isinstance(c, list):
                            for sub in c:
                                extract_pts(sub)
                    extract_pts(coords)
                    if all_points:
                        lng = sum(p[0] for p in all_points) / len(all_points)
                        lat = sum(p[1] for p in all_points) / len(all_points)
                except Exception:
                    pass

                pop_reg = int(float(props.get("pop_regist") or 0))
                pop_low = int(float(props.get("pop_low_de") or 0))
                pop_mod = int(float(props.get("pop_mod_de") or 0))
                pop_high = int(float(props.get("pop_high_d") or 0))
                try:
                    pop_m = int(str(props.get("pop_maori") or "0").strip())
                except Exception:
                    pop_m = 0

                existing_zone = db.query(WaterSupplyZone).filter(WaterSupplyZone.zone_id == zone_id).first()
                if not existing_zone:
                    zone = WaterSupplyZone(
                        zone_id=zone_id,
                        zone_name=f"{zone_name} Supply Zone",
                        supply_id=supply_id,
                        urban_rural="Rural" if "Rural" in zone_name or "Kaipara" in zone_name else "Urban",
                        zone_population=pop_reg,
                        supply_latitude=lat,
                        supply_longitude=lng,
                        geom_geojson=json.dumps(geom)
                    )
                    db.add(zone)
                    
                    # Demographics
                    demo = ZoneDemographic(
                        zone_id=zone_id,
                        pop_registered=pop_reg,
                        pop_low_deprivation=pop_low,
                        pop_moderate_deprivation=pop_mod,
                        pop_high_deprivation=pop_high,
                        pop_maori=pop_m,
                    )
                    db.add(demo)
        except Exception as e:
            logger.error("Error reading akldizzy_zones.geojson: %s", e)

def seed_assets(db: Session) -> None:
    for a in KEY_ASSETS:
        existing = db.query(WaterNetworkAsset).filter(WaterNetworkAsset.compkey == a["compkey"]).first()
        if not existing:
            db.add(WaterNetworkAsset(**a))

def seed_incidents(db: Session) -> None:
    existing = db.query(WaterIncident).first()
    if not existing:
        sample_incident = WaterIncident(
            id="NZ-DW-2026-1042",
            category="contamination_discoloration",
            category_label="Water Discoloration / Turbidity",
            severity="high",
            address="4015 Great North Road, Kelston, Auckland",
            latitude=-36.9094,
            longitude=174.6806,
            supply_zone_id="AKL-SZ-14",
            supply_scheme_name="Huia / Waitakere Western Water Supply Scheme",
            description="Noticeable orange/brown sediment in cold tap water following watermain maintenance.",
            observed_at="2026-10-12T08:30",
            water_supply_type="Municipal Watercare Reticulation",
            boil_water_advised=True,
            reporter_name="Kelston Resident",
            reporter_email="kelston.resident@nzwater.org.nz",
            reporter_phone="021 555 0192",
            is_anonymous=False,
            status="Under Investigation",
            officer_notes="Watercare field crew dispatched to flush hydrant VLV-10029."
        )
        db.add(sample_incident)

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_database(db)
        print("Database seeded successfully.")
    finally:
        db.close()
