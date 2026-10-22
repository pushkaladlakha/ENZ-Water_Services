import json
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from backend.app.db.models.zone import WaterSupplyZone, ZoneDemographic
from backend.app.db.models.scheme import WaterSupplyScheme
from backend.app.schemas.gis import AucklandSupplyZoneSchema, WaterSupplySchemeSchema
from backend.app.services.spatial_service import (
    point_in_geojson_geometry,
    distance_to_geojson_geometry_m,
    haversine_distance_m
)

class ZoneRepository:
    def get_all_zones(self, db: Session, limit: int = 50, offset: int = 0) -> List[AucklandSupplyZoneSchema]:
        """Retrieve paginated Auckland drinking water supply zones."""
        query = db.query(WaterSupplyZone).offset(offset).limit(limit).all()
        results = []
        for z in query:
            poly = None
            if z.geom_geojson:
                try:
                    g = json.loads(z.geom_geojson)
                    # Convert to polygon points if available
                    if g.get("type") == "Polygon" and g.get("coordinates"):
                        poly = [[pt[1], pt[0]] for pt in g["coordinates"][0]]
                    elif g.get("type") == "MultiPolygon" and g.get("coordinates"):
                        poly = [[pt[1], pt[0]] for pt in g["coordinates"][0][0]]
                except Exception:
                    pass

            demo = z.demographics
            scheme_name = z.scheme.supply_name if z.scheme else "Watercare Municipal Supply"
            results.append(AucklandSupplyZoneSchema(
                zoneId=z.zone_id,
                zoneName=z.zone_name,
                supplyId=z.supply_id,
                supplyName=scheme_name,
                zonePopulation=z.zone_population,
                urbanRural=z.urban_rural,
                lat=z.supply_latitude,
                lng=z.supply_longitude,
                popRegist=demo.pop_registered if demo else z.zone_population,
                popLowDe=demo.pop_low_deprivation if demo else 0,
                popModDe=demo.pop_moderate_deprivation if demo else 0,
                popHighDe=demo.pop_high_deprivation if demo else 0,
                popMaori=demo.pop_maori if demo else 0,
                polygon=poly
            ))
        return results

    def get_zone_by_id(self, db: Session, zone_id: str) -> Optional[AucklandSupplyZoneSchema]:
        """Retrieve a specific zone by ID."""
        z = db.query(WaterSupplyZone).filter(WaterSupplyZone.zone_id == zone_id.strip()).first()
        if not z:
            return None
        
        poly = None
        if z.geom_geojson:
            try:
                g = json.loads(z.geom_geojson)
                if g.get("type") == "Polygon" and g.get("coordinates"):
                    poly = [[pt[1], pt[0]] for pt in g["coordinates"][0]]
                elif g.get("type") == "MultiPolygon" and g.get("coordinates"):
                    poly = [[pt[1], pt[0]] for pt in g["coordinates"][0][0]]
            except Exception:
                pass

        demo = z.demographics
        scheme_name = z.scheme.supply_name if z.scheme else "Watercare Municipal Supply"
        return AucklandSupplyZoneSchema(
            zoneId=z.zone_id,
            zoneName=z.zone_name,
            supplyId=z.supply_id,
            supplyName=scheme_name,
            zonePopulation=z.zone_population,
            urbanRural=z.urban_rural,
            lat=z.supply_latitude,
            lng=z.supply_longitude,
            popRegist=demo.pop_registered if demo else z.zone_population,
            popLowDe=demo.pop_low_deprivation if demo else 0,
            popModDe=demo.pop_moderate_deprivation if demo else 0,
            popHighDe=demo.pop_high_deprivation if demo else 0,
            popMaori=demo.pop_maori if demo else 0,
            polygon=poly
        )

    def find_zones_containing_point(self, db: Session, lat: float, lng: float) -> List[WaterSupplyZone]:
        """Find all zones whose polygon geometry contains the (lat, lng) point."""
        all_zones = db.query(WaterSupplyZone).all()
        containing = []
        for z in all_zones:
            if z.geom_geojson:
                try:
                    geom = json.loads(z.geom_geojson)
                    if point_in_geojson_geometry(lat, lng, geom):
                        containing.append(z)
                except Exception:
                    pass
        return containing

    def find_nearest_zone(self, db: Session, lat: float, lng: float) -> Tuple[Optional[WaterSupplyZone], float]:
        """Find the closest zone to a point and return (zone, distance_in_meters)."""
        all_zones = db.query(WaterSupplyZone).all()
        if not all_zones:
            return None, 999999.0

        closest = None
        min_dist = 99999999.0
        for z in all_zones:
            if z.geom_geojson:
                try:
                    geom = json.loads(z.geom_geojson)
                    dist = distance_to_geojson_geometry_m(lat, lng, geom)
                except Exception:
                    dist = haversine_distance_m(lat, lng, z.supply_latitude, z.supply_longitude)
            else:
                dist = haversine_distance_m(lat, lng, z.supply_latitude, z.supply_longitude)

            if dist < min_dist:
                min_dist = dist
                closest = z

        return closest, min_dist

zone_repository = ZoneRepository()
